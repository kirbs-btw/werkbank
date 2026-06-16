import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'quadratrohr-gewicht',
  category: 'metall',
  title: 'Quadratrohr-Gewicht-Rechner',
  shortTitle: 'Quadratrohr Gewicht',
  description: 'Berechne das Gewicht von Quadratrohr und Vierkantrohr aus Seitenlänge, Wandstärke und Länge für Stahl, Edelstahl oder Aluminium — schnell und genau.',
  keywords: ['quadratrohr gewicht berechnen', 'vierkantrohr gewicht rechner', 'quadratrohr kg/m', 'kg pro meter vierkantrohr', 'hohlprofil quadrat gewicht', 'quadratisches rohr gewicht', 'rohr quadrat kg meter', 'kantrohr gewicht'],
  formula: 'A = a² − (a − 2·t)²; m = A · (L/1000) · Dichte / 1000 (a = Seitenlänge, t = Wandstärke, Maße in mm)',
  inputs: [
    { type: 'number', id: 'seite', label: 'Seitenlänge (außen)', unit: 'mm', default: 40, min: 0, step: 1, help: 'Äußere Kantenlänge des Quadrats' },
    { type: 'number', id: 'wand', label: 'Wandstärke', unit: 'mm', default: 2, min: 0, step: 0.5 },
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'mm', default: 1000, min: 0, step: 1 },
    {
      type: 'select', id: 'material', label: 'Material', default: '7.85',
      options: [
        { value: '7.85', label: 'Stahl' },
        { value: '7.9', label: 'Edelstahl' },
        { value: '2.70', label: 'Aluminium' },
        { value: '8.5', label: 'Messing' },
      ],
    },
  ],
  compute: (v) => {
    const a = num(v.seite);
    const t = num(v.wand);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const innen = Math.max(0, a - 2 * t);
    const flaecheMm2 = a * a - innen * innen;
    const volumenCm3 = (flaecheMm2 * L) / 1000;
    const gewichtKg = (volumenCm3 * dichte) / 1000;
    const gewichtProMeter = L > 0 ? (gewichtKg / L) * 1000 : 0;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Gewicht pro Meter', value: gewichtProMeter, unit: 'kg/m', digits: 3 },
      { label: 'Querschnittsfläche', value: flaecheMm2, unit: 'mm²', digits: 1 },
    ];
  },
  intro: 'Dieser Rechner ermittelt das Gewicht von Quadratrohr (Vierkantrohr, quadratisches Hohlprofil) aus äußerer Seitenlänge, Wandstärke und Länge. Die ringförmige Querschnittsfläche ist die Differenz aus Außenquadrat und Innenquadrat: A = a² − (a − 2·t)². Multipliziert mit Länge und Werkstoffdichte ergibt sich das Gewicht. Für Rahmenbau, Geländer und Maschinengestelle ist das Quadratrohr ein Klassiker — der Wert hilft bei Versandkosten, Tragwerk und Materialbestellung.',
  howto: [
    'Äußere Seitenlänge a des Quadratrohrs in mm eintragen.',
    'Wandstärke (Materialdicke) in mm angeben.',
    'Länge des Rohrs in mm eingeben.',
    'Werkstoff wählen — die Dichte wird automatisch übernommen, dann Gewicht ablesen.',
  ],
  faq: [
    { q: 'Was wiegt ein Quadratrohr 40x40x2 aus Stahl pro Meter?', a: 'Querschnitt 304 mm², bei Baustahl also rund 2,39 kg pro Meter.' },
    { q: 'Worin liegt der Unterschied zum Vierkant-Vollmaterial?', a: 'Das Quadratrohr ist hohl, das Vierkant ist massiv. Bei gleichen Außenmaßen ist das Rohr deutlich leichter — für Vollmaterial den Vierkant-Rechner nutzen.' },
    { q: 'Stimmt die Formel auch für geschweißte Konstruktionsrohre?', a: 'Ja, geschweißte Quadratrohre nach EN 10219 haben außen scharfe bis leicht gerundete Kanten. Die kleine Eckenrundung wird hier vernachlässigt, der Fehler liegt unter ein Prozent.' },
    { q: 'Wie berücksichtige ich gerundete Außenecken?', a: 'Bei Präzisionsrohren mit größerem Eckenradius wird das echte Gewicht minimal kleiner. Für eine exakte Angabe die Herstellertabelle (kg/m) verwenden.' },
    { q: 'Gilt der Rechner auch für Alu-Quadratrohr?', a: 'Ja, wähle Aluminium mit Dichte 2,70 g/cm³. Das Gewicht beträgt dann etwa ein Drittel des Stahlwerts bei gleichen Maßen.' },
  ],
  related: ['rechteckrohr-gewicht', 'vierkant-gewicht', 'rohr-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { seite: 40, wand: 2, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 2.386, tolerance: 0.01 }],
    },
    {
      values: { seite: 30, wand: 2, laenge: 1000, material: '2.70' },
      expect: [{ label: 'Gewicht', value: 0.605, tolerance: 0.01 }],
    },
  ],
};
