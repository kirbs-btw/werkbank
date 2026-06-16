import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'bett-aufheizzeit',
  category: '3d-druck',
  title: 'Druckbett-Aufheizzeit & Energie Rechner',
  shortTitle: 'Bett-Aufheizzeit',
  description:
    'Schätze, wie lange dein beheiztes Druckbett zum Aufheizen braucht und wie viel Energie es nötig hat – aus Masse, Material, Temperaturhub und Leistung.',
  keywords: [
    'druckbett aufheizzeit berechnen',
    'heizbett energie rechner',
    'bett aufheizen dauer 3d druck',
    'wärmekapazität druckbett',
    'heizbett leistung watt zeit',
    'aufheizzeit aluminium bett',
  ],
  formula:
    'Energie Q = Masse × spez. Wärmekapazität × ΔT; Zeit = Q / (Heizleistung × Wirkungsgrad)',
  inputs: [
    { type: 'number', id: 'masse', label: 'Bettmasse', unit: 'kg', default: 0.9, min: 0.05, step: 0.05, help: 'Heizplatte plus Aufbauten, ohne Glasträger nach Bedarf.' },
    {
      type: 'select', id: 'material', label: 'Plattenmaterial', default: 'alu',
      options: [
        { value: 'alu', label: 'Aluminium (900 J/kg·K)' },
        { value: 'glas', label: 'Glas (840 J/kg·K)' },
        { value: 'stahl', label: 'Stahl/Federstahl (490 J/kg·K)' },
      ],
    },
    { type: 'number', id: 'start', label: 'Starttemperatur', unit: '°C', default: 22, min: -20, max: 120, step: 1 },
    { type: 'number', id: 'ziel', label: 'Zieltemperatur', unit: '°C', default: 60, min: 0, max: 130, step: 1 },
    { type: 'number', id: 'leistung', label: 'Heizleistung', unit: 'W', default: 220, min: 10, step: 10 },
    { type: 'number', id: 'wirkung', label: 'Wirkungsgrad', unit: '%', default: 75, min: 10, max: 100, step: 5, help: 'Verluste an Luft & Rahmen; realistisch 60–85 %.' },
  ],
  compute: (v) => {
    const masse = num(v.masse);
    const material = String(v.material);
    const dt = num(v.ziel) - num(v.start);
    const leistung = num(v.leistung);
    const wirkung = num(v.wirkung) / 100;
    const c = material === 'glas' ? 840 : material === 'stahl' ? 490 : 900;
    const Q = masse * c * Math.max(dt, 0);
    const Peff = leistung * wirkung;
    const zeitS = Peff > 0 ? Q / Peff : 0;
    return [
      { label: 'Aufheizzeit', value: zeitS, unit: 's', digits: 0, primary: true, help: 'Bis die Zieltemperatur erreicht ist.' },
      { label: 'Aufheizzeit (Minuten)', value: zeitS / 60, unit: 'min', digits: 1 },
      { label: 'Benötigte Wärmeenergie', value: Q / 1000, unit: 'kJ', digits: 1 },
    ];
  },
  intro:
    'Wie lange dein Druckbett zum Aufheizen braucht, hängt von der zu erwärmenden Masse, dem Material, dem Temperaturhub und der Heizleistung ab. Physikalisch musst du die Wärmeenergie Q = m·c·ΔT aufbringen; dividiert durch die effektive Heizleistung ergibt sich die Zeit. Weil ein Teil der Wärme an Luft und Rahmen verloren geht, rechnest du mit einem Wirkungsgrad von typisch 60–85 %. So schätzt du Wartezeiten und Energiebedarf vor langen Drucksessions realistisch ab.',
  howto: [
    'Masse der zu erwärmenden Heizplatte eintragen (Datenblatt oder Waage).',
    'Plattenmaterial wählen – Aluminium speichert mehr Wärme pro Kilogramm als Stahl.',
    'Start- und Zieltemperatur sowie die Heizleistung in Watt angeben.',
    'Wirkungsgrad zur Berücksichtigung der Verluste setzen und Zeit sowie Energie ablesen.',
  ],
  faq: [
    { q: 'Warum dauert es real länger als die ideale Rechnung?', a: 'Mit steigender Temperatur wachsen die Wärmeverluste an die Umgebung. Der Wirkungsgrad bildet diese Verluste pauschal ab; gegen Ende der Aufheizphase geht prozentual mehr Wärme verloren.' },
    { q: 'Welchen Wirkungsgrad soll ich nehmen?', a: 'Ein offenes Bett ohne Dämmung liegt oft bei 60–70 %, mit Unterboden-Dämmmatte eher bei 80–85 %. Beobachte einmal die echte Zeit und passe den Wert an.' },
    { q: 'Zählt der Federstahl obendrauf mit?', a: 'Wenn du eine PEI-Federstahlplatte nutzt, addiere deren Masse zur Bettmasse – sie muss mit aufgeheizt werden und verlängert die Zeit.' },
    { q: 'Macht eine höhere Netzspannung das schneller?', a: 'Indirekt: Mehr Heizleistung (z. B. 24-V- statt 12-V-Bett oder AC-Silikonheizung) verkürzt die Zeit proportional. Trage einfach die reale Leistung ein.' },
    { q: 'Wie spare ich Aufheizzeit?', a: 'Eine Dämmmatte unter dem Bett, ein geschlossenes Gehäuse und eine stärkere Heizung helfen. Auch das Vorheizen während des Slicens nutzt die Wartezeit sinnvoll.' },
  ],
  related: ['stromkosten-3d-druck', 'waermeausdehnung-bauteil', 'druckzeit-schaetzung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { masse: 0.9, material: 'alu', start: 22, ziel: 60, leistung: 220, wirkung: 75 },
      expect: [
        { label: 'Aufheizzeit', value: 187, tolerance: 1 },
        { label: 'Benötigte Wärmeenergie', value: 30.8, tolerance: 0.1 },
      ],
    },
  ],
};
