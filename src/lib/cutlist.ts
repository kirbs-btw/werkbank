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
  /** Fortlaufende Nummer auf dieser Platte – verbindet Plan und Schnittliste. */
  num: number;
}

/** Ein Plattenformat im Lager. */
export interface StockSheet {
  length: number;
  width: number;
  /** Verfügbare Anzahl. 0 oder weggelassen = unbegrenzt. */
  qty?: number;
  /** Preis je Platte in € (optional, nur für die Kostenausgabe). */
  price?: number;
  /** Anzeigename, z. B. „Spanplatte 2800 × 2070". */
  label?: string;
}

/** Auftrag mit mehreren Plattenformaten. */
export interface StockSpec {
  stock: StockSheet[];
  kerf: number;
  trim?: number;
}

export interface Offcut {
  x: number;
  y: number;
  length: number;
  width: number;
}

export interface SheetLayout {
  placements: Placement[];
  /** Maße und Preis der verwendeten Platte. */
  sheet: { length: number; width: number; label: string; price: number };
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
  /** Kosten der verwendeten Platten in € (0, wenn keine Preise hinterlegt sind). */
  cost: number;
  /** Teile, die passen würden, für die aber keine Platte mehr im Lager ist. */
  outOfStock: number;
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
    num: 0, // wird am Ende in Lesereihenfolge vergeben
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

/**
 * Füllt Platten eines Formats. `maxSheets` begrenzt den Vorrat; Teile, für die
 * keine Platte mehr da ist, kommen unverändert in `leftover` und können auf dem
 * nächsten Format weiterprobiert werden.
 */
function packRun(
  parts: FlatPart[],
  usable: Rect,
  kerf: number,
  split: SplitRule,
  policy: SheetPolicy,
  maxSheets = Infinity,
): { sheets: WorkSheet[]; leftover: FlatPart[] } {
  const sheets: WorkSheet[] = [];
  const leftover: FlatPart[] = [];
  const fitsOnEmpty =
    usable.l > EPS && usable.w > EPS
      ? (p: FlatPart) =>
          (p.l <= usable.l + EPS && p.w <= usable.w + EPS) ||
          (p.rotatable && p.w <= usable.l + EPS && p.l <= usable.w + EPS)
      : () => false;

  for (const p of parts) {
    if (!fitsOnEmpty(p)) {
      leftover.push(p);
      continue;
    }
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
      if (sheets.length >= maxSheets) {
        leftover.push(p);
        continue;
      }
      sheets.push({ free: [{ ...usable }], placements: [] });
      target = sheets.length - 1;
      fit = findFit(sheets[target].free, p);
      if (!fit) continue; // kann nicht passieren – Passform wurde oben geprüft
    }
    place(sheets[target], fit, p, kerf, split);
  }
  return { sheets, leftover };
}

/** Einzelnes Plattenformat – Kurzform für `optimizeStock` mit einem Lagerposten. */
export function optimize(parts: CutPart[], spec: SheetSpec): CutlistResult {
  return optimizeStock(parts, {
    stock: [{ length: spec.length, width: spec.width }],
    kerf: spec.kerf,
    trim: spec.trim,
  });
}

interface PreparedStock {
  length: number;
  width: number;
  label: string;
  price: number;
  qty: number;
  area: number;
  usable: Rect;
}

