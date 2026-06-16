import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schraubenlaenge',
  category: 'schrauben',
  title: 'Schraubenlaenge-Rechner (Klemmlaenge)',
  shortTitle: 'Schraubenlaenge',
  description: 'Berechne die noetige Mindestlaenge einer Schraube aus Klemmlaenge, Mutterhoehe und gewuenschtem Gewindeueberstand.',
  keywords: ['schraubenlaenge berechnen', 'klemmlaenge schraube', 'welche schraubenlaenge', 'gewindeueberstand mutter'],
  formula: 'Mindestlaenge = Klemmlaenge + Mutterhoehe + Gewindeueberstand',
  inputs: [
    { type: 'number', id: 'klemm', label: 'Klemmlaenge', unit: 'mm', default: 20, min: 0, step: 1, help: 'Gesamtdicke der zu verschraubenden Bauteile.' },
    { type: 'number', id: 'mutter', label: 'Mutterhoehe', unit: 'mm', default: 6.5, min: 0, step: 0.5 },
    { type: 'number', id: 'ueberstand', label: 'Gewindeueberstand', unit: 'mm', default: 3, min: 0, step: 0.5, help: 'Empfohlen mindestens 1 bis 2 Gewindegaenge.' },
  ],
  compute: (v) => {
    const klemm = num(v.klemm);
    const mutter = num(v.mutter);
    const ueberstand = num(v.ueberstand);
    const laenge = klemm + mutter + ueberstand;
    return [
      { label: 'Mindest-Schraubenlaenge', value: laenge, unit: 'mm', digits: 1, primary: true },
    ];
  },
  intro: 'Die Schraube muss alle Bauteile durchdringen, die Mutter komplett aufnehmen und noch etwas ueberstehen. Daraus ergibt sich die Mindestlaenge.',
  howto: [
    'Klemmlaenge (Dicke aller Bauteile) eintragen.',
    'Mutterhoehe der verwendeten Mutter angeben.',
    'Gewuenschten Gewindeueberstand ergaenzen.',
    'Naechstgroessere Normlaenge waehlen.',
  ],
  faq: [
    { q: 'Wie gross sollte der Ueberstand sein?', a: 'Es sollten mindestens ein bis zwei volle Gewindegaenge ueberstehen, damit die Mutter sicher gefasst und das Gewinde nicht beschaedigt ist.' },
    { q: 'Welche Mutterhoehe nehme ich?', a: 'Standard sind Sechskantmuttern nach DIN 934, z.B. M8 ca. 6,5 mm. Die genaue Hoehe steht im Datenblatt der Mutter.' },
  ],
  related: ['vorspannkraft'],
  updated: '2026-06-15',
  examples: [
    { values: { klemm: 20, mutter: 6.5, ueberstand: 3 }, expect: [{ label: 'Mindest-Schraubenlaenge', value: 29.5, tolerance: 0.01 }] },
    { values: { klemm: 30, mutter: 8, ueberstand: 2 }, expect: [{ label: 'Mindest-Schraubenlaenge', value: 40, tolerance: 0.01 }] },
  ],
};
