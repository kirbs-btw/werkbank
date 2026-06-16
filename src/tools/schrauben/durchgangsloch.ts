import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

const TABLE: Record<string, { fein: number; mittel: number; grob: number }> = {
  M3: { fein: 3.2, mittel: 3.4, grob: 3.6 },
  M4: { fein: 4.3, mittel: 4.5, grob: 4.8 },
  M5: { fein: 5.3, mittel: 5.5, grob: 5.8 },
  M6: { fein: 6.4, mittel: 6.6, grob: 7.0 },
  M8: { fein: 8.4, mittel: 9.0, grob: 10.0 },
  M10: { fein: 10.5, mittel: 11.0, grob: 12.0 },
  M12: { fein: 13.0, mittel: 13.5, grob: 14.5 },
};

export const tool: Tool = {
  slug: 'durchgangsloch',
  category: 'schrauben',
  title: 'Durchgangsloch-Rechner (DIN EN 20273)',
  shortTitle: 'Durchgangsloch',
  description: 'Ermittle den passenden Durchgangslochdurchmesser fuer metrische Schrauben (M3 bis M12) in den Reihen fein, mittel und grob.',
  keywords: ['durchgangsloch tabelle', 'durchgangsbohrung schraube', 'din en 20273 durchgangsloch', 'bohrung fuer m8 schraube'],
  formula: 'Lookup nach DIN EN 20273 (Reihen fein / mittel / grob)',
  inputs: [
    {
      type: 'select', id: 'gewinde', label: 'Gewinde', default: 'M8',
      options: [
        { value: 'M3', label: 'M3' },
        { value: 'M4', label: 'M4' },
        { value: 'M5', label: 'M5' },
        { value: 'M6', label: 'M6' },
        { value: 'M8', label: 'M8' },
        { value: 'M10', label: 'M10' },
        { value: 'M12', label: 'M12' },
      ],
    },
  ],
  compute: (v) => {
    const key = String(v.gewinde);
    const row = TABLE[key] ?? TABLE.M8;
    return [
      { label: 'Durchgangsloch fein', value: row.fein, unit: 'mm', digits: 1 },
      { label: 'Durchgangsloch mittel', value: row.mittel, unit: 'mm', digits: 1, primary: true },
      { label: 'Durchgangsloch grob', value: row.grob, unit: 'mm', digits: 1 },
    ];
  },
  intro: 'Soll eine Schraube frei durch ein Bauteil gefuehrt werden, braucht es ein Durchgangsloch. Die DIN EN 20273 gibt drei Reihen vor: fein, mittel und grob.',
  howto: [
    'Gewindegroesse der Schraube waehlen.',
    'Passende Reihe waehlen: fein fuer praezise Passung, mittel als Standard, grob bei groben Toleranzen.',
    'Lochdurchmesser ablesen und Bohrer auswaehlen.',
  ],
  faq: [
    { q: 'Welche Reihe nehme ich normalerweise?', a: 'Im Standardfall die mittlere Reihe. Die feine Reihe sorgt fuer praezisere Fuehrung, die grobe gibt mehr Spiel beim Ausrichten.' },
    { q: 'Gilt das auch fuer Senkschrauben?', a: 'Das Durchgangsloch ist identisch, zusaetzlich muss bei Senkkopf der Senkungswinkel (meist 90 Grad) beruecksichtigt werden.' },
  ],
  related: ['kernlochbohrer'],
  updated: '2026-06-15',
  examples: [
    { values: { gewinde: 'M8' }, expect: [{ label: 'Durchgangsloch mittel', value: 9.0, tolerance: 0.01 }] },
    { values: { gewinde: 'M6' }, expect: [{ label: 'Durchgangsloch fein', value: 6.4, tolerance: 0.01 }] },
  ],
};
