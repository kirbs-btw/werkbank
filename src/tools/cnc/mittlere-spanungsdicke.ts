import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'mittlere-spanungsdicke',
  category: 'cnc',
  title: 'Mittlere Spanungsdicke beim Fräsen (hm)',
  shortTitle: 'Spanungsdicke',
  description:
    'Berechne die mittlere Spanungsdicke hm beim Umfangsfräsen aus Zahnvorschub fz, Eingriffsbreite ae und Fräserdurchmesser. Basis für die Schnittkraft.',
  keywords: [
    'mittlere spanungsdicke berechnen',
    'spanungsdicke fräsen hm',
    'hm fräsen rechner',
    'eingriffswinkel fräser berechnen',
    'spandicke zahnvorschub',
    'chip thinning berechnen',
    'spanausdünnung fräsen',
  ],
  formula: 'hm = fz · (1 − cos φ_s) / φ_s = fz · (2·ae/d) / φ_s;  cos φ_s = 1 − 2·ae/d',
  inputs: [
    { type: 'number', id: 'fz', label: 'Vorschub pro Zahn fz', unit: 'mm/Zahn', default: 0.1, min: 0, step: 0.005 },
    { type: 'number', id: 'ae', label: 'Eingriffsbreite ae', unit: 'mm', default: 4, min: 0.01, step: 0.1, help: 'Radiale Zustellung quer zur Vorschubrichtung.' },
    { type: 'number', id: 'd', label: 'Fräserdurchmesser d', unit: 'mm', default: 10, min: 0.1, step: 0.1 },
  ],
  compute: (v) => {
    const fz = num(v.fz);
    const ae = num(v.ae);
    const d = num(v.d, 1);
    // Eingriffsverhältnis, auf [0,1] begrenzt
    const ratio = d > 0 ? Math.min(Math.max(ae / d, 0), 1) : 0;
    // Eingriffswinkel: cos(phi) = 1 - 2*ae/d
    const cosArg = 1 - 2 * ratio;
    const phiRad = Math.acos(Math.min(Math.max(cosArg, -1), 1));
    const phiGrad = phiRad * (180 / Math.PI);
    // mittlere Spanungsdicke aus Integration der Schnittdicke fz*sin(phi)
    // hm = fz * (1 - cos phi_s) / phi_s = fz * (2*ae/d) / phi_s (phi_s in rad)
    const hm = phiRad > 0 ? (fz * 2 * ratio) / phiRad : 0;
    return [
      { label: 'Mittlere Spanungsdicke hm', value: hm, unit: 'mm', digits: 4, primary: true },
      { label: 'Eingriffswinkel φs', value: phiGrad, unit: '°', digits: 1 },
      { label: 'Eingriffsverhältnis ae/d', value: ratio, unit: '', digits: 3 },
    ];
  },
  intro:
    'Beim Umfangsfräsen ändert sich die Spandicke entlang des Eingriffsbogens ständig – sie ist beim Eintritt null und erreicht erst im Lauf das Maximum. Maßgeblich für Schnittkraft und Standzeit ist daher die mittlere Spanungsdicke hm, gemittelt über den Eingriffswinkel φs. Dieser hängt vom Verhältnis ae/d ab. Bei kleiner radialer Zustellung tritt die berüchtigte Spanausdünnung auf: hm wird sehr klein, sodass man fz erhöhen muss, damit die Schneide schneidet statt reibt.',
  howto: [
    'Vorschub pro Zahn fz aus den Schnittdaten eintragen.',
    'Eingriffsbreite ae (radiale Zustellung) in mm eingeben.',
    'Fräserdurchmesser d in mm eingeben.',
    'Mittlere Spanungsdicke hm und Eingriffswinkel ablesen und mit dem hm-Sollwert des Werkzeugs vergleichen.',
  ],
  faq: [
    {
      q: 'Was ist Spanausdünnung (chip thinning)?',
      a: 'Bei kleiner Eingriffsbreite (ae deutlich kleiner als d) ist die mittlere Spanungsdicke viel kleiner als fz. Die Schneide trägt zu wenig ab und reibt, was Verschleiß und Hitze erzeugt. Abhilfe: fz erhöhen, bis hm wieder im empfohlenen Bereich liegt – das erlaubt zugleich höhere Vorschübe.',
    },
    {
      q: 'Wie groß ist hm bei vollem Eingriff (Nutfräsen)?',
      a: 'Bei ae = d (Volleingriff) ist der Eingriffswinkel 180° und hm = fz · 2/π ≈ 0,637 · fz. Auch hier ist die mittlere Dicke also kleiner als der Zahnvorschub.',
    },
    {
      q: 'Wofür brauche ich den Eingriffswinkel φs?',
      a: 'Der Eingriffswinkel bestimmt, wie lange jede Schneide im Eingriff ist, und beeinflusst die Verteilung der Schnittkraft und das Schwingungsverhalten. Aus cos φs = 1 − 2·ae/d ergibt er sich direkt aus dem Eingriffsverhältnis.',
    },
    {
      q: 'Gilt der Rechner fürs Gegenlauf- oder Gleichlauffräsen?',
      a: 'Der Betrag der mittleren Spanungsdicke ist in beiden Fällen gleich, da über denselben Eingriffsbogen gemittelt wird. Der Unterschied liegt im Verlauf (dick zu dünn beim Gleichlauf, umgekehrt beim Gegenlauf), nicht im Mittelwert hm.',
    },
  ],
  related: ['zeitspanvolumen', 'vorschub-umrechnung', 'spindelleistung-fraesen'],
  updated: '2026-06-16',
  examples: [
    {
      values: { fz: 0.1, ae: 5, d: 10 },
      expect: [
        { label: 'Eingriffswinkel φs', value: 90, tolerance: 0.5 },
        { label: 'Mittlere Spanungsdicke hm', value: 0.0637, tolerance: 0.001 },
      ],
    },
    {
      values: { fz: 0.1, ae: 10, d: 10 },
      expect: [{ label: 'Mittlere Spanungsdicke hm', value: 0.0637, tolerance: 0.001 }],
    },
  ],
};
