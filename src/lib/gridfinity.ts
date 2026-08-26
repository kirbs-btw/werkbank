/**
 * Gridfinity-Bin-Generator – erzeugt ein druckfertiges STL-Netz.
 * Pure Funktionen ohne DOM, damit server- und clientseitig identisch und testbar.
 *
 * Alle Maße stammen aus der bemaßten Gridfinity-Spezifikation (System von Zack Freedman,
 * Maßblätter von grizzie17, „Gridfinity Specification", Printables 417152):
 *   Raster 42 mm · Höheneinheit 7 mm · Spiel 0,5 mm (0,25 je Seite)
 *   Fußprofil von unten: 0,8 mm 45° · 1,8 mm gerade · 2,15 mm 45° → 4,75 mm, Versatz 2,95 mm
 *   Eckradien: 3,75 mm oben · 1,6 mm Mitte · 0,8 mm unten
 *   Stapelrand von unten: 0,7 mm 45° · 1,8 mm gerade · 1,9 mm 45° → 4,4 mm, Versatz 2,85 → 0,25 mm
 *   Magnet Ø6,5 × 2,0 mm, Schraube Ø3 mm, Mitte je 4,8 mm von der Fußkante
 * Bins über mehrere Rasterfelder bekommen je Feld einen eigenen Fuß im 42-mm-Abstand.
 *
 * Vernetzung: Das Modell besteht aus mehreren geschlossenen Körpern (Füße, Wandring,
 * Boden, Trennwände), die sich um 0,01 mm überlappen. Slicer vereinigen solche Körper
 * zuverlässig, und durch die Überlappung entstehen keine deckungsgleichen Flächen,
 * die das Netz sonst nicht-mannigfaltig machen würden.
 */

export const GF = {
  GRID: 42,
  HEIGHT_UNIT: 7,
  CLEARANCE: 0.5,
  BASE_HEIGHT: 4.75,
  BASE_INSET: 2.95,
  CORNER_R: 3.75,
  LIP_HEIGHT: 4.4,
  MAGNET_D: 6.5,
  MAGNET_DEPTH: 2,
  SCREW_D: 3,
  SCREW_DEPTH: 6,
  /** Abstand der Bohrungsmitte von der Kante des Fußes (unten 35,6 mm breit). */
  HOLE_INSET: 4.8,
} as const;

/** Fußprofil: waagerechter Versatz je Höhe, von unten. */
const BASE_PROFILE = [
  { inset: 2.95, z: 0 },
  { inset: 2.15, z: 0.8 },
  { inset: 2.15, z: 2.6 },
  { inset: 0, z: 4.75 },
] as const;

/** Stapelrand: Versatz der Innenfläche über der Nennhöhe, von unten. */
const LIP_PROFILE = [
  { inset: 2.85, dz: 0 },
  { inset: 2.15, dz: 0.7 },
  { inset: 2.15, dz: 2.5 },
  { inset: 0.25, dz: 4.4 },
] as const;

export interface BinSpec {
  unitsX: number;
  unitsY: number;
  unitsZ: number;
  wall: number;
  floor: number;
  compartmentsX: number;
  compartmentsY: number;
  lip: boolean;
  holes: 'keine' | 'magnet' | 'magnet-schraube';
  /** Segmente je Eckenrundung (2–24). */
  segments?: number;
}

export interface BinStats {
  size: [number, number, number];
  bodyHeight: number;
  triangles: number;
  volumeCm3: number;
  capacityMl: number;
  compartment: [number, number, number];
  warnings: string[];
}

export interface BinResult {
  triangles: Float64Array;
  stats: BinStats;
}

interface P3 { x: number; y: number; z: number }
interface P2 { x: number; y: number }

const TAU = Math.PI * 2;

/* ---------------- Netz-Bausteine ---------------- */

class Mesh {
  private buf: number[] = [];

