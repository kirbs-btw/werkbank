/**
 * Netze verschieben, drehen, skalieren, spiegeln – und Strecken darin messen.
 *
 * Alle Funktionen arbeiten auf dem flachen Dreieck-Array (9 Werte je Dreieck)
 * und geben ein neues Array zurück; die Eingabe bleibt unangetastet. Das macht
 * die Kette im Browser einfach: Original behalten, Transformationen bei jeder
 * Änderung neu darauf anwenden. Kein Fehler summiert sich auf.
 */

import { meshBounds, type Vec3, type MeshBounds } from './viewer3d';

export type Achse = 'x' | 'y' | 'z';

/** Position der Achse im Koordinaten-Tripel. */
export const ACHS_INDEX: Record<Achse, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

/**
 * Wendet eine lineare Abbildung (3×3, zeilenweise) plus Verschiebung auf jeden
 * Punkt an.
 *
 * Der wichtige Teil steckt am Ende: Bei negativer Determinante – also beim
 * Spiegeln oder einer negativen Skalierung – kehrt sich der Umlaufsinn jedes
 * Dreiecks um. Die Normalen zeigten danach nach innen; ein Slicer hielte das
 * Modell für hohl und die Umgebung für Material. Deshalb werden zwei Ecken
 * getauscht, sobald die Determinante negativ ist.
 */
export function applyLinear(
  triangles: ArrayLike<number>,
  m: ArrayLike<number>,
  t: readonly [number, number, number] = [0, 0, 0],
): Float64Array {
  const n = Math.floor(triangles.length / 9) * 9;
  const out = new Float64Array(n);
  const det =
    m[0] * (m[4] * m[8] - m[5] * m[7]) -
    m[1] * (m[3] * m[8] - m[5] * m[6]) +
    m[2] * (m[3] * m[7] - m[4] * m[6]);
  const spiegelt = det < 0;

  for (let i = 0; i < n; i += 9) {
    // Ecken erst abbilden, dann – falls gespiegelt – zwei davon tauschen.
    const ecken: number[][] = [];
    for (let e = 0; e < 3; e++) {
      const x = triangles[i + e * 3];
      const y = triangles[i + e * 3 + 1];
      const z = triangles[i + e * 3 + 2];
      ecken.push([
        m[0] * x + m[1] * y + m[2] * z + t[0],
        m[3] * x + m[4] * y + m[5] * z + t[1],
        m[6] * x + m[7] * y + m[8] * z + t[2],
      ]);
    }
    if (spiegelt) {
      const h = ecken[1];
      ecken[1] = ecken[2];
      ecken[2] = h;
    }
    for (let e = 0; e < 3; e++) {
      out[i + e * 3] = ecken[e][0];
      out[i + e * 3 + 1] = ecken[e][1];
      out[i + e * 3 + 2] = ecken[e][2];
    }
  }
  return out;
}

/** Verschiebt das Netz. */
export function moveMesh(triangles: ArrayLike<number>, dx: number, dy: number, dz: number): Float64Array {
  return applyLinear(triangles, [1, 0, 0, 0, 1, 0, 0, 0, 1], [dx, dy, dz]);
}

/**
 * Skaliert um den eigenen Mittelpunkt, damit das Teil beim Ändern nicht
 * davonwandert. Ohne Angabe von `sy`/`sz` wird gleichmäßig skaliert.
 */
export function scaleMesh(
  triangles: ArrayLike<number>,
  sx: number,
  sy = sx,
  sz = sx,
): Float64Array {
  const c = meshBounds(triangles).center;
  return applyLinear(
    triangles,
    [sx, 0, 0, 0, sy, 0, 0, 0, sz],
    [c.x - sx * c.x, c.y - sy * c.y, c.z - sz * c.z],
  );
}

