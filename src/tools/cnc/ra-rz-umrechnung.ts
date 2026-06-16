import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'ra-rz-umrechnung',
  category: 'cnc',
  title: 'Ra ↔ Rz Umrechnung (Oberflächenrauheit)',
  shortTitle: 'Ra ↔ Rz',
  description:
    'Rechne Mittenrauwert Ra in gemittelte Rautiefe Rz um und zurück – mit wählbarem Erfahrungsfaktor für Drehen, Fräsen und Schleifen.',
  keywords: [
    'ra rz umrechnung',
    'ra in rz umrechnen',
    'rz aus ra berechnen',
    'oberflächenrauheit umrechnen',
    'mittenrauwert gemittelte rautiefe',
    'rauheit ra rz faktor',
    'rz ra faustformel',
  ],
  formula: 'Rz ≈ k · Ra   bzw.   Ra ≈ Rz / k   (k = Erfahrungsfaktor)',
  inputs: [
    {
      type: 'select',
      id: 'richtung',
      label: 'Umrechnungsrichtung',
      default: 'ra2rz',
      options: [
        { value: 'ra2rz', label: 'Ra → Rz' },
        { value: 'rz2ra', label: 'Rz → Ra' },
      ],
    },
    { type: 'number', id: 'wert', label: 'Eingabewert', unit: 'µm', default: 1.6, min: 0, step: 0.1, help: 'Ra bzw. Rz je nach gewählter Richtung.' },
    {
      type: 'select',
      id: 'k',
      label: 'Umrechnungsfaktor k',
      default: '4',
      options: [
        { value: '4', label: 'k = 4 (typisch, Standard)' },
        { value: '5', label: 'k = 5 (Drehen/Fräsen, grob)' },
        { value: '7', label: 'k = 7 (sehr glatt, Schleifen)' },
      ],
      help: 'Erfahrungsfaktor zwischen Rz und Ra (Rz = k·Ra).',
    },
  ],
  compute: (v) => {
    const richtung = String(v.richtung || 'ra2rz');
    const wert = num(v.wert);
    const k = num(v.k, 4) || 4;
    if (richtung === 'rz2ra') {
      const ra = k > 0 ? wert / k : 0;
      return [
        { label: 'Ra (geschätzt)', value: ra, unit: 'µm', digits: 3, primary: true },
        { label: 'verwendeter Faktor k', value: k, unit: '', digits: 0 },
      ];
    }
    const rz = wert * k;
    return [
      { label: 'Rz (geschätzt)', value: rz, unit: 'µm', digits: 2, primary: true },
      { label: 'verwendeter Faktor k', value: k, unit: '', digits: 0 },
    ];
  },
  intro:
    'Ra (arithmetischer Mittenrauwert) und Rz (gemittelte Rautiefe) beschreiben dieselbe Oberfläche mit unterschiedlichen Kennwerten und lassen sich nicht exakt ineinander umrechnen. In der Praxis nutzt man dennoch einen Erfahrungsfaktor, weil Zeichnungen mal Ra, mal Rz vorgeben. Für gefräste oder gedrehte Flächen liegt Rz typisch beim 4- bis 5-fachen von Ra, bei sehr feinen geschliffenen Oberflächen auch höher. Der Rechner liefert eine Schätzung – die einzig sichere Aussage liefert die Messung.',
  howto: [
    'Umrechnungsrichtung wählen: Ra → Rz oder Rz → Ra.',
    'Den bekannten Rauheitswert in µm eintragen.',
    'Erfahrungsfaktor k passend zum Verfahren auswählen (Standard k = 4).',
    'Geschätzten Gegenwert ablesen und auf der Zeichnung bzw. beim Messprotokoll abgleichen.',
  ],
  faq: [
    {
      q: 'Kann man Ra und Rz exakt umrechnen?',
      a: 'Nein. Beide Kennwerte werten dasselbe Profil unterschiedlich aus (Mittelwert gegen Spitze-Tal). Eine feste Umrechnung gibt es nicht – nur Erfahrungsfaktoren für ähnliche Oberflächenarten.',
    },
    {
      q: 'Welcher Faktor stimmt für meine Oberfläche?',
      a: 'Für übliche Dreh- und Fräsflächen liegt Rz/Ra meist bei 4 bis 5. Bei sehr glatten, feinen Profilen (Schleifen, Polieren) kann das Verhältnis bis 7 oder höher gehen, weil einzelne Spitzen stärker durchschlagen.',
    },
    {
      q: 'Was bedeutet ein Ra von 1,6 µm?',
      a: 'Ra 1,6 µm ist eine fein gedrehte oder gefräste Oberfläche, wie sie für viele Passungen ausreicht. Mit k = 4 entspricht das etwa Rz 6,4 µm.',
    },
    {
      q: 'Warum ist Rz immer größer als Ra?',
      a: 'Rz mittelt die größten Profilhöhen über mehrere Einzelstrecken, Ra mittelt die Beträge aller Abweichungen. Spitzen und Täler gehen bei Rz voll ein, bei Ra werden sie geglättet – deshalb ist Rz stets größer.',
    },
  ],
  related: ['theoretische-rautiefe', 'vorschub-drehen'],
  updated: '2026-06-16',
  examples: [
    {
      values: { richtung: 'ra2rz', wert: 1.6, k: '4' },
      expect: [{ label: 'Rz (geschätzt)', value: 6.4, tolerance: 0.01 }],
    },
    {
      values: { richtung: 'rz2ra', wert: 16, k: '4' },
      expect: [{ label: 'Ra (geschätzt)', value: 4, tolerance: 0.01 }],
    },
  ],
};
