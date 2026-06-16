import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'max-volumenstrom',
  category: '3d-druck',
  title: 'Maximaler Volumenstrom (Flow) Rechner',
  shortTitle: 'Volumenstrom',
  description:
    'Berechne den Volumenstrom aus Schichthöhe, Linienbreite und Druckgeschwindigkeit und vergleiche ihn mit dem Maximalfluss deines Hotends.',
  keywords: [
    'volumenstrom 3d druck berechnen',
    'max flow rate hotend',
    'volumetric flow rechner',
    'mm3 pro sekunde 3d druck',
    'materialfluss berechnen fdm',
    'hotend durchsatz rechner',
  ],
  formula: 'Volumenstrom = Schichthöhe × Linienbreite × Druckgeschwindigkeit',
  inputs: [
    { type: 'number', id: 'schicht', label: 'Schichthöhe', unit: 'mm', default: 0.2, min: 0.04, max: 1, step: 0.01 },
    { type: 'number', id: 'breite', label: 'Linienbreite', unit: 'mm', default: 0.4, min: 0.1, max: 2, step: 0.01 },
    { type: 'number', id: 'speed', label: 'Druckgeschwindigkeit', unit: 'mm/s', default: 60, min: 1, step: 5 },
    { type: 'number', id: 'maxflow', label: 'Hotend-Maximalfluss', unit: 'mm³/s', default: 12, min: 0.1, step: 0.5, help: 'Aus Datenblatt oder Flow-Test.' },
  ],
  compute: (v) => {
    const schicht = num(v.schicht);
    const breite = num(v.breite);
    const speed = num(v.speed);
    const maxflow = num(v.maxflow);
    const flow = schicht * breite * speed;
    const auslastung = maxflow > 0 ? (flow / maxflow) * 100 : 0;
    const reserve = maxflow - flow;
    return [
      { label: 'Benötigter Volumenstrom', value: flow, unit: 'mm³/s', digits: 2, primary: true },
      { label: 'Auslastung des Hotends', value: auslastung, unit: '%', digits: 1 },
      { label: 'Flussreserve', value: reserve, unit: 'mm³/s', digits: 2 },
    ];
  },
  intro:
    'Der Volumenstrom ist die wichtigste physikalische Grenze beim schnellen FDM-Druck: Er gibt an, wie viel geschmolzenes Material das Hotend pro Sekunde fördern muss. Das Produkt aus Schichthöhe, Linienbreite und Geschwindigkeit ergibt den geförderten Querschnitt mal Weg pro Zeit. Liegt dieser Wert über dem Maximalfluss deines Hotends, kommt zu wenig Material heraus (Underextrusion) – dieser Rechner zeigt dir Auslastung und Reserve, bevor du eine Geschwindigkeit fährst.',
  howto: [
    'Schichthöhe und Linienbreite aus deinem Slicer-Profil übernehmen.',
    'Geplante Druckgeschwindigkeit der Außen- oder Infill-Linien eintragen.',
    'Maximalfluss des Hotends eingeben (z. B. 8 mm³/s Stock-V6, 24+ mm³/s bei Volcano/CHT).',
    'Auslastung prüfen: Bleibe unter ~90 %, um Underextrusion und Spaltungen zu vermeiden.',
  ],
  faq: [
    { q: 'Was passiert bei zu hohem Volumenstrom?', a: 'Das Hotend kann das Filament nicht schnell genug aufschmelzen, es entsteht Underextrusion: lückige Wände, schwache Schichthaftung und Klick-Geräusche am Extruder.' },
    { q: 'Wie ermittle ich den Maximalfluss meines Hotends?', a: 'Über einen Flow-Test (z. B. in OrcaSlicer „Max Volumetric Speed"): Du druckst mit steigendem Fluss, bis Underextrusion einsetzt, und nimmst den letzten sauberen Wert.' },
    { q: 'Zählt die Geschwindigkeit der Reisewege?', a: 'Nein. Nur extrudierende Bewegungen fördern Material. Travel-Moves sind für den Volumenstrom irrelevant.' },
    { q: 'Warum mehr Reserve bei dünnen Wänden?', a: 'Außenwände sollen sauber aussehen; etwas Reserve verhindert Aussetzer. Beim Infill kannst du näher ans Limit gehen.' },
  ],
  related: ['duesen-druckgeschwindigkeit', 'linienbreite-rechner', 'druckzeit-schaetzung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { schicht: 0.2, breite: 0.4, speed: 60, maxflow: 12 },
      expect: [
        { label: 'Benötigter Volumenstrom', value: 4.8, tolerance: 0.01 },
        { label: 'Auslastung des Hotends', value: 40.0, tolerance: 0.1 },
        { label: 'Flussreserve', value: 7.2, tolerance: 0.01 },
      ],
    },
  ],
};
