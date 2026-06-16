import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Richtwerte für einen CO2-Laser mittlerer Leistung (Vollformat). Leistung als % der
// Maximalleistung, Geschwindigkeit in mm/s, je Material grob proportional zur Dicke.
const MATERIAL: Record<string, { name: string; basisSpeed: number; basisDicke: number; basisLeistung: number; faktorLeistung: number }> = {
  // basisSpeed bei basisDicke (mm); Geschwindigkeit ~ umgekehrt proportional zur Dicke
  sperrholz: { name: 'Sperrholz / Pappel', basisSpeed: 18, basisDicke: 3, basisLeistung: 55, faktorLeistung: 12 },
  mdf: { name: 'MDF', basisSpeed: 14, basisDicke: 3, basisLeistung: 65, faktorLeistung: 12 },
  acryl: { name: 'Acryl (PMMA)', basisSpeed: 16, basisDicke: 3, basisLeistung: 60, faktorLeistung: 11 },
  papier: { name: 'Karton / Papier', basisSpeed: 60, basisDicke: 1, basisLeistung: 20, faktorLeistung: 8 },
  leder: { name: 'Leder', basisSpeed: 30, basisDicke: 2, basisLeistung: 40, faktorLeistung: 10 },
};

export const tool: Tool = {
  slug: 'laser-einstellung-material',
  category: 'laser',
  title: 'Laser-Einstellungen Rechner (Material & Dicke)',
  shortTitle: 'Einstellungen',
  description:
    'Erhalte Richtwerte für Laserleistung und Schnittgeschwindigkeit nach Material und Materialdicke – als Startpunkt für den eigenen Testschnitt.',
  keywords: [
    'laser einstellungen material',
    'laserleistung geschwindigkeit tabelle',
    'co2 laser einstellungen sperrholz',
    'acryl laser schneiden einstellungen',
    'laser parameter materialdicke',
    'laser leistung berechnen',
    'mdf laser schneiden werte',
  ],
  formula:
    'Geschwindigkeit ≈ Basis-Speed × (Basis-Dicke / Dicke);  Leistung ≈ Basis-Leistung + Faktor × (Dicke − Basis-Dicke)',
  inputs: [
    {
      type: 'select', id: 'material', label: 'Material', default: 'sperrholz',
      options: [
        { value: 'sperrholz', label: 'Sperrholz / Pappel' },
        { value: 'mdf', label: 'MDF' },
        { value: 'acryl', label: 'Acryl (PMMA)' },
        { value: 'papier', label: 'Karton / Papier' },
        { value: 'leder', label: 'Leder' },
      ],
      help: 'Richtwerte für einen CO2-Laser. Andere Lasertypen weichen ab.',
    },
    { type: 'number', id: 'dicke', label: 'Materialdicke', unit: 'mm', default: 3, min: 0.1, step: 0.1, help: 'Gemessene Stärke der Platte.' },
    { type: 'number', id: 'maxleistung', label: 'Max. Laserleistung', unit: 'W', default: 60, min: 1, step: 1, help: 'Nennleistung deiner Röhre/Quelle, für die Watt-Umrechnung.' },
  ],
  compute: (v) => {
    const key = String(v.material);
    const m = MATERIAL[key] ?? MATERIAL.sperrholz;
    const dicke = num(v.dicke, m.basisDicke);
    const maxW = num(v.maxleistung, 60);
    const speed = dicke > 0 ? m.basisSpeed * (m.basisDicke / dicke) : 0;
    let leistungProz = m.basisLeistung + m.faktorLeistung * (dicke - m.basisDicke);
    if (leistungProz > 100) leistungProz = 100;
    if (leistungProz < 5) leistungProz = 5;
    const leistungW = (leistungProz / 100) * maxW;
    return [
      { label: 'Empfohlene Geschwindigkeit', value: speed, unit: 'mm/s', digits: 0, primary: true, help: 'Startwert – am Reststück testen.' },
      { label: 'Empfohlene Leistung', value: leistungProz, unit: '%', digits: 0 },
      { label: 'Leistung absolut', value: leistungW, unit: 'W', digits: 0 },
    ];
  },
  intro:
    'Welche Leistung und Geschwindigkeit ein Material braucht, hängt vor allem von Werkstoff und Dicke ab: Dickeres Material muss langsamer und mit mehr Leistung geschnitten werden, damit der Strahl ganz durchtrennt. Dieser Rechner liefert Richtwerte für gängige CO2-Laser-Materialien als Ausgangspunkt. Wichtig: Es sind Startwerte – jede Maschine, Linse und Charge ist anders, deshalb gehört vor dem Auftrag immer ein Testschnitt am Reststück.',
  howto: [
    'Material aus der Liste wählen (Sperrholz, MDF, Acryl, Karton, Leder).',
    'Gemessene Materialdicke in mm eintragen.',
    'Maximale Laserleistung deiner Quelle in Watt eintragen, um den Prozentwert in Watt umzurechnen.',
    'Mit den Startwerten einen Testschnitt am Reststück machen und Geschwindigkeit/Leistung feinjustieren.',
  ],
  faq: [
    { q: 'Sind die Werte direkt auf meine Maschine übertragbar?', a: 'Nur als Startpunkt. Strahlqualität, Linsenbrennweite, Düsenabstand, Schneidgas und Materialcharge beeinflussen das Ergebnis stark. Mache immer einen Testschnitt und passe die Werte an.' },
    { q: 'Warum sinkt die empfohlene Geschwindigkeit bei dickerem Material?', a: 'Der Strahl braucht mehr Energie pro Wegstrecke, um durch mehr Material zu kommen. Bei größerer Dicke muss man daher langsamer fahren und/oder mehr Leistung geben.' },
    { q: 'Gelten die Werte auch für Faserlaser oder Diodenlaser?', a: 'Nein. Die Tabelle bezieht sich auf CO2-Laser, die organische Materialien gut schneiden. Faserlaser eignen sich vor allem für Metalle, Diodenlaser haben andere Wellenlängen und Leistungen – dort gelten andere Parameter.' },
    { q: 'Darf ich PVC oder verzinktes Material schneiden?', a: 'PVC niemals lasern – es setzt aggressives Chlorgas frei, das Anlage und Gesundheit schädigt. Auch beschichtete oder unbekannte Kunststoffe vorher prüfen. Diese Materialien sind bewusst nicht in der Liste.' },
  ],
  related: ['laser-fokuslage', 'laser-schnittzeit', 'kerf-kompensation'],
  updated: '2026-06-16',
  examples: [
    { values: { material: 'sperrholz', dicke: 3, maxleistung: 60 }, expect: [{ label: 'Empfohlene Geschwindigkeit', value: 18, tolerance: 0.5 }] },
    { values: { material: 'acryl', dicke: 6, maxleistung: 80 }, expect: [{ label: 'Empfohlene Geschwindigkeit', value: 8, tolerance: 0.5 }] },
  ],
};
