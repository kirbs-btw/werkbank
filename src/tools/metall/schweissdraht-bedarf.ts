import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schweissdraht-bedarf',
  category: 'metall',
  title: 'Schweißdraht-Bedarf-Rechner (Kehlnaht)',
  shortTitle: 'Schweißdraht Bedarf',
  description: 'Berechne Schweißgut und Drahtbedarf für Kehlnähte aus Schenkelmaß (a-Maß), Nahtlänge und Wirkungsgrad. Für MAG- und MIG-Schweißen in der Werkstatt.',
  keywords: ['schweißdraht bedarf berechnen', 'schweißgut kehlnaht', 'nahtvolumen schweißen', 'drahtverbrauch mag schweißen', 'schweißzusatz menge berechnen', 'kehlnaht gewicht'],
  formula: 'A_Naht = z^2 / 2; Schweißgut = A_Naht x L x Dichte; Draht = Schweißgut / Wirkungsgrad',
  inputs: [
    { type: 'number', id: 'schenkel', label: 'Schenkelmaß z', unit: 'mm', default: 5, min: 0, step: 0.5, help: 'Kantenlänge der Kehlnaht (Schenkelmaß)' },
    { type: 'number', id: 'laenge', label: 'Nahtlänge gesamt', unit: 'mm', default: 1000, min: 0, step: 1 },
    {
      type: 'select', id: 'wirkungsgrad', label: 'Abschmelz-Wirkungsgrad', default: '0.9',
      options: [
        { value: '0.95', label: 'MAG Massivdraht (95 %)' },
        { value: '0.9', label: 'MIG/MAG normal (90 %)' },
        { value: '0.85', label: 'Fülldraht (85 %)' },
        { value: '0.65', label: 'Stabelektrode (65 %)' },
      ],
    },
  ],
  compute: (v) => {
    const z = num(v.schenkel);
    const L = num(v.laenge);
    const eta = num(v.wirkungsgrad, 0.9);
    const nahtQuerschnittMm2 = (z * z) / 2;
    const schweissgutVolCm3 = (nahtQuerschnittMm2 * L) / 1000;
    const schweissgutG = schweissgutVolCm3 * 7.85;
    const drahtbedarfG = eta > 0 ? schweissgutG / eta : 0;
    return [
      { label: 'Drahtbedarf', value: drahtbedarfG, unit: 'g', digits: 1, primary: true },
      { label: 'Schweißgut', value: schweissgutG, unit: 'g', digits: 1 },
      { label: 'Nahtquerschnitt', value: nahtQuerschnittMm2, unit: 'mm²', digits: 2 },
    ];
  },
  intro: 'Dieser Rechner schätzt, wie viel Schweißzusatz du für eine Kehlnaht brauchst. Aus dem Schenkelmaß z ergibt sich der dreieckige Nahtquerschnitt z²/2; mal Nahtlänge und Stahldichte erhältst du das reine Schweißgut, das durch den Abschmelz-Wirkungsgrad zum tatsächlichen Drahtbedarf wird. So kalkulierst du beim MAG- oder MIG-Schweißen den Spulenverbrauch und vermeidest, dass mitten in der Naht der Draht ausgeht.',
  howto: [
    'Schenkelmaß z der Kehlnaht in mm eintragen (Kantenlänge des Naht-Dreiecks).',
    'Gesamte zu schweißende Nahtlänge in mm angeben (alle Nähte addieren).',
    'Schweißverfahren bzw. Abschmelz-Wirkungsgrad auswählen.',
    'Drahtbedarf in Gramm sowie Schweißgut und Nahtquerschnitt ablesen.',
  ],
  faq: [
    { q: 'Was ist der Unterschied zwischen Schweißgut und Drahtbedarf?', a: 'Schweißgut ist das Metall, das tatsächlich in der Naht landet. Der Drahtbedarf ist höher, weil ein Teil durch Spritzer, Abbrand und Schlacke verloren geht — abgebildet über den Wirkungsgrad.' },
    { q: 'Wie hängt das a-Maß mit dem Schenkelmaß zusammen?', a: 'Für eine gleichschenklige Kehlnaht gilt a = z · 0,707. Dieser Rechner arbeitet mit dem Schenkelmaß z; den Querschnitt z²/2 kannst du auch als a²·1 darstellen.' },
    { q: 'Warum rechnet das Tool mit Stahldichte?', a: 'Schweißzusätze für unlegierten und niedriglegierten Stahl liegen sehr nah an 7,85 g/cm³. Für Aluminium müsstest du das Ergebnis mit 2,7/7,85 skalieren.' },
    { q: 'Wie viel Draht braucht eine 1 m lange a4-Kehlnaht?', a: 'Bei z = 5 mm sind das rund 98 g Schweißgut, mit 90 % Wirkungsgrad etwa 109 g Draht pro Meter.' },
    { q: 'Berücksichtigt der Rechner eine überwölbte Naht?', a: 'Nein, er rechnet mit dem theoretischen Dreieck. Eine leicht konvexe Naht erhöht den Bedarf um etwa 10-20 %, plane hier einen Aufschlag ein.' },
  ],
  related: ['draht-gewicht', 'rundmaterial-gewicht', 'minimaler-biegeradius'],
  updated: '2026-06-16',
  examples: [
    {
      values: { schenkel: 5, laenge: 1000, wirkungsgrad: '0.9' },
      expect: [{ label: 'Drahtbedarf', value: 109.0, tolerance: 0.5 }],
    },
    {
      values: { schenkel: 4, laenge: 2000, wirkungsgrad: '0.95' },
      expect: [{ label: 'Drahtbedarf', value: 132.2, tolerance: 0.5 }],
    },
  ],
};
