import { describe, it, expect } from 'vitest';
import {
  analyzeStl,
  detectFormat,
  parseStl,
  estimateCost,
  fitsBuildVolume,
  filamentLength,
  StlError,
  STL_MATERIALS,
  STL_MATERIAL_MAP,
  MAX_STL_BYTES,
} from '../src/lib/stl';

type Tri = [number[], number[], number[]];

/** Würfel von (0,0,0) bis (s,s,s), 12 Dreiecke mit nach außen zeigenden Normalen. */
function cubeTriangles(s = 10): Tri[] {
  const v = [
    [0, 0, 0], [s, 0, 0], [s, s, 0], [0, s, 0],
    [0, 0, s], [s, 0, s], [s, s, s], [0, s, s],
  ];
  const idx: [number, number, number][] = [
    [0, 2, 1], [0, 3, 2], // unten (−z)
    [4, 5, 6], [4, 6, 7], // oben (+z)
    [0, 1, 5], [0, 5, 4], // vorn (−y)
    [3, 7, 6], [3, 6, 2], // hinten (+y)
    [0, 4, 7], [0, 7, 3], // links (−x)
    [1, 2, 6], [1, 6, 5], // rechts (+x)
  ];
  return idx.map(([a, b, c]) => [v[a], v[b], v[c]] as Tri);
}

function binaryStl(tris: Tri[], header = 'Werkbank Test'): ArrayBuffer {
  const buf = new ArrayBuffer(84 + tris.length * 50);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < header.length && i < 80; i++) bytes[i] = header.charCodeAt(i);
  view.setUint32(80, tris.length, true);
  let p = 84;
  for (const t of tris) {
    for (let k = 0; k < 3; k++) view.setFloat32(p + k * 4, 0, true); // Normale ignorieren
    p += 12;
    for (const vert of t) {
      for (const c of vert) {
        view.setFloat32(p, c, true);
        p += 4;
      }
    }
    view.setUint16(p, 0, true);
    p += 2;
  }
  return buf;
}

function asciiStl(tris: Tri[]): ArrayBuffer {
  const body = tris
    .map(
      (t) =>
        `facet normal 0 0 0\n outer loop\n${t.map((v) => `  vertex ${v[0]} ${v[1]} ${v[2]}`).join('\n')}\n endloop\nendfacet`,
    )
    .join('\n');
  return new TextEncoder().encode(`solid test\n${body}\nendsolid test\n`).buffer as ArrayBuffer;
}

describe('Formaterkennung', () => {
  it('erkennt binär und ASCII', () => {
    expect(detectFormat(binaryStl(cubeTriangles()))).toBe('binary');
    expect(detectFormat(asciiStl(cubeTriangles()))).toBe('ascii');
  });

  it('erkennt binäre Dateien, deren Kopf mit "solid" beginnt (klassische Falle)', () => {
    const buf = binaryStl(cubeTriangles(), 'solid exported by some CAD');
    expect(detectFormat(buf)).toBe('binary');
    expect(analyzeStl(buf).triangles).toBe(12);
  });
});

