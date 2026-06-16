import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Streckgrenze Rp0,2 nach Festigkeitsklasse (DIN EN ISO 898-1), N/mm².
const RP: Record<string, number> = {
  '4.6': 240,
  '5.6': 300,
  '8.8': 640,
  '10.9': 900,
  '12.9': 1080,
};

export const tool: Tool = {
  slug: 'max-vorspannkraft',
  category: 'schrauben',
  title: 'Maximale Vorspannkraft aus Streckgrenze (Fmax)',
  shortTitle: 'Max. Vorspannkraft',
  description:
    'Berechne die maximal zulässige Montagevorspannkraft Fmax einer Schraube aus Spannungsquerschnitt und Streckgrenze der Festigkeitsklasse: Fmax = As · Rp0,2 · 0,9.',
  keywords: [
    'maximale vorspannkraft berechnen',
    'fmax schraube',
    'vorspannkraft streckgrenze',
    'zulässige vorspannkraft 8.8',
    'montagevorspannkraft',
    'schraube belastbarkeit kn',
    'fv max festigkeitsklasse',
  ],
  formula: 'Fmax = As · Rp0,2 · 0,9',
  inputs: [
    { type: 'number', id: 'as', label: 'Spannungsquerschnitt As', unit: 'mm²', default: 36.6, min: 1, step: 0.1, help: 'z. B. 36,6 für M8 (siehe Gewindetabelle).' },
    {
      type: 'select', id: 'klasse', label: 'Festigkeitsklasse', default: '8.8',
      options: [
        { value: '4.6', label: '4.6 (Rp0,2 = 240 N/mm²)' },
        { value: '5.6', label: '5.6 (Rp0,2 = 300 N/mm²)' },
        { value: '8.8', label: '8.8 (Rp0,2 = 640 N/mm²)' },
        { value: '10.9', label: '10.9 (Rp0,2 = 900 N/mm²)' },
        { value: '12.9', label: '12.9 (Rp0,2 = 1080 N/mm²)' },
      ],
      help: 'Streckgrenze nach DIN EN ISO 898-1.',
    },
  ],
  compute: (v) => {
    const as = num(v.as);
    const rp = RP[String(v.klasse)] ?? RP['8.8'];
    const fmax = as * rp * 0.9; // N, Ausnutzung 90 % der Streckgrenze
    return [
      { label: 'Streckgrenze Rp0,2', value: rp, unit: 'N/mm²', digits: 0 },
      { label: 'Max. Vorspannkraft Fmax', value: fmax, unit: 'N', digits: 0, primary: true },
      { label: 'Max. Vorspannkraft', value: fmax / 1000, unit: 'kN', digits: 1 },
    ];
  },
  intro:
    'Beim Anziehen darf eine Schraube nur bis knapp unter ihre Streckgrenze belastet werden, sonst dehnt sie sich plastisch und verliert Vorspannung. Die zulässige Montagevorspannkraft ergibt sich aus dem Spannungsquerschnitt As, der Streckgrenze Rp0,2 der Festigkeitsklasse und einem Ausnutzungsfaktor von rund 0,9. Der Rechner zeigt damit, wie stark eine Schraube einer bestimmten Klasse maximal vorgespannt werden darf, bevor sie überlastet wird.',
  howto: [
    'Spannungsquerschnitt As der Schraube eintragen (aus der Gewindetabelle).',
    'Festigkeitsklasse wählen — die Streckgrenze Rp0,2 wird automatisch gesetzt.',
    'Maximale Vorspannkraft Fmax in N und kN ablesen.',
    'Reale Montagevorspannung mit Sicherheitsabstand darunter wählen.',
  ],
  faq: [
    { q: 'Warum nur 90 Prozent der Streckgrenze?', a: 'Beim Anziehen wirkt neben der Zugspannung auch eine Torsionsspannung aus der Gewindereibung. Mit dem Faktor 0,9 wird die Streckgrenze nicht voll ausgenutzt, sodass die Schraube im elastischen Bereich bleibt.' },
    { q: 'Was bedeutet Rp0,2?', a: 'Rp0,2 ist die 0,2-Prozent-Dehngrenze, also die Spannung, bei der eine bleibende Dehnung von 0,2 Prozent zurückbleibt. Sie ersetzt bei Schraubenstählen die nicht klar ausgeprägte Streckgrenze.' },
    { q: 'Wie hängt Fmax mit dem Anzugsmoment zusammen?', a: 'Fmax ist die Zielgröße, das Anzugsmoment der Weg dorthin. Über M = K · F · d kann man aus der gewünschten Vorspannkraft das Drehmoment ableiten — dafür gibt es einen eigenen Rechner.' },
    { q: 'Welche Klasse ist Standard?', a: 'Im Maschinen- und Stahlbau ist 8.8 der gängige Standard, hochfeste Verbindungen nutzen 10.9 oder 12.9. Klasse 12.9 erreicht bei gleichem Querschnitt fast die doppelte Vorspannkraft von 8.8.' },
  ],
  related: ['spannungsquerschnitt', 'metrisches-gewinde-tabelle', 'anzugsmoment'],
  updated: '2026-06-16',
  examples: [
    { values: { as: 36.6, klasse: '8.8' }, expect: [{ label: 'Max. Vorspannkraft Fmax', value: 21082, tolerance: 5 }] },
    { values: { as: 58.0, klasse: '10.9' }, expect: [{ label: 'Max. Vorspannkraft Fmax', value: 46980, tolerance: 5 }] },
  ],
};
