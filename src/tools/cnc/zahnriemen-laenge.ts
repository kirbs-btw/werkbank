import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

/** Teilkreisdurchmesser einer Zahnscheibe: Die Zähne sitzen auf dem Umfang. */
const teilkreis = (zaehne: number, teilung: number): number => (zaehne * teilung) / Math.PI;

/**
 * Riemenlänge bei offenem Trieb über zwei Scheiben.
 *
 * Die Geraden berühren beide Scheiben tangential; der Riemen umschlingt die
 * große über den Winkel π + 2β und die kleine über π − 2β.
 */
function riemenlaenge(d1: number, d2: number, achsabstand: number): number {
  const gross = Math.max(d1, d2);
  const klein = Math.min(d1, d2);
  const sinBeta = Math.min(1, (gross - klein) / (2 * achsabstand));
  const beta = Math.asin(sinBeta);
  return (
    2 * achsabstand * Math.cos(beta) +
    (Math.PI / 2 + beta) * gross +
    (Math.PI / 2 - beta) * klein
  );
}

/**
 * Umkehrung: Welcher Achsabstand gehört zu einer vorgegebenen Riemenlänge?
 *
 * Die Länge wächst streng mit dem Achsabstand, deshalb genügt eine Intervall-
 * halbierung. Eine geschlossene Formel gibt es nicht – der Winkel β hängt selbst
 * vom Achsabstand ab.
 */
function achsabstandFuer(d1: number, d2: number, laenge: number): number {
  let unten = (d1 + d2) / 2 + 1e-6; // näher können sich die Scheiben nicht kommen
  let oben = Math.max(laenge, unten * 2);
  for (let i = 0; i < 80; i++) {
    const mitte = (unten + oben) / 2;
    if (riemenlaenge(d1, d2, mitte) < laenge) unten = mitte;
    else oben = mitte;
  }
  return (unten + oben) / 2;
}

