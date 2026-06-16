import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Typische Gesamtreibungszahlen (Gewinde + Kopf) nach Oberfläche/Schmierung.
const MUE: Record<string, number> = {
  trocken: 0.20,
  leichtgeoelt: 0.14,
  geoelt: 0.12,
  mos2: 0.10,
  verzinkt: 0.16,
  geschmiert: 0.08,
};

export const tool: Tool = {
  slug: 'drehmoment-reibungskorrektur',
  category: 'schrauben',
  title: 'Anzugsmoment auf andere Reibung umrechnen',
  shortTitle: 'Reibungskorrektur',
  description:
    'Rechne ein Tabellen-Anzugsmoment auf eine abweichende Reibungszahl um — geschmierte oder trockene Schrauben brauchen ein anderes Moment.',
  keywords: [
    'anzugsmoment reibung umrechnen',
    'drehmoment schmierung korrektur',
    'reibungszahl anzugsmoment',
    'drehmoment geölte schraube',
    'mos2 anzugsmoment',
    'reibwert schraube drehmoment',
    'anzugsmoment trocken geschmiert',
  ],
  formula: 'M_neu = M_tab · (µ_neu / µ_tab)',
  inputs: [
    { type: 'number', id: 'mtab', label: 'Tabellen-Anzugsmoment', unit: 'Nm', default: 25, min: 0, step: 0.5, help: 'Wert aus der Drehmomenttabelle.' },
    {
      type: 'select', id: 'mutab', label: 'Reibung der Tabelle', default: 'leichtgeoelt',
      options: [
        { value: 'trocken', label: 'trocken (µ = 0,20)' },
        { value: 'verzinkt', label: 'verzinkt (µ = 0,16)' },
        { value: 'leichtgeoelt', label: 'leicht geölt (µ = 0,14)' },
        { value: 'geoelt', label: 'geölt (µ = 0,12)' },
        { value: 'mos2', label: 'MoS2 (µ = 0,10)' },
        { value: 'geschmiert', label: 'stark geschmiert (µ = 0,08)' },
      ],
      help: 'Reibung, für die das Tabellenmoment gilt (oft µ = 0,14).',
    },
    {
      type: 'select', id: 'muist', label: 'Tatsächliche Reibung', default: 'mos2',
      options: [
        { value: 'trocken', label: 'trocken (µ = 0,20)' },
        { value: 'verzinkt', label: 'verzinkt (µ = 0,16)' },
        { value: 'leichtgeoelt', label: 'leicht geölt (µ = 0,14)' },
        { value: 'geoelt', label: 'geölt (µ = 0,12)' },
        { value: 'mos2', label: 'MoS2 (µ = 0,10)' },
        { value: 'geschmiert', label: 'stark geschmiert (µ = 0,08)' },
      ],
      help: 'Reibung im realen Einbauzustand.',
    },
  ],
  compute: (v) => {
    const mtab = num(v.mtab);
    const muTab = MUE[String(v.mutab)] ?? 0.14;
    const muIst = MUE[String(v.muist)] ?? 0.14;
    const mNeu = muTab > 0 ? mtab * (muIst / muTab) : 0;
    const differenz = muTab > 0 ? (muIst / muTab - 1) * 100 : 0;
    return [
      { label: 'Reibung Tabelle µ', value: muTab, unit: '', digits: 2 },
      { label: 'Reibung tatsächlich µ', value: muIst, unit: '', digits: 2 },
      { label: 'Korrigiertes Anzugsmoment', value: mNeu, unit: 'Nm', digits: 1, primary: true },
      { label: 'Abweichung zum Tabellenwert', value: differenz, unit: '%', digits: 0 },
    ];
  },
  intro:
    'Drehmomenttabellen gelten immer für eine bestimmte Reibungszahl, meist µ = 0,14. Liegt die tatsächliche Reibung anders, weil die Schraube geschmiert, beschichtet oder trocken ist, erreicht dasselbe Moment eine andere Vorspannkraft. Da das Anzugsmoment in guter Näherung proportional zur Reibung ist, lässt es sich einfach umrechnen: M_neu = M_tab · (µ_neu / µ_tab). So bleibt die Vorspannkraft trotz abweichender Schmierung gleich.',
  howto: [
    'Anzugsmoment aus der Tabelle eintragen.',
    'Reibung wählen, für die der Tabellenwert gilt (häufig leicht geölt, µ = 0,14).',
    'Tatsächliche Reibung im Einbauzustand wählen.',
    'Korrigiertes Anzugsmoment ablesen und am Drehmomentschlüssel einstellen.',
  ],
  faq: [
    { q: 'Warum sinkt das Moment bei mehr Schmierung?', a: 'Bei geringerer Reibung wird weniger Drehmoment in der Reibung verbraucht, mehr geht in Vorspannung. Behält man das volle Tabellenmoment bei, überspannt man die Schraube. Deshalb muss das Moment bei Schmierung reduziert werden.' },
    { q: 'Ist die Umrechnung exakt?', a: 'Sie ist eine sehr gute Näherung, weil der reibungsabhängige Anteil das Anzugsmoment dominiert. Der kleine reibungsunabhängige Steigungsanteil wird vernachlässigt, was für die Praxis ausreichend genau ist.' },
    { q: 'Was bedeutet MoS2?', a: 'Molybdändisulfid ist ein Festschmierstoff mit sehr niedriger Reibung (µ ≈ 0,10). Beschichtete oder mit MoS2-Paste behandelte Schrauben brauchen daher ein spürbar geringeres Anzugsmoment als trockene.' },
    { q: 'Was ist bei verzinkten Schrauben zu beachten?', a: 'Galvanisch verzinkte Schrauben haben eine etwas höhere Reibung (µ ≈ 0,16) als blanke geölte. Ohne Schmierung kann die Reibung stark streuen, weshalb definierte Schmierung empfohlen wird.' },
  ],
  related: ['anzugsmoment-tabelle', 'anzugsmoment', 'vorspannkraft'],
  updated: '2026-06-16',
  examples: [
    { values: { mtab: 25, mutab: 'leichtgeoelt', muist: 'mos2' }, expect: [{ label: 'Korrigiertes Anzugsmoment', value: 17.9, tolerance: 0.1 }] },
    { values: { mtab: 25, mutab: 'leichtgeoelt', muist: 'trocken' }, expect: [{ label: 'Korrigiertes Anzugsmoment', value: 35.7, tolerance: 0.1 }] },
  ],
};
