import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 't-profil-gewicht',
  category: 'metall',
  title: 'T-Profil-Gewicht-Rechner',
  shortTitle: 'T-Profil Gewicht',
  description: 'Berechne das Gewicht von T-Profil und T-Stahl aus Breite, Höhe, Dicke und Länge für Stahl, Edelstahl, Aluminium oder Messing.',
  keywords: ['t-profil gewicht berechnen', 't-stahl gewicht rechner', 'gewicht t-profil kg/m', 'kg pro meter t-stahl', 'tee profil gewicht', 't-träger gewicht'],
  formula: 'A = t x (b + h - t); m = A x (L/10) / 100 x Dichte / 1000 (Maße in mm)',
  inputs: [
    { type: 'number', id: 'breite', label: 'Breite (Flansch)', unit: 'mm', default: 40, min: 0, step: 1, help: 'Breite des oberen Querbalkens' },
    { type: 'number', id: 'hoehe', label: 'Höhe (Steg)', unit: 'mm', default: 40, min: 0, step: 1, help: 'Gesamthöhe inkl. Flansch' },
    { type: 'number', id: 'dicke', label: 'Materialdicke', unit: 'mm', default: 5, min: 0, step: 0.5 },
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
    const b = num(v.breite);
    const h = num(v.hoehe);
    const t = num(v.dicke);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const flaecheMm2 = t * Math.max(0, b + h - t);
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
  intro: 'Dieser Rechner ermittelt das Gewicht eines T-Profils (T-Stahl) aus Flanschbreite, Steghöhe, Materialdicke und Länge. Bei konstanter Dicke ist die Querschnittsfläche A = t · (b + h − t); der Schnittpunkt von Flansch und Steg wird so nur einmal gezählt. Im Stahl- und Maschinenbau dient der Wert dazu, T-Aussteifungen, Rahmen und Auflager für Statik und Versandgewicht korrekt zu kalkulieren.',
  howto: [
    'Flanschbreite (oberer Querbalken) in mm eintragen.',
    'Gesamthöhe des Profils inklusive Flansch in mm eingeben.',
    'Materialdicke in mm angeben.',
    'Länge und Werkstoff wählen — die Dichte wird automatisch gesetzt.',
  ],
  faq: [
    { q: 'Warum ziehe ich in der Formel die Dicke einmal ab?', a: 'Flansch und Steg überlappen sich im T-Stoß. Mit A = t·(b + h − t) wird dieser gemeinsame Bereich nur einmal gerechnet.' },
    { q: 'Was wiegt ein T40x40x5 aus Stahl pro Meter?', a: 'Querschnitt 375 mm², bei Baustahl also rund 2,94 kg pro Meter.' },
    { q: 'Gilt das auch für warmgewalzte T-Träger nach DIN?', a: 'Genormte T-Profile haben Ausrundungen und teils unterschiedliche Steg-/Flanschdicken. Für tragende Bauteile die Normtabelle nutzen; dieser Rechner gilt für gleich dicke Profile.' },
    { q: 'Kann ich T-Profile aus Aluminium berechnen?', a: 'Ja, wähle Aluminium mit Dichte 2,70 g/cm³ — das Gewicht beträgt dann etwa ein Drittel des Stahlwerts.' },
  ],
  related: ['winkelstahl-gewicht', 'u-profil-gewicht', 'flachstahl-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { breite: 40, hoehe: 40, dicke: 5, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 2.944, tolerance: 0.01 }],
    },
    {
      values: { breite: 50, hoehe: 50, dicke: 6, laenge: 2000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 8.857, tolerance: 0.02 }],
    },
  ],
};