export const tool: Tool = {
  slug: 'zahnriemen-laenge',
  category: 'cnc',
  title: 'Zahnriemen-Länge & Achsabstand berechnen',
  shortTitle: 'Zahnriemenlänge',
  description:
    'Berechne die nötige Zahnriemenlänge aus Zähnezahlen, Teilung und Achsabstand – und den Achsabstand, der zum nächsten erhältlichen Riemen passt.',
  keywords: [
    'zahnriemen länge berechnen',
    'riemenlänge berechnen',
    'gt2 riemen länge',
    'achsabstand zahnriemen',
    'zahnriemen zähnezahl berechnen',
    'htd riemen berechnen',
    'riemenscheibe teilkreisdurchmesser',
  ],
  formula:
    'd = z · p / π;  L = 2·a·cos β + (π/2 + β)·d₂ + (π/2 − β)·d₁;  sin β = (d₂ − d₁) / (2a)',
  inputs: [
    { type: 'number', id: 'z1', label: 'Zähne Scheibe 1', unit: 'Zähne', default: 20, min: 6, step: 1 },
    { type: 'number', id: 'z2', label: 'Zähne Scheibe 2', unit: 'Zähne', default: 20, min: 6, step: 1 },
    {
      type: 'select',
      id: 'p',
      label: 'Teilung',
      default: '2',
      help: 'Zahnabstand des Riemens. GT2 ist der Standard an 3D-Druckern.',
      options: [
        { value: '2', label: 'GT2 / 2M – 2 mm' },
        { value: '3', label: 'GT3 / HTD 3M – 3 mm' },
        { value: '5', label: 'HTD 5M / T5 – 5 mm' },
        { value: '5.08', label: 'XL – 5,08 mm' },
        { value: '8', label: 'HTD 8M – 8 mm' },
        { value: '10', label: 'T10 – 10 mm' },
      ],
    },
    {
      type: 'number', id: 'a', label: 'Achsabstand', unit: 'mm', default: 200, min: 1, step: 1,
      help: 'Abstand der beiden Wellenmitten, wie du ihn bauen willst.',
    },
  ],
  compute: (v) => {
    const z1 = Math.max(1, num(v.z1, 20));
    const z2 = Math.max(1, num(v.z2, 20));
    const p = num(v.p, 2);
    const a = Math.max(0.001, num(v.a, 200));

    const d1 = teilkreis(z1, p);
    const d2 = teilkreis(z2, p);
    const minAbstand = (d1 + d2) / 2;

    const l = riemenlaenge(d1, d2, a);
    const zaehneGenau = l / p;
    const zaehneGerundet = Math.round(zaehneGenau);
    const lGerundet = zaehneGerundet * p;
    const aGerundet = achsabstandFuer(d1, d2, lGerundet);

    const sinBeta = Math.min(1, Math.abs(d2 - d1) / (2 * a));
    const umschlingung = 180 - (2 * Math.asin(sinBeta) * 180) / Math.PI;
    // Nur die Zähne im Umschlingungsbogen der kleinen Scheibe übertragen Kraft.
    const zaehneImEingriff = Math.floor((Math.min(z1, z2) * umschlingung) / 360);

    const zuNah = a < minAbstand;

    // Überlappen sich die Scheiben, gibt es keinen Riementrieb. Dann stehen
    // *alle* abgeleiteten Werte auf null statt auf einer Zahl, die brauchbar
    // aussieht – eine selbstbewusste Zähnezahl für eine unmögliche Anordnung
    // wäre schlimmer als gar keine.
    const hinweisZuNah = `Der Achsabstand muss mindestens ${minAbstand.toLocaleString('de-DE', { maximumFractionDigits: 2 })} mm betragen – sonst überlappen sich die Scheiben.`;

    return [
      {
        label: 'Riemen mit',
        value: zuNah ? 0 : zaehneGerundet,
        unit: 'Zähnen',
        digits: 0,
        primary: true,
        help: zuNah
          ? hinweisZuNah
          : `entspricht ${lGerundet.toLocaleString('de-DE', { maximumFractionDigits: 1 })} mm Umfang – so werden Zahnriemen bestellt`,
      },
      {
        label: 'Achsabstand für diesen Riemen',
        value: zuNah ? 0 : aGerundet,
        unit: 'mm',
        digits: 2,
        help: 'Auf dieses Maß einbauen. Die Differenz zum Wunschmaß muss der Spanner ausgleichen.',
      },
      { label: 'Rechnerische Riemenlänge', value: zuNah ? 0 : l, unit: 'mm', digits: 2 },
      { label: 'Teilkreis Scheibe 1', value: d1, unit: 'mm', digits: 2 },
      { label: 'Teilkreis Scheibe 2', value: d2, unit: 'mm', digits: 2 },
      {
        label: 'Umschlingung kleine Scheibe',
        value: zuNah ? 0 : umschlingung,
        unit: '°',
        digits: 1,
        help: `${zaehneImEingriff} Zähne im Eingriff – unter 6 rutscht der Riemen leicht durch`,
      },
      {
        label: 'Kleinster möglicher Achsabstand',
        value: minAbstand,
        unit: 'mm',
        digits: 2,
        help: zuNah
          ? 'Dein Achsabstand liegt darunter – die Scheiben würden sich berühren.'
          : 'Dort berühren sich die Scheiben.',
      },
    ];
  },
  intro:
    'Zahnriemen gibt es nicht in beliebiger Länge, sondern in ganzen Zähnen. Der Achsabstand, den du dir ausgedacht hast, führt deshalb fast nie auf einen erhältlichen Riemen – die Frage ist also nicht nur „welche Länge?", sondern „welchen Riemen kaufe ich, und wohin kommt dann die Welle?". Der Rechner beantwortet beides: Er rundet auf die nächste ganze Zähnezahl und rechnet zurück, welcher Achsabstand dazu gehört. Die Differenz zu deinem Wunschmaß ist der Weg, den der Spanner hergeben muss.',
  howto: [
    'Zähnezahlen beider Scheiben eintragen. Bei einem Linearantrieb mit Umlenkrolle sind beide oft gleich.',
    'Teilung des Riemens wählen – GT2 mit 2 mm ist der Standard an 3D-Druckern, HTD 5M eher im Maschinenbau.',
    'Gewünschten Achsabstand angeben, also den Abstand der Wellenmitten.',
    'Riemen mit der angezeigten Zähnezahl bestellen und die Welle auf den zurückgerechneten Achsabstand setzen.',
  ],
  faq: [
    {
      q: 'Warum weicht der zurückgerechnete Achsabstand von meinem Wunsch ab?',
      a: 'Weil Riemen nur in ganzen Zähnen existieren. Zwischen zwei Zähnen liegt bei GT2 genau 2 mm Umfang – das entspricht rund 1 mm Achsabstand, weil der Riemen zweimal zwischen den Scheiben verläuft. Der Spanner muss diese Differenz aufnehmen können, sonst passt der Riemen nicht oder hängt durch.',
    },
    {
      q: 'Was ist der Teilkreisdurchmesser und warum ist er krumm?',
      a: 'Er ist der gedachte Kreis, auf dem die Zahnteilung liegt: d = z · p / π. Bei 20 Zähnen und 2 mm Teilung sind das 12,73 mm – also kein glatter Wert. Der Außendurchmesser einer GT2-Scheibe ist etwas kleiner, weil die Zähne nach innen gehen; für die Riemenlänge zählt aber der Teilkreis.',
    },
    {
      q: 'Wie viele Zähne müssen im Eingriff sein?',
      a: 'Als Faustregel mindestens sechs. Darunter verteilt sich die Kraft auf zu wenige Zähne, der Riemen springt unter Last über. Bei gleich großen Scheiben liegt die Umschlingung bei 180°, also der Hälfte der Zähne – das ist unkritisch. Eng wird es bei stark unterschiedlichen Scheiben und kleinem Achsabstand.',
    },
    {
      q: 'Gilt die Rechnung auch für gekreuzte Riemen?',
      a: 'Nein, hier ist der offene Trieb gerechnet, bei dem sich beide Scheiben gleichsinnig drehen. Gekreuzte Zahnriemen sind unüblich, weil die Zähne dann auf der falschen Seite liegen.',
    },
    {
      q: 'Muss ich für die Riemenspannung etwas einplanen?',
      a: 'Ja. Die Rechnung liefert die Länge im spannungslosen Zustand. Ein Zahnriemen wird über den Achsabstand vorgespannt, nicht über Dehnung – deshalb braucht der Aufbau eine Spannmöglichkeit von einigen Millimetern. Ob die Spannung stimmt, lässt sich anschließend über die Eigenfrequenz prüfen.',
    },
  ],
  related: ['spindel-drehmoment', 'gewindesteigung-metrisch', 'vorschub-umrechnung'],
  updated: '2026-08-27',
  examples: [
    {
      // Gleich große Scheiben: L = 2a + z·p, exakt nachrechenbar
      values: { z1: 20, z2: 20, p: '2', a: 200 },
      expect: [
        { label: 'Rechnerische Riemenlänge', value: 440, tolerance: 0.01 },
        { label: 'Riemen mit', value: 220, tolerance: 0 },
        { label: 'Teilkreis Scheibe 1', value: 12.73, tolerance: 0.01 },
        { label: 'Umschlingung kleine Scheibe', value: 180, tolerance: 0.01 },
      ],
    },
    {
      values: { z1: 20, z2: 60, p: '2', a: 100 },
      expect: [
        { label: 'Rechnerische Riemenlänge', value: 281.63, tolerance: 0.05 },
        { label: 'Teilkreis Scheibe 2', value: 38.2, tolerance: 0.01 },
      ],
    },
    {
      // Kleinster Achsabstand: Scheiben berühren sich bei (d1+d2)/2
      values: { z1: 20, z2: 40, p: '5', a: 300 },
      expect: [{ label: 'Kleinster möglicher Achsabstand', value: 47.75, tolerance: 0.05 }],
    },
  ],
};
