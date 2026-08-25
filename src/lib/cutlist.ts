/**
 * Zuschnittoptimierung (Guillotine-Packing) für Plattenmaterial.
 * Pure Funktionen – server- und clientseitig identisch ausführbar, getestet.
 *
 * Verfahren: Free-Rectangle-Heuristik mit Guillotine-Splits. Mehrere Sortier-,
 * Split- und Platten-Strategien werden durchprobiert, das beste Ergebnis gewinnt
 * (wenigste Platten, dann möglichst leere letzte Platte = großer nutzbarer Rest).
 * Alle Schnitte sind durchgehende Guillotine-Schnitte – mit Plattensäge, Tisch-
 * oder Handkreissäge umsetzbar. Die Sägeblattbreite (Kerf) wird bei jedem
 * Schnitt berücksichtigt, ebenso ein optionaler Randbeschnitt.
 */

/** Teil (Eingabe). Maße in mm; `length` liegt in Plattenlängsrichtung. */
export interface CutPart {
  length: number;
  width: number;
  qty: number;
  label?: string;
  /** Drehen um 90° erlaubt (keine Maserrichtung zu beachten). */
  rotatable?: boolean;
}

/** Plattenmaß & Schnittparameter. Maße in mm. */
export interface SheetSpec {
  length: number;
  width: number;
  /** Sägeblattbreite (Kerf) – geht bei jedem Schnitt verloren. */
  kerf: number;
  /** Randbeschnitt rundum, z. B. für beschädigte Kanten. */
  trim?: number;
}

export interface Placement {
  x: number;
  y: number;
  /** Platziertes Maß in Längsrichtung (nach evtl. Drehung). */
  length: number;
  width: number;
  rotated: boolean;
  label: string;
}

export interface Offcut {
  x: number;
  y: number;
  length: number;
  width: number;
}

export interface SheetLayout {
  placements: Placement[];
  /** Belegte Fläche (Summe Teilflächen) in mm². */
  usedArea: number;
  /** Verschnitt bezogen auf die Brutto-Plattenfläche in %. */
  wastePercent: number;
  /** Verwertbare Reststücke (beide Kanten ≥ 50 mm), größte zuerst. */
  offcuts: Offcut[];
}

export interface CutlistResult {
  sheets: SheetLayout[];
  /** Angefragte Stückzahl aller gültigen Teile. */
  requestedParts: number;
  placedParts: number;
  /** Teile, die (auch gedreht) nicht auf die Platte passen. */
  unplaceable: { length: number; width: number; qty: number; label: string }[];
  /** true, wenn die Teileliste das Rechenlimit überschritt und gekürzt wurde. */
  truncated: boolean;
  partsArea: number;
  sheetsArea: number;
  wastePercent: number;
}

const EPS = 1e-6;
/** Obergrenze expandierter Einzelteile (Schutz vor Browser-Freeze). */
export const MAX_PARTS = 2000;
/** Reststücke unterhalb dieser Kantenlänge werden nicht als nutzbar gelistet. */
const MIN_OFFCUT = 50;

interface Rect {
  x: number;
  y: number;
  l: number;
  w: number;
}

interface FlatPart {
  l: number;
  w: number;
  label: string;
  rotatable: boolean;
}

type SortKey = 'area' | 'long' | 'short' | 'perimeter';
type SplitRule = 'auto' | 'length' | 'width';
type SheetPolicy = 'first' | 'best';

const SORT_FNS: Record<SortKey, (p: FlatPart) => number> = {
  area: (p) => p.l * p.w,
  long: (p) => Math.max(p.l, p.w),
  short: (p) => Math.min(p.l, p.w),
  perimeter: (p) => p.l + p.w,
};

function sortParts(parts: FlatPart[], key: SortKey): FlatPart[] {
  const f = SORT_FNS[key];
  return [...parts].sort(
    (a, b) => f(b) - f(a) || b.l * b.w - a.l * a.w || a.label.localeCompare(b.label, 'de'),
  );
}

