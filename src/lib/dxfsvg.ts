/**
 * DXF ⇄ SVG Konverter – pure Funktionen ohne DOM, damit server- und clientseitig
 * identisch nutzbar und testbar.
 *
 * Zwischenformat ist eine kleine Menge von Geometrie-Entitäten in einem
 * mathematischen Koordinatensystem (y zeigt nach oben, wie im DXF). Beim
 * SVG-Export wird y gespiegelt, beim SVG-Import zurückgedreht.
 *
 * Unterstützt beim Lesen: LINE, LWPOLYLINE (inkl. Bulge-Bögen), POLYLINE/VERTEX,
 * CIRCLE, ARC, ELLIPSE, POINT bzw. line, polyline, polygon, rect, circle,
 * ellipse und path. Kurven im SVG-Pfad (C/S/Q/T/A) werden in Polylinien
 * aufgelöst; SPLINE im DXF wird gezählt, aber nicht konvertiert.
 */

export interface Pt {
  x: number;
  y: number;
}

export type Entity =
  | { kind: 'polyline'; layer: string; points: Pt[]; closed: boolean }
  | { kind: 'circle'; layer: string; c: Pt; r: number }
  /** Winkel in Grad, gegen den Uhrzeigersinn von a1 nach a2 (DXF-Konvention). */
  | { kind: 'arc'; layer: string; c: Pt; r: number; a1: number; a2: number }
  | { kind: 'ellipse'; layer: string; c: Pt; rx: number; ry: number; rot: number };

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Drawing {
  entities: Entity[];
  bounds: Bounds;
  /** Nicht konvertierbare Elemente je Typ. */
  skipped: Record<string, number>;
}

export class ConvertError extends Error {}

const EPS = 1e-9;
const DEG = 180 / Math.PI;
const RAD = Math.PI / 180;

const norm360 = (deg: number) => ((deg % 360) + 360) % 360;

/* ---------------- Bounds ---------------- */

const EMPTY_BOUNDS: Bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

/** Punkte eines Bogens abtasten (auch für Bounds ausreichend genau). */
export function sampleArc(c: Pt, r: number, a1: number, a2: number, minSeg = 8): Pt[] {
  let sweep = norm360(a2 - a1);
  if (sweep < EPS) sweep = 360;
  const n = Math.max(minSeg, Math.ceil(sweep / 5));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (a1 + (sweep * i) / n) * RAD;
    out.push({ x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a) });
  }
  return out;
}

function sampleEllipse(c: Pt, rx: number, ry: number, rot: number, n = 72): Pt[] {
  const cr = Math.cos(rot * RAD);
  const sr = Math.sin(rot * RAD);
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * 2 * Math.PI;
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    out.push({ x: c.x + x * cr - y * sr, y: c.y + x * sr + y * cr });
  }
  return out;
}

export function entityPoints(e: Entity): Pt[] {
  switch (e.kind) {
    case 'polyline':
      return e.points;
    case 'circle':
      return sampleArc(e.c, e.r, 0, 360, 32);
    case 'arc':
      return sampleArc(e.c, e.r, e.a1, e.a2);
    case 'ellipse':
      return sampleEllipse(e.c, e.rx, e.ry, e.rot);
  }
}

export function boundsOf(entities: Entity[]): Bounds {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const e of entities) {
    for (const p of entityPoints(e)) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return Number.isFinite(minX) ? { minX, minY, maxX, maxY } : { ...EMPTY_BOUNDS };
}

export function entityStats(d: Drawing): Record<string, number> {
  const out: Record<string, number> = {};
  for (const e of d.entities) out[e.kind] = (out[e.kind] ?? 0) + 1;
  return out;
}

const makeDrawing = (entities: Entity[], skipped: Record<string, number>): Drawing => ({
  entities,
  bounds: boundsOf(entities),
  skipped,
});

/* ---------------- DXF lesen ---------------- */

interface Pair {
  code: number;
  value: string;
}

function tokenizeDxf(text: string): Pair[] {
  const lines = text.split(/\r\n|\r|\n/);
  const pairs: Pair[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    if (!Number.isFinite(code)) continue;
    pairs.push({ code, value: lines[i + 1].trim() });
  }
  return pairs;
}

/** Bulge-Segment in einen Bogen umrechnen (b = tan(θ/4), positiv = gegen den Uhrzeigersinn). */
export function bulgeToArc(p1: Pt, p2: Pt, bulge: number): { c: Pt; r: number; a1: number; a2: number } | null {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const chord = Math.hypot(dx, dy);
  if (chord < EPS || Math.abs(bulge) < 1e-12) return null;
  const theta = 4 * Math.atan(bulge);
  const r = chord / (2 * Math.sin(theta / 2));
  const h = r * Math.cos(theta / 2);
  const ux = dx / chord;
  const uy = dy / chord;
  const c = { x: (p1.x + p2.x) / 2 - uy * h, y: (p1.y + p2.y) / 2 + ux * h };
  const a1 = Math.atan2(p1.y - c.y, p1.x - c.x) * DEG;
  const a2 = Math.atan2(p2.y - c.y, p2.x - c.x) * DEG;
  return { c, r: Math.abs(r), a1: bulge > 0 ? a1 : a2, a2: bulge > 0 ? a2 : a1 };
}

