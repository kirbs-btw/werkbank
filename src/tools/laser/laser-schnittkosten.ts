import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-schnittkosten',
  category: 'laser',
  title: 'Laser-Schnittkosten Rechner',
  shortTitle: 'Schnittkosten',
  description:
    'Kalkuliere die Stückkosten beim Laserschneiden aus Bearbeitungszeit, Maschinenstundensatz und Materialkosten – ideal für Angebote und Preisfindung.',
  keywords: [
    'laser schnittkosten berechnen',
    'laserschneiden preis kalkulieren',
    'maschinenstundensatz laser',
    'laser kosten pro teil',
    'lasergravur preis rechner',
    'laser kostenkalkulation',
  ],
  formula:
    'Zeitkosten = (Zeit_min / 60) × Stundensatz;  Stückkosten = Zeitkosten + Materialkosten',
  inputs: [
    { type: 'number', id: 'zeit', label: 'Bearbeitungszeit pro Teil', unit: 'min', default: 5, min: 0, step: 0.1, help: 'Aus dem Schnittzeit-Rechner übernehmen.' },
    { type: 'number', id: 'stundensatz', label: 'Maschinenstundensatz', unit: '€/h', default: 90, min: 0, step: 1, help: 'Maschine, Strom, Verschleiß, Bediener und Gemeinkosten zusammengefasst.' },
    { type: 'number', id: 'material', label: 'Materialkosten pro Teil', unit: '€', default: 3.5, min: 0, step: 0.1, help: 'Anteiliger Materialpreis inkl. Verschnitt.' },
  ],
  compute: (v) => {
    const zeit = num(v.zeit);
    const satz = num(v.stundensatz);
    const material = num(v.material);
    const zeitkosten = (zeit / 60) * satz;
    const stueck = zeitkosten + material;
    return [
      { label: 'Stückkosten', value: stueck, unit: '€', digits: 2, primary: true },
      { label: 'Zeitkosten (Maschine)', value: zeitkosten, unit: '€', digits: 2 },
      { label: 'Materialanteil', value: material, unit: '€', digits: 2 },
    ];
  },
  intro:
    'Die Stückkosten beim Laserschneiden setzen sich aus zwei Blöcken zusammen: den zeitabhängigen Maschinenkosten (Bearbeitungszeit multipliziert mit dem Maschinenstundensatz) und den anteiligen Materialkosten je Teil. Der Stundensatz fasst Abschreibung, Energie, Verschleiß, Bediener und Gemeinkosten zusammen. Wer Auftragsarbeiten anbietet, braucht diesen Wert, um kostendeckend und konkurrenzfähig zu kalkulieren.',
  howto: [
    'Bearbeitungszeit pro Teil eintragen (z. B. aus dem Schnittzeit-Rechner).',
    'Maschinenstundensatz eintragen – alle Fixkosten und Gemeinkosten auf eine Stunde umgelegt.',
    'Anteilige Materialkosten pro Teil inklusive Verschnitt eintragen.',
    'Stückkosten ablesen und mit Marge zum Verkaufspreis aufschlagen.',
  ],
  faq: [
    { q: 'Wie ermittle ich meinen Maschinenstundensatz?', a: 'Addiere die jährlichen Kosten der Maschine (Abschreibung, Wartung, Strom, Raum, anteiliger Lohn) und teile sie durch die produktiven Laufstunden pro Jahr. Bei Hobby- und Kleinmaschinen liegt der Satz oft bei 30-80 €/h, bei Industriemaschinen deutlich höher.' },
    { q: 'Sind Strom und Gas im Stundensatz enthalten?', a: 'Idealerweise ja. Stromverbrauch und – bei CO2-Lasern mit Schneidgas – auch Gaskosten sollten in den Stundensatz eingerechnet sein, damit die Kalkulation vollständig ist.' },
    { q: 'Wie berücksichtige ich Verschnitt beim Material?', a: 'Rechne nicht nur die Nettofläche des Teils, sondern die tatsächlich verbrauchte Plattenfläche inklusive Stegen und Reststücken. Ein Verschnittzuschlag von 10-30 % ist je nach Schachtelung üblich.' },
    { q: 'Decken die Stückkosten schon meinen Gewinn?', a: 'Nein. Die Stückkosten sind die Selbstkosten. Für den Verkaufspreis kommt ein Gewinnaufschlag (Marge) hinzu, ebenso eventuell Rüst-, Programmier- und Versandkosten.' },
  ],
  related: ['laser-schnittzeit', 'laser-durchsatz', 'laser-gravur-zeit'],
  updated: '2026-06-16',
  examples: [
    { values: { zeit: 5, stundensatz: 90, material: 3.5 }, expect: [{ label: 'Stückkosten', value: 11, tolerance: 0.01 }] },
    { values: { zeit: 12, stundensatz: 120, material: 8 }, expect: [{ label: 'Stückkosten', value: 32, tolerance: 0.01 }] },
  ],
};
