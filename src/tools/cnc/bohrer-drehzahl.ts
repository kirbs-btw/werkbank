import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'bohrer-drehzahl',
  category: 'cnc',
  title: 'Bohrer-Drehzahl-Rechner',
  shortTitle: 'Bohrer-Drehzahl',
  description:
    'Berechne die richtige Drehzahl für deinen Bohrer aus Schnittgeschwindigkeit und Bohrerdurchmesser. Für Metall, Holz und Kunststoff.',
  keywords: [
    'bohrer drehzahl berechnen',
    'drehzahl bohren rechner',
    'bohrdrehzahl tabelle',
    'umdrehungen bohrer berechnen',
  ],
  formula: 'n = vc · 1000 / (π · d)  (1/min)',
  inputs: [
    { type: 'number', id: 'vc', label: 'Schnittgeschwindigkeit vc', unit: 'm/min', default: 80, min: 0.1, step: 1 },
    { type: 'number', id: 'd', label: 'Bohrerdurchmesser d', unit: 'mm', default: 8, min: 0.1, step: 0.1 },
  ],
  compute: (v) => {
    const vc = num(v.vc);
    const d = num(v.d, 1);
    const n = (vc * 1000) / (Math.PI * d);
    return [
      { label: 'Drehzahl n', value: n, unit: '1/min', digits: 0, primary: true },
    ];
  },
  intro:
    'Aus der materialabhängigen Schnittgeschwindigkeit vc und dem Bohrerdurchmesser ergibt sich die ideale Spindeldrehzahl. Größere Bohrer brauchen kleinere Drehzahlen.',
  howto: [
    'Schnittgeschwindigkeit vc für dein Material wählen (z. B. Baustahl mit HSS ca. 25-35 m/min).',
    'Bohrerdurchmesser d in mm eintragen.',
    'Empfohlene Drehzahl n in 1/min ablesen.',
    'Drehzahl auf die nächste verfügbare Stufe der Maschine runden.',
  ],
  faq: [
    {
      q: 'Welche Schnittgeschwindigkeit nehme ich?',
      a: 'Für HSS-Bohrer gilt grob: Aluminium 60-100 m/min, Baustahl 25-35 m/min, Edelstahl 10-15 m/min, Hartholz 30-60 m/min. Im Zweifel kleiner wählen.',
    },
    {
      q: 'Warum dreht ein großer Bohrer langsamer?',
      a: 'Bei gleichem vc legt die Schneide eines großen Bohrers pro Umdrehung einen längeren Weg zurück. Damit die Schnittgeschwindigkeit gleich bleibt, muss die Drehzahl sinken.',
    },
  ],
  related: ['schnittgeschwindigkeit', 'drehzahl-vorschub', 'gewindebohren-drehzahl'],
  updated: '2026-06-15',
  examples: [
    {
      values: { vc: 80, d: 8 },
      expect: [{ label: 'Drehzahl n', value: 3183, tolerance: 2 }],
    },
    {
      values: { vc: 30, d: 10 },
      expect: [{ label: 'Drehzahl n', value: 955, tolerance: 2 }],
    },
  ],
};
