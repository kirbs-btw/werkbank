import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'gewindestange-gewicht',
  category: 'metall',
  title: 'Gewindestange-Gewicht-Rechner',
  shortTitle: 'Gewindestange Gewicht',
  description: 'Berechne das Gewicht von Gewindestangen aus Nenndurchmesser und Länge. Berücksichtigt den Materialabtrag durch das Gewinde für Stahl, Edelstahl oder Messing.',
  keywords: ['gewindestange gewicht berechnen', 'gewindestange kg pro meter', 'gewicht gewindestab rechner', 'm10 gewindestange gewicht', 'gewinde gewicht stahl', 'gewindebolzen gewicht'],
  formula: 'A_eff = f x PI/4 x d^2; m = A_eff x (L/10) / 100 x Dichte / 1000 (f = Gewindefaktor)',
  inputs: [
    { type: 'number', id: 'd', label: 'Nenndurchmesser', unit: 'mm', default: 10, min: 0, step: 1, help: 'Nenngröße, z. B. 10 für M10' },
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'mm', default: 1000, min: 0, step: 1 },
    {
      type: 'select', id: 'gewinde', label: 'Gewindeart', default: '0.92',
      options: [
        { value: '0.92', label: 'Metrisch Regelgewinde' },
        { value: '0.95', label: 'Metrisch Feingewinde' },
        { value: '1', label: 'Ohne Gewinde (Vollmaterial)' },
      ],
    },
    {
      type: 'select', id: 'material', label: 'Material', default: '7.85',
      options: [
        { value: '7.85', label: 'Stahl' },
        { value: '7.9', label: 'Edelstahl' },
        { value: '8.5', label: 'Messing' },
        { value: '2.70', label: 'Aluminium' },
      ],
    },
  ],
  compute: (v) => {
    const d = num(v.d);
    const L = num(v.laenge);
    const f = num(v.gewinde, 0.92);
    const dichte = num(v.material, 7.85);
    const flaecheMm2 = f * (Math.PI / 4) * Math.pow(d, 2);
    const volumenCm3 = (flaecheMm2 * L) / 1000;
    const gewichtG = volumenCm3 * dichte;
    const gewichtKg = gewichtG / 1000;
    const gewichtProMeter = L > 0 ? (gewichtKg / L) * 1000 : 0;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Gewicht pro Meter', value: gewichtProMeter, unit: 'kg/m', digits: 3 },
      { label: 'Gewicht in Gramm', value: gewichtG, unit: 'g', digits: 1 },
    ];
  },
  intro: 'Dieser Rechner schätzt das Gewicht einer Gewindestange aus Nenndurchmesser, Länge und Werkstoff. Da das eingeschnittene Gewinde Material wegnimmt, wird die Vollquerschnittsfläche mit einem Gewindefaktor reduziert (Regelgewinde rund 0,92). So bekommst du für Versandkalkulation, Lagerlisten oder Konstruktionen mit Gewindestangen ein realistisches Gewicht statt des überhöhten Vollmaterialwerts.',
  howto: [
    'Nenndurchmesser der Gewindestange in mm eingeben (z. B. 10 für M10).',
    'Gesamtlänge der Stange in mm eintragen.',
    'Gewindeart wählen — Regel-, Feingewinde oder Vollmaterial ohne Abzug.',
    'Werkstoff auswählen, die Dichte wird automatisch gesetzt.',
  ],
  faq: [
    { q: 'Warum ist eine Gewindestange leichter als ein Rundstab gleichen Durchmessers?', a: 'Das Gewinde wird gerollt oder geschnitten, dabei fehlt Material in den Gewindetälern. Im Mittel bleiben bei metrischem Regelgewinde etwa 92 % des Vollquerschnitts übrig.' },
    { q: 'Wie schwer ist eine M10-Gewindestange aus Stahl?', a: 'Rund 0,57 kg pro Meter — ein Meter M10 wiegt also etwa 567 Gramm bei Baustahl.' },
    { q: 'Gilt der Faktor auch für Edelstahl A2?', a: 'Der Gewindefaktor bleibt gleich, du wählst nur Edelstahl mit Dichte 7,9 g/cm³. Das Ergebnis steigt minimal gegenüber Baustahl.' },
    { q: 'Kann ich auch glatte Bolzen berechnen?', a: 'Ja, wähle „Ohne Gewinde (Vollmaterial)“, dann wird der volle Kreisquerschnitt ohne Abzug gerechnet.' },
  ],
  related: ['rundmaterial-gewicht', 'sechskantstahl-gewicht', 'draht-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { d: 10, laenge: 1000, gewinde: '0.92', material: '7.85' },
      expect: [{ label: 'Gewicht', value: 0.567, tolerance: 0.01 }],
    },
    {
      values: { d: 12, laenge: 1000, gewinde: '1', material: '7.85' },
      expect: [{ label: 'Gewicht', value: 0.888, tolerance: 0.01 }],
    },
  ],
};
