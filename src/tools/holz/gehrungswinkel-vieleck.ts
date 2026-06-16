import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'gehrungswinkel-vieleck',
  category: 'holz',
  title: 'Gehrungswinkel für Vieleck berechnen',
  shortTitle: 'Gehrungswinkel',
  description:
    'Berechne den Gehrungswinkel und Innenwinkel für jedes regelmäßige Vieleck – für Bilderrahmen, n-eckige Rahmen, Tröge und Kästen.',
  keywords: [
    'gehrungswinkel berechnen',
    'gehrung vieleck',
    'gehrungswinkel n-eck',
    'bilderrahmen gehrung winkel',
    'achteck gehrungswinkel',
    'sechseck gehrung berechnen',
    'gehrung sägen winkel',
  ],
  formula:
    'Innenwinkel = (n − 2) · 180 / n · Gehrungswinkel (Sägeanschlag ab 90°) = 90 − 180/n · Anzahl Stöße = n',
  inputs: [
    { type: 'number', id: 'ecken', label: 'Anzahl Ecken (n)', unit: 'Ecken', default: 4, min: 3, step: 1, help: 'z. B. 3=Dreieck, 4=Quadrat, 6=Sechseck, 8=Achteck.' },
  ],
  compute: (v) => {
    const ecken = Math.max(3, Math.round(num(v.ecken, 3)));

    const innenwinkel = ((ecken - 2) * 180) / ecken;
    const gehrung = 90 - 180 / ecken;
    const stossWinkel = innenwinkel;

    return [
      { label: 'Gehrungswinkel (Säge ab 90°)', value: gehrung, unit: '°', digits: 2, primary: true },
      { label: 'Innenwinkel des Vielecks', value: innenwinkel, unit: '°', digits: 2 },
      { label: 'Winkel je Stoß (zwei Schnitte)', value: stossWinkel, unit: '°', digits: 2 },
      { label: 'Anzahl Eckverbindungen', value: ecken, unit: 'Stück', digits: 0 },
    ];
  },
  intro:
    'Dieser Rechner liefert den Gehrungswinkel, mit dem du die Werkstücke für ein regelmäßiges Vieleck zusägst – ob klassischer rechteckiger Rahmen (n=4), Sechseck-Hochbeet oder achteckiger Pflanztrog. Jede Ecke entsteht aus zwei gleichen Gehrungsschnitten, die zusammen den Innenwinkel ergeben. Der angezeigte Gehrungswinkel ist auf den üblichen Kapp- und Gehrungssägenanschlag bezogen, der von der 90°-Stellung weg gemessen wird.',
  howto: [
    'Anzahl der Ecken des geplanten Vielecks eintragen (mindestens 3).',
    'Gehrungswinkel an der Kapp- oder Gehrungssäge einstellen – gemessen ab der 0-/90°-Grundstellung.',
    'Beide aneinanderstoßenden Teile mit demselben Winkel schneiden; zusammen bilden sie den Innenwinkel.',
    'Vor dem endgültigen Schnitt einen Probelauf an Resthölzern machen und die Ecke kontrollieren.',
  ],
  faq: [
    {
      q: 'Wieso 45° beim Bilderrahmen?',
      a: 'Ein Rahmen ist ein Quadrat oder Rechteck, also n=4. Der Gehrungswinkel ist 90 − 180/4 = 45°. Zwei 45°-Schnitte ergeben die 90°-Innenecke.',
    },
    {
      q: 'Welcher Winkel gilt fürs Sechseck und Achteck?',
      a: 'Sechseck (n=6): 90 − 180/6 = 60° Gehrung, Innenwinkel 120°. Achteck (n=8): 90 − 180/8 = 67,5° Gehrung, Innenwinkel 135°.',
    },
    {
      q: 'Was, wenn meine Säge den Winkel nicht erreicht?',
      a: 'Viele Kappsägen schwenken nur bis 45–48°. Für stumpfere Gehrungen (Achteck, Zwölfeck) hilft ein Hilfsanschlag, eine Tischkreissäge mit Schiebeschlitten oder das Drehen des Werkstücks um die fehlenden Grad.',
    },
    {
      q: 'Gilt das auch für nicht regelmäßige Formen?',
      a: 'Nein, die Formel setzt gleich lange Seiten und gleiche Innenwinkel voraus. Bei unregelmäßigen Vielecken musst du jede Ecke einzeln aus ihrem konkreten Innenwinkel berechnen: Gehrung = (180 − Innenwinkel) / 2.',
    },
  ],
  related: ['zuschnitt-laenge', 'kreissaege-schnitttiefe-winkel'],
  updated: '2026-06-16',
  examples: [
    {
      values: { ecken: 4 },
      expect: [
        { label: 'Gehrungswinkel (Säge ab 90°)', value: 45, tolerance: 0.01 },
        { label: 'Innenwinkel des Vielecks', value: 90, tolerance: 0.01 },
        { label: 'Anzahl Eckverbindungen', value: 4, tolerance: 0 },
      ],
    },
    {
      values: { ecken: 8 },
      expect: [
        { label: 'Gehrungswinkel (Säge ab 90°)', value: 67.5, tolerance: 0.01 },
        { label: 'Innenwinkel des Vielecks', value: 135, tolerance: 0.01 },
      ],
    },
  ],
};
