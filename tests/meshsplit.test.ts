import { describe, it, expect } from 'vitest';
import { splitMesh, meshVolume, chainSegments, earClip, bridgeHoles, pointInPolygon, type Plane } from '../src/lib/meshsplit';
import { analyzeStl } from '../src/lib/stl';
import { toStl, buildBin } from '../src/lib/gridfinity';

/** Würfel von (0,0,0) bis (s,s,s) mit nach außen zeigenden Normalen. */
function cube(s = 20): Float64Array {
  const v = [
    [0, 0, 0], [s, 0, 0], [s, s, 0], [0, s, 0],
    [0, 0, s], [s, 0, s], [s, s, s], [0, s, s],
  ];
  const idx: [number, number, number][] = [
    [0, 2, 1], [0, 3, 2], [4, 5, 6], [4, 6, 7],
    [0, 1, 5], [0, 5, 4], [3, 7, 6], [3, 6, 2],
    [0, 4, 7], [0, 7, 3], [1, 2, 6], [1, 6, 5],
  ];
  const out: number[] = [];
  for (const [a, b, c] of idx) out.push(...v[a], ...v[b], ...v[c]);
  return Float64Array.from(out);
}

const pruefe = (tris: Float64Array) => analyzeStl(toStl(tris));
const zAt = (offset: number): Plane => ({ nx: 0, ny: 0, nz: 1, d: offset });

describe('Würfel teilen', () => {
  const s = 20;
  const r = splitMesh(cube(s), zAt(s / 2));

  it('beide Hälften sind geschlossen und richtig herum', () => {
    for (const [name, tris] of [['oben', r.above], ['unten', r.below]] as const) {
      const a = pruefe(tris);
      expect(a.watertight, `${name}: ${a.openEdges} offene Kanten`).toBe(true);
      expect(a.inverted, name).toBe(false);
      expect(a.degenerate, name).toBe(0);
    }
  });

  it('die Volumen ergeben zusammen das Original', () => {
    const ganz = meshVolume(cube(s));
    expect(meshVolume(r.above) + meshVolume(r.below)).toBeCloseTo(ganz, 6);
    expect(meshVolume(r.above)).toBeCloseTo(ganz / 2, 6);
  });

  it('die Hälften liegen jeweils auf ihrer Seite der Ebene', () => {
    for (let i = 2; i < r.above.length; i += 3) expect(r.above[i]).toBeGreaterThanOrEqual(s / 2 - 1e-6);
    for (let i = 2; i < r.below.length; i += 3) expect(r.below[i]).toBeLessThanOrEqual(s / 2 + 1e-6);
  });

  it('erzeugt genau eine Schnittkurve, keine offene', () => {
    expect(r.stats.loops).toBe(1);
    expect(r.stats.openLoops).toBe(0);
    expect(r.stats.capTriangles).toBeGreaterThan(0);
    expect(r.stats.warnings).toEqual([]);
  });

  it('die Außenmaße stimmen nach dem Schnitt', () => {
    const o = pruefe(r.above);
    const u = pruefe(r.below);
    expect(o.size).toEqual([s, s, s / 2]);
    expect(u.size).toEqual([s, s, s / 2]);
  });
});

