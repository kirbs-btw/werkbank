import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'winkelstahl-gewicht',
  category: 'metall',
  title: 'Winkelstahl-Gewicht-Rechner (L-Profil)',
  shortTitle: 'Winkelstahl Gewicht',
  description: 'Berechne das Gewicht von Winkelstahl und gleichschenkligem L-Profil aus Schenkellänge, Dicke und Länge für Stahl, Edelstahl oder Aluminium.',
  keywords: ['winkelstahl gewicht berechnen', 'l-profil gewicht rechner', 'gewicht winkeleisen', 'kg pro meter winkelstahl', 'gleichschenkliger winkel gewicht', 'winkelprofil kg/m'],
  formula: 'A = t x (2 x a - t); m = A x (L/10) / 100 x Dichte / 1000 (Maße in mm)',
  inputs: [
    { type: 'number', id: 'schenkel', label: 'Schenkellänge', unit: 'mm', default: 40, min: 0, step: 1, help: 'Länge eines Schenkels (gleichschenklig)' },
    { type: 'number', id: 'dicke', label: 'Materialdicke', unit: 'mm', default: 4, min: 0, step: 0.5 },
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'mm', default: 1000, min: 0, step: 1 },
    {
      type: 'select', id: 'material', label: 'Material', default: '7.85',
      options: [
        { value: '7.85', label: 'Stahl' },
        { value: '7.9', label: 'Edelstahl' },
        { value: '2.70', label: 'Aluminium' },
        { value: '8.5', label: 'Messing' },
      ],
    },
  ],
  compute: (v) => {
    const a = num(v.schenkel);
    const t = num(v.dicke);
    const L = num(v.laenge);
    const dichte = num(v.material, 7.85);
    const flaecheMm2 = t * (2 * a - t);
    const volumenCm3 = (flaecheMm2 * L) / 1000;
    const gewichtG = volumenCm3 * dichte;
    const gewichtKg = gewichtG / 1000;
    const gewichtProMeter = L > 0 ? (gewichtKg / L) * 1000 : 0;
    return [
      { label: 'Gewicht', value: gewichtKg, unit: 'kg', digits: 3, primary: true },
      { label: 'Gewicht pro Meter', value: gewichtProMeter, unit: 'kg/m', digits: 3 },
      { label: 'Querschnittsfläche', value: flaecheMm2, unit: 'mm²', digits: 1 },
    ];
  },
  intro: 'Dieser Rechner ermittelt das Gewicht von gleichschenkligem Winkelstahl (L-Profil) aus der Schenkellänge, der Materialdicke und der Stablänge. Grundlage ist die Querschnittsfläche A = t · (2a − t), die mit Länge und Werkstoffdichte zum Gesamtgewicht multipliziert wird. In der Werkstatt brauchst du diesen Wert, um Rahmen, Konsolen oder Stahlbau-Konstruktionen für Versand, Statik und Materialkalkulation richtig zu bemessen.',
  howto: [
    'Schenkellänge eines Profilschenkels in mm eintragen (z. B. 40 für L40).',
    'Materialdicke (Wandstärke) des Winkels in mm eingeben.',
    'Gesamtlänge des Profils in mm angeben.',
    'Werkstoff auswählen — die Dichte wird automatisch gesetzt.',
  ],
  faq: [
    { q: 'Warum weicht das Ergebnis leicht von der DIN-Tabelle ab?', a: 'Genormte Winkel haben innen einen Ausrundungsradius und außen abgerundete Kanten. Das Modell rechnet mit scharfen Kanten und liegt dadurch meist 1-3 % unter dem Tabellenwert.' },
    { q: 'Gilt die Formel auch für ungleichschenklige Winkel?', a: 'Nein. Für ungleiche Schenkel a und b rechnest du A = t · (a + b − t) und multiplizierst diese Fläche mit Länge und Dichte.' },
    { q: 'Was wiegt ein L40x40x4 aus Stahl pro Meter?', a: 'Rechnerisch rund 2,39 kg/m, die DIN-Tabelle nennt wegen der Ausrundung etwa 2,42 kg/m.' },
    { q: 'Kann ich auch Edelstahl-Winkel berechnen?', a: 'Ja, wähle Edelstahl mit der Dichte 7,9 g/cm³. Das Ergebnis liegt dann minimal über dem Baustahlwert.' },
  ],
  related: ['u-profil-gewicht', 't-profil-gewicht', 'flachstahl-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { schenkel: 40, dicke: 4, laenge: 1000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 2.386, tolerance: 0.01 }],
    },
    {
      values: { schenkel: 50, dicke: 5, laenge: 2000, material: '7.85' },
      expect: [{ label: 'Gewicht', value: 7.458, tolerance: 0.02 }],
    },
  ],
};
