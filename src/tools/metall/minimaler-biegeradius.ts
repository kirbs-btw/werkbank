import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'minimaler-biegeradius',
  category: 'metall',
  title: 'Minimaler Biegeradius-Rechner für Blech',
  shortTitle: 'Min. Biegeradius',
  description: 'Berechne den minimalen Innen-Biegeradius von Blech aus Materialdicke und Werkstoff-Faktor. Verhindert Risse beim Abkanten von Stahl, Edelstahl und Aluminium.',
  keywords: ['minimaler biegeradius berechnen', 'biegeradius blech faktor', 'innenradius abkanten', 'min biegeradius alu', 'biegeradius stahl rechner', 'kleinster radius biegen'],
  formula: 'r_min = k x t (k = Werkstoff-Faktor, t = Blechdicke); D_innen = 2 x r_min',
  inputs: [
    { type: 'number', id: 'dicke', label: 'Blechdicke', unit: 'mm', default: 2, min: 0, step: 0.1 },
    {
      type: 'select', id: 'faktor', label: 'Werkstoff', default: '1.0',
      options: [
        { value: '0.8', label: 'Aluminium weich (Al99,5)' },
        { value: '1.0', label: 'Stahl weich (S235)' },
        { value: '1.5', label: 'Stahl fest (S355)' },
        { value: '2.0', label: 'Edelstahl V2A' },
        { value: '2.5', label: 'Aluminium hart (Alu 7075)' },
      ],
    },
    { type: 'number', id: 'manuell', label: 'Faktor manuell überschreiben', unit: 'x t', default: 0, min: 0, step: 0.1, help: '0 = Werkstoff-Auswahl verwenden' },
  ],
  compute: (v) => {
    const t = num(v.dicke);
    const kSel = num(v.faktor, 1.0);
    const kMan = num(v.manuell, 0);
    const k = kMan > 0 ? kMan : kSel;
    const rMin = k * t;
    const dInnen = 2 * rMin;
    return [
      { label: 'Minimaler Innenradius', value: rMin, unit: 'mm', digits: 2, primary: true },
      { label: 'Minimaler Innendurchmesser', value: dInnen, unit: 'mm', digits: 2 },
      { label: 'Verwendeter Faktor', value: k, unit: 'x t', digits: 2 },
    ];
  },
  intro: 'Dieser Rechner liefert den kleinsten Innen-Biegeradius, mit dem du ein Blech rissfrei abkanten kannst. Die Faustregel r_min = k · t verknüpft die Blechdicke t mit einem werkstoffabhängigen Faktor k — weicher Stahl etwa 1·t, harte Aluminiumlegierungen bis 2,5·t. Wer in der Werkstatt Bleche abkantet oder Gesenke und Matrizen wählt, vermeidet so Anrisse an der Biegeaußenseite und teure Ausschussteile.',
  howto: [
    'Blechdicke t in mm eingeben.',
    'Werkstoff auswählen — der typische Faktor k wird gesetzt.',
    'Optional einen eigenen Faktor eintragen, etwa aus dem Datenblatt des Lieferanten.',
    'Minimalen Innenradius und passenden Innendurchmesser ablesen.',
  ],
  faq: [
    { q: 'Warum hängt der Biegeradius vom Werkstoff ab?', a: 'Je geringer die Bruchdehnung und je höher die Festigkeit, desto größer muss der Radius sein. Harter Stahl und ausgehärtetes Aluminium brauchen größere Radien als weicher Stahl, sonst reißt die Außenfaser.' },
    { q: 'Was bedeutet der Faktor „x t“?', a: 'Der Faktor wird mit der Blechdicke multipliziert. Faktor 1 bei 2 mm Blech bedeutet also 2 mm minimaler Innenradius.' },
    { q: 'Spielt die Biegerichtung zur Walzrichtung eine Rolle?', a: 'Ja, quer zur Walzrichtung lässt sich enger biegen als längs dazu. Bei kritischen Teilen längs zur Walzrichtung den Radius lieber etwas größer wählen.' },
    { q: 'Was passiert, wenn ich den Radius zu klein wähle?', a: 'Die Außenseite wird überdehnt und es entstehen Mikrorisse bis hin zum Bruch. Außerdem steigt die Rückfederung und die Maßhaltigkeit leidet.' },
  ],
  related: ['blech-abwicklung', 'materialgewicht-blech', 'schweissdraht-bedarf'],
  updated: '2026-06-16',
  examples: [
    {
      values: { dicke: 2, faktor: '1.0', manuell: 0 },
      expect: [{ label: 'Minimaler Innenradius', value: 2, tolerance: 0.01 }],
    },
    {
      values: { dicke: 3, faktor: '2.0', manuell: 0 },
      expect: [{ label: 'Minimaler Innenradius', value: 6, tolerance: 0.01 }],
    },
  ],
};
