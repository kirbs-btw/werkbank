/**
 * STL-Analyse (binär & ASCII) – Volumen, Oberfläche, Abmessungen, Dichtheit.
 * Pure Funktionen ohne DOM-Zugriff, damit server- und clientseitig identisch und testbar.
 *
 * Volumen über die Summe vorzeichenbehafteter Tetraeder zum Ursprung:
 *   V = Σ (a · (b × c)) / 6
 * Das Ergebnis stimmt nur bei einem geschlossenen (wasserdichten) Netz – deshalb prüft
 * `analyzeStl` zusätzlich, ob jede Kante genau zweimal vorkommt.
 */

export type StlFormat = 'binary' | 'ascii';

export interface StlStats {
  format: StlFormat;
  triangles: number;
  /** Volumen in mm³ (Betrag der vorzeichenbehafteten Summe). */
  volume: number;
  /** Oberfläche in mm². */
  area: number;
  min: [number, number, number];
  max: [number, number, number];
  size: [number, number, number];
  /** true = geschlossen, false = Löcher, null = wegen Größe nicht geprüft. */
  watertight: boolean | null;
  /** Kanten, die nicht genau zwei Dreiecke verbinden. */
  openEdges: number;
  /** Dreiecke ohne Fläche (entartet). */
  degenerate: number;
  /** true, wenn die Flächennormalen nach innen zeigen (negatives Volumen). */
  inverted: boolean;
}

export class StlError extends Error {}

/** Obergrenze für die Dichtheitsprüfung – darüber wird sie übersprungen (Speicher/Zeit). */
export const MAX_MANIFOLD_TRIANGLES = 400_000;
/** Maximale Dateigröße in Byte. */
export const MAX_STL_BYTES = 100 * 1024 * 1024;

const HEADER = 84;
const TRI_BYTES = 50;

/** Erkennt das Format zuverlässig über die erwartete Binärgröße, nicht nur über "solid". */
export function detectFormat(buffer: ArrayBuffer): StlFormat {
  if (buffer.byteLength < HEADER) return 'ascii';
  const count = new DataView(buffer).getUint32(80, true);
  if (HEADER + count * TRI_BYTES === buffer.byteLength) return 'binary';
  const head = new TextDecoder().decode(new Uint8Array(buffer, 0, Math.min(80, buffer.byteLength)));
  return head.trimStart().toLowerCase().startsWith('solid') ? 'ascii' : 'binary';
}

/** Dreiecks-Koordinaten als flaches Float64Array (9 Werte je Dreieck). */
function readBinary(buffer: ArrayBuffer): Float64Array {
  const view = new DataView(buffer);
  const count = view.getUint32(80, true);
  const expected = HEADER + count * TRI_BYTES;
  if (expected > buffer.byteLength) {
    throw new StlError(
      'Die Datei ist unvollständig: Der Kopf kündigt mehr Dreiecke an, als enthalten sind.',
    );
  }
  const out = new Float64Array(count * 9);
  let o = 0;
  for (let i = 0; i < count; i++) {
    // 12 Byte Normale überspringen, dann 3 × 3 float32
    let p = HEADER + i * TRI_BYTES + 12;
    for (let k = 0; k < 9; k++) {
      out[o++] = view.getFloat32(p, true);
      p += 4;
    }
  }
  return out;
}

function readAscii(buffer: ArrayBuffer): Float64Array {
  const text = new TextDecoder().decode(buffer);
  const coords: number[] = [];
  const re = /vertex\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)\s+(-?[\d.eE+-]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const x = parseFloat(m[1]);
    const y = parseFloat(m[2]);
    const z = parseFloat(m[3]);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
      throw new StlError('Die Datei enthält ungültige Koordinaten.');
    }
    coords.push(x, y, z);
  }
  if (coords.length === 0) {
    throw new StlError('Keine Dreiecke gefunden – ist das wirklich eine STL-Datei?');
  }
  if (coords.length % 9 !== 0) {
    throw new StlError('Die Datei ist unvollständig: Die Eckpunkte ergeben keine ganzen Dreiecke.');
  }
  return Float64Array.from(coords);
}

/** Rohdaten einlesen. Wirft StlError bei kaputten oder zu großen Dateien. */
export function parseStl(buffer: ArrayBuffer): { format: StlFormat; verts: Float64Array } {
  if (buffer.byteLength === 0) throw new StlError('Die Datei ist leer.');
  if (buffer.byteLength > MAX_STL_BYTES) {
    throw new StlError(
      `Die Datei ist größer als ${Math.round(MAX_STL_BYTES / 1024 / 1024)} MB – bitte im Slicer oder CAD vereinfachen.`,
    );
  }
  const format = detectFormat(buffer);
  const verts = format === 'binary' ? readBinary(buffer) : readAscii(buffer);
  if (verts.length === 0) throw new StlError('Die Datei enthält keine Dreiecke.');
  return { format, verts };
}

const key = (x: number, y: number, z: number) =>
  `${Math.round(x * 1e4)},${Math.round(y * 1e4)},${Math.round(z * 1e4)}`;

