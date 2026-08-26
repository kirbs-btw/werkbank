import { describe, it, expect } from 'vitest';
import {
  applyLinear,
  moveMesh,
  scaleMesh,
  rotateMesh,
  mirrorMesh,
  layOnPlate,
  scaleFactorForSize,
  pixelRay,
  rayMesh,
  measure,
  vectorArea,
  closureError,
  markerMesh,
  lineMesh,
  type Achse,
} from '../src/lib/meshtransform';
import { meshBounds, type Vec3 } from '../src/lib/viewer3d';
import { meshVolume } from '../src/lib/meshsplit';
import { analyzeMesh } from '../src/lib/stl';
import { buildBin } from '../src/lib/gridfinity';

/** Achsenparallele Kiste als geschlossenes Netz, Ecke im Ursprung. */
function box(sx: number, sy: number, sz: number, ox = 0, oy = 0, oz = 0): Float64Array {
  const p = (x: number, y: number, z: number) => [ox + x * sx, oy + y * sy, oz + z * sz];
  const q = [
    [[0, 0, 0], [0, 1, 0], [1, 1, 0], [1, 0, 0]], // unten (−z)
    [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], // oben (+z)
    [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], // −y
    [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], // +x
    [[1, 1, 0], [0, 1, 0], [0, 1, 1], [1, 1, 1]], // +y
    [[0, 1, 0], [0, 0, 0], [0, 0, 1], [0, 1, 1]], // −x
  ];
  const out: number[] = [];
  for (const [a, b, c, d] of q) {
    out.push(...p(a[0], a[1], a[2]), ...p(b[0], b[1], b[2]), ...p(c[0], c[1], c[2]));
    out.push(...p(a[0], a[1], a[2]), ...p(c[0], c[1], c[2]), ...p(d[0], d[1], d[2]));
  }
  return new Float64Array(out);
}

const dicht = (t: ArrayLike<number>) => analyzeMesh(Float64Array.from(t as ArrayLike<number>), 'binary');

describe('Lineare Abbildung', () => {
  it('lässt die Einheitsabbildung das Netz unverändert', () => {
    const w = box(10, 10, 10);
    expect(Array.from(applyLinear(w, [1, 0, 0, 0, 1, 0, 0, 0, 1]))).toEqual(Array.from(w));
  });

  it('kehrt bei negativer Determinante den Umlaufsinn um', () => {
    // Ohne diese Korrektur zeigten nach dem Spiegeln alle Normalen nach innen.
    const w = box(10, 10, 10);
    const gespiegelt = applyLinear(w, [-1, 0, 0, 0, 1, 0, 0, 0, 1]);
    expect(meshVolume(w)).toBeCloseTo(1000, 6);
    expect(meshVolume(gespiegelt)).toBeCloseTo(1000, 6); // positiv, nicht −1000
  });

  it('verarbeitet unvollständige Dreiecke am Ende nicht mit', () => {
    const kaputt = new Float64Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 5, 5]);
    expect(applyLinear(kaputt, [1, 0, 0, 0, 1, 0, 0, 0, 1]).length).toBe(9);
  });

  it('lässt die Eingabe unangetastet', () => {
    const w = box(4, 4, 4);
    const kopie = Float64Array.from(w);
    moveMesh(w, 100, 100, 100);
    expect(Array.from(w)).toEqual(Array.from(kopie));
  });
});

describe('Verschieben', () => {
  it('verschiebt die Grenzen mit', () => {
    const b = meshBounds(moveMesh(box(10, 20, 30), 5, -5, 2));
    expect(b.min).toEqual({ x: 5, y: -5, z: 2 });
    expect(b.max).toEqual({ x: 15, y: 15, z: 32 });
  });

  it('ändert das Volumen nicht', () => {
    expect(meshVolume(moveMesh(box(10, 10, 10), 99, -33, 7))).toBeCloseTo(1000, 6);
  });
});

