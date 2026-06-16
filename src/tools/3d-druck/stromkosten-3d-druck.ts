import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'stromkosten-3d-druck',
  category: '3d-druck',
  title: 'Stromkosten 3D-Druck Rechner',
  shortTitle: 'Stromkosten',
  description: 'Berechne den Stromverbrauch und die Stromkosten eines 3D-Drucks aus Leistungsaufnahme, Druckzeit und Strompreis.',
  keywords: ['stromkosten 3d druck berechnen','stromverbrauch 3d drucker','3d druck kwh rechner'],
  formula: 'Verbrauch (kWh) = Leistung/1000 x Druckzeit; Kosten = Verbrauch x Strompreis',
  inputs: [
    { type:'number', id:'leistung', label:'Leistungsaufnahme', unit:'W', default:120, min:0, step:5, help:'Mittlere Leistung waehrend des Drucks.' },
    { type:'number', id:'druckzeit', label:'Druckzeit', unit:'h', default:8, min:0, step:0.25 },
    { type:'number', id:'strompreis', label:'Strompreis', unit:'EUR/kWh', default:0.35, min:0, step:0.01 },
  ],
  compute: (v) => {
    const leistung = num(v.leistung); const druckzeit = num(v.druckzeit); const strompreis = num(v.strompreis);
    const kwh = (leistung / 1000) * druckzeit;
    const kosten = kwh * strompreis;
    return [
      { label:'Stromverbrauch', value: kwh, unit:'kWh', digits:2 },
      { label:'Stromkosten', value: kosten, unit:'EUR', digits:2, primary:true },
    ];
  },
  intro: 'Strom ist neben dem Filament der zweite laufende Kostenfaktor. Mit Leistung und Druckzeit ermittelst du die Energiekosten je Druck.',
  howto: [
    'Mittlere Leistungsaufnahme des Druckers eintragen (Messsteckdose oder Datenblatt).',
    'Druckzeit aus dem Slicer in Stunden uebernehmen.',
    'Aktuellen Strompreis pro kWh eingeben.',
    'Verbrauch und Stromkosten ablesen.',
  ],
  faq: [
    { q:'Welche Leistung soll ich ansetzen?', a:'Den Mittelwert ueber den Druck; das beheizte Druckbett zieht zu Beginn am meisten, danach sinkt der Verbrauch.' },
    { q:'Ist das beheizte Bett enthalten?', a:'Ja, wenn du die gesamte Leistungsaufnahme inklusive Bett und Hotend ansetzt.' },
  ],
  related: ['filament-kosten','maschinenstundensatz-3d-druck','druckpreis-kalkulation'],
  updated: '2026-06-15',
  examples: [
    { values:{ leistung:120, druckzeit:8, strompreis:0.35 }, expect:[ { label:'Stromverbrauch', value:0.96, tolerance:0.01 }, { label:'Stromkosten', value:0.34, tolerance:0.01 } ] },
  ],
};
