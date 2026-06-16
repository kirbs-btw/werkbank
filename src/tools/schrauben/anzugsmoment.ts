import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'anzugsmoment',
  category: 'schrauben',
  title: 'Anzugsmoment-Rechner für Schrauben',
  shortTitle: 'Anzugsmoment',
  description:
    'Berechne das Anzugsdrehmoment einer Schraube aus Reibungszahl, Gewinde-Nenndurchmesser und gewünschter Vorspannkraft.',
  keywords: [
    'anzugsmoment rechner',
    'drehmoment schrauben berechnen',
    'anzugsdrehmoment',
    'schrauben drehmoment',
  ],
  formula: 'M = K · F · d',
  inputs: [
    {
      type: 'number', id: 'k', label: 'Reibungszahl K', default: 0.2, min: 0.05, max: 0.5, step: 0.01,
      help: 'trocken ≈ 0,20 · leicht geölt ≈ 0,14',
    },
    { type: 'number', id: 'd', label: 'Gewinde-Nenndurchmesser d', unit: 'mm', default: 8, min: 1, step: 1 },
    { type: 'number', id: 'f', label: 'Vorspannkraft F', unit: 'N', default: 15000, min: 0, step: 500 },
  ],
  compute: (v) => {
    const k = num(v.k, 0.2);
    const d = num(v.d);
    const f = num(v.f);
    const m = k * f * (d / 1000); // Nm
    return [{ label: 'Anzugsmoment', value: m, unit: 'Nm', digits: 1, primary: true }];
  },
  faq: [
    {
      q: 'Was bedeutet die Reibungszahl K?',
      a: 'K (Anziehfaktor) fasst Gewinde- und Kopfreibung zusammen. Trocken ca. 0,20, leicht geölt ca. 0,14 – weniger Reibung bedeutet weniger Drehmoment für dieselbe Vorspannkraft.',
    },
  ],
  updated: '2026-06-15',
  examples: [
    {
      values: { k: 0.2, d: 8, f: 15000 },
      expect: [{ label: 'Anzugsmoment', value: 24, tolerance: 0.1 }],
    },
  ],
};
