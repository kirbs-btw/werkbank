import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'drehzahl-vorschub',
  category: 'cnc',
  title: 'CNC Drehzahl- & Vorschub-Rechner',
  shortTitle: 'Drehzahl & Vorschub',
  description:
    'Berechne Spindeldrehzahl und Vorschub aus Schnittgeschwindigkeit, Werkzeugdurchmesser, Zähnezahl und Zahnvorschub.',
  keywords: [
    'schnittdaten rechner',
    'drehzahl fräser berechnen',
    'vorschub berechnen cnc',
    'feeds and speeds rechner',
  ],
  formula: 'n = vc · 1000 / (π · d)  ·  vf = n · fz · z',
  inputs: [
    { type: 'number', id: 'vc', label: 'Schnittgeschwindigkeit vc', unit: 'm/min', default: 120, min: 1, step: 1 },
    { type: 'number', id: 'd', label: 'Werkzeugdurchmesser d', unit: 'mm', default: 6, min: 0.1, step: 0.1 },
    { type: 'number', id: 'z', label: 'Zähnezahl z', default: 2, min: 1, step: 1 },
    { type: 'number', id: 'fz', label: 'Zahnvorschub fz', unit: 'mm', default: 0.02, min: 0, step: 0.005 },
  ],
  compute: (v) => {
    const vc = num(v.vc);
    const d = num(v.d, 1);
    const z = num(v.z, 1);
    const fz = num(v.fz);
    const n = (vc * 1000) / (Math.PI * d);
    const vf = n * fz * z;
    return [
      { label: 'Drehzahl n', value: n, unit: '1/min', digits: 0, primary: true },
      { label: 'Vorschub vf', value: vf, unit: 'mm/min', digits: 0 },
    ];
  },
  intro:
    'Zwei Formeln tragen die gesamte Fräsbearbeitung. Die Schnittgeschwindigkeit vc ist eine Eigenschaft der Paarung aus Werkstoff und Schneidstoff und bleibt gleich, egal wie groß das Werkzeug ist – die Drehzahl folgt daraus über n = vc · 1000 / (π · d). Ein 3-mm-Fräser braucht deshalb die doppelte Drehzahl eines 6-mm-Fräsers für dieselbe Schnittgeschwindigkeit, und bei kleinen Durchmessern stößt man schnell an die Grenze der Spindel. Der Vorschub ergibt sich anschließend aus dem Zahnvorschub fz – und der ist die eigentlich kritische Größe, weil er die Spandicke bestimmt. Zu klein gewählt, reibt das Werkzeug, statt zu schneiden; das kostet mehr Fräser als ein zu hoher Wert.',
  howto: [
      'Schnittgeschwindigkeit vc für die Kombination aus Werkstoff und Werkzeug eintragen – aus der Herstellertabelle oder dem Schnittdaten-Rechner.',
      'Werkzeugdurchmesser d angeben; daraus ergibt sich die Drehzahl.',
      'Zähnezahl z des Fräsers eintragen.',
      'Zahnvorschub fz ergänzen und Drehzahl sowie Vorschub ablesen. Liegt die Drehzahl über dem Maximum deiner Spindel, senke vc – nicht fz.',
  ],
  faq: [
    {
      q: 'Woher bekomme ich vc und fz?',
      a: 'Schnittgeschwindigkeit vc und Zahnvorschub fz hängen von Material und Werkzeug ab und stehen in den Schnittdaten-Tabellen des Fräser-Herstellers. Wenn du keine Tabelle zur Hand hast, liefert dir der Schnittdaten-Rechner mit Material-Datenbank passende Richtwerte für Werkstoff und Werkzeug.',
    },
  ],
  related: ['schnittdaten-rechner', 'schnittgeschwindigkeit', 'vorschub-fraesen'],
  updated: '2026-08-26',
  examples: [
    {
      values: { vc: 120, d: 6, z: 2, fz: 0.02 },
      expect: [
        { label: 'Drehzahl n', value: 6366, tolerance: 5 },
        { label: 'Vorschub vf', value: 254.6, tolerance: 2 },
      ],
    },
  ],
};
