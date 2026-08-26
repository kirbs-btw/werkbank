import { describe, it, expect } from 'vitest';
import { splitMesh, meshVolume, chainSegments, earClip, bridgeHoles, pointInPolygon, connectedComponents, type Plane } from '../src/lib/meshsplit';
import { analyzeStl } from '../src/lib/stl';
import { toStl, buildBin } from '../src/lib/gridfinity';
import { closureError, scaleMesh } from '../src/lib/meshtransform';

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

/* ---------------- Passstifte ---------------- */

import { pinPositions, type PinOptions } from '../src/lib/meshsplit';

const stifte = (over: Partial<PinOptions> = {}): PinOptions => ({
  count: 2, radius: 2, length: 4, clearance: 0.15, ...over,
});

describe('Passstifte', () => {
  const s = 40;
  const ohne = splitMesh(cube(s), zAt(s / 2));
  const mit = splitMesh(cube(s), zAt(s / 2), stifte());

  it('setzt die gewünschte Anzahl', () => {
    expect(mit.stats.pins).toBe(2);
    expect(ohne.stats.pins).toBe(0);
  });

  it('beide Hälften bleiben geschlossen und richtig orientiert', () => {
    for (const [name, tris] of [['oben', mit.above], ['unten', mit.below]] as const) {
      const a = pruefe(tris);
      expect(a.watertight, `${name}: ${a.openEdges} offene Kanten`).toBe(true);
      expect(a.inverted, name).toBe(false);
      expect(a.degenerate, name).toBe(0);
    }
  });

  it('der Zapfen bringt Material dazu, die Tasche nimmt welches weg', () => {
    const p = stifte();
    // Zapfen und Tasche sind 20-Ecke, keine echten Kreise – entsprechend rechnen
    const nEckFlaeche = (r: number) => 0.5 * 20 * r * r * Math.sin((2 * Math.PI) / 20);
    const zapfenVol = 2 * nEckFlaeche(p.radius) * (p.length + 0.02);
    const taschenVol = 2 * nEckFlaeche(p.radius + p.clearance) * (p.length + p.clearance);
    expect(meshVolume(mit.below) - meshVolume(ohne.below)).toBeCloseTo(zapfenVol, 1);
    expect(meshVolume(ohne.above) - meshVolume(mit.above)).toBeCloseTo(taschenVol, 1);
  });

  it('die Tasche ist weiter und tiefer als der Zapfen – sonst klemmt es', () => {
    const p = stifte();
    expect(p.radius + p.clearance).toBeGreaterThan(p.radius);
    expect(p.length + p.clearance).toBeGreaterThan(p.length);
  });

  it('der Zapfen ragt über die Schnittebene hinaus', () => {
    const oben = [];
    for (let i = 2; i < mit.below.length; i += 3) oben.push(mit.below[i]);
    expect(Math.max(...oben)).toBeCloseTo(s / 2 + stifte().length, 6);
  });

  it('die Stifte liegen innerhalb des Querschnitts', () => {
    // Querschnitt des Wuerfels ist 0..40; die Stifte muessen mit Rand hineinpassen
    for (let i = 0; i < mit.below.length; i += 3) {
      expect(mit.below[i]).toBeGreaterThanOrEqual(-1e-6);
      expect(mit.below[i]).toBeLessThanOrEqual(s + 1e-6);
    }
  });

  it('funktioniert auch bei hohlen Modellen mit ausreichend dicker Wand', () => {
    const bin = buildBin({
      unitsX: 2, unitsY: 1, unitsZ: 5, wall: 6, floor: 2,
      compartmentsX: 1, compartmentsY: 1, lip: false, holes: 'keine', segments: 4,
    }).triangles;
    const r = splitMesh(bin, zAt(20), stifte({ count: 3, radius: 0.8, length: 3 }));
    expect(r.stats.pins).toBeGreaterThan(0);
    expect(pruefe(r.above).watertight, `oben: ${pruefe(r.above).openEdges} offene Kanten`).toBe(true);
    expect(pruefe(r.below).watertight, `unten: ${pruefe(r.below).openEdges} offene Kanten`).toBe(true);
  });

  it('verzichtet auf Stifte, wenn die Wand zu dünn ist – statt sie halb im Nichts zu setzen', () => {
    // 2,4 mm Wand traegt keinen Stift mit Materialrand: hoechstens 1,2 mm bis zur Kante
    const duenn = buildBin({
      unitsX: 2, unitsY: 1, unitsZ: 5, wall: 2.4, floor: 2,
      compartmentsX: 1, compartmentsY: 1, lip: false, holes: 'keine', segments: 4,
    }).triangles;
    const r = splitMesh(duenn, zAt(20), stifte({ count: 3, radius: 0.8, length: 3 }));
    expect(r.stats.pins).toBe(0);
    expect(pruefe(r.above).watertight).toBe(true);
    expect(pruefe(r.below).watertight).toBe(true);
  });

  it('setzt weniger Stifte, wenn der Querschnitt zu klein ist', () => {
    const schmal = splitMesh(cube(6), zAt(3), stifte({ count: 5, radius: 2 }));
    expect(schmal.stats.pins).toBeLessThan(5);
    expect(pruefe(schmal.above).watertight).toBe(true);
  });

  it('verzichtet ganz auf Stifte, wenn keiner hineinpasst', () => {
    const winzig = splitMesh(cube(3), zAt(1.5), stifte({ count: 2, radius: 5 }));
    expect(winzig.stats.pins).toBe(0);
    expect(pruefe(winzig.above).watertight).toBe(true);
    expect(pruefe(winzig.below).watertight).toBe(true);
  });

  it('ist deterministisch', () => {
    const a = splitMesh(cube(40), zAt(20), stifte({ count: 3 }));
    const b = splitMesh(cube(40), zAt(20), stifte({ count: 3 }));
    expect(Array.from(a.below)).toEqual(Array.from(b.below));
    expect(a.stats.pins).toBe(b.stats.pins);
  });
});