export function parseDxf(text: string): Drawing {
  const pairs = tokenizeDxf(text);
  if (pairs.length === 0) throw new ConvertError('Die Datei enthält keine DXF-Daten.');

  // ENTITIES-Abschnitt suchen; fehlt er, wird die ganze Datei durchsucht (manche Exporte sind minimal).
  let start = 0;
  let end = pairs.length;
  for (let i = 0; i < pairs.length - 1; i++) {
    if (pairs[i].code === 0 && pairs[i].value === 'SECTION' && pairs[i + 1].code === 2 && pairs[i + 1].value === 'ENTITIES') {
      start = i + 2;
      for (let j = start; j < pairs.length; j++) {
        if (pairs[j].code === 0 && pairs[j].value === 'ENDSEC') {
          end = j;
          break;
        }
      }
      break;
    }
  }

  // In Entitäts-Blöcke gruppieren (jeder beginnt mit Code 0).
  const blocks: { type: string; pairs: Pair[] }[] = [];
  for (let i = start; i < end; i++) {
    if (pairs[i].code === 0) {
      blocks.push({ type: pairs[i].value.toUpperCase(), pairs: [] });
    } else if (blocks.length > 0) {
      blocks[blocks.length - 1].pairs.push(pairs[i]);
    }
  }

  const entities: Entity[] = [];
  const skipped: Record<string, number> = {};
  const skip = (t: string) => {
    skipped[t] = (skipped[t] ?? 0) + 1;
  };

  const first = (p: Pair[], code: number, fallback = 0): number => {
    const hit = p.find((x) => x.code === code);
    const v = hit ? parseFloat(hit.value) : NaN;
    return Number.isFinite(v) ? v : fallback;
  };
  const layerOf = (p: Pair[]): string => p.find((x) => x.code === 8)?.value || '0';

  for (let bi = 0; bi < blocks.length; bi++) {
    const b = blocks[bi];
    const p = b.pairs;
    switch (b.type) {
      case 'LINE': {
        entities.push({
          kind: 'polyline',
          layer: layerOf(p),
          points: [
            { x: first(p, 10), y: first(p, 20) },
            { x: first(p, 11), y: first(p, 21) },
          ],
          closed: false,
        });
        break;
      }
      case 'CIRCLE': {
        const r = first(p, 40);
        if (r > 0) entities.push({ kind: 'circle', layer: layerOf(p), c: { x: first(p, 10), y: first(p, 20) }, r });
        break;
      }
      case 'ARC': {
        const r = first(p, 40);
        if (r > 0) {
          entities.push({
            kind: 'arc',
            layer: layerOf(p),
            c: { x: first(p, 10), y: first(p, 20) },
            r,
            a1: first(p, 50),
            a2: first(p, 51),
          });
        }
        break;
      }
      case 'ELLIPSE': {
        const c = { x: first(p, 10), y: first(p, 20) };
        const mx = first(p, 11);
        const my = first(p, 21);
        const ratio = first(p, 40, 1);
        const rx = Math.hypot(mx, my);
        const ry = rx * ratio;
        const rot = Math.atan2(my, mx) * DEG;
        const t1 = first(p, 41, 0);
        const t2 = first(p, 42, 2 * Math.PI);
        if (rx <= 0) break;
        if (Math.abs(t1) < 1e-6 && Math.abs(t2 - 2 * Math.PI) < 1e-6) {
          entities.push({ kind: 'ellipse', layer: layerOf(p), c, rx, ry, rot });
        } else {
          // Teilellipse als Polylinie abtasten
          const n = 64;
          const pts: Pt[] = [];
          const cr = Math.cos(rot * RAD);
          const sr = Math.sin(rot * RAD);
          for (let i = 0; i <= n; i++) {
            const t = t1 + ((t2 - t1) * i) / n;
            const x = rx * Math.cos(t);
            const y = ry * Math.sin(t);
            pts.push({ x: c.x + x * cr - y * sr, y: c.y + x * sr + y * cr });
          }
          entities.push({ kind: 'polyline', layer: layerOf(p), points: pts, closed: false });
        }
        break;
      }
      case 'LWPOLYLINE': {
        const closed = (first(p, 70) & 1) === 1;
        const layer = layerOf(p);
        // 10/20 in Reihenfolge einlesen, 42 (Bulge) gehört zum jeweils davor gelesenen Punkt.
        const pts: Pt[] = [];
        const bulges: number[] = [];
        let curX: number | null = null;
        for (const pair of p) {
          if (pair.code === 10) {
            curX = parseFloat(pair.value);
          } else if (pair.code === 20 && curX !== null) {
            pts.push({ x: curX, y: parseFloat(pair.value) });
            bulges.push(0);
            curX = null;
          } else if (pair.code === 42 && bulges.length > 0) {
            bulges[bulges.length - 1] = parseFloat(pair.value);
          }
        }
        pushPolylineWithBulges(entities, layer, pts, bulges, closed);
        break;
      }
      case 'POLYLINE': {
        const layer = layerOf(p);
        const closed = (first(p, 70) & 1) === 1;
        const pts: Pt[] = [];
        const bulges: number[] = [];
        // Folgende VERTEX-Blöcke bis SEQEND einsammeln.
        let j = bi + 1;
        for (; j < blocks.length && blocks[j].type !== 'SEQEND'; j++) {
          if (blocks[j].type !== 'VERTEX') continue;
          const vp = blocks[j].pairs;
          pts.push({ x: first(vp, 10), y: first(vp, 20) });
          bulges.push(first(vp, 42));
        }
        bi = j; // VERTEX/SEQEND übersprungen
        pushPolylineWithBulges(entities, layer, pts, bulges, closed);
        break;
      }
      case 'POINT':
      case 'SEQEND':
      case 'VERTEX':
        break;
      default:
        if (b.type) skip(b.type);
    }
  }

  if (entities.length === 0) {
    throw new ConvertError('Keine unterstützten Zeichnungselemente gefunden (LINE, POLYLINE, CIRCLE, ARC, ELLIPSE).');
  }
  return makeDrawing(entities, skipped);
}

