import { describe, it, expect } from 'vitest';
import { buildBin, toStl, previewSvg, roundedRect, GF, type BinSpec } from '../src/lib/gridfinity';
import { analyzeStl } from '../src/lib/stl';

const spec = (over: Partial<BinSpec> = {}): BinSpec => ({
  unitsX: 1,
  unitsY: 1,
  unitsZ: 3,
  wall: 1.2,
  floor: 1.2,
  compartmentsX: 1,
  compartmentsY: 1,
  lip: false,
  holes: 'keine',
  segments: 6,
  ...over,
});

/** Netz durch den eigenen STL-Analyzer prüfen – deckt Löcher und falsche Normalen auf. */
const analyze = (s: BinSpec) => analyzeStl(toStl(buildBin(s).triangles));

describe('Spezifikationsmaße', () => {
  it('hält die Konstanten der Gridfinity-Spezifikation ein', () => {
    expect(GF.GRID).toBe(42);
    expect(GF.HEIGHT_UNIT).toBe(7);
    expect(GF.BASE_HEIGHT).toBe(4.75);
    expect(GF.CORNER_R).toBe(3.75);
    expect(GF.LIP_HEIGHT).toBe(4.4);
    // Fußprofil: 0,8 + 1,8 + 2,15 = 4,75 und Versatz 0,8 + 2,15 = 2,95
    expect(0.8 + 1.8 + 2.15).toBeCloseTo(GF.BASE_HEIGHT, 9);
    expect(0.8 + 2.15).toBeCloseTo(GF.BASE_INSET, 9);
  });

  it('1×1×3 misst 41,5 × 41,5 × 21 mm (Beispiel aus der Spezifikation)', () => {
    const r = buildBin(spec({ unitsX: 1, unitsY: 1, unitsZ: 3, lip: false }));
    expect(r.stats.size[0]).toBeCloseTo(41.5, 9);
    expect(r.stats.size[1]).toBeCloseTo(41.5, 9);
    expect(r.stats.size[2]).toBeCloseTo(21, 9);
  });

  it('1×1×3 mit Stapelrand misst 25,4 mm hoch (Beispiel aus der Spezifikation)', () => {
    const r = buildBin(spec({ unitsZ: 3, lip: true }));
    expect(r.stats.size[2]).toBeCloseTo(25.4, 9);
    expect(r.stats.bodyHeight).toBeCloseTo(21, 9);
  });

  it('2×2×2 misst 83,5 × 83,5 × 14 mm (Beispiel aus der Spezifikation)', () => {
    const r = buildBin(spec({ unitsX: 2, unitsY: 2, unitsZ: 2 }));
    expect(r.stats.size).toEqual([83.5, 83.5, 14]);
  });

  it('setzt die Bohrungsmitte 13 mm von der Feldmitte (4,8 mm von der Fußkante)', () => {
    const padBottom = GF.GRID - GF.CLEARANCE - 2 * GF.BASE_INSET;
    expect(padBottom).toBeCloseTo(35.6, 9);
    expect(padBottom / 2 - GF.HOLE_INSET).toBeCloseTo(13, 9);
    // Die Magnetbohrung muss vollständig im Fuß liegen
    expect(13 + GF.MAGNET_D / 2).toBeLessThan(padBottom / 2);
  });
});

describe('Netzqualität', () => {
  it('erzeugt ein geschlossenes Netz mit nach außen zeigenden Normalen', () => {
    const r = analyze(spec());
    expect(r.watertight, `offene Kanten: ${r.openEdges}`).toBe(true);
    expect(r.inverted).toBe(false);
    expect(r.degenerate).toBe(0);
  });

  it('bleibt geschlossen mit Stapelrand, Fächern und Bohrungen', () => {
    const varianten: Partial<BinSpec>[] = [
      { lip: true },
      { compartmentsX: 3 },
      { compartmentsY: 2 },
      { compartmentsX: 2, compartmentsY: 2 },
      { holes: 'magnet' },
      { holes: 'magnet-schraube' },
      { unitsX: 2, unitsY: 3, holes: 'magnet' },
      { lip: true, compartmentsX: 3, compartmentsY: 2, holes: 'magnet-schraube', unitsX: 2, unitsY: 2, unitsZ: 6 },
    ];
    for (const v of varianten) {
      const r = analyze(spec(v));
      expect(r.watertight, `${JSON.stringify(v)} → ${r.openEdges} offene Kanten`).toBe(true);
      expect(r.inverted, JSON.stringify(v)).toBe(false);
      expect(r.degenerate, JSON.stringify(v)).toBe(0);
    }
  });

  it('bleibt bei jeder Auflösungsstufe geschlossen', () => {
    // 8 = Vorschau, 16 = Download-Auflösung
    for (const segments of [2, 4, 8, 12, 16, 24]) {
      const r = analyze(spec({ segments, holes: 'magnet' }));
      expect(r.watertight, `segments=${segments} → ${r.openEdges} offene Kanten`).toBe(true);
    }
  });

  it('liefert exakt die erwarteten Außenmaße im Netz', () => {
    const r = analyze(spec({ unitsX: 2, unitsY: 1, unitsZ: 2, lip: true }));
    expect(r.size[0]).toBeCloseTo(83.5, 3);
    expect(r.size[1]).toBeCloseTo(41.5, 3);
    expect(r.size[2]).toBeCloseTo(18.4, 3); // 14 + 4,4 Stapelrand
    expect(r.min[2]).toBeCloseTo(0, 6);
  });
});