interface Fit {
  ri: number;
  ol: number;
  ow: number;
  rotated: boolean;
  /** Restfläche des Free-Rects (Best Area Fit – kleiner ist besser). */
  score: number;
  /** Kürzere Restkante (Best Short Side – Tiebreak). */
  tie: number;
}

function findFit(free: Rect[], p: FlatPart): Fit | null {
  let best: Fit | null = null;
  for (let ri = 0; ri < free.length; ri++) {
    const r = free[ri];
    const orients: [number, number][] =
      p.rotatable && Math.abs(p.l - p.w) > EPS
        ? [
            [p.l, p.w],
            [p.w, p.l],
          ]
        : [[p.l, p.w]];
    for (const [ol, ow] of orients) {
      if (ol <= r.l + EPS && ow <= r.w + EPS) {
        const score = r.l * r.w - ol * ow;
        const tie = Math.min(r.l - ol, r.w - ow);
        if (!best || score < best.score - EPS || (Math.abs(score - best.score) <= EPS && tie < best.tie)) {
          best = { ri, ol, ow, rotated: ol !== p.l, score, tie };
        }
      }
    }
  }
  return best;
}

interface WorkSheet {
  free: Rect[];
  placements: Placement[];
}

function place(sheet: WorkSheet, fit: Fit, p: FlatPart, kerf: number, split: SplitRule): void {
  const r = sheet.free[fit.ri];
  sheet.free.splice(fit.ri, 1);
  sheet.placements.push({
    x: r.x,
    y: r.y,
    length: fit.ol,
    width: fit.ow,
    rotated: fit.rotated,
    label: p.label,
  });
  const restL = r.l - fit.ol - kerf;
  const restW = r.w - fit.ow - kerf;
  let mode = split;
  if (mode === 'auto') {
    // Regel: das größte zusammenhängende Rest-Rechteck maximieren.
    const alongLen = Math.max(restL * r.w, fit.ol * restW);
    const alongWid = Math.max(restL * fit.ow, r.l * restW);
    mode = alongLen >= alongWid ? 'length' : 'width';
  }
  let right: Rect;
  let bottom: Rect;
  if (mode === 'length') {
    right = { x: r.x + fit.ol + kerf, y: r.y, l: restL, w: r.w };
    bottom = { x: r.x, y: r.y + fit.ow + kerf, l: fit.ol, w: restW };
  } else {
    right = { x: r.x + fit.ol + kerf, y: r.y, l: restL, w: fit.ow };
    bottom = { x: r.x, y: r.y + fit.ow + kerf, l: r.l, w: restW };
  }
  if (right.l > EPS && right.w > EPS) sheet.free.push(right);
  if (bottom.l > EPS && bottom.w > EPS) sheet.free.push(bottom);
}

function packRun(
  parts: FlatPart[],
  usable: Rect,
  kerf: number,
  split: SplitRule,
  policy: SheetPolicy,
): WorkSheet[] {
  const sheets: WorkSheet[] = [];
  for (const p of parts) {
    let target = -1;
    let fit: Fit | null = null;
    if (policy === 'first') {
      for (let si = 0; si < sheets.length; si++) {
        const f = findFit(sheets[si].free, p);
        if (f) {
          target = si;
          fit = f;
          break;
        }
      }
    } else {
      for (let si = 0; si < sheets.length; si++) {
        const f = findFit(sheets[si].free, p);
        if (f && (!fit || f.score < fit.score - EPS || (Math.abs(f.score - fit.score) <= EPS && f.tie < fit.tie))) {
          target = si;
          fit = f;
        }
      }
    }
    if (!fit) {
      sheets.push({ free: [{ ...usable }], placements: [] });
      target = sheets.length - 1;
      fit = findFit(sheets[target].free, p);
      if (!fit) continue; // kann nicht passieren – Passform wurde vorab geprüft
    }
    place(sheets[target], fit, p, kerf, split);
  }
  return sheets;
}

