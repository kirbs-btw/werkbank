import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'holzfeuchte-darrprobe',
  category: 'holz',
  title: 'Holzfeuchte-Rechner (Darrprobe)',
  shortTitle: 'Holzfeuchte',
  description:
    'Berechne die Holzfeuchte per Darrprobe aus Feuchtmasse und Darrmasse – mit Bewertung, ob das Brennholz mit unter 20 % ofenfertig ist.',
  keywords: [
    'holzfeuchte berechnen',
    'darrprobe holz',
    'brennholz feuchtigkeit messen',
    'holzfeuchte formel',
    'restfeuchte holz',
  ],
  formula:
    'Holzfeuchte u = (Feuchtmasse − Darrmasse) / Darrmasse · 100 · Wassergehalt = (Feuchtmasse − Darrmasse) / Feuchtmasse · 100',
  inputs: [
    { type: 'number', id: 'feucht', label: 'Masse feucht (vor Trocknung)', unit: 'g', default: 120, min: 0, step: 1 },
    { type: 'number', id: 'darr', label: 'Masse darrtrocken (nach Trocknung)', unit: 'g', default: 100, min: 0.1, step: 1, help: 'Gewicht nach vollständiger Trocknung bei 103 °C.' },
  ],
  compute: (v) => {
    const feucht = num(v.feucht);
    const darr = num(v.darr, 0.1);
    const wasser = Math.max(0, feucht - darr);
    const holzfeuchte = (wasser / darr) * 100;
    const wassergehalt = feucht > 0 ? (wasser / feucht) * 100 : 0;
    return [
      {
        label: 'Holzfeuchte (u)',
        value: holzfeuchte,
        unit: '%',
        digits: 1,
        primary: true,
        help: 'Brennholz gilt ab unter 20 % als ofentrocken und verbrennt sauber.',
      },
      { label: 'Wassergehalt', value: wassergehalt, unit: '%', digits: 1 },
    ];
  },
  howto: [
    'Probe wiegen und Feuchtmasse notieren.',
    'Probe bei ca. 103 °C trocknen, bis das Gewicht konstant bleibt (darrtrocken).',
    'Darrmasse wiegen und eintragen.',
    'Liegt die Holzfeuchte unter 20 %, ist das Brennholz verbrennungsfertig.',
  ],
  faq: [
    {
      q: 'Was ist der Unterschied zwischen Holzfeuchte und Wassergehalt?',
      a: 'Holzfeuchte (u) bezieht das Wasser auf die Darrmasse, Wassergehalt auf die Feuchtmasse. Bei Brennholz ist meist die Holzfeuchte u gemeint.',
    },
    {
      q: 'Wie trocken muss Brennholz sein?',
      a: 'Für die saubere Verbrennung schreibt die Praxis maximal 20 % Holzfeuchte vor. Optimal sind 15–18 %.',
    },
  ],
  related: ['festmeter-raummeter', 'holz-volumen-gewicht'],
  updated: '2026-06-15',
  examples: [
    {
      values: { feucht: 120, darr: 100 },
      expect: [
        { label: 'Holzfeuchte (u)', value: 20, tolerance: 0.05 },
        { label: 'Wassergehalt', value: 16.67, tolerance: 0.05 },
      ],
    },
  ],
};
