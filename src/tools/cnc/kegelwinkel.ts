import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'kegelwinkel',
  category: 'cnc',
  title: 'Kegelwinkel-Rechner',
  shortTitle: 'Kegelwinkel',
  description:
    'Berechne Einstellwinkel und vollen Kegelwinkel aus großem und kleinem Durchmesser sowie Kegellänge. Für Kegeldrehen und Reitstockversatz.',
  keywords: [
    'kegelwinkel berechnen',
    'kegel drehen einstellwinkel',
    'kegelwinkel rechner',
    'konuswinkel berechnen',
  ],
  formula: 'tan(α/2) = (D − d) / (2 · L)  →  Kegelwinkel α = 2 · arctan((D−d)/(2·L))',
  inputs: [
    { type: 'number', id: 'D', label: 'Großer Durchmesser D', unit: 'mm', default: 40, min: 0, step: 0.1 },
    { type: 'number', id: 'd', label: 'Kleiner Durchmesser d', unit: 'mm', default: 30, min: 0, step: 0.1 },
    { type: 'number', id: 'L', label: 'Kegellänge L', unit: 'mm', default: 50, min: 0.1, step: 0.1 },
  ],
  compute: (v) => {
    const D = num(v.D);
    const d = num(v.d);
    const L = num(v.L, 1);
    const halfRad = Math.atan(Math.abs(D - d) / (2 * L));
    const einstellwinkel = (halfRad * 180) / Math.PI;
    const kegelwinkel = 2 * einstellwinkel;
    return [
      { label: 'Einstellwinkel', value: einstellwinkel, unit: '°', digits: 3 },
      { label: 'Kegelwinkel (voll)', value: kegelwinkel, unit: '°', digits: 3, primary: true },
    ];
  },
  intro:
    'Beim Kegeldrehen wird der Oberschlitten auf den halben Kegelwinkel (Einstellwinkel) geschwenkt. Der volle Kegelwinkel beschreibt die gesamte Öffnung des Kegels.',
  howto: [
    'Großen Durchmesser D des Kegels in mm eintragen.',
    'Kleinen Durchmesser d des Kegels in mm eintragen.',
    'Kegellänge L (axialer Abstand zwischen D und d) in mm eintragen.',
    'Oberschlitten auf den Einstellwinkel (halber Kegelwinkel) schwenken.',
  ],
  faq: [
    {
      q: 'Was ist der Unterschied zwischen Einstell- und Kegelwinkel?',
      a: 'Der Einstellwinkel ist der halbe Kegelwinkel und gibt an, um wie viel der Oberschlitten gegenüber der Drehachse geschwenkt wird. Der volle Kegelwinkel ist die gesamte Öffnung zwischen beiden Mantellinien.',
    },
    {
      q: 'Wie hängt das mit der Kegelsteigung zusammen?',
      a: 'Die Steigung C = (D − d)/L beschreibt denselben Kegel. Bei einem Verhältnis 1:10 wächst der Durchmesser um 1 mm je 10 mm Länge, was einem Einstellwinkel von etwa 2,86° entspricht.',
    },
  ],
  related: ['schnittgeschwindigkeit', 'vorschub-drehen'],
  updated: '2026-06-15',
  examples: [
    {
      values: { D: 40, d: 30, L: 50 },
      expect: [
        { label: 'Einstellwinkel', value: 5.711, tolerance: 0.01 },
        { label: 'Kegelwinkel (voll)', value: 11.421, tolerance: 0.01 },
      ],
    },
    {
      values: { D: 30, d: 20, L: 100 },
      expect: [
        { label: 'Einstellwinkel', value: 2.862, tolerance: 0.01 },
        { label: 'Kegelwinkel (voll)', value: 5.725, tolerance: 0.01 },
      ],
    },
  ],
};