describe('Schnittlage und -richtung', () => {
  it('teilt an beliebiger Höhe im richtigen Verhältnis', () => {
    const s = 20;
    for (const h of [2, 5, 13, 18]) {
      const r = splitMesh(cube(s), zAt(h));
      expect(meshVolume(r.below), `h=${h}`).toBeCloseTo(s * s * h, 4);
      expect(meshVolume(r.above), `h=${h}`).toBeCloseTo(s * s * (s - h), 4);
    }
  });

  it('funktioniert auch mit schräger Ebene', () => {
    const r = splitMesh(cube(20), { nx: 1, ny: 1, nz: 1, d: 30 });
    expect(pruefe(r.above).watertight).toBe(true);
    expect(pruefe(r.below).watertight).toBe(true);
    expect(meshVolume(r.above) + meshVolume(r.below)).toBeCloseTo(8000, 4);
  });

  it('funktioniert entlang X und Y genauso', () => {
    for (const p of [{ nx: 1, ny: 0, nz: 0, d: 10 }, { nx: 0, ny: 1, nz: 0, d: 10 }]) {
      const r = splitMesh(cube(20), p);
      expect(pruefe(r.above).watertight).toBe(true);
      expect(pruefe(r.below).watertight).toBe(true);
      expect(meshVolume(r.above)).toBeCloseTo(4000, 4);
    }
  });

  it('eine Ebene außerhalb des Modells lässt eine Seite leer', () => {
    const r = splitMesh(cube(20), zAt(100));
    expect(r.above.length).toBe(0);
    expect(meshVolume(r.below)).toBeCloseTo(8000, 6);
    expect(r.stats.warnings.some((w) => w.includes('schneidet das Modell nicht'))).toBe(true);
  });

  it('normiert die Ebenennormale selbst', () => {
    const a = splitMesh(cube(20), { nx: 0, ny: 0, nz: 1, d: 10 });
    const b = splitMesh(cube(20), { nx: 0, ny: 0, nz: 5, d: 50 });
    expect(meshVolume(b.above)).toBeCloseTo(meshVolume(a.above), 6);
  });
});

describe('Hohle Modelle – Deckfläche mit Löchern', () => {
  // Ein Gridfinity-Bin aus dem eigenen Generator: Wand, Boden, Fuesse, Stapelrand.
  // Ein Schnitt durch die Wand liefert Aussen- und Innenring, testet also die
  // Loch-Ueberbrueckung.
  const bin = buildBin({
    unitsX: 1, unitsY: 1, unitsZ: 4,
    wall: 1.6, floor: 1.6,
    compartmentsX: 1, compartmentsY: 1,
    lip: false, holes: 'keine', segments: 4,
  }).triangles;

  it('das Ausgangsmodell ist geschlossen', () => {
    expect(pruefe(bin).watertight).toBe(true);
  });

  it('ein Schnitt durch die Wand liefert zwei geschlossene Hälften', () => {
    const r = splitMesh(bin, zAt(16));
    expect(r.stats.loops).toBeGreaterThanOrEqual(2); // Aussen- und Innenring
    expect(r.stats.openLoops).toBe(0);
    for (const [name, tris] of [['oben', r.above], ['unten', r.below]] as const) {
      const a = pruefe(tris);
      expect(a.watertight, `${name}: ${a.openEdges} offene Kanten`).toBe(true);
      expect(a.inverted, name).toBe(false);
    }
  });

  it('das Volumen bleibt beim Teilen erhalten', () => {
    const r = splitMesh(bin, zAt(16));
    expect(meshVolume(r.above) + meshVolume(r.below)).toBeCloseTo(meshVolume(bin), 3);
  });

  it('funktioniert auf mehreren Höhen', () => {
    for (const h of [8, 12, 20, 24]) {
      const r = splitMesh(bin, zAt(h));
      expect(pruefe(r.above).watertight, `h=${h} oben`).toBe(true);
      expect(pruefe(r.below).watertight, `h=${h} unten`).toBe(true);
      expect(meshVolume(r.above) + meshVolume(r.below), `h=${h}`).toBeCloseTo(meshVolume(bin), 3);
    }
  });
});

