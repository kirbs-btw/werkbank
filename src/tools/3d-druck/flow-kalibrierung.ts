import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'flow-kalibrierung',
  category: '3d-druck',
  title: 'Flow-Kalibrierung (Durchfluss in %)',
  shortTitle: 'Flow-Kalibrierung',
  description:
    'Berechne den neuen Flow- bzw. Extrusionsmultiplikator aus Soll- und gemessener Wandstärke, um Über- oder Unterextrusion exakt auszugleichen.',
  keywords: [
    'flow kalibrierung 3d druck',
    'extrusionsmultiplikator berechnen',
    'flow rate prozent rechner',
    'wandstärke flow kalibrieren',
    'überextrusion korrigieren',
    'extrusion multiplier einstellen',
  ],
  formula: 'neuer Flow % = alter Flow % × (Soll-Wandstärke / gemessene Wandstärke)',
  inputs: [
    { type: 'number', id: 'altflow', label: 'Aktueller Flow', unit: '%', default: 100, min: 1, step: 0.1, help: 'Eingestellter Wert beim Testdruck.' },
    { type: 'number', id: 'soll', label: 'Soll-Wandstärke', unit: 'mm', default: 0.8, min: 0.01, step: 0.01, help: 'Im Slicer eingestellte Wandstärke.' },
    { type: 'number', id: 'gemessen', label: 'Gemessene Wandstärke', unit: 'mm', default: 0.85, min: 0.01, step: 0.01, help: 'Mittel aus mehreren Messungen.' },
  ],
  compute: (v) => {
    const alt = num(v.altflow);
    const soll = num(v.soll);
    const gem = num(v.gemessen);
    const neu = gem > 0 ? alt * (soll / gem) : 0;
    const abw = soll > 0 ? ((gem - soll) / soll) * 100 : 0;
    return [
      { label: 'Neuer Flow', value: neu, unit: '%', digits: 2, primary: true },
      { label: 'Abweichung der Wand', value: abw, unit: '%', digits: 2, help: 'Positiv = Überextrusion.' },
    ];
  },
  intro:
    'Die Flow-Kalibrierung gleicht aus, dass ein Extruder oft etwas mehr oder weniger Material fördert, als der Slicer berechnet. Dazu druckst du einen einwandigen Testwürfel, misst die tatsächliche Wandstärke mit dem Messschieber und vergleichst sie mit dem Sollwert. Der neue Flow ergibt sich proportional aus dem Verhältnis Soll zu Ist – so verschwinden Über- und Unterextrusion, und Maße sowie Oberflächen werden sauber.',
  howto: [
    'Einen Testwürfel mit genau einer Außenwand und 0 % Infill, ohne oben/unten, drucken (Wandstärke = z. B. 0,8 mm).',
    'Wandstärke an mehreren Stellen messen und den Mittelwert als gemessene Wandstärke eintragen.',
    'Aktuellen Flow-/Extrusionsmultiplikator (meist 100 %) sowie die Soll-Wandstärke angeben.',
    'Neuen Flow ins Slicer-Profil übernehmen und mit einem Kontrolldruck verifizieren.',
  ],
  faq: [
    { q: 'Was ist der Unterschied zu den E-Steps?', a: 'E-Steps kalibrieren die mechanische Förderung des Extruders (mm Filament). Der Flow ist die Feinkorrektur im Slicer für die tatsächlich gedruckte Materialmenge – E-Steps zuerst, dann Flow.' },
    { q: 'Warum eine einwandige Probe?', a: 'Bei nur einer Wand ist die Wandstärke direkt die Linienbreite. Abweichungen vom Soll zeigen unmittelbar die Über- oder Unterextrusion ohne Überlagerung mehrerer Bahnen.' },
    { q: 'Mein Flow weicht stark ab – ist das normal?', a: 'Kleine Korrekturen (95–105 %) sind üblich. Weicht der Wert weit ab, prüfe zuerst E-Steps, Düse und Filamentdurchmesser, sonst kaschiert der Flow ein anderes Problem.' },
    { q: 'Pro Filament neu kalibrieren?', a: 'Ja, sinnvoll: Verschiedene Materialien und Hersteller haben leicht andere Durchmesser und Schmelzverhalten, daher lohnt eine eigene Flow-Einstellung je Spule.' },
  ],
  related: ['e-steps-kalibrierung', 'linienbreite-rechner', 'max-volumenstrom'],
  updated: '2026-06-16',
  examples: [
    {
      values: { altflow: 100, soll: 0.8, gemessen: 0.85 },
      expect: [
        { label: 'Neuer Flow', value: 94.12, tolerance: 0.02 },
        { label: 'Abweichung der Wand', value: 6.25, tolerance: 0.02 },
      ],
    },
  ],
};
