import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'gewindebohren-drehzahl',
  category: 'cnc',
  title: 'Gewindebohren-Drehzahl-Rechner',
  shortTitle: 'Gewindebohren-Drehzahl',
  description:
    'Berechne die Drehzahl fürs Gewindebohren aus Schnittgeschwindigkeit und Gewindedurchmesser. Für Gewindebohrer in Metall und Kunststoff.',
  keywords: [
    'gewindebohren drehzahl berechnen',
    'gewindebohrer drehzahl rechner',
    'drehzahl gewinde schneiden',
    'gewindebohren schnittgeschwindigkeit',
  ],
  formula: 'n = vc · 1000 / (π · d)  (1/min)',
  inputs: [
    { type: 'number', id: 'vc', label: 'Schnittgeschwindigkeit vc', unit: 'm/min', default: 15, min: 0.1, step: 0.5 },
    { type: 'number', id: 'd', label: 'Gewindedurchmesser d', unit: 'mm', default: 6, min: 0.1, step: 0.1 },
  ],
  compute: (v) => {
    const vc = num(v.vc);
    const d = num(v.d, 1);
    const n = (vc * 1000) / (Math.PI * d);
    return [
      { label: 'Drehzahl n', value: n, unit: '1/min', digits: 0, primary: true },
    ];
  },
  intro:
    'Gewindebohrer laufen deutlich langsamer als normale Bohrer, da Späne und Reibung im engen Gewinde abgeführt werden müssen. Aus vc und Nenndurchmesser ergibt sich die passende Drehzahl.',
  howto: [
    'Schnittgeschwindigkeit vc für Werkstoff und Gewindebohrer wählen (HSS in Stahl oft 5-15 m/min).',
    'Gewindenenndurchmesser d in mm eintragen (z. B. 6 für M6).',
    'Empfohlene Drehzahl n in 1/min ablesen.',
    'Beim Maschinengewindebohren Rückzug und Vorschub auf die Gewindesteigung abstimmen.',
  ],
  faq: [
    {
      q: 'Warum so niedrige Schnittgeschwindigkeit?',
      a: 'Beim Gewindebohren greift die gesamte Schneide ein und der Span muss durch die enge Bohrung. Hohe Drehzahlen führen schnell zu Werkzeugbruch, daher gelten kleine vc-Werte.',
    },
    {
      q: 'Brauche ich Kühlschmierstoff?',
      a: 'Ja, besonders in Stahl und Edelstahl. Schneidöl reduziert Reibung und Verschleiß deutlich und verbessert die Gewindequalität.',
    },
  ],
  related: ['bohrer-drehzahl', 'schnittgeschwindigkeit', 'drehzahl-vorschub'],
  updated: '2026-06-15',
  examples: [
    {
      values: { vc: 15, d: 6 },
      expect: [{ label: 'Drehzahl n', value: 796, tolerance: 2 }],
    },
    {
      values: { vc: 8, d: 5 },
      expect: [{ label: 'Drehzahl n', value: 509, tolerance: 2 }],
    },
  ],
};