describe('Skalieren', () => {
  it('verachtfacht bei doppelter Kantenlänge das Volumen', () => {
    expect(meshVolume(scaleMesh(box(10, 10, 10), 2))).toBeCloseTo(8000, 6);
  });

  it('skaliert Achsen einzeln', () => {
    const b = meshBounds(scaleMesh(box(10, 10, 10), 2, 1, 0.5));
    expect(b.size.x).toBeCloseTo(20, 9);
    expect(b.size.y).toBeCloseTo(10, 9);
    expect(b.size.z).toBeCloseTo(5, 9);
  });

  it('hält den Mittelpunkt fest, damit das Teil nicht davonwandert', () => {
    const w = box(10, 10, 10, 50, 50, 50);
    const vorher = meshBounds(w).center;
    const nachher = meshBounds(scaleMesh(w, 3)).center;
    expect(nachher.x).toBeCloseTo(vorher.x, 9);
    expect(nachher.y).toBeCloseTo(vorher.y, 9);
    expect(nachher.z).toBeCloseTo(vorher.z, 9);
  });

  it('kehrt bei negativem Faktor die Normalen nicht um', () => {
    expect(meshVolume(scaleMesh(box(10, 10, 10), -1, 1, 1))).toBeCloseTo(1000, 6);
  });

  it('bleibt dicht', () => {
    expect(dicht(scaleMesh(box(10, 10, 10), 2, 3, 4)).watertight).toBe(true);
  });
});

describe('Zielmaß', () => {
  const b = meshBounds(box(80, 40, 20));

  it('trifft das Zielmaß genau', () => {
    for (const [achse, ziel] of [['x', 100], ['y', 15], ['z', 33.3]] as [Achse, number][]) {
      const f = scaleFactorForSize(b, achse, ziel);
      const s = meshBounds(scaleMesh(box(80, 40, 20), f));
      expect(s.size[achse], achse).toBeCloseTo(ziel, 9);
    }
  });

  it('behält bei gleichmäßiger Skalierung die Seitenverhältnisse', () => {
    const f = scaleFactorForSize(b, 'x', 160);
    const s = meshBounds(scaleMesh(box(80, 40, 20), f));
    expect(s.size.y).toBeCloseTo(80, 9);
    expect(s.size.z).toBeCloseTo(40, 9);
  });

  it('weist unsinnige Werte ab, statt das Netz zu zerstören', () => {
    expect(scaleFactorForSize(b, 'x', 0)).toBe(1);
    expect(scaleFactorForSize(b, 'x', -5)).toBe(1);
    expect(scaleFactorForSize(meshBounds([]), 'x', 10)).toBe(1);
  });
});

describe('Drehen', () => {
  it('tauscht bei 90° um z die x- und y-Ausdehnung', () => {
    const b = meshBounds(rotateMesh(box(10, 30, 50), 'z', 90));
    expect(b.size.x).toBeCloseTo(30, 6);
    expect(b.size.y).toBeCloseTo(10, 6);
    expect(b.size.z).toBeCloseTo(50, 6);
  });

  it('legt ein liegendes Teil mit 90° um x aufrecht', () => {
    const b = meshBounds(rotateMesh(box(10, 30, 50), 'x', 90));
    expect(b.size.y).toBeCloseTo(50, 6);
    expect(b.size.z).toBeCloseTo(30, 6);
  });

  it('erhält Volumen und Dichtheit', () => {
    const g = rotateMesh(box(10, 20, 30), 'y', 37);
    expect(meshVolume(g)).toBeCloseTo(6000, 5);
    expect(dicht(g).watertight).toBe(true);
  });

  it('viermal 90° führt zum Ausgangsnetz zurück', () => {
    let t: ArrayLike<number> = box(10, 30, 50, 7, -3, 2);
    for (let i = 0; i < 4; i++) t = rotateMesh(t, 'z', 90);
    const a = box(10, 30, 50, 7, -3, 2);
    for (let i = 0; i < a.length; i++) expect(t[i]).toBeCloseTo(a[i], 6);
  });

  it('dreht um den Mittelpunkt, nicht um den Ursprung', () => {
    const w = box(10, 10, 10, 200, 200, 0);
    const c = meshBounds(rotateMesh(w, 'z', 45)).center;
    expect(c.x).toBeCloseTo(205, 6);
    expect(c.y).toBeCloseTo(205, 6);
  });
});

describe('Spiegeln', () => {
  it('spiegelt die Geometrie, ohne sie zu verschieben', () => {
    const w = box(10, 20, 30, 5, 5, 5);
    const g = mirrorMesh(w, 'x');
    expect(meshBounds(g).min).toEqual(meshBounds(w).min);
    expect(meshBounds(g).max).toEqual(meshBounds(w).max);
  });

  it('erzeugt ein echtes Gegenstück statt eines eingestülpten Netzes', () => {
    // Keil, damit die Spiegelung überhaupt sichtbar ist
    const keil = new Float64Array([
      0, 0, 0, 10, 0, 0, 0, 10, 0,
      0, 0, 5, 0, 10, 0, 10, 0, 0,
      0, 0, 0, 0, 10, 0, 0, 0, 5,
      0, 0, 0, 0, 0, 5, 10, 0, 0,
    ]);
    const g = mirrorMesh(keil, 'x');
    expect(meshVolume(keil)).toBeGreaterThan(0);
    expect(meshVolume(g)).toBeCloseTo(meshVolume(keil), 6);
    expect(dicht(g).watertight).toBe(true);
  });

  it('zweimal gespiegelt ergibt das Original', () => {
    const w = box(10, 20, 30);
    const zurueck = mirrorMesh(mirrorMesh(w, 'y'), 'y');
    for (let i = 0; i < w.length; i++) expect(zurueck[i]).toBeCloseTo(w[i], 9);
  });

  it('funktioniert auf allen drei Achsen', () => {
    for (const a of ['x', 'y', 'z'] as Achse[]) {
      expect(meshVolume(mirrorMesh(box(10, 10, 10), a)), a).toBeCloseTo(1000, 6);
    }
  });
});

