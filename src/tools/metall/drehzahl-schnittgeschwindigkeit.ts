import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'drehzahl-schnittgeschwindigkeit',
  category: 'metall',
  title: 'Drehzahl-Rechner (Schnittgeschwindigkeit)',
  shortTitle: 'Drehzahl Vc',
  description: 'Berechne die optimale Drehzahl aus Schnittgeschwindigkeit und Durchmesser fuer Drehen, Fraesen und Bohren in Metall.',
  keywords: ['drehzahl berechnen', 'schnittgeschwindigkeit drehzahl rechner', 'drehzahl fraesen formel', 'vc drehzahl bohren'],
  formula: 'n = (Vc x 1000) / (PI x d)  [n in 1/min, Vc in m/min, d in mm]',
  inputs: [
    { type: 'number', id: 'vc', label: 'Schnittgeschwindigkeit', unit: 'm/min', default: 100, min: 0, step: 1 },
    { type: 'number', id: 'd', label: 'Durchmesser', unit: 'mm', default: 20, min: 0.1, step: 0.5 },
  ],
  compute: (v) => {
    const vc = num(v.vc);
    const d = num(v.d, 0.1);
    const n = (vc * 1000) / (Math.PI * d);
    return [
      { label: 'Drehzahl', value: n, unit: '1/min', digits: 0, primary: true },
    ];
  },
  intro: 'Bestimme die richtige Spindeldrehzahl fuer dein Werkstueck oder Werkzeug aus der empfohlenen Schnittgeschwindigkeit.',
  howto: [
    'Empfohlene Schnittgeschwindigkeit Vc fuer Material und Werkzeug eingeben.',
    'Durchmesser des Werkstuecks (Drehen) oder des Werkzeugs (Fraesen/Bohren) in mm eintragen.',
    'Die ausgegebene Drehzahl an der Maschine einstellen.',
  ],
  faq: [
    { q: 'Welche Schnittgeschwindigkeit fuer Stahl?', a: 'Mit HSS etwa 20 bis 40 m/min, mit Hartmetall 80 bis 200 m/min, je nach Stahlsorte.' },
    { q: 'Welcher Durchmesser wird verwendet?', a: 'Beim Drehen der Werkstueckdurchmesser, beim Fraesen und Bohren der Werkzeugdurchmesser.' },
  ],
  related: ['vorschub-fraesen'],
  updated: '2026-06-15',
  examples: [
    {
      values: { vc: 100, d: 20 },
      expect: [{ label: 'Drehzahl', value: 1592, tolerance: 1 }],
    },
  ],
};
