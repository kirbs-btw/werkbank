import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'v-werkzeug-breite',
  category: 'metall',
  title: 'V-Werkzeug-Breite-Rechner (Gesenkbiegen)',
  shortTitle: 'V-Werkzeug',
  description: 'Bestimme die passende Gesenköffnung V beim Luftbiegen aus der Blechdicke und erhalte Innenradius sowie minimale Schenkellänge für sauberes Abkanten.',
  keywords: ['v-werkzeug breite berechnen', 'gesenköffnung v rechner', 'v-werkzeug auswahl blech', 'matrizenöffnung abkanten', 'biegeradius luftbiegen', 'minimale schenkellänge', 'v-werkzeug faktor', 'gesenkbreite blechdicke'],
  formula: 'V = Faktor · s ;  Innenradius ri ≈ 0,16 · V ;  min. Schenkel ≈ 0,5 · V + s (Maße in mm)',
  inputs: [
    { type: 'number', id: 'dicke', label: 'Blechdicke', unit: 'mm', default: 2, min: 0.1, step: 0.1, help: 'Materialstärke s' },
    {
      type: 'select', id: 'faktor', label: 'V-Faktor (Öffnung)', default: '8',
      options: [
        { value: '6', label: '6 × s (enger, dickes Blech)' },
        { value: '8', label: '8 × s (Standard bis 3 mm)' },
        { value: '10', label: '10 × s (weicher Radius)' },
        { value: '12', label: '12 × s (dickes/zähes Blech)' },
      ],
    },
  ],
  compute: (v) => {
    const s = num(v.dicke, 0.1);
    const f = num(v.faktor, 8);
    const vOeffnung = f * s;
    const innenradius = 0.16 * vOeffnung;
    const minSchenkel = 0.5 * vOeffnung + s;
    return [
      { label: 'Gesenköffnung V', value: vOeffnung, unit: 'mm', digits: 1, primary: true },
      { label: 'Innenradius (Luftbiegen)', value: innenradius, unit: 'mm', digits: 2 },
      { label: 'Min. Schenkellänge', value: minSchenkel, unit: 'mm', digits: 1 },
    ];
  },
  intro: 'Beim Luftbiegen entscheidet die Gesenköffnung V über Biegeradius, nötige Kraft und die kürzeste biegbare Schenkellänge. Üblich ist V = 6·s bis 12·s, als Standardwert gilt das Achtfache der Blechdicke. Der sich frei einstellende Innenradius beträgt rund 0,16·V; zu kurze Schenkel rutschen ins Gesenk. Dieser Rechner liefert dir aus Blechdicke und gewähltem Faktor sofort die passende Werkzeugbreite und die kritischen Mindestmaße für ein sauberes Ergebnis.',
  howto: [
    'Blechdicke s in mm eintragen.',
    'V-Faktor je nach Blech wählen — 8×s ist der bewährte Standard für Bleche bis 3 mm.',
    'Empfohlene Gesenköffnung V ablesen und ein passendes V-Werkzeug auswählen.',
    'Innenradius und minimale Schenkellänge beachten, damit die Kante sauber gelingt.',
  ],
  faq: [
    { q: 'Welche V-Öffnung ist die Standardwahl?', a: 'Für Bleche bis etwa 3 mm gilt V = 8 × Blechdicke als guter Allround-Wert. Dünne Bleche profitieren von kleineren, dicke und zähe von größeren V-Öffnungen.' },
    { q: 'Warum ist der Innenradius rund 0,16 × V?', a: 'Beim Luftbiegen stellt sich der Radius frei ein und hängt fast nur von der Gesenkbreite ab — empirisch etwa ein Sechstel der V-Öffnung, unabhängig vom Werkzeugradius des Stempels.' },
    { q: 'Was passiert mit zu kurzen Schenkeln?', a: 'Liegt der Schenkel kürzer als etwa die halbe V-Öffnung plus Blechdicke, kippt das Blech in das Gesenk und die Kante wird unsauber oder unmöglich. Größeres Gesenk meiden oder anders aufspannen.' },
    { q: 'Wie hängt die V-Öffnung mit der Biegekraft zusammen?', a: 'Größeres V senkt die nötige Tonnage deutlich, weil die Kraft umgekehrt proportional zur Öffnung ist. Im Gegenzug wird der Innenradius größer — beides muss zur Konstruktion passen.' },
    { q: 'Gilt das auch für Edelstahl und Aluminium?', a: 'Die Faktoren gelten ähnlich, aber Edelstahl federt stärker zurück (größerer Faktor sinnvoll), Aluminium reißt bei zu kleinem Radius — dort eher 10×s oder mehr wählen.' },
  ],
  related: ['abkantkraft-tonnage', 'minimaler-biegeradius', 'blech-abwicklung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { dicke: 2, faktor: '8' },
      expect: [{ label: 'Gesenköffnung V', value: 16, tolerance: 0.1 }],
    },
    {
      values: { dicke: 3, faktor: '6' },
      expect: [{ label: 'Gesenköffnung V', value: 18, tolerance: 0.1 }],
    },
  ],
};