describe('Auf die Bauplatte legen', () => {
  it('setzt den tiefsten Punkt auf null und zentriert die Grundfläche', () => {
    const b = meshBounds(layOnPlate(box(10, 20, 30, 100, -50, 17)));
    expect(b.min.z).toBeCloseTo(0, 9);
    expect(b.center.x).toBeCloseTo(0, 9);
    expect(b.center.y).toBeCloseTo(0, 9);
  });

  it('holt ein schwebendes Teil herunter', () => {
    expect(meshBounds(layOnPlate(box(5, 5, 5, 0, 0, 240))).max.z).toBeCloseTo(5, 9);
  });

  it('kann das Zentrieren auslassen', () => {
    const b = meshBounds(layOnPlate(box(10, 10, 10, 60, 60, 60), false));
    expect(b.min.z).toBeCloseTo(0, 9);
    expect(b.min.x).toBeCloseTo(60, 9);
  });

  it('ändert nichts an einem bereits liegenden, zentrierten Teil', () => {
    const w = layOnPlate(box(10, 10, 10));
    const nochmal = layOnPlate(w);
    for (let i = 0; i < w.length; i++) expect(nochmal[i]).toBeCloseTo(w[i], 9);
  });
});

describe('Kette aus mehreren Schritten', () => {
  it('führt Drehen, Skalieren und Ablegen ohne Schaden hintereinander aus', () => {
    let t: ArrayLike<number> = box(10, 20, 30);
    t = rotateMesh(t, 'x', 90);
    t = scaleMesh(t, 2);
    t = mirrorMesh(t, 'y');
    t = layOnPlate(t);
    const b = meshBounds(t);
    expect(dicht(t).watertight).toBe(true);
    expect(meshVolume(t)).toBeCloseTo(6000 * 8, 4);
    expect(b.min.z).toBeCloseTo(0, 9);
    expect(b.size.z).toBeCloseTo(40, 6); // aus 20 mm y, gedreht und verdoppelt
  });

  it('hält ein echtes hohles Modell dicht', () => {
    const bin = buildBin({ unitsX: 1, unitsY: 1, unitsZ: 3, wall: 1.2, floor: 1.2, compartmentsX: 1, compartmentsY: 1, lip: true, holes: 'keine' });
    let t: ArrayLike<number> = bin.triangles;
    expect(dicht(t).watertight).toBe(true);
    t = rotateMesh(t, 'y', 180);
    t = scaleMesh(t, 1.5);
    t = mirrorMesh(t, 'x');
    t = layOnPlate(t);
    expect(dicht(t).watertight).toBe(true);
    expect(meshVolume(t)).toBeCloseTo(meshVolume(bin.triangles) * 3.375, 2);
  });
});

describe('Geschlossenheit', () => {
  it('ist bei einer geschlossenen Kiste exakt null', () => {
    const a = vectorArea(box(10, 20, 30));
    expect(Math.hypot(a.x, a.y, a.z)).toBeLessThan(1e-9);
    expect(a.area).toBeCloseTo(2 * (200 + 300 + 600), 6);
  });

  it('erkennt eine fehlende Wand', () => {
    const w = box(10, 10, 10);
    expect(closureError(w.subarray(0, w.length - 18))).toBeGreaterThan(0.1);
  });

  it('erkennt eine verdrehte Fläche, die die Kantenzählung durchwinkt', () => {
    // Genau dieser Fall: jede Kante kommt weiterhin zweimal vor, das Netz gilt
    // der Kantenprüfung als dicht – die Vektorfläche zeigt den Fehler trotzdem.
    const w = Float64Array.from(box(10, 10, 10));
    const h = w[0]; w[0] = w[3]; w[3] = h;          // zwei Ecken tauschen
    const h2 = w[1]; w[1] = w[4]; w[4] = h2;
    const h3 = w[2]; w[2] = w[5]; w[5] = h3;
    expect(dicht(w).watertight).toBe(true);          // Kantenzählung sieht nichts
    expect(closureError(w)).toBeGreaterThan(0.05);   // die Vektorfläche schon
  });

  it('bleibt unter allen Transformationen null', () => {
    let t: ArrayLike<number> = box(10, 20, 30);
    for (const schritt of [
      () => rotateMesh(t, 'x', 33),
      () => scaleMesh(t, 2, 0.5, 3),
      () => mirrorMesh(t, 'z'),
      () => layOnPlate(t),
    ]) {
      t = schritt();
      expect(closureError(t)).toBeLessThan(1e-12);
    }
  });
});

