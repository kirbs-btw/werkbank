import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'rechteckrohr-gewicht',
  category: 'metall',
  title: 'Rechteckrohr-Gewicht-Rechner',
  shortTitle: 'Rechteckrohr Gewicht',
  description: 'Berechne das Gewicht von Rechteckrohr und Flachrohr aus Breite, Höhe, Wandstärke und Länge für Stahl, Edelstahl oder Aluminium — schnell und präzise.',
  keywords: ['rechteckrohr gewicht berechnen', 'flachrohr gewicht rechner', 'rechteckrohr kg/m', 'kg pro meter rechteckrohr', 'rechteckiges hohlprofil gewicht', 'rohr rechteck gewicht', 'kantrohr rechteck kg', 'profilrohr gewicht'],
  formula: 'A = b·h − (b − 2·t)·(h − 2·t); m = A · (L/1000) · Dichte / 1000 (Maße in mm)',
  inputs: [
    { type: 'number', id: 'breite', label: 'Breite (außen)', unit: 'mm', default: 60, min: 0, step: 1, help: 'Äußere Breite' },
    { type: 'number', id: 'hoehe', label: 'Höhe (außen)', unit: 'mm', default: 40, min: 0, step: 1, help: 'Äußere Höhe' },
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
    const b = num(v.breite);
    const h = num(v.hoehe);
    const t = num(v.wand);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const bi = Math.max(0, b - 2 * t);
    const hi = Math.max(0, h - 2 * t);
    const flaecheMm2 = b * h - bi * hi;
    const volumenCm3 = (flaecheMm2 * L) / 1000;
    const gewichtKg = (volumenCm3 * dichte) / 1000;
    const gewichtProMeter = L > 0 ? (gewichtKg / L) * 1000 : 0;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Gewicht pro Meter', value: gewichtProMeter, unit: 'kg/m', digits: 3 },
      { label: 'Querschnittsfläche', value: flaecheMm2, unit: 'mm²', digits: 1 },
    ];
  },
  intro: 'Mit diesem Rechner bestimmst du das Gewicht von Rechteckrohr (Flachrohr, rechteckiges Hohlprofil) aus äußerer Breite, Höhe, Wandstärke und Länge. Die Querschnittsfläche ergibt sich aus Außenrechteck minus Innenrechteck: A = b·h − (b−2·t)·(h−2·t). Mit Länge und Dichte folgt das Gewicht. Rechteckrohre sind im Maschinen-, Geländer- und Möbelbau weit verbreitet — der Wert hilft bei Versand, Statik und Materialkalkulation.',
  howto: [
    'Äußere Breite b des Rechteckrohrs in mm eintragen.',
    'Äußere Höhe h in mm angeben.',
    'Wandstärke und Länge in mm eingeben.',
    'Werkstoff wählen — die Dichte wird automatisch gesetzt, dann Gewicht ablesen.',
  ],
  faq: [
    { q: 'Was wiegt ein Rechteckrohr 60x40x2 aus Stahl pro Meter?', a: 'Querschnitt 384 mm², bei Baustahl also rund 3,01 kg pro Meter.' },
    { q: 'Spielt es eine Rolle, ob ich Breite und Höhe vertausche?', a: 'Nein, das Gewicht bleibt identisch, da b·h kommutativ ist. Für die Statik ist die Orientierung (liegend/stehend) aber entscheidend.' },
    { q: 'Gilt das auch für warmgefertigte Hohlprofile?', a: 'Näherungsweise ja. Warmgefertigte Profile nach EN 10210 haben größere Eckenradien; der Rechner vernachlässigt diese, der Fehler bleibt unter ein bis zwei Prozent.' },
    { q: 'Wie schwer ist Alu-Rechteckrohr im Vergleich zu Stahl?', a: 'Bei gleichen Maßen rund 34 Prozent des Stahlgewichts, da die Dichte 2,70 statt 7,85 g/cm³ beträgt.' },
    { q: 'Was ist, wenn die Wandstärke größer als die halbe Höhe ist?', a: 'Dann gibt es keinen Hohlraum mehr und das Profil ist faktisch massiv. Der Rechner begrenzt das Innenmaß auf null und rechnet korrekt als Vollquerschnitt.' },
  ],
  related: ['quadratrohr-gewicht', 'rohr-gewicht', 'flachstahl-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { breite: 60, hoehe: 40, wand: 2, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 3.014, tolerance: 0.01 }],
    },
    {
      values: { breite: 50, hoehe: 30, wand: 3, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 3.485, tolerance: 0.01 }],
    },
  ],
};
