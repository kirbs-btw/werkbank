import { describe, it, expect } from 'vitest';
import {
  parseDxf,
  writeDxf,
  parseSvg,
  writeSvg,
  detectFormat,
  convert,
  bulgeToArc,
  boundsOf,
  entityPoints,
  entityStats,
  parseSvgLength,
  arcToPoints,
  ConvertError,
  type Drawing,
  type Pt,
} from '../src/lib/dxfsvg';

const dxf = (body: string) => `0\nSECTION\n2\nENTITIES\n${body}0\nENDSEC\n0\nEOF\n`;
const svg = (body: string, attr = 'width="100mm" height="100mm" viewBox="0 0 100 100"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${attr}>${body}</svg>`;

const LINE = '0\nLINE\n8\nSchnitt\n10\n0\n20\n0\n30\n0\n11\n10\n21\n5\n31\n0\n';
const CIRCLE = '0\nCIRCLE\n8\nBohrungen\n10\n50\n20\n50\n40\n8\n';
const ARC90 = '0\nARC\n8\n0\n10\n0\n20\n0\n40\n10\n50\n0\n51\n90\n';

/** Alle Punkte einer Zeichnung, auf den Ursprung normiert (Round-Trips verschieben die Lage). */
function normPoints(d: Drawing): Pt[] {
  const b = d.bounds;
  return d.entities.flatMap(entityPoints).map((p) => ({ x: p.x - b.minX, y: p.y - b.minY }));
}
const hasPoint = (pts: Pt[], x: number, y: number, tol = 0.08) =>
  pts.some((p) => Math.abs(p.x - x) < tol && Math.abs(p.y - y) < tol);
const size = (d: Drawing) => ({
  w: d.bounds.maxX - d.bounds.minX,
  h: d.bounds.maxY - d.bounds.minY,
});

describe('bulgeToArc', () => {
  it('macht aus Bulge 1 einen Halbkreis', () => {
    const a = bulgeToArc({ x: 0, y: 0 }, { x: 10, y: 0 }, 1)!;
    expect(a.c.x).toBeCloseTo(5, 9);
    expect(a.c.y).toBeCloseTo(0, 9);
    expect(a.r).toBeCloseTo(5, 9);
  });

  it('trifft bei 90° Bogen Mittelpunkt und Radius', () => {
    const b = Math.tan(Math.PI / 8); // θ = 90°
    const a = bulgeToArc({ x: 0, y: 0 }, { x: 10, y: 0 }, b)!;
    expect(a.c.x).toBeCloseTo(5, 6);
    expect(a.c.y).toBeCloseTo(5, 6);
    expect(a.r).toBeCloseTo(Math.hypot(5, 5), 6);
  });

  it('liefert für gerade Segmente null', () => {
    expect(bulgeToArc({ x: 0, y: 0 }, { x: 10, y: 0 }, 0)).toBeNull();
    expect(bulgeToArc({ x: 0, y: 0 }, { x: 0, y: 0 }, 1)).toBeNull();
  });
});

describe('DXF lesen', () => {
  it('liest LINE, CIRCLE und ARC mit Layern', () => {
    const d = parseDxf(dxf(LINE + CIRCLE + ARC90));
    expect(entityStats(d)).toEqual({ polyline: 1, circle: 1, arc: 1 });
    expect(d.entities[0].layer).toBe('Schnitt');
    expect(d.entities[1]).toMatchObject({ kind: 'circle', c: { x: 50, y: 50 }, r: 8 });
    expect(d.entities[2]).toMatchObject({ kind: 'arc', r: 10, a1: 0, a2: 90 });
  });

  it('liest LWPOLYLINE inklusive geschlossenem Flag', () => {
    const body =
      '0\nLWPOLYLINE\n8\n0\n90\n3\n70\n1\n10\n0\n20\n0\n10\n10\n20\n0\n10\n10\n20\n10\n';
    const d = parseDxf(dxf(body));
    expect(d.entities).toHaveLength(1);
    expect(d.entities[0]).toMatchObject({ kind: 'polyline', closed: true });
    expect((d.entities[0] as { points: Pt[] }).points).toHaveLength(3);
  });

  it('löst Bulge-Segmente einer LWPOLYLINE in echte Bögen auf', () => {
    const body = '0\nLWPOLYLINE\n8\n0\n90\n2\n70\n0\n10\n0\n20\n0\n42\n1\n10\n10\n20\n0\n';
    const d = parseDxf(dxf(body));
    const arcs = d.entities.filter((e) => e.kind === 'arc');
    expect(arcs).toHaveLength(1);
    expect(arcs[0]).toMatchObject({ r: 5 });
  });

  it('liest die alte POLYLINE/VERTEX-Form', () => {
    const body =
      '0\nPOLYLINE\n8\nKontur\n66\n1\n70\n1\n' +
      '0\nVERTEX\n8\nKontur\n10\n0\n20\n0\n' +
      '0\nVERTEX\n8\nKontur\n10\n20\n20\n0\n' +
      '0\nVERTEX\n8\nKontur\n10\n20\n20\n10\n' +
      '0\nSEQEND\n8\nKontur\n';
    const d = parseDxf(dxf(body));
    expect(d.entities).toHaveLength(1);
    expect(d.entities[0]).toMatchObject({ kind: 'polyline', layer: 'Kontur', closed: true });
    expect((d.entities[0] as { points: Pt[] }).points).toHaveLength(3);
  });

  it('zählt nicht unterstützte Elemente, statt zu scheitern', () => {
    const d = parseDxf(dxf(LINE + '0\nSPLINE\n8\n0\n10\n1\n20\n1\n' + '0\nTEXT\n8\n0\n1\nHallo\n'));
    expect(d.skipped).toEqual({ SPLINE: 1, TEXT: 1 });
    expect(d.entities).toHaveLength(1);
  });

  it('meldet Dateien ohne verwertbare Geometrie', () => {
    expect(() => parseDxf(dxf(''))).toThrow(ConvertError);
    expect(() => parseDxf('kein dxf')).toThrow(ConvertError);
  });

  it('berechnet die Ausdehnung korrekt', () => {
    const d = parseDxf(dxf(CIRCLE));
    expect(d.bounds).toEqual({ minX: 42, minY: 42, maxX: 58, maxY: 58 });
  });
});

describe('DXF schreiben', () => {
  it('erzeugt gültiges R12 mit Kopf, Layern und Entitäten', () => {
    const out = writeDxf(parseDxf(dxf(LINE + CIRCLE)));
    expect(out).toContain('AC1009');
    expect(out).toContain('$EXTMIN');
    expect(out).toContain('2\nLAYER');
    expect(out).toContain('0\nLINE');
    expect(out).toContain('0\nCIRCLE');
    expect(out.trimEnd().endsWith('EOF')).toBe(true);
  });

  it('schreibt mehrpunktige Konturen als POLYLINE mit VERTEX und SEQEND', () => {
    const body = '0\nLWPOLYLINE\n8\n0\n90\n3\n70\n1\n10\n0\n20\n0\n10\n10\n20\n0\n10\n10\n20\n10\n';
    const out = writeDxf(parseDxf(dxf(body)));
    expect(out).toContain('0\nPOLYLINE');
    expect((out.match(/0\nVERTEX/g) ?? []).length).toBe(3);
    expect(out).toContain('0\nSEQEND');
  });

  it('DXF → DXF erhält die Geometrie', () => {
    const a = parseDxf(dxf(LINE + CIRCLE + ARC90));
    const b = parseDxf(writeDxf(a));
    expect(entityStats(b)).toEqual(entityStats(a));
    expect(b.bounds.minX).toBeCloseTo(a.bounds.minX, 4);
    expect(b.bounds.maxY).toBeCloseTo(a.bounds.maxY, 4);
  });
});

describe('SVG schreiben', () => {
  it('schreibt Millimeter-Maße und passenden viewBox', () => {
    const out = writeSvg(parseDxf(dxf(CIRCLE)), { margin: 2 });
    expect(out).toContain('width="20mm"');
    expect(out).toContain('height="20mm"');
    expect(out).toContain('viewBox="0 0 20 20"');
    expect(out).toContain('<circle');
    expect(out).toContain('fill="none"');
  });

  it('spiegelt y, sodass die Zeichnung richtig herum steht', () => {
    // Linie von (0,0) nach (10,5): im SVG muss der Endpunkt WEITER OBEN liegen (kleineres y)
    const out = writeSvg(parseDxf(dxf(LINE)), { margin: 0 });
    const pts = out.match(/points="([^"]+)"/)![1].split(' ').map((s) => s.split(',').map(Number));
    expect(pts[0][1]).toBeGreaterThan(pts[1][1]);
  });

  it('gibt Vollkreis-Bögen als circle aus', () => {
    const full = '0\nARC\n8\n0\n10\n0\n20\n0\n40\n5\n50\n0\n51\n360\n';
    expect(writeSvg(parseDxf(dxf(full)))).toContain('<circle');
  });
});