describe('analyzeStl – Geometrie', () => {
  it('berechnet Volumen und Oberfläche eines Würfels exakt', () => {
    const s = 10;
    const r = analyzeStl(binaryStl(cubeTriangles(s)));
    expect(r.triangles).toBe(12);
    expect(r.volume).toBeCloseTo(s ** 3, 6);
    expect(r.area).toBeCloseTo(6 * s ** 2, 6);
    expect(r.size).toEqual([s, s, s]);
    expect(r.min).toEqual([0, 0, 0]);
    expect(r.max).toEqual([s, s, s]);
  });

  it('liefert für ASCII dieselben Werte wie für binär', () => {
    const tris = cubeTriangles(7.5);
    const b = analyzeStl(binaryStl(tris));
    const a = analyzeStl(asciiStl(tris));
    expect(a.volume).toBeCloseTo(b.volume, 4);
    expect(a.area).toBeCloseTo(b.area, 4);
    expect(a.triangles).toBe(b.triangles);
    expect(a.watertight).toBe(b.watertight);
  });

  it('rechnet auch bei verschobenem Modell richtig (Volumen ist ortsunabhängig)', () => {
    const s = 10;
    const shifted = cubeTriangles(s).map(
      (t) => t.map((v) => [v[0] + 100, v[1] - 250, v[2] + 33]) as Tri,
    );
    const r = analyzeStl(binaryStl(shifted));
    expect(r.volume).toBeCloseTo(s ** 3, 4);
    expect(r.size[0]).toBeCloseTo(s, 4);
  });

  it('erkennt ein geschlossenes Netz als wasserdicht', () => {
    const r = analyzeStl(binaryStl(cubeTriangles()));
    expect(r.watertight).toBe(true);
    expect(r.openEdges).toBe(0);
    expect(r.degenerate).toBe(0);
  });

  it('erkennt ein Loch im Netz', () => {
    const kaputt = cubeTriangles().slice(0, 11); // ein Dreieck fehlt
    const r = analyzeStl(binaryStl(kaputt));
    expect(r.watertight).toBe(false);
    expect(r.openEdges).toBe(3);
  });

  it('erkennt nach innen zeigende Normalen', () => {
    const s = 10;
    const flipped = cubeTriangles(s).map((t) => [t[0], t[2], t[1]] as Tri);
    const r = analyzeStl(binaryStl(flipped));
    expect(r.inverted).toBe(true);
    expect(r.volume).toBeCloseTo(s ** 3, 6); // Betrag bleibt korrekt
    expect(r.watertight).toBe(true);
  });

  it('zählt entartete Dreiecke', () => {
    const tris = cubeTriangles();
    tris.push([[0, 0, 0], [1, 1, 1], [2, 2, 2]]); // kollinear → keine Fläche
    const r = analyzeStl(binaryStl(tris));
    expect(r.degenerate).toBe(1);
  });
});

describe('analyzeStl – Fehlerfälle', () => {
  it('meldet leere Dateien', () => {
    expect(() => analyzeStl(new ArrayBuffer(0))).toThrow(StlError);
  });

  it('meldet abgeschnittene Binärdateien', () => {
    const full = binaryStl(cubeTriangles());
    const cut = full.slice(0, full.byteLength - 60);
    expect(() => analyzeStl(cut)).toThrow(/unvollständig/i);
  });

  it('meldet Dateien ohne Dreiecke', () => {
    const buf = new TextEncoder().encode('solid leer\nendsolid leer\n').buffer as ArrayBuffer;
    expect(() => analyzeStl(buf)).toThrow(StlError);
  });

  it('meldet ASCII-Dateien mit unvollständigem Dreieck', () => {
    const txt = 'solid t\nfacet normal 0 0 0\n outer loop\n  vertex 0 0 0\n  vertex 1 0 0\n endloop\nendfacet\nendsolid t\n';
    expect(() => analyzeStl(new TextEncoder().encode(txt).buffer as ArrayBuffer)).toThrow(
      /unvollständig/i,
    );
  });

  it('lehnt zu große Dateien ab, bevor gerechnet wird', () => {
    const fake = { byteLength: MAX_STL_BYTES + 1 } as ArrayBuffer;
    expect(() => parseStl(fake)).toThrow(/MB/);
  });
});

describe('Werkstoffe', () => {
  it('hat eindeutige IDs und plausible Dichten', () => {
    const ids = STL_MATERIALS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of STL_MATERIALS) {
      expect(m.density, m.id).toBeGreaterThan(0.1);
      expect(m.density, m.id).toBeLessThan(25);
      expect(m.price, m.id).toBeGreaterThan(0);
    }
    expect(STL_MATERIAL_MAP.pla.density).toBeCloseTo(1.24, 6);
    expect(STL_MATERIAL_MAP.stahl.density).toBeGreaterThan(STL_MATERIAL_MAP.alu.density);
  });
});