export function optimize(parts: CutPart[], spec: SheetSpec): CutlistResult {
  const kerf = Math.max(0, spec.kerf || 0);
  const trim = Math.max(0, spec.trim ?? 0);
  const sheetL = spec.length;
  const sheetW = spec.width;
  const uL = sheetL - 2 * trim;
  const uW = sheetW - 2 * trim;
  const sheetArea = sheetL * sheetW;

  const empty: CutlistResult = {
    sheets: [],
    requestedParts: 0,
    placedParts: 0,
    unplaceable: [],
    truncated: false,
    partsArea: 0,
    sheetsArea: 0,
    wastePercent: 0,
  };
  if (!(sheetL > 0) || !(sheetW > 0)) return empty;

  const valid = parts
    .map((p) => ({
      length: p.length,
      width: p.width,
      qty: Math.floor(p.qty),
      label: (p.label ?? '').trim(),
      rotatable: p.rotatable !== false,
    }))
    .filter((p) => p.length > 0 && p.width > 0 && p.qty >= 1);

  const fits = (p: (typeof valid)[number]): boolean =>
    (uL > 0 &&
      uW > 0 &&
      ((p.length <= uL + EPS && p.width <= uW + EPS) ||
        (p.rotatable && p.width <= uL + EPS && p.length <= uW + EPS))) ||
    false;

  const unplaceable = valid
    .filter((p) => !fits(p))
    .map((p) => ({ length: p.length, width: p.width, qty: p.qty, label: p.label }));
  const fitting = valid.filter(fits);
  const requestedParts = valid.reduce((s, p) => s + p.qty, 0);

  let flat: FlatPart[] = [];
  for (const p of fitting) {
    const label = p.label || `${p.length} × ${p.width}`;
    for (let i = 0; i < p.qty; i++) {
      flat.push({ l: p.length, w: p.width, label, rotatable: p.rotatable });
    }
  }
  const truncated = flat.length > MAX_PARTS;
  if (truncated) flat = flat.slice(0, MAX_PARTS);

  if (flat.length === 0) {
    return { ...empty, requestedParts, unplaceable, truncated };
  }

  const usable: Rect = { x: trim, y: trim, l: uL, w: uW };

  // Strategie-Suchraum – bei sehr vielen Teilen reduziert (Rechenzeit).
  const sorts: SortKey[] = flat.length > 300 ? ['area', 'long'] : ['area', 'long', 'short', 'perimeter'];
  const splits: SplitRule[] = flat.length > 300 ? ['auto'] : ['auto', 'length', 'width'];
  const policies: SheetPolicy[] = ['first', 'best'];

  let best: WorkSheet[] | null = null;
  let bestLastUsed = Infinity;
  for (const sort of sorts) {
    const sorted = sortParts(flat, sort);
    for (const split of splits) {
      for (const policy of policies) {
        const run = packRun(sorted, usable, kerf, split, policy);
        const lastUsed =
          run.length > 0
            ? run[run.length - 1].placements.reduce((s, pl) => s + pl.length * pl.width, 0)
            : 0;
        if (!best || run.length < best.length || (run.length === best.length && lastUsed < bestLastUsed - EPS)) {
          best = run;
          bestLastUsed = lastUsed;
        }
      }
    }
  }

  const sheets: SheetLayout[] = (best ?? []).map((s) => {
    const usedArea = s.placements.reduce((sum, pl) => sum + pl.length * pl.width, 0);
    const offcuts = s.free
      .filter((r) => r.l >= MIN_OFFCUT && r.w >= MIN_OFFCUT)
      .sort((a, b) => b.l * b.w - a.l * a.w)
      .map((r) => ({ x: r.x, y: r.y, length: r.l, width: r.w }));
    return {
      placements: s.placements,
      usedArea,
      wastePercent: sheetArea > 0 ? (1 - usedArea / sheetArea) * 100 : 0,
      offcuts,
    };
  });

  const partsArea = sheets.reduce((s, sh) => s + sh.usedArea, 0);
  const sheetsArea = sheets.length * sheetArea;
  return {
    sheets,
    requestedParts,
    placedParts: sheets.reduce((s, sh) => s + sh.placements.length, 0),
    unplaceable,
    truncated,
    partsArea,
    sheetsArea,
    wastePercent: sheetsArea > 0 ? (1 - partsArea / sheetsArea) * 100 : 0,
  };
}

