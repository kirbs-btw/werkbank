import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schraube-laengung',
  category: 'schrauben',
  title: 'Schraubendehnung unter Vorspannkraft (ΔL)',
  shortTitle: 'Schraubendehnung',
  description:
    'Berechne die elastische Längung einer Schraube unter Vorspannkraft aus Klemmlänge, Querschnitt und E-Modul — Basis des längengesteuerten Anziehens.',
  keywords: [
    'schraubendehnung berechnen',
    'schraube längung vorspannkraft',
    'elastische dehnung schraube',
    'delta l schraube',
    'schraubenverlängerung messen',
    'dehnung anziehen schraube',
    'längung klemmlänge',
  ],
  formula: 'ΔL = F · L / (E · A)',
  inputs: [
    { type: 'number', id: 'f', label: 'Vorspannkraft F', unit: 'N', default: 20000, min: 0, step: 500 },
    { type: 'number', id: 'l', label: 'Dehnlänge L', unit: 'mm', default: 50, min: 1, step: 1, help: 'Längskraft tragende Länge, näherungsweise die Klemmlänge.' },
    { type: 'number', id: 'a', label: 'Querschnitt A', unit: 'mm²', default: 36.6, min: 1, step: 0.1, help: 'Spannungsquerschnitt As, z. B. 36,6 mm² für M8.' },
    { type: 'number', id: 'e', label: 'E-Modul', unit: 'N/mm²', default: 210000, min: 1000, step: 1000, help: 'Stahl ≈ 210000, Titan ≈ 110000, Aluminium ≈ 70000.' },
  ],
  compute: (v) => {
    const f = num(v.f);
    const l = num(v.l);
    const a = num(v.a);
    const e = num(v.e, 210000);
    const dl = e * a > 0 ? (f * l) / (e * a) : 0; // mm
    const spannung = a > 0 ? f / a : 0; // N/mm²
    const steifigkeit = l > 0 ? (e * a) / l : 0; // N/mm
    return [
      { label: 'Zugspannung in der Schraube', value: spannung, unit: 'N/mm²', digits: 0 },
      { label: 'Längung ΔL', value: dl, unit: 'mm', digits: 4, primary: true },
      { label: 'Längung in µm', value: dl * 1000, unit: 'µm', digits: 1 },
      { label: 'Schraubensteifigkeit', value: steifigkeit, unit: 'N/mm', digits: 0, help: 'Federkonstante der Schraube in Längsrichtung.' },
    ];
  },
  intro:
    'Wird eine Schraube vorgespannt, dehnt sie sich im elastischen Bereich linear nach dem Hookeschen Gesetz: ΔL = F · L / (E · A). Diese Längung ist die Grundlage des dehnungsgesteuerten Anziehens, bei dem nicht das Drehmoment, sondern die gemessene Verlängerung die Vorspannkraft definiert. Typische Werte liegen im Bereich weniger Hundertstel Millimeter, weshalb präzise Messung oder Dehnschrauben nötig sind. Der Rechner liefert zugleich Zugspannung und Steifigkeit der Schraube.',
  howto: [
    'Gewünschte Vorspannkraft F in Newton eintragen.',
    'Dehnlänge L angeben — näherungsweise die Klemmlänge zwischen Kopf und Mutterauflage.',
    'Tragenden Querschnitt A eintragen (Spannungsquerschnitt As).',
    'E-Modul des Schraubenwerkstoffs wählen und Längung ΔL ablesen.',
  ],
  faq: [
    { q: 'Wozu brauche ich die Längung?', a: 'Beim längengesteuerten Anziehen misst man die Verlängerung der Schraube statt des Drehmoments. Da ΔL direkt proportional zur Vorspannkraft ist, lässt sich die Kraft so reibungsunabhängig und sehr genau einstellen.' },
    { q: 'Welcher E-Modul gilt für Schraubenstahl?', a: 'Für Stahl rund 210000 N/mm², weitgehend unabhängig von der Festigkeitsklasse. Titan liegt bei etwa 110000, Aluminium bei rund 70000 N/mm², was zu deutlich größerer Dehnung führt.' },
    { q: 'Warum ist die Dehnlänge wichtig?', a: 'Die Längung wächst proportional mit der Länge. Lange, schlanke Dehnschrauben dehnen sich stärker und halten die Vorspannkraft auch bei kleinen Setzbeträgen besser, weil sie elastischer sind.' },
    { q: 'Gilt die Formel nur im elastischen Bereich?', a: 'Ja. Sobald die Spannung die Streckgrenze überschreitet, beginnt plastisches Fließen und die lineare Beziehung gilt nicht mehr. Deshalb sollte die Zugspannung deutlich unter Rp0,2 bleiben.' },
  ],
  related: ['max-vorspannkraft', 'spannungsquerschnitt', 'vorspannkraft'],
  updated: '2026-06-16',
  examples: [
    { values: { f: 20000, l: 50, a: 36.6, e: 210000 }, expect: [{ label: 'Längung ΔL', value: 0.1301, tolerance: 0.001 }] },
    { values: { f: 20000, l: 50, a: 36.6, e: 210000 }, expect: [{ label: 'Zugspannung in der Schraube', value: 546, tolerance: 1 }] },
  ],
};
