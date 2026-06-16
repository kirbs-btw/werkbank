import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'treppen-steigung',
  category: 'holz',
  title: 'Treppen-Steigungs-Rechner',
  shortTitle: 'Treppensteigung',
  description:
    'Berechne Stufenanzahl, Steigungshöhe und Schrittmaß deiner Treppe aus Geschosshöhe und Auftritt – inklusive Ergonomie-Check nach Schrittmaßregel.',
  keywords: [
    'treppe berechnen',
    'treppensteigung berechnen',
    'schrittmaß treppe',
    'stufenanzahl berechnen',
    'steigungshöhe treppe',
  ],
  formula:
    'Anzahl = round(Geschosshöhe / Wunschsteigung) · Steigung = Geschosshöhe / Anzahl · Schrittmaß = 2·Steigung + Auftritt',
  inputs: [
    { type: 'number', id: 'geschosshoehe', label: 'Geschosshöhe', unit: 'mm', default: 2600, min: 100, step: 10, help: 'Fertigfußboden bis Fertigfußboden des nächsten Geschosses.' },
    { type: 'number', id: 'auftritt', label: 'Auftritt (Trittfläche)', unit: 'mm', default: 280, min: 100, max: 400, step: 5 },
    { type: 'number', id: 'wunschsteigung', label: 'Wunsch-Steigungshöhe', unit: 'mm', default: 180, min: 120, max: 220, step: 5, help: 'Komfortabel sind ca. 170–180 mm.' },
  ],
  compute: (v) => {
    const h = num(v.geschosshoehe);
    const auftritt = num(v.auftritt);
    const wunsch = num(v.wunschsteigung, 180);
    const anzahl = Math.max(1, Math.round(h / wunsch));
    const steigung = h / anzahl;
    const schrittmass = 2 * steigung + auftritt;
    return [
      { label: 'Stufenanzahl', value: anzahl, unit: 'Stufen', digits: 0 },
      { label: 'Steigungshöhe', value: steigung, unit: 'mm', digits: 1 },
      {
        label: 'Schrittmaß',
        value: schrittmass,
        unit: 'mm',
        digits: 1,
        primary: true,
        help: 'Schrittmaßregel: 590–650 mm gelten als ergonomisch optimal.',
      },
    ];
  },
  howto: [
    'Geschosshöhe von Fertigfußboden bis Fertigfußboden messen.',
    'Gewünschte Steigungshöhe (ca. 170–180 mm) eintragen.',
    'Auftritt (Tiefe der Trittstufe) angeben.',
    'Schrittmaß prüfen: liegt es zwischen 590 und 650 mm, ist die Treppe bequem.',
  ],
  faq: [
    {
      q: 'Was ist das Schrittmaß?',
      a: 'Das Schrittmaß = 2·Steigung + Auftritt bildet den natürlichen Schritt nach. Werte zwischen 590 und 650 mm gelten als ergonomisch.',
    },
    {
      q: 'Warum wird auf ganze Stufen gerundet?',
      a: 'Eine Treppe muss eine ganze Anzahl gleich hoher Stufen haben. Aus der gerundeten Anzahl ergibt sich die tatsächliche Steigungshöhe.',
    },
  ],
  related: ['dachneigung'],
  updated: '2026-06-15',
  examples: [
    {
      values: { geschosshoehe: 2600, auftritt: 280, wunschsteigung: 180 },
      expect: [
        { label: 'Stufenanzahl', value: 14, tolerance: 0 },
        { label: 'Steigungshöhe', value: 185.71, tolerance: 0.1 },
        { label: 'Schrittmaß', value: 651.43, tolerance: 0.1 },
      ],
    },
  ],
};
