import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'blech-abwicklung',
  category: 'metall',
  title: 'Blech-Abwicklung & K-Faktor',
  shortTitle: 'Blechabwicklung',
  description: 'Berechne die gestreckte Laenge und Biegezugabe beim Blechbiegen aus Schenkellaengen, Biegewinkel, Innenradius, Dicke und K-Faktor.',
  keywords: ['blech abwicklung berechnen', 'biegezugabe rechner', 'k faktor blech biegen', 'gestreckte laenge blech'],
  formula: 'BA = (PI/180) x Winkel x (Innenradius + K x Dicke); gestreckt = Schenkel1 + Schenkel2 + BA',
  inputs: [
    { type: 'number', id: 'schenkel1', label: 'Schenkel 1', unit: 'mm', default: 50, min: 0, step: 1 },
    { type: 'number', id: 'schenkel2', label: 'Schenkel 2', unit: 'mm', default: 50, min: 0, step: 1 },
    { type: 'number', id: 'winkel', label: 'Biegewinkel', unit: 'Grad', default: 90, min: 0, max: 180, step: 1 },
    { type: 'number', id: 'radius', label: 'Innenradius', unit: 'mm', default: 2, min: 0, step: 0.1 },
    { type: 'number', id: 'dicke', label: 'Blechdicke', unit: 'mm', default: 2, min: 0, step: 0.1 },
    { type: 'number', id: 'kfaktor', label: 'K-Faktor', default: 0.4, min: 0, max: 0.5, step: 0.01 },
  ],
  compute: (v) => {
    const s1 = num(v.schenkel1);
    const s2 = num(v.schenkel2);
    const winkel = num(v.winkel);
    const radius = num(v.radius);
    const dicke = num(v.dicke);
    const k = num(v.kfaktor);
    const ba = (Math.PI / 180) * winkel * (radius + k * dicke);
    const gestreckt = s1 + s2 + ba;
    return [
      { label: 'Gestreckte Laenge', value: gestreckt, unit: 'mm', digits: 2, primary: true },
      { label: 'Biegezugabe', value: ba, unit: 'mm', digits: 2 },
    ];
  },
  intro: 'Berechne die Zuschnittlaenge fuer ein gebogenes Blechteil ueber die neutrale Faser und den K-Faktor.',
  howto: [
    'Beide Schenkellaengen in mm eingeben.',
    'Biegewinkel in Grad sowie Innenradius und Blechdicke eintragen.',
    'K-Faktor anpassen (typisch 0,33 bis 0,45 je nach Material und Radius).',
  ],
  faq: [
    { q: 'Was ist der K-Faktor?', a: 'Der K-Faktor gibt die Lage der neutralen Faser an, ublicherweise 0,33 bis 0,45 der Blechdicke.' },
    { q: 'Wie werden Schenkel gemessen?', a: 'Die Schenkellaengen werden bis zur theoretischen Biegekante als Aussenmasse minus Verkuerzung verwendet, hier vereinfacht als Geradenanteil.' },
  ],
  related: ['flachstahl-gewicht'],
  updated: '2026-06-15',
  examples: [
    {
      values: { schenkel1: 50, schenkel2: 50, winkel: 90, radius: 2, dicke: 2, kfaktor: 0.4 },
      expect: [
        { label: 'Biegezugabe', value: 4.398, tolerance: 0.01 },
        { label: 'Gestreckte Laenge', value: 104.398, tolerance: 0.01 },
      ],
    },
  ],
};
