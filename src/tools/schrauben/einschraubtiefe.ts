import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

const FAKTOR: Record<string, number> = {
  stahl: 1.0,
  grauguss: 1.25,
  aluminium: 1.4,
  magnesium: 2.1,
};

export const tool: Tool = {
  slug: 'einschraubtiefe',
  category: 'schrauben',
  title: 'Einschraubtiefe-Rechner (Sacklochgewinde)',
  shortTitle: 'Einschraubtiefe',
  description: 'Berechne die empfohlene Mindest-Einschraubtiefe eines Gewindes je nach Werkstoff aus dem Nenndurchmesser der Schraube.',
  keywords: ['einschraubtiefe berechnen', 'mindesteinschraubtiefe gewinde', 'einschraubtiefe aluminium', 'gewindetiefe sackloch'],
  formula: 'Einschraubtiefe = Faktor (Werkstoff) x Nenndurchmesser d',
  inputs: [
    { type: 'number', id: 'durchmesser', label: 'Nenndurchmesser d', unit: 'mm', default: 8, min: 0.1, step: 0.5 },
    {
      type: 'select', id: 'werkstoff', label: 'Werkstoff (Gewinde)', default: 'aluminium',
      options: [
        { value: 'stahl', label: 'Stahl (x1,0)' },
        { value: 'grauguss', label: 'Grauguss (x1,25)' },
        { value: 'aluminium', label: 'Aluminium (x1,4)' },
        { value: 'magnesium', label: 'Magnesium (x2,1)' },
      ],
      help: 'Weichere Werkstoffe brauchen mehr tragende Gewindegaenge.',
    },
  ],
  compute: (v) => {
    const d = num(v.durchmesser);
    const f = FAKTOR[String(v.werkstoff)] ?? 1.0;
    const tiefe = d * f;
    const bohrtiefe = tiefe + 2 * d;
    return [
      { label: 'Mindest-Einschraubtiefe', value: tiefe, unit: 'mm', digits: 1, primary: true },
      { label: 'Empfohlene Bohrtiefe Sackloch', value: bohrtiefe, unit: 'mm', digits: 1, help: 'Inkl. Auslauf, ca. Einschraubtiefe plus 2 x d.' },
    ];
  },
  intro: 'Damit ein Gewinde im Sackloch nicht ausreisst, muss die Schraube ausreichend tief greifen. Die noetige Tiefe haengt vom Werkstoff des Gewindes ab.',
  howto: [
    'Nenndurchmesser der Schraube eintragen.',
    'Werkstoff des Gegengewindes waehlen.',
    'Mindest-Einschraubtiefe ablesen.',
    'Sackloch entsprechend tiefer bohren (Auslauf einplanen).',
  ],
  faq: [
    { q: 'Warum braucht Aluminium mehr Tiefe als Stahl?', a: 'Weichere Werkstoffe haben eine geringere Festigkeit. Mehr tragende Gewindegaenge verteilen die Last und verhindern das Ausreissen des Gewindes.' },
    { q: 'Wieso ist die Bohrtiefe groesser als die Einschraubtiefe?', a: 'Gewinde- und Bohrerauslauf brauchen Platz. Als Faustregel rechnet man die Einschraubtiefe plus etwa zwei Durchmesser Reserve.' },
  ],
  related: ['kernlochbohrer', 'schraubenlaenge'],
  updated: '2026-06-15',
  examples: [
    { values: { durchmesser: 8, werkstoff: 'aluminium' }, expect: [{ label: 'Mindest-Einschraubtiefe', value: 11.2, tolerance: 0.01 }] },
    { values: { durchmesser: 10, werkstoff: 'stahl' }, expect: [{ label: 'Mindest-Einschraubtiefe', value: 10, tolerance: 0.01 }] },
  ],
};
