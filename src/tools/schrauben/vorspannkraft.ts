import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'vorspannkraft',
  category: 'schrauben',
  title: 'Vorspannkraft-Rechner (Schraube)',
  shortTitle: 'Vorspannkraft',
  description: 'Berechne die Vorspannkraft einer Schraube aus Anzugsmoment, Reibungszahl und Nenndurchmesser nach der Näherungsformel.',
  keywords: ['vorspannkraft berechnen', 'schraube vorspannkraft anzugsmoment', 'vorspannkraft rechner', 'klemmkraft schraube'],
  formula: 'F = M / (K x d)',
  inputs: [
    { type: 'number', id: 'moment', label: 'Anzugsmoment M', unit: 'Nm', default: 24, min: 0, step: 0.5 },
    { type: 'number', id: 'reibung', label: 'Reibungszahl K', default: 0.2, min: 0.01, step: 0.01, help: 'Typisch K = 0,2 für trockene, leicht geölte Stahlschrauben.' },
    { type: 'number', id: 'durchmesser', label: 'Nenndurchmesser d', unit: 'mm', default: 8, min: 0.1, step: 0.5 },
  ],
  compute: (v) => {
    const M = num(v.moment);
    const K = num(v.reibung);
    const d = num(v.durchmesser) / 1000;
    const F = K * d > 0 ? M / (K * d) : 0;
    return [
      { label: 'Vorspannkraft F', value: F, unit: 'N', digits: 0, primary: true },
      { label: 'Vorspannkraft', value: F / 1000, unit: 'kN', digits: 2 },
    ];
  },
  intro: 'Die Vorspannkraft ist die Klemmkraft, mit der eine angezogene Schraube die Bauteile zusammenpresst. Sie lässt sich näherungsweise aus dem Anzugsmoment abschätzen.',
  howto: [
    'Anzugsmoment in Nm eintragen.',
    'Reibungszahl K wählen (Standard 0,2).',
    'Nenndurchmesser der Schraube in mm angeben.',
    'Vorspannkraft in N und kN ablesen.',
  ],
  faq: [
    { q: 'Welche Reibungszahl soll ich nehmen?', a: 'Für geschmierte Schrauben ca. 0,1 bis 0,14, für trockene Stahlschrauben rund 0,2. Die Reibung beeinflusst das Ergebnis stark.' },
    { q: 'Ist das Ergebnis exakt?', a: 'Es ist eine Näherung. Genaue Werte liefern Herstellertabellen, die auch Gewindegeometrie und Kopfreibung getrennt berücksichtigen.' },
  ],
  related: ['schraubenlaenge'],
  updated: '2026-08-27',
  examples: [
    { values: { moment: 24, reibung: 0.2, durchmesser: 8 }, expect: [{ label: 'Vorspannkraft F', value: 15000, tolerance: 1 }] },
    { values: { moment: 10, reibung: 0.2, durchmesser: 6 }, expect: [{ label: 'Vorspannkraft F', value: 8333, tolerance: 1 }] },
  ],
};
