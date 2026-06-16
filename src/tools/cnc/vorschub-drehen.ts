import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'vorschub-drehen',
  category: 'cnc',
  title: 'Vorschub-Rechner (Drehen)',
  shortTitle: 'Vorschub Drehen',
  description:
    'Berechne die Vorschubgeschwindigkeit vf beim Drehen aus dem Vorschub pro Umdrehung und der Drehzahl. Für saubere Oberflächen und Spankontrolle.',
  keywords: [
    'vorschub drehen berechnen',
    'vorschubgeschwindigkeit drehen rechner',
    'vf berechnen drehmaschine',
    'vorschub pro umdrehung',
  ],
  formula: 'vf = f · n  (mm/min)',
  inputs: [
    { type: 'number', id: 'f', label: 'Vorschub pro Umdrehung f', unit: 'mm/U', default: 0.2, min: 0, step: 0.01 },
    { type: 'number', id: 'n', label: 'Drehzahl n', unit: '1/min', default: 1000, min: 0, step: 10 },
  ],
  compute: (v) => {
    const f = num(v.f);
    const n = num(v.n);
    const vf = f * n;
    return [
      { label: 'Vorschubgeschwindigkeit vf', value: vf, unit: 'mm/min', digits: 1, primary: true },
    ];
  },
  intro:
    'Beim Drehen wird der Vorschub meist pro Werkstückumdrehung (f in mm/U) angegeben. Multipliziert mit der Drehzahl ergibt sich die Vorschubgeschwindigkeit vf in mm/min.',
  howto: [
    'Vorschub pro Umdrehung f in mm/U eintragen (Schruppen größer, Schlichten kleiner).',
    'Drehzahl n der Spindel in 1/min eintragen.',
    'Vorschubgeschwindigkeit vf in mm/min ablesen.',
    'Wert in der Steuerung als G94-Vorschub (mm/min) verwenden oder f direkt mit G95.',
  ],
  faq: [
    {
      q: 'Welcher Vorschub pro Umdrehung ist üblich?',
      a: 'Beim Schlichten oft 0,05-0,2 mm/U, beim Schruppen 0,2-0,5 mm/U. Größere Eckenradien erlauben höhere Vorschübe bei gleicher Oberfläche.',
    },
    {
      q: 'Was ist der Unterschied zwischen f und vf?',
      a: 'f ist der Weg pro Umdrehung (mm/U), vf die zeitbezogene Geschwindigkeit (mm/min). vf = f mal Drehzahl.',
    },
  ],
  related: ['drehzahl-vorschub', 'schnittgeschwindigkeit', 'theoretische-rautiefe'],
  updated: '2026-06-15',
  examples: [
    {
      values: { f: 0.2, n: 1000 },
      expect: [{ label: 'Vorschubgeschwindigkeit vf', value: 200, tolerance: 0.1 }],
    },
    {
      values: { f: 0.15, n: 1500 },
      expect: [{ label: 'Vorschubgeschwindigkeit vf', value: 225, tolerance: 0.1 }],
    },
  ],
};