export function optimizeStock(parts: CutPart[], spec: StockSpec): CutlistResult {
  const kerf = Math.max(0, spec.kerf || 0);
  const trim = Math.max(0, spec.trim ?? 0);

  const empty: CutlistResult = {
    sheets: [],
    requestedParts: 0,
    placedParts: 0,
    unplaceable: [],
    truncated: false,
    partsArea: 0,
    sheetsArea: 0,
    wastePercent: 0,
    cost: 0,
    outOfStock: 0,
  };

  const stock: PreparedStock[] = (spec.stock ?? [])
    .filter((s) => s.length > 0 && s.width > 0)
    .map((s) => ({
      length: s.length,
      width: s.width,
      label: (s.label ?? '').trim() || `${s.length} × ${s.width}`,
      price: Math.max(0, s.price ?? 0),
      qty: s.qty && s.qty > 0 ? Math.floor(s.qty) : Infinity,
      area: s.length * s.width,
      usable: { x: trim, y: trim, l: s.length - 2 * trim, w: s.width - 2 * trim },
    }));
  if (stock.length === 0) return empty;

  const valid = parts
    .map((p) => ({
      length: p.length,
      width: p.width,
      qty: Math.floor(p.qty),
      label: (p.label ?? '').trim(),
      rotatable: p.rotatable !== false,
    }))
    .filter((p) => p.length > 0 && p.width > 0 && p.qty >= 1);

  /** Passt das Teil auf mindestens eines der Lagerformate? */
  const fits = (p: (typeof valid)[number]): boolean =>
    stock.some(
      (s) =>
        s.usable.l > 0 &&
        s.usable.w > 0 &&
        ((p.length <= s.usable.l + EPS && p.width <= s.usable.w + EPS) ||
          (p.rotatable && p.width <= s.usable.l + EPS && p.length <= s.usable.w + EPS)),
    );

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

  // Strategie-Suchraum – bei sehr vielen Teilen reduziert (Rechenzeit).
  const many = flat.length > 300;
  const sorts: SortKey[] = many ? ['area', 'long'] : ['area', 'long', 'short', 'perimeter'];
  const splits: SplitRule[] = many ? ['auto'] : ['auto', 'length', 'width'];
  const policies: SheetPolicy[] = ['first', 'best'];
  // Reihenfolge, in der die Lagerformate abgearbeitet werden. Bei nur einem
  // Format entfällt die Wahl; sonst lohnt sich groß-zuerst und klein-zuerst.
  const orders: PreparedStock[][] =
    stock.length < 2
      ? [stock]
      : [stock, [...stock].sort((a, b) => b.area - a.area), [...stock].sort((a, b) => a.area - b.area)];
  const hasPrices = stock.some((s) => s.price > 0);

  interface Run {
    sheets: { stock: PreparedStock; work: WorkSheet }[];
    placed: number;
    cost: number;
    area: number;
    lastUsed: number;
  }
  let best: Run | null = null;

  for (const order of orders) {
    for (const sort of sorts) {
      const sorted = sortParts(flat, sort);
      for (const split of splits) {
        for (const policy of policies) {
          const used: { stock: PreparedStock; work: WorkSheet }[] = [];
          let remaining = sorted;
          for (const s of order) {
            if (remaining.length === 0) break;
            const { sheets: got, leftover } = packRun(remaining, s.usable, kerf, split, policy, s.qty);
            for (const w of got) used.push({ stock: s, work: w });
            remaining = leftover;
          }
          const placed = used.reduce((n, u) => n + u.work.placements.length, 0);
          const run: Run = {
            sheets: used,
            placed,
            cost: used.reduce((c, u) => c + u.stock.price, 0),
            area: used.reduce((a, u) => a + u.stock.area, 0),
            lastUsed:
              used.length > 0
                ? used[used.length - 1].work.placements.reduce((s2, pl) => s2 + pl.length * pl.width, 0)
                : 0,
          };
          const better =
            !best ||
            run.placed > best.placed ||
            (run.placed === best.placed &&
              (hasPrices
                ? run.cost < best.cost - EPS ||
                  (Math.abs(run.cost - best.cost) <= EPS && run.area < best.area - EPS)
                : run.area < best.area - EPS)) ||
            (run.placed === best.placed &&
              Math.abs(run.area - best.area) <= EPS &&
              Math.abs(run.cost - best.cost) <= EPS &&
              (run.sheets.length < best.sheets.length ||
                (run.sheets.length === best.sheets.length && run.lastUsed < best.lastUsed - EPS)));
          if (better) best = run;
        }
      }
    }
  }

  const chosen = best?.sheets ?? [];
  const sheets: SheetLayout[] = chosen.map(({ stock: s, work }) => {
    // Nummerierung in Lesereihenfolge (oben links zuerst) – so lassen sich die
    // Teile beim Sägen direkt beschriften.
    const placements = [...work.placements]
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map((p, i) => ({ ...p, num: i + 1 }));
    const usedArea = placements.reduce((sum, pl) => sum + pl.length * pl.width, 0);
    const offcuts = work.free
      .filter((r) => r.l >= MIN_OFFCUT && r.w >= MIN_OFFCUT)
      .sort((a, b) => b.l * b.w - a.l * a.w)
      .map((r) => ({ x: r.x, y: r.y, length: r.l, width: r.w }));
    return {
      placements,
      sheet: { length: s.length, width: s.width, label: s.label, price: s.price },
      usedArea,
      wastePercent: s.area > 0 ? (1 - usedArea / s.area) * 100 : 0,
      offcuts,
    };
  });

  const partsArea = sheets.reduce((s, sh) => s + sh.usedArea, 0);
  const sheetsArea = sheets.reduce((s, sh) => s + sh.sheet.length * sh.sheet.width, 0);
  const placedParts = sheets.reduce((s, sh) => s + sh.placements.length, 0);
  return {
    sheets,
    requestedParts,
    placedParts,
    unplaceable,
    truncated,
    partsArea,
    sheetsArea,
    wastePercent: sheetsArea > 0 ? (1 - partsArea / sheetsArea) * 100 : 0,
    cost: sheets.reduce((c, sh) => c + sh.sheet.price, 0),
    outOfStock: Math.max(0, flat.length - placedParts),
  };
}

/* ---------- SVG-Rendering (pure String-Builder, kein DOM) ---------- */

const escXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** mm-Zahl ohne Tausendertrennung, Komma als Dezimaltrenner (Werkstatt-üblich). */
const fmtMm = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

const FONT = 'ui-sans-serif, system-ui, sans-serif';

