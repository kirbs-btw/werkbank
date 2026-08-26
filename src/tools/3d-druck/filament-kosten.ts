import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'filament-kosten',
  category: '3d-druck',
  title: 'Filament-Kosten-Rechner',
  shortTitle: 'Filamentkosten',
  description:
    'Berechne Material- und Stromkosten deines 3D-Drucks aus Gewicht, Filamentpreis und Druckzeit.',
  keywords: [
    'filament kosten rechner',
    '3d druck kosten berechnen',
    'filament preis pro kg',
    'druckkosten 3d drucker',
  ],
  formula:
    'Material = Gewicht/1000 × Preis/kg · Strom = Druckzeit × Leistung/1000 × Strompreis',
  inputs: [
    { type: 'number', id: 'gewicht', label: 'Druckgewicht', unit: 'g', default: 50, min: 0, step: 1 },
    { type: 'number', id: 'preis', label: 'Filamentpreis', unit: '€/kg', default: 22, min: 0, step: 0.5 },
    { type: 'number', id: 'zeit', label: 'Druckzeit', unit: 'h', default: 4, min: 0, step: 0.25 },
    {
      type: 'number', id: 'leistung', label: 'Druckerleistung', unit: 'W', default: 120, min: 0, step: 5,
      help: 'Durchschnittliche Leistungsaufnahme',
    },
    { type: 'number', id: 'strompreis', label: 'Strompreis', unit: '€/kWh', default: 0.35, min: 0, step: 0.01 },
  ],
  compute: (v) => {
    const g = num(v.gewicht);
    const p = num(v.preis);
    const zeit = num(v.zeit);
    const leistung = num(v.leistung);
    const strom = num(v.strompreis);
    const material = (g / 1000) * p;
    const stromkosten = zeit * (leistung / 1000) * strom;
    const gesamt = material + stromkosten;
    return [
      { label: 'Materialkosten', value: material, unit: '€', digits: 2 },
      { label: 'Stromkosten', value: stromkosten, unit: '€', digits: 2 },
      { label: 'Gesamtkosten', value: gesamt, unit: '€', digits: 2, primary: true },
    ];
  },
  intro:
    'Die Kosten eines Drucks bestehen aus zwei sehr ungleichen Teilen. Das Material dominiert fast immer: Ein 50-Gramm-Druck kostet bei 22 €/kg gut einen Euro, der Strom für vier Stunden bei 120 W dagegen nur rund 17 Cent. Erst bei langen Drucken mit beheiztem Bett und geschlossener Kammer verschiebt sich das Verhältnis spürbar. Nicht enthalten sind Abschreibung des Druckers, Düsenverschleiß und – oft der größte Posten – fehlgeschlagene Drucke. Wer für andere druckt, schlägt darauf noch einen Aufschlag.',
  howto: [
    'Druckgewicht aus dem Slicer (Cura, PrusaSlicer, OrcaSlicer) in Gramm übernehmen.',
    'Filamentpreis pro Kilogramm eintragen.',
    'Druckzeit, Druckerleistung und Strompreis für die Stromkosten ergänzen.',
  ],
  faq: [
    {
      q: 'Wie finde ich das Druckgewicht heraus?',
      a: 'Dein Slicer zeigt nach dem Slicen das benötigte Filamentgewicht in Gramm an – diesen Wert hier eintragen.',
    },
    {
      q: 'Welche Druckerleistung soll ich angeben?',
      a: 'Kleine FDM-Drucker liegen oft bei 80–150 W. Ein beheiztes Druckbett erhöht den Durchschnitt deutlich.',
    },
  ],
  related: ['filament-gewicht'],
  updated: '2026-08-26',
  examples: [
    {
      values: { gewicht: 50, preis: 22, zeit: 4, leistung: 120, strompreis: 0.35 },
      expect: [
        { label: 'Materialkosten', value: 1.1, tolerance: 0.01 },
        { label: 'Gesamtkosten', value: 1.268, tolerance: 0.01 },
      ],
    },
  ],
};
