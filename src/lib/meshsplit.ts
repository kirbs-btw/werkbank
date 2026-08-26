/**
 * Netz an einer Ebene teilen – die Antwort auf „Modell passt nicht auf den Drucker".
 * Pure Funktionen ohne DOM, damit server- und clientseitig identisch und testbar.
 *
 * Ablauf:
 *   1. Jedes Dreieck an der Ebene beschneiden (Sutherland-Hodgman), einmal für
 *      jede Seite. Dabei die Schnittstrecken einsammeln.
 *   2. Die Strecken zu geschlossenen Ringen verketten.
 *   3. Ringe in die Ebene projizieren, Außenränder von Löchern trennen
 *      (ein Ring in ungerader Verschachtelungstiefe ist ein Loch).
 *   4. Löcher über Brücken in den Außenrand einfügen und das entstandene
 *      einfache Polygon per Ear-Clipping triangulieren.
 *   5. Die Deckfläche beiden Hälften mit jeweils passender Ausrichtung geben.
 *
 * Schritt 3 und 4 sind der Grund, warum das Werkzeug auch mit hohlen Modellen
 * umgeht: Ein aufgeschnittener Behälter liefert einen Außen- und einen Innenring.
 */

export interface Plane {
  /** Normale, muss nicht normiert sein. */
  nx: number;
  ny: number;
  nz: number;
  /** Ebene ist die Menge aller p mit n·p = d. */
  d: number;
}

export interface SplitStats {
  /** Dreiecke je Hälfte, inklusive Deckfläche. */
  aboveTriangles: number;
  belowTriangles: number;
  /** Anzahl geschlossener Schnittkurven. */
  loops: number;
  /** Ringe, die sich nicht schließen ließen (Hinweis auf ein löchriges Netz). */
  openLoops: number;
  /** Dreiecke der Deckfläche je Hälfte. */
  capTriangles: number;
  warnings: string[];
}

export interface SplitResult {
  above: Float64Array;
  below: Float64Array;
  stats: SplitStats;
}

interface V3 {
  x: number;
  y: number;
  z: number;
}
interface V2 {
  x: number;
  y: number;
}

const lerp = (a: V3, b: V3, t: number): V3 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  z: a.z + (b.z - a.z) * t,
});

/* ---------------- Ringe aus Strecken ---------------- */

/**
 * Verkettet lose Strecken zu geschlossenen Ringen. Endpunkte werden gerastert
 * verglichen, weil die Schnittpunkte aus Fließkommarechnung stammen und sonst
 * um Nanometer verfehlen.
 */
export function chainSegments(
  segments: [V3, V3][],
  tolerance: number,
): { loops: V3[][]; open: number } {
  const q = (p: V3) =>
    `${Math.round(p.x / tolerance)},${Math.round(p.y / tolerance)},${Math.round(p.z / tolerance)}`;
  const buckets = new Map<string, { seg: [V3, V3]; used: boolean }[]>();
  const entries = segments.map((seg) => ({ seg, used: false }));
  for (const e of entries) {
    for (const p of e.seg) {
      const k = q(p);
      const list = buckets.get(k);
      if (list) list.push(e);
      else buckets.set(k, [e]);
    }
  }

  const loops: V3[][] = [];
  let open = 0;
  for (const start of entries) {
    if (start.used) continue;
    start.used = true;
    const loop: V3[] = [start.seg[0], start.seg[1]];
    let ende = start.seg[1];
    let geschlossen = false;
    // Höchstens so viele Schritte wie Strecken – schützt vor Endlosschleifen
    for (let guard = 0; guard <= entries.length; guard++) {
      if (q(ende) === q(loop[0])) {
        geschlossen = true;
        break;
      }
      const kandidaten = buckets.get(q(ende)) ?? [];
      const next = kandidaten.find((e) => !e.used);
      if (!next) break;
      next.used = true;
      const [a, b] = next.seg;
      const weiter = q(a) === q(ende) ? b : a;
      loop.push(weiter);
      ende = weiter;
    }
    if (geschlossen && loop.length >= 3) {
      loop.pop(); // letzter Punkt entspricht dem ersten
      loops.push(loop);
    } else {
      open++;
    }
  }
  return { loops, open };
}

/* ---------------- Polygon-Triangulierung ---------------- */

const area2 = (poly: V2[]): number => {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s;
};

