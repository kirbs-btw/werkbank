import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'bohrzeit',
  category: 'cnc',
  title: 'Bohrzeit-Rechner (Hauptzeit)',
  shortTitle: 'Bohrzeit',
  description:
    'Berechne die Hauptzeit beim Bohren aus Bohrtiefe, Spitzenzuschlag, Überlauf, Drehzahl und Vorschub pro Umdrehung. Für Zeitkalkulation und Taktung.',
  keywords: [
    'bohrzeit berechnen',
    'hauptzeit bohren rechner',
    'bohrzeit cnc berechnen',
    'bearbeitungszeit bohren',
    'bohrdauer berechnen',
    'zeit bohren vorschub',
    'hauptnutzungszeit bohren',
  ],
  formula: 't = (L + l_a + l_ü) / (n · f)  (min), Anschnitt l_a ≈ 0,3 · d bei 118°-Spitze',
  inputs: [
    { type: 'number', id: 'l', label: 'Bohrtiefe L', unit: 'mm', default: 30, min: 0, step: 1, help: 'Tiefe des zylindrischen Bohrungsteils.' },
    { type: 'number', id: 'd', label: 'Bohrerdurchmesser d', unit: 'mm', default: 10, min: 0.1, step: 0.1, help: 'Für den Spitzenzuschlag l_a ≈ 0,3 · d.' },
    { type: 'number', id: 'lu', label: 'Überlauf l_ü', unit: 'mm', default: 2, min: 0, step: 0.5, help: 'Sicherheits-/Durchbruchweg, bei Durchgangsloch oft 1-3 mm.' },
    { type: 'number', id: 'n', label: 'Drehzahl n', unit: '1/min', default: 800, min: 1, step: 10 },
    { type: 'number', id: 'f', label: 'Vorschub f', unit: 'mm/U', default: 0.15, min: 0.001, step: 0.01, help: 'Vorschub pro Umdrehung.' },
  ],
  compute: (v) => {
    const l = num(v.l);
    const d = num(v.d, 1);
    const lu = num(v.lu);
    const n = num(v.n, 1);
    const f = num(v.f, 0.1);
    const la = 0.3 * d;
    const weg = l + la + lu;
    const vf = n * f;
    const tMin = vf > 0 ? weg / vf : 0;
    return [
      { label: 'Bohrzeit t', value: tMin, unit: 'min', digits: 3, primary: true },
      { label: 'Bohrzeit in Sekunden', value: tMin * 60, unit: 's', digits: 1 },
      { label: 'Verfahrweg gesamt', value: weg, unit: 'mm', digits: 2 },
      { label: 'Spitzenzuschlag l_a', value: la, unit: 'mm', digits: 2 },
    ];
  },
  intro:
    'Die Bohrzeit (Hauptzeit) ist die reine Schnittzeit, in der sich der Bohrer in Vorschubrichtung durch das Werkstück bewegt. Sie ergibt sich aus dem gesamten Verfahrweg – Bohrtiefe plus Spitzenzuschlag (rund 0,3 · d bei einem 118°-Spitzenwinkel) plus Überlauf – geteilt durch die Vorschubgeschwindigkeit n · f. Für Kalkulation, Taktzeit und Stückkosten ist diese Zeit die Basis.',
  howto: [
    'Bohrtiefe L (zylindrischer Anteil) in mm eintragen.',
    'Bohrerdurchmesser d eingeben – daraus wird der Spitzenzuschlag l_a ≈ 0,3 · d ergänzt.',
    'Überlauf l_ü für sicheren Durchbruch bzw. Anlauf eintragen.',
    'Drehzahl n und Vorschub f (mm/U) eingeben und die Bohrzeit in Minuten bzw. Sekunden ablesen.',
  ],
  faq: [
    {
      q: 'Warum der Spitzenzuschlag 0,3 · d?',
      a: 'Ein Spiralbohrer mit 118° Spitzenwinkel muss zuerst mit seiner Spitze komplett eintauchen, bevor der volle Durchmesser schneidet. Dieser Anschnittweg beträgt geometrisch etwa 0,3 · d (genau 0,29 · d). Bei Durchgangsbohrungen verlängert das die Schnittzeit spürbar.',
    },
    {
      q: 'Was ist der Unterschied zwischen f und vf?',
      a: 'f ist der Vorschub pro Umdrehung (mm/U), vf ist die Vorschubgeschwindigkeit (mm/min). Es gilt vf = n · f. Beim Bohren wird f angegeben, weil er direkt die Spanungsdicke bestimmt.',
    },
    {
      q: 'Zählt die Bohrzeit auch die Rückzugszeit?',
      a: 'Nein, die Hauptzeit erfasst nur den Vorschub-Schnittweg. Eilgang-Rückzug, Positionieren und Spanbruch-Entlastungszyklen gehören zur Nebenzeit und werden separat kalkuliert.',
    },
    {
      q: 'Wie wirkt sich der Vorschub auf die Zeit aus?',
      a: 'Die Bohrzeit ist umgekehrt proportional zum Vorschub: doppelter Vorschub halbiert die Zeit. Allerdings steigen dann Kräfte und Verschleiß, daher muss f zum Werkstoff und Bohrer passen.',
    },
  ],
  related: ['bohrer-drehzahl', 'spitzenzuschlag-bohren', 'planfraeszeit'],
  updated: '2026-06-16',
  examples: [
    {
      values: { l: 30, d: 10, lu: 2, n: 800, f: 0.15 },
      expect: [{ label: 'Bohrzeit t', value: 0.292, tolerance: 0.005 }],
    },
    {
      values: { l: 20, d: 8, lu: 0, n: 1000, f: 0.2 },
      expect: [{ label: 'Verfahrweg gesamt', value: 22.4, tolerance: 0.01 }],
    },
  ],
};
