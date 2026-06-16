import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'stammholz-festmeter',
  category: 'holz',
  title: 'Stammholz-Festmeter aus Durchmesser & Länge',
  shortTitle: 'Stammholz-Festmeter',
  description:
    'Berechne den Festmeter-Inhalt eines Rundholzstamms nach der Huber-Formel aus Mittendurchmesser und Länge – mit optionalem Rindenabzug.',
  keywords: [
    'stammholz festmeter berechnen',
    'rundholz volumen rechner',
    'huber formel festmeter',
    'stamm kubikmeter durchmesser',
    'festmeter aus durchmesser länge',
    'baumstamm volumen berechnen',
    'rindenabzug festmeter',
  ],
  formula:
    'Festmeter (Huber) = π/4 · Mittendurchmesser² · Länge · Mittendurchmesser ohne Rinde = Durchmesser − 2 · Rindenstärke',
  inputs: [
    { type: 'number', id: 'durchmesser', label: 'Mittendurchmesser (mit Rinde)', unit: 'cm', default: 35, min: 0, step: 0.5, help: 'In der Stammmitte gemessen.' },
    { type: 'number', id: 'laenge', label: 'Stammlänge', unit: 'm', default: 4, min: 0, step: 0.1 },
    { type: 'number', id: 'rinde', label: 'Rindenstärke', unit: 'cm', default: 1, min: 0, step: 0.1, help: 'Einseitige Rindendicke; wird zweifach abgezogen.' },
  ],
  compute: (v) => {
    const dCm = num(v.durchmesser);
    const laenge = num(v.laenge);
    const rinde = num(v.rinde);

    const dM = dCm / 100;
    const fmMitRinde = (Math.PI / 4) * dM * dM * laenge;

    const dOhneCm = Math.max(0, dCm - 2 * rinde);
    const dOhneM = dOhneCm / 100;
    const fmOhneRinde = (Math.PI / 4) * dOhneM * dOhneM * laenge;

    const mantel = Math.PI * dM * laenge;

    return [
      { label: 'Festmeter ohne Rinde', value: fmOhneRinde, unit: 'fm', digits: 3, primary: true },
      { label: 'Festmeter mit Rinde', value: fmMitRinde, unit: 'fm', digits: 3 },
      { label: 'Durchmesser ohne Rinde', value: dOhneCm, unit: 'cm', digits: 1 },
      { label: 'Mantelfläche', value: mantel, unit: 'm²', digits: 2 },
    ];
  },
  intro:
    'Beim Verkauf und der Vermessung von Rundholz wird der Festmeter (1 m³ feste Holzmasse) traditionell mit der Huber-Formel ermittelt: Der Stamm wird als Zylinder mit dem in der Stammmitte gemessenen Durchmesser angenähert. Dieser Rechner liefert das Volumen mit und ohne Rinde, denn abgerechnet wird üblicherweise ohne Rinde. Zusätzlich erhältst du die Mantelfläche – praktisch für die Abschätzung von Rindenmenge oder Konservierungsanstrich. Ideal für Selbstwerber, Sägewerk-Kunden und Brennholzeinkauf.',
  howto: [
    'Mittendurchmesser des Stamms (mit Rinde) in der Mitte der Länge messen.',
    'Stammlänge in Metern eintragen – bei Krümmung die gerade Sehnenlänge.',
    'Einseitige Rindenstärke angeben; der Rechner zieht sie beidseitig ab.',
    'Festmeter ohne Rinde für die Abrechnung verwenden.',
  ],
  faq: [
    {
      q: 'Was ist die Huber-Formel?',
      a: 'Sie schätzt das Stammvolumen aus dem Mittendurchmesser: V = π/4 · d_mitte² · Länge. Sie ist einfach und im Forst weit verbreitet, unterschätzt aber stark verjüngende Stämme leicht.',
    },
    {
      q: 'Warum mit dem Mittendurchmesser rechnen?',
      a: 'Der Durchmesser in der Stammmitte gleicht die Verjüngung über die Länge gut aus und liefert ein realistischeres Volumen als Zopf- oder Stammfußdurchmesser allein.',
    },
    {
      q: 'Wie viel macht die Rinde aus?',
      a: 'Je nach Baumart 8–15 % des Volumens. Bei dickborkigen Arten wie Kiefer oder Eiche ist der Rindenabzug deutlich, bei glattrindiger Buche geringer.',
    },
    {
      q: 'Wie hängt das mit Raummetern zusammen?',
      a: 'Der Festmeter ist reine Holzmasse. Aufgespalten und gestapelt ergibt 1 Festmeter rund 1,4 Raummeter (Ster) Scheitholz, da Zwischenräume hinzukommen.',
    },
  ],
  related: ['festmeter-raummeter', 'holz-volumen-gewicht', 'board-feet'],
  updated: '2026-06-16',
  examples: [
    {
      values: { durchmesser: 35, laenge: 4, rinde: 0 },
      expect: [
        { label: 'Festmeter mit Rinde', value: 0.385, tolerance: 0.002 },
        { label: 'Festmeter ohne Rinde', value: 0.385, tolerance: 0.002 },
      ],
    },
    {
      values: { durchmesser: 40, laenge: 5, rinde: 0 },
      expect: [{ label: 'Festmeter ohne Rinde', value: 0.628, tolerance: 0.003 }],
    },
  ],
};
