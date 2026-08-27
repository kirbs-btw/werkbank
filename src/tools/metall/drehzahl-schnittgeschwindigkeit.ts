import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'drehzahl-schnittgeschwindigkeit',
  category: 'metall',
  title: 'Drehzahl-Rechner (Schnittgeschwindigkeit)',
  shortTitle: 'Drehzahl Vc',
  description: 'Berechne die optimale Drehzahl aus Schnittgeschwindigkeit und Durchmesser für Drehen, Fräsen und Bohren in Metall.',
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
  intro: 'Bestimme die richtige Spindeldrehzahl für dein Werkstück oder Werkzeug aus der empfohlenen Schnittgeschwindigkeit.',
  howto: [
    'Empfohlene Schnittgeschwindigkeit Vc für Material und Werkzeug eingeben.',
    'Durchmesser des Werkstücks (Drehen) oder des Werkzeugs (Fräsen/Bohren) in mm eintragen.',
    'Die ausgegebene Drehzahl an der Maschine einstellen.',
  ],
  faq: [
    { q: 'Welche Schnittgeschwindigkeit für Stahl?', a: 'Mit HSS etwa 20 bis 40 m/min, mit Hartmetall 80 bis 200 m/min, je nach Stahlsorte.' },
    { q: 'Welcher Durchmesser wird verwendet?', a: 'Beim Drehen der Werkstückdurchmesser, beim Fräsen und Bohren der Werkzeugdurchmesser.' },
  ],
  related: ['vorschub-fraesen'],
  updated: '2026-08-27',
  examples: [
    {
      values: { vc: 100, d: 20 },
      expect: [{ label: 'Drehzahl', value: 1592, tolerance: 1 }],
    },
  ],
};
