import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'kehlnaht-a-mass',
  category: 'metall',
  title: 'Kehlnaht a-Maß-Rechner (Schenkellänge)',
  shortTitle: 'Kehlnaht a-Maß',
  description: 'Rechne bei Kehlnähten zwischen a-Maß (Nahtdicke) und Schenkellänge z um und ermittle den Nahtquerschnitt sowie das empfohlene a-Maß zur Blechdicke.',
  keywords: ['kehlnaht a-maß berechnen', 'nahtdicke schenkellänge umrechnen', 'a-maß kehlnaht rechner', 'schweißnaht a maß', 'kehlnaht querschnitt', 'z-maß a-maß umrechnung', 'wirksame nahtdicke', 'kehlnaht dimensionieren'],
  formula: 'a = z · cos(45°) ≈ 0,707·z ;  z = a·√2 ≈ 1,414·a ;  Querschnitt = z²/2 (Maße in mm)',
  inputs: [
    {
      type: 'select', id: 'modus', label: 'Eingabegröße', default: 'z',
      options: [
        { value: 'z', label: 'Schenkellänge z eingeben' },
        { value: 'a', label: 'a-Maß eingeben' },
      ],
    },
    { type: 'number', id: 'wert', label: 'Wert (z bzw. a)', unit: 'mm', default: 5, min: 0, step: 0.5, help: 'Je nach Auswahl Schenkellänge z oder a-Maß' },
    { type: 'number', id: 'blechdicke', label: 'Blechdicke (dünneres Teil)', unit: 'mm', default: 6, min: 0, step: 0.5, help: 'Für die a-Maß-Empfehlung' },
  ],
  compute: (v) => {
    const modus = String(v.modus ?? 'z');
    const wert = num(v.wert);
    const t = num(v.blechdicke);
    const k = Math.SQRT1_2; // 0,7071
    let a: number;
    let z: number;
    if (modus === 'a') {
      a = wert;
      z = wert * Math.SQRT2;
    } else {
      z = wert;
      a = wert * k;
    }
    const querschnitt = (z * z) / 2;
    // Empfehlung: a >= 0,7 * sqrt(t_max), gerundet; gängige Faustregel a ~ 0,5...0,7 * t
    const empfehlungA = t > 0 ? Math.sqrt(t) * 0.7 : 0;
    return [
      { label: 'a-Maß (Nahtdicke)', value: a, unit: 'mm', digits: 2, primary: true },
      { label: 'Schenkellänge z', value: z, unit: 'mm', digits: 2 },
      { label: 'Nahtquerschnitt', value: querschnitt, unit: 'mm²', digits: 1 },
      { label: 'Empfohlenes a-Maß', value: empfehlungA, unit: 'mm', digits: 2, help: 'Faustregel a ≈ 0,7·√t' },
    ];
  },
  intro: 'Bei einer Kehlnaht beschreibt das a-Maß die wirksame Nahtdicke (Höhe des eingeschriebenen Dreiecks), während die Schenkellänge z die sichtbare Schenkelseite ist. Bei einer gleichschenkligen Naht gilt a = z·cos(45°) ≈ 0,707·z und umgekehrt z = a·√2. Dieser Rechner wandelt beide Größen ineinander um, liefert den Nahtquerschnitt z²/2 und schlägt nach der Faustregel a ≈ 0,7·√t ein zur Blechdicke passendes a-Maß vor — wichtig für Festigkeit, Schweißzeit und Drahtverbrauch.',
  howto: [
    'Wählen, ob du die Schenkellänge z oder das a-Maß eingibst.',
    'Den Wert in mm eintragen.',
    'Blechdicke des dünneren Bauteils angeben, um die a-Maß-Empfehlung zu erhalten.',
    'Umgerechnetes Maß, Nahtquerschnitt und empfohlenes a-Maß ablesen.',
  ],
  faq: [
    { q: 'Was ist der Unterschied zwischen a-Maß und z-Maß?', a: 'Das a-Maß ist die Höhe des größten in den Nahtquerschnitt einschreibbaren gleichschenkligen Dreiecks (wirksame Dicke), das z-Maß die Länge eines Schenkels. Bei gleichschenkliger Naht ist a stets kleiner als z.' },
    { q: 'Wie groß muss das a-Maß sein?', a: 'Eine gängige Faustregel ist a ≈ 0,7·√t bezogen auf das dünnere Blech; üblich sind a-Maße von etwa 0,5 bis 0,7 der Blechdicke. Maßgeblich ist immer die statische Berechnung.' },
    { q: 'Warum gerade der Faktor 0,707?', a: 'Das ist der Cosinus von 45°. Bei einer rechtwinkligen, gleichschenkligen Kehlnaht steht die wirksame Nahtdicke unter 45° zu den Schenkeln, daher a = z·cos(45°).' },
    { q: 'Wozu brauche ich den Nahtquerschnitt?', a: 'Aus dem Querschnitt z²/2 mal Nahtlänge ergibt sich das aufzuschweißende Volumen — die Basis für Drahtbedarf, Schweißzeit und die Abschätzung des Schweißverzugs.' },
    { q: 'Darf das a-Maß größer als nötig sein?', a: 'Überdimensionierte Kehlnähte kosten unnötig Draht, Zeit und Wärmeeinbringung und erhöhen den Verzug. Eine zu kleine Naht gefährdet die Festigkeit — daher passend dimensionieren.' },
  ],
  related: ['schweissdraht-bedarf', 'schweissnaht-schrumpf', 'flachstahl-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { modus: 'z', wert: 5, blechdicke: 6 },
      expect: [{ label: 'a-Maß (Nahtdicke)', value: 3.54, tolerance: 0.02 }],
    },
    {
      values: { modus: 'a', wert: 4, blechdicke: 8 },
      expect: [{ label: 'Schenkellänge z', value: 5.66, tolerance: 0.02 }],
    },
  ],
};
