import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Faustfaktor m_eff / d für tragende Gewinde-Eingrifflänge je Gewindewerkstoff,
// damit das Gegengewinde nicht vor der Schraube versagt (angelehnt an VDI 2230).
const FAKTOR: Record<string, number> = {
  stahl: 0.8,
  guss: 1.0,
  messing: 1.2,
  aluminium: 1.4,
  magnesium: 2.0,
  kunststoff: 2.5,
};

export const tool: Tool = {
  slug: 'gewinde-eingrifflaenge',
  category: 'schrauben',
  title: 'Tragende Gewinde-Eingrifflänge berechnen',
  shortTitle: 'Eingrifflänge',
  description:
    'Berechne die nötige tragende Eingrifflänge eines Innengewindes, damit das Gegengewinde nicht vor der Schraube ausreißt — je nach Werkstoff.',
  keywords: [
    'gewinde eingrifflänge berechnen',
    'tragende gewindegänge anzahl',
    'eingriffslänge gewinde',
    'mindesteinschraubtiefe festigkeit',
    'gewinde ausreißen vermeiden',
    'tragende länge mutterngewinde',
    'gewindegänge tragend',
  ],
  formula: 'm_eff = Faktor(Werkstoff) · d,  tragende Gänge = m_eff / P',
  inputs: [
    { type: 'number', id: 'd', label: 'Nenndurchmesser d', unit: 'mm', default: 8, min: 1, step: 0.5, help: 'Außendurchmesser der Schraube, z. B. 8 für M8.' },
    { type: 'number', id: 'p', label: 'Steigung P', unit: 'mm', default: 1.25, min: 0.2, step: 0.05, help: 'Regelgewinde M8 = 1,25 mm.' },
    {
      type: 'select', id: 'werkstoff', label: 'Werkstoff des Innengewindes', default: 'aluminium',
      options: [
        { value: 'stahl', label: 'Stahl / Stahlmutter (×0,8)' },
        { value: 'guss', label: 'Grauguss (×1,0)' },
        { value: 'messing', label: 'Messing / Bronze (×1,2)' },
        { value: 'aluminium', label: 'Aluminium (×1,4)' },
        { value: 'magnesium', label: 'Magnesium (×2,0)' },
        { value: 'kunststoff', label: 'Kunststoff (×2,5)' },
      ],
      help: 'Weiche Werkstoffe brauchen mehr tragende Gewindegänge.',
    },
  ],
  compute: (v) => {
    const d = num(v.d);
    const P = num(v.p);
    const f = FAKTOR[String(v.werkstoff)] ?? 1.0;
    const mEff = d * f;
    const gaenge = P > 0 ? mEff / P : 0;
    const bohrtiefe = mEff + 2 * P + 2; // Auslauf + Reserve bei Sackloch
    return [
      { label: 'Tragende Eingrifflänge m_eff', value: mEff, unit: 'mm', digits: 1, primary: true },
      { label: 'Tragende Gewindegänge', value: gaenge, unit: '', digits: 1 },
      { label: 'Empf. Bohrtiefe Sackloch', value: bohrtiefe, unit: 'mm', digits: 1, help: 'Eingrifflänge plus Gewindeauslauf und Reserve.' },
    ];
  },
  intro:
    'Damit eine hochfeste Schraube bei Überlast in ihrem Schaft bricht und nicht das weichere Gegengewinde ausreißt, muss die Mutter oder das Sacklochgewinde genügend tragende Gewindegänge bieten. Die nötige tragende Eingrifflänge wächst mit sinkender Festigkeit des Innengewinde-Werkstoffs: Stahl genügt etwa 0,8·d, Aluminium braucht rund 1,4·d und Kunststoff bis 2,5·d. Diese an VDI 2230 angelehnten Faustwerte verhindern das gefürchtete Überdrehen weicher Gewinde.',
  howto: [
    'Nenndurchmesser d der Schraube eintragen.',
    'Gewindesteigung P angeben (Regel- oder Feingewinde).',
    'Werkstoff des Innengewindes wählen.',
    'Tragende Eingrifflänge und Gängezahl ablesen; bei Sackloch die Bohrtiefe planen.',
  ],
  faq: [
    { q: 'Warum braucht Aluminium mehr Eingriff als Stahl?', a: 'Das Innengewinde reißt bei Überlast über die Gewindeflanken ab. Bei weichem Werkstoff ist die Scherfestigkeit geringer, deshalb müssen mehr Gänge tragen, damit die Verbindung so stark wie die Schraube selbst wird.' },
    { q: 'Was bedeutet tragende Eingrifflänge?', a: 'Nur die voll im Eingriff stehenden Gewindegänge tragen Last. Gewindeauslauf, Fasen und unvollständige Gänge zählen nicht mit, weshalb das Sackloch tiefer gebohrt wird als die reine Eingrifflänge.' },
    { q: 'Wie viele Gänge braucht eine M8 in Stahl?', a: 'Bei 0,8·d = 6,4 mm und P = 1,25 mm sind das rund 5 tragende Gänge. Eine Standardmutter mit 6,8 mm Höhe erfüllt das damit knapp.' },
    { q: 'Gilt das auch für Feingewinde?', a: 'Ja. Da Feingewinde eine kleinere Steigung haben, ergeben sich bei gleicher Eingrifflänge mehr tragende Gänge. Die nötige Länge in mm bleibt aber näherungsweise gleich.' },
    { q: 'Wodurch unterscheidet sich das von der Einschraubtiefe?', a: 'Die Eingrifflänge betrachtet gezielt die Festigkeit des Gegengewindes und gibt die Gängezahl aus. Der Einschraubtiefe-Rechner liefert eine einfachere Werkstoff-Faustregel für die Praxis.' },
  ],
  related: ['einschraubtiefe', 'kernlochbohrer', 'spannungsquerschnitt'],
  updated: '2026-06-16',
  examples: [
    { values: { d: 8, p: 1.25, werkstoff: 'aluminium' }, expect: [{ label: 'Tragende Eingrifflänge m_eff', value: 11.2, tolerance: 0.01 }] },
    { values: { d: 8, p: 1.25, werkstoff: 'stahl' }, expect: [{ label: 'Tragende Gewindegänge', value: 5.12, tolerance: 0.02 }] },
  ],
};