  tri(a: P3, b: P3, c: P3): void {
    this.buf.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  }
  quad(a: P3, b: P3, c: P3, d: P3): void {
    this.tri(a, b, c);
    this.tri(a, c, d);
  }
  /**
   * Mantelfläche zwischen zwei gleich langen Schleifen. Bei CCW-Schleifen und
   * zUpper > zLower zeigen die Normalen nach außen; vertauschte z-Werte drehen
   * sie nach innen (für Bohrungen).
   */
  loft(lower: readonly P2[], zLower: number, upper: readonly P2[], zUpper: number): void {
    const n = lower.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      this.quad(
        { ...lower[i], z: zLower },
        { ...lower[j], z: zLower },
        { ...upper[j], z: zUpper },
        { ...upper[i], z: zUpper },
      );
    }
  }
  cap(loop: readonly P2[], z: number, up: boolean): void {
    let sx = 0;
    let sy = 0;
    for (const p of loop) {
      sx += p.x;
      sy += p.y;
    }
    const center = { x: sx / loop.length, y: sy / loop.length, z };
    for (let i = 0; i < loop.length; i++) {
      const a = { ...loop[i], z };
      const b = { ...loop[(i + 1) % loop.length], z };
      if (up) this.tri(center, a, b);
      else this.tri(center, b, a);
    }
  }
  ring(outer: readonly P2[], inner: readonly P2[], z: number, up: boolean): void {
    for (let i = 0; i < outer.length; i++) {
      const j = (i + 1) % outer.length;
      const o1 = { ...outer[i], z };
      const o2 = { ...outer[j], z };
      const i1 = { ...inner[i], z };
      const i2 = { ...inner[j], z };
      if (up) {
        this.tri(i1, o1, o2);
        this.tri(i1, o2, i2);
      } else {
        this.tri(i1, o2, o1);
        this.tri(i1, i2, o2);
      }
    }
  }
  /**
   * Fläche zwischen zwei Schleifen mit unterschiedlicher Punktzahl, die beide
   * sternförmig um `center` liegen. Verwendet ausschließlich vorhandene Punkte –
   * dadurch entstehen keine T-Stöße zu angrenzenden Flächen.
   */
  annulus(center: P2, inner: readonly P2[], outer: readonly P2[], z: number, up: boolean): void {
    const ang = (p: P2): number => {
      const a = Math.atan2(p.y - center.y, p.x - center.x);
      return a < 0 ? a + TAU : a;
    };
    const rotate = (loop: readonly P2[]): P2[] => {
      const a = loop.map(ang);
      let s = 0;
      for (let i = 1; i < a.length; i++) if (a[i] < a[s]) s = i;
      return loop.map((_, i) => loop[(s + i) % loop.length]);
    };
    const I = rotate(inner);
    const O = rotate(outer);
    const IA = I.map(ang);
    const OA = O.map(ang);
    let i = 0;
    let j = 0;
    while (i + j < I.length + O.length) {
      const takeInner = j >= O.length || (i < I.length && IA[i] <= OA[j]);
      const a = takeInner ? I[i] : I[i % I.length];
      const b = takeInner ? O[j % O.length] : O[j];
      const c = takeInner ? I[(i + 1) % I.length] : O[(j + 1) % O.length];
      const A = { ...a, z };
      const B = { ...b, z };
      const C = { ...c, z };
      if (takeInner) {
        if (up) this.tri(A, B, C);
        else this.tri(A, C, B);
        i++;
      } else {
        if (up) this.tri(A, B, C);
        else this.tri(A, C, B);
        j++;
      }
    }
  }
  /** Achsparalleler Quader mit nach außen zeigenden Normalen. */
  box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
    const p = (x: number, y: number, z: number): P3 => ({ x, y, z });
    this.quad(p(x0, y0, z0), p(x0, y1, z0), p(x1, y1, z0), p(x1, y0, z0)); // unten (−z)
    this.quad(p(x0, y0, z1), p(x1, y0, z1), p(x1, y1, z1), p(x0, y1, z1)); // oben (+z)
    this.quad(p(x0, y0, z0), p(x1, y0, z0), p(x1, y0, z1), p(x0, y0, z1)); // vorn (−y)
    this.quad(p(x1, y0, z0), p(x1, y1, z0), p(x1, y1, z1), p(x1, y0, z1)); // rechts (+x)
    this.quad(p(x1, y1, z0), p(x0, y1, z0), p(x0, y1, z1), p(x1, y1, z1)); // hinten (+y)
    this.quad(p(x0, y1, z0), p(x0, y0, z0), p(x0, y0, z1), p(x0, y1, z1)); // links (−x)
  }
  get count(): number {
    return this.buf.length / 9;
  }
  toArray(): Float64Array {
    return Float64Array.from(this.buf);
  }
}

/**
 * Abgerundetes Rechteck als CCW-Schleife. Die Mitte jeder geraden Seite bekommt
 * einen zusätzlichen Punkt, damit die Viertel-Aufteilung der Fußunterseite
 * exakt an dieselben Kanten anschließt.
 */
export function roundedRect(cx: number, cy: number, w: number, h: number, r: number, seg: number): P2[] {
  return roundedRectCorners(cx, cy, w, h, [r, r, r, r], seg);
}

/**
 * Wie `roundedRect`, aber mit einzeln wählbaren Eckradien in der Reihenfolge
 * oben-rechts, oben-links, unten-links, unten-rechts. Die Grundplatte braucht
 * das: Dort sind nur die vier Außenecken der Platte gerundet, die inneren
 * Feldgrenzen dagegen scharf.
 */
