import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'e-steps-kalibrierung',
  category: '3d-druck',
  title: 'E-Steps Kalibrierung (3D-Drucker)',
  shortTitle: 'E-Steps Rechner',
  description: 'Kalibriere die E-Steps deines Extruders: berechne aus Soll- und Ist-Extrusion den neuen E-Steps-Wert und die Abweichung.',
  keywords: ['e-steps kalibrierung','extruder kalibrieren rechner','esteps berechnen 3d drucker'],
  formula: 'neue E-Steps = alte E-Steps x (Soll / gemessen)',
  inputs: [
    { type:'number', id:'alt', label:'Aktuelle E-Steps', unit:'Schritte/mm', default:93, min:0, step:0.01 },
    { type:'number', id:'soll', label:'Soll-Extrusion', unit:'mm', default:100, min:0, step:1, help:'Meist 100 mm vorgeschoben.' },
    { type:'number', id:'gemessen', label:'Tatsaechlich extrudiert', unit:'mm', default:97, min:0.01, step:0.1 },
  ],
  compute: (v) => {
    const alt = num(v.alt); const soll = num(v.soll); const gem = num(v.gemessen);
    const neu = gem > 0 ? alt * (soll / gem) : 0;
    const abw = gem > 0 ? ((soll - gem) / gem) * 100 : 0;
    return [
      { label:'Neue E-Steps', value: neu, unit:'Schritte/mm', digits:2, primary:true },
      { label:'Abweichung', value: abw, unit:'%', digits:2 },
    ];
  },
  intro: 'Markiere 100 mm Filament ueber dem Extruder, schiebe 100 mm vor und miss den Rest, um die E-Steps exakt einzustellen.',
  howto: [
    'Aktuellen E-Steps-Wert aus dem Drucker (M503) ablesen und eintragen.',
    'Soll-Extrusion eingeben (Standard 100 mm).',
    'Markierung anbringen, vorschieben, Restmass messen und als tatsaechlich extrudiert eintragen.',
    'Neuen Wert per M92 setzen und mit M500 speichern.',
  ],
  faq: [
    { q:'Warum 100 mm vorschieben?', a:'Ein groesserer Vorschub verringert den Messfehler und liefert genauere E-Steps.' },
    { q:'Wie speichere ich den neuen Wert?', a:'Mit M92 E<Wert> setzen und mit M500 dauerhaft im EEPROM sichern.' },
  ],
  related: ['schwund-kompensation'],
  updated: '2026-06-15',
  examples: [
    { values:{ alt:93, soll:100, gemessen:97 }, expect:[ { label:'Neue E-Steps', value:95.88, tolerance:0.01 }, { label:'Abweichung', value:3.09, tolerance:0.01 } ] },
  ],
};