/** Vollständige Analyse einer STL-Datei. */
export function analyzeStl(buffer: ArrayBuffer): StlStats {
  const { format, verts } = parseStl(buffer);
  return analyzeMesh(verts, format);
}

/**
 * Analyse eines bereits eingelesenen Netzes. Getrennt von `analyzeStl`, damit
 * Aufrufer, die die Dreiecke ohnehin brauchen (etwa für die 3D-Anzeige), große
 * Dateien nicht zweimal einlesen müssen.
 */
export function analyzeMesh(verts: Float64Array, format: StlFormat): StlStats {
  const triangles = verts.length / 9;

  let vol6 = 0;
  let area2 = 0;
  let degenerate = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < verts.length; i += 9) {
    const ax = verts[i], ay = verts[i + 1], az = verts[i + 2];
    const bx = verts[i + 3], by = verts[i + 4], bz = verts[i + 5];
    const cx = verts[i + 6], cy = verts[i + 7], cz = verts[i + 8];

    if (ax < minX) minX = ax; if (ax > maxX) maxX = ax;
    if (bx < minX) minX = bx; if (bx > maxX) maxX = bx;
    if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
    if (ay < minY) minY = ay; if (ay > maxY) maxY = ay;
    if (by < minY) minY = by; if (by > maxY) maxY = by;
    if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
    if (az < minZ) minZ = az; if (az > maxZ) maxZ = az;
    if (bz < minZ) minZ = bz; if (bz > maxZ) maxZ = bz;
    if (cz < minZ) minZ = cz; if (cz > maxZ) maxZ = cz;

    // 6 · Tetraedervolumen zum Ursprung = a · (b × c)
    vol6 += ax * (by * cz - bz * cy) + ay * (bz * cx - bx * cz) + az * (bx * cy - by * cx);

    // 2 · Dreiecksfläche = |(b−a) × (c−a)|
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const wx = cx - ax, wy = cy - ay, wz = cz - az;
    const nx = uy * wz - uz * wy;
    const ny = uz * wx - ux * wz;
    const nz = ux * wy - uy * wx;
    const len = Math.hypot(nx, ny, nz);
    if (len <= 1e-12) degenerate++;
    area2 += len;
  }

  let watertight: boolean | null = null;
  let openEdges = 0;
  if (triangles <= MAX_MANIFOLD_TRIANGLES) {
    const edges = new Map<string, number>();
    for (let i = 0; i < verts.length; i += 9) {
      const k = [
        key(verts[i], verts[i + 1], verts[i + 2]),
        key(verts[i + 3], verts[i + 4], verts[i + 5]),
        key(verts[i + 6], verts[i + 7], verts[i + 8]),
      ];
      for (let e = 0; e < 3; e++) {
        const a = k[e];
        const b = k[(e + 1) % 3];
        if (a === b) continue; // entartete Kante
        const id = a < b ? `${a}|${b}` : `${b}|${a}`;
        edges.set(id, (edges.get(id) ?? 0) + 1);
      }
    }
    for (const n of edges.values()) if (n !== 2) openEdges++;
    watertight = openEdges === 0;
  }

  const finite = Number.isFinite(minX);
  return {
    format,
    triangles,
    volume: Math.abs(vol6) / 6,
    area: area2 / 2,
    min: finite ? [minX, minY, minZ] : [0, 0, 0],
    max: finite ? [maxX, maxY, maxZ] : [0, 0, 0],
    size: finite ? [maxX - minX, maxY - minY, maxZ - minZ] : [0, 0, 0],
    watertight,
    openEdges,
    degenerate,
    inverted: vol6 < 0,
  };
}

/* ---------- Werkstoffe & Kostenrechnung ---------- */

export interface StlMaterial {
  id: string;
  label: string;
  /** Dichte in g/cm³. */
  density: number;
  /** Üblicher Materialpreis in €/kg (Startwert, im Rechner änderbar). */
  price: number;
  group: 'druck' | 'resin' | 'metall' | 'sonstige';
}

export const STL_MATERIALS: StlMaterial[] = [
  { id: 'pla', label: 'PLA', density: 1.24, price: 20, group: 'druck' },
  { id: 'petg', label: 'PETG', density: 1.27, price: 22, group: 'druck' },
  { id: 'abs', label: 'ABS', density: 1.04, price: 22, group: 'druck' },
  { id: 'asa', label: 'ASA', density: 1.07, price: 28, group: 'druck' },
  { id: 'tpu', label: 'TPU (flexibel)', density: 1.21, price: 32, group: 'druck' },
  { id: 'pa12', label: 'Nylon PA12', density: 1.01, price: 45, group: 'druck' },
  { id: 'pc', label: 'Polycarbonat PC', density: 1.2, price: 40, group: 'druck' },
  { id: 'pla-cf', label: 'PLA-CF (carbonverstärkt)', density: 1.3, price: 45, group: 'druck' },
  { id: 'resin-standard', label: 'Resin Standard', density: 1.1, price: 35, group: 'resin' },
  { id: 'resin-tough', label: 'Resin zäh/ABS-like', density: 1.15, price: 50, group: 'resin' },
  { id: 'alu', label: 'Aluminium', density: 2.7, price: 8, group: 'metall' },
  { id: 'stahl', label: 'Stahl', density: 7.85, price: 3, group: 'metall' },
  { id: 'edelstahl', label: 'Edelstahl V2A', density: 7.9, price: 9, group: 'metall' },
  { id: 'messing', label: 'Messing', density: 8.5, price: 12, group: 'metall' },
  { id: 'kupfer', label: 'Kupfer', density: 8.96, price: 14, group: 'metall' },
  { id: 'titan', label: 'Titan', density: 4.51, price: 60, group: 'metall' },
  { id: 'holz', label: 'Holz (Buche)', density: 0.72, price: 2, group: 'sonstige' },
  { id: 'pom', label: 'POM (Delrin)', density: 1.41, price: 12, group: 'sonstige' },
  { id: 'acryl', label: 'Acrylglas PMMA', density: 1.19, price: 10, group: 'sonstige' },
];

