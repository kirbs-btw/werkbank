import { describe, it, expect } from 'vitest';
import {
  buildBox,
  fingerCount,
  exportSvg,
  exportDxf,
  previewSvg,
  type BoxSpec,
  type Panel,
  type Pt,
} from '../src/lib/fingerbox';

const spec = (over: Partial<BoxSpec> = {}): BoxSpec => ({
  length: 200,
  width: 120,
  height: 80,
  thickness: 4,
  fingerWidth: 15,
  kerf: 0,
  measure: 'outer',
  lid: true,
  bedWidth: 600,
  ...over,
});

/** Kontur relativ zur linken unteren Ecke der Platte. */
const local = (p: Panel): Pt[] => p.points.map((q) => ({ x: q.x - p.x, y: q.y - p.y }));

const byId = (panels: Panel[], id: string): Panel => {
  const p = panels.find((x) => x.id === id);
  if (!p) throw new Error(`Platte ${id} fehlt`);
  return p;
};

function inside(poly: Pt[], p: Pt): boolean {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

function signedArea(poly: Pt[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

const boundsOf = (poly: Pt[]) => ({
  w: Math.max(...poly.map((p) => p.x)) - Math.min(...poly.map((p) => p.x)),
  h: Math.max(...poly.map((p) => p.y)) - Math.min(...poly.map((p) => p.y)),
});

describe('fingerCount', () => {
  it('liefert immer eine ungerade Anzahl (Muster bleibt beim Spiegeln gültig)', () => {
    for (const edge of [40, 80, 120, 200, 333, 1000]) {
      for (const target of [5, 10, 15, 22]) {
        expect(fingerCount(edge, target, 4) % 2).toBe(1);
      }
    }
  });

  it('macht Finger nie schmaler als die Materialstärke', () => {
    const n = fingerCount(40, 1, 6);
    expect(40 / n).toBeGreaterThanOrEqual(6 - 1e-9);
  });
});

describe('buildBox – Aufbau', () => {
  it('erzeugt 6 Platten mit Deckel und 5 ohne', () => {
    expect(buildBox(spec({ lid: true })).panels).toHaveLength(6);
    const offen = buildBox(spec({ lid: false }));
    expect(offen.panels).toHaveLength(5);
    expect(offen.panels.find((p) => p.id === 'deckel')).toBeUndefined();
  });

  it('alle Konturen sind rechtwinklig, geschlossen und gegen den Uhrzeigersinn', () => {
    for (const p of buildBox(spec()).panels) {
      const poly = local(p);
      expect(poly.length).toBeGreaterThanOrEqual(4);
      expect(signedArea(poly)).toBeGreaterThan(0);
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i];
        const b = poly[(i + 1) % poly.length];
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.y - b.y);
        expect(dx < 1e-6 || dy < 1e-6, `Kante nicht achsparallel: ${JSON.stringify([a, b])}`).toBe(true);
      }
    }
  });

  it('Plattenmaße entsprechen den Außenmaßen der Kiste', () => {
    const r = buildBox(spec());
    const b = byId(r.panels, 'boden');
    expect(boundsOf(local(b)).w).toBeCloseTo(200, 6);
    expect(boundsOf(local(b)).h).toBeCloseTo(120, 6);
    const v = byId(r.panels, 'vorne');
    expect(boundsOf(local(v)).w).toBeCloseTo(200, 6);
    expect(boundsOf(local(v)).h).toBeCloseTo(80, 6);
    const l = byId(r.panels, 'links');
    expect(boundsOf(local(l)).w).toBeCloseTo(120, 6);
    expect(boundsOf(local(l)).h).toBeCloseTo(80, 6);
  });

  it('rechnet Innenmaß korrekt in Außenmaß um', () => {
    const r = buildBox(spec({ measure: 'inner', length: 200, width: 120, height: 80 }));
    expect(r.outer).toEqual({ length: 208, width: 128, height: 88 });
    expect(r.inner).toEqual({ length: 200, width: 120, height: 80 });
  });
});

describe('buildBox – Zinken greifen ineinander', () => {
  const t = 4;
  const r = buildBox(spec({ thickness: t }));
  const vorne = local(byId(r.panels, 'vorne'));
  const links = local(byId(r.panels, 'links'));
  const rechts = local(byId(r.panels, 'rechts'));
  const boden = local(byId(r.panels, 'boden'));

  /** Material im Randstreifen an Position s? */
  const matLeft = (poly: Pt[], s: number) => inside(poly, { x: t / 2, y: s });
  const matRight = (poly: Pt[], s: number, a: number) => inside(poly, { x: a - t / 2, y: s });
  const matBottom = (poly: Pt[], s: number) => inside(poly, { x: s, y: t / 2 });

  it('senkrechte Ecke Vorderwand ↔ linke Seitenwand: genau eine Platte füllt jede Stelle', () => {
    for (let z = 1; z < 80; z += 0.5) {
      expect(matLeft(vorne, z) !== matLeft(links, z), `Konflikt/Lücke bei z=${z}`).toBe(true);
    }
  });

  it('senkrechte Ecke Vorderwand ↔ rechte Seitenwand (gespiegelte Laufrichtung)', () => {
    for (let z = 1; z < 80; z += 0.5) {
      expect(matRight(vorne, z, 200) !== matLeft(rechts, z), `Konflikt/Lücke bei z=${z}`).toBe(true);
    }
  });

  it('Boden ↔ Vorderwand: Zapfen und Ausklinkung sind komplementär', () => {
    for (let x = 1; x < 200; x += 0.5) {
      expect(matBottom(boden, x) !== matBottom(vorne, x), `Konflikt/Lücke bei x=${x}`).toBe(true);
    }
  });

  it('offene Kiste: Oberkante der Wände ist glatt (keine Zinken)', () => {
    const offen = buildBox(spec({ lid: false }));
    const wand = local(byId(offen.panels, 'vorne'));
    for (let x = 1; x < 200; x += 1) {
      expect(inside(wand, { x, y: 80 - t / 2 }), `Lücke an der Oberkante bei x=${x}`).toBe(true);
    }
  });
});

