import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schraubenlaenge',
  category: 'schrauben',
  title: 'Schraubenlänge-Rechner (Klemmlänge)',
  shortTitle: 'Schraubenlänge',
  description: 'Berechne die nötige Mindestlänge einer Schraube aus Klemmlänge, Mutterhöhe und gewünschtem Gewindeüberstand.',
  keywords: ['schraubenlaenge berechnen', 'klemmlaenge schraube', 'welche schraubenlaenge', 'gewindeueberstand mutter'],
  formula: 'Mindestlänge = Klemmlänge + Mutterhöhe + Gewindeüberstand',
  inputs: [
    { type: 'number', id: 'klemm', label: 'Klemmlänge', unit: 'mm', default: 20, min: 0, step: 1, help: 'Gesamtdicke der zu verschraubenden Bauteile.' },
    { type: 'number', id: 'mutter', label: 'Mutterhöhe', unit: 'mm', default: 6.5, min: 0, step: 0.5 },
    { type: 'number', id: 'ueberstand', label: 'Gewindeüberstand', unit: 'mm', default: 3, min: 0, step: 0.5, help: 'Empfohlen mindestens 1 bis 2 Gewindegänge.' },
  ],
  compute: (v) => {
    const klemm = num(v.klemm);
    const mutter = num(v.mutter);
    const ueberstand = num(v.ueberstand);
    const laenge = klemm + mutter + ueberstand;
    return [
      { label: 'Mindest-Schraubenlänge', value: laenge, unit: 'mm', digits: 1, primary: true },
    ];
  },
  intro: 'Die Schraube muss alle Bauteile durchdringen, die Mutter komplett aufnehmen und noch etwas überstehen. Daraus ergibt sich die Mindestlänge.',
  howto: [
    'Klemmlänge (Dicke aller Bauteile) eintragen.',
    'Mutterhöhe der verwendeten Mutter angeben.',
    'Gewünschten Gewindeüberstand ergänzen.',
    'Nächstgrößere Normlänge wählen.',
  ],
  faq: [
    { q: 'Wie groß sollte der Überstand sein?', a: 'Es sollten mindestens ein bis zwei volle Gewindegänge überstehen, damit die Mutter sicher gefasst und das Gewinde nicht beschädigt ist.' },
    { q: 'Welche Mutterhöhe nehme ich?', a: 'Standard sind Sechskantmuttern nach DIN 934, z.B. M8 ca. 6,5 mm. Die genaue Höhe steht im Datenblatt der Mutter.' },
  ],
  related: ['vorspannkraft'],
  updated: '2026-08-27',
  examples: [
    { values: { klemm: 20, mutter: 6.5, ueberstand: 3 }, expect: [{ label: 'Mindest-Schraubenlänge', value: 29.5, tolerance: 0.01 }] },
    { values: { klemm: 30, mutter: 8, ueberstand: 2 }, expect: [{ label: 'Mindest-Schraubenlänge', value: 40, tolerance: 0.01 }] },
  ],
};
