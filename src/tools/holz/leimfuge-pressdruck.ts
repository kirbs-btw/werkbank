import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'leimfuge-pressdruck',
  category: 'holz',
  title: 'Leimfuge: Pressdruck & Zwingenanzahl berechnen',
  shortTitle: 'Leimfugen-Pressdruck',
  description:
    'Berechne die nötige Presskraft einer Leimfuge aus Pressdruck und Fugenfläche sowie die Zahl der Schraubzwingen beim Verleimen.',
  keywords: [
    'leimfuge pressdruck berechnen',
    'zwingen anzahl verleimen',
    'presskraft leimholz',
    'schraubzwingen abstand',
    'leimholz verleimen druck',
    'anpressdruck holzleim',
    'zwingen pro meter',
  ],
  formula:
    'Presskraft = Pressdruck[N/mm²] · Fugenlänge · Fugenbreite · Zwingen = max( aufrunden(Kraft / Zwingenkraft); aufrunden(Länge / Abstand) + 1 )',
  inputs: [
    { type: 'number', id: 'laenge', label: 'Fugenlänge', unit: 'mm', default: 1000, min: 0, step: 10 },
    { type: 'number', id: 'breite', label: 'Fugenbreite (Brettdicke)', unit: 'mm', default: 20, min: 0, step: 1, help: 'Höhe/Dicke der verleimten Stoßfläche.' },
    {
      type: 'select',
      id: 'druck',
      label: 'Empfohlener Pressdruck',
      default: '0.7',
      help: 'Anpressdruck je nach Holzhärte.',
      options: [
        { value: '0.6', label: 'Weichholz (≈ 0,6 N/mm²)' },
        { value: '0.7', label: 'mittel (≈ 0,7 N/mm²)' },
        { value: '1.0', label: 'Hartholz (≈ 1,0 N/mm²)' },
      ],
    },
    { type: 'number', id: 'zwingenkraft', label: 'Spannkraft je Zwinge', unit: 'N', default: 4000, min: 1, step: 100, help: 'Leichte Bügelzwinge ~2000 N, kräftige ~5000 N.' },
    { type: 'number', id: 'abstand', label: 'Maximaler Zwingenabstand', unit: 'mm', default: 200, min: 1, step: 10 },
  ],
  compute: (v) => {
    const laenge = num(v.laenge);
    const breite = num(v.breite);
    const druck = num(v.druck, 0.7);
    const zwingenkraft = num(v.zwingenkraft, 4000);
    const abstand = num(v.abstand, 200);

    const flaeche = laenge * breite; // mm²
    const presskraft = druck * flaeche; // N
    const presskraftKg = presskraft / 9.81;

    const nachKraft = zwingenkraft > 0 ? Math.ceil(presskraft / zwingenkraft) : 0;
    const nachAbstand = abstand > 0 ? Math.ceil(laenge / abstand) + 1 : 0;
    const zwingen = Math.max(1, nachKraft, nachAbstand);

    return [
      { label: 'Anzahl Zwingen', value: zwingen, unit: 'Stück', digits: 0, primary: true },
      { label: 'Erforderliche Presskraft', value: presskraft, unit: 'N', digits: 0 },
      { label: 'Presskraft in kg', value: presskraftKg, unit: 'kg', digits: 0 },
      { label: 'Zwingen nach Abstandsregel', value: nachAbstand, unit: 'Stück', digits: 0 },
    ];
  },
  intro:
    'Eine feste Leimfuge braucht beim Aushärten gleichmäßigen Anpressdruck – zu wenig und der Leim bindet schlecht, zu viel quetscht ihn heraus. Dieser Rechner ermittelt die gesamte Presskraft aus dem empfohlenen Pressdruck (je nach Holzhärte) und der Fugenfläche und bestimmt daraus die nötige Zahl an Schraubzwingen. Berücksichtigt werden zwei Grenzen: die maximale Spannkraft je Zwinge und der maximale Zwingenabstand für eine gleichmäßige Druckverteilung. Die größere der beiden Vorgaben entscheidet.',
  howto: [
    'Fugenlänge und Fugenbreite (Brettdicke der Stoßfläche) in Millimeter eintragen.',
    'Empfohlenen Pressdruck nach Holzhärte wählen – Hartholz braucht mehr.',
    'Spannkraft je Zwinge und den maximalen Zwingenabstand angeben.',
    'Die ausgegebene Zwingenzahl gleichmäßig über die Fuge verteilen.',
  ],
  faq: [
    {
      q: 'Wie viel Pressdruck braucht eine Leimfuge?',
      a: 'Für PVAc-Weißleim üblich: Weichholz etwa 0,5–0,7 N/mm², Hartholz 0,8–1,2 N/mm². Höhere Werte verbessern den Holz-zu-Holz-Kontakt, dürfen den Leim aber nicht vollständig herausquetschen.',
    },
    {
      q: 'Warum begrenzt der Zwingenabstand die Anzahl?',
      a: 'Eine Zwinge presst nur einen Bereich um ihre Position. Sitzen sie zu weit auseinander, „durchhängt“ der Druck dazwischen und die Fuge öffnet sich. Daher gilt zusätzlich eine Abstandsregel.',
    },
    {
      q: 'Welche Spannkraft hat eine Zwinge?',
      a: 'Sehr unterschiedlich: leichte Einhandzwingen liefern rund 1000–2000 N, kräftige Schraubzwingen und Korpuszwingen 3000–5000 N und mehr. Der Wert steht oft auf dem Werkzeug.',
    },
    {
      q: 'Gilt das auch beim Verleimen von Plattenflächen?',
      a: 'Die Kraftrechnung gilt für die belastete Fläche. Bei großflächigen Verleimungen wird die nötige Gesamtkraft schnell sehr hoch – dann arbeitet man mit Pressen oder vielen Zwingen plus Druckleisten.',
    },
  ],
  related: ['leimholz-bretter', 'duebelabstand', 'pocket-hole-tiefe'],
  updated: '2026-06-16',
  examples: [
    {
      values: { laenge: 1000, breite: 20, druck: '0.7', zwingenkraft: 4000, abstand: 200 },
      expect: [
        { label: 'Erforderliche Presskraft', value: 14000, tolerance: 1 },
        { label: 'Anzahl Zwingen', value: 6, tolerance: 0 },
      ],
    },
    {
      values: { laenge: 600, breite: 18, druck: '0.6', zwingenkraft: 3000, abstand: 250 },
      expect: [
        { label: 'Erforderliche Presskraft', value: 6480, tolerance: 1 },
        { label: 'Anzahl Zwingen', value: 4, tolerance: 0 },
      ],
    },
  ],
};
