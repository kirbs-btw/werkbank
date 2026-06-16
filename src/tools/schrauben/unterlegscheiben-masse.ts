import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Maße flacher Unterlegscheiben nach DIN 125 Form A (= DIN EN ISO 7089), in mm.
// d1 = Innendurchmesser (Bohrung), d2 = Außendurchmesser, s = Dicke.
const TABLE: Record<string, { d1: number; d2: number; s: number }> = {
  M3: { d1: 3.2, d2: 7, s: 0.5 },
  M4: { d1: 4.3, d2: 9, s: 0.8 },
  M5: { d1: 5.3, d2: 10, s: 1.0 },
  M6: { d1: 6.4, d2: 12, s: 1.6 },
  M8: { d1: 8.4, d2: 16, s: 1.6 },
  M10: { d1: 10.5, d2: 20, s: 2.0 },
  M12: { d1: 13, d2: 24, s: 2.5 },
  M14: { d1: 15, d2: 28, s: 2.5 },
  M16: { d1: 17, d2: 30, s: 3.0 },
  M20: { d1: 21, d2: 37, s: 3.0 },
  M24: { d1: 25, d2: 44, s: 4.0 },
};

export const tool: Tool = {
  slug: 'unterlegscheiben-masse',
  category: 'schrauben',
  title: 'Unterlegscheiben-Maße nach DIN 125 (Form A)',
  shortTitle: 'Unterlegscheiben-Maße',
  description:
    'Schlage Innendurchmesser, Außendurchmesser und Dicke flacher Unterlegscheiben nach DIN 125 Form A (ISO 7089) für M3 bis M24 nach.',
  keywords: [
    'unterlegscheibe maße tabelle',
    'din 125 abmessungen',
    'unterlegscheibe m8 durchmesser',
    'beilagscheibe größe',
    'scheibe außendurchmesser din 125',
    'unterlegscheibe dicke tabelle',
    'iso 7089 maße',
  ],
  formula: 'Lookup d1/d2/s nach DIN 125 Form A (= DIN EN ISO 7089)',
  inputs: [
    {
      type: 'select', id: 'gewinde', label: 'Schraubengröße', default: 'M8',
      options: [
        { value: 'M3', label: 'M3' },
        { value: 'M4', label: 'M4' },
        { value: 'M5', label: 'M5' },
        { value: 'M6', label: 'M6' },
        { value: 'M8', label: 'M8' },
        { value: 'M10', label: 'M10' },
        { value: 'M12', label: 'M12' },
        { value: 'M14', label: 'M14' },
        { value: 'M16', label: 'M16' },
        { value: 'M20', label: 'M20' },
        { value: 'M24', label: 'M24' },
      ],
      help: 'Form A = normale Reihe; die Bohrung ist etwas größer als der Schraubenschaft.',
    },
  ],
  compute: (v) => {
    const key = String(v.gewinde);
    const row = TABLE[key] ?? TABLE.M8;
    const flaeche = (Math.PI / 4) * (row.d2 * row.d2 - row.d1 * row.d1);
    return [
      { label: 'Innendurchmesser d1', value: row.d1, unit: 'mm', digits: 1, primary: true },
      { label: 'Außendurchmesser d2', value: row.d2, unit: 'mm', digits: 1 },
      { label: 'Dicke s', value: row.s, unit: 'mm', digits: 1 },
      { label: 'Auflagefläche (Ring)', value: flaeche, unit: 'mm²', digits: 1, help: 'Ringfläche der Scheibe, ohne Bohrung.' },
    ];
  },
  intro:
    'Unterlegscheiben nach DIN 125 Form A verteilen die Vorspannkraft einer Schraube auf eine größere Auflagefläche und schützen die Oberfläche der verschraubten Teile. Die Bohrung d1 ist bewusst etwas größer als der Schraubenschaft, der Außendurchmesser d2 und die Dicke s sind je Größe genormt. Mit der Umstellung gilt heute meist DIN EN ISO 7089, deren Maße praktisch identisch zur klassischen DIN 125 sind.',
  howto: [
    'Schraubengröße wählen (M3 bis M24).',
    'Innendurchmesser d1 prüfen — er muss über dem Schraubenschaft liegen.',
    'Außendurchmesser d2 und Dicke s ablesen, um die Einbauhöhe zu planen.',
    'Auflagefläche nutzen, um die Flächenpressung unter dem Kopf abzuschätzen.',
  ],
  faq: [
    { q: 'Warum ist die Bohrung größer als die Schraube?', a: 'Damit sich die Scheibe leicht aufschieben lässt und kleine Lochtoleranzen ausgeglichen werden. Bei M8 hat die Scheibe z. B. 8,4 mm Bohrung statt exakt 8 mm.' },
    { q: 'Was unterscheidet Form A von Form B?', a: 'Form A hat beidseitig gefaste Kanten und ist die Standardausführung. Form B ist nur einseitig gefast. Für Maschinenbau und Holzwerkstoffe ist Form A der Normalfall.' },
    { q: 'Wie groß ist eine M10-Scheibe?', a: 'Innen 10,5 mm, außen 20 mm, Dicke 2,0 mm. Damit ist die ringförmige Auflagefläche rund 228 mm² groß.' },
    { q: 'Gilt DIN 125 noch?', a: 'Sie wurde durch DIN EN ISO 7089 abgelöst, die Maße sind aber nahezu identisch. Im Handel werden beide Bezeichnungen weiter verwendet.' },
    { q: 'Wofür brauche ich die Auflagefläche?', a: 'Aus Vorspannkraft geteilt durch Auflagefläche ergibt sich die Flächenpressung. Eine größere Scheibe senkt die Pressung und verhindert das Einsinken in weiche Werkstoffe.' },
  ],
  related: ['flaechenpressung-kopf', 'schluesselweite', 'metrisches-gewinde-tabelle'],
  updated: '2026-06-16',
  examples: [
    { values: { gewinde: 'M8' }, expect: [{ label: 'Innendurchmesser d1', value: 8.4, tolerance: 0.01 }] },
    { values: { gewinde: 'M10' }, expect: [{ label: 'Außendurchmesser d2', value: 20, tolerance: 0.01 }] },
  ],
};