/** Polylinie eintragen und Bulge-Segmente in echte Bögen aufteilen. */
function pushPolylineWithBulges(
  out: Entity[],
  layer: string,
  pts: Pt[],
  bulges: number[],
  closed: boolean,
): void {
  if (pts.length < 2) return;
  if (!bulges.some((b) => Math.abs(b) > 1e-12)) {
    out.push({ kind: 'polyline', layer, points: pts, closed });
    return;
  }
  const segs = closed ? pts.length : pts.length - 1;
  let run: Pt[] = [pts[0]];
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const arc = Math.abs(bulges[i]) > 1e-12 ? bulgeToArc(a, b, bulges[i]) : null;
    if (arc) {
      if (run.length >= 2) out.push({ kind: 'polyline', layer, points: run, closed: false });
      out.push({ kind: 'arc', layer, c: arc.c, r: arc.r, a1: arc.a1, a2: arc.a2 });
      run = [b];
    } else {
      run.push(b);
    }
  }
  if (run.length >= 2) out.push({ kind: 'polyline', layer, points: run, closed: false });
}

/* ---------------- DXF schreiben (R12) ---------------- */

const n4 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();

function dxfPolyline(layer: string, pts: Pt[], closed: boolean): string {
  let s = `0\nPOLYLINE\n8\n${layer}\n66\n1\n70\n${closed ? 1 : 0}\n10\n0\n20\n0\n30\n0\n`;
  for (const p of pts) {
    s += `0\nVERTEX\n8\n${layer}\n10\n${n4(p.x)}\n20\n${n4(p.y)}\n30\n0\n`;
  }
  s += `0\nSEQEND\n8\n${layer}\n`;
  return s;
}