/* ---------- SVG-Rendering (pure String-Builder, kein DOM) ---------- */

const escXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** mm-Zahl ohne Tausendertrennung, Komma als Dezimaltrenner (Werkstatt-üblich). */
const fmtMm = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

const FONT = 'ui-sans-serif, system-ui, sans-serif';

/** Innere Shapes einer Platte (ohne <svg>-Hülle). */
function sheetShapes(layout: SheetLayout, spec: SheetSpec): string {
  const { length: L, width: W } = spec;
  const trim = Math.max(0, spec.trim ?? 0);
  const fs = Math.max(L, W) / 70;
  let s = `<rect x="0" y="0" width="${L}" height="${W}" fill="#f4f4f5" stroke="#71717a" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  if (trim > 0) {
    s += `<rect x="${trim}" y="${trim}" width="${L - 2 * trim}" height="${W - 2 * trim}" fill="none" stroke="#d4d4d8" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`;
  }
  for (const p of layout.placements) {
    const dims = `${fmtMm(p.length)} × ${fmtMm(p.width)}`;
    const label = escXml(p.label);
    s += `<g><rect x="${p.x}" y="${p.y}" width="${p.length}" height="${p.width}" fill="#ffedd5" stroke="#c2410c" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
    s += `<title>${label} – ${dims} mm</title>`;
    const cx = p.x + p.length / 2;
    const cy = p.y + p.width / 2;
    const fitsTwo = p.width > fs * 2.8 && p.length > Math.max(p.label.length, dims.length) * fs * 0.62;
    const fitsOne = p.width > fs * 1.5 && p.length > dims.length * fs * 0.55;
    if (fitsTwo) {
      s += `<text x="${cx}" y="${cy - fs * 0.25}" font-family="${FONT}" font-size="${fs}" font-weight="600" fill="#7c2d12" text-anchor="middle">${label}</text>`;
      s += `<text x="${cx}" y="${cy + fs}" font-family="${FONT}" font-size="${fs * 0.85}" fill="#9a3412" text-anchor="middle">${dims}</text>`;
    } else if (fitsOne) {
      s += `<text x="${cx}" y="${cy + fs * 0.35}" font-family="${FONT}" font-size="${fs * 0.85}" fill="#9a3412" text-anchor="middle">${dims}</text>`;
    }
    s += `</g>`;
  }
  return s;
}

/** Responsives Vorschau-SVG einer Platte (Browser-Anzeige). */
export function sheetSvg(layout: SheetLayout, spec: SheetSpec): string {
  const { length: L, width: W } = spec;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${W}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Schnittplan einer Platte ${fmtMm(L)} × ${fmtMm(W)} mm">${sheetShapes(layout, spec)}</svg>`;
}

/** Maßstabsgetreues Download-SVG (mm-Einheiten) mit allen Platten untereinander. */
export function combinedSvg(result: CutlistResult, spec: SheetSpec): string {
  const { length: L, width: W } = spec;
  const fs = Math.max(L, W) / 55;
  const headerH = fs * 1.8;
  const gap = W * 0.06 + headerH;
  const n = result.sheets.length;
  const totalH = n > 0 ? n * (W + gap) : W;
  let inner = '';
  result.sheets.forEach((sh, i) => {
    const y = i * (W + gap);
    inner += `<g transform="translate(0 ${y})">`;
    inner += `<text x="0" y="${headerH * 0.7}" font-family="${FONT}" font-size="${fs}" font-weight="600" fill="#18181b">Platte ${i + 1} von ${n} · ${fmtMm(L)} × ${fmtMm(W)} mm · Verschnitt ${fmtMm(sh.wastePercent)} %</text>`;
    inner += `<g transform="translate(0 ${headerH})">${sheetShapes(sh, spec)}</g>`;
    inner += `</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}mm" height="${totalH}mm" viewBox="0 0 ${L} ${totalH}">${inner}</svg>`;
}
