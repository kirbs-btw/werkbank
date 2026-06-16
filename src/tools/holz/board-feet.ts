import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'board-feet',
  category: 'holz',
  title: 'Board Feet Rechner (US-Holzmaß)',
  shortTitle: 'Board Feet',
  description:
    'Berechne Board Feet aus Dicke, Breite und Länge in Zoll/Fuß – das US-Holzmaß für Schnittholz – inklusive Umrechnung in Kubikmeter und Stückzahl.',
  keywords: [
    'board feet berechnen',
    'board feet rechner',
    'board feet in kubikmeter',
    'us holzmaß umrechnen',
    'bretter board feet',
    'schnittholz board foot',
    'bf holzvolumen',
  ],
  formula:
    'Board Feet = (Dicke[in] · Breite[in] · Länge[ft]) / 12 · Stückzahl · 1 fbm = 2359,74 cm³ = 0,00235974 m³',
  inputs: [
    { type: 'number', id: 'dicke', label: 'Dicke', unit: 'in', default: 1, min: 0, step: 0.25, help: 'Nenndicke in Zoll, z. B. 1 in = 25,4 mm.' },
    { type: 'number', id: 'breite', label: 'Breite', unit: 'in', default: 6, min: 0, step: 0.25 },
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'ft', default: 8, min: 0, step: 0.5, help: 'Länge in Fuß (1 ft = 30,48 cm).' },
    { type: 'number', id: 'stueck', label: 'Stückzahl', unit: 'Stk', default: 1, min: 1, step: 1 },
  ],
  compute: (v) => {
    const dicke = num(v.dicke);
    const breite = num(v.breite);
    const laenge = num(v.laenge);
    const stueck = Math.max(1, Math.round(num(v.stueck, 1)));

    const bfProStueck = (dicke * breite * laenge) / 12;
    const bfGesamt = bfProStueck * stueck;
    const m3 = bfGesamt * 0.00235974;
    const liter = m3 * 1000;

    return [
      { label: 'Board Feet gesamt', value: bfGesamt, unit: 'fbm', digits: 2, primary: true },
      { label: 'Board Feet je Stück', value: bfProStueck, unit: 'fbm', digits: 3 },
      { label: 'Volumen in Kubikmeter', value: m3, unit: 'm³', digits: 4 },
      { label: 'Volumen in Liter', value: liter, unit: 'l', digits: 1 },
    ];
  },
  intro:
    'Board Feet (fbm, „foot board measure“) ist das im englischsprachigen Raum übliche Volumenmaß für Schnittholz: Ein Board Foot entspricht einem Brett von 1 Zoll Dicke, 12 Zoll Breite und 1 Fuß Länge. Dieser Rechner ermittelt die Board Feet aus deinen Zoll- und Fuß-Maßen und rechnet sie zugleich in Kubikmeter und Liter um, damit du US-Holzlisten mit europäischen Mengen vergleichen kannst. So planst du Importholz, Hartholzbestellungen oder Onlinekäufe ohne Maßverwirrung.',
  howto: [
    'Nenndicke und Breite des Bretts in Zoll (inch) eintragen.',
    'Länge in Fuß (feet) angeben – Reststücke als Dezimalwert, z. B. 8,5 ft.',
    'Stückzahl gleicher Bretter eingeben, um die Gesamtmenge zu erhalten.',
    'Ergebnis in fbm bestellen oder über den m³-Wert mit deutschem Holz vergleichen.',
  ],
  faq: [
    {
      q: 'Wie viel ist 1 Board Foot in Kubikmeter?',
      a: 'Ein Board Foot sind 1 × 12 × 12 Zoll = 144 in³ ≈ 2359,74 cm³, also rund 0,00236 m³ oder 2,36 Liter. 1 m³ entspricht etwa 424 Board Feet.',
    },
    {
      q: 'Rechne ich mit Nenn- oder Fertigmaß?',
      a: 'Board Feet werden traditionell mit dem Nennmaß (nominal, vor dem Hobeln) berechnet. Ein gehobeltes „1×6“ misst real oft nur 0,75 × 5,5 in, wird aber als 1 × 6 in verrechnet.',
    },
    {
      q: 'Was bedeutet die „/12“ in der Formel?',
      a: 'Wenn die Länge bereits in Fuß steht, teilst du durch 12 (statt durch 144 bei reinen Zoll-Längen), weil 1 ft = 12 in. Beide Wege liefern dasselbe Ergebnis.',
    },
    {
      q: 'Wie viele Board Feet hat ein 2×4 mit 8 ft?',
      a: 'Dicke 2 in · Breite 4 in · Länge 8 ft / 12 = 5,33 fbm. Das ist ein typischer nordamerikanischer Standardpfosten.',
    },
  ],
  related: ['holz-volumen-gewicht', 'festmeter-raummeter', 'stammholz-festmeter'],
  updated: '2026-06-16',
  examples: [
    {
      values: { dicke: 1, breite: 6, laenge: 8, stueck: 1 },
      expect: [
        { label: 'Board Feet gesamt', value: 4, tolerance: 0.01 },
        { label: 'Volumen in Liter', value: 9.44, tolerance: 0.05 },
      ],
    },
    {
      values: { dicke: 2, breite: 4, laenge: 8, stueck: 5 },
      expect: [{ label: 'Board Feet gesamt', value: 26.67, tolerance: 0.05 }],
    },
  ],
};