describe('estimateCost', () => {
  const base = { volume: 10000, area: 6000, scale: 100, density: 1.24, price: 20, wall: 0, infill: 20 };

  it('rechnet massiv, wenn keine Wandstärke angegeben ist', () => {
    const r = estimateCost(base);
    expect(r.volumeCm3).toBeCloseTo(10, 6);
    expect(r.materialCm3).toBeCloseTo(10, 6);
    expect(r.weight).toBeCloseTo(12.4, 6);
    expect(r.cost).toBeCloseTo((12.4 / 1000) * 20, 6);
  });

  it('skaliert Volumen kubisch und Oberfläche quadratisch', () => {
    const r = estimateCost({ ...base, scale: 200 });
    expect(r.volumeCm3).toBeCloseTo(80, 6);
    expect(r.areaCm2).toBeCloseTo(60 * 4, 6);
  });

  it('berücksichtigt Schale und Füllgrad', () => {
    const r = estimateCost({ ...base, wall: 1.2, infill: 20 });
    // Schale = 6000 mm² × 1,2 mm = 7200 mm³ = 7,2 cm³
    expect(r.shellCm3).toBeCloseTo(7.2, 6);
    expect(r.infillCm3).toBeCloseTo((10 - 7.2) * 0.2, 6);
    expect(r.materialCm3).toBeCloseTo(7.2 + 0.56, 6);
    expect(r.materialCm3).toBeLessThan(r.volumeCm3);
  });

  it('begrenzt die Schale auf das Gesamtvolumen (dünne Teile werden nicht überschätzt)', () => {
    const r = estimateCost({ ...base, wall: 50 });
    expect(r.shellCm3).toBeCloseTo(r.volumeCm3, 6);
    expect(r.infillCm3).toBe(0);
    expect(r.materialCm3).toBeCloseTo(r.volumeCm3, 6);
  });

  it('Materialbedarf liegt nie über dem Massivgewicht', () => {
    for (const wall of [0.4, 0.8, 1.2, 2, 5]) {
      for (const infill of [0, 15, 50, 100]) {
        const r = estimateCost({ ...base, wall, infill });
        expect(r.weight).toBeLessThanOrEqual(r.solidWeight + 1e-9);
      }
    }
  });
});

describe('fitsBuildVolume', () => {
  const bed: [number, number, number] = [220, 220, 250];

  it('erkennt, wenn das Modell direkt passt', () => {
    const r = fitsBuildVolume([100, 100, 100], bed);
    expect(r).toEqual({ fits: true, fitsAsIs: true, overshoot: 0 });
  });

  it('erkennt, dass eine 90°-Drehung hilft', () => {
    // 240 passt nicht in 220, wohl aber in die 250er Höhe
    const r = fitsBuildVolume([240, 100, 100], bed);
    expect(r.fits).toBe(true);
    expect(r.fitsAsIs).toBe(false);
  });

  it('erkennt zu große Modelle und nennt die Überschreitung', () => {
    const r = fitsBuildVolume([300, 100, 100], bed);
    expect(r.fits).toBe(false);
    expect(r.overshoot).toBeCloseTo(50, 6);
  });

  it('akzeptiert ein exakt passendes Modell', () => {
    expect(fitsBuildVolume([220, 220, 250], bed).fits).toBe(true);
  });
});

describe('filamentLength', () => {
  it('rechnet Volumen in Filamentlänge um (1,75 mm)', () => {
    const areaCm2 = Math.PI * (0.175 / 2) ** 2;
    expect(filamentLength(areaCm2 * 100, 1.75)).toBeCloseTo(1, 6); // 1 m
  });

  it('braucht bei 2,85 mm weniger Länge für dasselbe Volumen', () => {
    expect(filamentLength(20, 2.85)).toBeLessThan(filamentLength(20, 1.75));
  });
});
