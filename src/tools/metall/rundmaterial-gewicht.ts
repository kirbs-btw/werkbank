import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'rundmaterial-gewicht',
  category: 'metall',
  title: 'Rundstahl-Gewicht-Rechner',
  shortTitle: 'Rundstahl Gewicht',
  description: 'Berechne das Gewicht von Rundstahl, Edelstahl, Alu, Messing oder Kupfer aus Durchmesser und Laenge. Schnell und genau.',
  keywords: ['rundstahl gewicht berechnen', 'gewicht rundmaterial rechner', 'gewicht runde welle stahl', 'kg pro meter rundstahl'],
  formula: 'm = PI/4 x (d/10)^2 x (L/10) x Dichte / 1000 (d, L in mm)',
  inputs: [
    { type: 'number', id: 'd', label: 'Durchmesser', unit: 'mm', default: 20, min: 0, step: 1 },
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
    const d = num(v.d);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const volumenCm3 = (Math.PI / 4) * Math.pow(d / 10, 2) * (L / 10);
    const gewichtG = volumenCm3 * dichte;
    const gewichtKg = gewichtG / 1000;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Gewicht in Gramm', value: gewichtG, unit: 'g', digits: 1 },
    ];
  },
  intro: 'Ermittle das exakte Gewicht von Rundmaterial fuer Transport, Versand oder Materialkalkulation.',
  howto: [
    'Durchmesser des Rundmaterials in mm eingeben.',
    'Laenge in mm eintragen.',
    'Material auswaehlen, die Dichte wird automatisch gesetzt.',
  ],
  faq: [
    { q: 'Welche Dichte hat Stahl?', a: 'Baustahl hat eine Dichte von etwa 7,85 g/cm3. Edelstahl liegt bei rund 7,9 g/cm3.' },
    { q: 'Gilt die Formel auch fuer Wellen?', a: 'Ja, fuer jedes massive runde Vollmaterial wie Wellen, Bolzen oder Stangen.' },
  ],
  related: ['rohr-gewicht', 'flachstahl-gewicht', 'vierkant-gewicht'],
  updated: '2026-06-15',
  examples: [
    {
      values: { d: 20, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 2.466, tolerance: 0.01 }],
    },
  ],
};
