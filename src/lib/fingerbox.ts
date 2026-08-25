/**
 * Fingerzinken-Box (Box-Joint-Kiste) für Laser & CNC.
 * Pure Funktionen – server- und clientseitig identisch ausführbar, getestet.
 *
 * Geometrie: Jede Platte ist ein rechtwinkliges Polygon. An jeder Stoßkante
 * wechseln sich Zapfen (Material bis zur Außenfläche) und Ausklinkungen
 * (um die Materialstärke zurückgesetzt) ab. Zwei zusammengehörende Kanten
 * bekommen dieselbe – immer ungerade – Fingerzahl, aber invertierte Phase:
 * Vorder-/Rückwand sind an den senkrechten Ecken "positiv", die Seitenwände
 * "negativ"; alle Wände sind gegenüber Boden/Deckel "positiv". Weil die
 * Fingerzahl ungerade ist, passt das Muster auch bei umgekehrter Laufrichtung
 * der Kante (linke vs. rechte Wand) noch zusammen.
 *
 * Kerf: Der Laser frisst die Schnittfuge k. Damit die Teile Nennmaß behalten,
 * wird jede Kontur um k/2 nach außen versetzt – Zapfen werden dadurch um k
 * breiter, Ausklinkungen um k schmaler; nach dem Schnitt passt beides exakt.
 */

export interface BoxSpec {
  /** Länge (X) in mm. */
  length: number;
  /** Breite/Tiefe (Y) in mm. */
  width: number;
  /** Höhe (Z) in mm. */
  height: number;
  /** Materialstärke in mm. */
  thickness: number;
  /** Ziel-Fingerbreite in mm (wird pro Kante auf eine ungerade Anzahl gerundet). */
  fingerWidth: number;
  /** Schnittfuge (Kerf) in mm. */
  kerf: number;
  /** Maße als Außen- oder Innenmaß interpretieren. */
  measure: 'outer' | 'inner';
  /** Deckel erzeugen (sonst oben offen). */
  lid: boolean;
  /** Breite der Arbeitsfläche für die Anordnung in mm. */
  bedWidth: number;
}

export interface Pt {
  x: number;
  y: number;
}

export interface Panel {
  id: string;
  name: string;
  /** Nennmaße der Platte (ohne Kerf) in mm – für die Teileliste. */
  w: number;
  h: number;
  /** Position der Platte im Layout (linke untere Ecke) in mm. */
  x: number;
  y: number;
  /** Absolute Konturpunkte im Layout (y-Achse zeigt nach oben). */
  points: Pt[];
}

export interface BoxResult {
  panels: Panel[];
  outer: { length: number; width: number; height: number };
  inner: { length: number; width: number; height: number };
  /** Fingeranzahl je Kantenrichtung. */
  fingers: { length: number; width: number; height: number };
  /** Tatsächliche Fingerbreite je Kantenrichtung in mm. */
  fingerSize: { length: number; width: number; height: number };
  /** Benötigte Fläche der Anordnung in mm. */
  layout: { width: number; height: number };
  /** Summe der Plattenflächen (Nennmaß) in mm². */
  partsArea: number;
  /** Gesamte Schnittlänge in mm (Richtwert für Laser-Zeitabschätzung). */
  cutLength: number;
  errors: string[];
  warnings: string[];
}

const EPS = 1e-6;

type EdgeSpec = { kind: 'flat' } | { kind: 'fingers'; n: number; positive: boolean };

/**
 * Ungerade Fingeranzahl für eine Kante bestimmen. Ungerade sorgt dafür, dass
 * eine Kante mit Zapfen beginnt UND endet – dadurch bleibt das Muster beim
 * Spiegeln der Laufrichtung gültig.
 */
export function fingerCount(edge: number, target: number, thickness: number): number {
  if (!(edge > 0)) return 1;
  const t = Math.max(thickness, 0.1);
  const raw = Math.max(1, Math.round(edge / Math.max(target, 0.1)));
  let n = raw % 2 === 1 ? raw : raw + 1;
  // Kein Finger darf schmaler als die Materialstärke werden.
  const maxRaw = Math.max(1, Math.floor(edge / t));
  const maxOdd = maxRaw % 2 === 1 ? maxRaw : maxRaw - 1;
  n = Math.min(n, Math.max(1, maxOdd));
  return Math.max(1, n);
}

