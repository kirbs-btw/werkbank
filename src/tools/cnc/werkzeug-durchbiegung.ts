import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'werkzeug-durchbiegung',
  category: 'cnc',
  title: 'Werkzeug-Durchbiegung (Auskraglänge) Rechner',
  shortTitle: 'Werkzeug-Durchbiegung',
  description:
    'Berechne die Durchbiegung eines auskragenden Fräsers als Kragträger aus Schaftdurchmesser, Auskraglänge, Querkraft und E-Modul.',
  keywords: [
    'werkzeug durchbiegung berechnen',
    'fräser auskraglänge durchbiegung',
    'kragträger fräser rechner',
    'schaft durchbiegung cnc',
    'maßabweichung fräser durchbiegung',
    'rattern auskraglänge berechnen',
    'steifigkeit fräser schaft',
  ],
  formula: 'I = π·d⁴/64;  δ = F·L³ / (3·E·I)  (mm)',
  inputs: [
    { type: 'number', id: 'd', label: 'Schaftdurchmesser d', unit: 'mm', default: 10, min: 0.1, step: 0.5, help: 'Tragender Schaftdurchmesser des Werkzeugs.' },
    { type: 'number', id: 'L', label: 'Auskraglänge L', unit: 'mm', default: 40, min: 1, step: 1, help: 'Freie Länge vom Spannfutter bis zur Schneide.' },
    { type: 'number', id: 'F', label: 'Querkraft F', unit: 'N', default: 200, min: 0, step: 10, help: 'Senkrecht wirkende Schnittkraft (≈ Fc oder deren Radialanteil).' },
    {
      type: 'select',
      id: 'mat',
      label: 'Werkzeugwerkstoff',
      default: '600000',
      options: [
        { value: '600000', label: 'Hartmetall (E ≈ 600 GPa)' },
        { value: '210000', label: 'HSS / Stahl (E ≈ 210 GPa)' },
      ],
      help: 'E-Modul des Schaftmaterials.',
    },
  ],
  compute: (v) => {
    const d = num(v.d, 0.1);
    const L = num(v.L);
    const F = num(v.F);
    const E = num(v.mat, 600000);
    const I = (Math.PI * Math.pow(d, 4)) / 64;
    const delta = E > 0 && I > 0 ? (F * Math.pow(L, 3)) / (3 * E * I) : 0;
    const deltaMy = delta * 1000;
    return [
      { label: 'Durchbiegung δ', value: delta, unit: 'mm', digits: 4, primary: true },
      { label: 'Durchbiegung δ in µm', value: deltaMy, unit: 'µm', digits: 1 },
      { label: 'Flächenträgheitsmoment I', value: I, unit: 'mm⁴', digits: 1 },
    ];
  },
  intro:
    'Ein lang auskragender Fräser verhält sich wie ein einseitig eingespannter Kragträger und biegt sich unter der Schnittkraft elastisch durch. Diese Durchbiegung verfälscht das Maß, erzeugt konische Wände und begünstigt Rattern. Da die Durchbiegung mit der dritten Potenz der Auskraglänge und der vierten Potenz des Durchmessers eingeht, lohnt sich kurzes Spannen und ein möglichst dicker Schaft. Der Rechner schätzt die statische Auslenkung an der Werkzeugspitze.',
  howto: [
    'Schaftdurchmesser d in mm eintragen (tragender, nicht der Schneidendurchmesser bei Reduzierschaft).',
    'Auskraglänge L vom Futter bis zur Schneide in mm eingeben.',
    'Querkraft F abschätzen (z. B. aus der Zerspankraft Fc) und Werkzeugwerkstoff wählen.',
    'Durchbiegung δ ablesen und bei zu großem Wert L verkürzen oder dickeren Schaft wählen.',
  ],
  faq: [
    {
      q: 'Warum ist die Auskraglänge so kritisch?',
      a: 'Die Durchbiegung wächst mit L³. Eine Verdopplung der Auskraglänge verachtfacht die Durchbiegung. Spanne das Werkzeug daher immer so kurz wie möglich – wenige Millimeter mehr Auskragung können das Ergebnis stark verschlechtern.',
    },
    {
      q: 'Welche Querkraft soll ich einsetzen?',
      a: 'Sinnvoll ist die radial wirkende Komponente der Schnittkraft. Als grobe Näherung kann die Zerspankraft Fc eingesetzt werden; beim Schlichten ist die Kraft deutlich kleiner als beim Schruppen.',
    },
    {
      q: 'Gilt die Rechnung für Vollhartmetall- und Reduzierschaft-Fräser?',
      a: 'Maßgebend ist der dünnste tragende Querschnitt. Bei einem Fräser mit Halsfreistellung oder Reduzierschaft ist der kleinere Durchmesser einzusetzen, sonst wird die Steifigkeit überschätzt.',
    },
    {
      q: 'Ist das die reale Maßabweichung?',
      a: 'Es ist die elastische Auslenkung der Spitze. Die tatsächliche Maßabweichung an der Wand hängt zusätzlich von Frässtrategie, Gleich-/Gegenlauf und mehreren Überfahrten ab, liegt aber in derselben Größenordnung.',
    },
  ],
  related: ['zerspankraft-fc', 'spindelleistung-fraesen', 'mittlere-spanungsdicke'],
  updated: '2026-06-16',
  examples: [
    {
      values: { d: 10, L: 40, F: 200, mat: '600000' },
      expect: [{ label: 'Durchbiegung δ', value: 0.0145, tolerance: 0.0005 }],
    },
    {
      values: { d: 6, L: 30, F: 100, mat: '210000' },
      expect: [{ label: 'Durchbiegung δ', value: 0.0674, tolerance: 0.002 }],
    },
  ],
};
