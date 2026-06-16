import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-dpi-aufloesung',
  category: 'laser',
  title: 'Laser-DPI & Linienabstand Rechner',
  shortTitle: 'DPI & Auflösung',
  description:
    'Rechne zwischen Gravur-DPI und Linienabstand um und prüfe, welche Bildauflösung in Pixeln ein Motiv bei der gewählten DPI braucht.',
  keywords: [
    'laser dpi rechner',
    'dpi linienabstand umrechnen',
    'gravur auflösung dpi',
    'pixel pro mm laser',
    'lasergravur dpi einstellen',
    'welche dpi für lasergravur',
  ],
  formula:
    'Linienabstand = 25,4 / DPI;  Pixel = DPI × Größe_Zoll = DPI × (Größe_mm / 25,4)',
  inputs: [
    { type: 'number', id: 'dpi', label: 'Gravur-Auflösung', unit: 'DPI', default: 300, min: 1, step: 10, help: 'Punkte pro Zoll; höhere DPI = feiner, aber langsamer und mehr Hitze.' },
    { type: 'number', id: 'breite', label: 'Motivbreite', unit: 'mm', default: 100, min: 0, step: 1, help: 'Physische Breite der Gravur.' },
    { type: 'number', id: 'hoehe', label: 'Motivhöhe', unit: 'mm', default: 50, min: 0, step: 1, help: 'Physische Höhe der Gravur.' },
  ],
  compute: (v) => {
    const dpi = num(v.dpi, 1);
    const b = num(v.breite);
    const h = num(v.hoehe);
    const abstand = dpi > 0 ? 25.4 / dpi : 0; // mm
    const pxB = (dpi * b) / 25.4;
    const pxH = (dpi * h) / 25.4;
    const megapixel = (pxB * pxH) / 1_000_000;
    return [
      { label: 'Linienabstand', value: abstand, unit: 'mm', digits: 4, primary: true, help: 'Zeilenabstand der Rastergravur' },
      { label: 'Pixel Breite', value: pxB, unit: 'px', digits: 0 },
      { label: 'Pixel Höhe', value: pxH, unit: 'px', digits: 0 },
      { label: 'Benötigte Bildauflösung', value: megapixel, unit: 'MP', digits: 2 },
    ];
  },
  intro:
    'Die Gravurauflösung wird meist in DPI (dots per inch) angegeben, die Maschine arbeitet aber mit einem Zeilen- bzw. Linienabstand in Millimetern. Dieser Rechner wandelt beide Größen ineinander um und sagt zugleich, wie viele Pixel ein Bitmap-Motiv mindestens haben muss, damit es bei der gewählten DPI scharf graviert. So vermeidest du sowohl unscharfe, zu klein gerechnete Vorlagen als auch unnötig hohe DPI, die nur Zeit und Hitze kosten.',
  howto: [
    'Gewünschte Gravur-Auflösung in DPI eintragen (z. B. 254, 300 oder 500 DPI).',
    'Physische Motivbreite und -höhe in mm eintragen.',
    'Linienabstand in mm in die Maschine übernehmen (falls sie nicht direkt DPI versteht).',
    'Vorlage so anlegen, dass sie mindestens die angezeigte Pixelzahl bzw. Megapixel hat.',
  ],
  faq: [
    { q: 'Wie hängen DPI und Linienabstand zusammen?', a: 'Ein Zoll sind 25,4 mm. Der Linienabstand ist 25,4 geteilt durch die DPI. 254 DPI ergeben genau 0,1 mm, 500 DPI rund 0,0508 mm.' },
    { q: 'Welche DPI sind für Lasergravur sinnvoll?', a: 'Für Holz und Leder reichen oft 200-300 DPI, für feine Fotogravur auf Acryl oder eloxiertem Aluminium sind 300-600 DPI üblich. Mehr DPI bringt bei groben Materialien kaum sichtbaren Gewinn, kostet aber viel Zeit.' },
    { q: 'Warum brauche ich genug Pixel in der Vorlage?', a: 'Hat das Bitmap weniger Pixel als die Gravur Punkte, muss die Software hochskalieren und das Motiv wird unscharf oder treppig. Die angezeigte Pixelzahl ist das Minimum für eine saubere Gravur in der gewählten Größe.' },
    { q: 'Gilt das auch für Vektordateien?', a: 'Vektoren sind auflösungsunabhängig und skalieren beliebig. Die Pixel-Empfehlung gilt nur für Pixel-/Rastervorlagen wie JPG oder PNG, die zeilenweise als Rastergravur ausgegeben werden.' },
  ],
  related: ['laser-gravur-zeit', 'laser-gravurflaeche', 'laser-einstellung-material'],
  updated: '2026-06-16',
  examples: [
    { values: { dpi: 254, breite: 100, hoehe: 50 }, expect: [{ label: 'Linienabstand', value: 0.1, tolerance: 0.001 }] },
    { values: { dpi: 300, breite: 100, hoehe: 50 }, expect: [{ label: 'Pixel Breite', value: 1181, tolerance: 1 }] },
  ],
};
