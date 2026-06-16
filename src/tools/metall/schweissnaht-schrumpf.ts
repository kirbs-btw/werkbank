import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schweissnaht-schrumpf',
  category: 'metall',
  title: 'Schweißnaht-Schrumpf-Rechner',
  shortTitle: 'Schweißschrumpf',
  description: 'Schätze Quer- und Längsschrumpf einer Schweißnaht aus Nahtquerschnitt, Blechdicke und Nahtlänge, um Verzug und Zugabe beim Schweißen einzuplanen.',
  keywords: ['schweißnaht schrumpf berechnen', 'schweißverzug rechner', 'querschrumpfung naht', 'längsschrumpfung schweißen', 'schrumpfmaß schweißnaht', 'verzug ausgleichen schweißen', 'schweißzugabe planen', 'naht schrumpf formel'],
  formula: 'Querschrumpf ≈ 0,2 · A_Naht / s ;  Längsschrumpf ≈ Rate · (L/1000)  (A in mm², s in mm, L in mm)',
  inputs: [
    { type: 'number', id: 'querschnitt', label: 'Nahtquerschnitt A', unit: 'mm²', default: 25, min: 0, step: 1, help: 'Querschnitt des eingebrachten Schweißguts' },
    { type: 'number', id: 'dicke', label: 'Blechdicke', unit: 'mm', default: 6, min: 0.1, step: 0.5, help: 'Dicke der gefügten Bleche' },
    { type: 'number', id: 'laenge', label: 'Nahtlänge', unit: 'mm', default: 1000, min: 0, step: 10 },
    {
      type: 'select', id: 'rate', label: 'Längsschrumpf-Rate', default: '1.0',
      options: [
        { value: '0.5', label: 'gering (kurze/dicke Naht)' },
        { value: '1.0', label: 'mittel (Standard)' },
        { value: '1.5', label: 'hoch (dünn, viele Lagen)' },
      ],
    },
  ],
  compute: (v) => {
    const A = num(v.querschnitt);
    const s = num(v.dicke, 0.1);
    const L = num(v.laenge);
    const rate = num(v.rate, 1.0);
    const querschrumpf = s > 0 ? 0.2 * (A / s) : 0;
    const laengsschrumpf = rate * (L / 1000);
    const gesamtzugabe = querschrumpf + laengsschrumpf;
    return [
      { label: 'Querschrumpf', value: querschrumpf, unit: 'mm', digits: 2, primary: true },
      { label: 'Längsschrumpf', value: laengsschrumpf, unit: 'mm', digits: 2 },
      { label: 'Gesamt-Schrumpfzugabe', value: gesamtzugabe, unit: 'mm', digits: 2 },
    ];
  },
  intro: 'Beim Schweißen zieht sich das erstarrende Schweißgut zusammen und verkürzt das Bauteil — quer zur Naht meist stärker als längs. Dieser Rechner schätzt die Querschrumpfung nach der bewährten Näherung 0,2·A/s (Nahtquerschnitt durch Blechdicke) und die Längsschrumpfung über eine Rate je Meter Naht. So kannst du vor dem Schweißen Zugaben einplanen oder die Teile gezielt vorspannen, damit das Endmaß nach dem Abkühlen stimmt.',
  howto: [
    'Nahtquerschnitt A in mm² eintragen — also die Fläche des eingebrachten Schweißguts (z. B. aus Nahtdicke und Öffnungswinkel).',
    'Blechdicke s der gefügten Teile in mm angeben.',
    'Nahtlänge in mm eingeben.',
    'Längsschrumpf-Rate nach Bauteil wählen und die gesamte Schrumpfzugabe als Vorhalt einplanen.',
  ],
  faq: [
    { q: 'Warum ist der Querschrumpf meist größer als der Längsschrumpf?', a: 'Quer zur Naht kann sich das Material frei zusammenziehen, während es in Längsrichtung durch das kalte Grundmaterial gehalten wird. Deshalb fällt die Querschrumpfung pro Naht spürbar größer aus.' },
    { q: 'Wie genau ist die Schätzung?', a: 'Es sind Erfahrungswerte. Reale Schrumpfung hängt von Wärmeeinbringung, Lagenzahl, Einspannung und Werkstoff ab. Plane einen Sicherheitszuschlag ein und prüfe an einem Probestück.' },
    { q: 'Wie reduziere ich den Schweißverzug?', a: 'Weniger Wärme einbringen, im Pilgerschritt oder symmetrisch schweißen, heften, gegenspannen und die Nahtquerschnitte klein halten. Vorwärmen kann Eigenspannungen senken.' },
    { q: 'Was zählt als Nahtquerschnitt A?', a: 'Die Fläche des aufgeschmolzenen Zusatzwerkstoffs im Schliffbild — bei einer V-Naht etwa das Dreieck aus Öffnungswinkel und Blechdicke plus Nahtüberhöhung.' },
    { q: 'Gilt das auch für Kehlnähte?', a: 'Näherungsweise. Kehlnähte erzeugen vor allem Winkelverzug; die hier gerechnete Querschrumpfung ist ein grober Anhalt. Für Winkelverzug zusätzlich gegenspannen oder einbrennen.' },
  ],
  related: ['schweissdraht-bedarf', 'blech-abwicklung', 'flachstahl-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { querschnitt: 25, dicke: 6, laenge: 1000, rate: '1.0' },
      expect: [{ label: 'Querschrumpf', value: 0.83, tolerance: 0.02 }],
    },
    {
      values: { querschnitt: 40, dicke: 8, laenge: 2000, rate: '1.5' },
      expect: [{ label: 'Gesamt-Schrumpfzugabe', value: 4.0, tolerance: 0.05 }],
    },
  ],
};