describe('Strahl durch ein Pixel', () => {
  const eye: Vec3 = { x: 0, y: -100, z: 0 };
  const target: Vec3 = { x: 0, y: 0, z: 0 };
  const fov = Math.PI / 2;

  it('zielt in der Bildmitte genau auf den Blickpunkt', () => {
    const r = pixelRay(200, 100, 400, 200, fov, eye, target);
    expect(r.dir.x).toBeCloseTo(0, 9);
    expect(r.dir.y).toBeCloseTo(1, 9);
    expect(r.dir.z).toBeCloseTo(0, 9);
    expect(r.origin).toEqual(eye);
  });

  it('trifft bei 90° Öffnung am oberen Rand genau 45°', () => {
    const r = pixelRay(200, 0, 400, 200, fov, eye, target);
    expect(Math.atan2(r.dir.z, r.dir.y)).toBeCloseTo(Math.PI / 4, 6);
  });

  it('liefert immer einen Einheitsvektor', () => {
    for (const [x, y] of [[0, 0], [399, 199], [123, 45]]) {
      const d = pixelRay(x, y, 400, 200, fov, eye, target).dir;
      expect(Math.hypot(d.x, d.y, d.z)).toBeCloseTo(1, 9);
    }
  });

  it('bricht beim Blick senkrecht von oben nicht zusammen', () => {
    const r = pixelRay(50, 50, 100, 100, fov, { x: 0, y: 0, z: 50 }, target);
    for (const v of [r.dir.x, r.dir.y, r.dir.z]) expect(Number.isFinite(v)).toBe(true);
    expect(r.dir.z).toBeCloseTo(-1, 6);
  });

  it('vertauscht links und rechts nicht', () => {
    // Blick nach +y mit Hochachse +z: die Rechtsachse der Kamera ist +x.
    // Wäre das Vorzeichen vertauscht, träfe jeder Messklick spiegelverkehrt.
    const links = pixelRay(0, 100, 400, 200, fov, eye, target).dir;
    const rechts = pixelRay(400, 100, 400, 200, fov, eye, target).dir;
    expect(links.x).toBeLessThan(0);
    expect(rechts.x).toBeGreaterThan(0);
  });

  it('zeigt oben im Bild auch nach oben', () => {
    expect(pixelRay(200, 0, 400, 200, fov, eye, target).dir.z).toBeGreaterThan(0);
  });
});

describe('Strahl trifft Netz', () => {
  const w = box(10, 10, 10);

  it('findet den Eintrittspunkt', () => {
    const hit = rayMesh(w, { origin: { x: 5, y: 5, z: 100 }, dir: { x: 0, y: 0, z: -1 } });
    expect(hit).not.toBeNull();
    expect(hit!.point.z).toBeCloseTo(10, 6);
    expect(hit!.distance).toBeCloseTo(90, 6);
  });

  it('nimmt die vordere Fläche, nicht die hintere', () => {
    const hit = rayMesh(w, { origin: { x: -100, y: 5, z: 5 }, dir: { x: 1, y: 0, z: 0 } });
    expect(hit!.point.x).toBeCloseTo(0, 6); // Eintritt, nicht Austritt bei 10
  });

  it('gibt null zurück, wenn nichts getroffen wird', () => {
    expect(rayMesh(w, { origin: { x: 50, y: 50, z: 50 }, dir: { x: 0, y: 0, z: 1 } })).toBeNull();
  });

  it('ignoriert Treffer hinter der Kamera', () => {
    expect(rayMesh(w, { origin: { x: 5, y: 5, z: 100 }, dir: { x: 0, y: 0, z: 1 } })).toBeNull();
  });

  it('trifft auch Rückseiten – sonst ließe sich in Öffnungen nicht messen', () => {
    // Start im Inneren, Blick nach außen: nur die Rückseite liegt voraus
    const hit = rayMesh(w, { origin: { x: 5, y: 5, z: 5 }, dir: { x: 0, y: 0, z: 1 } });
    expect(hit).not.toBeNull();
    expect(hit!.point.z).toBeCloseTo(10, 6);
  });

  it('nennt das getroffene Dreieck', () => {
    const hit = rayMesh(w, { origin: { x: 5, y: 5, z: 100 }, dir: { x: 0, y: 0, z: -1 } });
    expect(hit!.triangle).toBeGreaterThanOrEqual(0);
    expect(hit!.triangle).toBeLessThan(w.length / 9);
  });

  it('trifft ein echtes Modell und liefert einen Punkt auf der Oberfläche', () => {
    const bin = buildBin({ unitsX: 1, unitsY: 1, unitsZ: 3, wall: 1.2, floor: 1.2, compartmentsX: 1, compartmentsY: 1, lip: true, holes: 'keine' });
    const b = meshBounds(bin.triangles);
    const hit = rayMesh(bin.triangles, {
      origin: { x: b.center.x, y: b.center.y, z: b.max.z + 50 },
      dir: { x: 0, y: 0, z: -1 },
    });
    expect(hit).not.toBeNull();
    expect(hit!.point.z).toBeLessThanOrEqual(b.max.z + 1e-6);
    expect(hit!.point.z).toBeGreaterThan(b.min.z);
  });
});

