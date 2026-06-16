import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Metrisches ISO-Regelgewinde nach DIN 13-1.
// d = Nenndurchmesser, P = Steigung, d3 = Kerndurchmesser (Bolzen),
// As = Spannungsquerschnitt = pi/4 * ((d2 + d3)/2)^2.
const TABLE: Record<string, { d: number; P: number; d3: number; As: number }> = {
  M3: { d: 3, P: 0.5, d3: 2.387, As: 5.03 },
  M4: { d: 4, P: 0.7, d3: 3.141, As: 8.78 },
  M5: { d: 5, P: 0.8, d3: 4.019, As: 14.2 },
  M6: { d: 6, P: 1.0, d3: 4.773, As: 20.1 },
  M8: { d: 8, P: 1.25, d3: 6.466, As: 36.6 },
  M10: { d: 10, P: 1.5, d3: 8.16, As: 58.0 },
  M12: { d: 12, P: 1.75, d3: 9.853, As: 84.3 },
  M14: { d: 14, P: 2.0, d3: 11.546, As: 115 },
  M16: { d: 16, P: 2.0, d3: 13.546, As: 157 },
};

export const tool: Tool = {
  slug: 'metrisches-gewinde-tabelle',
  category: 'schrauben',
  title: 'Metrische Gewindetabelle (DIN 13) — Kerndurchmesser & Spannungsquerschnitt',
  shortTitle: 'Gewindetabelle',
  description:
    'Schlage Steigung, Kerndurchmesser und Spannungsquerschnitt für metrische Regelgewinde M3 bis M16 nach DIN 13 nach — alle Kennwerte auf einen Blick.',
  keywords: [
    'metrisches gewinde tabelle',
    'kerndurchmesser tabelle',
    'spannungsquerschnitt tabelle',
    'gewinde steigung m8',
    'din 13 gewindetabelle',
    'metrische schraube kennwerte',
    'gewinde nenndurchmesser kerndurchmesser',
  ],
  formula: 'As = π/4 · ((d2 + d3) / 2)²  (Werte nach DIN 13-1)',
  inputs: [
    {
      type: 'select', id: 'gewinde', label: 'Gewinde', default: 'M8',
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
      ],
      help: 'Metrisches ISO-Regelgewinde nach DIN 13-1.',
    },
  ],
  compute: (v) => {
    const key = String(v.gewinde);
    const row = TABLE[key] ?? TABLE.M8;
    return [
      { label: 'Nenndurchmesser d', value: row.d, unit: 'mm', digits: 1 },
      { label: 'Steigung P', value: row.P, unit: 'mm', digits: 2 },
      { label: 'Kerndurchmesser d3', value: row.d3, unit: 'mm', digits: 2 },
      { label: 'Spannungsquerschnitt As', value: row.As, unit: 'mm²', digits: 1, primary: true },
    ];
  },
  intro:
    'Diese Tabelle liefert die wichtigsten Kennwerte des metrischen ISO-Regelgewindes nach DIN 13: die Steigung P (Weg pro Umdrehung), den Kerndurchmesser d3 (kleinster Durchmesser des Bolzengewindes) und den Spannungsquerschnitt As. Der Spannungsquerschnitt ist die maßgebliche Fläche für jede Festigkeitsrechnung, weil sich Streckgrenze und Zugkraft immer auf ihn beziehen. Wer Vorspannkräfte, Tragfähigkeiten oder Kernlöcher auslegt, braucht diese vier Größen als Ausgangsbasis.',
  howto: [
    'Gewindegröße von M3 bis M16 aus der Liste wählen.',
    'Steigung P ablesen, etwa für die Wahl von Mutter oder Gewindeschneider.',
    'Kerndurchmesser d3 für Kernloch- und Querschnittsbetrachtungen nutzen.',
    'Spannungsquerschnitt As in die Festigkeits- oder Vorspannkraftrechnung übernehmen.',
  ],
  faq: [
    { q: 'Was ist der Unterschied zwischen Kerndurchmesser und Spannungsquerschnitt?', a: 'Der Kerndurchmesser d3 ist eine Länge in Millimetern und beschreibt den dünnsten Teil des Gewindes. Der Spannungsquerschnitt As ist eine Fläche in mm² und liegt etwas über dem reinen Kernquerschnitt, weil er aus dem Mittel von Flanken- und Kerndurchmesser gebildet wird.' },
    { q: 'Warum rechnet man mit As statt mit dem Kernquerschnitt?', a: 'Versuche zeigen, dass eine Schraube unter Zug etwas mehr trägt als der reine Kernquerschnitt vermuten lässt. Der genormte Spannungsquerschnitt As bildet dieses reale Verhalten ab und ist deshalb die Bezugsfläche für Festigkeitsklassen.' },
    { q: 'Gelten die Werte auch für Feingewinde?', a: 'Nein. Diese Tabelle gilt für das Regelgewinde nach DIN 13-1. Feingewinde haben dieselben Nenndurchmesser, aber eine kleinere Steigung und damit einen größeren Kerndurchmesser und Spannungsquerschnitt.' },
    { q: 'Wofür brauche ich die Steigung P?', a: 'Die Steigung bestimmt, wie viel Weg die Schraube pro Umdrehung zurücklegt, und ist nötig, um die passende Mutter, den richtigen Gewindeschneider und den Kernlochbohrer (d minus P) auszuwählen.' },
  ],
  related: ['spannungsquerschnitt', 'kernlochbohrer', 'max-vorspannkraft'],
  updated: '2026-06-16',
  examples: [
    { values: { gewinde: 'M8' }, expect: [{ label: 'Spannungsquerschnitt As', value: 36.6, tolerance: 0.1 }] },
    { values: { gewinde: 'M12' }, expect: [{ label: 'Kerndurchmesser d3', value: 9.853, tolerance: 0.01 }] },
  ],
};
