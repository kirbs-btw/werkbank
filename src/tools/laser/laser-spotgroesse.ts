import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-spotgroesse',
  category: 'laser',
  title: 'Laser-Spotgröße & Schärfentiefe Rechner (Brennweite)',
  shortTitle: 'Spotgröße',
  description:
    'Berechne aus Brennweite, Rohstrahldurchmesser und Wellenlänge den fokussierten Spotdurchmesser und die Schärfentiefe (DOF) des Laserstrahls.',
  keywords: [
    'laser spotgröße berechnen',
    'fokusdurchmesser brennweite',
    'schärfentiefe laser dof',
    'rayleigh länge laser',
    'spot size co2 faserlaser',
    'brennweite fokus durchmesser',
    'fokuspunkt durchmesser rechner',
  ],
  formula:
    'd = 4·λ·f·M² / (π·D);  Schärfentiefe ≈ 2·π·(d/2)² / λ (Rayleigh-Bereich)',
  inputs: [
    { type: 'number', id: 'brennweite', label: 'Brennweite', unit: 'mm', default: 50.8, min: 1, step: 0.1, help: 'Fokuslänge der Linse; 2 Zoll = 50,8 mm, 2,5 Zoll = 63,5 mm.' },
    { type: 'number', id: 'rohstrahl', label: 'Rohstrahldurchmesser', unit: 'mm', default: 7, min: 0.1, step: 0.1, help: 'Strahldurchmesser vor der Linse (oft 5-9 mm bei CO2).' },
    {
      type: 'select', id: 'wellenlaenge', label: 'Lasertyp / Wellenlänge', default: 'co2',
      options: [
        { value: 'co2', label: 'CO2 (10,6 µm)' },
        { value: 'faser', label: 'Faser (1,06 µm)' },
        { value: 'diode', label: 'Diode (0,45 µm)' },
      ],
      help: 'Die Wellenlänge bestimmt, wie klein der Strahl gebündelt werden kann.',
    },
    { type: 'number', id: 'm2', label: 'Strahlqualität M²', default: 1.1, min: 1, step: 0.1, help: 'Beugungsmaßzahl; ideal 1,0, real meist 1,05-1,3.' },
  ],
  compute: (v) => {
    const f = num(v.brennweite, 50.8);
    const D = num(v.rohstrahl, 7);
    const m2 = num(v.m2, 1.1);
    const lambdaMm = ({ co2: 10.6e-3, faser: 1.06e-3, diode: 0.45e-3 } as Record<string, number>)[String(v.wellenlaenge)] ?? 10.6e-3;
    const d = D > 0 ? (4 * lambdaMm * f * m2) / (Math.PI * D) : 0; // Spotdurchmesser mm
    const w0 = d / 2;
    const rayleigh = lambdaMm > 0 ? (Math.PI * w0 * w0) / (lambdaMm * m2) : 0; // mm
    const dof = 2 * rayleigh; // Schärfentiefe (±Rayleigh)
    return [
      { label: 'Spotdurchmesser', value: d * 1000, unit: 'µm', digits: 1, primary: true, help: 'Durchmesser des fokussierten Strahls' },
      { label: 'Spotdurchmesser in mm', value: d, unit: 'mm', digits: 4 },
      { label: 'Schärfentiefe (DOF)', value: dof, unit: 'mm', digits: 2, help: 'Bereich um den Fokus mit nahezu gleicher Spotgröße' },
    ];
  },
  intro:
    'Wie fein ein Laser schneiden oder gravieren kann, hängt vom fokussierten Spotdurchmesser ab. Dieser ergibt sich aus der Wellenlänge, der Brennweite der Linse, dem Durchmesser des einfallenden Rohstrahls und der Strahlqualität M². Kurze Brennweiten und große Rohstrahldurchmesser erzeugen einen kleinen, intensiven Fokus, lange Brennweiten dagegen einen größeren Spot mit dafür höherer Schärfentiefe. Letztere – auch Rayleigh-Bereich genannt – beschreibt, über welche Höhe der Strahl näherungsweise gleich dünn bleibt, was beim Schneiden dicker Materialien entscheidend ist. Der Rechner liefert beide Größen.',
  howto: [
    'Brennweite der eingesetzten Linse in mm eintragen (Zollwerte umrechnen: Zoll × 25,4).',
    'Rohstrahldurchmesser vor der Linse angeben.',
    'Lasertyp bzw. Wellenlänge auswählen (CO2, Faser oder Diode).',
    'Strahlqualität M² eintragen und Spotdurchmesser sowie Schärfentiefe ablesen.',
  ],
  faq: [
    { q: 'Warum macht eine kürzere Brennweite einen kleineren Spot?', a: 'Der Spotdurchmesser ist direkt proportional zur Brennweite. Eine kürzere Linse bündelt steiler und erzeugt einen feineren Fokus – ideal für Gravur und dünnes Material, aber mit geringerer Schärfentiefe.' },
    { q: 'Was bringt eine lange Brennweite beim Schneiden?', a: 'Sie vergrößert die Schärfentiefe, der Strahl bleibt also über eine größere Materialhöhe ähnlich dünn. Das sorgt bei dickem Material für gleichmäßigere, geradere Schnittflanken, auf Kosten eines etwas größeren Spots.' },
    { q: 'Was bedeutet M²?', a: 'M² ist die Beugungsmaßzahl und beschreibt, wie nahe der Strahl am idealen Gaußstrahl liegt. M²=1 ist das theoretische Optimum; reale Strahlen liegen meist bei 1,05 bis 1,3. Ein höheres M² vergrößert den Spot.' },
    { q: 'Warum schneidet ein Faserlaser feiner als ein CO2-Laser?', a: 'Die Wellenlänge eines Faserlasers ist rund zehnmal kürzer als beim CO2-Laser. Da der Spotdurchmesser proportional zur Wellenlänge ist, lässt sich der Faserstrahl deutlich kleiner fokussieren.' },
  ],
  related: ['laser-leistungsdichte', 'laser-fokuslage', 'kerf-kompensation'],
  updated: '2026-06-16',
  examples: [
    { values: { brennweite: 50.8, rohstrahl: 7, wellenlaenge: 'co2', m2: 1 }, expect: [{ label: 'Spotdurchmesser in mm', value: 0.0979, tolerance: 0.001 }] },
    { values: { brennweite: 50.8, rohstrahl: 7, wellenlaenge: 'co2', m2: 1 }, expect: [{ label: 'Schärfentiefe (DOF)', value: 1.42, tolerance: 0.05 }] },
  ],
};
