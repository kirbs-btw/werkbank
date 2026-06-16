import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'zaun-pfostenabstand',
  category: 'holz',
  title: 'Zaun-Pfostenabstand berechnen',
  shortTitle: 'Pfostenabstand',
  description:
    'Berechne Pfostenanzahl, gleichmäßigen Achsabstand und lichte Feldweite für deinen Zaun aus Gesamtlänge und maximalem Feldabstand.',
  keywords: [
    'pfostenabstand zaun berechnen',
    'zaunpfosten abstand',
    'wie viele zaunpfosten',
    'feldweite zaun berechnen',
    'gartenzaun pfosten anzahl',
    'zaun planung abstand',
    'pfostenabstand gleichmäßig verteilen',
  ],
  formula:
    'Felder = aufrunden(Länge / max. Feldabstand) · Pfosten = Felder + 1 · Achsabstand = Länge / Felder · lichte Weite = Achsabstand − Pfostenbreite',
  inputs: [
    { type: 'number', id: 'laenge', label: 'Gesamtlänge des Zauns', unit: 'mm', default: 20000, min: 1, step: 100 },
    { type: 'number', id: 'maxFeld', label: 'Maximaler Feldabstand (Achsmaß)', unit: 'mm', default: 2500, min: 1, step: 10, help: 'Größter erlaubter Achsabstand, z. B. nach Elementbreite.' },
    { type: 'number', id: 'pfostenbreite', label: 'Pfostenbreite', unit: 'mm', default: 90, min: 0, step: 1 },
  ],
  compute: (v) => {
    const laenge = num(v.laenge);
    const maxFeld = num(v.maxFeld, 1);
    const pfostenbreite = num(v.pfostenbreite);

    const felder = maxFeld > 0 ? Math.ceil(laenge / maxFeld) : 0;
    const pfosten = felder > 0 ? felder + 1 : 0;
    const achsabstand = felder > 0 ? laenge / felder : 0;
    const lichteWeite = achsabstand - pfostenbreite;

    return [
      { label: 'Anzahl Felder', value: felder, unit: 'Felder', digits: 0 },
      { label: 'Anzahl Pfosten', value: pfosten, unit: 'Stück', digits: 0, primary: true },
      { label: 'Gleichmäßiger Achsabstand', value: achsabstand, unit: 'mm', digits: 0 },
      { label: 'Lichte Feldweite', value: lichteWeite, unit: 'mm', digits: 0 },
    ];
  },
  intro:
    'Mit diesem Rechner verteilst du Zaunpfosten gleichmäßig über eine gerade Zaunlinie. Aus der Gesamtlänge und einem maximal zulässigen Feldabstand (etwa durch die Elementbreite oder die Spannweite der Felder vorgegeben) ergibt sich die Mindestzahl an Feldern; daraus folgen die Pfostenzahl, der exakte gleichmäßige Achsabstand und die lichte Weite zwischen den Pfosten – wichtig für Einsteckfelder und Sichtschutzelemente.',
  howto: [
    'Gesamtlänge der Zaunlinie von Pfostenmitte Anfang bis Pfostenmitte Ende messen.',
    'Maximalen Feldabstand festlegen, z. B. die maximale Elementbreite oder eine statische Grenze.',
    'Pfostenbreite eintragen, um die lichte Weite (Öffnung zwischen den Pfosten) zu erhalten.',
    'Ergebnis liefert Feldzahl, Pfostenzahl, gleichmäßigen Achsabstand und lichte Feldweite.',
  ],
  faq: [
    {
      q: 'Warum Pfosten gleich Felder plus eins?',
      a: 'Ein gerader Zaun hat an beiden Enden je einen Pfosten. Bei 8 Feldern stehen also 9 Pfosten. Bildet der Zaun ein geschlossenes Rechteck, gilt Pfosten = Felder, weil sich Eckpfosten teilen – das deckt dieser Rechner für die gerade Linie nicht ab.',
    },
    {
      q: 'Warum wird der Achsabstand kleiner als das Maximum?',
      a: 'Geht die Länge nicht glatt durch den Maximalabstand, wird auf das nächste ganze Feld aufgerundet. Der tatsächliche Achsabstand verteilt die Länge dann gleichmäßig und liegt unter dem Maximum.',
    },
    {
      q: 'Was ist der Unterschied zwischen Achsabstand und lichter Weite?',
      a: 'Der Achsabstand misst von Pfostenmitte zu Pfostenmitte. Die lichte Weite ist die freie Öffnung dazwischen, also Achsabstand minus Pfostenbreite. Für die Bestellung von Füllelementen zählt die lichte Weite.',
    },
    {
      q: 'Wie tief müssen die Pfosten in den Boden?',
      a: 'Als Faustregel etwa ein Drittel der sichtbaren Höhe, mindestens jedoch 80 cm wegen Frosttiefe. Das genaue Fundamentvolumen ermittelst du mit dem Pfostenfundament-Rechner.',
    },
  ],
  related: ['pfostenfundament-beton', 'bretter-pro-quadratmeter'],
  updated: '2026-06-16',
  examples: [
    {
      values: { laenge: 20000, maxFeld: 2500, pfostenbreite: 90 },
      expect: [
        { label: 'Anzahl Felder', value: 8, tolerance: 0 },
        { label: 'Anzahl Pfosten', value: 9, tolerance: 0 },
        { label: 'Gleichmäßiger Achsabstand', value: 2500, tolerance: 0 },
        { label: 'Lichte Feldweite', value: 2410, tolerance: 0 },
      ],
    },
  ],
};
