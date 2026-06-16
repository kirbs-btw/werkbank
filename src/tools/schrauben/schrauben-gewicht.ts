import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Dichte je Werkstoff in g/cm³.
const DICHTE: Record<string, number> = {
  stahl: 7.85,
  edelstahl: 7.95,
  messing: 8.5,
  alu: 2.70,
};

export const tool: Tool = {
  slug: 'schrauben-gewicht',
  category: 'schrauben',
  title: 'Schrauben-Gewicht überschlägig berechnen',
  shortTitle: 'Schrauben-Gewicht',
  description:
    'Schätze das Gewicht einer Schraube aus Durchmesser, Länge und Werkstoff — Schaft als Zylinder plus Kopfzuschlag, ideal für Versand- und Mengenkalkulation.',
  keywords: [
    'schrauben gewicht berechnen',
    'gewicht schraube m8',
    'schraubengewicht tabelle',
    'masse schraube stahl',
    'wie schwer ist eine schraube',
    'schrauben kg pro stück',
    'edelstahlschraube gewicht',
  ],
  formula: 'm ≈ (π/4 · d² · L + Kopf) · ρ  (Zylindernäherung)',
  inputs: [
    { type: 'number', id: 'd', label: 'Nenndurchmesser d', unit: 'mm', default: 8, min: 1, step: 0.5 },
    { type: 'number', id: 'l', label: 'Schaftlänge L', unit: 'mm', default: 50, min: 1, step: 1, help: 'Länge ohne Kopf (bei Sechskant) bzw. Gesamtlänge ohne Kopf.' },
    { type: 'number', id: 'stueck', label: 'Stückzahl', default: 100, min: 1, step: 1 },
    {
      type: 'select', id: 'werkstoff', label: 'Werkstoff', default: 'stahl',
      options: [
        { value: 'stahl', label: 'Stahl (7,85 g/cm³)' },
        { value: 'edelstahl', label: 'Edelstahl A2/A4 (7,95 g/cm³)' },
        { value: 'messing', label: 'Messing (8,5 g/cm³)' },
        { value: 'alu', label: 'Aluminium (2,70 g/cm³)' },
      ],
    },
  ],
  compute: (v) => {
    const d = num(v.d);
    const L = num(v.l);
    const stueck = num(v.stueck, 1);
    const rho = DICHTE[String(v.werkstoff)] ?? DICHTE.stahl;
    // Schaft als Vollzylinder, mm³
    const vSchaft = (Math.PI / 4) * d * d * L;
    // Kopf überschlägig: Zylinder Durchmesser 1,7·d, Höhe 0,7·d
    const dKopf = 1.7 * d;
    const vKopf = (Math.PI / 4) * dKopf * dKopf * (0.7 * d);
    const vGesamt = vSchaft + vKopf; // mm³
    const mStueck = (vGesamt / 1000) * rho; // cm³ * g/cm³ = g
    const mGesamt = mStueck * stueck; // g
    return [
      { label: 'Gewicht je Schraube', value: mStueck, unit: 'g', digits: 1, primary: true },
      { label: 'Gewicht gesamt (g)', value: mGesamt, unit: 'g', digits: 0 },
      { label: 'Gewicht gesamt (kg)', value: mGesamt / 1000, unit: 'kg', digits: 3 },
    ];
  },
  intro:
    'Dieser Rechner schätzt das Gewicht einer Schraube überschlägig, indem er den Schaft als Vollzylinder (π/4 · d² · L) modelliert und einen pauschalen Kopfzuschlag addiert. Multipliziert mit der Werkstoffdichte ergibt sich die Masse je Stück und für die gewünschte Stückzahl. So lassen sich Versandgewichte, Sortimentskästen oder Mengen für Kalkulationen schnell abschätzen, ohne jede Schraube zu wiegen.',
  howto: [
    'Nenndurchmesser und Schaftlänge der Schraube eintragen.',
    'Werkstoff wählen — die Dichte wird automatisch gesetzt.',
    'Stückzahl angeben, etwa für eine ganze Packung.',
    'Gewicht je Schraube sowie das Gesamtgewicht in g und kg ablesen.',
  ],
  faq: [
    { q: 'Wie genau ist die Schätzung?', a: 'Es ist eine Näherung mit etwa ±10 Prozent. Das Gewinde entfernt etwas Material, der Sechskantkopf ist kein exakter Zylinder. Für Versand und Mengenkalkulation ist die Genauigkeit ausreichend.' },
    { q: 'Warum wird der Schaft als Vollzylinder gerechnet?', a: 'Der Gewindebereich liegt im Mittel knapp unter dem Nenndurchmesser. Der Vollzylinder über den Nenndurchmesser liefert daher einen leicht oberen Schätzwert, der durch den Materialabtrag des Gewindes ungefähr ausgeglichen wird.' },
    { q: 'Was wiegt eine M8×50 aus Stahl?', a: 'Schaft 0,7854 · 8² · 50 ≈ 2513 mm³ plus Kopfzuschlag ergeben rund 26 g. Reale Sechskantschrauben M8×50 (8.8) liegen bei etwa 25 bis 27 g, die Näherung passt also gut.' },
    { q: 'Kann ich Edelstahl statt Stahl wählen?', a: 'Ja. Edelstahl A2/A4 ist mit 7,95 g/cm³ minimal schwerer als Stahl, Messing deutlich schwerer und Aluminium nur rund ein Drittel so schwer. Die Dichte bestimmt das Ergebnis direkt.' },
  ],
  related: ['metrisches-gewinde-tabelle', 'schluesselweite'],
  updated: '2026-06-16',
  examples: [
    { values: { d: 8, l: 50, stueck: 1, werkstoff: 'stahl' }, expect: [{ label: 'Gewicht je Schraube', value: 26.1, tolerance: 0.5 }] },
    { values: { d: 6, l: 30, stueck: 100, werkstoff: 'stahl' }, expect: [{ label: 'Gewicht gesamt (g)', value: 935, tolerance: 10 }] },
  ],
};