export function roundedRectCorners(
  cx: number,
  cy: number,
  w: number,
  h: number,
  radii: [number, number, number, number],
  seg: number,
): P2[] {
  const hw = w / 2;
  const hh = h / 2;
  const lim = Math.min(hw, hh);
  const clamp = (r: number) => Math.max(0, Math.min(r, lim));
  const corners = [
    { ox: cx + hw - clamp(radii[0]), oy: cy + hh - clamp(radii[0]), a0: 0, r: clamp(radii[0]), mid: { x: cx, y: cy + hh } },
    { ox: cx - hw + clamp(radii[1]), oy: cy + hh - clamp(radii[1]), a0: 90, r: clamp(radii[1]), mid: { x: cx - hw, y: cy } },
    { ox: cx - hw + clamp(radii[2]), oy: cy - hh + clamp(radii[2]), a0: 180, r: clamp(radii[2]), mid: { x: cx, y: cy - hh } },
    { ox: cx + hw - clamp(radii[3]), oy: cy - hh + clamp(radii[3]), a0: 270, r: clamp(radii[3]), mid: { x: cx + hw, y: cy } },
  ];
  const out: P2[] = [];
  for (const c of corners) {
    if (c.r < 1e-9) {
      // Scharfe Ecke: nur ein Punkt. Mehrfach derselbe Punkt würde entartete
      // Kanten erzeugen und damit Löcher ins Netz reißen.
      out.push({ x: c.ox, y: c.oy });
    } else {
      for (let i = 0; i <= seg; i++) {
        const a = ((c.a0 + (90 * i) / seg) * Math.PI) / 180;
        out.push({ x: c.ox + c.r * Math.cos(a), y: c.oy + c.r * Math.sin(a) });
      }
    }
    out.push(c.mid);
  }
  return out;
}