/** DXF im R12-Format (AC1009) – die verlässlichste Basis für CAM- und Lasersoftware. */
export function writeDxf(d: Drawing): string {
  const layers = Array.from(new Set(d.entities.map((e) => e.layer || '0')));
  const b = d.bounds;

  let s = '0\nSECTION\n2\nHEADER\n';
  s += '9\n$ACADVER\n1\nAC1009\n';
  s += '9\n$INSUNITS\n70\n4\n'; // 4 = Millimeter
  s += `9\n$EXTMIN\n10\n${n4(b.minX)}\n20\n${n4(b.minY)}\n30\n0\n`;
  s += `9\n$EXTMAX\n10\n${n4(b.maxX)}\n20\n${n4(b.maxY)}\n30\n0\n`;
  s += '0\nENDSEC\n';

  s += '0\nSECTION\n2\nTABLES\n0\nTABLE\n2\nLAYER\n70\n' + layers.length + '\n';
  for (const l of layers) s += `0\nLAYER\n2\n${l}\n70\n0\n62\n7\n6\nCONTINUOUS\n`;
  s += '0\nENDTAB\n0\nENDSEC\n';

  s += '0\nSECTION\n2\nENTITIES\n';
  for (const e of d.entities) {
    const layer = e.layer || '0';
    switch (e.kind) {
      case 'polyline':
        if (e.points.length === 2 && !e.closed) {
          const [p1, p2] = e.points;
          s += `0\nLINE\n8\n${layer}\n10\n${n4(p1.x)}\n20\n${n4(p1.y)}\n30\n0\n11\n${n4(p2.x)}\n21\n${n4(p2.y)}\n31\n0\n`;
        } else if (e.points.length >= 2) {
          s += dxfPolyline(layer, e.points, e.closed);
        }
        break;
      case 'circle':
        s += `0\nCIRCLE\n8\n${layer}\n10\n${n4(e.c.x)}\n20\n${n4(e.c.y)}\n30\n0\n40\n${n4(e.r)}\n`;
        break;
      case 'arc':
        s += `0\nARC\n8\n${layer}\n10\n${n4(e.c.x)}\n20\n${n4(e.c.y)}\n30\n0\n40\n${n4(e.r)}\n50\n${n4(norm360(e.a1))}\n51\n${n4(norm360(e.a2))}\n`;
        break;
      case 'ellipse':
        // R12 kennt keine ELLIPSE – als geschlossene Polylinie ausgeben.
        s += dxfPolyline(layer, sampleEllipse(e.c, e.rx, e.ry, e.rot, 96).slice(0, -1), true);
        break;
    }
  }
  s += '0\nENDSEC\n0\nEOF\n';
  return s;
}

/* ---------------- SVG schreiben ---------------- */

export interface SvgOptions {
  /** Rand um die Zeichnung in mm. */
  margin?: number;
  /** Strichstärke in mm. */
  strokeWidth?: number;
  /** Linienfarbe. */
  stroke?: string;
  /** Für die Bildschirmvorschau: skaliert in den Container statt auf Millimeter. */
  responsive?: boolean;
}

export function writeSvg(d: Drawing, opts: SvgOptions = {}): string {
  const margin = opts.margin ?? 2;
  const sw = opts.strokeWidth ?? 0.1;
  const stroke = opts.stroke ?? '#000000';
  const b = d.bounds;
  const w = b.maxX - b.minX + 2 * margin;
  const h = b.maxY - b.minY + 2 * margin;
  // y spiegeln: SVG zählt nach unten
  const tx = (x: number) => x - b.minX + margin;
  const ty = (y: number) => b.maxY - y + margin;

  const parts: string[] = [];
  for (const e of d.entities) {
    switch (e.kind) {
      case 'polyline': {
        const pts = e.points.map((p) => `${n4(tx(p.x))},${n4(ty(p.y))}`).join(' ');
        parts.push(`<${e.closed ? 'polygon' : 'polyline'} points="${pts}"/>`);
        break;
      }
      case 'circle':
        parts.push(`<circle cx="${n4(tx(e.c.x))}" cy="${n4(ty(e.c.y))}" r="${n4(e.r)}"/>`);
        break;
      case 'arc': {
        const sweep = norm360(e.a2 - e.a1) || 360;
        if (sweep >= 359.999) {
          parts.push(`<circle cx="${n4(tx(e.c.x))}" cy="${n4(ty(e.c.y))}" r="${n4(e.r)}"/>`);
          break;
        }
        const p1 = { x: e.c.x + e.r * Math.cos(e.a1 * RAD), y: e.c.y + e.r * Math.sin(e.a1 * RAD) };
        const p2 = { x: e.c.x + e.r * Math.cos(e.a2 * RAD), y: e.c.y + e.r * Math.sin(e.a2 * RAD) };
        // DXF-Bögen laufen gegen den Uhrzeigersinn (steigender Winkel). Durch die
        // y-Spiegelung dreht sich die Laufrichtung um, im SVG fällt der Winkel
        // also → sweep-flag = 0.
        const large = sweep > 180 ? 1 : 0;
        parts.push(
          `<path d="M ${n4(tx(p1.x))},${n4(ty(p1.y))} A ${n4(e.r)},${n4(e.r)} 0 ${large} 0 ${n4(tx(p2.x))},${n4(ty(p2.y))}"/>`,
        );
        break;
      }
      case 'ellipse':
        parts.push(
          `<ellipse cx="${n4(tx(e.c.x))}" cy="${n4(ty(e.c.y))}" rx="${n4(e.rx)}" ry="${n4(e.ry)}"${
            Math.abs(e.rot) > EPS
              ? ` transform="rotate(${n4(-e.rot)} ${n4(tx(e.c.x))} ${n4(ty(e.c.y))})"`
              : ''
          }/>`,
        );
        break;
    }
  }

  const dims = opts.responsive
    ? 'width="100%" height="100%" preserveAspectRatio="xMidYMid meet"'
    : `width="${n4(w)}mm" height="${n4(h)}mm"`;
  const vectorEffect = opts.responsive ? ' vector-effect="non-scaling-stroke"' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" ${dims} viewBox="0 0 ${n4(w)} ${n4(h)}"><g fill="none" stroke="${stroke}" stroke-width="${n4(sw)}"${vectorEffect}>${parts.join('')}</g></svg>`;
}