/** Punkte einer Kante erzeugen (Zapfen auf Höhe 0, Ausklinkung um t nach innen). */
function edgePoints(
  start: Pt,
  along: Pt,
  inward: Pt,
  length: number,
  spec: EdgeSpec,
  t: number,
): Pt[] {
  if (spec.kind === 'flat') {
    return [
      { x: start.x, y: start.y },
      { x: start.x + along.x * length, y: start.y + along.y * length },
    ];
  }
  const { n, positive } = spec;
  const f = length / n;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const isTab = positive ? i % 2 === 0 : i % 2 === 1;
    const d = isTab ? 0 : t;
    const s0 = i * f;
    const s1 = (i + 1) * f;
    pts.push({ x: start.x + along.x * s0 + inward.x * d, y: start.y + along.y * s0 + inward.y * d });
    pts.push({ x: start.x + along.x * s1 + inward.x * d, y: start.y + along.y * s1 + inward.y * d });
  }
  return pts;
}

/** Doppelte und kollineare Punkte entfernen (Voraussetzung für den Kerf-Versatz). */
export function simplify(pts: Pt[]): Pt[] {
  const a: Pt[] = [];
  for (const p of pts) {
    const last = a[a.length - 1];
    if (!last || Math.abs(last.x - p.x) > EPS || Math.abs(last.y - p.y) > EPS) a.push(p);
  }
  while (
    a.length > 1 &&
    Math.abs(a[0].x - a[a.length - 1].x) < EPS &&
    Math.abs(a[0].y - a[a.length - 1].y) < EPS
  ) {
    a.pop();
  }
  if (a.length < 3) return a;
  const b: Pt[] = [];
  for (let i = 0; i < a.length; i++) {
    const prev = a[(i - 1 + a.length) % a.length];
    const cur = a[i];
    const next = a[(i + 1) % a.length];
    const cross = (cur.x - prev.x) * (next.y - cur.y) - (cur.y - prev.y) * (next.x - cur.x);
    if (Math.abs(cross) > EPS) b.push(cur);
  }
  return b.length >= 3 ? b : a;
}

/**
 * Rechtwinkliges Polygon (Umlauf gegen den Uhrzeigersinn) um d nach außen
 * versetzen. Bei 90°-Ecken ist die Gehrung exakt die Diagonale d·√2, deshalb
 * genügt die Summe der beiden Kanten-Normalen.
 */
export function offsetPolygon(pts: Pt[], d: number): Pt[] {
  if (Math.abs(d) < EPS || pts.length < 3) return pts.map((p) => ({ ...p }));
  const n = pts.length;
  const unit = (p: Pt): Pt => {
    const len = Math.hypot(p.x, p.y);
    return len < EPS ? { x: 0, y: 0 } : { x: p.x / len, y: p.y / len };
  };
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const dIn = unit({ x: cur.x - prev.x, y: cur.y - prev.y });
    const dOut = unit({ x: next.x - cur.x, y: next.y - cur.y });
    // Außennormale bei CCW-Umlauf: (dy, -dx)
    const nx = dIn.y + dOut.y;
    const ny = -dIn.x - dOut.x;
    out.push({ x: cur.x + d * nx, y: cur.y + d * ny });
  }
  return out;
}

/**
 * Plattenkontur aus vier Kantenspezifikationen (Umlauf CCW ab (0,0)).
 * Stoßen an einer Ecke zwei Ausklinkungen aufeinander, fehlt zwischen den
 * Kantenenden ein Eckpunkt – ohne ihn entstünde eine Diagonale. Der fehlende
 * Punkt liegt im Schnitt beider Kantenlinien.
 */