export const STL_MATERIAL_MAP: Record<string, StlMaterial> = Object.fromEntries(
  STL_MATERIALS.map((m) => [m.id, m]),
);

export interface CostInput {
  /** Volumen des Modells in mm³ (Maßstab 1:1). */
  volume: number;
  /** Oberfläche in mm². */
  area: number;
  /** Skalierung in Prozent (100 = Originalgröße). */
  scale: number;
  /** Dichte in g/cm³. */
  density: number;
  /** Materialpreis in €/kg. */
  price: number;
  /** Wandstärke in mm (0 = massiv rechnen). */
  wall: number;
  /** Füllgrad in Prozent. */
  infill: number;
}

export interface CostResult {
  /** Volumen nach Skalierung in cm³. */
  volumeCm3: number;
  /** Oberfläche nach Skalierung in cm². */
  areaCm2: number;
  /** Geschätztes Materialvolumen (Schale + Füllung) in cm³. */
  materialCm3: number;
  shellCm3: number;
  infillCm3: number;
  /** Gewicht in g. */
  weight: number;
  /** Materialkosten in €. */
  cost: number;
  /** Massiv-Gewicht in g (ohne Schale/Füllung-Abschlag). */
  solidWeight: number;
}

/**
 * Material- und Kostenabschätzung. Die Schale wird als Oberfläche × Wandstärke
 * genähert (auf das Gesamtvolumen begrenzt), der Rest anteilig gefüllt.
 * Das ist eine Näherung – der Slicer bleibt die genauere Quelle.
 */
export function estimateCost(input: CostInput): CostResult {
  const f = Math.max(input.scale, 0) / 100;
  const volumeCm3 = (input.volume * f ** 3) / 1000;
  const areaCm2 = (input.area * f ** 2) / 100;
  const wall = Math.max(input.wall, 0);
  const infill = Math.min(Math.max(input.infill, 0), 100) / 100;

  // Schalenvolumen in cm³: Oberfläche (mm²) × Wandstärke (mm) = mm³ → /1000
  const shellRaw = (input.area * f ** 2 * wall) / 1000;
  const shellCm3 = Math.min(shellRaw, volumeCm3);
  const infillCm3 = Math.max(volumeCm3 - shellCm3, 0) * infill;
  const materialCm3 = wall > 0 ? shellCm3 + infillCm3 : volumeCm3;

  const weight = materialCm3 * input.density;
  return {
    volumeCm3,
    areaCm2,
    materialCm3,
    shellCm3: wall > 0 ? shellCm3 : volumeCm3,
    infillCm3: wall > 0 ? infillCm3 : 0,
    weight,
    cost: (weight / 1000) * input.price,
    solidWeight: volumeCm3 * input.density,
  };
}

export interface FitResult {
  /** Passt das Modell – notfalls achsparallel gedreht – in den Bauraum? */
  fits: boolean;
  /** Passt es bereits in der aktuellen Ausrichtung? */
  fitsAsIs: boolean;
  /** Größte Überschreitung in mm (0, wenn es passt). */
  overshoot: number;
}

/**
 * Bauraum-Prüfung. Erlaubt sind Drehungen um 90°, deshalb genügt der Vergleich
 * der jeweils sortierten Kantenlängen.
 */
export function fitsBuildVolume(
  size: [number, number, number],
  bed: [number, number, number],
): FitResult {
  const s = [...size].sort((a, b) => a - b);
  const b = [...bed].sort((x, y) => x - y);
  const fits = s.every((v, i) => v <= b[i] + 1e-9);
  const fitsAsIs = size.every((v, i) => v <= bed[i] + 1e-9);
  const overshoot = fits ? 0 : Math.max(...s.map((v, i) => v - b[i]), 0);
  return { fits, fitsAsIs, overshoot };
}

/** Filamentlänge in m für einen gegebenen Filamentdurchmesser. */
export function filamentLength(materialCm3: number, diameterMm: number): number {
  const r = diameterMm / 2 / 10; // cm
  const areaCm2 = Math.PI * r * r;
  return areaCm2 > 0 ? materialCm3 / areaCm2 / 100 : 0;
}
