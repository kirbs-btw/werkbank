import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schnittgeschwindigkeit',
  category: 'cnc',
  title: 'Schnittgeschwindigkeit-Rechner (CNC)',
  shortTitle: 'Schnittgeschwindigkeit',
  description:
    'Berechne die Schnittgeschwindigkeit vc beim Fräsen oder Drehen aus Werkzeugdurchmesser und Drehzahl. Ideal für Schnittdaten und Materialwahl.',
  keywords: [
    'schnittgeschwindigkeit berechnen',
    'schnittgeschwindigkeit fräsen rechner',
    'vc berechnen cnc',
    'schnittgeschwindigkeit drehen',
  ],
  formula: 'vc = π · d · n / 1000  (m/min)',
  inputs: [
    { type: 'number', id: 'd', label: 'Werkzeugdurchmesser d', unit: 'mm', default: 10, min: 0.1, step: 0.1 },
    { type: 'number', id: 'n', label: 'Drehzahl n', unit: '1/min', default: 3000, min: 1, step: 10 },
  ],
  compute: (v) => {
    const d = num(v.d, 1);
    const n = num(v.n);
    const vc = (Math.PI * d * n) / 1000;
    return [
      { label: 'Schnittgeschwindigkeit vc', value: vc, unit: 'm/min', digits: 1, primary: true },
    ];
  },
  intro:
    'Die Schnittgeschwindigkeit vc ist die Relativgeschwindigkeit zwischen Werkzeugschneide und Werkstück. Sie bestimmt zusammen mit dem Material die optimale Drehzahl.',
  howto: [
    'Werkzeugdurchmesser d in mm eintragen (beim Drehen ist d der Werkstückdurchmesser).',
    'Spindeldrehzahl n in 1/min eintragen.',
    'Die Schnittgeschwindigkeit vc in m/min ablesen.',
    'Mit den Empfehlungen des Werkzeugherstellers für dein Material vergleichen.',
  ],
  faq: [
    {
      q: 'Welche Schnittgeschwindigkeit ist richtig?',
      a: 'Das hängt von Werkstoff und Schneidstoff ab. Stahl mit HSS liegt z. B. bei ca. 20-40 m/min, Aluminium mit Hartmetall oft über 300 m/min. Genaue Werte stehen in den Schnittdaten-Tabellen.',
    },
    {
      q: 'Warum durch 1000 teilen?',
      a: 'Der Durchmesser steht in Millimetern, vc wird aber in Meter pro Minute angegeben. Die Division durch 1000 rechnet von mm in m um.',
    },
  ],
  related: ['drehzahl-vorschub', 'bohrer-drehzahl', 'vorschub-drehen'],
  updated: '2026-06-15',
  examples: [
    {
      values: { d: 10, n: 3000 },
      expect: [{ label: 'Schnittgeschwindigkeit vc', value: 94.2, tolerance: 0.2 }],
    },
    {
      values: { d: 50, n: 1000 },
      expect: [{ label: 'Schnittgeschwindigkeit vc', value: 157.1, tolerance: 0.2 }],
    },
  ],
};