function panelOutline(
  a: number,
  b: number,
  t: number,
  kerf: number,
  edges: { bottom: EdgeSpec; right: EdgeSpec; top: EdgeSpec; left: EdgeSpec },
): Pt[] {
  const list = [
    { pts: edgePoints({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, a, edges.bottom, t), horizontal: true },
    { pts: edgePoints({ x: a, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, b, edges.right, t), horizontal: false },
    { pts: edgePoints({ x: a, y: b }, { x: -1, y: 0 }, { x: 0, y: -1 }, a, edges.top, t), horizontal: true },
    { pts: edgePoints({ x: 0, y: b }, { x: 0, y: -1 }, { x: 1, y: 0 }, b, edges.left, t), horizontal: false },
  ];
  const pts: Pt[] = [];
  for (let e = 0; e < list.length; e++) {
    const prev = list[(e + list.length - 1) % list.length];
    const cur = list[e];
    const p = prev.pts[prev.pts.length - 1];
    const q = cur.pts[0];
    if (Math.abs(p.x - q.x) > EPS && Math.abs(p.y - q.y) > EPS) {
      pts.push(prev.horizontal ? { x: q.x, y: p.y } : { x: p.x, y: q.y });
    }
    pts.push(...cur.pts);
  }
  return offsetPolygon(simplify(pts), kerf / 2);
}

const bounds = (pts: Pt[]) => {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
};

export function buildBox(spec: BoxSpec): BoxResult {
  const t = spec.thickness;
  const kerf = Math.max(0, spec.kerf || 0);
  const errors: string[] = [];
  const warnings: string[] = [];

  const outer =
    spec.measure === 'inner'
      ? { length: spec.length + 2 * t, width: spec.width + 2 * t, height: spec.height + 2 * t }
      : { length: spec.length, width: spec.width, height: spec.height };
  const inner = {
    length: outer.length - 2 * t,
    width: outer.width - 2 * t,
    height: outer.height - 2 * t,
  };

  const empty: BoxResult = {
    panels: [],
    outer,
    inner,
    fingers: { length: 0, width: 0, height: 0 },
    fingerSize: { length: 0, width: 0, height: 0 },
    layout: { width: 0, height: 0 },
    partsArea: 0,
    cutLength: 0,
    errors,
    warnings,
  };

  if (!(t > 0)) errors.push('Die Materialstärke muss größer als 0 sein.');
  if (!(spec.length > 0) || !(spec.width > 0) || !(spec.height > 0)) {
    errors.push('Länge, Breite und Höhe müssen größer als 0 sein.');
  }
  if (errors.length > 0) return empty;
  if (inner.length <= 0 || inner.width <= 0 || inner.height <= 0) {
    errors.push(
      `Die Außenmaße müssen größer als die doppelte Materialstärke (${(2 * t).toLocaleString('de-DE')} mm) sein.`,
    );
    return empty;
  }
  if (spec.fingerWidth < t) {
    warnings.push('Die Fingerbreite liegt unter der Materialstärke – die Zinken werden auf das Minimum vergrößert.');
  }

  const nL = fingerCount(outer.length, spec.fingerWidth, t);
  const nW = fingerCount(outer.width, spec.fingerWidth, t);
  const nH = fingerCount(outer.height, spec.fingerWidth, t);
  if (nL < 3 || nW < 3 || nH < 3) {
    warnings.push('Mindestens eine Kante bekommt nur einen Zapfen – für eine echte Zinkung Kiste größer oder Material dünner wählen.');
  }

  const fin = (n: number, positive: boolean): EdgeSpec => ({ kind: 'fingers', n, positive });
  const flat: EdgeSpec = { kind: 'flat' };
  const topWall = (n: number): EdgeSpec => (spec.lid ? fin(n, true) : flat);

  // Wände sind gegenüber Boden/Deckel positiv; an den senkrechten Ecken sind
  // Vorder-/Rückwand positiv und die Seitenwände negativ.
  const defs: { id: string; name: string; a: number; b: number; edges: Parameters<typeof panelOutline>[4] }[] = [
    {
      id: 'boden',
      name: 'Boden',
      a: outer.length,
      b: outer.width,
      edges: { bottom: fin(nL, false), right: fin(nW, false), top: fin(nL, false), left: fin(nW, false) },
    },
    {
      id: 'vorne',
      name: 'Vorderwand',
      a: outer.length,
      b: outer.height,
      edges: { bottom: fin(nL, true), right: fin(nH, true), top: topWall(nL), left: fin(nH, true) },
    },
    {
      id: 'hinten',
      name: 'Rückwand',
      a: outer.length,
      b: outer.height,
      edges: { bottom: fin(nL, true), right: fin(nH, true), top: topWall(nL), left: fin(nH, true) },
    },
    {
      id: 'links',
      name: 'Seitenwand links',
      a: outer.width,
      b: outer.height,
      edges: { bottom: fin(nW, true), right: fin(nH, false), top: topWall(nW), left: fin(nH, false) },
    },
    {
      id: 'rechts',
      name: 'Seitenwand rechts',
      a: outer.width,
      b: outer.height,
      edges: { bottom: fin(nW, true), right: fin(nH, false), top: topWall(nW), left: fin(nH, false) },
    },
  ];
  if (spec.lid) {
    defs.push({
      id: 'deckel',
      name: 'Deckel',
      a: outer.length,
      b: outer.width,
      edges: { bottom: fin(nL, false), right: fin(nW, false), top: fin(nL, false), left: fin(nW, false) },
    });
  }

  // Anordnung: Reihenweise (Shelf-Packing) innerhalb der Arbeitsflächenbreite.
  const gap = Math.max(2, t);
  const bed = Math.max(spec.bedWidth, 1);
  const panels: Panel[] = [];
  let cx = 0;
  let cy = 0;
  let rowH = 0;
  let layoutW = 0;

  for (const d of defs) {
    const local = panelOutline(d.a, d.b, t, kerf, d.edges);
    const bb = bounds(local);
    const pw = bb.maxX - bb.minX;
    const ph = bb.maxY - bb.minY;
    if (cx > 0 && cx + pw > bed + EPS) {
      cy += rowH + gap;
      cx = 0;
      rowH = 0;
    }
    const ox = cx - bb.minX;
    const oy = cy - bb.minY;
    panels.push({
      id: d.id,
      name: d.name,
      w: d.a,
      h: d.b,
      x: cx,
      y: cy,
      points: local.map((p) => ({ x: p.x + ox, y: p.y + oy })),
    });
    cx += pw + gap;
    rowH = Math.max(rowH, ph);
    layoutW = Math.max(layoutW, cx - gap);
  }

  const cutLength = panels.reduce((sum, p) => {
    let len = 0;
    for (let i = 0; i < p.points.length; i++) {
      const a2 = p.points[i];
      const b2 = p.points[(i + 1) % p.points.length];
      len += Math.hypot(b2.x - a2.x, b2.y - a2.y);
    }
    return sum + len;
  }, 0);

  if (layoutW > bed + EPS) {
    warnings.push('Eine Platte ist breiter als die Arbeitsfläche – Arbeitsflächenbreite erhöhen oder Kiste verkleinern.');
  }

  return {
    panels,
    outer,
    inner,
    fingers: { length: nL, width: nW, height: nH },
    fingerSize: {
      length: outer.length / nL,
      width: outer.width / nW,
      height: outer.height / nH,
    },
    layout: { width: layoutW, height: cy + rowH },
    partsArea: defs.reduce((s, d) => s + d.a * d.b, 0),
    cutLength,
    errors,
    warnings,
  };
}

/* ---------- Export (pure String-Builder, kein DOM) ---------- */

const escXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const nf3 = (n: number) => (Math.round(n * 1000) / 1000).toString();
const fmtMm = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

const FONT = 'ui-sans-serif, system-ui, sans-serif';

/** SVG-Pfad einer Platte; y wird gespiegelt (SVG zählt y nach unten). */
function panelPath(panel: Panel, totalH: number): string {
  return panel.points.map((p) => `${nf3(p.x)},${nf3(totalH - p.y)}`).join(' ');
}

/** Vorschau-SVG mit Beschriftung (nur Anzeige, wird nicht exportiert). */
export function previewSvg(result: BoxResult): string {
  const { width: W, height: H } = result.layout;
  if (result.panels.length === 0 || W <= 0 || H <= 0) return '';
  const pad = Math.max(W, H) * 0.02;
  const fs = Math.max(W, H) / 55;
  const shapes = result.panels
    .map((p) => {
      const cx = p.x + p.w / 2;
      const cy = H - (p.y + p.h / 2);
      const label = escXml(p.name);
      const dims = `${fmtMm(p.w)} × ${fmtMm(p.h)}`;
      const fits = p.h > fs * 3 && p.w > Math.max(label.length, dims.length) * fs * 0.6;
      const text = fits
        ? `<text x="${nf3(cx)}" y="${nf3(cy - fs * 0.2)}" font-family="${FONT}" font-size="${nf3(fs)}" font-weight="600" fill="#7c2d12" text-anchor="middle">${label}</text><text x="${nf3(cx)}" y="${nf3(cy + fs)}" font-family="${FONT}" font-size="${nf3(fs * 0.85)}" fill="#9a3412" text-anchor="middle">${dims}</text>`
        : '';
      return `<g><polygon points="${panelPath(p, H)}" fill="#ffedd5" stroke="#c2410c" stroke-width="0.6" vector-effect="non-scaling-stroke"/><title>${label} – ${dims} mm</title>${text}</g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${nf3(-pad)} ${nf3(-pad)} ${nf3(W + 2 * pad)} ${nf3(H + 2 * pad)}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Anordnung der Zuschnitte für die Fingerzinken-Box">${shapes}</svg>`;
}

/** Maßstabsgetreues Export-SVG (mm) – nur Schnittkonturen, keine Beschriftung. */
export function exportSvg(result: BoxResult): string {
  const { width: W, height: H } = result.layout;
  if (result.panels.length === 0 || W <= 0 || H <= 0) return '';
  const shapes = result.panels
    .map((p) => `<polygon points="${panelPath(p, H)}" fill="none" stroke="#000000" stroke-width="0.1"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${nf3(W)}mm" height="${nf3(H)}mm" viewBox="0 0 ${nf3(W)} ${nf3(H)}">${shapes}</svg>`;
}

/** DXF (R12, ENTITIES) – y zeigt nach oben, ein Layer je Platte. */
export function exportDxf(result: BoxResult): string {
  let s = '0\nSECTION\n2\nENTITIES\n';
  for (const p of result.panels) {
    const layer = p.id.replace(/[^a-z0-9]/gi, '_');
    for (let i = 0; i < p.points.length; i++) {
      const a = p.points[i];
      const b = p.points[(i + 1) % p.points.length];
      s += `0\nLINE\n8\n${layer}\n10\n${a.x.toFixed(4)}\n20\n${a.y.toFixed(4)}\n11\n${b.x.toFixed(4)}\n21\n${b.y.toFixed(4)}\n`;
    }
  }
  s += '0\nENDSEC\n0\nEOF\n';
  return s;
}