describe('pinPositions', () => {
  const quadrat = [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 40 }, { x: 0, y: 40 }];

  it('liegt mit Abstand zum Rand', () => {
    const p = pinPositions(quadrat, [], 3, 2);
    expect(p).toHaveLength(2);
    for (const q of p) {
      expect(q.x).toBeGreaterThan(3);
      expect(q.x).toBeLessThan(37);
      expect(q.y).toBeGreaterThan(3);
      expect(q.y).toBeLessThan(37);
    }
  });

  it('verteilt die Stifte, statt sie zu häufen', () => {
    const p = pinPositions(quadrat, [], 2, 3);
    for (let i = 0; i < p.length; i++)
      for (let j = i + 1; j < p.length; j++)
        expect(Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y)).toBeGreaterThan(6);
  });

  it('meidet Löcher', () => {
    const loch = [{ x: 12, y: 12 }, { x: 12, y: 28 }, { x: 28, y: 28 }, { x: 28, y: 12 }];
    for (const q of pinPositions(quadrat, [loch], 2, 4)) {
      expect(pointInPolygon(q, loch)).toBe(false);
    }
  });

  it('gibt bei unmöglichen Vorgaben nichts zurück', () => {
    expect(pinPositions(quadrat, [], 50, 2)).toEqual([]);
    expect(pinPositions(quadrat, [], 3, 0)).toEqual([]);
  });
});

