import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'brennholz-energie-kwh',
  category: 'holz',
  title: 'Brennholz-Energie in kWh je Ster berechnen',
  shortTitle: 'Brennholz-Energie',
  description:
    'Berechne den Energiegehalt deines Brennholzes in kWh aus Raummetern und Holzart – inklusive Heizöl-Äquivalent für den direkten Kostenvergleich.',
  keywords: [
    'brennholz kwh berechnen',
    'energiegehalt brennholz',
    'kwh je ster holz',
    'heizwert brennholz raummeter',
    'brennholz heizöl vergleich',
    'energie raummeter buche',
    'ster kwh umrechnen',
  ],
  formula:
    'Energie = Raummeter · Heizwert je Ster (lufttrocken, ~20 % Feuchte) · Heizöl-Äquivalent = Energie / 10 kWh je Liter',
  inputs: [
    { type: 'number', id: 'raummeter', label: 'Menge Brennholz', unit: 'rm', default: 5, min: 0, step: 0.1, help: 'Raummeter (Ster) geschichtetes Scheitholz.' },
    {
      type: 'select',
      id: 'holzart',
      label: 'Holzart',
      default: '2100',
      help: 'Heizwert je Ster bei lufttrockenem Holz (~20 % Feuchte).',
      options: [
        { value: '2100', label: 'Buche / Eiche (≈ 2100 kWh/rm)' },
        { value: '1900', label: 'Esche / Ahorn (≈ 1900 kWh/rm)' },
        { value: '1850', label: 'Birke (≈ 1850 kWh/rm)' },
        { value: '1500', label: 'Fichte / Tanne (≈ 1500 kWh/rm)' },
        { value: '1400', label: 'Kiefer / Pappel (≈ 1400 kWh/rm)' },
      ],
    },
  ],
  compute: (v) => {
    const raummeter = num(v.raummeter);
    const heizwert = num(v.holzart, 2100);

    const energie = raummeter * heizwert;
    const heizoel = energie / 10; // 1 Liter Heizöl ≈ 10 kWh
    const gas = energie; // kWh sind direkt vergleichbar

    return [
      { label: 'Energiegehalt', value: energie, unit: 'kWh', digits: 0, primary: true },
      { label: 'Heizöl-Äquivalent', value: heizoel, unit: 'l', digits: 0 },
      { label: 'Entspricht Erdgas', value: gas, unit: 'kWh', digits: 0 },
      { label: 'Energie je Ster', value: heizwert, unit: 'kWh', digits: 0 },
    ];
  },
  intro:
    'Wie viel Heizenergie steckt eigentlich in einem Stapel Brennholz? Dieser Rechner schätzt den nutzbaren Energiegehalt deines Holzvorrats in Kilowattstunden anhand von Raummetern (Ster) und Holzart. Die hinterlegten Heizwerte gelten für lufttrockenes Holz mit rund 20 % Restfeuchte. Zusätzlich erhältst du das Heizöl-Äquivalent (1 Liter ≈ 10 kWh), damit du Brennholz unmittelbar mit deinen Öl- oder Gaskosten vergleichen und die Wirtschaftlichkeit einschätzen kannst.',
  howto: [
    'Menge des Brennholzvorrats in Raummetern (Ster) eintragen.',
    'Holzart wählen – Harthölzer wie Buche liefern deutlich mehr Energie pro Ster als Nadelholz.',
    'Energiegehalt in kWh ablesen und mit deinem Jahresheizbedarf abgleichen.',
    'Heizöl-Äquivalent zur Kostenrechnung gegen deinen aktuellen Öl-/Gaspreis stellen.',
  ],
  faq: [
    {
      q: 'Warum hat Buche mehr Energie als Fichte?',
      a: 'Hartholz ist dichter: Pro Raummeter steckt mehr Holzmasse drin. Der Heizwert je Kilogramm ist bei allen Holzarten ähnlich (etwa 4 kWh/kg lufttrocken), die Dichte macht den Unterschied.',
    },
    {
      q: 'Welche Rolle spielt die Restfeuchte?',
      a: 'Sehr große. Frisch geschlagenes Holz mit 50 % Feuchte liefert deutlich weniger nutzbare Wärme, weil Energie zum Verdampfen des Wassers verloren geht. Die Werte hier gelten für gut abgelagertes Holz um 20 %.',
    },
    {
      q: 'Wie viel Liter Heizöl ersetzt ein Ster Buche?',
      a: 'Etwa 2100 kWh / 10 kWh je Liter = rund 210 Liter Heizöl pro Ster – bei tatsächlicher Kesselnutzung etwas weniger, abhängig vom Wirkungsgrad.',
    },
    {
      q: 'Sind das Brutto- oder Nutzwerte?',
      a: 'Es sind Heizwerte (unterer Heizwert) des Brennstoffs. Der Wirkungsgrad deines Ofens (oft 70–90 %) verringert die real nutzbare Wärme noch einmal.',
    },
  ],
  related: ['festmeter-raummeter', 'holz-volumen-gewicht', 'holzfeuchte-darrprobe'],
  updated: '2026-06-16',
  examples: [
    {
      values: { raummeter: 5, holzart: '2100' },
      expect: [
        { label: 'Energiegehalt', value: 10500, tolerance: 1 },
        { label: 'Heizöl-Äquivalent', value: 1050, tolerance: 1 },
      ],
    },
    {
      values: { raummeter: 3, holzart: '1500' },
      expect: [{ label: 'Energiegehalt', value: 4500, tolerance: 1 }],
    },
  ],
};
