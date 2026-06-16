import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'zerspankraft-fc',
  category: 'cnc',
  title: 'Zerspankraft Fc (Kienzle) Rechner',
  shortTitle: 'Zerspankraft Fc',
  description:
    'Berechne die Hauptschnittkraft Fc nach Kienzle aus Spanungsbreite, Spanungsdicke und der werkstoffabhängigen Kraftkonstante kc1.1.',
  keywords: [
    'zerspankraft berechnen',
    'schnittkraft fc kienzle',
    'kienzle formel rechner',
    'spezifische schnittkraft kc',
    'hauptschnittkraft fräsen drehen',
    'kc1.1 mc schnittkraft',
    'schnittkraft drehen berechnen',
  ],
  formula: 'kc = kc1.1 · h^(−mc);  Fc = kc · b · h = kc1.1 · b · h^(1−mc)  (N)',
  inputs: [
    { type: 'number', id: 'b', label: 'Spanungsbreite b', unit: 'mm', default: 3, min: 0.01, step: 0.5, help: 'Bei Drehen ≈ ap / sin κ; vereinfacht oft ap.' },
    { type: 'number', id: 'h', label: 'Spanungsdicke h', unit: 'mm', default: 0.2, min: 0.001, step: 0.01, help: 'Bei Drehen ≈ f · sin κ; beim Fräsen mittlere Spanungsdicke hm.' },
    {
      type: 'select',
      id: 'werkstoff',
      label: 'Werkstoff (kc1.1 / mc)',
      default: 'stahl',
      options: [
        { value: 'stahl', label: 'Baustahl ~600 N/mm² (kc1.1 1700, mc 0,25)' },
        { value: 'verguetung', label: 'Vergütungsstahl (kc1.1 2000, mc 0,26)' },
        { value: 'edelstahl', label: 'Edelstahl V2A (kc1.1 2350, mc 0,21)' },
        { value: 'guss', label: 'Grauguss GG (kc1.1 1020, mc 0,28)' },
        { value: 'alu', label: 'Aluminium (kc1.1 700, mc 0,23)' },
      ],
    },
  ],
  compute: (v) => {
    const b = num(v.b, 0.01);
    const h = num(v.h, 0.001);
    const map: Record<string, { kc11: number; mc: number }> = {
      stahl: { kc11: 1700, mc: 0.25 },
      verguetung: { kc11: 2000, mc: 0.26 },
      edelstahl: { kc11: 2350, mc: 0.21 },
      guss: { kc11: 1020, mc: 0.28 },
      alu: { kc11: 700, mc: 0.23 },
    };
    const w = map[String(v.werkstoff)] || map.stahl;
    const hSafe = h > 0 ? h : 0.001;
    const kc = w.kc11 * Math.pow(hSafe, -w.mc);
    const fc = kc * b * hSafe;
    const aSpan = b * hSafe;
    return [
      { label: 'Hauptschnittkraft Fc', value: fc, unit: 'N', digits: 0, primary: true },
      { label: 'Spezifische Schnittkraft kc', value: kc, unit: 'N/mm²', digits: 0 },
      { label: 'Spanungsquerschnitt A', value: aSpan, unit: 'mm²', digits: 3 },
    ];
  },
  intro:
    'Die Hauptschnittkraft Fc ist die wichtigste Komponente der Zerspankraft und entscheidet über Antriebsleistung, Werkzeugbelastung und Durchbiegung. Das Kienzle-Modell beschreibt sie aus dem Spanungsquerschnitt und der spezifischen Schnittkraft kc, die mit dünner werdendem Span ansteigt (kc-Anstieg). Die Materialkonstanten kc1.1 (spezifische Schnittkraft bei 1 mm² Bezugsquerschnitt) und der Anstiegswert mc kommen aus Tabellen. So lässt sich Fc vor dem Schnitt zuverlässig abschätzen.',
  howto: [
    'Spanungsbreite b in mm eingeben (beim Drehen näherungsweise die Schnitttiefe ap).',
    'Spanungsdicke h in mm eintragen (beim Drehen f·sin κ, beim Fräsen die mittlere Spanungsdicke hm).',
    'Werkstoff mit hinterlegtem kc1.1 und mc wählen.',
    'Hauptschnittkraft Fc und spezifische Schnittkraft kc ablesen; Fc dient als Eingang für Leistung und Durchbiegung.',
  ],
  faq: [
    {
      q: 'Warum steigt kc bei kleiner Spanungsdicke?',
      a: 'Bei dünnem Span überwiegt die Reibung an der Schneidkante gegenüber dem reinen Abscheren. Der Exponent −mc bewirkt, dass die spezifische Schnittkraft kc mit sinkender Spanungsdicke h zunimmt – ein dünner Span ist pro mm² „teurer".',
    },
    {
      q: 'Was ist der Unterschied zwischen kc1.1 und kc?',
      a: 'kc1.1 ist die spezifische Schnittkraft beim Bezugsquerschnitt von 1 mm² (b = h = 1 mm). Der tatsächliche kc-Wert für deine Spanungsdicke ergibt sich daraus über kc = kc1.1 · h^(−mc).',
    },
    {
      q: 'Gilt die Formel für Drehen und Fräsen?',
      a: 'Ja, das Grundmodell ist gleich. Beim Drehen ist h konstant (f·sin κ), beim Fräsen schwankt die Spanungsdicke pro Zahn – dort setzt man die mittlere Spanungsdicke hm ein und rechnet die Kraft je Schneide.',
    },
    {
      q: 'Wie komme ich von Fc zur Schnittleistung?',
      a: 'Die Schnittleistung ist Pc = Fc · vc. Mit Fc in N und der Schnittgeschwindigkeit vc in m/s ergibt sich die Leistung in Watt. Berücksichtige noch den Wirkungsgrad der Maschine.',
    },
  ],
  related: ['spindelleistung-fraesen', 'mittlere-spanungsdicke', 'werkzeug-durchbiegung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { b: 3, h: 0.2, werkstoff: 'stahl' },
      expect: [
        { label: 'Hauptschnittkraft Fc', value: 1525, tolerance: 15 },
        { label: 'Spezifische Schnittkraft kc', value: 2542, tolerance: 20 },
      ],
    },
    {
      values: { b: 2, h: 0.1, werkstoff: 'alu' },
      expect: [{ label: 'Hauptschnittkraft Fc', value: 238, tolerance: 5 }],
    },
  ],
};
