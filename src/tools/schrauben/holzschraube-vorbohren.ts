import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

const FAKTOR: Record<string, number> = {
  weichholz: 0.7,
  hartholz: 0.85,
};

export const tool: Tool = {
  slug: 'holzschraube-vorbohren',
  category: 'schrauben',
  title: 'Vorbohrdurchmesser-Rechner für Holzschrauben',
  shortTitle: 'Holzschraube vorbohren',
  description: 'Berechne den passenden Vorbohrdurchmesser für Holzschrauben aus dem Gewindedurchmesser und der Holzart (Weich- oder Hartholz).',
  keywords: ['holzschraube vorbohren', 'vorbohrdurchmesser holzschraube', 'welcher bohrer fuer holzschraube', 'vorbohren tabelle holz'],
  formula: 'Vorbohrer = Faktor (Holzart) x Gewindedurchmesser d',
  inputs: [
    { type: 'number', id: 'durchmesser', label: 'Gewindedurchmesser d', unit: 'mm', default: 4, min: 1, step: 0.5, help: 'Äußerer Durchmesser der Holzschraube.' },
    {
      type: 'select', id: 'holzart', label: 'Holzart', default: 'weichholz',
      options: [
        { value: 'weichholz', label: 'Weichholz (x0,7)' },
        { value: 'hartholz', label: 'Hartholz (x0,85)' },
      ],
      help: 'Hartholz braucht ein größeres Vorbohrloch, damit es nicht reißt.',
    },
  ],
  compute: (v) => {
    const d = num(v.durchmesser);
    const f = FAKTOR[String(v.holzart)] ?? 0.7;
    const vorbohrer = d * f;
    return [
      { label: 'Vorbohrdurchmesser', value: vorbohrer, unit: 'mm', digits: 1, primary: true },
    ];
  },
  intro: 'Holzschrauben werden vorgebohrt, damit das Holz nicht reißt und sich die Schraube leichter eindrehen lässt. Der Bohrer richtet sich nach Gewindedurchmesser und Holzart.',
  howto: [
    'Gewindedurchmesser der Holzschraube messen oder ablesen.',
    'Holzart wählen: Weichholz oder Hartholz.',
    'Vorbohrdurchmesser ablesen und nächstpassenden Bohrer wählen.',
    'Im Kantenbereich großzügiger vorbohren, um Reißen zu vermeiden.',
  ],
  faq: [
    { q: 'Muss ich immer vorbohren?', a: 'Bei Hartholz, in Kantennähe und bei größeren Schrauben ja. In Weichholz und mit selbstbohrenden Schrauben kann das Vorbohren oft entfallen.' },
    { q: 'Soll ich auch den Senkkopf vorbohren?', a: 'Für einen bündigen Senkkopf empfiehlt sich zusätzlich ein Senker oder ein Kombibohrer mit Senkung.' },
  ],
  related: ['kernlochbohrer'],
  updated: '2026-08-27',
  examples: [
    { values: { durchmesser: 4, holzart: 'weichholz' }, expect: [{ label: 'Vorbohrdurchmesser', value: 2.8, tolerance: 0.01 }] },
    { values: { durchmesser: 4, holzart: 'hartholz' }, expect: [{ label: 'Vorbohrdurchmesser', value: 3.4, tolerance: 0.01 }] },
  ],
};