describe('SVG lesen', () => {
  it('liest Grundformen', () => {
    const d = parseSvg(
      svg('<line x1="0" y1="0" x2="10" y2="0"/><rect x="0" y="0" width="20" height="30"/><circle cx="50" cy="50" r="5"/>'),
    );
    expect(entityStats(d)).toEqual({ polyline: 2, circle: 1 });
  });

  it('rechnet viewBox und Millimeterbreite in echte Millimeter um', () => {
    // 200 mm breit bei 100 Einheiten viewBox → Faktor 2
    const d = parseSvg(
      svg('<rect x="0" y="0" width="10" height="10"/>', 'width="200mm" height="200mm" viewBox="0 0 100 100"'),
    );
    expect(size(d).w).toBeCloseTo(20, 4);
    expect(size(d).h).toBeCloseTo(20, 4);
  });

  it('behandelt fehlende Größenangaben als 1 Einheit = 1 mm', () => {
    const d = parseSvg(svg('<rect x="0" y="0" width="10" height="10"/>', 'viewBox="0 0 100 100"'));
    expect(size(d).w).toBeCloseTo(10, 6);
  });

  it('wendet Transformationen aus Gruppen an', () => {
    const d = parseSvg(svg('<g transform="scale(2)"><rect x="0" y="0" width="10" height="10"/></g>'));
    expect(size(d).w).toBeCloseTo(20, 6);
  });

  it('verkettet verschachtelte Transformationen', () => {
    const d = parseSvg(
      svg('<g transform="translate(10,10)"><g transform="scale(3)"><rect x="0" y="0" width="5" height="5"/></g></g>'),
    );
    expect(size(d).w).toBeCloseTo(15, 6);
    expect(d.bounds.minX).toBeCloseTo(10, 6);
  });

  it('dreht korrekt (Länge bleibt erhalten)', () => {
    const d = parseSvg(svg('<g transform="rotate(90)"><line x1="0" y1="0" x2="10" y2="0"/></g>'));
    const s = size(d);
    expect(Math.max(s.w, s.h)).toBeCloseTo(10, 6);
    expect(Math.min(s.w, s.h)).toBeCloseTo(0, 6);
  });

  it('ignoriert defs, versteckte Elemente und Text', () => {
    const d = parseSvg(
      svg('<defs><rect x="0" y="0" width="99" height="99"/></defs><line x1="0" y1="0" x2="10" y2="0"/><rect display="none" x="0" y="0" width="50" height="50"/><text x="1" y="1">Hi</text>'),
    );
    expect(d.entities).toHaveLength(1);
    expect(size(d).w).toBeCloseTo(10, 6);
    expect(d.skipped.text).toBe(1);
  });

  it('liest Pfade mit Linien und Z als geschlossene Kontur', () => {
    const d = parseSvg(svg('<path d="M 0 0 L 10 0 L 10 10 Z"/>'));
    expect(d.entities).toHaveLength(1);
    expect(d.entities[0]).toMatchObject({ kind: 'polyline', closed: true });
  });

  it('löst Bézierkurven in Polylinien auf', () => {
    const d = parseSvg(svg('<path d="M 0 0 C 0 10 10 10 10 0"/>'));
    const pts = (d.entities[0] as { points: Pt[] }).points;
    expect(pts.length).toBeGreaterThan(10);
    expect(size(d).w).toBeCloseTo(10, 4);
    expect(size(d).h).toBeGreaterThan(6); // Kurve wölbt sich
  });

  it('versteht relative Pfadbefehle und H/V', () => {
    const d = parseSvg(svg('<path d="M 5 5 h 10 v 10 h -10 z"/>'));
    expect(size(d).w).toBeCloseTo(10, 6);
    expect(size(d).h).toBeCloseTo(10, 6);
  });

  it('meldet Dateien ohne Geometrie', () => {
    expect(() => parseSvg(svg('<text x="0" y="0">nur Text</text>'))).toThrow(ConvertError);
    expect(() => parseSvg('kein svg')).toThrow(ConvertError);
  });
});

