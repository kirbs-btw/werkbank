import { describe, it, expect } from 'vitest';
import {
  mat4Identity,
  mat4Multiply,
  mat4Translate,
  mat4Perspective,
  mat4LookAt,
  orbitPosition,
  fitDistance,
  meshBounds,
  faceNormals,
  MAX_PITCH,
  type Vec3,
} from '../src/lib/viewer3d';

/** Punkt durch eine Matrix schicken (spaltenweise, mit w-Division). */
function apply(m: Float64Array, p: Vec3): Vec3 & { w: number } {
  const x = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12];
  const y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13];
  const z = m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14];
  const w = m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15];
  return { x, y, z, w };
}
const dist = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

describe('Matrizen', () => {
  it('Einheitsmatrix lässt Punkte unverändert', () => {
    const p = apply(mat4Identity(), { x: 3, y: -4, z: 5 });
    expect([p.x, p.y, p.z, p.w]).toEqual([3, -4, 5, 1]);
  });

  it('Multiplikation mit der Einheitsmatrix ändert nichts', () => {
    const t = mat4Translate(2, 3, 4);
    expect(Array.from(mat4Multiply(t, mat4Identity()))).toEqual(Array.from(t));
    expect(Array.from(mat4Multiply(mat4Identity(), t))).toEqual(Array.from(t));
  });

  it('Verschiebung verschiebt', () => {
    const p = apply(mat4Translate(1, 2, 3), { x: 10, y: 20, z: 30 });
    expect([p.x, p.y, p.z]).toEqual([11, 22, 33]);
  });

  it('Multiplikation wendet die rechte Matrix zuerst an', () => {
    const erst = mat4Translate(1, 0, 0);
    const dann = mat4Translate(0, 10, 0);
    const p = apply(mat4Multiply(dann, erst), { x: 0, y: 0, z: 0 });
    expect([p.x, p.y, p.z]).toEqual([1, 10, 0]);
  });
});

describe('Perspektive', () => {
  const proj = mat4Perspective(Math.PI / 2, 1, 1, 100);

  it('legt einen Punkt in Blickrichtung in die Bildmitte', () => {
    // Kamera schaut in −z; ein Punkt dort landet bei x=y=0
    const p = apply(proj, { x: 0, y: 0, z: -10 });
    expect(p.x / p.w).toBeCloseTo(0, 9);
    expect(p.y / p.w).toBeCloseTo(0, 9);
  });

  it('bildet die nahe und die ferne Ebene auf −1 und +1 ab', () => {
    const nah = apply(proj, { x: 0, y: 0, z: -1 });
    const fern = apply(proj, { x: 0, y: 0, z: -100 });
    expect(nah.z / nah.w).toBeCloseTo(-1, 6);
    expect(fern.z / fern.w).toBeCloseTo(1, 6);
  });

  it('bei 90° Öffnung liegt der Randstrahl genau auf dem Bildrand', () => {
    const p = apply(proj, { x: 10, y: 0, z: -10 });
    expect(p.x / p.w).toBeCloseTo(1, 6);
  });

  it('breitere Fenster stauchen die x-Achse', () => {
    const breit = mat4Perspective(Math.PI / 2, 2, 1, 100);
    const p = apply(breit, { x: 10, y: 0, z: -10 });
    expect(p.x / p.w).toBeCloseTo(0.5, 6);
  });
});

describe('Kameramatrix', () => {
  it('legt das Ziel in die Bildmitte und auf die richtige Tiefe', () => {
    const eye = { x: 0, y: -10, z: 0 };
    const target = { x: 0, y: 0, z: 0 };
    const v = apply(mat4LookAt(eye, target, { x: 0, y: 0, z: 1 }), target);
    expect(v.x).toBeCloseTo(0, 9);
    expect(v.y).toBeCloseTo(0, 9);
    expect(v.z).toBeCloseTo(-10, 9); // Blickrichtung ist −z
  });

  it('behält Abstände bei (reine Drehung und Verschiebung)', () => {
    const m = mat4LookAt({ x: 5, y: -8, z: 3 }, { x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 1 });
    const a = apply(m, { x: 0, y: 0, z: 0 });
    const b = apply(m, { x: 3, y: 4, z: 0 });
    expect(dist(a, b)).toBeCloseTo(5, 9);
  });

  it('bricht nicht, wenn senkrecht von oben geschaut wird', () => {
    // Blickrichtung parallel zur Up-Achse – naiv berechnet gäbe das NaN
    const m = mat4LookAt({ x: 0, y: 0, z: 10 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1 });
    for (const v of m) expect(Number.isFinite(v)).toBe(true);
    const p = apply(m, { x: 0, y: 0, z: 0 });
    expect(p.z).toBeCloseTo(-10, 6);
  });
});

