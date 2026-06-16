import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'linienbreite-rechner',
  category: '3d-druck',
  title: 'Linienbreite-Rechner (Düse × Faktor)',
  shortTitle: 'Linienbreite',
  description:
    'Berechne die empfohlene Linienbreite aus dem Düsendurchmesser und einem Faktor und erhalte sinnvolle Minimal- und Maximalwerte für stabile Drucke.',
  keywords: [
    'linienbreite 3d druck berechnen',
    'line width düsendurchmesser',
    'extrusionsbreite rechner',
    'optimale linienbreite fdm',
    'düse 0.4 linienbreite',
    'extrusion width einstellen',
  ],
  formula: 'Linienbreite = Düsendurchmesser × Faktor (sinnvoll: 100–150 % des Düsendurchmessers)',
  inputs: [
    { type: 'number', id: 'duese', label: 'Düsendurchmesser', unit: 'mm', default: 0.4, min: 0.1, max: 2, step: 0.05 },
    { type: 'number', id: 'faktor', label: 'Faktor', unit: '×', default: 1.2, min: 0.5, max: 2, step: 0.05, help: 'Standard 1,0–1,2; bis 1,5 für mehr Festigkeit.' },
  ],
  compute: (v) => {
    const duese = num(v.duese);
    const faktor = num(v.faktor);
    const breite = duese * faktor;
    const minBreite = duese * 0.9;
    const maxBreite = duese * 1.5;
    return [
      { label: 'Empfohlene Linienbreite', value: breite, unit: 'mm', digits: 2, primary: true },
      { label: 'Sinnvolles Minimum', value: minBreite, unit: 'mm', digits: 2 },
      { label: 'Sinnvolles Maximum', value: maxBreite, unit: 'mm', digits: 2 },
    ];
  },
  intro:
    'Die Linienbreite (Extrusion Width) bestimmt, wie breit jede gedruckte Bahn ausgelegt wird – unabhängig vom physischen Düsendurchmesser. Üblicherweise setzt man sie auf das 1,0- bis 1,5-Fache der Düse: schmaler für feine Details, breiter für stärkere Wände und schnellere Drucke. Dieser Rechner liefert dir aus Düse und Faktor die empfohlene Breite sowie die sinnvollen Grenzen, in denen die Schichthaftung und Maßhaltigkeit zuverlässig bleiben.',
  howto: [
    'Düsendurchmesser deiner installierten Düse eintragen (meist 0,4 mm).',
    'Faktor wählen: 1,0–1,2 für Optik, 1,2–1,5 für Festigkeit und Tempo.',
    'Empfohlene Linienbreite in dein Slicer-Profil als Extrusionsbreite eintragen.',
    'Bei Bedarf zwischen Minimum und Maximum bleiben – außerhalb leidet Maßhaltigkeit oder Haftung.',
  ],
  faq: [
    { q: 'Warum kann die Linienbreite breiter als die Düse sein?', a: 'Geschmolzenes Filament wird leicht gequetscht und breitet sich aus. Bis etwa 150 % der Düse bleibt das Ergebnis stabil und sogar fester.' },
    { q: 'Welche Linienbreite ist am stabilsten?', a: 'Breitere Linien (1,2–1,5×) erhöhen die Wandfestigkeit und Schichthaftung, weil mehr Material verschmilzt und weniger Nähte entstehen.' },
    { q: 'Wann sollte ich schmaler drucken?', a: 'Für sehr feine Details, dünne Wände oder Texturen lohnt sich eine Linienbreite nahe oder unter dem Düsendurchmesser (ca. 0,9×).' },
    { q: 'Beeinflusst die Linienbreite die Druckzeit?', a: 'Ja deutlich: Breitere Linien füllen Wände und Infill mit weniger Bahnen, das spart spürbar Zeit – auf Kosten der Detailtreue.' },
  ],
  related: ['max-volumenstrom', 'schichtanzahl-rechner', 'duesen-druckgeschwindigkeit'],
  updated: '2026-06-16',
  examples: [
    {
      values: { duese: 0.4, faktor: 1.2 },
      expect: [
        { label: 'Empfohlene Linienbreite', value: 0.48, tolerance: 0.001 },
        { label: 'Sinnvolles Minimum', value: 0.36, tolerance: 0.001 },
        { label: 'Sinnvolles Maximum', value: 0.6, tolerance: 0.001 },
      ],
    },
  ],
};
