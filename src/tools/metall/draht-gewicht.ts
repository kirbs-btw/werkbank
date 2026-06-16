import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'draht-gewicht',
  category: 'metall',
  title: 'Draht-Gewicht- und Längen-Rechner',
  shortTitle: 'Drahtgewicht',
  description: 'Berechne Gewicht oder Länge von rundem Draht aus Durchmesser und Länge für Stahl, Edelstahl, Aluminium, Kupfer oder Messing.',
  keywords: ['draht gewicht berechnen', 'drahtlänge aus gewicht', 'gewicht draht pro meter', 'meter pro kg draht', 'stahldraht gewicht rechner', 'kupferdraht gewicht'],
  formula: 'g/m = PI/4 x d^2 x Dichte; m = g/m x L / 1000 (d in mm, L in m, Fläche in mm²)',
  inputs: [
    { type: 'number', id: 'd', label: 'Drahtdurchmesser', unit: 'mm', default: 2, min: 0, step: 0.1 },
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'm', default: 100, min: 0, step: 1 },
    {
      type: 'select', id: 'material', label: 'Material', default: '7.85',
      options: [
        { value: '7.85', label: 'Stahl' },
        { value: '7.9', label: 'Edelstahl' },
        { value: '8.96', label: 'Kupfer' },
        { value: '2.70', label: 'Aluminium' },
        { value: '8.5', label: 'Messing' },
      ],
    },
  ],
  compute: (v) => {
    const d = num(v.d);
    const Lm = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const flaecheMm2 = (Math.PI / 4) * Math.pow(d, 2);
    const gewichtProMeterG = flaecheMm2 * dichte;
    const gewichtKg = (gewichtProMeterG * Lm) / 1000;
    const meterProKg = gewichtProMeterG > 0 ? 1000 / gewichtProMeterG : 0;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Gewicht pro Meter', value: gewichtProMeterG, unit: 'g/m', digits: 2 },
      { label: 'Länge pro kg', value: meterProKg, unit: 'm/kg', digits: 1 },
    ];
  },
  intro: 'Mit diesem Rechner bestimmst du das Gewicht von rundem Draht aus Durchmesser und Länge — und über den Wert „Länge pro kg“ auch umgekehrt, wie viele Meter in einer Rolle stecken. Grundlage ist der Kreisquerschnitt π/4·d², multipliziert mit Länge und Werkstoffdichte. Praktisch beim Bestellen von Schweiß-, Binde-, Feder- oder Kupferdraht, bei der Lagerverwaltung und beim Abschätzen von Restmengen auf der Rolle.',
  howto: [
    'Drahtdurchmesser in mm eingeben.',
    'Drahtlänge in Metern eintragen.',
    'Werkstoff auswählen, die Dichte wird automatisch gesetzt.',
    'Gesamtgewicht sowie Gewicht je Meter und Meter je Kilogramm ablesen.',
  ],
  faq: [
    { q: 'Wie ermittle ich die Länge aus dem Restgewicht einer Rolle?', a: 'Nutze den Wert „Länge pro kg“: Restgewicht in kg mal diesem Faktor ergibt die verbleibende Drahtlänge in Metern.' },
    { q: 'Was wiegt ein Meter 2-mm-Stahldraht?', a: 'Querschnitt 3,14 mm², bei Stahl etwa 24,7 g pro Meter — eine 100-m-Rolle wiegt also rund 2,47 kg.' },
    { q: 'Gilt der Rechner auch für Kupferdraht?', a: 'Ja, wähle Kupfer mit Dichte 8,96 g/cm³. Bei gleichem Durchmesser wiegt Kupferdraht deutlich mehr als Stahldraht.' },
    { q: 'Stimmt das auch für lackierten oder verzinkten Draht?', a: 'Beschichtungen erhöhen das Gewicht nur um Bruchteile eines Prozents und werden hier vernachlässigt; der Wert gilt für den blanken Metallkern.' },
  ],
  related: ['rundmaterial-gewicht', 'schweissdraht-bedarf', 'gewindestange-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { d: 2, laenge: 100, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 2.466, tolerance: 0.01 }],
    },
    {
      values: { d: 1, laenge: 100, material: '8.96' },
      expect: [{ label: 'Gewicht', value: 0.704, tolerance: 0.01 }],
    },
  ],
};
