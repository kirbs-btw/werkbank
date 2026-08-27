import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'vorschub-fraesen',
  category: 'metall',
  title: 'Vorschub-Rechner Fräsen',
  shortTitle: 'Vorschub Vf',
  description: 'Berechne den Vorschub beim Fräsen aus Zahnvorschub, Zähnezahl und Drehzahl. Ergibt Vorschubgeschwindigkeit Vf in mm/min.',
  keywords: ['vorschub fraesen berechnen', 'vf vorschub rechner', 'zahnvorschub fraesen formel', 'vorschubgeschwindigkeit fraese'],
  formula: 'Vf = fz x z x n  [Vf in mm/min, fz in mm/Zahn, z Zähne, n in 1/min]',
  inputs: [
    { type: 'number', id: 'fz', label: 'Zahnvorschub fz', unit: 'mm/Zahn', default: 0.05, min: 0, step: 0.01 },
    { type: 'number', id: 'z', label: 'Zähnezahl', unit: 'Zähne', default: 4, min: 1, step: 1 },
    { type: 'number', id: 'n', label: 'Drehzahl', unit: '1/min', default: 2000, min: 0, step: 10 },
  ],
  compute: (v) => {
    const fz = num(v.fz);
    const z = num(v.z);
    const n = num(v.n);
    const vf = fz * z * n;
    const fu = fz * z;
    return [
      { label: 'Vorschubgeschwindigkeit', value: vf, unit: 'mm/min', digits: 0, primary: true },
      { label: 'Vorschub pro Umdrehung', value: fu, unit: 'mm/U', digits: 3 },
    ];
  },
  intro: 'Bestimme die richtige Vorschubgeschwindigkeit für deine Fräse aus Zahnvorschub, Zähnezahl und Drehzahl.',
  howto: [
    'Zahnvorschub fz aus der Werkzeug-Empfehlung in mm/Zahn eingeben.',
    'Anzahl der Schneiden (Zähne) des Fräsers eintragen.',
    'Spindeldrehzahl in 1/min eingeben.',
  ],
  faq: [
    { q: 'Was ist der Zahnvorschub fz?', a: 'Der Weg, den jeder Zahn pro Umdrehung abträgt. Typisch 0,02 bis 0,2 mm/Zahn je nach Material und Fräser.' },
    { q: 'Woher bekomme ich die Drehzahl?', a: 'Aus der Schnittgeschwindigkeit, zum Beispiel mit unserem Drehzahl-Rechner.' },
  ],
  related: ['drehzahl-schnittgeschwindigkeit'],
  updated: '2026-08-27',
  examples: [
    {
      values: { fz: 0.05, z: 4, n: 2000 },
      expect: [
        { label: 'Vorschubgeschwindigkeit', value: 400, tolerance: 0.5 },
        { label: 'Vorschub pro Umdrehung', value: 0.2, tolerance: 0.001 },
      ],
    },
  ],
};
