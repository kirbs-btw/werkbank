import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'drehzahl-stahlbohren',
  category: 'metall',
  title: 'Bohrdrehzahl-Rechner Metall (HSS)',
  shortTitle: 'Bohrdrehzahl',
  description: 'Berechne die richtige Bohrdrehzahl beim Metallbohren mit HSS-Bohrer aus Bohrerdurchmesser und Werkstoff inklusive empfohlenem Vorschub pro Minute.',
  keywords: ['bohrdrehzahl stahl berechnen', 'drehzahl bohren metall rechner', 'hss bohrer drehzahl', 'schnittgeschwindigkeit bohren', 'umdrehungen bohrmaschine stahl', 'vorschub bohren metall', 'drehzahl edelstahl bohren', 'bohren aluminium drehzahl'],
  formula: 'n = (Vc · 1000) / (π · d) ;  Vorschub vf = n · f  (Vc in m/min, d in mm, f in mm/U)',
  inputs: [
    { type: 'number', id: 'd', label: 'Bohrerdurchmesser', unit: 'mm', default: 8, min: 0.1, step: 0.5 },
    {
      type: 'select', id: 'vc', label: 'Werkstoff (Schnittgeschwindigkeit Vc)', default: '30',
      options: [
        { value: '30', label: 'Baustahl (≈30 m/min)' },
        { value: '20', label: 'legierter Stahl (≈20 m/min)' },
        { value: '12', label: 'Edelstahl V2A (≈12 m/min)' },
        { value: '60', label: 'Messing (≈60 m/min)' },
        { value: '70', label: 'Aluminium (≈70 m/min)' },
        { value: '25', label: 'Grauguss (≈25 m/min)' },
      ],
    },
    { type: 'number', id: 'f', label: 'Vorschub pro Umdrehung', unit: 'mm/U', default: 0.15, min: 0, step: 0.01, help: 'Faustregel ca. 0,02 × Bohrerdurchmesser' },
  ],
  compute: (v) => {
    const d = num(v.d, 0.1);
    const vc = num(v.vc, 30);
    const f = num(v.f);
    const n = d > 0 ? (vc * 1000) / (Math.PI * d) : 0;
    const vf = n * f;
    return [
      { label: 'Drehzahl', value: n, unit: '1/min', digits: 0, primary: true },
      { label: 'Vorschub pro Minute', value: vf, unit: 'mm/min', digits: 0 },
    ];
  },
  intro: 'Beim Bohren in Metall ist die richtige Drehzahl entscheidend für Standzeit und Bohrqualität: zu schnell verglüht die Schneide, zu langsam schmiert sie. Aus der werkstoffabhängigen Schnittgeschwindigkeit Vc und dem Bohrerdurchmesser folgt n = Vc·1000/(π·d). Dieser Rechner liefert für HSS-Spiralbohrer die passende Drehzahl je Werkstoff sowie den empfohlenen Vorschub pro Minute — ideal für Säulen- und Ständerbohrmaschinen in der Werkstatt.',
  howto: [
    'Bohrerdurchmesser in mm eintragen.',
    'Werkstoff wählen — die typische Schnittgeschwindigkeit Vc für HSS wird übernommen.',
    'Vorschub pro Umdrehung angeben (Faustregel: rund 0,02 × Durchmesser).',
    'Drehzahl an der Bohrmaschine einstellen und den Vorschub pro Minute beachten.',
  ],
  faq: [
    { q: 'Welche Drehzahl für einen 8-mm-Bohrer in Baustahl?', a: 'Bei Vc = 30 m/min ergibt sich rund 1194 1/min. Auf der Maschine die nächste verfügbare Stufe darunter wählen.' },
    { q: 'Warum braucht Edelstahl eine niedrige Drehzahl?', a: 'V2A neigt zur Kaltverfestigung. Mit Vc um 10 bis 12 m/min, kräftigem Vorschub und Kühlung bleibt die Schneide im Eingriff und das Material verhärtet nicht.' },
    { q: 'Gilt der Rechner auch für Hartmetallbohrer?', a: 'Die Formel ja, aber Hartmetall verträgt zwei- bis dreifach höhere Schnittgeschwindigkeiten. Wähle dann einen höheren Vc-Wert als die HSS-Richtwerte.' },
    { q: 'Wie groß sollte der Vorschub sein?', a: 'Als Faustregel etwa 0,02 mm/U je Millimeter Bohrerdurchmesser, also rund 0,16 mm/U bei 8 mm. Größere Bohrer vertragen pro Umdrehung mehr.' },
    { q: 'Sollte ich beim Stahlbohren kühlen?', a: 'Ja, Kühlschmierstoff verlängert die Standzeit deutlich und verbessert die Bohrungsqualität. Nur Guss und Messing werden meist trocken gebohrt.' },
  ],
  related: ['drehzahl-schnittgeschwindigkeit', 'vorschub-fraesen', 'gewindestange-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { d: 8, vc: '30', f: 0.15 },
      expect: [{ label: 'Drehzahl', value: 1194, tolerance: 2 }],
    },
    {
      values: { d: 10, vc: '70', f: 0.2 },
      expect: [{ label: 'Drehzahl', value: 2228, tolerance: 2 }],
    },
  ],
};
