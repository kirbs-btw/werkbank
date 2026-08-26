/**
 * Ehrliche Aktualitätsdaten je Seite.
 *
 * Vorher trug jede URL in der Sitemap den Zeitstempel des letzten Builds – auch
 * Rechner, die seit Monaten unverändert sind. Das ist ein wertloses Signal:
 * Wer bei jedem Deploy behauptet, alle 170 Seiten seien neu, wird zu Recht
 * ignoriert. Stattdessen liefert jede Seite hier ihr echtes Änderungsdatum:
 *
 *   - Rechner- und Generatorseiten: das `updated`-Feld des jeweiligen Moduls
 *   - Übersichts- und Kategorieseiten: das jüngste Datum ihrer Einträge,
 *     denn sie ändern sich genau dann, wenn ein Eintrag dazukommt
 *   - alles Übrige: ein fester Ausgangswert
 */

import { TOOLS } from './registry';
import { GENERATORS } from './generators';

/**
 * Startpunkt der Seite – Fallback für Seiten ohne eigenes Datum und
 * `datePublished` im Schema. Entspricht dem frühesten Inhaltsdatum
 * (die ersten Rechner wurden am 15.06. verfasst, am 16.06. veröffentlicht).
 */
export const SITE_START = '2026-06-15';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const clean = (d: string | undefined): string => (d && ISO_DATE.test(d) ? d : SITE_START);

/** Jüngstes Datum einer Liste (ISO-Daten sind lexikografisch sortierbar). */
export function newest(dates: (string | undefined)[]): string {
  let max = SITE_START;
  for (const d of dates) {
    const c = clean(d);
    if (c > max) max = c;
  }
  return max;
}

/** Pfad ohne Domain, ohne Query und ohne abschließenden Schrägstrich. */
export function normalizePath(input: string): string {
  let p = input;
  if (/^https?:\/\//i.test(p)) {
    try {
      p = new URL(p).pathname;
    } catch {
      /* unveränderten Wert weiterverwenden */
    }
  }
  p = p.split('?')[0].split('#')[0];
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p.startsWith('/') ? p : `/${p}`;
}

/**
 * Änderungsdatum einer Seite als ISO-Datum (YYYY-MM-DD).
 * Nimmt Pfade wie `/rechner/filament-kosten` oder vollständige URLs entgegen.
 */
export function lastmodFor(pathOrUrl: string): string {
  const path = normalizePath(pathOrUrl);

  const tool = path.startsWith('/rechner/') ? TOOLS.find((t) => `/rechner/${t.slug}` === path) : undefined;
  if (tool) return clean(tool.updated);

  const gen = path.startsWith('/generatoren/')
    ? GENERATORS.find((g) => `/generatoren/${g.slug}` === path)
    : undefined;
  if (gen) return clean(gen.updated);

  if (path.startsWith('/kategorie/')) {
    const slug = path.slice('/kategorie/'.length);
    const dates = TOOLS.filter((t) => t.category === slug).map((t) => t.updated);
    if (slug === 'generatoren') dates.push(...GENERATORS.map((g) => g.updated));
    return newest(dates);
  }

  // Startseite und Gesamtübersicht ändern sich mit jedem neuen Eintrag.
  if (path === '/' || path === '/rechner') {
    return newest([...TOOLS.map((t) => t.updated), ...GENERATORS.map((g) => g.updated)]);
  }

  return SITE_START;
}

/** Datum als `<time datetime>`-tauglicher Wert plus deutscher Anzeigetext. */
export function formatDate(iso: string): string {
  const [y, m, d] = clean(iso).split('-');
  return `${d}.${m}.${y}`;
}
