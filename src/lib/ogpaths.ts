/**
 * Welche Seiten ein eigenes Vorschaubild bekommen – eine einzige Quelle für
 * beide Seiten der Sache.
 *
 * Der Endpunkt erzeugt die Bilder aus dieser Liste, und `ogImageFor()` sucht im
 * `<head>` darin nach. Damit kann nicht passieren, dass eine Seite auf ein Bild
 * verweist, das nie erzeugt wurde – der häufigste Fehler bei so etwas, und
 * einer, der still bleibt: Der Link ist da, das Bild fehlt, und geteilt wird
 * eine leere Karte.
 *
 * Ohne Node-Abhängigkeiten, damit dieses Modul auch im `<head>` benutzbar ist.
 */

import { TOOLS } from './registry';
import { GENERATORS } from './generators';
import { CATEGORIES } from './categories';

export interface OgSeite {
  /** Seitenpfad ohne abschließenden Schrägstrich, z. B. `/rechner/bohrzeit`. */
  pfad: string;
  titel: string;
  kategorie?: string;
  untertitel?: string;
}

const kategorieName = (slug: string): string =>
  CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;

/** Erster Satz einer Beschreibung – mehr passt auf die Karte nicht. */
export function ersterSatz(text: string): string {
  const t = text.trim();
  const m = t.match(/^(.{20,}?[.!?])(\s|$)/);
  return (m ? m[1] : t).replace(/\s+/g, ' ');
}

export const OG_SEITEN: OgSeite[] = [
  ...TOOLS.map((t) => ({
    pfad: `/rechner/${t.slug}`,
    titel: t.title,
    kategorie: kategorieName(t.category),
    untertitel: ersterSatz(t.description),
  })),
  ...GENERATORS.map((g) => ({
    pfad: `/generatoren/${g.slug}`,
    titel: g.title,
    kategorie: 'Generator',
    untertitel: ersterSatz(g.description),
  })),
  ...CATEGORIES.map((c) => ({
    pfad: `/kategorie/${c.slug}`,
    titel: c.name,
    kategorie: 'Kategorie',
    untertitel: c.tagline,
  })),
];

const NACH_PFAD = new Map(OG_SEITEN.map((s) => [s.pfad, s]));

/** Pfad so normalisieren, wie ihn die Seiten an `BaseHead` übergeben. */
export function normPfad(pfad: string): string {
  const p = pfad.trim().replace(/\/+$/, '');
  return p.startsWith('/') ? p : `/${p}`;
}

/**
 * Bild-URL für eine Seite. Gibt es kein eigenes Bild, kommt das allgemeine
 * zurück – lieber die Standardkarte als ein toter Verweis.
 */
export function ogImageFor(pfad: string): string {
  const s = NACH_PFAD.get(normPfad(pfad));
  return s ? `/og${s.pfad}.png` : '/og-default.png';
}

/** Gibt es für diesen Pfad ein eigenes Bild? */
export function hatEigenesBild(pfad: string): boolean {
  return NACH_PFAD.has(normPfad(pfad));
}
