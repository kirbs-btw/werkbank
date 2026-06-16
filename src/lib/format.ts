import type { ToolResult } from './types';

const cache = new Map<number, Intl.NumberFormat>();

function nf(digits: number): Intl.NumberFormat {
  let f = cache.get(digits);
  if (!f) {
    f = new Intl.NumberFormat('de-DE', {
      maximumFractionDigits: digits,
      minimumFractionDigits: 0,
    });
    cache.set(digits, f);
  }
  return f;
}

/** Formatiert eine Zahl im deutschen Format (1.234,56). */
export function formatNumber(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '–';
  return nf(digits).format(n);
}

/** Bereitet ein ToolResult für die Anzeige auf (Zahl → de-DE String). */
export function formatResult(r: ToolResult): { value: string; unit?: string } {
  if (typeof r.value === 'number') {
    return { value: formatNumber(r.value, r.digits ?? 2), unit: r.unit };
  }
  return { value: r.value, unit: r.unit };
}