describe('buildBox – Kerf-Kompensation', () => {
  it('vergrößert jede Platte um die Schnittfuge (je Seite k/2)', () => {
    const k = 0.2;
    const ohne = boundsOf(local(byId(buildBox(spec({ kerf: 0 })).panels, 'vorne')));
    const mit = boundsOf(local(byId(buildBox(spec({ kerf: k })).panels, 'vorne')));
    expect(mit.w).toBeCloseTo(ohne.w + k, 6);
    expect(mit.h).toBeCloseTo(ohne.h + k, 6);
  });

  it('macht Zapfen breiter und Ausklinkungen schmaler (Presssitz nach dem Schnitt)', () => {
    const k = 0.4;
    const t = 4;
    const vorne = local(byId(buildBox(spec({ kerf: k, thickness: t })).panels, 'vorne'));
    const minX = Math.min(...vorne.map((p) => p.x));
    // Zapfenbreite am unteren Ende der linken Kante messen (positive Kante → startet mit Zapfen)
    let z = 0;
    while (z < 80 && inside(vorne, { x: minX + t / 2, y: z + 0.001 })) z += 0.001;
    const nominal = buildBox(spec({ kerf: 0, thickness: t }));
    expect(z).toBeGreaterThan(nominal.fingerSize.height);
    expect(z).toBeLessThan(nominal.fingerSize.height + 2 * k);
  });
});

describe('buildBox – Validierung & Ausgabe', () => {
  it('meldet zu dickes Material statt unsinnige Geometrie zu liefern', () => {
    const r = buildBox(spec({ thickness: 50, height: 80, width: 120, length: 200 }));
    expect(r.errors.length).toBeGreaterThan(0);
    expect(r.panels).toHaveLength(0);
  });

  it('meldet ungültige Maße', () => {
    expect(buildBox(spec({ thickness: 0 })).errors.length).toBeGreaterThan(0);
    expect(buildBox(spec({ length: 0 })).errors.length).toBeGreaterThan(0);
  });

  it('warnt, wenn eine Platte breiter als die Arbeitsfläche ist', () => {
    const r = buildBox(spec({ length: 900, bedWidth: 400 }));
    expect(r.warnings.some((w) => w.includes('Arbeitsfläche'))).toBe(true);
  });

  it('ordnet Platten überschneidungsfrei innerhalb der Arbeitsfläche an', () => {
    const r = buildBox(spec({ bedWidth: 400 }));
    for (const p of r.panels) {
      const b = boundsOf(local(p));
      expect(p.x + b.w).toBeLessThanOrEqual(Math.max(r.layout.width, 400) + 1e-6);
    }
    for (let i = 0; i < r.panels.length; i++) {
      for (let j = i + 1; j < r.panels.length; j++) {
        const a = r.panels[i];
        const b = r.panels[j];
        const ab = boundsOf(local(a));
        const bb = boundsOf(local(b));
        const overlap =
          a.x < b.x + bb.w - 1e-6 &&
          b.x < a.x + ab.w - 1e-6 &&
          a.y < b.y + bb.h - 1e-6 &&
          b.y < a.y + ab.h - 1e-6;
        expect(overlap, `${a.id} überlappt ${b.id}`).toBe(false);
      }
    }
  });

  it('ist deterministisch', () => {
    expect(buildBox(spec())).toEqual(buildBox(spec()));
  });

  it('liefert gültige SVG- und DXF-Exporte', () => {
    const r = buildBox(spec());
    const svg = exportSvg(r);
    expect(svg).toContain('<svg');
    expect(svg).toContain('mm"');
    expect((svg.match(/<polygon/g) ?? []).length).toBe(6);
    const dxf = exportDxf(r);
    expect(dxf.startsWith('0\nSECTION')).toBe(true);
    expect(dxf.trimEnd().endsWith('EOF')).toBe(true);
    expect((dxf.match(/\nLINE\n/g) ?? []).length).toBeGreaterThan(20);
    expect(previewSvg(r)).toContain('Vorderwand');
  });

  it('liefert bei Fehlern leere Exporte statt kaputter Dateien', () => {
    const r = buildBox(spec({ thickness: 0 }));
    expect(exportSvg(r)).toBe('');
    expect(previewSvg(r)).toBe('');
  });
});
