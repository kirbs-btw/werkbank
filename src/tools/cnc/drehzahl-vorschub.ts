import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'drehzahl-vorschub',
  category: 'cnc',
  title: 'CNC Drehzahl- & Vorschub-Rechner',
  shortTitle: 'Drehzahl & Vorschub',
  description:
    'Berechne Spindeldrehzahl und Vorschub aus Schnittgeschwindigkeit, Werkzeugdurchmesser, Zähnezahl und Zahnvorschub.',
  keywords: [
    'schnittdaten rechner',
    'drehzahl fräser berechnen',
    'vorschub berechnen cnc',
    'feeds and speeds rechner',
  ],
  formula: 'n = vc · 1000 / (π · d)  ·  vf = n · fz · z',
  inputs: [
    { type: 'number', id: 'vc', label: 'Schnittgeschwindigkeit vc', unit: 'm/min', default: 120, min: 1, step: 1 },
    { type: 'number', id: 'd', label: 'Werkzeugdurchmesser d', unit: 'mm', default: 6, min: 0.1, step: 0.1 },
    { type: 'number', id: 'z', label: 'Zähnezahl z', default: 2, min: 1, step: 1 },
    { type: 'number', id: 'fz', label: 'Zahnvorschub fz', unit: 'mm', default: 0.02, min: 0, step: 0.005 },
  ],
  compute: (v) => {
    const vc = num(v.vc);
    const d = num(v.d, 1);
    const z = num(v.z, 1);
    const fz = num(v.fz);
    const n = (vc * 1000) / (Math.PI * d);
    const vf = n * fz * z;
    return [
      { label: 'Drehzahl n', value: n, unit: '1/min', digits: 0, primary: true },
      { label: 'Vorschub vf', value: vf, unit: 'mm/min', digits: 0 },
    ];
  },
  faq: [
    {
      q: 'Woher bekomme ich vc und fz?',
      a: 'Schnittgeschwindigkeit vc und Zahnvorschub fz hängen von Material und Werkzeug ab und stehen in den Schnittdaten-Tabellen des Fräser-Herstellers.',
    },
  ],
  updated: '2026-06-15',
  examples: [
    {
      values: { vc: 120, d: 6, z: 2, fz: 0.02 },
      expect: [
        { label: 'Drehzahl n', value: 6366, tolerance: 5 },
        { label: 'Vorschub vf', value: 254.6, tolerance: 2 },
      ],
    },
  ],
};
