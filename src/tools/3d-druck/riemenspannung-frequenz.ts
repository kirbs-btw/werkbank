import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'riemenspannung-frequenz',
  category: '3d-druck',
  title: 'Riemenspannung aus Zupf-Frequenz (GT2)',
  shortTitle: 'Riemenspannung',
  description:
    'Berechne die Zugkraft im GT2-Zahnriemen aus der gemessenen Schwingfrequenz, freier Riemenlänge und Massenbelegung – ideal mit Tuner-App.',
  keywords: [
    'riemenspannung 3d drucker einstellen',
    'gt2 riemen spannung messen',
    'riemen frequenz hertz rechner',
    'zahnriemen zugkraft berechnen',
    'belt tension hz 3d druck',
    'riemen zupfen frequenz spannung',
  ],
  formula: 'Zugkraft T = Massenbelegung × (2 × freie Länge × Frequenz)²',
  inputs: [
    { type: 'number', id: 'freq', label: 'Gemessene Frequenz', unit: 'Hz', default: 280, min: 1, step: 1, help: 'Mit Gitarren-Tuner oder Spectroid messen.' },
    { type: 'number', id: 'laenge', label: 'Freie Riemenlänge', unit: 'mm', default: 150, min: 10, step: 5, help: 'Schwingender Abschnitt zwischen den Umlenkungen.' },
    { type: 'number', id: 'masse', label: 'Massenbelegung', unit: 'g/m', default: 1.1, min: 0.1, step: 0.1, help: 'GT2 6 mm ≈ 1,1 g/m, 9 mm ≈ 1,6 g/m.' },
  ],
  compute: (v) => {
    const freq = num(v.freq);
    const laengeM = num(v.laenge) / 1000;
    const muKg = num(v.masse) / 1000;
    const T = muKg * Math.pow(2 * laengeM * freq, 2);
    const empfMin = freq > 0 ? T : 0;
    return [
      { label: 'Riemen-Zugkraft', value: T, unit: 'N', digits: 1, primary: true, help: 'Zielbereich für 6 mm GT2: ca. 5–9 N.' },
      { label: 'Zugkraft in kg', value: empfMin / 9.81, unit: 'kg', digits: 2, help: 'Entspricht angehängtem Gewicht.' },
    ];
  },
  intro:
    'Ein Zahnriemen verhält sich wie eine Saite: Zupft man den freien Abschnitt, schwingt er mit einer Frequenz, die direkt von der Zugkraft, der freien Länge und der Massenbelegung abhängt. Über die Saitenformel lässt sich aus der gemessenen Frequenz die tatsächliche Riemenspannung in Newton zurückrechnen. So stellst du X- und Y-Riemen reproduzierbar auf denselben Wert ein, statt nach Gefühl – zu lockere Riemen erzeugen Ghosting, zu straffe belasten Lager und Motoren.',
  howto: [
    'Den schwingenden Riemenabschnitt zwischen zwei Umlenkpunkten ausmessen (freie Länge).',
    'Massenbelegung deines Riemens eintragen (GT2 6 mm ≈ 1,1 g/m).',
    'Riemen mittig anzupfen und die Frequenz mit einer Tuner-App (z. B. Spectroid, GuitarTuna) ablesen.',
    'Zugkraft berechnen und beide Achsen auf denselben Zielwert (ca. 5–9 N bei 6 mm GT2) bringen.',
  ],
  faq: [
    { q: 'Welche Spannung ist richtig?', a: 'Für 6 mm GT2 im Hobbydruck sind etwa 5–9 N (rund 0,5–0,9 kg) üblich. Wichtiger als der Absolutwert ist, dass beide Achsen gleich gespannt sind.' },
    { q: 'Warum die Saitenformel?', a: 'Der freie Riemenabschnitt schwingt physikalisch wie eine eingespannte Saite. Die Grundfrequenz steigt mit der Wurzel der Spannung, daher lässt sich die Kraft aus der Frequenz exakt zurückrechnen.' },
    { q: 'Wie messe ich die Frequenz?', a: 'Eine Frequenzanalyse-App am Smartphone direkt neben den Riemen halten und kurz anzupfen – die App zeigt den dominanten Ton in Hz an. Mehrfach messen und mitteln.' },
    { q: 'Beeinflusst die Riemenbreite das Ergebnis?', a: 'Indirekt über die Massenbelegung: Ein breiterer 9-mm-Riemen wiegt mehr pro Meter, schwingt bei gleicher Spannung also tiefer. Trage daher den passenden g/m-Wert ein.' },
    { q: 'Zu straff ist auch schlecht?', a: 'Ja. Überhöhte Spannung erhöht die Reibung in Lagern und Umlenkrollen, kann Motoren überlasten und den Riemen langfristig dehnen. Bleib im empfohlenen Bereich.' },
  ],
  related: ['stepper-vref-strom', 'e-steps-kalibrierung', 'ueberhang-bridging-winkel'],
  updated: '2026-06-16',
  examples: [
    {
      values: { freq: 280, laenge: 150, masse: 1.1 },
      expect: [
        { label: 'Riemen-Zugkraft', value: 7.76, tolerance: 0.05 },
        { label: 'Zugkraft in kg', value: 0.79, tolerance: 0.02 },
      ],
    },
  ],
};
