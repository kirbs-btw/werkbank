import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schwund-kompensation',
  category: '3d-druck',
  title: 'Schwund-Kompensation (Skalierung)',
  shortTitle: 'Schwund-Skalierung',
  description: 'Gleiche den Materialschwund deines 3D-Drucks aus: berechne den nötigen Skalierungsfaktor und das vergrößerte Modellmaß.',
  keywords: ['schwund 3d druck ausgleichen','skalierung schwund rechner','schrumpfung filament kompensieren'],
  formula: 'Faktor = 100 / (100 - Schwund); Korrigiertes Maß = Sollmaß x Faktor',
  inputs: [
    { type:'number', id:'sollmass', label:'Sollmaß (Zielgröße)', unit:'mm', default:100, min:0, step:0.1 },
    { type:'number', id:'schwund', label:'Materialschwund', unit:'%', default:0.4, min:0, max:99, step:0.1, help:'PLA ca. 0,2-0,5 %, ABS ca. 0,5-0,8 %.' },
  ],
  compute: (v) => {
    const soll = num(v.sollmass); const schwund = num(v.schwund);
    const faktor = (100 - schwund) !== 0 ? 100 / (100 - schwund) : 0;
    const skalierung = faktor * 100;
    const korr = soll * faktor;
    return [
      { label:'Skalierung im Slicer', value: skalierung, unit:'%', digits:3 },
      { label:'Korrigiertes Maß', value: korr, unit:'mm', digits:3, primary:true },
    ];
  },
  intro: 'Kunststoffe schrumpfen beim Abkühlen. Vergrößere das Modell vorab, damit das fertige Teil exakt auf Maß liegt.',
  howto: [
    'Gewünschtes Endmaß (Sollmaß) des Bauteils eintragen.',
    'Gemessenen oder erwarteten Schwund in Prozent eingeben.',
    'Modell im Slicer auf den berechneten Prozentwert skalieren.',
    'Probedruck messen und Schwundwert bei Bedarf nachjustieren.',
  ],
  faq: [
    { q:'Woher kenne ich den Schwund?', a:'Drucke einen Würfel mit bekanntem Maß, miss ihn und berechne Schwund = (Soll - Ist) / Soll x 100.' },
    { q:'Gilt der Faktor in alle Richtungen?', a:'Näherungsweise ja; bei stark anisotropem Schwund kannst du X/Y und Z getrennt skalieren.' },
  ],
  related: ['e-steps-kalibrierung','modell-gewicht'],
  updated: '2026-08-27',
  examples: [
    { values:{ sollmass:100, schwund:0.4 }, expect:[ { label:'Skalierung im Slicer', value:100.402, tolerance:0.01 }, { label:'Korrigiertes Maß', value:100.402, tolerance:0.01 } ] },
  ],
};
