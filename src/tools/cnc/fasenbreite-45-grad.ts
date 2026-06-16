import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'fasenbreite-45-grad',
  category: 'cnc',
  title: 'Fasenbreite 45° Rechner (C-Maß ↔ Fasenfläche)',
  shortTitle: 'Fasenbreite 45°',
  description:
    'Rechne bei einer 45°-Fase zwischen Kantenrücksprung (C-Maß) und sichtbarer Fasenflächenbreite um – inklusive Eintauchtiefe des Fasenfräsers.',
  keywords: [
    'fasenbreite 45 grad berechnen',
    'fase c-maß umrechnen',
    'fasenfläche breite 45 grad',
    'fasenfräser eintauchtiefe',
    'kantenbruch 45 grad rechner',
    'c1 fase breite',
    'fase berechnen cnc',
  ],
  formula: 'Fasenfläche f = C · √2;  Eintauchtiefe = C  (bei 45°, gleiche Schenkel)',
  inputs: [
    {
      type: 'select',
      id: 'modus',
      label: 'Berechnungsmodus',
      default: 'c2flaeche',
      options: [
        { value: 'c2flaeche', label: 'C-Maß → Fasenfläche' },
        { value: 'flaeche2c', label: 'Fasenfläche → C-Maß' },
      ],
    },
    { type: 'number', id: 'wert', label: 'Eingabewert', unit: 'mm', default: 1, min: 0, step: 0.1, help: 'C-Maß (Kantenrücksprung je Schenkel) oder gewünschte Fasenflächenbreite.' },
    { type: 'number', id: 'anz', label: 'Anzahl Fasen/Kanten', unit: '', default: 1, min: 1, step: 1, help: 'Für die Gesamtlänge der Fasenbearbeitung (optional, beeinflusst nur Hinweis).' },
  ],
  compute: (v) => {
    const modus = String(v.modus || 'c2flaeche');
    const wert = num(v.wert);
    const wurzel2 = Math.SQRT2;
    if (modus === 'flaeche2c') {
      const c = wert / wurzel2;
      return [
        { label: 'C-Maß (Schenkel)', value: c, unit: 'mm', digits: 3, primary: true },
        { label: 'Eintauchtiefe Fasenfräser', value: c, unit: 'mm', digits: 3 },
      ];
    }
    const flaeche = wert * wurzel2;
    return [
      { label: 'Fasenflächenbreite', value: flaeche, unit: 'mm', digits: 3, primary: true },
      { label: 'Eintauchtiefe Fasenfräser', value: wert, unit: 'mm', digits: 3 },
    ];
  },
  intro:
    'Eine 45°-Fase mit dem Maß „C1" bedeutet, dass die Kante an beiden anstoßenden Flächen jeweils 1 mm zurückgesetzt ist – das ist das C-Maß (Schenkellänge). Die schräge, sichtbare Fasenfläche selbst ist jedoch breiter, nämlich die Hypotenuse des rechtwinkligen Dreiecks und damit C · √2. Beim Programmieren eines 45°-Fasenfräsers ist außerdem die Eintauchtiefe wichtig: Sie entspricht bei gleichen Schenkeln genau dem C-Maß. Der Rechner rechnet beide Richtungen und gibt direkt die Frästiefe aus.',
  howto: [
    'Modus wählen: vom C-Maß zur Fasenfläche oder umgekehrt.',
    'Wert in mm eintragen (C-Maß bzw. gewünschte Fasenflächenbreite).',
    'Ergebnis ablesen: Fasenflächenbreite und benötigte Eintauchtiefe des Fasenfräsers.',
    'Eintauchtiefe als Z-Zustellung für den 45°-Fasenfräser ins CAM übernehmen.',
  ],
  faq: [
    {
      q: 'Was bedeutet die Zeichnungsangabe „C1" oder „1×45°"?',
      a: 'Beides meint dasselbe: eine 45°-Fase mit 1 mm Kantenrücksprung je Schenkel. C1 ist das C-Maß. Die schräge Fasenfläche misst dann √2 ≈ 1,41 mm.',
    },
    {
      q: 'Warum ist die Fasenfläche breiter als das C-Maß?',
      a: 'Das C-Maß ist eine Kathete des rechtwinkligen Dreiecks an der Kante, die sichtbare Fasenfläche ist die Hypotenuse. Bei 45° ist die Hypotenuse das √2-fache (≈ 1,414) der Kathete.',
    },
    {
      q: 'Wie tief muss ich mit dem 45°-Fasenfräser eintauchen?',
      a: 'Bei einem symmetrischen 45°-Werkzeug entspricht die axiale Eintauchtiefe genau dem gewünschten C-Maß. Für C1 also 1 mm tiefer als die Bauteiloberkante – plus eventueller Sicherheitszuschlag.',
    },
    {
      q: 'Gilt das nur für 45°?',
      a: 'Der Faktor √2 gilt für 45° mit gleichen Schenkeln. Bei anderen Fasenwinkeln verschieben sich die Verhältnisse; dann sind C-Maß und Tiefe nicht mehr gleich groß.',
    },
  ],
  related: ['gravurstichel-breite', 'kegelwinkel', 'spitzenzuschlag-bohren'],
  updated: '2026-06-16',
  examples: [
    {
      values: { modus: 'c2flaeche', wert: 1, anz: 1 },
      expect: [{ label: 'Fasenflächenbreite', value: 1.414, tolerance: 0.005 }],
    },
    {
      values: { modus: 'flaeche2c', wert: 2.828, anz: 1 },
      expect: [{ label: 'C-Maß (Schenkel)', value: 2.0, tolerance: 0.005 }],
    },
  ],
};
