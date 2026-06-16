import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'stuetzmaterial-anteil',
  category: '3d-druck',
  title: 'Stützmaterial-Anteil & -Kosten',
  shortTitle: 'Stützmaterial',
  description:
    'Berechne aus Modell- und Stützgewicht den prozentualen Stützanteil sowie die Materialkosten der Stützstrukturen, die nach dem Druck im Abfall landen.',
  keywords: [
    'stützmaterial anteil berechnen',
    'support kosten 3d druck',
    'stützstruktur gewicht prozent',
    'wie viel filament für stützen',
    'support material verbrauch',
    'stützen filament kosten',
  ],
  formula: 'Stützanteil % = Stützgewicht / (Modell + Stütze) × 100; Stützkosten = Stützgewicht/1000 × Preis/kg',
  inputs: [
    { type: 'number', id: 'modell', label: 'Modellgewicht', unit: 'g', default: 48, min: 0, step: 1, help: 'Reines Bauteil ohne Stützen.' },
    { type: 'number', id: 'stuetze', label: 'Stützgewicht', unit: 'g', default: 12, min: 0, step: 1, help: 'Support-Anteil aus dem Slicer.' },
    { type: 'number', id: 'preis', label: 'Filamentpreis', unit: '€/kg', default: 25, min: 0, step: 0.5 },
  ],
  compute: (v) => {
    const modell = num(v.modell);
    const stuetze = num(v.stuetze);
    const preis = num(v.preis);
    const gesamt = modell + stuetze;
    const anteil = gesamt > 0 ? (stuetze / gesamt) * 100 : 0;
    const stuetzkosten = (stuetze / 1000) * preis;
    const gesamtkosten = (gesamt / 1000) * preis;
    return [
      { label: 'Stützanteil', value: anteil, unit: '%', digits: 1, primary: true },
      { label: 'Stützkosten (Verschnitt)', value: stuetzkosten, unit: '€', digits: 2 },
      { label: 'Gesamtmaterialkosten', value: gesamtkosten, unit: '€', digits: 2 },
    ];
  },
  intro:
    'Stützstrukturen tragen überhängende Modellbereiche während des Drucks, werden danach aber entfernt und weggeworfen – sie sind reiner Materialverlust. Dieser Rechner ermittelt aus dem Modell- und dem Stützgewicht den prozentualen Stützanteil und beziffert die Kosten dieses Verschnitts. Das hilft zu entscheiden, ob sich eine andere Bauteilorientierung, weniger Support oder lösliches Stützmaterial lohnt.',
  howto: [
    'Modellgewicht und Stützgewicht getrennt aus dem Slicer ablesen (PrusaSlicer und OrcaSlicer zeigen den Support separat).',
    'Filamentpreis pro Kilogramm eintragen.',
    'Stützanteil prüfen: Über 20–25 % lohnt es sich, die Ausrichtung oder Überhang-Schwellen zu optimieren.',
    'Stützkosten als reinen Verschnitt in deine Preiskalkulation einplanen.',
  ],
  faq: [
    { q: 'Ab welchem Anteil sollte ich umorientieren?', a: 'Faustregel: Liegt der Stützanteil über etwa 20–25 %, lohnt sich oft eine andere Druckausrichtung, ein Schnitt des Modells oder ein angepasster Überhangwinkel.' },
    { q: 'Zählt das Stützmaterial zur Druckzeit?', a: 'Ja, Stützen kosten zusätzlich Zeit und Material. Ihr Gewicht steckt im Gesamtverbrauch; dieser Rechner trennt es als entfernbaren Verschnitt heraus.' },
    { q: 'Was bringt lösliches Stützmaterial (PVA/HIPS)?', a: 'Es erlaubt saubere Oberflächen bei komplexen Überhängen, ist aber teurer und braucht einen zweiten Extruder. Die Kostenseite zeigt dir der Verschnittwert.' },
    { q: 'Wie reduziere ich den Stützanteil?', a: 'Durch günstigere Ausrichtung, höheren erlaubten Überhangwinkel (50–60°), Baumstützen statt Gitter und das Auftrennen des Modells in stützfreie Teile.' },
  ],
  related: ['modell-gewicht', 'druckpreis-kalkulation', 'filament-kosten'],
  updated: '2026-06-16',
  examples: [
    {
      values: { modell: 48, stuetze: 12, preis: 25 },
      expect: [
        { label: 'Stützanteil', value: 20.0, tolerance: 0.1 },
        { label: 'Stützkosten (Verschnitt)', value: 0.3, tolerance: 0.01 },
        { label: 'Gesamtmaterialkosten', value: 1.5, tolerance: 0.01 },
      ],
    },
  ],
};