/* ---------------- SVG lesen ---------------- */

/** 2×3-Transformationsmatrix [a b c d e f]. */
type Mat = [number, number, number, number, number, number];
const IDENT: Mat = [1, 0, 0, 1, 0, 0];

const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
const apply = (m: Mat, p: Pt): Pt => ({ x: m[0] * p.x + m[2] * p.y + m[4], y: m[1] * p.x + m[3] * p.y + m[5] });
/** Mittlerer Skalierungsfaktor – für Radien bei gleichmäßiger Skalierung. */
const scaleOf = (m: Mat): number => Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])) || 1;
const isUniform = (m: Mat): boolean =>
  Math.abs(Math.hypot(m[0], m[1]) - Math.hypot(m[2], m[3])) < 1e-6 && Math.abs(m[0] * m[2] + m[1] * m[3]) < 1e-6;

function parseTransform(str: string): Mat {
  let m: Mat = IDENT;
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let hit: RegExpExecArray | null;
  while ((hit = re.exec(str)) !== null) {
    const nums = (hit[2].match(/-?[\d.]+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
    let t: Mat = IDENT;
    switch (hit[1]) {
      case 'matrix':
        if (nums.length >= 6) t = [nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]];
        break;
      case 'translate':
        t = [1, 0, 0, 1, nums[0] ?? 0, nums[1] ?? 0];
        break;
      case 'scale':
        t = [nums[0] ?? 1, 0, 0, nums[1] ?? nums[0] ?? 1, 0, 0];
        break;
      case 'rotate': {
        const a = (nums[0] ?? 0) * RAD;
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const rot: Mat = [cos, sin, -sin, cos, 0, 0];
        if (nums.length >= 3) {
          t = mul(mul([1, 0, 0, 1, nums[1], nums[2]], rot), [1, 0, 0, 1, -nums[1], -nums[2]]);
        } else {
          t = rot;
        }
        break;
      }
      case 'skewX':
        t = [1, 0, Math.tan((nums[0] ?? 0) * RAD), 1, 0, 0];
        break;
      case 'skewY':
        t = [1, Math.tan((nums[0] ?? 0) * RAD), 0, 1, 0, 0];
        break;
    }
    m = mul(m, t);
  }
  return m;
}

/** Längenangabe in Benutzereinheiten umrechnen (px als CSS-Referenz). */
export function parseSvgLength(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(-?[\d.]+(?:e[-+]?\d+)?)\s*([a-z%]*)$/i);
  if (!m) return null;
  const v = parseFloat(m[1]);
  if (!Number.isFinite(v)) return null;
  const unit = m[2].toLowerCase();
  const perMm: Record<string, number> = {
    '': 1,
    px: 1,
    mm: 96 / 25.4,
    cm: (96 / 25.4) * 10,
    in: 96,
    pt: 96 / 72,
    pc: 16,
  };
  if (unit === '%') return null;
  const f = perMm[unit];
  return f === undefined ? null : v * f;
}

function attrs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /([\w:.-]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out[m[1].toLowerCase()] = m[3] ?? m[4] ?? '';
  return out;
}

const numAttr = (a: Record<string, string>, k: string, fallback = 0): number => {
  const v = parseFloat(a[k]);
  return Number.isFinite(v) ? v : fallback;
};

/* --- Pfad-Parser --- */

