import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'waermeausdehnung-bauteil',
  category: '3d-druck',
  title: 'Wärmeausdehnung 3D-Druckteil Rechner',
  shortTitle: 'Wärmeausdehnung',
  description:
    'Berechne die Längenänderung eines 3D-Druckteils bei Temperaturänderung aus Werkstoff, Ausgangsmaß und Temperaturhub – für passgenaue Bauteile.',
  keywords: [
    'wärmeausdehnung 3d druck berechnen',
    'thermische ausdehnung pla petg abs',
    'längenänderung temperatur bauteil',
    'ausdehnungskoeffizient kunststoff',
    'passung temperatur 3d druck',
    'wärmedehnung filament rechner',
  ],
  formula: 'ΔL = α × L₀ × ΔT; L_neu = L₀ + ΔL (α = Längenausdehnungskoeffizient)',
  inputs: [
    { type: 'number', id: 'laenge', label: 'Ausgangsmaß', unit: 'mm', default: 100, min: 0.1, step: 1, help: 'Länge bei Ausgangstemperatur.' },
    {
      type: 'select', id: 'material', label: 'Material', default: 'pla',
      options: [
        { value: 'pla', label: 'PLA (≈ 68 µm/m·K)' },
        { value: 'petg', label: 'PETG (≈ 60 µm/m·K)' },
        { value: 'abs', label: 'ABS (≈ 90 µm/m·K)' },
        { value: 'asa', label: 'ASA (≈ 98 µm/m·K)' },
        { value: 'nylon', label: 'Nylon/PA (≈ 95 µm/m·K)' },
        { value: 'pc', label: 'PC (≈ 68 µm/m·K)' },
      ],
      help: 'Längenausdehnungskoeffizient α (Richtwert).',
    },
    { type: 'number', id: 'tstart', label: 'Ausgangstemperatur', unit: '°C', default: 20, min: -50, max: 200, step: 1 },
    { type: 'number', id: 'tziel', label: 'Zieltemperatur', unit: '°C', default: 60, min: -50, max: 250, step: 1 },
  ],
  compute: (v) => {
    const L0 = num(v.laenge);
    const material = String(v.material);
    const dt = num(v.tziel) - num(v.tstart);
    const alphaTab: Record<string, number> = { pla: 68e-6, petg: 60e-6, abs: 90e-6, asa: 98e-6, nylon: 95e-6, pc: 68e-6 };
    const alpha = alphaTab[material] ?? 68e-6;
    const dL = alpha * L0 * dt;
    const Lneu = L0 + dL;
    const dLmikro = dL * 1000;
    return [
      { label: 'Längenänderung', value: dL, unit: 'mm', digits: 3, primary: true, help: 'Positiv = Ausdehnung, negativ = Schrumpfung.' },
      { label: 'Längenänderung (µm)', value: dLmikro, unit: 'µm', digits: 0 },
      { label: 'Neue Länge', value: Lneu, unit: 'mm', digits: 3 },
    ];
  },
  intro:
    'Kunststoffe dehnen sich bei Erwärmung deutlich stärker aus als Metalle – ein 3D-Druckteil, das bei Raumtemperatur perfekt passt, kann im Motorraum, in der Sonne oder über einer Heizung klemmen oder Spiel bekommen. Die Längenänderung folgt ΔL = α·L₀·ΔT, wobei α der materialabhängige Längenausdehnungskoeffizient ist. Mit diesem Rechner schätzt du, wie viel sich ein Maß bei einer Temperaturänderung verschiebt, und legst Passungen, Spalte und Toleranzen entsprechend aus.',
  howto: [
    'Ausgangsmaß (z. B. Bohrungsabstand oder Bauteillänge) bei bekannter Temperatur eintragen.',
    'Material aus der Liste wählen – die Koeffizienten sind Richtwerte typischer Filamente.',
    'Ausgangs- und Zieltemperatur des Einsatzfalls angeben.',
    'Längenänderung ablesen und Passung bzw. Spaltmaß entsprechend anpassen.',
  ],
  faq: [
    { q: 'Warum dehnt sich Kunststoff so viel mehr als Metall?', a: 'Polymere haben schwächere Bindungen und größere Molekülbeweglichkeit. Typische α-Werte liegen bei 60–100 µm/m·K – etwa drei- bis fünfmal so hoch wie bei Aluminium.' },
    { q: 'Sind die α-Werte exakt?', a: 'Es sind Richtwerte. Füllgrad, Faserverstärkung (z. B. CF/GF), Druckrichtung und Kristallinität beeinflussen den realen Koeffizienten merklich – für kritische Passungen experimentell prüfen.' },
    { q: 'Gilt das auch unterhalb der Raumtemperatur?', a: 'Ja, dann ist ΔT negativ und das Teil schrumpft. Vorsicht: Nahe der Glasübergangstemperatur ändert sich das Verhalten stark und die lineare Näherung wird ungenau.' },
    { q: 'Ist das dasselbe wie Druckschwund?', a: 'Nein. Druckschwund entsteht beim Abkühlen direkt nach dem Druck (Erstarrung). Diese Wärmeausdehnung beschreibt die reversible Maßänderung im späteren Betrieb.' },
    { q: 'Wie plane ich eine Presspassung?', a: 'Berücksichtige die Betriebstemperaturen beider Teile. Dehnt sich der Außenring stärker als der Kern, kann eine bei 20 °C feste Passung im Warmen lose werden.' },
  ],
  related: ['schwund-kompensation', 'bett-aufheizzeit', 'modell-skalieren'],
  updated: '2026-06-16',
  examples: [
    {
      values: { laenge: 100, material: 'pla', tstart: 20, tziel: 60 },
      expect: [
        { label: 'Längenänderung', value: 0.272, tolerance: 0.001 },
        { label: 'Neue Länge', value: 100.272, tolerance: 0.001 },
      ],
    },
    {
      values: { laenge: 100, material: 'abs', tstart: 20, tziel: 70 },
      expect: [
        { label: 'Längenänderung', value: 0.45, tolerance: 0.002 },
      ],
    },
  ],
};
