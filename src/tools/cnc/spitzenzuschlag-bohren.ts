import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'spitzenzuschlag-bohren',
  category: 'cnc',
  title: 'Spitzenzuschlag & Bohrtiefe-Rechner',
  shortTitle: 'Spitzenzuschlag',
  description:
    'Berechne den Spitzenzuschlag eines Spiralbohrers aus Durchmesser und Spitzenwinkel sowie die Gesamtbohrtiefe. Wichtig bei Sacklöchern und CNC-Z-Tiefe.',
  keywords: [
    'spitzenzuschlag bohrer berechnen',
    'bohrtiefe spitze berücksichtigen',
    'bohrer spitzenlänge berechnen',
    'sackloch bohrtiefe rechner',
    'anschnitt spiralbohrer',
    'volle bohrtiefe berechnen',
    'spitzenwinkel bohrer länge',
  ],
  formula: 'Spitzenzuschlag s = (d / 2) / tan(σ/2);  Gesamttiefe = gewünschte Tiefe + s',
  inputs: [
    { type: 'number', id: 'd', label: 'Bohrerdurchmesser d', unit: 'mm', default: 10, min: 0.1, step: 0.1 },
    { type: 'number', id: 'tiefe', label: 'Gewünschte zylindrische Tiefe', unit: 'mm', default: 25, min: 0, step: 1, help: 'Tiefe, bis zu der die Bohrung den vollen Durchmesser haben soll.' },
    {
      type: 'select',
      id: 'winkel',
      label: 'Spitzenwinkel σ',
      default: '118',
      options: [
        { value: '90', label: '90° (Weichmetall/Kunststoff)' },
        { value: '118', label: '118° (Standard HSS)' },
        { value: '135', label: '135° (zähe/harte Werkstoffe)' },
        { value: '140', label: '140° (Hartmetall)' },
      ],
    },
  ],
  compute: (v) => {
    const d = num(v.d, 1);
    const tiefe = num(v.tiefe);
    const sigma = num(v.winkel, 118);
    const halb = (sigma / 2) * (Math.PI / 180);
    const tanHalb = Math.tan(halb);
    const s = tanHalb > 0 ? (d / 2) / tanHalb : 0;
    const gesamt = tiefe + s;
    return [
      { label: 'Gesamtbohrtiefe (Z-Tiefe)', value: gesamt, unit: 'mm', digits: 2, primary: true },
      { label: 'Spitzenzuschlag s', value: s, unit: 'mm', digits: 2 },
    ];
  },
  intro:
    'Die Spitze eines Spiralbohrers erzeugt am Bohrungsgrund einen Kegel, nicht eine ebene Fläche. Damit eine Bohrung bis zu einer gewünschten Tiefe den vollen Durchmesser erreicht, muss der Bohrer um den Spitzenzuschlag s tiefer fahren. s = (d/2) / tan(σ/2) hängt vom Durchmesser und vom Spitzenwinkel σ ab und beträgt beim Standard-118°-Bohrer rund 0,3 · d. Besonders bei Sacklöchern und bei der Z-Tiefe im CNC-Programm darf dieser Zuschlag nicht vergessen werden.',
  howto: [
    'Bohrerdurchmesser d in mm eintragen.',
    'Gewünschte zylindrische Tiefe eingeben – bis hierhin soll der volle Durchmesser reichen.',
    'Spitzenwinkel σ des Bohrers wählen (HSS-Standard ist 118°).',
    'Gesamtbohrtiefe als Z-Tiefe für das CNC-Programm und den Spitzenzuschlag s ablesen.',
  ],
  faq: [
    {
      q: 'Warum ist der Spitzenzuschlag bei 118° etwa 0,3 · d?',
      a: 's = (d/2) / tan(59°) = (d/2) / 1,6643 ≈ 0,30 · d. Beim 118°-Standardbohrer ergibt der Halbwinkel von 59° genau diesen Faktor. Daher die bekannte Faustregel 0,3 · d.',
    },
    {
      q: 'Wann ist der Zuschlag besonders kritisch?',
      a: 'Bei Sacklöchern, die eine Mindesttiefe mit vollem Durchmesser brauchen (z. B. für ein Gewinde oder einen Passstift). Fährt der Bohrer nur bis zur Nenntiefe, ist der zylindrische Anteil zu kurz. Beim Durchgangsloch addiert man stattdessen einen Überlauf.',
    },
    {
      q: 'Wie wirkt der Spitzenwinkel auf den Zuschlag?',
      a: 'Je größer der Spitzenwinkel, desto flacher die Spitze und desto kleiner der Zuschlag. Bei 90° ist s = 0,5 · d, bei 118° rund 0,3 · d, bei 140° nur noch etwa 0,18 · d. Stumpfere Winkel sparen also Tiefe, brauchen aber mehr Vorschubkraft.',
    },
    {
      q: 'Gilt das auch für Kegelsenker oder Zentrierbohrer?',
      a: 'Die Formel beschreibt den Kegel der Hauptschneide. Für reine Spiralbohrer passt sie direkt. Zentrier- und Stufenbohrer haben eigene Geometrien; dort rechnet man die einzelnen Kegel- und Zylinderabschnitte separat.',
    },
  ],
  related: ['bohrzeit', 'bohrer-drehzahl', 'gewindesteigung-metrisch'],
  updated: '2026-06-16',
  examples: [
    {
      values: { d: 10, tiefe: 25, winkel: '118' },
      expect: [
        { label: 'Spitzenzuschlag s', value: 3.0, tolerance: 0.05 },
        { label: 'Gesamtbohrtiefe (Z-Tiefe)', value: 28.0, tolerance: 0.05 },
      ],
    },
    {
      values: { d: 12, tiefe: 0, winkel: '90' },
      expect: [{ label: 'Spitzenzuschlag s', value: 6.0, tolerance: 0.05 }],
    },
  ],
};