/** Innere Shapes einer Platte (ohne <svg>-Hülle). Maße kommen aus dem Layout. */
function sheetShapes(layout: SheetLayout, trim = 0): string {
  const { length: L, width: W } = layout.sheet;
  const fs = Math.max(L, W) / 70;
  let s = `<rect x="0" y="0" width="${L}" height="${W}" fill="#f4f4f5" stroke="#71717a" stroke-width="1" vector-effect="non-scaling-stroke"/>`;
  if (trim > 0) {
    s += `<rect x="${trim}" y="${trim}" width="${L - 2 * trim}" height="${W - 2 * trim}" fill="none" stroke="#d4d4d8" stroke-width="1" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>`;
  }
  for (const p of layout.placements) {
    const dims = `${fmtMm(p.length)} × ${fmtMm(p.width)}`;
    const label = escXml(p.label);
    s += `<g><rect x="${p.x}" y="${p.y}" width="${p.length}" height="${p.width}" fill="#ffedd5" stroke="#c2410c" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
    s += `<title>Nr. ${p.num} · ${label} – ${dims} mm${p.rotated ? ' (gedreht)' : ''}</title>`;
    const cx = p.x + p.length / 2;
    const cy = p.y + p.width / 2;
    const short = Math.min(p.length, p.width);
    const fitsTwo = p.width > fs * 3.6 && p.length > Math.max(label.length, dims.length) * fs * 0.62;
    const fitsOne = p.width > fs * 2.4 && p.length > dims.length * fs * 0.6;
    if (fitsTwo) {
      s += `<text x="${cx}" y="${cy - fs * 1.1}" font-family="${FONT}" font-size="${fs * 1.1}" font-weight="700" fill="#c2410c" text-anchor="middle">${p.num}</text>`;
      s += `<text x="${cx}" y="${cy + fs * 0.2}" font-family="${FONT}" font-size="${fs}" font-weight="600" fill="#7c2d12" text-anchor="middle">${label}</text>`;
      s += `<text x="${cx}" y="${cy + fs * 1.4}" font-family="${FONT}" font-size="${fs * 0.85}" fill="#9a3412" text-anchor="middle">${dims}</text>`;
    } else if (fitsOne) {
      s += `<text x="${cx}" y="${cy - fs * 0.2}" font-family="${FONT}" font-size="${fs}" font-weight="700" fill="#c2410c" text-anchor="middle">${p.num}</text>`;
      s += `<text x="${cx}" y="${cy + fs}" font-family="${FONT}" font-size="${fs * 0.85}" fill="#9a3412" text-anchor="middle">${dims}</text>`;
    } else if (short > fs * 1.3) {
      // Für schmale Teile bleibt wenigstens die Nummer – die Maße stehen in der Schnittliste.
      s += `<text x="${cx}" y="${cy + fs * 0.35}" font-family="${FONT}" font-size="${fs * 0.9}" font-weight="700" fill="#c2410c" text-anchor="middle">${p.num}</text>`;
    }
    s += `</g>`;
  }
  return s;
}

/** Responsives Vorschau-SVG einer Platte (Browser-Anzeige). */
export function sheetSvg(layout: SheetLayout, trim = 0): string {
  const { length: L, width: W } = layout.sheet;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L} ${W}" width="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Schnittplan einer Platte ${fmtMm(L)} × ${fmtMm(W)} mm">${sheetShapes(layout, trim)}</svg>`;
}

/**
 * Maßstabsgetreues Download-SVG (mm) mit allen Platten untereinander.
 * Bei gemischten Formaten richtet sich die Blattbreite nach der größten Platte.
 */
export function combinedSvg(result: CutlistResult, trim = 0): string {
  const n = result.sheets.length;
  if (n === 0) return '';
  const maxL = Math.max(...result.sheets.map((s) => s.sheet.length));
  const maxW = Math.max(...result.sheets.map((s) => s.sheet.width));
  const fs = Math.max(maxL, maxW) / 55;
  const headerH = fs * 1.8;
  const gap = maxW * 0.06 + headerH;
  let y = 0;
  let inner = '';
  result.sheets.forEach((sh, i) => {
    const { length: L, width: W } = sh.sheet;
    inner += `<g transform="translate(0 ${y})">`;
    inner += `<text x="0" y="${headerH * 0.7}" font-family="${FONT}" font-size="${fs}" font-weight="600" fill="#18181b">Platte ${i + 1} von ${n} · ${escXml(sh.sheet.label)} · ${fmtMm(L)} × ${fmtMm(W)} mm · Verschnitt ${fmtMm(sh.wastePercent)} %</text>`;
    inner += `<g transform="translate(0 ${headerH})">${sheetShapes(sh, trim)}</g>`;
    inner += `</g>`;
    y += W + gap;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${maxL}mm" height="${y}mm" viewBox="0 0 ${maxL} ${y}">${inner}</svg>`;
}