describe('arcToPoints (SVG-Bogen nach Spezifikation)', () => {
  it('trifft Start, Mitte und Ende eines Viertelkreises', () => {
    // Von (10,0) nach (0,10), r=10, sweep=1 → steigender Winkel um den Mittelpunkt (0,0)
    const pts = arcToPoints({ x: 10, y: 0 }, 10, 10, 0, false, true, { x: 0, y: 10 });
    expect(pts[pts.length - 1].x).toBeCloseTo(0, 6);
    expect(pts[pts.length - 1].y).toBeCloseTo(10, 6);
    const mid = pts[Math.floor(pts.length / 2)];
    expect(Math.hypot(mid.x, mid.y)).toBeCloseTo(10, 4);
  });

  it('wählt bei sweep=0 den Bogen auf der anderen Seite', () => {
    // gleiche Endpunkte, aber fallender Winkel → Mittelpunkt (10,10)
    const pts = arcToPoints({ x: 10, y: 0 }, 10, 10, 0, false, false, { x: 0, y: 10 });
    const mid = pts[Math.floor(pts.length / 2)];
    expect(Math.hypot(mid.x - 10, mid.y - 10)).toBeCloseTo(10, 4);
  });
});

describe('Round-Trip DXF → SVG → DXF', () => {
  it('erhält Lage und Richtung einer Linie (keine Spiegelung)', () => {
    const a = parseDxf(dxf(LINE));
    const back = parseSvg(writeSvg(a, { margin: 0 }));
    const pts = normPoints(back);
    expect(hasPoint(pts, 0, 0)).toBe(true);
    expect(hasPoint(pts, 10, 5)).toBe(true);
  });

  it('erhält einen 90°-Bogen (deckt falsche sweep-Flags auf)', () => {
    const a = parseDxf(dxf(ARC90));
    expect(size(a)).toEqual({ w: 10, h: 10 });
    const back = parseSvg(writeSvg(a, { margin: 0 }));
    // Bei falschem sweep-Flag entstünde der 270°-Bogen mit 20 × 20 mm
    expect(size(back).w).toBeCloseTo(10, 2);
    expect(size(back).h).toBeCloseTo(10, 2);
    const pts = normPoints(back);
    expect(hasPoint(pts, 10, 0)).toBe(true);
    expect(hasPoint(pts, 0, 10)).toBe(true);
    expect(hasPoint(pts, Math.SQRT1_2 * 10, Math.SQRT1_2 * 10)).toBe(true);
  });

  it('erhält einen Bogen über 180° (large-arc-Flag)', () => {
    const a = parseDxf(dxf('0\nARC\n8\n0\n10\n0\n20\n0\n40\n10\n50\n0\n51\n270\n'));
    const back = parseSvg(writeSvg(a, { margin: 0 }));
    expect(size(back).w).toBeCloseTo(size(a).w, 2);
    expect(size(back).h).toBeCloseTo(size(a).h, 2);
  });

  it('erhält Kreise und Konturen maßhaltig', () => {
    const body = CIRCLE + '0\nLWPOLYLINE\n8\n0\n90\n3\n70\n1\n10\n0\n20\n0\n10\n30\n20\n0\n10\n30\n20\n20\n';
    const a = parseDxf(dxf(body));
    const back = parseSvg(writeSvg(a, { margin: 3 }));
    expect(size(back).w).toBeCloseTo(size(a).w, 2);
    expect(size(back).h).toBeCloseTo(size(a).h, 2);
    expect(entityStats(back).circle).toBe(1);
  });
});