function pathPoints(d: string, curveSteps = 24): { points: Pt[]; closed: boolean }[] {
  const toks = d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const subs: { points: Pt[]; closed: boolean }[] = [];
  let pts: Pt[] = [];
  let cur: Pt = { x: 0, y: 0 };
  let startPt: Pt = { x: 0, y: 0 };
  let prevCtrl: Pt | null = null;
  let cmd = '';
  let i = 0;

  const num = () => {
    const v = parseFloat(toks[i++]);
    return Number.isFinite(v) ? v : 0;
  };
  const flush = (closed: boolean) => {
    if (pts.length >= 2) subs.push({ points: pts, closed });
    pts = [];
  };
  const push = (p: Pt) => {
    pts.push(p);
    cur = p;
  };
  const bezier3 = (p0: Pt, p1: Pt, p2: Pt, p3: Pt) => {
    for (let s = 1; s <= curveSteps; s++) {
      const t = s / curveSteps;
      const u = 1 - t;
      pts.push({
        x: u ** 3 * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t ** 3 * p3.x,
        y: u ** 3 * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t ** 3 * p3.y,
      });
    }
    cur = p3;
  };
  const bezier2 = (p0: Pt, p1: Pt, p2: Pt) => {
    for (let s = 1; s <= curveSteps; s++) {
      const t = s / curveSteps;
      const u = 1 - t;
      pts.push({
        x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
      });
    }
    cur = p2;
  };

  while (i < toks.length) {
    const tok = toks[i];
    if (/[MmLlHhVvCcSsQqTtAaZz]/.test(tok)) {
      cmd = tok;
      i++;
    } else if (cmd === '') {
      i++;
      continue;
    }
    const rel = cmd === cmd.toLowerCase();
    const base = rel ? cur : { x: 0, y: 0 };

    switch (cmd.toUpperCase()) {
      case 'M': {
        flush(false);
        const p = { x: base.x + num(), y: base.y + num() };
        pts = [p];
        cur = p;
        startPt = p;
        cmd = rel ? 'l' : 'L';
        prevCtrl = null;
        break;
      }
      case 'L':
        push({ x: base.x + num(), y: base.y + num() });
        prevCtrl = null;
        break;
      case 'H':
        push({ x: (rel ? cur.x : 0) + num(), y: cur.y });
        prevCtrl = null;
        break;
      case 'V':
        push({ x: cur.x, y: (rel ? cur.y : 0) + num() });
        prevCtrl = null;
        break;
      case 'C': {
        const p0 = cur;
        const c1 = { x: base.x + num(), y: base.y + num() };
        const c2 = { x: base.x + num(), y: base.y + num() };
        const p3 = { x: base.x + num(), y: base.y + num() };
        bezier3(p0, c1, c2, p3);
        prevCtrl = c2;
        break;
      }
      case 'S': {
        const p0 = cur;
        const c1 = prevCtrl ? { x: 2 * p0.x - prevCtrl.x, y: 2 * p0.y - prevCtrl.y } : p0;
        const c2 = { x: base.x + num(), y: base.y + num() };
        const p3 = { x: base.x + num(), y: base.y + num() };
        bezier3(p0, c1, c2, p3);
        prevCtrl = c2;
        break;
      }
      case 'Q': {
        const p0 = cur;
        const c1 = { x: base.x + num(), y: base.y + num() };
        const p2 = { x: base.x + num(), y: base.y + num() };
        bezier2(p0, c1, p2);
        prevCtrl = c1;
        break;
      }
      case 'T': {
        const p0 = cur;
        // Typ ausdrücklich: Weiter unten wird `prevCtrl = c1` gesetzt, damit
        // hängt der Typ von `c1` an `prevCtrl` und umgekehrt. TypeScript bricht
        // solche Ringschlüsse ab und macht daraus stillschweigend `any`.
        const c1: Pt = prevCtrl ? { x: 2 * p0.x - prevCtrl.x, y: 2 * p0.y - prevCtrl.y } : p0;
        const p2 = { x: base.x + num(), y: base.y + num() };
        bezier2(p0, c1, p2);
        prevCtrl = c1;
        break;
      }
      case 'A': {
        const rx = Math.abs(num());
        const ry = Math.abs(num());
        const rot = num();
        const large = num();
        const sweep = num();
        const p2 = { x: base.x + num(), y: base.y + num() };
        for (const p of arcToPoints(cur, rx, ry, rot, large !== 0, sweep !== 0, p2, curveSteps)) pts.push(p);
        cur = p2;
        prevCtrl = null;
        break;
      }
      case 'Z': {
        if (pts.length >= 2) subs.push({ points: pts, closed: true });
        pts = [];
        cur = startPt;
        prevCtrl = null;
        break;
      }
      default:
        i++;
    }
  }
  flush(false);
  return subs;
}