const inTriangle = (p: V2, a: V2, b: V2, c: V2): boolean => {
  const d1 = (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
  const d2 = (p.x - c.x) * (b.y - c.y) - (b.x - c.x) * (p.y - c.y);
  const d3 = (p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
};

/** Punkt in Polygon (Strahlverfahren). */
export function pointInPolygon(p: V2, poly: V2[]): boolean {
  let drin = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) drin = !drin;
  }
  return drin;
}

/**
 * Ear-Clipping für ein einfaches Polygon. Gibt Indextripel zurück.
 *
 * Wichtig für überbrückte Polygone: Brücken erzeugen bewusst **doppelte Punkte**
 * (Anfang und Ende der Brücke). Beim Ohr-Test dürfen die deshalb nicht nur über
 * ihren Index ausgeschlossen werden, sondern müssen über ihre Lage verglichen
 * werden – sonst blockiert jeder Doppelpunkt jedes Ohr und es entsteht nichts.
 */
export function earClip(poly: V2[]): [number, number, number][] {
  const n = poly.length;
  if (n < 3) return [];
  const idx = poly.map((_, i) => i);
  if (area2(poly) < 0) idx.reverse(); // gegen den Uhrzeigersinn arbeiten

  let spanne = 0;
  for (const p of poly) spanne = Math.max(spanne, Math.abs(p.x), Math.abs(p.y));
  const TOL = Math.max(spanne, 1) * 1e-9;
  const gleich = (p: V2, q: V2) => Math.abs(p.x - q.x) <= TOL && Math.abs(p.y - q.y) <= TOL;

  const out: [number, number, number][] = [];
  let guard = idx.length * idx.length + 16;
  while (idx.length > 3 && guard-- > 0) {
    let geschnitten = false;
    for (let i = 0; i < idx.length; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length];
      const ib = idx[i];
      const ic = idx[(i + 1) % idx.length];
      const a = poly[ia];
      const b = poly[ib];
      const c = poly[ic];
      // konvexe Ecke?
      if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) <= 0) continue;
      // kein anderer Punkt darf im Ohr liegen
      let frei = true;
      for (const k of idx) {
        if (k === ia || k === ib || k === ic) continue;
        const p = poly[k];
        if (gleich(p, a) || gleich(p, b) || gleich(p, c)) continue; // Brückenpunkt
        if (inTriangle(p, a, b, c)) {
          frei = false;
          break;
        }
      }
      if (!frei) continue;
      out.push([ia, ib, ic]);
      idx.splice(i, 1);
      geschnitten = true;
      break;
    }
    if (!geschnitten) break; // entartetes Polygon – Rest verwerfen statt zu hängen
  }
  if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
  return out;
}

/**
 * Fügt Löcher über Brücken in den Außenrand ein, sodass ein einfaches Polygon
 * entsteht. Klassisches Verfahren: vom rechtesten Punkt des Lochs nach rechts
 * strahlen, die getroffene Kante suchen und dorthin eine doppelte Kante ziehen.
 */
export function bridgeHoles(outer: V2[], holes: V2[][]): V2[] {
  let poly = outer.slice();
  if (area2(poly) < 0) poly.reverse();
  const sortiert = holes
    .map((h) => (area2(h) > 0 ? h.slice().reverse() : h.slice()))
    .sort((a, b) => Math.max(...b.map((p) => p.x)) - Math.max(...a.map((p) => p.x)));

  for (const hole of sortiert) {
    let mi = 0;
    for (let i = 1; i < hole.length; i++) if (hole[i].x > hole[mi].x) mi = i;
    const M = hole[mi];

    // Nächste Kante rechts von M suchen
    let bestT = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      if (a.y > M.y === b.y > M.y) continue;
      const t = a.x + ((M.y - a.y) / (b.y - a.y)) * (b.x - a.x);
      if (t >= M.x - 1e-9 && t - M.x < bestT) {
        bestT = t - M.x;
        bestIdx = a.x > b.x ? i : (i + 1) % poly.length;
      }
    }
    if (bestIdx < 0) {
      // Kein Partner gefunden – Loch anhängen, statt es zu verlieren
      bestIdx = 0;
      for (let i = 1; i < poly.length; i++) if (poly[i].x > poly[bestIdx].x) bestIdx = i;
    }

    const eingefuegt = [
      poly[bestIdx],
      ...hole.slice(mi),
      ...hole.slice(0, mi),
      hole[mi],
    ];
    poly = [...poly.slice(0, bestIdx + 1), ...eingefuegt.slice(1), ...poly.slice(bestIdx)];
  }
  return poly;
}

