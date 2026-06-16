import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

const FAKTOR: Record<string, number> = {
  weichholz: 0.7,
  hartholz: 0.85,
};

export const tool: Tool = {
  slug: 'holzschraube-vorbohren',
  category: 'schrauben',
  title: 'Vorbohrdurchmesser-Rechner fuer Holzschrauben',
  shortTitle: 'Holzschraube vorbohren',
  description: 'Berechne den passenden Vorbohrdurchmesser fuer Holzschrauben aus dem Gewindedurchmesser und der Holzart (Weich- oder Hartholz).',
  keywords: ['holzschraube vorbohren', 'vorbohrdurchmesser holzschraube', 'welcher bohrer fuer holzschraube', 'vorbohren tabelle holz'],
  formula: 'Vorbohrer = Faktor (Holzart) x Gewindedurchmesser d',
  inputs: [
    { type: 'number', id: 'durchmesser', label: 'Gewindedurchmesser d', unit: 'mm', default: 4, min: 1, step: 0.5, help: 'Aeusserer Durchmesser der Holzschraube.' },
    {
      type: 'select', id: 'holzart', label: 'Holzart', default: 'weichholz',
      options: [
        { value: 'weichholz', label: 'Weichholz (x0,7)' },
        { value: 'hartholz', label: 'Hartholz (x0,85)' },
      ],
      help: 'Hartholz braucht ein groesseres Vorbohrloch, damit es nicht reisst.',
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
  intro: 'Holzschrauben werden vorgebohrt, damit das Holz nicht reisst und sich die Schraube leichter eindrehen laesst. Der Bohrer richtet sich nach Gewindedurchmesser und Holzart.',
  howto: [
    'Gewindedurchmesser der Holzschraube messen oder ablesen.',
    'Holzart waehlen: Weichholz oder Hartholz.',
    'Vorbohrdurchmesser ablesen und naechstpassenden Bohrer waehlen.',
    'Im Kantenbereich grosszuegiger vorbohren, um Reissen zu vermeiden.',
  ],
  faq: [
    { q: 'Muss ich immer vorbohren?', a: 'Bei Hartholz, in Kantennaehe und bei groesseren Schrauben ja. In Weichholz und mit selbstbohrenden Schrauben kann das Vorbohren oft entfallen.' },
    { q: 'Soll ich auch den Senkkopf vorbohren?', a: 'Fuer einen buendigen Senkkopf empfiehlt sich zusaetzlich ein Senker oder ein Kombibohrer mit Senkung.' },
  ],
  related: ['kernlochbohrer'],
  updated: '2026-06-15',
  examples: [
    { values: { durchmesser: 4, holzart: 'weichholz' }, expect: [{ label: 'Vorbohrdurchmesser', value: 2.8, tolerance: 0.01 }] },
    { values: { durchmesser: 4, holzart: 'hartholz' }, expect: [{ label: 'Vorbohrdurchmesser', value: 3.4, tolerance: 0.01 }] },
  ],
};