describe('Volumen & Fassungsvermögen', () => {
  it('Bohrungen verringern das Materialvolumen', () => {
    const ohne = buildBin(spec()).stats.volumeCm3;
    const magnet = buildBin(spec({ holes: 'magnet' })).stats.volumeCm3;
    const beides = buildBin(spec({ holes: 'magnet-schraube' })).stats.volumeCm3;
    expect(magnet).toBeLessThan(ohne);
    expect(beides).toBeLessThan(magnet);
    // vier Magnettaschen à Ø6,5 × 2 mm ≈ 0,265 cm³
    const erwartet = (4 * Math.PI * (GF.MAGNET_D / 2) ** 2 * GF.MAGNET_DEPTH) / 1000;
    expect(ohne - magnet).toBeCloseTo(erwartet, 1);
  });

  it('dickere Wände brauchen mehr Material', () => {
    expect(buildBin(spec({ wall: 2.4 })).stats.volumeCm3).toBeGreaterThan(
      buildBin(spec({ wall: 0.8 })).stats.volumeCm3,
    );
  });

  it('mehr Fächer kosten Material und Fassungsvermögen', () => {
    const eins = buildBin(spec({ unitsX: 3 }));
    const drei = buildBin(spec({ unitsX: 3, compartmentsX: 3 }));
    expect(drei.stats.volumeCm3).toBeGreaterThan(eins.stats.volumeCm3);
    expect(drei.stats.capacityMl).toBeLessThan(eins.stats.capacityMl);
  });

  it('rechnet das Fassungsvermögen aus den Fachmaßen', () => {
    const r = buildBin(spec({ unitsX: 2, compartmentsX: 2 }));
    const [w, d, h] = r.stats.compartment;
    expect(r.stats.capacityMl).toBeCloseTo((w * d * h * 2) / 1000, 6);
    expect(h).toBeCloseTo(21 - GF.BASE_HEIGHT - 1.2, 6);
  });

  it('Materialvolumen bleibt deutlich unter dem Quadervolumen', () => {
    const r = buildBin(spec({ unitsZ: 6 }));
    const quader = (r.stats.size[0] * r.stats.size[1] * r.stats.size[2]) / 1000;
    expect(r.stats.volumeCm3).toBeGreaterThan(0);
    expect(r.stats.volumeCm3).toBeLessThan(quader * 0.5);
  });
});

describe('Eingabegrenzen', () => {
  it('fängt unsinnige Werte ab, statt kaputte Netze zu liefern', () => {
    const r = buildBin(spec({ wall: 99, floor: 99, compartmentsX: 99, unitsZ: 1 }));
    expect(r.stats.warnings.length).toBeGreaterThan(0);
    const a = analyzeStl(toStl(r.triangles));
    expect(a.watertight).toBe(true);
  });

  it('rundet Einheiten und begrenzt die Auflösung', () => {
    const r = buildBin(spec({ unitsX: 2.7, segments: 500 }));
    expect(r.stats.size[0]).toBeCloseTo(3 * 42 - 0.5, 9);
    expect(r.stats.triangles).toBeLessThan(200000);
  });

  it('warnt bei zu schmalen Fächern', () => {
    const r = buildBin(spec({ compartmentsX: 12 }));
    expect(r.stats.warnings.some((w) => w.includes('3 mm'))).toBe(true);
  });

  it('ist deterministisch', () => {
    const a = buildBin(spec({ holes: 'magnet', lip: true }));
    const b = buildBin(spec({ holes: 'magnet', lip: true }));
    expect(a.stats).toEqual(b.stats);
    expect(Array.from(a.triangles)).toEqual(Array.from(b.triangles));
  });
});

describe('roundedRect', () => {
  it('trifft die Außenmaße und enthält die Seitenmittelpunkte', () => {
    const loop = roundedRect(0, 0, 41.5, 41.5, 3.75, 4);
    const xs = loop.map((p) => p.x);
    const ys = loop.map((p) => p.y);
    expect(Math.max(...xs)).toBeCloseTo(20.75, 9);
    expect(Math.min(...ys)).toBeCloseTo(-20.75, 9);
    // Seitenmittelpunkte sind nötig, damit die Fußunterseite ohne T-Stöße anschließt
    expect(loop.some((p) => Math.abs(p.x - 20.75) < 1e-9 && Math.abs(p.y) < 1e-9)).toBe(true);
    expect(loop.some((p) => Math.abs(p.y - 20.75) < 1e-9 && Math.abs(p.x) < 1e-9)).toBe(true);
  });
});

describe('STL & Vorschau', () => {
  it('schreibt ein gültiges binäres STL', () => {
    const r = buildBin(spec());
    const buf = toStl(r.triangles);
    expect(buf.byteLength).toBe(84 + r.stats.triangles * 50);
    expect(new DataView(buf).getUint32(80, true)).toBe(r.stats.triangles);
    expect(analyzeStl(buf).triangles).toBe(r.stats.triangles);
  });

  it('zeichnet eine Vorschau mit Füßen und Fächern', () => {
    const svg = previewSvg(spec({ unitsX: 2, compartmentsX: 2, lip: true }));
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox');
    // 2 Füße + Außenkontur (2×) + Innenkontur + 2 Fächer
    expect((svg.match(/<polygon/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });
});