/**
 * Dreht um eine Achse durch den Mittelpunkt des Netzes. Um den Mittelpunkt,
 * nicht um den Ursprung: Sonst schwingt ein Teil, das weit vom Nullpunkt liegt,
 * beim Drehen quer durch den Bauraum.
 */
export function rotateMesh(triangles: ArrayLike<number>, achse: Achse, grad: number): Float64Array {
  const r = (grad * Math.PI) / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  const m =
    achse === 'x'
      ? [1, 0, 0, 0, c, -s, 0, s, c]
      : achse === 'y'
        ? [c, 0, s, 0, 1, 0, -s, 0, c]
        : [c, -s, 0, s, c, 0, 0, 0, 1];
  const p = meshBounds(triangles).center;
  return applyLinear(triangles, m, [
    p.x - (m[0] * p.x + m[1] * p.y + m[2] * p.z),
    p.y - (m[3] * p.x + m[4] * p.y + m[5] * p.z),
    p.z - (m[6] * p.x + m[7] * p.y + m[8] * p.z),
  ]);
}

/** Spiegelt an der Mittelebene senkrecht zur Achse – etwa für ein Gegenstück. */
export function mirrorMesh(triangles: ArrayLike<number>, achse: Achse): Float64Array {
  const c = meshBounds(triangles).center;
  const m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const i = ACHS_INDEX[achse];
  m[i * 4] = -1;
  const t: [number, number, number] = [0, 0, 0];
  t[i] = 2 * (i === 0 ? c.x : i === 1 ? c.y : c.z);
  return applyLinear(triangles, m, t);
}

/**
 * Legt das Netz auf die Bauplatte: tiefster Punkt auf z = 0, Grundfläche über
 * dem Ursprung zentriert. Das ist der Griff, den man nach jedem Schnitt und
 * jeder Drehung braucht – sonst schwebt das Teil im Slicer.
 */
export function layOnPlate(triangles: ArrayLike<number>, zentrieren = true): Float64Array {
  const b = meshBounds(triangles);
  return moveMesh(triangles, zentrieren ? -b.center.x : 0, zentrieren ? -b.center.y : 0, -b.min.z);
}

/**
 * Faktor, mit dem eine Achse genau das Zielmaß erreicht. Genau dieser Schritt
 * fehlt in den meisten Slicern: Die kennen nur Prozent, gefragt ist aber
 * „mach das Teil exakt 100 mm lang".
 */
export function scaleFactorForSize(bounds: MeshBounds, achse: Achse, zielMm: number): number {
  const ist = achse === 'x' ? bounds.size.x : achse === 'y' ? bounds.size.y : bounds.size.z;
  if (!(ist > 0) || !(zielMm > 0)) return 1;
  return zielMm / ist;
}

/**
 * Summe aller Dreiecks-Flächenvektoren. Bei einem geschlossenen, einheitlich
 * gewickelten Netz ist sie exakt null – jede Fläche wird von einer entgegen
 * gerichteten aufgehoben.
 *
 * Das ist die schärfere Schwester der Kantenzählung: Die prüft, ob jede Kante
 * genau zweimal vorkommt, sortiert die Endpunkte dabei aber weg und übersieht
 * deshalb **verdrehte Flächen**. Ein Netz mit falsch gewickelter Fläche gilt
 * ihr als dicht. Genau daran hing die Verschiebungsinvarianz von `meshVolume`:
 * Nur bei Vektorfläche null liefert dieselbe Geometrie an zwei Orten dasselbe
 * Volumen.
 *
 * Als Maßstab dient die Gesamtoberfläche – ein Rest von 0,1 % daran ist
 * Rundung, ein Rest von 20 % ist eine verdrehte Wand.
 */
