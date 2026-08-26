import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'filament-gewicht',
  category: '3d-druck',
  title: 'Filament-Gewicht & -Länge Rechner',
  shortTitle: 'Filamentgewicht',
  description:
    'Berechne aus der Filamentlänge das Gewicht (und die Länge pro Kilogramm) – für PLA, PETG, ABS, ASA, TPU und Nylon.',
  keywords: [
    'filament gewicht rechner',
    'filament länge berechnen',
    'wie viel filament brauche ich',
    'filament verbrauch berechnen',
  ],
  formula: 'Gewicht = π · (d/2)² · Länge · Dichte',
  inputs: [
    {
      type: 'select', id: 'durchmesser', label: 'Filament-Durchmesser', default: '1.75',
      options: [
        { value: '1.75', label: '1,75 mm' },
        { value: '2.85', label: '2,85 mm' },
      ],
    },
    {
      type: 'select', id: 'material', label: 'Material', default: '1.24',
      options: [
        { value: '1.24', label: 'PLA (1,24 g/cm³)' },
        { value: '1.27', label: 'PETG (1,27)' },
        { value: '1.04', label: 'ABS (1,04)' },
        { value: '1.07', label: 'ASA (1,07)' },
        { value: '1.21', label: 'TPU (1,21)' },
        { value: '1.30', label: 'Nylon (1,30)' },
      ],
    },
    { type: 'number', id: 'laenge', label: 'Filamentlänge', unit: 'm', default: 100, min: 0, step: 1 },
  ],
  compute: (v) => {
    const d = num(v.durchmesser, 1.75);
    const dichte = num(v.material, 1.24);
    const laenge = num(v.laenge);
    const r = d / 20; // mm → cm Radius
    const flaeche = Math.PI * r * r; // cm²
    const volumen = flaeche * laenge * 100; // cm³
    const gewicht = volumen * dichte; // g
    const proKg = gewicht > 0 ? (1000 / gewicht) * laenge : 0;
    return [
      { label: 'Gewicht', value: gewicht, unit: 'g', digits: 1, primary: true },
      { label: 'Volumen', value: volumen, unit: 'cm³', digits: 1 },
      { label: 'Länge pro 1 kg', value: proKg, unit: 'm', digits: 0 },
    ];
  },
  intro:
    'Filament ist nichts anderes als ein sehr langer, dünner Zylinder: Querschnittsfläche mal Länge ergibt das Volumen, mal Dichte das Gewicht. Gebraucht wird die Rechnung in beide Richtungen – der Slicer nennt oft nur die Länge in Metern, bezahlt wird aber pro Kilogramm; umgekehrt lässt sich aus dem Gewicht einer angebrochenen Spule abschätzen, wie viele Meter noch darauf sind. Der Durchmesser wirkt dabei quadratisch: 2,85-mm-Filament hat den 2,65-fachen Querschnitt von 1,75 mm, dieselbe Länge wiegt also fast dreimal so viel.',
  howto: [
      'Filament-Durchmesser wählen – 1,75 mm ist der Standard, 2,85 mm nutzen vor allem ältere Bowden-Geräte.',
      'Material auswählen; dahinter steckt die Dichte, die das Gewicht bestimmt.',
      'Filamentlänge in Metern eintragen – der Wert steht im Slicer neben dem Materialverbrauch.',
      'Gewicht ablesen. Die Zeile „Länge pro 1 kg“ sagt umgekehrt, wie viele Meter auf einer vollen Spule stecken.',
  ],
  faq: [
    {
      q: 'Welche Dichte hat mein Filament?',
      a: 'Typische Werte: PLA 1,24 g/cm³, PETG 1,27, ABS 1,04, TPU 1,21. Der genaue Wert steht meist im Datenblatt des Herstellers.',
    },
  ],
  related: ['filament-kosten'],
  updated: '2026-08-26',
  examples: [
    {
      values: { durchmesser: '1.75', material: '1.24', laenge: 100 },
      expect: [{ label: 'Gewicht', value: 298.3, tolerance: 2 }],
    },
  ],
};