/* ---------------- Teilen ---------------- */

export function splitMesh(triangles: ArrayLike<number>, plane: Plane): SplitResult {
  const len = Math.hypot(plane.nx, plane.ny, plane.nz) || 1;
  const nx = plane.nx / len;
  const ny = plane.ny / len;
  const nz = plane.nz / len;
  const d = plane.d / len;
  const warnings: string[] = [];

  // Toleranz an die Modellgröße koppeln – feste Werte versagen bei sehr großen
  // oder sehr kleinen Modellen.
  let maxAbs = 1;
  for (let i = 0; i < triangles.length; i++) {
    const v = Math.abs(triangles[i]);
    if (v > maxAbs) maxAbs = v;
  }
  const EPS = maxAbs * 1e-9;
  const CHAIN_TOL = Math.max(maxAbs * 1e-7, 1e-9);

  const above: number[] = [];
  const below: number[] = [];
  const segments: [V3, V3][] = [];

  const push = (target: number[], a: V3, b: V3, c: V3): void => {
    target.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  const fan = (target: number[], poly: V3[]): void => {
    for (let i = 1; i + 1 < poly.length; i++) push(target, poly[0], poly[i], poly[i + 1]);
  };

  for (let i = 0; i + 8 < triangles.length; i += 9) {
    const v: V3[] = [
      { x: triangles[i], y: triangles[i + 1], z: triangles[i + 2] },
      { x: triangles[i + 3], y: triangles[i + 4], z: triangles[i + 5] },
      { x: triangles[i + 6], y: triangles[i + 7], z: triangles[i + 8] },
    ];
    const s = v.map((p) => nx * p.x + ny * p.y + nz * p.z - d);

    if (s[0] >= -EPS && s[1] >= -EPS && s[2] >= -EPS) {
      push(above, v[0], v[1], v[2]);
      continue;
    }
    if (s[0] <= EPS && s[1] <= EPS && s[2] <= EPS) {
      push(below, v[0], v[1], v[2]);
      continue;
    }

    // Beschneiden für beide Seiten
    for (const oben of [true, false]) {
      const poly: V3[] = [];
      for (let k = 0; k < 3; k++) {
        const sc = oben ? s[k] : -s[k];
        const sn = oben ? s[(k + 1) % 3] : -s[(k + 1) % 3];
        if (sc >= -EPS) poly.push(v[k]);
        if ((sc > EPS && sn < -EPS) || (sc < -EPS && sn > EPS)) {
          poly.push(lerp(v[k], v[(k + 1) % 3], sc / (sc - sn)));
        }
      }
      if (poly.length >= 3) fan(oben ? above : below, poly);
    }

    // Schnittstrecke einsammeln
    const cuts: V3[] = [];
    for (let k = 0; k < 3; k++) {
      const a = s[k];
      const b = s[(k + 1) % 3];
      if (Math.abs(a) <= EPS) cuts.push(v[k]);
      else if ((a > EPS && b < -EPS) || (a < -EPS && b > EPS)) {
        cuts.push(lerp(v[k], v[(k + 1) % 3], a / (a - b)));
      }
    }
    if (cuts.length >= 2) {
      const p0 = cuts[0];
      const p1 = cuts.find((p) => Math.hypot(p.x - p0.x, p.y - p0.y, p.z - p0.z) > CHAIN_TOL);
      if (p1) segments.push([p0, p1]);
    }
  }

  /* --- Deckfläche --- */
  const { loops, open } = chainSegments(segments, CHAIN_TOL);
  let capTriangles = 0;

  if (loops.length > 0) {
    // Orthonormale Basis in der Ebene, um in 2D zu rechnen
    const helper = Math.abs(nz) < 0.9 ? { x: 0, y: 0, z: 1 } : { x: 1, y: 0, z: 0 };
    let ux = ny * helper.z - nz * helper.y;
    let uy = nz * helper.x - nx * helper.z;
    let uz = nx * helper.y - ny * helper.x;
    const ul = Math.hypot(ux, uy, uz) || 1;
    ux /= ul; uy /= ul; uz /= ul;
    const vx = ny * uz - nz * uy;
    const vy = nz * ux - nx * uz;
    const vz = nx * uy - ny * ux;
    const to2 = (p: V3): V2 => ({ x: p.x * ux + p.y * uy + p.z * uz, y: p.x * vx + p.y * vy + p.z * vz });

    const flach = loops.map((l) => l.map(to2));
    // Verschachtelungstiefe bestimmt, was Loch ist
    const tiefe = flach.map((l, i) =>
      flach.reduce((n2, andere, j) => (i !== j && pointInPolygon(l[0], andere) ? n2 + 1 : n2), 0),
    );

    const gruppen: { outer: number; holes: number[] }[] = [];
    flach.forEach((_, i) => {
      if (tiefe[i] % 2 === 0) gruppen.push({ outer: i, holes: [] });
    });
    flach.forEach((l, i) => {
      if (tiefe[i] % 2 === 0) return;
      // kleinster umschließender Außenring
      let best = -1;
      let bestFlaeche = Infinity;
      for (const g of gruppen) {
        if (!pointInPolygon(l[0], flach[g.outer])) continue;
        const f = Math.abs(area2(flach[g.outer]));
        if (f < bestFlaeche) {
          bestFlaeche = f;
          best = g.outer;
        }
      }
      const ziel = gruppen.find((g) => g.outer === best);
      if (ziel) ziel.holes.push(i);
      else gruppen.push({ outer: i, holes: [] });
    });

    for (const g of gruppen) {
      const outer2 = flach[g.outer];
      const outer3 = loops[g.outer];
      const holes2 = g.holes.map((h) => flach[h]);
      const holes3 = g.holes.map((h) => loops[h]);

      // 2D-Punkte auf ihre 3D-Urbilder zurückführen
      const karte = new Map<string, V3>();
      const key = (p: V2) => `${Math.round(p.x / CHAIN_TOL)},${Math.round(p.y / CHAIN_TOL)}`;
      outer2.forEach((p, i) => karte.set(key(p), outer3[i]));
      holes2.forEach((h, hi) => h.forEach((p, i) => karte.set(key(p), holes3[hi][i])));

      const merged = holes2.length > 0 ? bridgeHoles(outer2, holes2) : outer2;
      const tris = earClip(merged);
      for (const [a, b, c] of tris) {
        const pa = karte.get(key(merged[a]));
        const pb = karte.get(key(merged[b]));
        const pc = karte.get(key(merged[c]));
        if (!pa || !pb || !pc) continue;
        // Ear-Clipping liefert gegen den Uhrzeigersinn in (u,v) – die Normale
        // zeigt damit in +n. Für die untere Hälfte ist das die Oberseite,
        // für die obere Hälfte muss sie gespiegelt werden.
        push(below, pa, pb, pc);
        push(above, pa, pc, pb);
        capTriangles++;
      }
    }
  }

  if (open > 0) {
    warnings.push(
      `${open} Schnittkurve${open === 1 ? '' : 'n'} ließ${open === 1 ? '' : 'en'} sich nicht schließen – das Netz hat vermutlich Löcher. Die Hälften sind dann an der Schnittfläche offen.`,
    );
  }
  if (loops.length === 0 && (above.length === 0 || below.length === 0)) {
    warnings.push('Die Ebene schneidet das Modell nicht – eine Hälfte bleibt leer.');
  }

  return {
    above: Float64Array.from(above),
    below: Float64Array.from(below),
    stats: {
      aboveTriangles: above.length / 9,
      belowTriangles: below.length / 9,
      loops: loops.length,
      openLoops: open,
      capTriangles,
      warnings,
    },
  };
}

/** Volumen eines geschlossenen Netzes in mm³ (Betrag). */
export function meshVolume(triangles: ArrayLike<number>): number {
  let v6 = 0;
  for (let i = 0; i + 8 < triangles.length; i += 9) {
    const ax = triangles[i], ay = triangles[i + 1], az = triangles[i + 2];
    const bx = triangles[i + 3], by = triangles[i + 4], bz = triangles[i + 5];
    const cx = triangles[i + 6], cy = triangles[i + 7], cz = triangles[i + 8];
    v6 += ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);
  }
  return Math.abs(v6) / 6;
}
