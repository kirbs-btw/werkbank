import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Zugfestigkeit Rm nach Festigkeitsklasse (DIN EN ISO 898-1), N/mm².
const RM: Record<string, number> = {
  '4.6': 400,
  '5.6': 500,
  '8.8': 800,
  '10.9': 1000,
  '12.9': 1200,
};

export const tool: Tool = {
  slug: 'scherkraft-schraube',
  category: 'schrauben',
  title: 'Abscherkraft einer Schraube berechnen',
  shortTitle: 'Abscherkraft',
  description:
    'Berechne die Bruch-Scherkraft einer Schraube aus Querschnitt, Festigkeitsklasse und Anzahl der Scherflächen samt zulässiger Querkraft.',
  keywords: [
    'abscherkraft schraube berechnen',
    'scherkraft schraube',
    'schraube querkraft belastbarkeit',
    'scherfestigkeit schraube',
    'tragkraft schraube scheren',
    'schraube auf abscheren',
    'scherflächen schraube',
  ],
  formula: 'F_ab = n · τ_B · A,  τ_B ≈ 0,6 · Rm',
  inputs: [
    { type: 'number', id: 'a', label: 'Scherquerschnitt A', unit: 'mm²', default: 36.6, min: 1, step: 0.1, help: 'Schaft- oder Spannungsquerschnitt der Schraube, z. B. 36,6 mm² für M8.' },
    {
      type: 'select', id: 'klasse', label: 'Festigkeitsklasse', default: '8.8',
      options: [
        { value: '4.6', label: '4.6 (Rm = 400 N/mm²)' },
        { value: '5.6', label: '5.6 (Rm = 500 N/mm²)' },
        { value: '8.8', label: '8.8 (Rm = 800 N/mm²)' },
        { value: '10.9', label: '10.9 (Rm = 1000 N/mm²)' },
        { value: '12.9', label: '12.9 (Rm = 1200 N/mm²)' },
      ],
      help: 'Zugfestigkeit Rm nach DIN EN ISO 898-1.',
    },
    { type: 'number', id: 'n', label: 'Anzahl Scherflächen', default: 1, min: 1, max: 4, step: 1, help: 'Einschnittig = 1, zweischnittig = 2.' },
    { type: 'number', id: 'sf', label: 'Sicherheitsfaktor', default: 2, min: 1, step: 0.25, help: 'Verhältnis Bruchkraft zu zulässiger Querkraft, typ. 1,5–3.' },
  ],
  compute: (v) => {
    const a = num(v.a);
    const rm = RM[String(v.klasse)] ?? RM['8.8'];
    const n = Math.max(1, num(v.n, 1));
    const sf = num(v.sf, 2);
    const tauB = 0.6 * rm; // Scherfestigkeit ~ 0,6 der Zugfestigkeit
    const fab = n * tauB * a; // N
    const fzul = sf > 0 ? fab / sf : 0;
    return [
      { label: 'Scherfestigkeit τ_B', value: tauB, unit: 'N/mm²', digits: 0 },
      { label: 'Bruch-Scherkraft F_ab', value: fab, unit: 'N', digits: 0, primary: true },
      { label: 'Bruch-Scherkraft', value: fab / 1000, unit: 'kN', digits: 1 },
      { label: 'Zulässige Querkraft', value: fzul, unit: 'N', digits: 0, help: 'Bruchkraft geteilt durch Sicherheitsfaktor.' },
    ];
  },
  intro:
    'Wird eine Schraube quer zu ihrer Achse belastet, etwa als Bolzen in einer Lasche, wirkt eine Scherbeanspruchung. Die Bruch-Scherkraft ergibt sich aus dem Scherquerschnitt, der Scherfestigkeit (rund 0,6 der Zugfestigkeit Rm) und der Anzahl der Scherflächen. Bei einschnittiger Verbindung trägt eine Fläche, bei zweischnittiger zwei. Mit einem Sicherheitsfaktor wird daraus die zulässige Querkraft für die Auslegung.',
  howto: [
    'Scherquerschnitt eintragen — Schaftquerschnitt bei tragendem Schaft, sonst Spannungsquerschnitt As.',
    'Festigkeitsklasse wählen; die Zugfestigkeit Rm wird automatisch gesetzt.',
    'Anzahl der Scherflächen angeben (einschnittig = 1, zweischnittig = 2).',
    'Sicherheitsfaktor festlegen und die zulässige Querkraft ablesen.',
  ],
  faq: [
    { q: 'Warum 0,6 mal die Zugfestigkeit?', a: 'Die Scherfestigkeit metallischer Werkstoffe liegt erfahrungsgemäß bei etwa 60 Prozent der Zugfestigkeit. Für Schraubenstahl ist τ_B ≈ 0,6 · Rm eine etablierte Näherung; Normen wie EN 1993-1-8 nutzen ähnliche Faktoren.' },
    { q: 'Welcher Querschnitt zählt beim Abscheren?', a: 'Liegt die Scherfuge im glatten Schaft, rechnet man mit dem Schaftquerschnitt. Liegt sie im Gewinde, ist der Spannungsquerschnitt As maßgebend, weil dort weniger Material trägt.' },
    { q: 'Was bedeutet zweischnittig?', a: 'Bei zweischnittiger Verbindung wird die Schraube an zwei Stellen geschert, etwa zwischen drei Laschen. Sie trägt dann die doppelte Querkraft wie bei einschnittiger Lage.' },
    { q: 'Darf ich Schrauben überhaupt auf Abscheren belasten?', a: 'Vorgespannte Schraubverbindungen übertragen Querkräfte idealerweise durch Reibschluss, nicht durch Abscheren. Reine Scherbelastung ist Passschrauben oder Bolzen vorbehalten; sonst großzügig dimensionieren.' },
  ],
  related: ['spannungsquerschnitt', 'anzahl-schrauben-last', 'max-vorspannkraft'],
  updated: '2026-06-16',
  examples: [
    { values: { a: 36.6, klasse: '8.8', n: 1, sf: 2 }, expect: [{ label: 'Bruch-Scherkraft F_ab', value: 17568, tolerance: 5 }] },
    { values: { a: 58, klasse: '10.9', n: 2, sf: 2.5 }, expect: [{ label: 'Zulässige Querkraft', value: 27840, tolerance: 5 }] },
  ],
};
