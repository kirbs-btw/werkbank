import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'randabstand-schraube',
  category: 'schrauben',
  title: 'Rand- und Lochabstände für Schrauben (EN 1993-1-8)',
  shortTitle: 'Randabstand',
  description:
    'Berechne Mindest-Rand- und Lochabstände für Schraubverbindungen im Stahlbau aus dem Lochdurchmesser nach EN 1993-1-8, inkl. Praxiswert.',
  keywords: [
    'randabstand schraube stahlbau',
    'lochabstand schrauben berechnen',
    'mindestrandabstand din en 1993',
    'eurocode 3 lochabstand',
    'schraubenabstand tabelle',
    'e1 e2 p1 p2 schrauben',
    'bohrungsabstand stahlbau',
  ],
  formula: 'e1,min = 1,2·d0 · e2,min = 1,2·d0 · p1,min = 2,2·d0 · p2,min = 2,4·d0',
  inputs: [
    { type: 'number', id: 'd0', label: 'Lochdurchmesser d0', unit: 'mm', default: 9, min: 1, step: 0.5, help: 'Bohrungsdurchmesser, z. B. 9 mm für M8 im Stahlbau.' },
  ],
  compute: (v) => {
    const d0 = num(v.d0);
    return [
      { label: 'Mindest-Randabstand e1', value: 1.2 * d0, unit: 'mm', digits: 1, primary: true, help: 'In Kraftrichtung zum Rand.' },
      { label: 'Mindest-Randabstand e2', value: 1.2 * d0, unit: 'mm', digits: 1, help: 'Quer zur Kraftrichtung zum Rand.' },
      { label: 'Mindest-Lochabstand p1', value: 2.2 * d0, unit: 'mm', digits: 1, help: 'In Kraftrichtung zwischen Löchern.' },
      { label: 'Mindest-Lochabstand p2', value: 2.4 * d0, unit: 'mm', digits: 1, help: 'Quer zur Kraftrichtung zwischen Löchern.' },
      { label: 'Empf. Lochabstand (3·d0)', value: 3 * d0, unit: 'mm', digits: 1, help: 'Gängiger Praxiswert für volle Lochleibung.' },
    ];
  },
  intro:
    'Im Stahlbau müssen Schraubenlöcher genügend Abstand zum Bauteilrand und untereinander haben, damit der Werkstoff zwischen Loch und Rand nicht ausreißt und die volle Lochleibungstragfähigkeit erreicht wird. EN 1993-1-8 (Eurocode 3) legt die Mindestwerte als Vielfache des Lochdurchmessers d0 fest: Randabstände ab 1,2·d0, Lochabstände in Kraftrichtung ab 2,2·d0 und quer dazu ab 2,4·d0. In der Praxis wählt man oft 3·d0, um die volle Tragfähigkeit auszuschöpfen.',
  howto: [
    'Lochdurchmesser d0 eintragen — meist Schraubennenndurchmesser plus 1 bis 2 mm Lochspiel.',
    'Mindest-Randabstände e1 und e2 ablesen und einhalten.',
    'Mindest-Lochabstände p1 und p2 zwischen den Schrauben prüfen.',
    'Für volle Lochleibung den empfohlenen Abstand von 3·d0 anstreben.',
  ],
  faq: [
    { q: 'Was ist d0 genau?', a: 'd0 ist der Lochdurchmesser, nicht der Schraubendurchmesser. Im Stahlbau wird das Loch je nach Schraubengröße 1 bis 2 mm größer gebohrt, eine M8 erhält also typisch ein 9-mm-Loch.' },
    { q: 'Worin unterscheiden sich e1 und p1?', a: 'e ist der Abstand zum freien Rand, p der Abstand zwischen zwei Löchern. Der Index 1 steht für die Richtung der Kraft, der Index 2 für die Querrichtung dazu.' },
    { q: 'Warum nicht einfach minimal bauen?', a: 'Die Mindestwerte verhindern nur das Versagen. Für die volle Lochleibungstragfähigkeit nach Eurocode braucht es größere Abstände, weshalb 3·d0 ein verbreiteter Praxiswert ist.' },
    { q: 'Gibt es auch Höchstabstände?', a: 'Ja. EN 1993-1-8 begrenzt die Abstände nach oben, damit sich Bleche zwischen den Schrauben nicht aufwölben oder korrodieren. Maßgeblich sind dort Vielfache der Blechdicke und feste Obergrenzen.' },
    { q: 'Gilt das auch für Aluminium?', a: 'Sinngemäß ja, jedoch regelt EN 1999 (Eurocode 9) Aluminiumkonstruktionen mit eigenen, teils abweichenden Faktoren. Dieser Rechner bezieht sich auf den Stahlbau nach EN 1993-1-8.' },
  ],
  related: ['durchgangsloch', 'scherkraft-schraube', 'anzahl-schrauben-last'],
  updated: '2026-06-16',
  examples: [
    { values: { d0: 9 }, expect: [{ label: 'Mindest-Randabstand e1', value: 10.8, tolerance: 0.01 }] },
    { values: { d0: 13 }, expect: [{ label: 'Mindest-Lochabstand p1', value: 28.6, tolerance: 0.01 }] },
  ],
};
