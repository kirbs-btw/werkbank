import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'spule-durchmesser-restlaenge',
  category: '3d-druck',
  title: 'Restlänge aus Spulen-Durchmesser (Wickel-Querschnitt)',
  shortTitle: 'Spulen-Restlänge',
  description:
    'Schätze die verbleibende Filamentlänge und das Restgewicht aus Außen- und Kerndurchmesser der Wicklung sowie der Spulenbreite – ohne Abwiegen.',
  keywords: [
    'filament restlänge durchmesser',
    'spule restlänge berechnen',
    'wicklung außendurchmesser filament',
    'restfilament ohne waage',
    'spulendurchmesser meter rechner',
    'filament rest schätzen durchmesser',
  ],
  formula:
    'Querschnitt = π/4 × (D_außen² − D_kern²) × Breite; Länge = Querschnitt / (π/4 × d_filament²)',
  inputs: [
    { type: 'number', id: 'daussen', label: 'Außendurchmesser Wicklung', unit: 'mm', default: 180, min: 10, step: 1, help: 'Über das aufgewickelte Filament gemessen.' },
    { type: 'number', id: 'dkern', label: 'Kerndurchmesser (Nabe)', unit: 'mm', default: 95, min: 5, step: 1, help: 'Innendurchmesser der Wicklung / Spulennabe.' },
    { type: 'number', id: 'breite', label: 'Wicklungsbreite', unit: 'mm', default: 55, min: 5, step: 1, help: 'Innere Breite zwischen den Spulenwangen.' },
    { type: 'number', id: 'dfila', label: 'Filamentdurchmesser', unit: 'mm', default: 1.75, min: 1, max: 4, step: 0.05 },
    { type: 'number', id: 'dichte', label: 'Materialdichte', unit: 'g/cm³', default: 1.24, min: 0.5, max: 3, step: 0.01, help: 'PLA 1,24 · PETG 1,27 · ABS 1,04.' },
  ],
  compute: (v) => {
    const da = num(v.daussen);
    const dk = num(v.dkern);
    const breite = num(v.breite);
    const df = num(v.dfila);
    const dichte = num(v.dichte);
    const ringFlaeche = (Math.PI / 4) * (da * da - dk * dk);
    const wickelVolMm3 = ringFlaeche * breite;
    const filaQuerschnitt = (Math.PI / 4) * df * df;
    const laengeMm = filaQuerschnitt > 0 ? wickelVolMm3 / filaQuerschnitt : 0;
    const laengeM = laengeMm / 1000;
    const gewicht = filaQuerschnitt > 0 ? (wickelVolMm3 / 1000) * dichte : 0;
    return [
      { label: 'Restlänge', value: laengeM, unit: 'm', digits: 1, primary: true, help: 'Annahme: dichte, lückenlose Wicklung.' },
      { label: 'Restgewicht', value: gewicht, unit: 'g', digits: 0 },
      { label: 'Wicklungs-Volumen', value: wickelVolMm3 / 1000, unit: 'cm³', digits: 1 },
    ];
  },
  intro:
    'Wenn auf der Spule kein Gewicht mehr aufgedruckt ist, lässt sich die Restmenge geometrisch abschätzen: Das aufgewickelte Filament bildet einen Kreisring, dessen Volumen aus Außen- und Kerndurchmesser sowie der Wicklungsbreite folgt. Teilt man dieses Wickelvolumen durch den Querschnitt eines einzelnen Filamentstrangs, erhält man die Länge – und über die Materialdichte das Gewicht. Die Schätzung setzt eine dichte, lückenlose Wicklung voraus und liefert daher eine leichte Obergrenze.',
  howto: [
    'Außendurchmesser der Wicklung mit dem Messschieber über das Filament messen.',
    'Kerndurchmesser (Spulennabe) und die nutzbare Wicklungsbreite zwischen den Wangen messen.',
    'Filamentdurchmesser (meist 1,75 mm) und die Materialdichte eintragen.',
    'Restlänge und Restgewicht ablesen; bei lockerer Wicklung etwa 5–10 % abziehen.',
  ],
  faq: [
    { q: 'Wie genau ist die Schätzung?', a: 'Bei sauber gewickelten Spulen recht gut (±5–10 %). Luftspalte, ungleichmäßige Wicklung und ovale Verformung erhöhen den scheinbaren Durchmesser und damit die Überschätzung.' },
    { q: 'Warum brauche ich die Dichte?', a: 'Die Geometrie liefert nur das Volumen. Erst die Materialdichte rechnet das Volumen in Gramm um – PLA, PETG und ABS unterscheiden sich hier deutlich.' },
    { q: 'Wo messe ich den Kerndurchmesser?', a: 'Am Spulenkern bzw. an der innersten Filamentlage. Ist die Spule fast leer, nähert sich der Außendurchmesser dem Kern und die Restlänge geht gegen null.' },
    { q: 'Funktioniert das auch für 2,85 mm Filament?', a: 'Ja, trage einfach 2,85 mm ein. Der dickere Strang hat einen größeren Querschnitt, daher ergibt dasselbe Volumen eine kürzere Länge.' },
    { q: 'Alternative zum Durchmesser-Messen?', a: 'Genauer ist das Abwiegen mit Tara der Leerspule. Die Durchmessermethode ist die schnelle Schätzung, wenn keine Waage zur Hand ist.' },
  ],
  related: ['filament-restmenge', 'filament-gewicht', 'filament-kosten'],
  updated: '2026-06-16',
  examples: [
    {
      values: { daussen: 180, dkern: 95, breite: 55, dfila: 1.75, dichte: 1.24 },
      expect: [
        { label: 'Restlänge', value: 419.8, tolerance: 1 },
        { label: 'Restgewicht', value: 1252, tolerance: 3 },
      ],
    },
  ],
};
