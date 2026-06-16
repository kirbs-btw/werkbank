import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'theoretische-rautiefe',
  category: 'cnc',
  title: 'Theoretische Rautiefe (Drehen) Rechner',
  shortTitle: 'Theoretische Rautiefe',
  description:
    'Berechne die theoretische Rautiefe Rt beim Drehen aus Vorschub pro Umdrehung und Eckenradius der Wendeschneidplatte. Für die Oberflächengüte.',
  keywords: [
    'theoretische rautiefe berechnen',
    'rautiefe drehen rechner',
    'oberflächengüte drehen vorschub',
    'rt eckenradius vorschub',
  ],
  formula: 'Rt = f² / (8 · r) · 1000  (µm),  mit f in mm/U und r in mm',
  inputs: [
    { type: 'number', id: 'f', label: 'Vorschub pro Umdrehung f', unit: 'mm/U', default: 0.2, min: 0, step: 0.01 },
    { type: 'number', id: 'r', label: 'Eckenradius r', unit: 'mm', default: 0.8, min: 0.01, step: 0.01 },
  ],
  compute: (v) => {
    const f = num(v.f);
    const r = num(v.r, 0.01);
    const rt = ((f * f) / (8 * r)) * 1000;
    return [
      { label: 'Theoretische Rautiefe Rt', value: rt, unit: 'µm', digits: 2, primary: true },
    ];
  },
  intro:
    'Die theoretische Rautiefe Rt entsteht durch die Vorschubrillen, die der Eckenradius des Drehmeißels hinterlässt. Kleiner Vorschub und großer Eckenradius ergeben eine glattere Oberfläche.',
  howto: [
    'Vorschub pro Umdrehung f in mm/U eintragen.',
    'Eckenradius r der Schneidplatte in mm eintragen (z. B. 0,4 / 0,8 / 1,2 mm).',
    'Theoretische Rautiefe Rt in µm ablesen.',
    'Bei zu hoher Rautiefe Vorschub verringern oder größeren Eckenradius wählen.',
  ],
  faq: [
    {
      q: 'Ist Rt das Gleiche wie der gemessene Ra?',
      a: 'Nein. Rt ist ein theoretischer Wert nur aus der Geometrie. Der praktisch gemessene Mittenrauwert Ra liegt wegen Schneidkantenaufbau, Schwingungen und Verschleiß meist höher.',
    },
    {
      q: 'Wie halbiere ich die Rautiefe?',
      a: 'Rt steigt mit dem Quadrat des Vorschubs. Reduzierst du f um Faktor 1,41, sinkt Rt etwa auf die Hälfte. Ein doppelter Eckenradius halbiert Rt ebenfalls.',
    },
  ],
  related: ['vorschub-drehen', 'schnittgeschwindigkeit'],
  updated: '2026-06-15',
  examples: [
    {
      values: { f: 0.2, r: 0.8 },
      expect: [{ label: 'Theoretische Rautiefe Rt', value: 6.25, tolerance: 0.05 }],
    },
    {
      values: { f: 0.1, r: 0.4 },
      expect: [{ label: 'Theoretische Rautiefe Rt', value: 3.13, tolerance: 0.05 }],
    },
  ],
};
