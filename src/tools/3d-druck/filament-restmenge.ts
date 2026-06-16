import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'filament-restmenge',
  category: '3d-druck',
  title: 'Filament-Restmenge auf der Spule',
  shortTitle: 'Restfilament',
  description: 'Berechne aus dem aktuellen Gewicht der Spule die verbleibende Filamentmenge in Gramm und die Restlaenge in Metern.',
  keywords: ['filament restmenge berechnen','wie viel filament auf spule','restlaenge filament rechner'],
  formula: 'Restgewicht = Brutto - Leergewicht; Laenge = (Restgewicht/Dichte) / (PI x (d/20)^2)',
  inputs: [
    { type:'number', id:'brutto', label:'Aktuelles Gesamtgewicht', unit:'g', default:1000, min:0, step:1, help:'Spule inklusive Restfilament wiegen.' },
    { type:'number', id:'leer', label:'Leergewicht der Spule', unit:'g', default:230, min:0, step:1 },
    { type:'select', id:'durchmesser', label:'Filamentdurchmesser', default:'1.75', unit:'mm', options:[ {value:'1.75',label:'1,75 mm'}, {value:'2.85',label:'2,85 mm'} ] },
    { type:'select', id:'material', label:'Material', default:'1.24', options:[ {value:'1.24',label:'PLA (1,24 g/cm3)'}, {value:'1.27',label:'PETG (1,27 g/cm3)'}, {value:'1.04',label:'ABS (1,04 g/cm3)'} ] },
  ],
  compute: (v) => {
    const brutto = num(v.brutto); const leer = num(v.leer);
    const d = num(v.durchmesser); const dichte = num(v.material);
    const rest = Math.max(0, brutto - leer);
    const volCm3 = dichte > 0 ? rest / dichte : 0;
    const areaCm2 = Math.PI * Math.pow(d / 20, 2);
    const laengeCm = areaCm2 > 0 ? volCm3 / areaCm2 : 0;
    const meter = laengeCm / 100;
    return [
      { label:'Restgewicht', value: rest, unit:'g', digits:0 },
      { label:'Restlaenge', value: meter, unit:'m', digits:1, primary:true },
    ];
  },
  intro: 'Wiege die ganze Spule, ziehe das Leergewicht ab und sieh, wie viel Filament fuer das naechste Projekt noch reicht.',
  howto: [
    'Komplette Spule auf einer Kuechenwaage wiegen und als Gesamtgewicht eintragen.',
    'Leergewicht der Spule aus dem Datenblatt oder vom Aufdruck uebernehmen.',
    'Durchmesser und Material auswaehlen.',
    'Restgewicht und Restlaenge ablesen.',
  ],
  faq: [
    { q:'Woher kenne ich das Leergewicht der Spule?', a:'Viele Hersteller drucken es auf die Spule; alternativ eine identische leere Spule wiegen.' },
    { q:'Stimmt die Restlaenge exakt?', a:'Sie ist sehr genau, kleine Abweichungen entstehen durch Durchmessertoleranzen und Materialdichte.' },
  ],
  related: ['modell-gewicht','filament-kosten'],
  updated: '2026-06-15',
  examples: [
    { values:{ brutto:1000, leer:230, durchmesser:'1.75', material:'1.24' }, expect:[ { label:'Restgewicht', value:770, tolerance:0.5 }, { label:'Restlaenge', value:258.2, tolerance:0.3 } ] },
  ],
};