export function vectorArea(triangles: ArrayLike<number>): { x: number; y: number; z: number; area: number } {
  let ax = 0;
  let ay = 0;
  let az = 0;
  let area = 0;
  for (let i = 0; i + 8 < triangles.length; i += 9) {
    const ux = triangles[i + 3] - triangles[i];
    const uy = triangles[i + 4] - triangles[i + 1];
    const uz = triangles[i + 5] - triangles[i + 2];
    const vx = triangles[i + 6] - triangles[i];
    const vy = triangles[i + 7] - triangles[i + 1];
    const vz = triangles[i + 8] - triangles[i + 2];
    const cx = uy * vz - uz * vy;
    const cy = uz * vx - ux * vz;
    const cz = ux * vy - uy * vx;
    ax += cx;
    ay += cy;
    az += cz;
    area += Math.hypot(cx, cy, cz);
  }
  return { x: ax / 2, y: ay / 2, z: az / 2, area: area / 2 };
}

/** Anteil der offenen Vektorfläche an der Gesamtfläche – 0 heißt sauber geschlossen. */
export function closureError(triangles: ArrayLike<number>): number {
  const a = vectorArea(triangles);
  if (!(a.area > 0)) return 0;
  return Math.hypot(a.x, a.y, a.z) / a.area;
}

/** Halbgerade im Raum. */
export interface Ray {
  origin: Vec3;
  dir: Vec3;
}

