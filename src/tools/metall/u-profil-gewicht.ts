import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'u-profil-gewicht',
  category: 'metall',
  title: 'U-Profil-Gewicht-Rechner',
  shortTitle: 'U-Profil Gewicht',
  description: 'Berechne das Gewicht von U-Profil und U-Stahl aus Höhe, Flanschbreite, Dicke und Länge für Stahl, Edelstahl oder Aluminium — schnell und genau.',
  keywords: ['u-profil gewicht berechnen', 'u-stahl gewicht rechner', 'gewicht u-profil kg/m', 'kg pro meter u-profil', 'c-profil gewicht', 'kantprofil u gewicht'],
  formula: 'A = t x (h + 2 x (b - t)); m = A x (L/10) / 100 x Dichte / 1000 (Maße in mm)',
  inputs: [
    { type: 'number', id: 'hoehe', label: 'Höhe (Steg)', unit: 'mm', default: 40, min: 0, step: 1, help: 'Höhe des Rückens / Stegs' },
    { type: 'number', id: 'breite', label: 'Flanschbreite', unit: 'mm', default: 20, min: 0, step: 1, help: 'Breite eines Schenkels' },
    { type: 'number', id: 'dicke', label: 'Materialdicke', unit: 'mm', default: 3, min: 0, step: 0.5 },
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
    const h = num(v.hoehe);
    const b = num(v.breite);
    const t = num(v.dicke);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const flaecheMm2 = t * (h + 2 * Math.max(0, b - t));
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
  intro: 'Mit diesem Rechner bestimmst du das Gewicht eines U-Profils (U-Stahl, Kantprofil) aus Steghöhe, Flanschbreite, Materialdicke und Länge. Die Querschnittsfläche A = t · (h + 2·(b − t)) wird mit Länge und Dichte multipliziert. Maker und Metallbauer nutzen den Wert, um Tragrahmen, Führungen und Einfassungen für Versandkosten, Tragfähigkeit und Materialbedarf einzuschätzen.',
  howto: [
    'Steghöhe (Rückenmaß) des U-Profils in mm eintragen.',
    'Flanschbreite eines Schenkels in mm eingeben.',
    'Materialdicke (Wandstärke) in mm angeben.',
    'Länge und Werkstoff wählen — die Dichte wird automatisch gesetzt.',
  ],
  faq: [
    { q: 'Gilt der Rechner auch für warmgewalzte UNP-Träger?', a: 'Näherungsweise ja, aber UNP-Profile haben dickere Flansche und Ausrundungen. Für tragende Berechnungen die DIN-1026-Tabelle nutzen, hier rechnet ein konstant dickes Kantprofil.' },
    { q: 'Was ist der Unterschied zwischen U- und C-Profil?', a: 'Geometrisch sind beide U-förmig. Beim C-Profil sind die Flanschenden zusätzlich eingebogen, was das Gewicht leicht erhöht.' },
    { q: 'Wie schwer ist ein Kant-U 40x20x3 aus Stahl?', a: 'Querschnitt 222 mm², also rund 1,74 kg pro Meter bei Baustahl.' },
    { q: 'Warum ziehe ich bei der Flanschbreite die Dicke ab?', a: 'Damit der Eckbereich nicht doppelt gezählt wird, wo Steg und Flansch zusammentreffen.' },
  ],
  related: ['winkelstahl-gewicht', 't-profil-gewicht', 'flachstahl-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { hoehe: 40, breite: 20, dicke: 3, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 1.743, tolerance: 0.01 }],
    },
    {
      values: { hoehe: 50, breite: 30, dicke: 4, laenge: 1000, material: '2.70' },
      expect: [{ label: 'Gewicht', value: 1.102, tolerance: 0.01 }],
    },
  ],
};
