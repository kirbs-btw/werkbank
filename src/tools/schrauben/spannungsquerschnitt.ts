import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'spannungsquerschnitt',
  category: 'schrauben',
  title: 'Spannungsquerschnitt As berechnen (metrisches Gewinde)',
  shortTitle: 'Spannungsquerschnitt',
  description:
    'Berechne den Spannungsquerschnitt As einer metrischen Schraube aus Nenndurchmesser und Steigung — die Bezugsfläche für jede Festigkeits- und Vorspannrechnung.',
  keywords: [
    'spannungsquerschnitt berechnen',
    'spannungsquerschnitt as formel',
    'as schraube berechnen',
    'tragender querschnitt gewinde',
    'spannungsquerschnitt m8',
    'gewinde querschnittsfläche',
    'as metrisches gewinde',
  ],
  formula: 'As = π/4 · (d − 0,9382 · P)²',
  inputs: [
    { type: 'number', id: 'd', label: 'Nenndurchmesser d', unit: 'mm', default: 8, min: 1, step: 0.5, help: 'Außendurchmesser des Gewindes, z. B. 8 für M8.' },
    { type: 'number', id: 'p', label: 'Steigung P', unit: 'mm', default: 1.25, min: 0.2, step: 0.05, help: 'Regelgewinde M8 = 1,25 mm; Feingewinde z. B. 1,0 mm.' },
  ],
  compute: (v) => {
    const d = num(v.d);
    const P = num(v.p);
    const ds = d - 0.9382 * P; // Spannungsdurchmesser
    const as = (Math.PI / 4) * ds * ds;
    return [
      { label: 'Spannungsdurchmesser ds', value: ds, unit: 'mm', digits: 3 },
      { label: 'Spannungsquerschnitt As', value: as, unit: 'mm²', digits: 1, primary: true },
    ];
  },
  intro:
    'Der Spannungsquerschnitt As ist die maßgebliche tragende Fläche einer Schraube im Gewinde und liegt zwischen Kern- und Flankendurchmesser. Er wird aus einem mittleren Durchmesser gebildet: ds = d − 0,9382 · P, anschließend wird die Kreisfläche π/4 · ds² gebildet. Auf As beziehen sich Streckgrenze und Mindestbruchkraft der Festigkeitsklassen, weshalb jede Vorspann- oder Tragfähigkeitsrechnung mit diesem Wert beginnt.',
  howto: [
    'Nenndurchmesser d der Schraube eintragen (8 für M8).',
    'Steigung P angeben — Regelgewinde oder Feingewinde.',
    'Spannungsdurchmesser ds und Spannungsquerschnitt As ablesen.',
    'As mit der Streckgrenze multiplizieren, um die zulässige Kraft abzuschätzen.',
  ],
  faq: [
    { q: 'Woher kommt der Faktor 0,9382?', a: 'Er ergibt sich aus der Geometrie des ISO-Gewindes als Mittel aus Flankendurchmesser d2 und Kerndurchmesser d3. Die ISO-Norm definiert den Spannungsdurchmesser als d − 0,9382 · P, was diesem Mittelwert sehr genau entspricht.' },
    { q: 'Ist As größer oder kleiner als der Kernquerschnitt?', a: 'As ist etwas größer als der reine Kernquerschnitt, weil reale Schrauben unter Zug mehr tragen, als der dünnste Querschnitt vermuten lässt. Deshalb rechnet man bewusst mit As.' },
    { q: 'Welchen As hat eine M10?', a: 'Mit d = 10 mm und P = 1,5 mm ergibt sich ds = 8,593 mm und As ≈ 58,0 mm². Das deckt sich exakt mit dem Normwert nach DIN 13.' },
    { q: 'Kann ich damit auch Feingewinde rechnen?', a: 'Ja. Die Formel gilt unabhängig davon, ob Regel- oder Feingewinde. Beim Feingewinde ist P kleiner, daher wird ds und damit As größer als beim Regelgewinde gleicher Nenngröße.' },
  ],
  related: ['metrisches-gewinde-tabelle', 'max-vorspannkraft', 'feingewinde-steigung'],
  updated: '2026-06-16',
  examples: [
    { values: { d: 8, p: 1.25 }, expect: [{ label: 'Spannungsquerschnitt As', value: 36.6, tolerance: 0.2 }] },
    { values: { d: 10, p: 1.5 }, expect: [{ label: 'Spannungsquerschnitt As', value: 58.0, tolerance: 0.3 }] },
  ],
};
