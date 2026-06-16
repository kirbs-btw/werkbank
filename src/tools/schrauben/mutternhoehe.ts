import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Mutternhöhe m (max) nach DIN EN ISO 4032 (Sechskantmutter Typ 1, = DIN 934),
// sowie niedrige Mutter nach DIN EN ISO 4035 (= DIN 439), in mm.
const TABLE: Record<string, { m: number; mLow: number }> = {
  M3: { m: 2.4, mLow: 1.8 },
  M4: { m: 3.2, mLow: 2.2 },
  M5: { m: 4.7, mLow: 2.7 },
  M6: { m: 5.2, mLow: 3.2 },
  M8: { m: 6.8, mLow: 4.0 },
  M10: { m: 8.4, mLow: 5.0 },
  M12: { m: 10.8, mLow: 6.0 },
  M14: { m: 12.8, mLow: 7.0 },
  M16: { m: 14.8, mLow: 8.0 },
  M20: { m: 18.0, mLow: 10.0 },
  M24: { m: 21.5, mLow: 12.0 },
};

export const tool: Tool = {
  slug: 'mutternhoehe',
  category: 'schrauben',
  title: 'Mutternhöhe nach DIN EN ISO 4032 je Größe',
  shortTitle: 'Mutternhöhe',
  description:
    'Schlage die Höhe von Sechskantmuttern M3 bis M24 nach DIN EN ISO 4032 (Typ 1) und der niedrigen Mutter nach ISO 4035 nach.',
  keywords: [
    'mutternhöhe tabelle',
    'sechskantmutter höhe din 934',
    'mutter höhe m8',
    'iso 4032 maße',
    'niedrige mutter höhe',
    'mutternhöhe metrisch',
    'gewindeüberstand mutter',
  ],
  formula: 'Lookup m nach DIN EN ISO 4032 (Typ 1) bzw. ISO 4035 (niedrig)',
  inputs: [
    {
      type: 'select', id: 'gewinde', label: 'Gewinde', default: 'M8',
      options: [
        { value: 'M3', label: 'M3' },
        { value: 'M4', label: 'M4' },
        { value: 'M5', label: 'M5' },
        { value: 'M6', label: 'M6' },
        { value: 'M8', label: 'M8' },
        { value: 'M10', label: 'M10' },
        { value: 'M12', label: 'M12' },
        { value: 'M14', label: 'M14' },
        { value: 'M16', label: 'M16' },
        { value: 'M20', label: 'M20' },
        { value: 'M24', label: 'M24' },
      ],
      help: 'Standard-Sechskantmutter Typ 1 (DIN 934 / ISO 4032).',
    },
  ],
  compute: (v) => {
    const key = String(v.gewinde);
    const row = TABLE[key] ?? TABLE.M8;
    return [
      { label: 'Mutternhöhe m (Typ 1)', value: row.m, unit: 'mm', digits: 1, primary: true },
      { label: 'Höhe niedrige Mutter (ISO 4035)', value: row.mLow, unit: 'mm', digits: 1 },
      { label: 'Empf. Gewindeüberstand', value: row.m * 0.5 + 2, unit: 'mm', digits: 1, help: 'Faustregel: mindestens 1–2 Gewindegänge über die Mutter hinaus.' },
    ];
  },
  intro:
    'Die Höhe einer Sechskantmutter bestimmt, wie viele Gewindegänge tragen und wie lang die Schraube über die Mutter hinausstehen muss. Die Standardmutter Typ 1 nach DIN EN ISO 4032 (früher DIN 934) hat eine Höhe von etwa dem 0,8- bis 0,9-fachen Nenndurchmesser, die niedrige Mutter nach ISO 4035 ist deutlich flacher. Der Wert hilft, die richtige Schraubenlänge zu wählen und einen sauberen Gewindeüberstand sicherzustellen.',
  howto: [
    'Gewindegröße der Mutter wählen (M3 bis M24).',
    'Höhe der Standardmutter Typ 1 ablesen.',
    'Bei niedriger Mutter den kleineren Wert nach ISO 4035 verwenden.',
    'Schraubenlänge so wählen, dass die Schraube ein bis zwei Gänge über die Mutter ragt.',
  ],
  faq: [
    { q: 'Wie hoch ist eine M8-Mutter?', a: 'Eine Standard-Sechskantmutter M8 nach ISO 4032 ist maximal 6,8 mm hoch. Die niedrige Ausführung nach ISO 4035 misst nur etwa 4,0 mm.' },
    { q: 'Warum gibt es niedrige Muttern?', a: 'Niedrige Muttern (ISO 4035) sparen Bauhöhe und werden oft als Kontermutter eingesetzt. Sie tragen weniger Last als die Standardmutter und sollten nicht hochbelastet werden.' },
    { q: 'Wie viel muss die Schraube überstehen?', a: 'Als Faustregel sollten ein bis zwei volle Gewindegänge über die Mutter hinausragen, damit das Gewinde vollständig trägt. Der Rechner gibt dazu einen Richtwert aus.' },
    { q: 'Hat DIN 934 dieselbe Höhe wie ISO 4032?', a: 'Im Wesentlichen ja. DIN 934 wurde durch DIN EN ISO 4032 abgelöst; die Mutternhöhen sind für die gängigen Größen identisch, nur einzelne Schlüsselweiten wurden angepasst.' },
  ],
  related: ['schluesselweite', 'schraubenlaenge', 'metrisches-gewinde-tabelle'],
  updated: '2026-06-16',
  examples: [
    { values: { gewinde: 'M8' }, expect: [{ label: 'Mutternhöhe m (Typ 1)', value: 6.8, tolerance: 0.01 }] },
    { values: { gewinde: 'M12' }, expect: [{ label: 'Höhe niedrige Mutter (ISO 4035)', value: 6.0, tolerance: 0.01 }] },
  ],
};
