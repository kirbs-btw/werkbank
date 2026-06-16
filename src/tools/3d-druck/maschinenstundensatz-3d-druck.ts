import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'maschinenstundensatz-3d-druck',
  category: '3d-druck',
  title: 'Maschinenstundensatz 3D-Drucker',
  shortTitle: 'Maschinensatz',
  description: 'Berechne den Maschinenstundensatz deines 3D-Druckers aus Anschaffung, Wartung und Stromverbrauch als Basis fuer deine Preise.',
  keywords: ['maschinenstundensatz 3d drucker','stundensatz 3d druck berechnen','3d drucker betriebskosten pro stunde'],
  formula: 'Stundensatz = Anschaffung/Nutzungsdauer + Wartung/Drucke + (Leistung/1000) x Strompreis',
  inputs: [
    { type:'number', id:'anschaffung', label:'Anschaffungskosten', unit:'EUR', default:500, min:0, step:10 },
    { type:'number', id:'nutzungsdauer', label:'Erwartete Nutzungsdauer', unit:'h', default:2000, min:1, step:100, help:'Gesamte Druckstunden bis zur Abschreibung.' },
    { type:'number', id:'wartung', label:'Wartungskosten pro Jahr', unit:'EUR/Jahr', default:50, min:0, step:5 },
    { type:'number', id:'druckstunden', label:'Druckstunden pro Jahr', unit:'h/Jahr', default:500, min:1, step:10 },
    { type:'number', id:'leistung', label:'Leistungsaufnahme', unit:'W', default:120, min:0, step:5 },
    { type:'number', id:'strompreis', label:'Strompreis', unit:'EUR/kWh', default:0.35, min:0, step:0.01 },
  ],
  compute: (v) => {
    const anschaffung = num(v.anschaffung); const nutzung = num(v.nutzungsdauer);
    const wartung = num(v.wartung); const druckstunden = num(v.druckstunden);
    const leistung = num(v.leistung); const strompreis = num(v.strompreis);
    const abschreibung = nutzung > 0 ? anschaffung / nutzung : 0;
    const wartungProH = druckstunden > 0 ? wartung / druckstunden : 0;
    const stromProH = (leistung / 1000) * strompreis;
    const satz = abschreibung + wartungProH + stromProH;
    return [
      { label:'Maschinenstundensatz', value: satz, unit:'EUR/h', digits:2, primary:true },
    ];
  },
  intro: 'Der Maschinenstundensatz bildet die laufenden Kosten je Druckstunde ab und ist die Grundlage fuer eine saubere Auftragskalkulation.',
  howto: [
    'Anschaffungskosten und die erwartete Lebensdauer in Druckstunden eintragen.',
    'Jaehrliche Wartungskosten sowie die jaehrlichen Druckstunden angeben.',
    'Leistungsaufnahme des Druckers und deinen Strompreis eingeben.',
    'Den Maschinenstundensatz in die Druckpreis-Kalkulation uebernehmen.',
  ],
  faq: [
    { q:'Was zaehlt zu den Wartungskosten?', a:'Duesen, Druckbett, Riemen, Schmiermittel und Ersatzteile, die regelmaessig anfallen.' },
    { q:'Warum ist der Satz so niedrig?', a:'Bei Hobbygeraeten dominieren die Stromkosten; teurere Profimaschinen erreichen deutlich hoehere Saetze.' },
  ],
  related: ['druckpreis-kalkulation','filament-kosten'],
  updated: '2026-06-15',
  examples: [
    { values:{ anschaffung:500, nutzungsdauer:2000, wartung:50, druckstunden:500, leistung:120, strompreis:0.35 }, expect:[ { label:'Maschinenstundensatz', value:0.39, tolerance:0.01 } ] },
  ],
};
