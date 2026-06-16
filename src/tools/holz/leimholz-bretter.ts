import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'leimholz-bretter',
  category: 'holz',
  title: 'Leimholzplatte-Bretter-Rechner',
  shortTitle: 'Leimholz-Bretter',
  description:
    'Berechne, wie viele Bretter du für eine Leimholzplatte verleimen musst und welche Plattenbreite sich daraus ergibt – inklusive Überstand zum Besäumen.',
  keywords: [
    'leimholz berechnen',
    'bretter verleimen anzahl',
    'leimholzplatte selber machen',
    'tischplatte bretter berechnen',
    'breite verleimen holz',
  ],
  formula:
    'Anzahl = aufrunden(Plattenbreite / Brettbreite) · Tatsächliche Breite = Anzahl · Brettbreite · Überstand = Tatsächliche Breite − Plattenbreite',
  inputs: [
    { type: 'number', id: 'plattenbreite', label: 'Gewünschte Plattenbreite', unit: 'mm', default: 600, min: 1, step: 10 },
    { type: 'number', id: 'brettbreite', label: 'Breite eines Bretts', unit: 'mm', default: 80, min: 1, step: 1, help: 'Fertige Breite einer einzelnen Lamelle nach dem Hobeln.' },
  ],
  compute: (v) => {
    const platte = num(v.plattenbreite);
    const brett = num(v.brettbreite, 1);
    const anzahl = Math.ceil(platte / brett);
    const istBreite = anzahl * brett;
    const ueberstand = istBreite - platte;
    return [
      { label: 'Anzahl Bretter', value: anzahl, unit: 'Stk', digits: 0, primary: true },
      { label: 'Tatsächliche Breite', value: istBreite, unit: 'mm', digits: 0 },
      { label: 'Überstand zum Besäumen', value: ueberstand, unit: 'mm', digits: 0 },
    ];
  },
  howto: [
    'Gewünschte Endbreite der Leimholzplatte eintragen.',
    'Fertige Breite einer einzelnen Lamelle (nach dem Hobeln) angeben.',
    'Anzahl der Bretter wird aufgerundet, damit die Platte breit genug wird.',
    'Den Überstand nach dem Verleimen gerade besäumen.',
  ],
  faq: [
    {
      q: 'Warum wird auf ganze Bretter aufgerundet?',
      a: 'Du kannst nur ganze Lamellen verleimen. Aufgerundet entsteht ein kleiner Überstand, der nach dem Verleimen auf Maß gesägt wird.',
    },
    {
      q: 'Sollte ich schmale oder breite Lamellen wählen?',
      a: 'Schmalere Lamellen (60–80 mm) verziehen sich weniger und ergeben eine formstabilere Platte als wenige breite Bretter.',
    },
  ],
  related: ['holz-volumen-gewicht', 'zuschnitt-laenge'],
  updated: '2026-06-15',
  examples: [
    {
      values: { plattenbreite: 600, brettbreite: 80 },
      expect: [
        { label: 'Anzahl Bretter', value: 8, tolerance: 0 },
        { label: 'Tatsächliche Breite', value: 640, tolerance: 0 },
        { label: 'Überstand zum Besäumen', value: 40, tolerance: 0 },
      ],
    },
  ],
};
