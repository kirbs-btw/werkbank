import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'temperatur-tower',
  category: '3d-druck',
  title: 'Temperatur-Tower Rechner (Temp Tower)',
  shortTitle: 'Temp Tower',
  description: 'Plane deinen Temperatur-Tower: berechne die Anzahl der Abschnitte und die Gesamthoehe aus Start-, Endtemperatur und Schrittweite.',
  keywords: ['temperatur tower 3d druck','temp tower rechner','drucktemperatur kalibrieren'],
  formula: 'Abschnitte = (Ende - Start)/Schritt + 1; Gesamthoehe = Abschnitte x Hoehe pro Abschnitt',
  inputs: [
    { type:'number', id:'start', label:'Starttemperatur (unten)', unit:'C', default:190, min:0, step:1 },
    { type:'number', id:'ende', label:'Endtemperatur (oben)', unit:'C', default:220, min:0, step:1 },
    { type:'number', id:'schritt', label:'Temperaturschritt', unit:'C', default:5, min:1, step:1 },
    { type:'number', id:'hoehe', label:'Hoehe pro Abschnitt', unit:'mm', default:10, min:0.1, step:0.5 },
  ],
  compute: (v) => {
    const start = num(v.start); const ende = num(v.ende); const schritt = num(v.schritt); const hoehe = num(v.hoehe);
    const abschnitte = schritt > 0 ? Math.max(0, Math.floor((ende - start) / schritt) + 1) : 0;
    const gesamthoehe = abschnitte * hoehe;
    const endtemp = abschnitte > 0 ? start + (abschnitte - 1) * schritt : start;
    return [
      { label:'Anzahl Abschnitte', value: abschnitte, unit:'', digits:0 },
      { label:'Tatsächliche Endtemperatur', value: endtemp, unit:'°C', digits:0 },
      { label:'Gesamthoehe', value: gesamthoehe, unit:'mm', digits:1, primary:true },
    ];
  },
  intro: 'Ein Temperatur-Tower findet die beste Drucktemperatur fuer dein Filament. Hier planst du Abschnitte und Gesamthoehe vor dem Slicen.',
  howto: [
    'Start- und Endtemperatur des Filaments aus dem Datenblatt waehlen.',
    'Temperaturschritt je Abschnitt festlegen (typisch 5 C).',
    'Hoehe pro Abschnitt eintragen und im Slicer per Temperaturwechsel pro Schicht umsetzen.',
    'Tower drucken und den saubersten Abschnitt als Zieltemperatur uebernehmen.',
  ],
  faq: [
    { q:'Welche Schrittweite ist sinnvoll?', a:'5 C ist Standard; fuer feinere Abstimmung kannst du 2-3 C waehlen.' },
    { q:'Wie aendere ich die Temperatur je Abschnitt?', a:'Ueber einen Z-Hoehen-bezogenen Skript- oder M104-Befehl im Slicer (z. B. PrusaSlicer Custom G-code).' },
  ],
  related: ['e-steps-kalibrierung','schwund-kompensation'],
  updated: '2026-06-15',
  examples: [
    { values:{ start:190, ende:220, schritt:5, hoehe:10 }, expect:[ { label:'Anzahl Abschnitte', value:7, tolerance:0 }, { label:'Gesamthoehe', value:70, tolerance:0.01 } ] },
  ],
};
