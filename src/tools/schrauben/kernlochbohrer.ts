import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'kernlochbohrer',
  category: 'schrauben',
  title: 'Kernlochbohrer-Rechner (metrisches Gewinde)',
  shortTitle: 'Kernlochbohrer',
  description: 'Berechne den richtigen Kernlochbohrer fuer metrische Regelgewinde (M3 bis M16) aus Nenndurchmesser und Steigung.',
  keywords: ['kernlochbohrer rechner', 'kernloch metrisches gewinde', 'vorbohrer gewindeschneiden tabelle', 'bohrer fuer gewinde m8'],
  formula: 'Kernloch = Nenndurchmesser d - Steigung P',
  inputs: [
    {
      type: 'select', id: 'gewinde', label: 'Gewinde', default: '8|1.25',
      options: [
        { value: '3|0.5', label: 'M3' },
        { value: '4|0.7', label: 'M4' },
        { value: '5|0.8', label: 'M5' },
        { value: '6|1.0', label: 'M6' },
        { value: '8|1.25', label: 'M8' },
        { value: '10|1.5', label: 'M10' },
        { value: '12|1.75', label: 'M12' },
        { value: '16|2.0', label: 'M16' },
      ],
      help: 'Metrisches Regelgewinde (DIN 13).',
    },
  ],
  compute: (v) => {
    const parts = String(v.gewinde).split('|');
    const d = num(parts[0]);
    const P = num(parts[1]);
    const kernloch = d - P;
    return [
      { label: 'Steigung P', value: P, unit: 'mm', digits: 2 },
      { label: 'Kernlochbohrer Durchmesser', value: kernloch, unit: 'mm', digits: 2, primary: true },
    ];
  },
  intro: 'Vor dem Gewindeschneiden muss ein Kernloch gebohrt werden. Der Bohrerdurchmesser ergibt sich beim Regelgewinde aus Nenndurchmesser minus Steigung.',
  howto: [
    'Gewindegroesse aus der Liste waehlen.',
    'Steigung P und Kernlochdurchmesser ablesen.',
    'Passenden Bohrer auswaehlen und Kernloch bohren.',
    'Anschliessend mit dem Gewindeschneider das Gewinde schneiden.',
  ],
  faq: [
    { q: 'Gilt die Formel auch fuer Feingewinde?', a: 'Nein, hier wird das metrische Regelgewinde nach DIN 13 verwendet. Feingewinde haben eine kleinere Steigung und damit ein groesseres Kernloch.' },
    { q: 'Warum nicht exakt der Kerndurchmesser?', a: 'Die Faustformel d minus P liefert ein leicht groesseres Kernloch, sodass das Gewinde sauber und mit weniger Kraft geschnitten werden kann.' },
  ],
  related: ['durchgangsloch'],
  updated: '2026-06-15',
  examples: [
    { values: { gewinde: '8|1.25' }, expect: [{ label: 'Kernlochbohrer Durchmesser', value: 6.75, tolerance: 0.01 }] },
    { values: { gewinde: '6|1.0' }, expect: [{ label: 'Kernlochbohrer Durchmesser', value: 5.0, tolerance: 0.01 }] },
  ],
};
