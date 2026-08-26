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

describe('Zerlegung über viele zufällige Formen', () => {
  const kreisN = (cx: number, cy: number, r: number, n: number): Pt[] =>
    Array.from({ length: n }, (_, i) => {
      const w = (-2 * Math.PI * i) / n;
      return { x: cx + r * Math.cos(w), y: cy + r * Math.sin(w) };
    });

  /** Beide Zusagen in einem: Fläche stimmt **und** jede Konturkante steht genau einmal am Rand. */
  function inOrdnung(aussen: Pt[], loecher: Pt[][]): boolean {
    const { points, triangles } = triangulateWithHoles(aussen, loecher);
    const soll = Math.abs(ringArea(aussen)) - loecher.reduce((s, h) => s + Math.abs(ringArea(h)), 0);
    const ist = triangles.reduce((s, [i, j, k]) => {
      const A = points[i], B = points[j], C = points[k];
      return s + ((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
    }, 0);
    if (Math.abs(ist - soll) > 1e-6 * Math.max(1, soll)) return false;
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
        if (zaehler.get(a < b ? `${a}|${b}` : `${b}|${a}`) !== 1) return false;
      }
      start += ring.length;
    }
    return true;
  }

  /** Deterministische Testmenge – dieselbe Folge in jedem Lauf. */
  function menge(): [Pt[], Pt[][]][] {
    let seed = 12345;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    const innen = (p: Pt, ring: Pt[]) => {
      let d = false;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++)
        if (ring[i].y > p.y !== ring[j].y > p.y &&
            p.x < ((ring[j].x - ring[i].x) * (p.y - ring[i].y)) / (ring[j].y - ring[i].y) + ring[i].x) d = !d;
      return d;
    };
    const lForm: Pt[] = [{ x: -20, y: -20 }, { x: 20, y: -20 }, { x: 20, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 20 }, { x: -20, y: 20 }];
    const stern: Pt[] = Array.from({ length: 12 }, (_, i) => {
      const w = (2 * Math.PI * i) / 12;
      const r = i % 2 === 0 ? 22 : 12;
      return { x: r * Math.cos(w), y: r * Math.sin(w) };
    });
    const out: [Pt[], Pt[][]][] = [];
    for (const aussen of [quadrat(20), lForm, stern]) {
      for (let n = 1; n <= 6; n++)
        for (let v = 0; v < 40; v++) {
          const loecher: Pt[][] = [];
          let ok = true;
          for (let k = 0; k < n && ok; k++) {
            let gesetzt = false;
            for (let t = 0; t < 60 && !gesetzt; t++) {
              const r = 1.2 + rnd() * 3;
              const cx = (rnd() - 0.5) * 34;
              const cy = (rnd() - 0.5) * 34;
              const kandidat = kreisN(cx, cy, r, 8 + Math.floor(rnd() * 8));
              if (!kandidat.every((q) => innen(q, aussen))) continue;
              if (loecher.some((h) => {
                const c = h.reduce((s, q) => ({ x: s.x + q.x / h.length, y: s.y + q.y / h.length }), { x: 0, y: 0 });
                return Math.hypot(c.x - cx, c.y - cy) < r + 5;
              })) continue;
              loecher.push(kandidat);
              gesetzt = true;
            }
            if (!gesetzt) ok = false;
          }
          if (ok && loecher.length === n) out.push([aussen, loecher]);
        }
    }
    return out;
  }

  it('liefert fast durchgehend eine vollständige Zerlegung', () => {
    const f = menge();
    let gut = 0;
    for (const [a, l] of f) if (inOrdnung(a, l)) gut++;
    expect(f.length).toBeGreaterThan(500);
    // Das Brückenverfahren schafft auf derselben Menge 659. Die Schranke hält
    // den erreichten Stand fest, ohne bei Kleinigkeiten rot zu werden.
    expect(gut, `${gut}/${f.length}`).toBeGreaterThan(710);
  });
});

describe('Konturen aus echten Schnitten', () => {
  /**
   * Ein dünnes Band aus einem Schnitt durch einen Gridfinity-Bin: 28 Punkte,
   * fast alle auf zwei Höhen. Zwei Eigenheiten stecken darin, an denen die
   * Zerlegung nacheinander scheiterte.
   *
   * **Erstens sind die „waagerechten" Kanten nicht exakt waagerecht.** Die
   * Punkte entstehen durch Interpolation, ihre y-Werte unterscheiden sich im
   * letzten Bit – hier −7,2872319847799565 gegen −7,287231984779956. Ein Test
   * auf Gleichheit greift dort nicht, und die Interpolation teilt dann durch
   * rund 10⁻¹⁵.
   *
   * **Zweitens entstehen flächenlose Teilstücke.** Mehrere Punkte auf einer
   * Linie bilden mit einer Diagonale ein Stück ohne Inhalt. Wer es als
   * „entartet" wegwirft, verliert seine Randkanten: Drei Ecken fielen weg und
   * vier Konturkanten fehlten, obwohl die Gesamtfläche stimmte.
   */
  const band: Pt[] = [[-24.310331137193508,-5.8052906903961325],[-24.192205344450386,-6.00989056511157],[-23.454731931957784,-7.2872319847799565],[-4.207285348059957,-7.287231984779956],[-0.2946020375009166,-7.287231984779955],[-0.22865146069654796,-7.287231984779955],[-0.15608689445461144,-7.287231984779955],[-0.07913583848127548,-7.287231984779955],[0,-7.287231984779954],[0.07913583848127681,-7.287231984779954],[0.15608689445461144,-7.287231984779955],[0.22865146069654796,-7.287231984779955],[0.2946020375009166,-7.287231984779955],[4.207285348059956,-7.287231984779956],[23.454731931957784,-7.2872319847799565],[23.614011520411882,-7.0113516449688],[24.310331137193508,-5.8052906903961325],[3.351686142824234,-5.8052906903961325],[0.23469137105115045,-5.805290690396134],[0.18215259221876168,-5.8052906903961325],[0.12434485373359028,-5.8052906903961325],[0.06304266796659874,-5.805290690396134],[0,-5.805290690396134],[-0.06304266796659874,-5.805290690396134],[-0.12434485373359028,-5.8052906903961325],[-0.18215259221876168,-5.8052906903961325],[-0.23469137105115045,-5.805290690396134],[-3.351686142824234,-5.8052906903961325]].map(([x, y]) => ({ x, y }));

  it('zerlegt ein dünnes Band mit fast waagerechten Kanten vollständig', () => {
    pruefe('dünnes Band', band);
  });

  it('lässt dabei keine Ecke ungenutzt', () => {
    const { points, triangles } = triangulateWithHoles(band, []);
    const benutzt = new Set<number>();
    for (const [i, j, k] of triangles) {
      benutzt.add(i);
      benutzt.add(j);
      benutzt.add(k);
    }
    expect(benutzt.size, 'jede Ecke muss in mindestens einem Dreieck vorkommen').toBe(points.length);
  });
});