describe('Messen', () => {
  it('liefert Abstand und Einzelachsen', () => {
    const m = measure({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 12 });
    expect(m.dist).toBeCloseTo(13, 9);
    expect([m.dx, m.dy, m.dz]).toEqual([3, 4, 12]);
  });

  it('zeigt die Richtung im Vorzeichen', () => {
    expect(measure({ x: 10, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }).dx).toBe(-6);
  });

  it('ist bei gleichem Punkt null', () => {
    expect(measure({ x: 1, y: 2, z: 3 }, { x: 1, y: 2, z: 3 }).dist).toBe(0);
  });
});

describe('Messmarken', () => {
  it('setzt je Punkt einen geschlossenen Körper', () => {
    const m = markerMesh([{ x: 5, y: 5, z: 5 }], 1);
    expect(m.length / 9).toBe(8); // Oktaeder
    expect(closureError(m)).toBeLessThan(1e-12);
    expect(dicht(m).watertight).toBe(true);
  });

  it('sitzt an der richtigen Stelle und in der richtigen Größe', () => {
    const b = meshBounds(markerMesh([{ x: 10, y: -4, z: 2 }], 0.5));
    expect(b.center.x).toBeCloseTo(10, 9);
    expect(b.center.y).toBeCloseTo(-4, 9);
    expect(b.size.z).toBeCloseTo(1, 9);
  });

  it('verarbeitet mehrere Punkte und die leere Liste', () => {
    expect(markerMesh([{ x: 0, y: 0, z: 0 }, { x: 9, y: 9, z: 9 }], 1).length / 9).toBe(16);
    expect(markerMesh([], 1).length).toBe(0);
  });

  it('spannt den Steg zwischen beiden Punkten auf', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 20 };
    const l = lineMesh(a, b, 0.3);
    const bb = meshBounds(l);
    expect(bb.min.z).toBeCloseTo(0, 9);
    expect(bb.max.z).toBeCloseTo(20, 9);
    expect(bb.size.x).toBeLessThan(0.7);
    expect(closureError(l)).toBeLessThan(1e-12);
  });

  it('kommt mit einer schrägen Strecke zurecht', () => {
    const l = lineMesh({ x: 1, y: 2, z: 3 }, { x: -4, y: 8, z: -2 }, 0.2);
    expect(closureError(l)).toBeLessThan(1e-12);
    for (const v of l) expect(Number.isFinite(v)).toBe(true);
  });

  it('liefert bei entarteter Strecke ein leeres Netz statt NaN', () => {
    expect(lineMesh({ x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }, 0.5).length).toBe(0);
    expect(lineMesh({ x: 0, y: 0, z: 0 }, { x: 5, y: 0, z: 0 }, 0).length).toBe(0);
  });

  it('bleibt auch bei einer Strecke längs z sauber (Hilfsachse wechselt)', () => {
    for (const ziel of [{ x: 0, y: 0, z: 5 }, { x: 5, y: 0, z: 0 }, { x: 0, y: 5, z: 0 }]) {
      const l = lineMesh({ x: 0, y: 0, z: 0 }, ziel, 0.25);
      expect(closureError(l), JSON.stringify(ziel)).toBeLessThan(1e-12);
    }
  });
});