describe('Schnittflächen sind einheitlich gewickelt', () => {
  /** Einzelner geschlossener Körper mit Hohlraum: Außenwürfel + umgestülpter Innenwürfel. */
  function hohlerWuerfel(a = 20, w = 3): Float64Array {
    const q = (s: number, o: number, aussen: boolean) => {
      const v = [[0,0,0],[s,0,0],[s,s,0],[0,s,0],[0,0,s],[s,0,s],[s,s,s],[0,s,s]].map((p) => p.map((c) => c + o));
      const f: [number, number, number][] = [[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[3,7,6],[3,6,2],[0,4,7],[0,7,3],[1,2,6],[1,6,5]];
      const out: number[] = [];
      for (const [x, y, z] of f) for (const i of aussen ? [x, y, z] : [x, z, y]) out.push(...v[i]);
      return out;
    };
    return new Float64Array([...q(a, 0, true), ...q(a - 2 * w, w, false)]);
  }

  const bin = buildBin({ unitsX: 1, unitsY: 1, unitsZ: 4, wall: 1.2, floor: 1.2, compartmentsX: 1, compartmentsY: 1, lip: true, holes: 'keine' });

  // Dichtheit über die Kantenzählung reicht nicht: Eine verdrehte Deckfläche
  // hätte dieselbe Kantenbilanz. Erst die Vektorfläche zeigt, dass beide
  // Hälften wirklich geschlossene Körper sind.
  it('bei Vollkörper, Hohlkörper, Bin und mit Passstiften', () => {
    const faelle: [string, Float64Array, Plane, { count: number; radius: number; length: number; clearance: number } | undefined][] = [
      ['Würfel waagerecht', cube(20), { nx: 0, ny: 0, nz: 1, d: 10 }, undefined],
      ['Würfel senkrecht', cube(20), { nx: 1, ny: 0, nz: 0, d: 9 }, undefined],
      ['Würfel mit Stiften', cube(20), { nx: 0, ny: 0, nz: 1, d: 10 }, { count: 2, radius: 2, length: 4, clearance: 0.15 }],
      ['Hohlkörper waagerecht', hohlerWuerfel(20, 3), { nx: 0, ny: 0, nz: 1, d: 10 }, undefined],
      ['Hohlkörper senkrecht durch den Hohlraum', hohlerWuerfel(20, 3), { nx: 1, ny: 0, nz: 0, d: 10 }, undefined],
      ['Hohlkörper schräg', hohlerWuerfel(20, 3), { nx: 1, ny: 1, nz: 0, d: 14 }, undefined],
      ['Bin waagerecht', bin.triangles, { nx: 0, ny: 0, nz: 1, d: 12 }, undefined],
    ];
    for (const [name, t, ebene, stifte] of faelle) {
      const r = splitMesh(t, ebene, stifte);
      // Zuerst: Es muss überhaupt geschnitten worden sein. Ohne diese Prüfung
      // wäre der Test wertlos – closureError liefert für ein leeres Netz 0, eine
      // fehlgeschlagene Trennung ginge also stillschweigend durch. Genau das ist
      // passiert, solange hier eine falsch benannte Ebene übergeben wurde.
      expect(r.below.length, `${name}: unten leer`).toBeGreaterThan(0);
      expect(r.above.length, `${name}: oben leer`).toBeGreaterThan(0);
      expect(closureError(r.below), `${name} unten`).toBeLessThan(1e-9);
      expect(closureError(r.above), `${name} oben`).toBeLessThan(1e-9);
      expect(analyzeStl(toStl(r.below, 'binary')).watertight, `${name} unten dicht`).toBe(true);
      expect(analyzeStl(toStl(r.above, 'binary')).watertight, `${name} oben dicht`).toBe(true);
    }
  });

  it('auch senkrecht und schräg durch überlappende Mehrkörper-Netze', () => {
    // Das war der Fehler aus T14: Ein senkrechter Schnitt trifft mehrere der
    // einander überlappenden Körper eines Gridfinity-Bins auf einmal. Solange
    // alle Konturen gemeinsam betrachtet wurden, hielt die Verschachtelungs-
    // prüfung den Umriss des einen Körpers für ein Loch im anderen. Jetzt wird
    // jeder Körper für sich geschnitten.
    const ebenen: [string, Plane][] = [
      ['x mittig', { nx: 1, ny: 0, nz: 0, d: 0 }],
      ['x versetzt', { nx: 1, ny: 0, nz: 0, d: 10 }],
      ['x am Rand', { nx: 1, ny: 0, nz: 0, d: 20.5 }],
      ['y mittig', { nx: 0, ny: 1, nz: 0, d: 0 }],
      ['schräg', { nx: 1, ny: 1, nz: 1, d: 5 }],
      ['schräg flach', { nx: 0.2, ny: 0, nz: 1, d: 8 }],
    ];
    for (const [name, ebene] of ebenen) {
      const r = splitMesh(bin.triangles, ebene);
      expect(r.below.length, `${name}: unten leer`).toBeGreaterThan(0);
      expect(r.above.length, `${name}: oben leer`).toBeGreaterThan(0);
      expect(closureError(r.below), `${name} unten offen`).toBeLessThan(1e-9);
      expect(closureError(r.above), `${name} oben offen`).toBeLessThan(1e-9);
      expect(analyzeStl(toStl(r.below, 'binary')).watertight, `${name} unten`).toBe(true);
      expect(analyzeStl(toStl(r.above, 'binary')).watertight, `${name} oben`).toBe(true);
    }
  });

  it('erhält das Volumen über den Schnitt hinweg', () => {
    for (const ebene of [{ nx: 1, ny: 0, nz: 0, d: 10 }, { nx: 0, ny: 0, nz: 1, d: 12 }] as Plane[]) {
      const r = splitMesh(bin.triangles, ebene);
      expect(meshVolume(r.below) + meshVolume(r.above)).toBeCloseTo(meshVolume(bin.triangles), 3);
    }
  });

  it('setzt Passstifte auch im Mehrkörper-Netz nur einmal', () => {
    // Ohne Sonderbehandlung bekäme jeder der Körper die volle Stiftzahl.
    const r = splitMesh(bin.triangles, { nx: 0, ny: 0, nz: 1, d: 12 }, { count: 2, radius: 1.5, length: 4, clearance: 0.15 });
    expect(r.stats.pins).toBeLessThanOrEqual(2);
    expect(closureError(r.below)).toBeLessThan(1e-9);
    expect(closureError(r.above)).toBeLessThan(1e-9);
  });
});

describe('Mehrkörper-Netze und Sonderlagen der Ebene', () => {
  const bin = (o: Record<string, unknown> = {}) =>
    buildBin({ unitsX: 1, unitsY: 1, unitsZ: 4, wall: 1.2, floor: 1.2, compartmentsX: 1, compartmentsY: 1, lip: true, holes: 'keine', ...o } as Parameters<typeof buildBin>[0]).triangles;

  it('erkennt die einzelnen Körper', () => {
    expect(connectedComponents(bin()).length).toBe(3); // Boden, Wand, Lippe
    expect(connectedComponents(cube(20)).length).toBe(1);
    expect(connectedComponents(new Float64Array(0)).length).toBe(0);
    // Zwei getrennte Würfel weit auseinander
    const zwei = new Float64Array([...cube(10), ...Array.from(cube(10), (v, i) => (i % 3 === 0 ? v + 500 : v))]);
    expect(connectedComponents(zwei).length).toBe(2);
  });

  it('schneidet Mehrkörper-Netze über Maßstäbe und Richtungen hinweg sauber', () => {
    // Der Kern von T14: Vor der Zerlegung in einzelne Körper war **jeder**
    // senkrechte oder schräge Schnitt durch ein Mehrkörper-Netz undicht.
    const modelle: [string, Float64Array][] = [
      ['1x1x4', bin()],
      ['ohne Lippe', bin({ lip: false })],
      ['zehnfach', scaleMesh(bin(), 10)],
      ['ein Zehntel', scaleMesh(bin(), 0.1)],
    ];
    let geprueft = 0;
    for (const [name, t] of modelle) {
      let maxAbs = 1;
      for (const v of t) if (Math.abs(v) > maxAbs) maxAbs = Math.abs(v);
      for (const [an, n] of [['x', { nx: 1, ny: 0, nz: 0 }], ['y', { nx: 0, ny: 1, nz: 0 }], ['z', { nx: 0, ny: 0, nz: 1 }], ['diagonal', { nx: 1, ny: 1, nz: 1 }]] as [string, Omit<Plane, 'd'>][]) {
        for (const f of [-0.5, -0.25, 0, 0.13, 0.25, 0.4, 0.5]) {
          const r = splitMesh(t, { ...n, d: f * maxAbs });
          if (r.below.length === 0 || r.above.length === 0) continue;
          geprueft++;
          const wo = `${name} ${an} ${f}`;
          expect(r.stats.openEdges, `${wo}: offene Kanten`).toBe(0);
          expect(closureError(r.below), `${wo} unten`).toBeLessThan(1e-9);
          expect(closureError(r.above), `${wo} oben`).toBeLessThan(1e-9);
        }
      }
    }
    expect(geprueft).toBeGreaterThan(70); // sonst prüft der Test zu wenig
  });

  it('bleibt entweder dicht – oder sagt es', () => {
    // Zwei Fälle bekommt die Deckflächen-Erzeugung noch nicht dicht: Netze mit
    // Loch-Überbrückung an der Schnittstelle (Magnetlöcher) und Trennwände,
    // die genau in der Ebene liegen. Beide sind in T15 festgehalten.
    //
    // Zusichern lässt sich hier deshalb nicht „immer dicht", wohl aber das,
    // worauf sich ein Nutzer verlassen können muss: **Ein undichtes Ergebnis
    // wird nie stillschweigend ausgeliefert.**
    const schwierig: [string, Float64Array, Plane][] = [
      ['Magnetlöcher', bin({ holes: 'magnet' }), { nx: 1, ny: 0, nz: 0, d: 2.7 }],
      ['Trennwand in der Ebene', bin({ unitsX: 2, unitsY: 3, compartmentsX: 2, compartmentsY: 2 }), { nx: 0, ny: 1, nz: 0, d: 0 }],
    ];
    for (const [name, t, ebene] of schwierig) {
      const r = splitMesh(t, ebene);
      if (r.stats.openEdges === 0) {
        expect(closureError(r.below), `${name}: dicht gemeldet, aber offen`).toBeLessThan(1e-9);
      } else {
        expect(r.stats.warnings.join(' '), `${name}: undicht ohne Warnung`).toContain('Kanten offen');
      }
    }
  });

  it('weist offene Kanten aus, statt sie zu verschweigen', () => {
    // Die Magnetlöcher machen die Bodenfläche mit Loch-Überbrückung nötig, und
    // die hinterlässt nullbreite Schlitze. Läuft die Ebene durch so einen
    // Schlitz, entstehen entartete Konturstücke und die Deckfläche schließt
    // nicht ganz. Bekannt und offen – siehe T15 im Backlog.
    //
    // Entscheidend ist hier nicht, dass es klappt, sondern dass es **auffällt**:
    // Die Zahl steht in den Kennzahlen und die Seite warnt.
    const r = splitMesh(bin({ holes: 'magnet' }), { nx: 1, ny: 0, nz: 0, d: 2.7 });
    expect(r.stats.openEdges).toBeGreaterThan(0);
    expect(r.stats.warnings.join(' ')).toContain('offen');
  });

  it('meldet bei sauberem Schnitt keine offenen Kanten und keine Warnung dazu', () => {
    const r = splitMesh(bin(), { nx: 0, ny: 0, nz: 1, d: 12 });
    expect(r.stats.openEdges).toBe(0);
    expect(r.stats.warnings.join(' ')).not.toContain('Kanten offen');
  });

  it('kommt mit einer Ebene genau auf den Kanten des Modells zurecht', () => {
    // Ein senkrechter Schnitt genau durch die Mitte eines symmetrischen Teils
    // durchtrennt womöglich kein einziges Dreieck – dann entsteht ohne
    // Ausweichebene gar keine Schnittkontur.
    for (const p of [{ nx: 1, ny: 0, nz: 0, d: 0 }, { nx: 0, ny: 1, nz: 0, d: 0 }] as Plane[]) {
      const r = splitMesh(bin(), p);
      expect(r.stats.openEdges, JSON.stringify(p)).toBe(0);
      expect(closureError(r.below), JSON.stringify(p)).toBeLessThan(1e-9);
    }
  });
});
