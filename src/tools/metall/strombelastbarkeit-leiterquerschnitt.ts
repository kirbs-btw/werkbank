import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'strombelastbarkeit-leiterquerschnitt',
  category: 'metall',
  title: 'Strombelastbarkeit nach Leiterquerschnitt',
  shortTitle: 'Strombelastbarkeit',
  description: 'Ermittle die zulässige Strombelastbarkeit eines Kupferleiters nach Querschnitt und berechne den Spannungsfall über Länge, Strom und Leitermaterial.',
  keywords: ['strombelastbarkeit leiterquerschnitt', 'kabelquerschnitt strom rechner', 'ampere pro mm2 kupfer', 'zulässiger strom leitung', 'spannungsfall berechnen', 'belastbarkeit kabel tabelle', 'leiterquerschnitt ampere', 'kupferleitung strom'],
  formula: 'Spannungsfall U = (2 · L · I · ρ) / A  (ρ Cu = 0,0178 Ω·mm²/m, L in m, A in mm²)',
  inputs: [
    {
      type: 'select', id: 'querschnitt', label: 'Leiterquerschnitt', default: '2.5', unit: 'mm²',
      options: [
        { value: '1.5', label: '1,5 mm² (≈16 A)' },
        { value: '2.5', label: '2,5 mm² (≈20 A)' },
        { value: '4', label: '4 mm² (≈25 A)' },
        { value: '6', label: '6 mm² (≈32 A)' },
        { value: '10', label: '10 mm² (≈43 A)' },
        { value: '16', label: '16 mm² (≈57 A)' },
        { value: '25', label: '25 mm² (≈73 A)' },
      ],
    },
    {
      type: 'select', id: 'material', label: 'Leitermaterial', default: '0.0178',
      options: [
        { value: '0.0178', label: 'Kupfer (Cu)' },
        { value: '0.0286', label: 'Aluminium (Al)' },
      ],
    },
    { type: 'number', id: 'strom', label: 'Betriebsstrom', unit: 'A', default: 16, min: 0, step: 1, help: 'Tatsächlicher Laststrom' },
    { type: 'number', id: 'laenge', label: 'Leitungslänge (einfach)', unit: 'm', default: 20, min: 0, step: 1, help: 'Einfache Strecke; Hin- und Rückleiter werden verdoppelt' },
    { type: 'number', id: 'spannung', label: 'Nennspannung', unit: 'V', default: 230, min: 1, step: 1 },
  ],
  compute: (v) => {
    const A = num(v.querschnitt, 2.5);
    const rho = num(v.material, 0.0178);
    const I = num(v.strom);
    const L = num(v.laenge);
    const U = num(v.spannung, 230);
    // Zulässige Belastbarkeit (Cu, Verlegeart B2, Richtwerte) per mm² zugeordnet:
    const ampacity: Record<string, number> = {
      '1.5': 16, '2.5': 20, '4': 25, '6': 32, '10': 43, '16': 57, '25': 73,
    };
    const key = String(num(v.querschnitt, 2.5));
    let zulaessig = ampacity[key] ?? 0;
    // Bei Aluminium grob ca. 80 % des Kupferwerts:
    if (rho > 0.02) zulaessig = zulaessig * 0.8;
    const spannungsfallV = A > 0 ? (2 * L * I * rho) / A : 0;
    const spannungsfallProzent = U > 0 ? (spannungsfallV / U) * 100 : 0;
    return [
      { label: 'Zulässige Belastbarkeit', value: zulaessig, unit: 'A', digits: 0, primary: true },
      { label: 'Spannungsfall', value: spannungsfallV, unit: 'V', digits: 2 },
      { label: 'Spannungsfall relativ', value: spannungsfallProzent, unit: '%', digits: 2 },
    ];
  },
  intro: 'Dieser Rechner zeigt die zulässige Strombelastbarkeit gängiger Kupfer-Leiterquerschnitte (Richtwerte für die Verlegeart B2 nach VDE 0298-4) und berechnet den Spannungsfall über die Leitungslänge. Der Spannungsfall folgt aus U = 2·L·I·ρ/A, wobei der Faktor 2 Hin- und Rückleiter erfasst. Für Werkstatt, Maschinenanschluss und Verlängerungen prüfst du so, ob ein Querschnitt sowohl thermisch tragfähig ist als auch den Spannungsfall (Richtwert max. 3 %) einhält.',
  howto: [
    'Leiterquerschnitt aus der Liste wählen — der Richtwert für die Belastbarkeit erscheint.',
    'Leitermaterial Kupfer oder Aluminium auswählen.',
    'Betriebsstrom in Ampere und die einfache Leitungslänge in Metern eingeben.',
    'Nennspannung setzen und Spannungsfall in Volt und Prozent ablesen.',
  ],
  faq: [
    { q: 'Sind die Ampere-Werte verbindlich?', a: 'Nein, es sind übliche Richtwerte für Kupfer bei der Verlegeart B2 (Leitung in Wand/Rohr, drei belastete Adern). Je nach Verlegeart, Häufung und Umgebungstemperatur gelten andere Werte — maßgeblich ist die VDE 0298-4.' },
    { q: 'Warum wird die Länge im Spannungsfall verdoppelt?', a: 'Der Strom fließt hin und zurück. Bei einem Wechselstromkreis ist die wirksame Leiterlänge daher die doppelte einfache Strecke, deshalb der Faktor 2 in der Formel.' },
    { q: 'Wie viel Spannungsfall ist erlaubt?', a: 'Für Endstromkreise empfiehlt die Praxis maximal 3 %, vom Hausanschluss bis Verbraucher insgesamt etwa 4 %. Größere Werte bedeuten Leistungsverlust und können Geräte stören.' },
    { q: 'Warum ist Aluminium schlechter belastbar?', a: 'Aluminium hat einen höheren spezifischen Widerstand (0,0286 statt 0,0178 Ω·mm²/m). Bei gleichem Querschnitt trägt es weniger Strom und erzeugt mehr Spannungsfall — der Rechner setzt rund 80 % des Kupferwerts an.' },
    { q: 'Gilt das auch für Drehstrom?', a: 'Bei symmetrischem Drehstrom ist der Spannungsfall geringer (Faktor √3 statt 2). Diese Formel gilt für Gleich- und Wechselstromkreise mit Hin- und Rückleiter.' },
  ],
  related: ['draht-gewicht', 'rundmaterial-gewicht', 'rohr-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { querschnitt: '2.5', material: '0.0178', strom: 16, laenge: 20, spannung: 230 },
      expect: [{ label: 'Zulässige Belastbarkeit', value: 20, tolerance: 0.1 }],
    },
    {
      values: { querschnitt: '1.5', material: '0.0178', strom: 10, laenge: 25, spannung: 230 },
      expect: [{ label: 'Spannungsfall', value: 5.93, tolerance: 0.1 }],
    },
  ],
};
