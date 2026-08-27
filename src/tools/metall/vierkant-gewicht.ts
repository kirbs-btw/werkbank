import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'vierkant-gewicht',
  category: 'metall',
  title: 'Vierkant-Vollmaterial-Gewicht',
  shortTitle: 'Vierkant Gewicht',
  description: 'Berechne das Gewicht von Vierkant-Vollmaterial aus Kantenlänge und Länge für Stahl, Edelstahl, Alu, Messing oder Kupfer.',
  keywords: ['vierkant gewicht berechnen', 'quadratstahl gewicht rechner', 'gewicht vierkantstahl', 'kg pro meter vierkant'],
  formula: 'm = (a x a x Länge) / 1000 cm3 x Dichte / 1000 (Masse in mm)',
  inputs: [
    { type: 'number', id: 'a', label: 'Kantenlänge', unit: 'mm', default: 20, min: 0, step: 1 },
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'mm', default: 1000, min: 0, step: 1 },
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
    const a = num(v.a);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const volumenCm3 = (a * a * L) / 1000;
    const gewichtG = volumenCm3 * dichte;
    const gewichtKg = gewichtG / 1000;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Gewicht in Gramm', value: gewichtG, unit: 'g', digits: 1 },
    ];
  },
  intro: 'Ermittle das Gewicht von quadratischem Vollmaterial für Materialbedarf und Versandkosten.',
  howto: [
    'Kantenlänge des Vierkants in mm eingeben.',
    'Länge in mm eintragen.',
    'Material auswählen, die Dichte wird automatisch gesetzt.',
  ],
  faq: [
    { q: 'Gilt das für Vierkantrohr?', a: 'Nein, dies gilt nur für Vollmaterial. Für Hohlprofile nutze den Rohr-Rechner.' },
    { q: 'Welche Dichte hat Aluminium?', a: 'Aluminium hat eine Dichte von etwa 2,70 g/cm3, deutlich leichter als Stahl.' },
  ],
  related: ['flachstahl-gewicht', 'rundmaterial-gewicht', 'rohr-gewicht'],
  updated: '2026-08-27',
  examples: [
    {
      values: { a: 20, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 3.14, tolerance: 0.01 }],
    },
  ],
};
