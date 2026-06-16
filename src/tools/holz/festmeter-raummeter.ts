import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'festmeter-raummeter',
  category: 'holz',
  title: 'Festmeter-Raummeter-Umrechner (Brennholz)',
  shortTitle: 'Festmeter-Rechner',
  description:
    'Rechne Raummeter (Ster) in Festmeter um – je nach Holzform (Scheitholz geschichtet, Rugelholz oder Schüttraummeter) mit passendem Umrechnungsfaktor.',
  keywords: [
    'raummeter in festmeter',
    'ster festmeter umrechnen',
    'schüttraummeter festmeter',
    'brennholz umrechnen',
    'festmeter berechnen',
  ],
  formula: 'Festmeter = Raummeter · Umrechnungsfaktor',
  inputs: [
    { type: 'number', id: 'raummeter', label: 'Raummeter (Ster)', unit: 'rm', default: 3, min: 0, step: 0.1 },
    {
      type: 'select',
      id: 'faktor',
      label: 'Holzform',
      default: '0.7',
      help: 'Geschichtetes Scheitholz ist dichter gestapelt als loses Schüttholz.',
      options: [
        { value: '0.7', label: 'Scheitholz geschichtet (Faktor 0,70)' },
        { value: '0.65', label: 'Rugelholz / Rundlinge (0,65)' },
        { value: '0.4', label: 'Schüttholz lose (0,40)' },
      ],
    },
  ],
  compute: (v) => {
    const raummeter = num(v.raummeter);
    const faktor = num(v.faktor, 0.7);
    const festmeter = raummeter * faktor;
    return [{ label: 'Festmeter', value: festmeter, unit: 'fm', digits: 2, primary: true }];
  },
  howto: [
    'Raummeter (Ster) deines Brennholzstapels eintragen.',
    'Holzform wählen: geschichtetes Scheitholz, Rugelholz oder lose geschüttetes Holz.',
    'Der Festmeter zeigt die reine Holzmasse ohne Luftzwischenräume.',
  ],
  faq: [
    {
      q: 'Was ist der Unterschied zwischen Raummeter und Festmeter?',
      a: 'Ein Raummeter (Ster) ist gestapeltes Holz inklusive Luftzwischenräumen. Ein Festmeter ist 1 m³ reine Holzmasse ohne Zwischenräume.',
    },
    {
      q: 'Warum hat Schüttholz einen niedrigeren Faktor?',
      a: 'Lose geschüttete Holzscheite liegen kreuz und quer und haben mehr Luft dazwischen. Daher steckt pro Raummeter weniger Festmeter Holz drin.',
    },
  ],
  related: ['holz-volumen-gewicht'],
  updated: '2026-06-15',
  examples: [
    {
      values: { raummeter: 3, faktor: '0.7' },
      expect: [{ label: 'Festmeter', value: 2.1, tolerance: 0.01 }],
    },
    {
      values: { raummeter: 3, faktor: '0.4' },
      expect: [{ label: 'Festmeter', value: 1.2, tolerance: 0.01 }],
    },
  ],
};
