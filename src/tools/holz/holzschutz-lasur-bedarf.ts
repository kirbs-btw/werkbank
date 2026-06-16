import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'holzschutz-lasur-bedarf',
  category: 'holz',
  title: 'Holzschutz: Lasur- & Öl-Bedarf berechnen',
  shortTitle: 'Lasur-Bedarf',
  description:
    'Berechne den Liter-Bedarf an Lasur, Öl oder Farbe für Holzflächen aus Fläche, Anzahl Anstriche und Ergiebigkeit – inklusive Gebindezahl.',
  keywords: [
    'holzlasur bedarf berechnen',
    'wie viel lasur pro m2',
    'öl bedarf terrasse berechnen',
    'holzschutz menge rechner',
    'lasur ergiebigkeit liter',
    'farbe holz menge berechnen',
    'anstrich holz liter berechnen',
  ],
  formula:
    'Liter = Fläche · Anstriche / Ergiebigkeit (m²/l) · Gebinde = aufrunden(Liter / Gebindegröße)',
  inputs: [
    { type: 'number', id: 'flaeche', label: 'Zu streichende Fläche', unit: 'm²', default: 20, min: 0, step: 0.5 },
    { type: 'number', id: 'anstriche', label: 'Anzahl Anstriche', unit: 'x', default: 2, min: 1, step: 1, help: 'Lasur meist 2–3, Öl oft 2.' },
    { type: 'number', id: 'ergiebigkeit', label: 'Ergiebigkeit', unit: 'm²/l', default: 8, min: 0.1, step: 0.5, help: 'Reichweite je Liter und Anstrich laut Hersteller.' },
    { type: 'number', id: 'gebinde', label: 'Gebindegröße', unit: 'l', default: 2.5, min: 0.1, step: 0.25 },
  ],
  compute: (v) => {
    const flaeche = num(v.flaeche);
    const anstriche = num(v.anstriche);
    const ergiebigkeit = num(v.ergiebigkeit, 1);
    const gebinde = num(v.gebinde, 1);

    const liter = ergiebigkeit > 0 ? (flaeche * anstriche) / ergiebigkeit : 0;
    const gebindeAnzahl = gebinde > 0 ? Math.ceil(liter / gebinde) : 0;
    const literProAnstrich = ergiebigkeit > 0 ? flaeche / ergiebigkeit : 0;

    return [
      { label: 'Liter je Anstrich', value: literProAnstrich, unit: 'l', digits: 2 },
      { label: 'Gesamtbedarf', value: liter, unit: 'l', digits: 2, primary: true },
      { label: 'Benötigte Gebinde', value: gebindeAnzahl, unit: 'Stück', digits: 0 },
    ];
  },
  intro:
    'Dieser Rechner ermittelt, wie viel Lasur, Holzöl oder Wetterschutzfarbe du für ein Projekt brauchst. Der Bedarf folgt aus der zu streichenden Fläche, der Anzahl der Anstriche und der Ergiebigkeit, die der Hersteller in Quadratmetern je Liter und Anstrich angibt. Daraus berechnet das Tool die Gesamtliter und rundet auf ganze Gebinde auf, damit du beim Einkauf nicht mitten im Anstrich ohne Material dastehst.',
  howto: [
    'Zu streichende Fläche bestimmen – bei Profilbrettern und rauem Holz großzügig messen, da mehr Material aufgenommen wird.',
    'Anzahl der geplanten Anstriche eintragen (Lasuren brauchen oft 2–3, Öle meist 2).',
    'Ergiebigkeit in m²/l je Anstrich vom Etikett übernehmen und gewünschte Gebindegröße wählen.',
    'Gesamtbedarf und Gebindezahl ablesen und beim Kauf etwas Reserve einplanen.',
  ],
  faq: [
    {
      q: 'Wie finde ich die richtige Fläche bei Profilholz?',
      a: 'Bei genuteten oder profilierten Brettern ist die abgewickelte Oberfläche größer als das Grundmaß. Rechne pauschal 10–20 % mehr Fläche oder kalkuliere mit einer schlechteren Ergiebigkeit.',
    },
    {
      q: 'Warum schluckt der erste Anstrich mehr?',
      a: 'Rohes oder stark saugendes Holz nimmt beim Grundanstrich mehr Material auf. Die angegebene Durchschnittsergiebigkeit gleicht das über mehrere Anstriche aus; bei sehr saugenden Hölzern besser eine Reserve einplanen.',
    },
    {
      q: 'Gilt der Rechner auch für Holzöl?',
      a: 'Ja. Trage die Ergiebigkeit des Öls ein (oft 12–20 m²/l, da dünn aufgetragen) und die übliche Anzahl von zwei Aufträgen. Überschüssiges Öl muss nach kurzer Einwirkzeit abgewischt werden.',
    },
    {
      q: 'Wie viel Reserve sollte ich kaufen?',
      a: 'Plane rund 10 % zusätzlich ein, besonders bei rauem Sägeholz, Hirnholzkanten und Ecken. Reste sind später nützlich für Ausbesserungen, sofern das Gebinde dicht verschlossen bleibt.',
    },
  ],
  related: ['terrassendielen-bedarf', 'bretter-pro-quadratmeter', 'holzfeuchte-darrprobe'],
  updated: '2026-06-16',
  examples: [
    {
      values: { flaeche: 20, anstriche: 2, ergiebigkeit: 8, gebinde: 2.5 },
      expect: [
        { label: 'Liter je Anstrich', value: 2.5, tolerance: 0.01 },
        { label: 'Gesamtbedarf', value: 5, tolerance: 0.01 },
        { label: 'Benötigte Gebinde', value: 2, tolerance: 0 },
      ],
    },
  ],
};
