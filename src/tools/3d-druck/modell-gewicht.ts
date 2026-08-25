import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'modell-gewicht',
  category: '3d-druck',
  title: '3D-Druck Modellgewicht aus Volumen',
  shortTitle: 'Modellgewicht',
  description:
    'Schätze das Druckgewicht deines Modells aus dem Bauteilvolumen, dem Material und dem gewählten Infill in Gramm.',
  keywords: [
    '3d druck gewicht berechnen',
    'modellgewicht aus volumen',
    'filament verbrauch schätzen',
    'druckgewicht berechnen infill',
  ],
  formula: 'Gewicht (g) = Volumen (cm³) × Dichte (g/cm³) × Infill/100',
  inputs: [
    { type: 'number', id: 'volumen', label: 'Modellvolumen', unit: 'cm³', default: 20, min: 0, step: 0.1, help: 'Volumen des Vollkörpers, z. B. aus dem CAD.' },
    {
      type: 'select', id: 'material', label: 'Material', default: '1.24',
      options: [
        { value: '1.24', label: 'PLA (1,24 g/cm³)' },
        { value: '1.27', label: 'PETG (1,27 g/cm³)' },
        { value: '1.04', label: 'ABS (1,04 g/cm³)' },
      ],
    },
    { type: 'number', id: 'infill', label: 'Füllgrad (Infill)', unit: '%', default: 20, min: 0, max: 100, step: 5 },
  ],
  compute: (v) => {
    const vol = num(v.volumen);
    const dichte = num(v.material);
    const infill = num(v.infill);
    const gewicht = vol * dichte * (infill / 100);
    return [{ label: 'Geschätztes Gewicht', value: gewicht, unit: 'g', digits: 1, primary: true }];
  },
  intro:
    'Eine schnelle Abschätzung des Druckgewichts hilft, Materialbedarf und Kosten schon vor dem Slicen einzuordnen. Wenn du das Volumen nicht kennst, liest die <a href="/generatoren/stl-analyse">STL-Analyse</a> es direkt aus deiner Datei aus – inklusive Oberfläche, Abmessungen und Materialkosten.',
  howto: [
    'Volumen des Vollkörpers aus dem CAD oder Slicer in cm³ eintragen.',
    'Material auswählen, die Dichte wird automatisch verwendet.',
    'Geplanten Infill in Prozent angeben.',
    'Geschätztes Gewicht ablesen.',
  ],
  faq: [
    {
      q: 'Warum weicht die Schätzung vom Slicer ab?',
      a: 'Diese Näherung berücksichtigt Wände sowie Deck- und Bodenschichten nicht; bei dünnwandigen Teilen liegt der reale Wert deutlich höher, weil dort fast nur Perimeter gedruckt werden.',
    },
    {
      q: 'Wie komme ich an das Volumen?',
      a: 'CAD-Programme zeigen das Volumen direkt an, viele Slicer ebenfalls nach dem Laden des Modells. Hast du nur die STL-Datei, ermittelt die STL-Analyse das Volumen in Sekunden im Browser – die Datei wird dabei nicht hochgeladen.',
    },
  ],
  related: ['filament-kosten', 'filament-restmenge', 'druckpreis-kalkulation'],
  updated: '2026-08-25',
  examples: [
    {
      values: { volumen: 20, material: '1.24', infill: 20 },
      expect: [{ label: 'Geschätztes Gewicht', value: 4.96, tolerance: 0.01 }],
    },
  ],
};