describe('chainSegments', () => {
  it('verkettet Strecken zu einem Ring', () => {
    const p = (x: number, y: number) => ({ x, y, z: 0 });
    const { loops, open } = chainSegments(
      [
        [p(0, 0), p(1, 0)],
        [p(1, 1), p(0, 1)],
        [p(1, 0), p(1, 1)],
        [p(0, 1), p(0, 0)],
      ],
      1e-6,
    );
    expect(loops).toHaveLength(1);
    expect(loops[0]).toHaveLength(4);
    expect(open).toBe(0);
  });

  it('meldet nicht schließbare Ketten, statt zu hängen', () => {
    const p = (x: number) => ({ x, y: 0, z: 0 });
    const { loops, open } = chainSegments([[p(0), p(1)], [p(1), p(2)]], 1e-6);
    expect(loops).toHaveLength(0);
    expect(open).toBe(1);
  });

  it('trennt zwei getrennte Ringe', () => {
    const p = (x: number, y: number) => ({ x, y, z: 0 });
    const ring = (o: number): [typeof p extends never ? never : { x: number; y: number; z: number }, { x: number; y: number; z: number }][] => [
      [p(o, 0), p(o + 1, 0)],
      [p(o + 1, 0), p(o + 1, 1)],
      [p(o + 1, 1), p(o, 1)],
      [p(o, 1), p(o, 0)],
    ];
    const { loops } = chainSegments([...ring(0), ...ring(10)], 1e-6);
    expect(loops).toHaveLength(2);
  });
});

describe('Polygon-Werkzeuge', () => {
  const quadrat = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];

  it('Ear-Clipping zerlegt ein Quadrat in zwei Dreiecke', () => {
    expect(earClip(quadrat)).toHaveLength(2);
  });

  it('Ear-Clipping kommt mit konkaven Formen klar', () => {
    // L-Form
    const l = [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 4 },
      { x: 4, y: 4 }, { x: 4, y: 10 }, { x: 0, y: 10 },
    ];
    const t = earClip(l);
    expect(t).toHaveLength(4); // n − 2
    // Flächensumme muss der Polygonfläche entsprechen
    const flaeche = t.reduce((s, [a, b, c]) => {
      const A = l[a], B = l[b], C = l[c];
      return s + Math.abs((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x)) / 2;
    }, 0);
    expect(flaeche).toBeCloseTo(10 * 4 + 4 * 6, 6);
  });

  it('Punkt-in-Polygon erkennt innen und außen', () => {
    expect(pointInPolygon({ x: 5, y: 5 }, quadrat)).toBe(true);
    expect(pointInPolygon({ x: 15, y: 5 }, quadrat)).toBe(false);
  });

  it('Loch-Überbrückung erhält die Gesamtfläche', () => {
    const loch = [{ x: 3, y: 3 }, { x: 3, y: 7 }, { x: 7, y: 7 }, { x: 7, y: 3 }];
    const merged = bridgeHoles(quadrat, [loch]);
    const t = earClip(merged);
    const flaeche = t.reduce((s, [a, b, c]) => {
      const A = merged[a], B = merged[b], C = merged[c];
      return s + Math.abs((B.x - A.x) * (C.y - A.y) - (B.y - A.y) * (C.x - A.x)) / 2;
    }, 0);
    // Quadrat 100 minus Loch 16
    expect(flaeche).toBeCloseTo(100 - 16, 4);
  });
});

describe('Robustheit', () => {
  it('leeres Netz führt zu leeren Hälften statt zum Absturz', () => {
    const r = splitMesh(new Float64Array(0), zAt(0));
    expect(r.above.length).toBe(0);
    expect(r.below.length).toBe(0);
    expect(r.stats.loops).toBe(0);
  });

  it('ist deterministisch', () => {
    const a = splitMesh(cube(20), zAt(7));
    const b = splitMesh(cube(20), zAt(7));
    expect(Array.from(a.above)).toEqual(Array.from(b.above));
    expect(a.stats).toEqual(b.stats);
  });

  it('kommt mit sehr großen und sehr kleinen Modellen klar', () => {
    for (const s of [0.5, 5000]) {
      const r = splitMesh(cube(s), zAt(s / 2));
      expect(pruefe(r.above).watertight, `s=${s}`).toBe(true);
      expect(meshVolume(r.above) + meshVolume(r.below), `s=${s}`).toBeCloseTo(s ** 3, Math.max(0, 6 - Math.log10(s ** 3)));
    }
  });
});
