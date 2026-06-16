import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'modell-gewicht',
  category: '3d-druck',
  title: '3D-Druck Modellgewicht aus Volumen',
  shortTitle: 'Modellgewicht',
  description: 'Schaetze das Druckgewicht deines Modells aus dem Bauteilvolumen, dem Material und dem gewaehlten Infill in Gramm.',
  keywords: ['3d druck gewicht berechnen','modellgewicht aus volumen','filament verbrauch schaetzen'],
  formula: 'Gewicht (g) = Volumen (cm3) x Dichte (g/cm3) x Infill/100',
  inputs: [
    { type:'number', id:'volumen', label:'Modellvolumen', unit:'cm3', default:20, min:0, step:0.1, help:'Volumen des Vollkoerpers, z. B. aus dem CAD.' },
    { type:'select', id:'material', label:'Material', default:'1.24', options:[ {value:'1.24',label:'PLA (1,24 g/cm3)'}, {value:'1.27',label:'PETG (1,27 g/cm3)'}, {value:'1.04',label:'ABS (1,04 g/cm3)'} ] },
    { type:'number', id:'infill', label:'Fuellgrad (Infill)', unit:'%', default:20, min:0, max:100, step:5 },
  ],
  compute: (v) => {
    const vol = num(v.volumen); const dichte = num(v.material); const infill = num(v.infill);
    const gewicht = vol * dichte * (infill / 100);
    return [
      { label:'Geschaetztes Gewicht', value: gewicht, unit:'g', digits:1, primary:true },
    ];
  },
  intro: 'Eine schnelle Abschaetzung des Druckgewichts hilft, Materialbedarf und Kosten vor dem Slicen einzuordnen.',
  howto: [
    'Volumen des Vollkoerpers aus dem CAD oder Slicer in cm3 eintragen.',
    'Material auswaehlen, die Dichte wird automatisch verwendet.',
    'Geplanten Infill in Prozent angeben.',
    'Geschaetztes Gewicht ablesen.',
  ],
  faq: [
    { q:'Warum weicht die Schaetzung vom Slicer ab?', a:'Diese Naeherung beruecksichtigt Waende und Top-/Bottom-Layer nicht; bei duennen Teilen liegt der reale Wert hoeher.' },
    { q:'Wie komme ich an das Volumen?', a:'CAD-Programme zeigen das Volumen direkt an, viele Slicer auch nach dem Laden des Modells.' },
  ],
  related: ['filament-kosten','filament-restmenge'],
  updated: '2026-06-15',
  examples: [
    { values:{ volumen:20, material:'1.24', infill:20 }, expect:[ { label:'Geschaetztes Gewicht', value:4.96, tolerance:0.01 } ] },
  ],
};