describe('Round-Trip SVG → DXF → SVG', () => {
  it('erhält Maße einer Rechteck-Kontur', () => {
    const a = parseSvg(svg('<rect x="10" y="10" width="40" height="25"/>'));
    expect(size(a)).toEqual({ w: 40, h: 25 });
    const back = parseDxf(writeDxf(a));
    expect(size(back).w).toBeCloseTo(40, 4);
    expect(size(back).h).toBeCloseTo(25, 4);
  });

  it('erhält einen Kreis als echte CIRCLE-Entität', () => {
    const a = parseSvg(svg('<circle cx="50" cy="50" r="12"/>'));
    const out = writeDxf(a);
    expect(out).toContain('0\nCIRCLE');
    const back = parseDxf(out);
    expect(back.entities[0]).toMatchObject({ kind: 'circle', r: 12 });
  });
});

describe('Formaterkennung & convert', () => {
  it('erkennt anhand der Endung und des Inhalts', () => {
    expect(detectFormat('egal', 'zeichnung.DXF')).toBe('dxf');
    expect(detectFormat('egal', 'zeichnung.svg')).toBe('svg');
    expect(detectFormat(svg('<line x1="0" y1="0" x2="1" y2="0"/>'))).toBe('svg');
    expect(detectFormat(dxf(LINE))).toBe('dxf');
    expect(() => detectFormat('Hallo Welt')).toThrow(ConvertError);
  });

  it('konvertiert in die jeweils andere Richtung', () => {
    const a = convert(dxf(LINE + CIRCLE), 'test.dxf');
    expect(a.from).toBe('dxf');
    expect(a.to).toBe('svg');
    expect(a.output).toContain('<svg');

    const b = convert(svg('<rect x="0" y="0" width="10" height="10"/>'), 'test.svg');
    expect(b.from).toBe('svg');
    expect(b.to).toBe('dxf');
    expect(b.output).toContain('AC1009');
  });

  it('skaliert auf Wunsch beim SVG-Import', () => {
    const a = convert(svg('<rect x="0" y="0" width="10" height="10"/>'), 'x.svg', { scale: 2 });
    expect(size(a.drawing).w).toBeCloseTo(20, 6);
  });
});

describe('parseSvgLength', () => {
  it('rechnet Einheiten in Benutzereinheiten (px) um', () => {
    expect(parseSvgLength('96px')).toBeCloseTo(96, 6);
    expect(parseSvgLength('1in')).toBeCloseTo(96, 6);
    expect(parseSvgLength('25.4mm')).toBeCloseTo(96, 4);
    expect(parseSvgLength('100')).toBeCloseTo(100, 6);
    expect(parseSvgLength('50%')).toBeNull();
    expect(parseSvgLength(undefined)).toBeNull();
  });
});

describe('boundsOf', () => {
  it('liefert Nullmaße für leere Eingaben', () => {
    expect(boundsOf([])).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });
});