const circleLoop = (cx: number, cy: number, r: number, n: number): P2[] => {
  const out: P2[] = [];
  for (let i = 0; i < n; i++) {
    const a = (TAU * i) / n;
    out.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return out;
};

/**
 * Ein Viertel der Fußunterseite als konvexes Polygon. Die Schnittkanten laufen
 * durch die Fußmitte und nutzen die Seitenmittelpunkte, sodass benachbarte
 * Viertel exakt dieselben Kanten teilen.
 */
function padQuadrant(cx: number, cy: number, a: number, r: number, sx: number, sy: number, seg: number): P2[] {
  const pts: P2[] = [{ x: cx, y: cy }, { x: cx + sx * a, y: cy }];
  const ox = cx + sx * (a - r);
  const oy = cy + sy * (a - r);
  for (let i = 0; i <= seg; i++) {
    const t = (i / seg) * (Math.PI / 2);
    pts.push({ x: ox + sx * r * Math.cos(t), y: oy + sy * r * Math.sin(t) });
  }
  pts.push({ x: cx, y: cy + sy * a });
  // CCW sicherstellen (bei gemischten Vorzeichen dreht sich der Umlaufsinn)
  return sx * sy > 0 ? pts : pts.reverse();
}

export function buildBin(spec: BinSpec): BinResult {
  const seg = Math.max(2, Math.min(Math.round(spec.segments ?? 8), 24));
  const ux = Math.max(1, Math.round(spec.unitsX));
  const uy = Math.max(1, Math.round(spec.unitsY));
  const uz = Math.max(1, Math.round(spec.unitsZ));
  const warnings: string[] = [];

  const W = ux * GF.GRID - GF.CLEARANCE;
  const D = uy * GF.GRID - GF.CLEARANCE;
  const bodyH = uz * GF.HEIGHT_UNIT;
  const topZ = bodyH + (spec.lip ? GF.LIP_HEIGHT : 0);

  const wall = Math.max(0.4, Math.min(spec.wall, Math.min(W, D) / 2 - 2));
  const floor = Math.max(0.4, Math.min(spec.floor, Math.max(0.4, bodyH - GF.BASE_HEIGHT - 0.5)));
  const nx = Math.max(1, Math.round(spec.compartmentsX));
  const ny = Math.max(1, Math.round(spec.compartmentsY));

  const m = new Mesh();
  const OVERLAP = 0.01;

  /* --- Füße: je Rasterfeld einer --- */
  const padW = GF.GRID - GF.CLEARANCE;
  const padHalf = (padW - 2 * GF.BASE_INSET) / 2; // 17,8 mm
  const holeOff = padHalf - GF.HOLE_INSET; // 13 mm von der Feldmitte
  const magnetR = spec.holes === 'keine' ? 0 : GF.MAGNET_D / 2;
  const screwR = spec.holes === 'magnet-schraube' ? GF.SCREW_D / 2 : 0;
  const nHole = Math.max(16, seg * 4);
  const bottomR = GF.CORNER_R - GF.BASE_INSET; // 0,8 mm

  for (let gy = 0; gy < uy; gy++) {
    for (let gx = 0; gx < ux; gx++) {
      const cx = -W / 2 + padW / 2 + gx * GF.GRID;
      const cy = -D / 2 + padW / 2 + gy * GF.GRID;
      const loops = BASE_PROFILE.map((p) =>
        roundedRect(cx, cy, padW - 2 * p.inset, padW - 2 * p.inset, GF.CORNER_R - p.inset, seg),
      );
      for (let i = 0; i < loops.length - 1; i++) {
        m.loft(loops[i], BASE_PROFILE[i].z, loops[i + 1], BASE_PROFILE[i + 1].z);
      }
      m.cap(loops[loops.length - 1], GF.BASE_HEIGHT, true);

      if (magnetR <= 0) {
        m.cap(loops[0], 0, false);
        continue;
      }
      for (const [sx, sy] of [[1, 1], [-1, 1], [-1, -1], [1, -1]] as const) {
        const hx = cx + sx * holeOff;
        const hy = cy + sy * holeOff;
        const quad = padQuadrant(cx, cy, padHalf, bottomR, sx, sy, seg);
        const magnet = circleLoop(hx, hy, magnetR, nHole);
        // Unterseite des Viertels (Normale nach unten)
        m.annulus({ x: hx, y: hy }, magnet, quad, 0, false);
        // Magnettasche: Wand nach innen gerichtet (z vertauscht)
        m.loft(magnet, GF.MAGNET_DEPTH, magnet, 0);
        if (screwR > 0) {
          const screwDepth = Math.min(GF.SCREW_DEPTH, GF.BASE_HEIGHT - 0.4);
          const screw = circleLoop(hx, hy, screwR, nHole);
          m.ring(magnet, screw, GF.MAGNET_DEPTH, false);
          m.loft(screw, screwDepth, screw, GF.MAGNET_DEPTH);
          m.cap(screw, screwDepth, false);
        } else {
          m.cap(magnet, GF.MAGNET_DEPTH, false);
        }
      }
    }
  }

  /* --- Wandring --- */
  const zBody = GF.BASE_HEIGHT - OVERLAP;
  const outer = roundedRect(0, 0, W, D, GF.CORNER_R, seg);
  const innerWall = roundedRect(0, 0, W - 2 * wall, D - 2 * wall, Math.max(GF.CORNER_R - wall, 0.1), seg);

  m.loft(outer, zBody, outer, topZ);
  m.ring(outer, innerWall, zBody, false);

  if (spec.lip) {
    const lipLoops = LIP_PROFILE.map((p) =>
      roundedRect(0, 0, W - 2 * p.inset, D - 2 * p.inset, Math.max(GF.CORNER_R - p.inset, 0.1), seg),
    );
    // z vertauscht: Innenflächen zeigen in den Hohlraum
    m.loft(innerWall, bodyH, innerWall, zBody);
    // Absatz vom Wandinneren auf die dickere Lippe. Zeigt nach unten: Darüber
    // liegt das Material der Lippe, darunter der Hohlraum – es ist die
    // Unterseite des Überhangs, die man beim Blick von innen nach oben sieht.
    m.ring(innerWall, lipLoops[0], bodyH, false);
    for (let i = 0; i < lipLoops.length - 1; i++) {
      // z vertauscht: die Lippeninnenseite zeigt zur Bin-Mitte
      m.loft(lipLoops[i + 1], bodyH + LIP_PROFILE[i + 1].dz, lipLoops[i], bodyH + LIP_PROFILE[i].dz);
    }
    m.ring(outer, lipLoops[lipLoops.length - 1], topZ, true);
  } else {
    m.loft(innerWall, topZ, innerWall, zBody);
    m.ring(outer, innerWall, topZ, true);
  }

  /* --- Boden: minimal größer als der Hohlraum, damit keine Fläche doppelt liegt --- */
  const floorTop = GF.BASE_HEIGHT + floor;
  const floorLoop = roundedRect(
    0, 0,
    W - 2 * wall + 2 * OVERLAP,
    D - 2 * wall + 2 * OVERLAP,
    Math.max(GF.CORNER_R - wall + OVERLAP, 0.1),
    seg,
  );
  m.loft(floorLoop, zBody, floorLoop, floorTop);
  m.cap(floorLoop, floorTop, true);
  m.cap(floorLoop, zBody, false);

  /* --- Trennwände --- */
  const innerW = W - 2 * wall;
  const innerD = D - 2 * wall;
  const compW = (innerW - (nx - 1) * wall) / nx;
  const compD = (innerD - (ny - 1) * wall) / ny;
  for (let i = 1; i < nx; i++) {
    const x0 = -innerW / 2 + i * compW + (i - 1) * wall;
    m.box(x0, x0 + wall, -innerD / 2 - OVERLAP, innerD / 2 + OVERLAP, floorTop - OVERLAP, bodyH);
  }
  for (let j = 1; j < ny; j++) {
    const y0 = -innerD / 2 + j * compD + (j - 1) * wall;
    m.box(-innerW / 2 - OVERLAP, innerW / 2 + OVERLAP, y0, y0 + wall, floorTop - OVERLAP, bodyH);
  }

  /* --- Kennzahlen --- */
  const tris = m.toArray();
  let vol6 = 0;
  for (let i = 0; i < tris.length; i += 9) {
    const ax = tris[i], ay = tris[i + 1], az = tris[i + 2];
    const bx = tris[i + 3], by = tris[i + 4], bz = tris[i + 5];
    const cx2 = tris[i + 6], cy2 = tris[i + 7], cz = tris[i + 8];
    vol6 += ax * (by * cz - bz * cy2) + ay * (bz * cx2 - bx * cz) + az * (bx * cy2 - by * cx2);
  }

  const compHeight = Math.max(0, bodyH - floorTop);
  if (compW < 3 || compD < 3) {
    warnings.push('Die Fächer werden schmaler als 3 mm – weniger Fächer wählen oder den Bin vergrößern.');
  }
  if (compHeight < 2) {
    warnings.push('Über dem Boden bleibt kaum nutzbare Höhe – mehr Höheneinheiten wählen oder den Boden dünner machen.');
  }
  if (spec.holes !== 'keine' && uz === 1) {
    warnings.push('Bei einer Höheneinheit sitzt der Boden direkt über den Magnettaschen – Bodenstärke prüfen.');
  }

  return {
    triangles: tris,
    stats: {
      size: [W, D, topZ],
      bodyHeight: bodyH,
      triangles: m.count,
      volumeCm3: Math.abs(vol6) / 6 / 1000,
      capacityMl: (compW * compD * compHeight * nx * ny) / 1000,
      compartment: [compW, compD, compHeight],
      warnings,
    },
  };
}

/* ---------------- Grundplatte (Baseplate) ---------------- */

/**
 * Fassungsprofil der Grundplatte, von unten: 0,7 mm 45° · 1,8 mm gerade ·
 * 2,15 mm 45° → 4,65 mm hoch, Versatz 2,85 mm. Der Eckradius folgt dem Versatz
 * (oben 4,0 mm, dann 1,85 mm, unten 1,15 mm) – gespiegelt zum Fußprofil des Bins.
 */
/**
 * Nach Spezifikation ist die Fassungsöffnung oben genau so groß wie das
 * Rasterfeld (42 mm). Benachbarte Fassungen und der Plattenrand träfen sich
 * dort also auf null Wandstärke – eine Schneide, die sich weder sauber
 * vernetzen noch drucken lässt. Die Fassung wird deshalb um diesen Betrag je
 * Seite zurückgenommen: Oben bleibt ein schmaler Steg stehen, und das Spiel zum
 * Bin beträgt 0,20 statt 0,25 mm – für FDM-Druck reichlich.
 */
export const SOCKET_RELIEF = 0.05;

const PLATE_PROFILE = [
  { inset: 2.85 + SOCKET_RELIEF, dz: 0 },
  { inset: 2.15 + SOCKET_RELIEF, dz: 0.7 },
  { inset: 2.15 + SOCKET_RELIEF, dz: 2.5 },
  { inset: SOCKET_RELIEF, dz: 4.65 },
] as const;

export const PLATE = {
  /** Höhe des Fassungsprofils. */
  HEIGHT: 4.65,
  /** Eckradius der Fassung auf voller Breite. */
  CORNER_R: 4,
  INSET: 2.85,
} as const;

/**
 * Damit die Feldrahmen keine deckungsgleichen Flächen erzeugen, greift jeder
 * um diesen Betrag in seine Nachbarn hinein. Außenkanten der Platte bleiben
 * unverändert, deshalb stimmen die Plattenmaße exakt.
 *
 * Der Wert muss sich von `SOCKET_RELIEF` unterscheiden: Wären beide gleich,
 * fielen die Seitenmittelpunkte benachbarter Felder exakt aufeinander und die
 * gemeinsamen Kanten würden doppelt belegt.
 */
export const PLATE_JOIN = 0.08;

export interface BaseplateSpec {
  unitsX: number;
  unitsY: number;
  /** Bodenstärke unter den Fassungen in mm; 0 = offener Rahmen. */
  floor: number;
  segments?: number;
}

export interface BaseplateStats {
  size: [number, number, number];
  cells: number;
  triangles: number;
  volumeCm3: number;
  warnings: string[];
}

export function buildBaseplate(spec: BaseplateSpec): BinResult & { stats: BinStats & BaseplateStats } {
  const seg = Math.max(2, Math.min(Math.round(spec.segments ?? 8), 24));
  const ux = Math.max(1, Math.round(spec.unitsX));
  const uy = Math.max(1, Math.round(spec.unitsY));
  const floor = Math.max(0, Math.min(spec.floor, 20));
  const warnings: string[] = [];

  const W = ux * GF.GRID;
  const D = uy * GF.GRID;
  const topZ = PLATE.HEIGHT;
  const m = new Mesh();

  for (let gy = 0; gy < uy; gy++) {
    for (let gx = 0; gx < ux; gx++) {
      const cx = -W / 2 + GF.GRID / 2 + gx * GF.GRID;
      const cy = -D / 2 + GF.GRID / 2 + gy * GF.GRID;
      // Nur zu vorhandenen Nachbarn hin überlappen, damit die Plattenaußenmaße stimmen.
      const left = gx > 0 ? PLATE_JOIN : 0;
      const right = gx < ux - 1 ? PLATE_JOIN : 0;
      const bottom = gy > 0 ? PLATE_JOIN : 0;
      const top = gy < uy - 1 ? PLATE_JOIN : 0;
      const ocx = cx + (right - left) / 2;
      const ocy = cy + (top - bottom) / 2;
      const ow = GF.GRID + left + right;
      const od = GF.GRID + bottom + top;
      // Gerundet wird nur an echten Plattenaußenecken.
      const outerLoop = roundedRectCorners(
        ocx,
        ocy,
        ow,
        od,
        [
          gx === ux - 1 && gy === uy - 1 ? PLATE.CORNER_R : 0,
          gx === 0 && gy === uy - 1 ? PLATE.CORNER_R : 0,
          gx === 0 && gy === 0 ? PLATE.CORNER_R : 0,
          gx === ux - 1 && gy === 0 ? PLATE.CORNER_R : 0,
        ],
        seg,
      );
      const sockets = PLATE_PROFILE.map((p) =>
        roundedRect(cx, cy, GF.GRID - 2 * p.inset, GF.GRID - 2 * p.inset, PLATE.CORNER_R - p.inset, seg),
      );

      // Außenmantel
      m.loft(outerLoop, 0, outerLoop, topZ);
      // Fassungstrichter – z vertauscht, damit die Normalen in die Fassung zeigen
      for (let i = 0; i < sockets.length - 1; i++) {
        m.loft(sockets[i + 1], PLATE_PROFILE[i + 1].dz, sockets[i], PLATE_PROFILE[i].dz);
      }
      // Oberer Steg und Unterseite. Außenrahmen und Fassung haben unterschiedlich
      // viele Punkte (scharfe gegen gerundete Ecken), deshalb über die
      // Winkel-Zuordnung verbinden statt Punkt für Punkt.
      m.annulus({ x: cx, y: cy }, sockets[sockets.length - 1], outerLoop, topZ, true);
      m.annulus({ x: cx, y: cy }, sockets[0], outerLoop, 0, false);
    }
  }

  // Optionaler Boden unter den Fassungen
  if (floor > 0) {
    const plate = roundedRectCorners(0, 0, W, D, [PLATE.CORNER_R, PLATE.CORNER_R, PLATE.CORNER_R, PLATE.CORNER_R], seg);
    m.loft(plate, -floor, plate, 0.01);
    m.cap(plate, 0.01, true);
    m.cap(plate, -floor, false);
  }

  const tris = m.toArray();
  let vol6 = 0;
  for (let i = 0; i < tris.length; i += 9) {
    const ax = tris[i], ay = tris[i + 1], az = tris[i + 2];
    const bx = tris[i + 3], by = tris[i + 4], bz = tris[i + 5];
    const cx2 = tris[i + 6], cy2 = tris[i + 7], cz = tris[i + 8];
    vol6 += ax * (by * cz - bz * cy2) + ay * (bz * cx2 - bx * cz) + az * (bx * cy2 - by * cx2);
  }

  if (ux * uy > 40) {
    warnings.push('Sehr große Grundplatte – die meisten Drucker schaffen etwa 5 × 5 Felder am Stück. Lieber mehrere kleinere Platten drucken und nebeneinander legen.');
  }
  if (floor > 0 && floor < 0.8) {
    warnings.push('Ein Boden unter 0,8 mm ist sehr dünn und verzieht sich leicht – 1,2 mm oder mehr sind stabiler.');
  }

  return {
    triangles: tris,
    stats: {
      size: [W, D, topZ + floor],
      bodyHeight: topZ,
      cells: ux * uy,
      triangles: m.count,
      volumeCm3: Math.abs(vol6) / 6 / 1000,
      capacityMl: 0,
      compartment: [0, 0, 0],
      warnings,
    },
  };
}

/** Isometrische Vorschau der Grundplatte. */
export function baseplatePreviewSvg(spec: BaseplateSpec): string {
  const seg = 3;
  const ux = Math.max(1, Math.round(spec.unitsX));
  const uy = Math.max(1, Math.round(spec.unitsY));
  const floor = Math.max(0, Math.min(spec.floor, 20));
  const W = ux * GF.GRID;
  const D = uy * GF.GRID;
  const topZ = PLATE.HEIGHT;

  const shapes: string[] = [];
  const pts: P2[] = [];
  const project = (loop: P2[], z: number) => loop.map((q) => iso(q.x, q.y, z));
  const draw = (p: P2[], style: string) => {
    pts.push(...p);
    shapes.push(
      `<polygon points="${p.map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(' ')}" ${style} vector-effect="non-scaling-stroke"/>`,
    );
  };
  const S = {
    side: 'fill="#fdba74" stroke="#c2410c" stroke-width="1.2" stroke-linejoin="round"',
    top: 'fill="#ffedd5" stroke="#c2410c" stroke-width="1.2" stroke-linejoin="round"',
    socket: 'fill="#c2764a" stroke="#9a3412" stroke-width="0.7"',
    floor: 'fill="#fff7ed" stroke="#9a3412" stroke-width="0.6"',
  };

  const plate = roundedRect(0, 0, W, D, PLATE.CORNER_R, seg);
  draw(convexHull([...project(plate, -floor), ...project(plate, topZ)]), S.side);
  draw(project(plate, topZ), S.top);

  for (let gy = 0; gy < uy; gy++) {
    for (let gx = 0; gx < ux; gx++) {
      const cx = -W / 2 + GF.GRID / 2 + gx * GF.GRID;
      const cy = -D / 2 + GF.GRID / 2 + gy * GF.GRID;
      draw(project(roundedRect(cx, cy, GF.GRID, GF.GRID, PLATE.CORNER_R, seg), topZ), S.socket);
      draw(
        project(
          roundedRect(cx, cy, GF.GRID - 2 * PLATE.INSET, GF.GRID - 2 * PLATE.INSET, PLATE.CORNER_R - PLATE.INSET, seg),
          0,
        ),
        S.floor,
      );
    }
  }

  const pad = 6;
  const minX = Math.min(...pts.map((p) => p.x)) - pad;
  const maxX = Math.max(...pts.map((p) => p.x)) + pad;
  const minY = Math.min(...pts.map((p) => p.y)) - pad;
  const maxY = Math.max(...pts.map((p) => p.y)) + pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Isometrische Vorschau der Gridfinity-Grundplatte">${shapes.join('')}</svg>`;
}

/* ---------------- STL-Export ---------------- */

export function toStl(tris: Float64Array, header = 'Werkbank Gridfinity Bin'): ArrayBuffer {
  const count = tris.length / 9;
  const buf = new ArrayBuffer(84 + count * 50);
  const view = new DataView(buf);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < header.length && i < 79; i++) bytes[i] = header.charCodeAt(i) & 0x7f;
  view.setUint32(80, count, true);
  let p = 84;
  for (let i = 0; i < tris.length; i += 9) {
    const ux = tris[i + 3] - tris[i];
    const uy = tris[i + 4] - tris[i + 1];
    const uz = tris[i + 5] - tris[i + 2];
    const vx = tris[i + 6] - tris[i];
    const vy = tris[i + 7] - tris[i + 1];
    const vz = tris[i + 8] - tris[i + 2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    view.setFloat32(p, nx, true);
    view.setFloat32(p + 4, ny, true);
    view.setFloat32(p + 8, nz, true);
    p += 12;
    for (let k = 0; k < 9; k++) {
      view.setFloat32(p, tris[i + k], true);
      p += 4;
    }
    view.setUint16(p, 0, true);
    p += 2;
  }
  return buf;
}

/* ---------------- Isometrische Vorschau ---------------- */

const ISO_COS = Math.cos(Math.PI / 6);
const ISO_SIN = Math.sin(Math.PI / 6);
const iso = (x: number, y: number, z: number): P2 => ({
  x: (x - y) * ISO_COS,
  y: (x + y) * ISO_SIN - z,
});

/** Konvexe Hülle (Monotone Chain) – liefert die Silhouette des Körpers. */
function convexHull(pts: P2[]): P2[] {
  if (pts.length < 3) return pts;
  const p = [...pts].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const build = (src: P2[]): P2[] => {
    const out: P2[] = [];
    for (const q of src) {
      while (out.length >= 2 && cross(out[out.length - 2], out[out.length - 1], q) <= 0) out.pop();
      out.push(q);
    }
    out.pop();
    return out;
  };
  return [...build(p), ...build([...p].reverse())];
}

/**
 * Isometrische Vorschau als flächiger Körper. Gezeichnet wird von hinten nach
 * vorn (Malerverfahren): Füße, Silhouette des Korpus, Oberkante, Hohlraum,
 * Fachböden, Trennwände. Ohne die gefüllte Silhouette wirken die tiefer
 * liegenden Fachböden wie abgelöste Platten.
 */
export function previewSvg(spec: BinSpec): string {
  const seg = 3;
  const ux = Math.max(1, Math.round(spec.unitsX));
  const uy = Math.max(1, Math.round(spec.unitsY));
  const uz = Math.max(1, Math.round(spec.unitsZ));
  const W = ux * GF.GRID - GF.CLEARANCE;
  const D = uy * GF.GRID - GF.CLEARANCE;
  const bodyH = uz * GF.HEIGHT_UNIT;
  const topZ = bodyH + (spec.lip ? GF.LIP_HEIGHT : 0);
  const wall = Math.max(0.4, Math.min(spec.wall, Math.min(W, D) / 2 - 2));
  const floor = Math.max(0.4, Math.min(spec.floor, Math.max(0.4, bodyH - GF.BASE_HEIGHT - 0.5)));
  const nx = Math.max(1, Math.round(spec.compartmentsX));
  const ny = Math.max(1, Math.round(spec.compartmentsY));

  const shapes: string[] = [];
  const pts: P2[] = [];
  const project = (loop: P2[], z: number) => loop.map((q) => iso(q.x, q.y, z));
  const draw = (p: P2[], style: string) => {
    pts.push(...p);
    shapes.push(
      `<polygon points="${p.map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(' ')}" ${style} vector-effect="non-scaling-stroke"/>`,
    );
  };

  const S = {
    foot: 'fill="#f4f4f5" stroke="#a1a1aa" stroke-width="0.7"',
    side: 'fill="#fdba74" stroke="#c2410c" stroke-width="1.2" stroke-linejoin="round"',
    top: 'fill="#ffedd5" stroke="#c2410c" stroke-width="1.2" stroke-linejoin="round"',
    cavity: 'fill="#c2764a" stroke="#9a3412" stroke-width="0.8"',
    floor: 'fill="#fff7ed" stroke="#9a3412" stroke-width="0.7"',
    divider: 'fill="#fed7aa" stroke="#9a3412" stroke-width="0.7"',
  };

  // 1. Füße (ganz hinten/unten)
  const padW = GF.GRID - GF.CLEARANCE;
  for (let gy = 0; gy < uy; gy++) {
    for (let gx = 0; gx < ux; gx++) {
      const cx = -W / 2 + padW / 2 + gx * GF.GRID;
      const cy = -D / 2 + padW / 2 + gy * GF.GRID;
      const footLoop = roundedRect(cx, cy, padW - 2 * GF.BASE_INSET, padW - 2 * GF.BASE_INSET, GF.CORNER_R - GF.BASE_INSET, seg);
      draw(convexHull([...project(footLoop, 0), ...project(footLoop, GF.BASE_HEIGHT)]), S.foot);
    }
  }

  // 2. Korpus als gefüllte Silhouette – erst dadurch wirkt der Bin räumlich
  const outer = roundedRect(0, 0, W, D, GF.CORNER_R, seg);
  draw(convexHull([...project(outer, GF.BASE_HEIGHT), ...project(outer, topZ)]), S.side);

  // 3. Oberkante
  draw(project(outer, topZ), S.top);

  // 4. Hohlraum als Öffnung
  const innerTop = roundedRect(0, 0, W - 2 * wall, D - 2 * wall, Math.max(GF.CORNER_R - wall, 0.1), seg);
  const openingPts = project(innerTop, topZ);
  draw(openingPts, S.cavity);

  // Alles Weitere liegt im Bin und ist nur durch die Öffnung sichtbar –
  // ohne diese Begrenzung ragen die tiefer liegenden Böden über die Vorderwand hinaus.
  shapes.push(
    `<clipPath id="gf-opening"><polygon points="${openingPts.map((q) => `${q.x.toFixed(2)},${q.y.toFixed(2)}`).join(' ')}"/></clipPath><g clip-path="url(#gf-opening)">`,
  );

  // 5. Fachböden (tiefer, daher nach dem Hohlraum)
  const innerW = W - 2 * wall;
  const innerD = D - 2 * wall;
  const compW = (innerW - (nx - 1) * wall) / nx;
  const compD = (innerD - (ny - 1) * wall) / ny;
  const floorTop = GF.BASE_HEIGHT + floor;
  const rectAt = (x0: number, y0: number, w: number, d: number): P2[] => [
    { x: x0, y: y0 },
    { x: x0 + w, y: y0 },
    { x: x0 + w, y: y0 + d },
    { x: x0, y: y0 + d },
  ];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < ny; j++) {
      const x0 = -innerW / 2 + i * (compW + wall);
      const y0 = -innerD / 2 + j * (compD + wall);
      draw(project(rectAt(x0, y0, compW, compD), floorTop), S.floor);
    }
  }

  // 6. Trennwände (Oberkante liegt höher als die Böden)
  for (let i = 1; i < nx; i++) {
    const x0 = -innerW / 2 + i * compW + (i - 1) * wall;
    draw(project(rectAt(x0, -innerD / 2, wall, innerD), bodyH), S.divider);
  }
  for (let j = 1; j < ny; j++) {
    const y0 = -innerD / 2 + j * compD + (j - 1) * wall;
    draw(project(rectAt(-innerW / 2, y0, innerW, wall), bodyH), S.divider);
  }
  shapes.push('</g>');

  const pad = 6;
  const minX = Math.min(...pts.map((p) => p.x)) - pad;
  const maxX = Math.max(...pts.map((p) => p.x)) + pad;
  const minY = Math.min(...pts.map((p) => p.y)) - pad;
  const maxY = Math.max(...pts.map((p) => p.y)) + pad;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Isometrische Vorschau des Gridfinity-Bins">${shapes.join('')}</svg>`;
}