/** Treffer eines Strahls auf dem Netz. */
export interface Hit {
  point: Vec3;
  distance: number;
  /** Index des getroffenen Dreiecks. */
  triangle: number;
}

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
function norm(v: Vec3): Vec3 {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

/**
 * Strahl durch ein Bildschirmpixel, aufgebaut aus der Kamerabasis. Der Umweg
 * über eine invertierte Matrix ist unnötig: Blickrichtung, Rechts- und
 * Hochachse ergeben den Strahl direkt.
 *
 * `px`/`py` zählen von der linken oberen Ecke des Bildbereichs.
 */
export function pixelRay(
  px: number,
  py: number,
  width: number,
  height: number,
  fovY: number,
  eye: Vec3,
  target: Vec3,
  up: Vec3 = { x: 0, y: 0, z: 1 },
): Ray {
  const f = norm(sub(target, eye)); // Blickrichtung
  let s = cross(f, up);
  if (Math.hypot(s.x, s.y, s.z) < 1e-9) s = { x: 1, y: 0, z: 0 }; // senkrecht von oben
  s = norm(s);
  const u = cross(s, f); // echte Hochachse der Kamera

  const aspect = height > 0 ? width / height : 1;
  const tan = Math.tan(fovY / 2);
  const ndcX = width > 0 ? (px / width) * 2 - 1 : 0;
  const ndcY = height > 0 ? 1 - (py / height) * 2 : 0;
  const a = ndcX * aspect * tan;
  const b = ndcY * tan;

  return {
    origin: { ...eye },
    dir: norm({
      x: f.x + a * s.x + b * u.x,
      y: f.y + a * s.y + b * u.y,
      z: f.z + a * s.z + b * u.z,
    }),
  };
}

/**
 * Nächster Schnittpunkt des Strahls mit dem Netz (Möller–Trumbore).
 *
 * Bewusst ohne Rückseiten-Aussortierung: Wer in eine Öffnung hineinklickt, will
 * die Innenwand treffen, und beim Messen an einem aufgeschnittenen Modell zeigt
 * die getroffene Fläche oft vom Betrachter weg.
 */
export function rayMesh(triangles: ArrayLike<number>, ray: Ray): Hit | null {
  const EPS = 1e-9;
  let best: Hit | null = null;
  const o = ray.origin;
  const d = ray.dir;

  for (let i = 0; i + 8 < triangles.length; i += 9) {
    const v0 = { x: triangles[i], y: triangles[i + 1], z: triangles[i + 2] };
    const e1 = { x: triangles[i + 3] - v0.x, y: triangles[i + 4] - v0.y, z: triangles[i + 5] - v0.z };
    const e2 = { x: triangles[i + 6] - v0.x, y: triangles[i + 7] - v0.y, z: triangles[i + 8] - v0.z };
    const p = cross(d, e2);
    const det = dot(e1, p);
    if (Math.abs(det) < EPS) continue; // Strahl liegt in der Dreiecksebene
    const inv = 1 / det;
    const tv = sub(o, v0);
    const u = dot(tv, p) * inv;
    if (u < -EPS || u > 1 + EPS) continue;
    const q = cross(tv, e1);
    const v = dot(d, q) * inv;
    if (v < -EPS || u + v > 1 + EPS) continue;
    const dist = dot(e2, q) * inv;
    if (dist <= EPS) continue; // hinter der Kamera
    if (!best || dist < best.distance) {
      best = {
        distance: dist,
        point: { x: o.x + d.x * dist, y: o.y + d.y * dist, z: o.z + d.z * dist },
        triangle: i / 9,
      };
    }
  }
  return best;
}

/**
 * Kleine Oktaeder an den übergebenen Punkten – die sichtbaren Messmarken.
 *
 * Bewusst als gewöhnliche Geometrie und nicht als Sonderfall im Renderer: So
 * zeichnet der Viewer die Marken mit demselben Weg wie das Modell, und sie
 * lassen sich hier ohne WebGL prüfen.
 */
export function markerMesh(points: readonly Vec3[], size: number): Float64Array {
  const out: number[] = [];
  for (const p of points) {
    const v: Vec3[] = [
      { x: p.x + size, y: p.y, z: p.z },
      { x: p.x - size, y: p.y, z: p.z },
      { x: p.x, y: p.y + size, z: p.z },
      { x: p.x, y: p.y - size, z: p.z },
      { x: p.x, y: p.y, z: p.z + size },
      { x: p.x, y: p.y, z: p.z - size },
    ];
    const f: [number, number, number][] = [
      [0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4],
      [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5],
    ];
    for (const [a, b, c] of f) out.push(v[a].x, v[a].y, v[a].z, v[b].x, v[b].y, v[b].z, v[c].x, v[c].y, v[c].z);
  }
  return new Float64Array(out);
}

/** Dünner dreikantiger Steg von a nach b – die sichtbare Messstrecke. */
export function lineMesh(a: Vec3, b: Vec3, radius: number): Float64Array {
  const d = sub(b, a);
  const len = Math.hypot(d.x, d.y, d.z);
  if (!(len > 0) || !(radius > 0)) return new Float64Array(0);
  const f = norm(d);
  // Irgendeine Achse, die nicht parallel zur Strecke liegt
  const hilf: Vec3 = Math.abs(f.z) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 };
  const s = norm(cross(f, hilf));
  const u = cross(f, s);

  const ring = (p: Vec3): Vec3[] =>
    [0, 1, 2].map((i) => {
      const w = (i * 2 * Math.PI) / 3;
      const c = Math.cos(w) * radius;
      const t = Math.sin(w) * radius;
      return { x: p.x + c * s.x + t * u.x, y: p.y + c * s.y + t * u.y, z: p.z + c * s.z + t * u.z };
    });
  const r0 = ring(a);
  const r1 = ring(b);
  const out: number[] = [];
  const tri = (p: Vec3, q: Vec3, r: Vec3) => out.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3;
    tri(r0[i], r1[i], r1[j]);
    tri(r0[i], r1[j], r0[j]);
  }
  tri(r0[0], r0[2], r0[1]); // Deckel, damit der Steg ein geschlossener Körper bleibt
  tri(r1[0], r1[1], r1[2]);
  return new Float64Array(out);
}

/** Abstand zweier Punkte samt Einzelachsen – die Achswerte sind beim Messen oft
 *  die eigentlich gesuchte Zahl (Lochabstand in x, Höhe in z). */
export function measure(a: Vec3, b: Vec3): { dist: number; dx: number; dy: number; dz: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return { dist: Math.hypot(dx, dy, dz), dx, dy, dz };
}
