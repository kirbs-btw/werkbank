import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'zeitspanvolumen',
  category: 'cnc',
  title: 'Zeitspanvolumen (MRR) Rechner',
  shortTitle: 'Zeitspanvolumen',
  description:
    'Berechne das Zeitspanvolumen Q (MRR) beim Fräsen aus radialer und axialer Zustellung sowie Vorschub. Maß für die Abtragsleistung.',
  keywords: [
    'zeitspanvolumen berechnen',
    'mrr rechner fräsen',
    'material removal rate berechnen',
    'abtragsleistung cnc',
  ],
  formula: 'Q = ae · ap · vf / 1000  (cm³/min)',
  inputs: [
    { type: 'number', id: 'ae', label: 'Radiale Zustellung ae', unit: 'mm', default: 6, min: 0, step: 0.1 },
    { type: 'number', id: 'ap', label: 'Axiale Zustellung ap', unit: 'mm', default: 2, min: 0, step: 0.1 },
    { type: 'number', id: 'vf', label: 'Vorschub vf', unit: 'mm/min', default: 800, min: 0, step: 10 },
  ],
  compute: (v) => {
    const ae = num(v.ae);
    const ap = num(v.ap);
    const vf = num(v.vf);
    const q = (ae * ap * vf) / 1000;
    return [
      { label: 'Zeitspanvolumen Q', value: q, unit: 'cm³/min', digits: 2, primary: true },
    ];
  },
  intro:
    'Das Zeitspanvolumen Q (engl. Material Removal Rate, MRR) gibt an, wie viel Material pro Minute zerspant wird. Es ist ein direktes Maß für die Wirtschaftlichkeit und Belastung des Prozesses.',
  howto: [
    'Radiale Zustellung ae (Eingriffsbreite quer zur Vorschubrichtung) in mm eintragen.',
    'Axiale Zustellung ap (Schnitttiefe) in mm eintragen.',
    'Vorschubgeschwindigkeit vf in mm/min eintragen.',
    'Zeitspanvolumen Q in cm³/min ablesen und mit der Maschinenleistung abgleichen.',
  ],
  faq: [
    {
      q: 'Wofür brauche ich das Zeitspanvolumen?',
      a: 'Es zeigt die Abtragsleistung und hilft, die benötigte Spindelleistung abzuschätzen. Ein hohes Q bedeutet kurze Bearbeitungszeit, aber auch höhere Kräfte und Wärme.',
    },
    {
      q: 'Warum durch 1000 teilen?',
      a: 'ae, ap und der Vorschub stehen in mm, das Ergebnis wäre mm³/min. Die Division durch 1000 wandelt mm³ in cm³ um.',
    },
  ],
  related: ['drehzahl-vorschub', 'schnittgeschwindigkeit'],
  updated: '2026-06-15',
  examples: [
    {
      values: { ae: 6, ap: 2, vf: 800 },
      expect: [{ label: 'Zeitspanvolumen Q', value: 9.6, tolerance: 0.01 }],
    },
    {
      values: { ae: 10, ap: 3, vf: 1200 },
      expect: [{ label: 'Zeitspanvolumen Q', value: 36, tolerance: 0.01 }],
    },
  ],
};
