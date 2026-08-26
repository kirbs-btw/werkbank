import { describe, it, expect } from 'vitest';
import { triangulateWithHoles, ringArea, type Pt } from '../src/lib/polytri';

const quadrat = (a: number): Pt[] => [
  { x: -a, y: -a }, { x: a, y: -a }, { x: a, y: a }, { x: -a, y: a },
];
const kreis = (cx: number, cy: number, r: number, n = 12): Pt[] =>
  Array.from({ length: n }, (_, i) => {
    const w = (-2 * Math.PI * i) / n;
    return { x: cx + r * Math.cos(w), y: cy + r * Math.sin(w) };
  });

/**
 * Die beiden Zusagen des Verfahrens: Die Dreiecke decken genau das Material ab,
 * und **jede Konturkante steht genau einmal am Rand**. Die zweite ist für den
 * Einsatz als Deckfläche die wichtigere – nur so passt sie kantengenau auf die
 * beschnittenen Seitenwände.
 */
function pruefe(name: string, aussen: Pt[], loecher: Pt[][] = []): void {
  const { points, triangles } = triangulateWithHoles(aussen, loecher);

  const soll = Math.abs(ringArea(aussen)) - loecher.reduce((s, h) => s + Math.abs(ringArea(h)), 0);
  const ist = triangles.reduce((s, [i, j, k]) => {
    const A = points[i], B = points[j], C = points[k];
    return s + ((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
  }, 0);
  expect(ist, `${name}: Fläche`).toBeCloseTo(soll, 6);

  const zaehler = new Map<string, number>();
  for (const [i, j, k] of triangles)
    for (const [a, b] of [[i, j], [j, k], [k, i]]) {
      const id = a < b ? `${a}|${b}` : `${b}|${a}`;
      zaehler.set(id, (zaehler.get(id) ?? 0) + 1);
    }
  let start = 0;
  for (const ring of [aussen, ...loecher]) {
    for (let i = 0; i < ring.length; i++) {
      const a = start + i;
      const b = start + ((i + 1) % ring.length);
      const id = a < b ? `${a}|${b}` : `${b}|${a}`;
      expect(zaehler.get(id), `${name}: Konturkante ${i} von Ring ab ${start}`).toBe(1);
    }
    start += ring.length;
  }
  // Diagonalen kommen genau zweimal vor und heben sich damit auf
  for (const [id, n] of zaehler) if (n !== 1) expect(n, `${name}: Kante ${id}`).toBe(2);
}

describe('Zerlegung ohne Brücken', () => {
  it('bei einfachen Formen', () => {
    pruefe('Dreieck', [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }]);
    pruefe('Quadrat', quadrat(10));
    pruefe('L-Form', [
      { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 4 },
      { x: 4, y: 4 }, { x: 4, y: 10 }, { x: 0, y: 10 },
    ]);
  });

  it('bei konkaven Formen', () => {
    const stern: Pt[] = Array.from({ length: 12 }, (_, i) => {
      const w = (2 * Math.PI * i) / 12;
      const r = i % 2 === 0 ? 20 : 9;
      return { x: r * Math.cos(w), y: r * Math.sin(w) };
    });
    pruefe('Stern', stern);
    pruefe('Kamm', [
      { x: 0, y: 0 }, { x: 12, y: 0 }, { x: 12, y: 10 }, { x: 10, y: 10 }, { x: 10, y: 3 },
      { x: 8, y: 3 }, { x: 8, y: 10 }, { x: 6, y: 10 }, { x: 6, y: 3 },
      { x: 4, y: 3 }, { x: 4, y: 10 }, { x: 0, y: 10 },
    ]);
  });

  it('mit einem Loch', () => {
    pruefe('ein rundes Loch', quadrat(20), [kreis(0, 0, 5)]);
    pruefe('ein eckiges Loch', quadrat(20), [[{ x: -4, y: -4 }, { x: -4, y: 4 }, { x: 4, y: 4 }, { x: 4, y: -4 }]]);
  });

  it('mit mehreren Löchern – der Fall, an dem Brücken scheiterten', () => {
    pruefe('zwei diagonal', quadrat(20), [kreis(-11, -11, 4), kreis(11, 11, 4)]);
    pruefe('zwei übereinander', quadrat(20), [kreis(0, -11, 4), kreis(0, 11, 4)]);
    pruefe('vier in den Ecken', quadrat(20), [kreis(-11, -11, 4), kreis(11, -11, 4), kreis(11, 11, 4), kreis(-11, 11, 4)]);
    pruefe('fünf', quadrat(20), [kreis(0, 0, 3), kreis(-12, -12, 3), kreis(12, -12, 3), kreis(12, 12, 3), kreis(-12, 12, 3)]);
    pruefe('unterschiedlich groß', quadrat(20), [kreis(-10, -8, 5, 16), kreis(8, 2, 2, 8), kreis(-2, 12, 3, 10)]);
  });

  it('bei einer konkaven Außenkontur mit Löchern', () => {
    const lForm: Pt[] = [
      { x: -20, y: -20 }, { x: 20, y: -20 }, { x: 20, y: 0 },
      { x: 0, y: 0 }, { x: 0, y: 20 }, { x: -20, y: 20 },
    ];
    pruefe('L mit einem Loch', lForm, [kreis(-10, -10, 4)]);
    pruefe('L mit drei Löchern', lForm, [kreis(-10, -10, 3), kreis(10, -12, 3), kreis(-10, 10, 3)]);
  });

  it('dreht die Umlaufrichtung selbst zurecht', () => {
    // Außen im Uhrzeigersinn, Loch gegen den Uhrzeigersinn – beides falsch herum
    const aussen = quadrat(10).slice().reverse();
    const loch = kreis(0, 0, 3).slice().reverse();
    const { points, triangles } = triangulateWithHoles(aussen, [loch]);
    const ist = triangles.reduce((s, [i, j, k]) => {
      const A = points[i], B = points[j], C = points[k];
      return s + ((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
    }, 0);
    expect(ist).toBeGreaterThan(0); // Dreiecke laufen gegen den Uhrzeigersinn
    expect(ist).toBeCloseTo(400 - Math.abs(ringArea(loch)), 6);
  });

  it('fügt keine neuen Punkte hinzu', () => {
    // Das ist die Bedingung dafür, dass die Deckfläche auf die Wände passt.
    const loecher = [kreis(-11, -11, 4), kreis(11, 11, 4)];
    const { points } = triangulateWithHoles(quadrat(20), loecher);
    expect(points.length).toBe(4 + loecher.reduce((s, h) => s + h.length, 0));
  });

  it('kommt mit entarteten Eingaben zurecht, statt zu hängen', () => {
    expect(triangulateWithHoles([], []).triangles).toEqual([]);
    expect(triangulateWithHoles([{ x: 0, y: 0 }, { x: 1, y: 0 }], []).triangles).toEqual([]);
    // Loch mit zu wenig Punkten wird übergangen
    const r = triangulateWithHoles(quadrat(10), [[{ x: 0, y: 0 }, { x: 1, y: 1 }]]);
    expect(r.triangles.length).toBeGreaterThan(0);
    for (const [a, b, c] of r.triangles) {
      for (const i of [a, b, c]) expect(Number.isFinite(r.points[i].x)).toBe(true);
    }
  });

  it('trianguliert ein Rechteck mit waagerechten Lochkanten', () => {
    // Waagerechte Kanten sind der schwierige Fall für ein Sweep-Verfahren.
    pruefe('rechteckiges Loch', quadrat(20), [
      [{ x: -6, y: -3 }, { x: -6, y: 3 }, { x: 6, y: 3 }, { x: 6, y: -3 }],
    ]);
  });
});
