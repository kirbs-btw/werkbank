import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'rohr-gewicht',
  category: 'metall',
  title: 'Rohr-Gewicht-Rechner',
  shortTitle: 'Rohrgewicht',
  description: 'Berechne das Gewicht von Rohren aus Aussendurchmesser, Wandstaerke und Laenge fuer Stahl, Edelstahl, Alu, Messing oder Kupfer.',
  keywords: ['rohr gewicht berechnen', 'stahlrohr gewicht rechner', 'gewicht rohr formel', 'kg pro meter rohr'],
  formula: 'm = PI/4 x ((D/10)^2 - (di/10)^2) x (L/10) x Dichte / 1000, di = D - 2 x Wand',
  inputs: [
    { type: 'number', id: 'aussen', label: 'Aussendurchmesser', unit: 'mm', default: 30, min: 0, step: 1 },
    { type: 'number', id: 'wand', label: 'Wandstaerke', unit: 'mm', default: 2, min: 0, step: 0.1 },
    { type: 'number', id: 'laenge', label: 'Laenge', unit: 'mm', default: 1000, min: 0, step: 1 },
    {
      type: 'select', id: 'material', label: 'Material', default: '7.85',
      options: [
        { value: '7.85', label: 'Stahl' },
        { value: '7.9', label: 'Edelstahl' },
        { value: '2.70', label: 'Aluminium' },
        { value: '8.5', label: 'Messing' },
        { value: '8.96', label: 'Kupfer' },
      ],
    },
  ],
  compute: (v) => {
    const D = num(v.aussen);
    const wand = num(v.wand);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const di = Math.max(0, D - 2 * wand);
    const volumenCm3 = (Math.PI / 4) * (Math.pow(D / 10, 2) - Math.pow(di / 10, 2)) * (L / 10);
    const gewichtG = volumenCm3 * dichte;
    const gewichtKg = gewichtG / 1000;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Innendurchmesser', value: di, unit: 'mm', digits: 1 },
    ];
  },
  intro: 'Ermittle das Gewicht von Rohren und Hohlprofilen schnell fuer Statik, Versand oder Materialbedarf.',
  howto: [
    'Aussendurchmesser des Rohrs in mm eingeben.',
    'Wandstaerke in mm eintragen.',
    'Laenge in mm und Material auswaehlen.',
  ],
  faq: [
    { q: 'Wie wird der Innendurchmesser berechnet?', a: 'Innendurchmesser = Aussendurchmesser minus zweimal die Wandstaerke.' },
    { q: 'Gilt das auch fuer Edelstahlrohr?', a: 'Ja, waehle einfach Edelstahl mit Dichte 7,9 g/cm3 aus.' },
  ],
  related: ['rundmaterial-gewicht', 'flachstahl-gewicht', 'vierkant-gewicht'],
  updated: '2026-06-15',
  examples: [
    {
      values: { aussen: 30, wand: 2, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 1.381, tolerance: 0.01 }],
    },
  ],
};
