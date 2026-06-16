import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'spindel-drehmoment',
  category: 'cnc',
  title: 'Spindel-Drehmoment-Rechner (CNC)',
  shortTitle: 'Spindel-Drehmoment',
  description:
    'Berechne das verfügbare Drehmoment einer CNC-Spindel aus Leistung und Drehzahl. Wichtig für große Werkzeuge und niedrige Drehzahlen beim Schruppen.',
  keywords: [
    'drehmoment berechnen spindel',
    'drehmoment aus leistung und drehzahl',
    'spindel drehmoment rechner',
    'motormoment berechnen cnc',
    'nm aus kw und drehzahl',
    'drehmoment fräsen berechnen',
    'spindelmoment niedrige drehzahl',
  ],
  formula: 'M = 9550 · P / n  (Nm), mit P in kW und n in 1/min',
  inputs: [
    { type: 'number', id: 'p', label: 'Leistung P', unit: 'kW', default: 5, min: 0, step: 0.1, help: 'Verfügbare oder benötigte Spindelleistung.' },
    { type: 'number', id: 'n', label: 'Drehzahl n', unit: '1/min', default: 1500, min: 1, step: 10, help: 'Aktuelle Spindeldrehzahl.' },
  ],
  compute: (v) => {
    const p = num(v.p);
    const n = num(v.n, 1);
    const m = n > 0 ? (9550 * p) / n : 0;
    return [
      { label: 'Drehmoment M', value: m, unit: 'Nm', digits: 2, primary: true },
    ];
  },
  intro:
    'Das Drehmoment einer Spindel beschreibt die Drehkraft, die am Werkzeug anliegt, und ergibt sich aus Leistung und Drehzahl über die Konstante 9550. Bei konstanter Leistung wächst das Moment, je langsamer die Spindel dreht – darum ist beim Schruppen mit großen Fräsern und niedriger Drehzahl gerade der untere Drehzahlbereich kritisch. Mit diesem Rechner prüfst du, ob deine Spindel bei der geplanten Drehzahl genug Moment liefert.',
  howto: [
    'Leistung P in kW eintragen (Nennleistung der Spindel oder benötigte Schnittleistung).',
    'Aktuelle Drehzahl n in 1/min eintragen.',
    'Drehmoment M in Nm ablesen.',
    'Mit dem Drehmoment vergleichen, das der gewählte Schnitt erfordert – besonders im unteren Drehzahlbereich.',
  ],
  faq: [
    {
      q: 'Woher kommt die Zahl 9550?',
      a: 'Sie folgt aus M = P / ω mit ω = 2·π·n/60. Setzt man P in Watt und n in 1/min ein und löst auf, ergibt sich der Faktor 60000/(2·π) ≈ 9549,3. Mit P in kW lautet die Formel M = 9550 · P / n.',
    },
    {
      q: 'Warum ist das Moment bei niedriger Drehzahl wichtig?',
      a: 'Viele Spindeln liefern oberhalb einer Eckdrehzahl konstante Leistung, darunter aber nur konstantes Maximalmoment. Bei großen Werkzeugen und kleiner Drehzahl kann das verfügbare Moment limitieren, obwohl die Nennleistung reichen würde.',
    },
    {
      q: 'Wie rechne ich von Nm zurück auf die Leistung?',
      a: 'Stelle die Formel um: P = M · n / 9550. So bekommst du aus Drehmoment und Drehzahl die zugehörige Leistung in kW.',
    },
    {
      q: 'Gilt die Formel auch für Servomotoren und Vorschubantriebe?',
      a: 'Ja, der Zusammenhang M = 9550 · P / n gilt für jeden rotierenden Antrieb, solange P in kW und n in 1/min stehen. Für Vorschubspindeln wird das Moment anschließend über Spindelsteigung und Wirkungsgrad in Vorschubkraft umgerechnet.',
    },
  ],
  related: ['spindelleistung-fraesen', 'schnittgeschwindigkeit', 'drehzahl-vorschub'],
  updated: '2026-06-16',
  examples: [
    {
      values: { p: 5, n: 1500 },
      expect: [{ label: 'Drehmoment M', value: 31.83, tolerance: 0.05 }],
    },
    {
      values: { p: 7.5, n: 1000 },
      expect: [{ label: 'Drehmoment M', value: 71.63, tolerance: 0.05 }],
    },
  ],
};
