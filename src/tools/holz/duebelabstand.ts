import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'duebelabstand',
  category: 'holz',
  title: 'Dübelabstand & Dübelanzahl berechnen',
  shortTitle: 'Dübelabstand',
  description:
    'Berechne Anzahl und gleichmäßigen Abstand von Holzdübeln entlang einer Kante – mit frei wählbarem Randabstand für saubere Plattenverbindungen.',
  keywords: [
    'dübelabstand berechnen',
    'holzdübel abstand rechner',
    'dübelanzahl kante',
    'dübel gleichmäßig verteilen',
    'randabstand dübel',
    'lochreihe abstand',
    'dübelverbindung planen',
  ],
  formula:
    'Anzahl ≈ runden( (Länge − 2·Randabstand) / Zielabstand ) + 1 · Abstand = (Länge − 2·Randabstand) / (Anzahl − 1)',
  inputs: [
    { type: 'number', id: 'laenge', label: 'Kantenlänge', unit: 'mm', default: 800, min: 0, step: 1 },
    { type: 'number', id: 'randabstand', label: 'Randabstand', unit: 'mm', default: 50, min: 0, step: 1, help: 'Abstand des ersten/letzten Dübels zur Kante.' },
    { type: 'number', id: 'zielabstand', label: 'Gewünschter Dübelabstand', unit: 'mm', default: 160, min: 1, step: 1, help: 'Richtwert: alle 150–250 mm ein Dübel.' },
  ],
  compute: (v) => {
    const laenge = num(v.laenge);
    const rand = num(v.randabstand);
    const ziel = num(v.zielabstand, 160);

    const nutzlaenge = Math.max(0, laenge - 2 * rand);
    let anzahl = ziel > 0 ? Math.round(nutzlaenge / ziel) + 1 : 1;
    if (anzahl < 2) anzahl = 2;

    const abstand = anzahl > 1 ? nutzlaenge / (anzahl - 1) : 0;

    return [
      { label: 'Anzahl Dübel', value: anzahl, unit: 'Stück', digits: 0, primary: true },
      { label: 'Tatsächlicher Abstand', value: abstand, unit: 'mm', digits: 1 },
      { label: 'Nutzlänge (zwischen Randdübeln)', value: nutzlaenge, unit: 'mm', digits: 0 },
      { label: 'Anzahl Zwischenräume', value: Math.max(0, anzahl - 1), unit: 'Stück', digits: 0 },
    ];
  },
  intro:
    'Holzdübel verbinden Platten, Korpusseiten und Rahmen passgenau und unsichtbar – vorausgesetzt, die Bohrungen sitzen exakt und gleichmäßig. Dieser Rechner verteilt eine sinnvolle Anzahl Dübel symmetrisch über die Kantenlänge: Du gibst Länge, Randabstand und den gewünschten Dübelabstand vor, der Rechner rundet auf eine ganze Dübelzahl und liefert den exakten, gleichmäßigen Ist-Abstand für die Bohrlehre. So vermeidest du krumme Reihen und ein verschobenes Schlussmaß.',
  howto: [
    'Länge der zu verdübelnden Kante in Millimeter eintragen.',
    'Randabstand wählen – der erste und letzte Dübel sollten nicht zu nah an der Ecke sitzen.',
    'Gewünschten Dübelabstand als Richtwert angeben (oft 150–250 mm).',
    'Mit dem ausgegebenen Ist-Abstand die Bohrlehre oder Lochreihe anzeichnen.',
  ],
  faq: [
    {
      q: 'Welcher Dübelabstand ist üblich?',
      a: 'Im Möbelbau liegen Dübel oft alle 150–250 mm. Bei stark belasteten oder breiten Verbindungen enger, bei reinen Positionierhilfen darf der Abstand größer sein.',
    },
    {
      q: 'Wie groß sollte der Randabstand sein?',
      a: 'Mindestens das Zwei- bis Dreifache des Dübeldurchmessers, damit das Holz an der Ecke nicht ausbricht. Bei 8-mm-Dübeln also rund 20–30 mm, häufig werden 30–50 mm gewählt.',
    },
    {
      q: 'Warum rundet der Rechner die Anzahl?',
      a: 'Dübel gibt es nur ganz. Der Rechner wählt die nächste ganze Zahl und verteilt sie wieder exakt gleichmäßig, sodass der Ist-Abstand leicht vom Zielwert abweichen kann.',
    },
    {
      q: 'Passt das auch für Lamello/Flachdübel?',
      a: 'Die Verteilung gilt analog für Flachdübel (Lamellos) oder eine 32-mm-Lochreihe. Beachte nur die jeweils empfohlenen Mindest- und Randabstände des Verbinders.',
    },
  ],
  related: ['leimholz-bretter', 'zuschnitt-laenge', 'schrauben-terrassendielen'],
  updated: '2026-06-16',
  examples: [
    {
      values: { laenge: 800, randabstand: 50, zielabstand: 160 },
      expect: [
        { label: 'Anzahl Dübel', value: 5, tolerance: 0 },
        { label: 'Tatsächlicher Abstand', value: 175, tolerance: 0.1 },
      ],
    },
    {
      values: { laenge: 600, randabstand: 50, zielabstand: 250 },
      expect: [
        { label: 'Anzahl Dübel', value: 3, tolerance: 0 },
        { label: 'Tatsächlicher Abstand', value: 250, tolerance: 0.1 },
      ],
    },
  ],
};
