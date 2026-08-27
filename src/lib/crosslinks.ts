/**
 * Verweise über Kategoriegrenzen hinweg – von Hand kuratiert.
 *
 * Die `related`-Listen der Rechner blieben bislang fast ausnahmslos innerhalb
 * ihrer Kategorie: Von 409 Verweisen führte genau **einer** über eine Grenze.
 * Damit zerfiel die Seite in sechs Inseln – wer am Laser Blech schneidet und
 * dessen Gewicht braucht, fand von dort keinen Weg dorthin, obwohl beides da
 * ist.
 *
 * Warum eine eigene Tabelle und nicht einfach mehr Einträge in `related`?
 * Zwei Gründe: Die Rechner-Seite zeigt nur vier verwandte Rechner, ein fünfter
 * Eintrag wäre unsichtbar geblieben. Und Querverweise wollen an einer Stelle
 * überprüfbar sein, statt über sechzig Dateien verstreut.
 *
 * Der Versuch, die Paare automatisch über Stichwort-Überschneidungen zu finden,
 * lieferte neben Treffern wie „Bohrer-Drehzahl ↔ Drehzahl beim Stahlbohren"
 * eben auch „Dachneigung ↔ Stützmaterial-Anteil". Deshalb von Hand, nach
 * tatsächlichen Arbeitswegen geordnet. Jede Zeile beantwortet die Frage: Würde
 * jemand, der hier steht, dort wirklich weiterlesen wollen?
 *
 * Die Paare gelten in beide Richtungen.
 */

import type { Tool } from './types';
import { getTool } from './registry';

/** Ein Paar zusammengehöriger Rechner aus verschiedenen Kategorien. */
export type CrossPair = readonly [string, string];

export const CROSS_LINKS: CrossPair[] = [
  /* Drehzahl und Vorschub – dieselbe Rechnung, einmal aus CNC-, einmal aus Metallsicht. */
  ['bohrer-drehzahl', 'drehzahl-stahlbohren'],
  ['schnittgeschwindigkeit', 'drehzahl-schnittgeschwindigkeit'],
  ['drehzahl-vorschub', 'vorschub-fraesen'],
  ['schnittdaten-rechner', 'drehzahl-stahlbohren'],
  ['vorschub-drehen', 'drehzahl-schnittgeschwindigkeit'],

  /* Gewinde: Wer eins schneidet, braucht Kernloch, Steigung und Drehzahl. */
  ['kernlochbohrer', 'gewindebohren-drehzahl'],
  ['metrisches-gewinde-tabelle', 'gewindesteigung-metrisch'],
  ['feingewinde-steigung', 'gewindesteigung-metrisch'],
  ['gewinde-eingrifflaenge', 'gewindefraesen-bahnkorrektur'],
  ['durchgangsloch', 'bohrer-drehzahl'],

  /* Blech: abwickeln, schneiden, biegen – Metall und Laser greifen ineinander. */
  ['blech-abwicklung', 'kerf-kompensation'],
  ['materialgewicht-blech', 'laser-schnittkosten'],
  ['minimaler-biegeradius', 'laser-schnittspalt-konizitaet'],
  ['materialgewicht-blech', 'laser-teile-pro-platte'],

  /* Was kostet ein Teil, wie lange dauert es – unabhängig vom Verfahren. */
  ['druckpreis-kalkulation', 'laser-schnittkosten'],
  ['druckzeit-schaetzung', 'laser-schnittzeit'],
  ['maschinenstundensatz-3d-druck', 'materialkosten-je-teil'],
  ['stromkosten-3d-druck', 'laser-schnittkosten'],
  ['bohrzeit', 'laser-schnittzeit'],

  /* Wie viele Teile passen auf die Platte – Holzzuschnitt und Laser-Nesting. */
  ['plattenbedarf-flaeche', 'laser-teile-pro-platte'],
  ['zuschnitt-laenge', 'laser-teile-pro-platte'],
  ['zuschnitt-laenge', 'materialkosten-je-teil'],

  /* Schrauben ins Holz: Vorbohren, Abstände, Senkung. */
  ['holzschraube-vorbohren', 'duebelabstand'],
  ['holzschraube-vorbohren', 'schrauben-terrassendielen'],
  ['randabstand-schraube', 'duebelabstand'],
  ['senkungsdurchmesser', 'pocket-hole-tiefe'],
  ['anzahl-schrauben-last', 'unterkonstruktion-abstand'],

  /* Was wiegt das? Dieselbe Frage in vier Werkstoffen. */
  ['materialgewicht-blech', 'holz-volumen-gewicht'],
  ['draht-gewicht', 'schrauben-gewicht'],
  ['gewindestange-gewicht', 'schrauben-gewicht'],
  ['modell-gewicht', 'materialgewicht-blech'],
  ['filament-gewicht', 'draht-gewicht'],

  /* Gehrung: Der Winkel ist derselbe, ob Leiste oder Profil. */
  ['gehrung-zuschnitt', 'gehrungswinkel-vieleck'],
  ['gehrung-zuschnitt', 'kronleisten-gehrung'],

  /* Oberfläche und Gravur: Auflösung hier, Rautiefe dort. */
  ['ra-rz-umrechnung', 'laser-dpi-aufloesung'],
  ['gravurstichel-breite', 'laser-gravurtiefe-durchgaenge'],
  ['theoretische-rautiefe', 'laser-dpi-aufloesung'],

  /* Gedruckte Löcher müssen zur Schraube passen. */
  ['schwund-kompensation', 'durchgangsloch'],

  /* Zustellung: wie tief pro Durchgang – an der Kreissäge wie an der Fräse. */
  ['kreissaege-schnitttiefe-winkel', 'anzahl-schnitte-zustellung'],

  /* Material arbeitet: Holz quillt und schwindet, Druckteile schrumpfen. */
  ['schwund-kompensation', 'holzquellung-schwindung'],

  /* Lasergeschnittene Teile werden verschraubt – Schnittspalt trifft Lochmaß. */
  ['kerf-kompensation', 'durchgangsloch'],

  /* Riementrieb: erst die Länge bestimmen, dann die Spannung prüfen. */
  ['zahnriemen-laenge', 'riemenspannung-frequenz'],

  /* Dieselbe Scheibe, zwei Fragen: Wie lang der Riemen, wie fein die Achse. */
  ['schritte-je-mm', 'zahnriemen-laenge'],
];

/** Nachschlagetabelle in beide Richtungen, einmal aufgebaut. */
const NACHBARN: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>();
  const dazu = (a: string, b: string): void => {
    const liste = m.get(a);
    if (liste) {
      if (!liste.includes(b)) liste.push(b);
    } else {
      m.set(a, [b]);
    }
  };
  for (const [a, b] of CROSS_LINKS) {
    dazu(a, b);
    dazu(b, a);
  }
  return m;
})();

/**
 * Rechner aus anderen Kategorien, die zu diesem passen.
 *
 * Gibt nur zurück, was tatsächlich existiert und wirklich in einer anderen
 * Kategorie liegt – ein Tippfehler im Slug führt so zu keiner leeren Karte,
 * sondern zu einem Eintrag weniger (und zu einem roten Test).
 */
export function crossTools(tool: Tool, limit = 3): Tool[] {
  return (NACHBARN.get(tool.slug) ?? [])
    .map((s) => getTool(s))
    .filter((t): t is Tool => Boolean(t) && t!.category !== tool.category)
    .slice(0, limit);
}
