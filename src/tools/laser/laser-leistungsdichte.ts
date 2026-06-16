import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-leistungsdichte',
  category: 'laser',
  title: 'Laser-Leistungsdichte & Energiedichte Rechner',
  shortTitle: 'Leistungsdichte',
  description:
    'Berechne die Leistungsdichte (W/cm²) und Energiedichte (J/cm²) im Laserfokus aus Leistung, Spotdurchmesser und Verweildauer – die echte Wirkung.',
  keywords: [
    'laser leistungsdichte berechnen',
    'energiedichte laser j/cm²',
    'intensität laserfokus',
    'fluence laser rechner',
    'w/cm² laser spot',
    'leistungsdichte spotgröße',
    'laser intensität watt cm2',
  ],
  formula:
    'Fläche = π·(d/2)²;  Leistungsdichte = P / Fläche;  Energiedichte = Leistungsdichte × Verweilzeit (Fluence in J/cm²)',
  inputs: [
    { type: 'number', id: 'leistung', label: 'Laserleistung', unit: 'W', default: 40, min: 0.1, step: 1, help: 'Tatsächlich im Fokus ankommende Leistung.' },
    { type: 'number', id: 'spot', label: 'Spotdurchmesser', unit: 'mm', default: 0.1, min: 0.001, step: 0.01, help: 'Fokusdurchmesser des Strahls; bei CO2-Lasern oft 0,08-0,2 mm.' },
    { type: 'number', id: 'verweil', label: 'Verweildauer', unit: 'ms', default: 1, min: 0, step: 0.1, help: 'Wie lange ein Punkt belichtet wird (für die Energiedichte/Fluence).' },
  ],
  compute: (v) => {
    const p = num(v.leistung);
    const dMm = num(v.spot, 0.1);
    const tMs = num(v.verweil);
    const rCm = dMm / 10 / 2; // mm -> cm, Radius
    const flaecheCm2 = Math.PI * rCm * rCm;
    const leistungsdichte = flaecheCm2 > 0 ? p / flaecheCm2 : 0; // W/cm²
    const energiedichte = leistungsdichte * (tMs / 1000); // J/cm²
    return [
      { label: 'Leistungsdichte', value: leistungsdichte, unit: 'W/cm²', digits: 0, primary: true, help: 'Intensität im Fokuspunkt' },
      { label: 'Spotfläche', value: flaecheCm2 * 100, unit: 'mm²', digits: 4 },
      { label: 'Energiedichte (Fluence)', value: energiedichte, unit: 'J/cm²', digits: 1 },
    ];
  },
  intro:
    'Nicht die reine Wattzahl entscheidet, ob ein Laser schneidet oder graviert, sondern die Leistungsdichte – also wie stark die Leistung auf einer winzigen Fläche gebündelt wird. Ein kleiner Fokus konzentriert dieselbe Leistung auf einen Bruchteil der Fläche und erreicht damit ein Vielfaches der Intensität. Multipliziert man die Leistungsdichte mit der Verweildauer, ergibt sich die Energiedichte (Fluence) in J/cm², die beschreibt, wie viel Energie pro Fläche ins Material eingebracht wird. Dieser Rechner macht beide Größen sichtbar und erklärt, warum die Fokussierung so wichtig ist.',
  howto: [
    'Im Fokus ankommende Laserleistung in Watt eintragen.',
    'Spotdurchmesser des fokussierten Strahls in mm angeben (Datenblatt der Linse oder Messung).',
    'Für die Energiedichte die Verweildauer pro Punkt in Millisekunden eintragen.',
    'Leistungsdichte (W/cm²) und Fluence (J/cm²) ablesen und mit Materialschwellen vergleichen.',
  ],
  faq: [
    { q: 'Was ist der Unterschied zwischen Leistungsdichte und Energiedichte?', a: 'Die Leistungsdichte (W/cm²) ist eine Momentangröße – wie viel Leistung gerade pro Fläche wirkt. Die Energiedichte oder Fluence (J/cm²) ist Leistungsdichte mal Zeit und beschreibt die insgesamt eingebrachte Energie pro Fläche.' },
    { q: 'Warum halbiert ein doppelt so kleiner Spot nicht einfach die Wirkung?', a: 'Die Fläche geht mit dem Quadrat des Durchmessers ein. Halbiert man den Spotdurchmesser, viertelt sich die Fläche und die Leistungsdichte vervierfacht sich. Deshalb ist eine saubere Fokussierung so entscheidend.' },
    { q: 'Wie komme ich an den Spotdurchmesser?', a: 'Er ergibt sich aus Brennweite, Rohstrahldurchmesser und Wellenlänge. Praktisch nutzt man die Linsenangabe oder bestimmt ihn mit einem Punktbrenntest auf Acryl. Unser Spotgrößen-Rechner liefert eine Abschätzung.' },
    { q: 'Welche Leistungsdichte braucht man zum Schneiden?', a: 'Das hängt stark vom Material ab. Organische Stoffe verdampfen schon bei einigen 10.000 W/cm², Metalle brauchen je nach Wellenlänge deutlich mehr. Die Werte hier sind zum Vergleichen und Verstehen gedacht, nicht als feste Schwelle.' },
  ],
  related: ['laser-spotgroesse', 'laser-streckenenergie', 'laser-fokuslage'],
  updated: '2026-06-16',
  examples: [
    { values: { leistung: 40, spot: 0.1, verweil: 0 }, expect: [{ label: 'Leistungsdichte', value: 509296, tolerance: 50 }] },
    { values: { leistung: 40, spot: 0.1, verweil: 1 }, expect: [{ label: 'Energiedichte (Fluence)', value: 509.3, tolerance: 1 }] },
  ],
};
