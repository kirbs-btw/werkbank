import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'druckpreis-kalkulation',
  category: '3d-druck',
  title: '3D-Druck Verkaufspreis-Kalkulation',
  shortTitle: 'Druckpreis',
  description: 'Kalkuliere den Verkaufspreis für 3D-Drucke aus Material, Maschinenstundensatz, Arbeitslohn und gewünschter Gewinnmarge.',
  keywords: ['3d druck preis kalkulieren','3d druck verkaufspreis berechnen','kalkulation 3d druck auftrag'],
  formula: 'Selbstkosten = Material + Maschinensatz x Druckzeit + Lohn x (Arbeitszeit/60); Verkaufspreis = Selbstkosten x (1 + Marge/100)',
  inputs: [
    { type:'number', id:'material', label:'Materialkosten', unit:'EUR', default:2, min:0, step:0.1 },
    { type:'number', id:'maschinensatz', label:'Maschinenstundensatz', unit:'EUR/h', default:1.5, min:0, step:0.1 },
    { type:'number', id:'druckzeit', label:'Druckzeit', unit:'h', default:5, min:0, step:0.25 },
    { type:'number', id:'arbeitszeit', label:'Arbeitszeit (Vor-/Nachbereitung)', unit:'min', default:15, min:0, step:1 },
    { type:'number', id:'lohn', label:'Arbeitslohn', unit:'EUR/h', default:30, min:0, step:1 },
    { type:'number', id:'marge', label:'Gewinnmarge', unit:'%', default:50, min:0, step:1 },
  ],
  compute: (v) => {
    const material = num(v.material); const msh = num(v.maschinensatz); const druckzeit = num(v.druckzeit);
    const arbeitszeit = num(v.arbeitszeit); const lohn = num(v.lohn); const marge = num(v.marge);
    const selbst = material + msh * druckzeit + lohn * (arbeitszeit / 60);
    const verkauf = selbst * (1 + marge / 100);
    return [
      { label:'Selbstkosten', value: selbst, unit:'EUR', digits:2 },
      { label:'Verkaufspreis', value: verkauf, unit:'EUR', digits:2, primary:true },
    ];
  },
  intro: 'Setze einen fairen Preis für Auftragsdrucke an, indem du alle Kostenpositionen erfasst und deine gewünschte Marge aufschlägst.',
  howto: [
    'Materialkosten des Drucks (z. B. aus dem Filamentrechner) eintragen.',
    'Maschinenstundensatz und Druckzeit angeben.',
    'Arbeitszeit für Slicen, Entfernen und Nacharbeit sowie deinen Stundenlohn eintragen.',
    'Gewünschte Marge wählen und Verkaufspreis ablesen.',
  ],
  faq: [
    { q:'Ist die Mehrwertsteuer enthalten?', a:'Nein, der Verkaufspreis ist netto. Rechne für Endkunden die gültige Umsatzsteuer obendrauf.' },
    { q:'Was gehört in die Marge?', a:'Die Marge deckt Risiko, Fehldrucke und Gewinn ab; 30 bis 100 Prozent sind im Hobby- und Kleingewerbe üblich.' },
  ],
  related: ['maschinenstundensatz-3d-druck','filament-kosten'],
  updated: '2026-08-27',
  examples: [
    { values:{ material:2, maschinensatz:1.5, druckzeit:5, arbeitszeit:15, lohn:30, marge:50 }, expect:[ { label:'Selbstkosten', value:17, tolerance:0.01 }, { label:'Verkaufspreis', value:25.5, tolerance:0.01 } ] },
  ],
};