describe('Umlaufkamera', () => {
  it('hält den eingestellten Abstand zum Ziel', () => {
    const target = { x: 2, y: -3, z: 1 };
    for (const yaw of [0, 1, 2.5, -4]) {
      for (const pitch of [-1, 0, 0.5, 1.2]) {
        expect(dist(orbitPosition(yaw, pitch, 7, target), target)).toBeCloseTo(7, 9);
      }
    }
  });

  it('begrenzt die Neigung, damit die Kamera nicht überschlägt', () => {
    const oben = orbitPosition(0, 10, 5, { x: 0, y: 0, z: 0 });
    expect(oben.z).toBeLessThan(5);
    expect(Math.hypot(oben.x, oben.y)).toBeGreaterThan(0);
    expect(MAX_PITCH).toBeLessThan(Math.PI / 2);
  });

  it('positive Neigung hebt die Kamera an', () => {
    const t = { x: 0, y: 0, z: 0 };
    expect(orbitPosition(0, 0.5, 5, t).z).toBeGreaterThan(orbitPosition(0, 0, 5, t).z);
  });

  it('fängt unsinnige Abstände ab', () => {
    const p = orbitPosition(0, 0, 0, { x: 0, y: 0, z: 0 });
    expect(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z)).toBe(true);
  });
});

describe('Einpassen', () => {
  it('größere Modelle brauchen mehr Abstand', () => {
    expect(fitDistance(20, Math.PI / 4, 1)).toBeGreaterThan(fitDistance(5, Math.PI / 4, 1));
  });

  it('das Modell passt tatsächlich ins Bild', () => {
    const fov = Math.PI / 4;
    const r = 10;
    for (const aspect of [0.5, 1, 2.5]) {
      const d = fitDistance(r, fov, aspect);
      // Halber sichtbarer Winkel muss den Kugelrand einschließen
      const halbwinkel = Math.asin(Math.min(1, r / d));
      const engster = Math.min(fov, 2 * Math.atan(Math.tan(fov / 2) * aspect)) / 2;
      expect(halbwinkel, `aspect=${aspect}`).toBeLessThan(engster);
    }
  });

  it('schmale Fenster brauchen mehr Abstand als quadratische', () => {
    expect(fitDistance(10, Math.PI / 4, 0.4)).toBeGreaterThan(fitDistance(10, Math.PI / 4, 1));
  });

  it('liefert auch bei Radius 0 einen brauchbaren Wert', () => {
    expect(fitDistance(0, Math.PI / 4, 1)).toBeGreaterThan(0);
  });
});

describe('Netzgrenzen', () => {
  const wuerfel = new Float64Array([
    0, 0, 0, 10, 0, 0, 10, 10, 0,
    0, 0, 0, 10, 10, 0, 0, 10, 0,
    0, 0, 4, 10, 0, 4, 10, 10, 4,
  ]);

  it('findet Ausdehnung, Mittelpunkt und Radius', () => {
    const b = meshBounds(wuerfel);
    expect(b.min).toEqual({ x: 0, y: 0, z: 0 });
    expect(b.max).toEqual({ x: 10, y: 10, z: 4 });
    expect(b.center).toEqual({ x: 5, y: 5, z: 2 });
    expect(b.size).toEqual({ x: 10, y: 10, z: 4 });
    expect(b.radius).toBeCloseTo(Math.hypot(10, 10, 4) / 2, 9);
  });

  it('liefert bei leerem Netz Nullwerte statt Unendlich', () => {
    const b = meshBounds([]);
    expect(b.radius).toBe(0);
    expect(Number.isFinite(b.center.x)).toBe(true);
  });
});

describe('Flächennormalen', () => {
  it('berechnet die Normale und gibt sie allen drei Ecken', () => {
    // Dreieck in der XY-Ebene, gegen den Uhrzeigersinn → Normale +z
    const t = new Float64Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    const n = faceNormals(t);
    expect(n.length).toBe(9);
    for (let i = 0; i < 9; i += 3) {
      expect(n[i]).toBeCloseTo(0, 6);
      expect(n[i + 1]).toBeCloseTo(0, 6);
      expect(n[i + 2]).toBeCloseTo(1, 6);
    }
  });

  it('dreht sich mit der Umlaufrichtung', () => {
    const n = faceNormals(new Float64Array([0, 0, 0, 0, 1, 0, 1, 0, 0]));
    expect(n[2]).toBeCloseTo(-1, 6);
  });

  it('liefert bei entarteten Dreiecken endliche Werte', () => {
    const n = faceNormals(new Float64Array([0, 0, 0, 0, 0, 0, 0, 0, 0]));
    for (const v of n) expect(Number.isFinite(v)).toBe(true);
  });

  it('alle Normalen sind Einheitsvektoren', () => {
    const t = new Float64Array([0, 0, 0, 3, 1, 2, -1, 4, 5]);
    const n = faceNormals(t);
    // Float32Array, weil die Werte direkt in den GPU-Puffer gehen –
    // mehr als float32-Genauigkeit ist hier weder möglich noch nötig.
    expect(n).toBeInstanceOf(Float32Array);
    expect(Math.hypot(n[0], n[1], n[2])).toBeCloseTo(1, 6);
  });
});
