import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'materialgewicht-blech',
  category: 'metall',
  title: 'Blech-Gewicht-Rechner',
  shortTitle: 'Blechgewicht',
  description:
    'Berechne das Gewicht von Blechen und Platten aus Stahl, Edelstahl, Aluminium, Messing und Kupfer.',
  keywords: [
    'blech gewicht berechnen',
    'metall gewicht rechner',
    'stahl gewicht berechnen',
    'aluminium gewicht rechner',
  ],
  formula: 'Gewicht = Länge · Breite · Dicke · Dichte',
  inputs: [
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'mm', default: 1000, min: 0, step: 10 },
    { type: 'number', id: 'breite', label: 'Breite', unit: 'mm', default: 1000, min: 0, step: 10 },
    { type: 'number', id: 'dicke', label: 'Dicke', unit: 'mm', default: 2, min: 0, step: 0.1 },
    {
      type: 'select', id: 'dichte', label: 'Material', default: '7.85',
      options: [
        { value: '7.85', label: 'Stahl (7,85 g/cm³)' },
        { value: '7.9', label: 'Edelstahl (7,90)' },
        { value: '2.70', label: 'Aluminium (2,70)' },
        { value: '8.5', label: 'Messing (8,50)' },
        { value: '8.96', label: 'Kupfer (8,96)' },
      ],
    },
  ],
  compute: (v) => {
    const l = num(v.laenge);
    const b = num(v.breite);
    const d = num(v.dicke);
    const dichte = num(v.dichte, 7.85);
    const volCm3 = (l * b * d) / 1000; // mm³ → cm³
    const gewichtG = volCm3 * dichte;
    const kg = gewichtG / 1000;
    return [
      { label: 'Gewicht', value: kg, unit: 'kg', digits: 2, primary: true },
      { label: 'Gewicht (Gramm)', value: gewichtG, unit: 'g', digits: 0 },
    ];
  },
  faq: [
    {
      q: 'Welche Dichte hat Edelstahl?',
      a: 'Gängiger Edelstahl (V2A/V4A) liegt bei etwa 7,9–8,0 g/cm³, normaler Baustahl bei 7,85 g/cm³.',
    },
  ],
  updated: '2026-06-15',
  examples: [
    {
      values: { laenge: 1000, breite: 1000, dicke: 2, dichte: '7.85' },
      expect: [{ label: 'Gewicht', value: 15.7, tolerance: 0.05 }],
    },
  ],
};
