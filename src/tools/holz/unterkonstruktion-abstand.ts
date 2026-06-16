import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'unterkonstruktion-abstand',
  category: 'holz',
  title: 'Unterkonstruktion: Latten-Abstand & Anzahl',
  shortTitle: 'Unterkonstruktion',
  description:
    'Berechne Anzahl und gleichmäßigen Achsabstand der Unterkonstruktionslatten für Terrasse oder Fassade aus Spannbreite und maximalem Auflagerabstand.',
  keywords: [
    'unterkonstruktion abstand berechnen',
    'lattenabstand terrasse',
    'anzahl latten unterkonstruktion',
    'auflagerabstand terrassendielen',
    'lattung abstand fassade',
    'unterkonstruktion latten menge',
    'traglatten abstand berechnen',
  ],
  formula:
    'Felder = aufrunden(Spannbreite / max. Achsabstand) · Latten = Felder + 1 · Achsabstand = Spannbreite / Felder · Laufmeter = Latten · Lattenlänge',
  inputs: [
    { type: 'number', id: 'spannbreite', label: 'Spannbreite (quer zu den Latten)', unit: 'mm', default: 5000, min: 1, step: 10, help: 'Maß über das die Latten verteilt werden, = Dielenlänge.' },
    { type: 'number', id: 'maxAbstand', label: 'Maximaler Achsabstand', unit: 'mm', default: 500, min: 1, step: 10, help: 'Zulässiger Auflagerabstand der Diele/Beplankung.' },
    { type: 'number', id: 'lattenlaenge', label: 'Länge je Latte (= Terrassentiefe)', unit: 'mm', default: 4000, min: 0, step: 10 },
  ],
  compute: (v) => {
    const spannbreite = num(v.spannbreite);
    const maxAbstand = num(v.maxAbstand, 1);
    const lattenlaenge = num(v.lattenlaenge);

    const felder = maxAbstand > 0 ? Math.ceil(spannbreite / maxAbstand) : 0;
    const latten = felder > 0 ? felder + 1 : 0;
    const achsabstand = felder > 0 ? spannbreite / felder : 0;
    const laufmeter = (latten * lattenlaenge) / 1000;

    return [
      { label: 'Anzahl Latten', value: latten, unit: 'Stück', digits: 0, primary: true },
      { label: 'Gleichmäßiger Achsabstand', value: achsabstand, unit: 'mm', digits: 0 },
      { label: 'Anzahl Felder', value: felder, unit: 'Felder', digits: 0 },
      { label: 'Laufmeter Latten gesamt', value: laufmeter, unit: 'm', digits: 1 },
    ];
  },
  intro:
    'Mit diesem Rechner planst du die Unterkonstruktion für eine Terrasse oder Fassade. Die Latten laufen quer zu den Dielen, und ihr Abstand richtet sich nach dem maximal zulässigen Auflagerabstand der Diele oder Beplankung. Aus Spannbreite und Maximalabstand ergeben sich die Felder, daraus die Lattenzahl (immer ein Auflager mehr als Felder), der exakte gleichmäßige Achsabstand und die benötigten Laufmeter.',
  howto: [
    'Spannbreite eintragen – das ist das Maß quer zu den Latten, üblicherweise die Dielenlänge.',
    'Maximalen Achsabstand nach Materialvorgabe wählen (Hartholz ca. 400–500 mm, Weichholz/WPC oft enger).',
    'Lattenlänge angeben (entspricht der Terrassentiefe in Lattenrichtung) für die Laufmeter.',
    'Ergebnis liefert Lattenzahl, gleichmäßigen Achsabstand und die gesamten Laufmeter.',
  ],
  faq: [
    {
      q: 'Warum eine Latte mehr als Felder?',
      a: 'An beiden Rändern muss eine Latte liegen, dazwischen die Zwischenauflager. Bei 5000 mm und 500 mm Maximalabstand sind das 10 Felder und 11 Latten.',
    },
    {
      q: 'Welcher Abstand ist für Terrassendielen richtig?',
      a: 'Er hängt von Material und Dielenstärke ab. Harthölzer ab 21 mm vertragen oft 500 mm, weichere oder dünnere Dielen brauchen 400 mm oder weniger. Bei Diagonalverlegung den Abstand zusätzlich verringern.',
    },
    {
      q: 'Gilt das auch für eine hinterlüftete Fassade?',
      a: 'Ja, das Prinzip ist gleich. Bei senkrechter Boden-Deckel-Schalung läuft die Lattung waagerecht; der Abstand richtet sich nach der zulässigen Spannweite der Schalbretter, meist 400–650 mm.',
    },
    {
      q: 'Wie hängen Lattenabstand und Schraubenzahl zusammen?',
      a: 'Je enger die Latten, desto mehr Auflagerpunkte je Diele und damit mehr Schrauben. Den Schraubenbedarf rechnest du anschließend mit dem Terrassenschrauben-Rechner aus dem Auflagerabstand.',
    },
  ],
  related: ['terrassendielen-bedarf', 'schrauben-terrassendielen'],
  updated: '2026-06-16',
  examples: [
    {
      values: { spannbreite: 5000, maxAbstand: 500, lattenlaenge: 4000 },
      expect: [
        { label: 'Anzahl Latten', value: 11, tolerance: 0 },
        { label: 'Gleichmäßiger Achsabstand', value: 500, tolerance: 0 },
        { label: 'Anzahl Felder', value: 10, tolerance: 0 },
        { label: 'Laufmeter Latten gesamt', value: 44, tolerance: 0.1 },
      ],
    },
  ],
};
