import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'flachstahl-gewicht',
  category: 'metall',
  title: 'Flachstahl-Gewicht-Rechner',
  shortTitle: 'Flachstahl Gewicht',
  description: 'Berechne das Gewicht von Flachstahl und Flachmaterial aus Breite, Dicke und Laenge fuer Stahl, Edelstahl, Alu, Messing oder Kupfer.',
  keywords: ['flachstahl gewicht berechnen', 'flachmaterial gewicht rechner', 'gewicht flacheisen', 'kg pro meter flachstahl'],
  formula: 'm = (Breite x Dicke x Laenge) / 1000 cm3 x Dichte / 1000 (Masse in mm)',
  inputs: [
    { type: 'number', id: 'breite', label: 'Breite', unit: 'mm', default: 40, min: 0, step: 1 },
    { type: 'number', id: 'dicke', label: 'Dicke', unit: 'mm', default: 10, min: 0, step: 0.5 },
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
    const breite = num(v.breite);
    const dicke = num(v.dicke);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const volumenCm3 = (breite * dicke * L) / 1000;
    const gewichtG = volumenCm3 * dichte;
    const gewichtKg = gewichtG / 1000;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Gewicht in Gramm', value: gewichtG, unit: 'g', digits: 1 },
    ];
  },
  intro: 'Ermittle das Gewicht von Flachstahl und rechteckigem Vollmaterial fuer Kalkulation und Versand.',
  howto: [
    'Breite des Flachstahls in mm eingeben.',
    'Dicke in mm eintragen.',
    'Laenge in mm und Material auswaehlen.',
  ],
  faq: [
    { q: 'Was ist der Unterschied zu Vierkant?', a: 'Flachstahl ist rechteckig mit unterschiedlicher Breite und Dicke, Vierkant ist quadratisch.' },
    { q: 'Wie genau ist das Ergebnis?', a: 'Sehr genau bei massiven Profilen. Walztoleranzen koennen zu kleinen Abweichungen fuehren.' },
  ],
  related: ['vierkant-gewicht', 'rundmaterial-gewicht', 'rohr-gewicht'],
  updated: '2026-06-15',
  examples: [
    {
      values: { breite: 40, dicke: 10, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 3.14, tolerance: 0.01 }],
    },
  ],
};
