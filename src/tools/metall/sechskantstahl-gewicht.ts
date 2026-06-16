import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'sechskantstahl-gewicht',
  category: 'metall',
  title: 'Sechskantstahl-Gewicht-Rechner',
  shortTitle: 'Sechskant Gewicht',
  description: 'Berechne das Gewicht von Sechskantstahl aus der Schlüsselweite (SW) und Länge für Stahl, Edelstahl, Messing oder Aluminium. Schnell und präzise.',
  keywords: ['sechskantstahl gewicht berechnen', 'sechskant gewicht rechner', 'schlüsselweite gewicht', 'kg pro meter sechskant', 'sechskantmaterial gewicht', 'hexagon stahl gewicht'],
  formula: 'A = (Wurzel(3)/2) x SW^2; m = A x (L/10) / 100 x Dichte / 1000 (SW = Schlüsselweite in mm)',
  inputs: [
    { type: 'number', id: 'sw', label: 'Schlüsselweite (SW)', unit: 'mm', default: 17, min: 0, step: 1, help: 'Abstand zweier paralleler Flächen' },
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'mm', default: 1000, min: 0, step: 1 },
    {
      type: 'select', id: 'material', label: 'Material', default: '7.85',
      options: [
        { value: '7.85', label: 'Stahl' },
        { value: '7.9', label: 'Edelstahl' },
        { value: '8.5', label: 'Messing' },
        { value: '2.70', label: 'Aluminium' },
        { value: '8.96', label: 'Kupfer' },
      ],
    },
  ],
  compute: (v) => {
    const sw = num(v.sw);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const flaecheMm2 = (Math.sqrt(3) / 2) * Math.pow(sw, 2);
    const volumenCm3 = (flaecheMm2 * L) / 1000;
    const gewichtG = volumenCm3 * dichte;
    const gewichtKg = gewichtG / 1000;
    const gewichtProMeter = L > 0 ? (gewichtKg / L) * 1000 : 0;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Gewicht pro Meter', value: gewichtProMeter, unit: 'kg/m', digits: 3 },
      { label: 'Querschnittsfläche', value: flaecheMm2, unit: 'mm²', digits: 1 },
    ];
  },
  intro: 'Dieser Rechner liefert das Gewicht von Sechskantstahl (Sechskantmaterial) aus der Schlüsselweite SW und der Länge. Die Querschnittsfläche eines regelmäßigen Sechsecks ist A = (√3/2)·SW², daraus folgt mit Länge und Dichte das Gewicht. Beim Drehen von Schraubenrohlingen, Muttern oder Distanzstücken hilft der Wert bei der Materialkalkulation und beim Bestellen passender Stangenlängen.',
  howto: [
    'Schlüsselweite SW in mm eintragen — das ist der Abstand zweier paralleler Flächen.',
    'Gesamtlänge des Sechskantstabs in mm eingeben.',
    'Werkstoff auswählen, die Dichte wird automatisch übernommen.',
    'Gewicht je Meter und Gesamtgewicht ablesen.',
  ],
  faq: [
    { q: 'Was ist die Schlüsselweite genau?', a: 'Die Schlüsselweite (SW) ist der Abstand zwischen zwei gegenüberliegenden parallelen Flächen des Sechsecks — also das Maß, an dem ein Maulschlüssel ansetzt.' },
    { q: 'Wie rechne ich vom Eckmaß auf die Schlüsselweite?', a: 'Das Eckmaß (Diagonale) ist SW geteilt durch cos(30°), also SW · 1,1547. Umgekehrt: SW = Eckmaß · 0,866.' },
    { q: 'Was wiegt SW17-Sechskantstahl pro Meter?', a: 'Querschnitt rund 250 mm², bei Baustahl also etwa 1,96 kg pro Meter.' },
    { q: 'Gilt die Formel auch für Messing-Sechskant?', a: 'Ja, wähle Messing mit Dichte 8,5 g/cm³ — typisch für Sechskant-Drehteile und Fittings.' },
  ],
  related: ['vierkant-gewicht', 'rundmaterial-gewicht', 'gewindestange-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { sw: 17, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 1.965, tolerance: 0.01 }],
    },
    {
      values: { sw: 24, laenge: 1000, material: '8.5' },
      expect: [{ label: 'Gewicht', value: 4.241, tolerance: 0.02 }],
    },
  ],
};