/** SVG-Bogen (Endpunkt-Parametrisierung) in Punkte auflösen – nach SVG-Spezifikation. */
export function arcToPoints(
  p1: Pt,
  rx: number,
  ry: number,
  rotDeg: number,
  largeArc: boolean,
  sweep: boolean,
  p2: Pt,
  steps = 24,
): Pt[] {
  if (rx < EPS || ry < EPS) return [p2];
  const phi = rotDeg * RAD;
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const dx2 = (p1.x - p2.x) / 2;
  const dy2 = (p1.y - p2.y) / 2;
  const x1p = cosP * dx2 + sinP * dy2;
  const y1p = -sinP * dx2 + cosP * dy2;

  let rxs = rx * rx;
  let rys = ry * ry;
  const lambda = (x1p * x1p) / rxs + (y1p * y1p) / rys;
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rx *= s;
    ry *= s;
    rxs = rx * rx;
    rys = ry * ry;
  }
  const denom = rxs * y1p * y1p + rys * x1p * x1p;
  let factor = denom > 0 ? Math.sqrt(Math.max(0, (rxs * rys - denom) / denom)) : 0;
  if (largeArc === sweep) factor = -factor;
  const cxp = factor * ((rx * y1p) / ry);
  const cyp = factor * (-(ry * x1p) / rx);
  const cx = cosP * cxp - sinP * cyp + (p1.x + p2.x) / 2;
  const cy = sinP * cxp + cosP * cyp + (p1.y + p2.y) / 2;

  const ang = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    let a = Math.acos(Math.min(1, Math.max(-1, len > 0 ? dot / len : 1)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let delta = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  else if (sweep && delta < 0) delta += 2 * Math.PI;

  const n = Math.max(steps, Math.ceil((Math.abs(delta) * DEG) / 5));
  const out: Pt[] = [];
  for (let i = 1; i <= n; i++) {
    const t = theta1 + (delta * i) / n;
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    out.push({ x: cosP * x - sinP * y + cx, y: sinP * x + cosP * y + cy });
  }
  return out;
}

export interface SvgParseOptions {
  /** Zusätzlicher Skalierungsfaktor (1 = unverändert). */
  scale?: number;
}

const SHAPES = new Set(['line', 'polyline', 'polygon', 'rect', 'circle', 'ellipse', 'path']);
const SKIP_CONTAINERS = new Set(['defs', 'clippath', 'mask', 'symbol', 'pattern', 'marker']);

export function parseSvg(text: string, opts: SvgParseOptions = {}): Drawing {
  const clean = text.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  const entities: Entity[] = [];
  const skipped: Record<string, number> = {};
  const skip = (t: string) => {
    skipped[t] = (skipped[t] ?? 0) + 1;
  };

  // Wurzel-Transformation aus width/height und viewBox (Benutzereinheiten → mm).
  const rootTag = clean.match(/<svg\b([^>]*)>/i);
  if (!rootTag) throw new ConvertError('Kein <svg>-Element gefunden – ist das wirklich eine SVG-Datei?');
  const rootAttr = attrs(rootTag[1]);
  const vb = (rootAttr.viewbox ?? '').split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n));
  const wPx = parseSvgLength(rootAttr.width);
  const hPx = parseSvgLength(rootAttr.height);
  // px → mm, damit die Zeichnung in echten Millimetern landet
  const PX_TO_MM = 25.4 / 96;
  let unit = PX_TO_MM;
  let ox = 0;
  let oy = 0;
  if (vb.length === 4 && vb[2] > 0 && vb[3] > 0) {
    ox = vb[0];
    oy = vb[1];
    if (wPx) unit = (wPx * PX_TO_MM) / vb[2];
    else if (hPx) unit = (hPx * PX_TO_MM) / vb[3];
    else unit = 1; // keine physische Größe angegeben → 1 Einheit = 1 mm
  }
  const userScale = opts.scale ?? 1;
  const root: Mat = mul([unit * userScale, 0, 0, unit * userScale, 0, 0], [1, 0, 0, 1, -ox, -oy]);

  const stack: Mat[] = [root];
  let skipDepth = 0;
  const tagRe = /<(\/?)([a-zA-Z][\w:.-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let t: RegExpExecArray | null;

  while ((t = tagRe.exec(clean)) !== null) {
    const closing = t[1] === '/';
    const name = t[2].toLowerCase().replace(/^svg:/, '');
    const attrStr = t[3];
    const selfClosing = t[4] === '/';

    if (SKIP_CONTAINERS.has(name)) {
      if (closing) skipDepth = Math.max(0, skipDepth - 1);
      else if (!selfClosing) skipDepth++;
      continue;
    }
    if (skipDepth > 0) continue;

    if (name === 'g' || name === 'svg') {
      if (closing) {
        if (stack.length > 1) stack.pop();
      } else if (!selfClosing) {
        const a = attrs(attrStr);
        stack.push(a.transform ? mul(stack[stack.length - 1], parseTransform(a.transform)) : stack[stack.length - 1]);
      }
      continue;
    }
    if (closing || !SHAPES.has(name)) {
      if (!closing && !SHAPES.has(name) && !['title', 'desc', 'metadata', 'style', 'text', 'tspan', 'use', 'image'].includes(name)) {
        // unbekanntes Element – nur zählen, wenn es Geometrie sein könnte
      } else if (!closing && ['text', 'tspan', 'use', 'image'].includes(name)) {
        skip(name);
      }
      continue;
    }

    const a = attrs(attrStr);
    if ((a.display ?? '').trim() === 'none') continue;
    const m = a.transform ? mul(stack[stack.length - 1], parseTransform(a.transform)) : stack[stack.length - 1];
    const layer = (a['inkscape:label'] || a.id || '0').replace(/[^\w.-]/g, '_') || '0';
    const tp = (p: Pt) => apply(m, p);

    switch (name) {
      case 'line':
        entities.push({
          kind: 'polyline',
          layer,
          points: [tp({ x: numAttr(a, 'x1'), y: numAttr(a, 'y1') }), tp({ x: numAttr(a, 'x2'), y: numAttr(a, 'y2') })],
          closed: false,
        });
        break;
      case 'polyline':
      case 'polygon': {
        const nums = (a.points ?? '').match(/-?[\d.]+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
        const pts: Pt[] = [];
        for (let i = 0; i + 1 < nums.length; i += 2) pts.push(tp({ x: nums[i], y: nums[i + 1] }));
        if (pts.length >= 2) entities.push({ kind: 'polyline', layer, points: pts, closed: name === 'polygon' });
        break;
      }
      case 'rect': {
        const x = numAttr(a, 'x');
        const y = numAttr(a, 'y');
        const w = numAttr(a, 'width');
        const h = numAttr(a, 'height');
        if (w > 0 && h > 0) {
          entities.push({
            kind: 'polyline',
            layer,
            points: [
              tp({ x, y }),
              tp({ x: x + w, y }),
              tp({ x: x + w, y: y + h }),
              tp({ x, y: y + h }),
            ],
            closed: true,
          });
        }
        break;
      }
      case 'circle': {
        const r = numAttr(a, 'r');
        if (r > 0) {
          const c = tp({ x: numAttr(a, 'cx'), y: numAttr(a, 'cy') });
          if (isUniform(m)) entities.push({ kind: 'circle', layer, c, r: r * scaleOf(m) });
          else {
            const rs = r * scaleOf(m);
            entities.push({ kind: 'ellipse', layer, c, rx: rs, ry: rs, rot: 0 });
          }
        }
        break;
      }
      case 'ellipse': {
        const rx = numAttr(a, 'rx');
        const ry = numAttr(a, 'ry');
        if (rx > 0 && ry > 0) {
          const c = tp({ x: numAttr(a, 'cx'), y: numAttr(a, 'cy') });
          const s = scaleOf(m);
          entities.push({ kind: 'ellipse', layer, c, rx: rx * s, ry: ry * s, rot: -Math.atan2(m[1], m[0]) * DEG });
        }
        break;
      }
      case 'path': {
        const subs = pathPoints(a.d ?? '');
        for (const sub of subs) {
          const pts = sub.points.map(tp);
          if (pts.length >= 2) entities.push({ kind: 'polyline', layer, points: pts, closed: sub.closed });
        }
        break;
      }
    }
  }

  if (entities.length === 0) {
    throw new ConvertError('Keine Geometrie gefunden – enthält die Datei nur Text, Bilder oder Verweise?');
  }

  // SVG zählt y nach unten, DXF nach oben → spiegeln, damit die Zeichnung richtig herum liegt.
  const raw = boundsOf(entities);
  const flipped = entities.map((e): Entity => {
    const fy = (y: number) => raw.maxY - (y - raw.minY);
    switch (e.kind) {
      case 'polyline':
        return { ...e, points: e.points.map((p) => ({ x: p.x, y: fy(p.y) })) };
      case 'circle':
        return { ...e, c: { x: e.c.x, y: fy(e.c.y) } };
      case 'arc':
        return { ...e, c: { x: e.c.x, y: fy(e.c.y) }, a1: -e.a2, a2: -e.a1 };
      case 'ellipse':
        return { ...e, c: { x: e.c.x, y: fy(e.c.y) }, rot: -e.rot };
    }
  });
  return makeDrawing(flipped, skipped);
}

/* ---------------- Format erkennen ---------------- */

export type FileFormat = 'dxf' | 'svg';

export function detectFormat(text: string, filename = ''): FileFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.dxf')) return 'dxf';
  if (lower.endsWith('.svg')) return 'svg';
  const head = text.slice(0, 2000);
  if (/<svg[\s>]/i.test(head)) return 'svg';
  if (/^\s*\d+\s*[\r\n]/.test(head) || /\bSECTION\b/.test(head)) return 'dxf';
  throw new ConvertError('Format nicht erkannt – bitte eine DXF- oder SVG-Datei wählen.');
}

export function convert(text: string, filename = '', opts: SvgParseOptions & SvgOptions = {}): {
  from: FileFormat;
  to: FileFormat;
  drawing: Drawing;
  output: string;
} {
  const from = detectFormat(text, filename);
  if (from === 'dxf') {
    const drawing = parseDxf(text);
    return { from, to: 'svg', drawing, output: writeSvg(drawing, opts) };
  }
  const drawing = parseSvg(text, opts);
  return { from, to: 'dxf', drawing, output: writeDxf(drawing) };
}
