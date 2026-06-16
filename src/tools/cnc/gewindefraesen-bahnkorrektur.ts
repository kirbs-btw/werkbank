import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'gewindefraesen-bahnkorrektur',
  category: 'cnc',
  title: 'Gewindefräsen: Mittelpunktsvorschub-Korrektur',
  shortTitle: 'Gewindefräs-Bahn',
  description:
    'Berechne beim Innengewindefräsen den Mittelpunktsvorschub aus dem Schneidenvorschub, da die Werkzeugmitte auf kleinerem Radius läuft.',
  keywords: [
    'gewindefräsen vorschub korrektur',
    'mittelpunktsvorschub gewindefräsen',
    'innengewinde fräsen bahn',
    'vf mitte schneide zirkular',
    'gewindefräser vorschub berechnen',
    'zirkularinterpolation vorschub korrektur',
    'helix gewindefräsen vf',
  ],
  formula: 'vf_Mitte = vf_Schneide · (D_Bohrung − D_Werkzeug) / D_Bohrung   (Innengewinde)',
  inputs: [
    { type: 'number', id: 'dbohrung', label: 'Gewinde-/Bohrungsdurchmesser', unit: 'mm', default: 20, min: 0.1, step: 0.5, help: 'Nenndurchmesser des Innengewindes (Bahn der Schneide).' },
    { type: 'number', id: 'dwerkzeug', label: 'Werkzeugdurchmesser', unit: 'mm', default: 12, min: 0.1, step: 0.5, help: 'Schneidendurchmesser des Gewindefräsers.' },
    { type: 'number', id: 'vfschneide', label: 'Vorschub an der Schneide vf', unit: 'mm/min', default: 500, min: 1, step: 10, help: 'Gewünschter Konturvorschub am Gewindeflankendurchmesser.' },
  ],
  compute: (v) => {
    const dB = num(v.dbohrung, 0.1);
    const dW = num(v.dwerkzeug, 0.1);
    const vfS = num(v.vfschneide);
    const faktor = dB > 0 ? (dB - dW) / dB : 0;
    const vfM = vfS * faktor;
    return [
      { label: 'Mittelpunktsvorschub vf', value: vfM, unit: 'mm/min', digits: 0, primary: true },
      { label: 'Korrekturfaktor', value: faktor, unit: '', digits: 3 },
    ];
  },
  intro:
    'Beim Gewindefräsen läuft der Werkzeugmittelpunkt auf einer Kreisbahn mit kleinerem Radius als die schneidende Außenkante. Die Steuerung interpoliert jedoch den Mittelpunkt – programmierst du dort den vollen Konturvorschub, schneidet die Schneidkante außen zu schnell. Beim Innengewinde muss der Mittelpunktsvorschub deshalb im Verhältnis der Radien reduziert werden, damit am Gewindeflankendurchmesser der gewünschte Vorschub je Zahn entsteht. Der Rechner liefert den korrigierten vf für die Programmierung der Helix- bzw. Zirkularbahn.',
  howto: [
    'Gewinde- bzw. Bohrungsdurchmesser eintragen (Bahn, auf der die Schneide arbeitet).',
    'Durchmesser des Gewindefräsers eingeben.',
    'Gewünschten Vorschub an der Schneide vf in mm/min angeben.',
    'Mittelpunktsvorschub ablesen und als programmierten Bahnvorschub im NC-Programm verwenden.',
  ],
  faq: [
    {
      q: 'Warum unterscheidet sich Mittelpunkts- und Schneidenvorschub?',
      a: 'Innen läuft die Werkzeugmitte auf kleinem Radius, die Schneide auf größerem. Bei gleicher Winkelgeschwindigkeit legt die Schneide pro Zeit mehr Weg zurück. Programmiert wird die Mitte, also muss deren Vorschub reduziert werden, damit außen der Sollwert stimmt.',
    },
    {
      q: 'Gilt die Korrektur auch für Außengewinde?',
      a: 'Beim Außengewinde dreht sich das Verhältnis um: Die Mitte läuft auf größerem Radius als die Schneide am Gewinde, der Mittelpunktsvorschub wäre dann größer. Dieser Rechner ist für das häufigere Innengewinde ausgelegt.',
    },
    {
      q: 'Was passiert ohne Korrektur?',
      a: 'Ohne Korrektur schneidet die Außenkante mit überhöhtem Vorschub je Zahn. Das überlastet die Schneiden, verschlechtert die Gewindeflanke und kann den Fräser brechen lassen – besonders bei großem Verhältnis von Werkzeug- zu Bohrungsdurchmesser.',
    },
    {
      q: 'Wie groß darf der Werkzeugdurchmesser sein?',
      a: 'Der Gewindefräser muss deutlich kleiner als die Bohrung sein, sonst wird der Korrekturfaktor sehr klein und die Bahn eng. Üblich sind etwa 60–70 % des Kerndurchmessers; viele CAM-Systeme rechnen die Korrektur automatisch.',
    },
  ],
  related: ['gewindesteigung-metrisch', 'gewindebohren-drehzahl', 'vorschub-umrechnung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { dbohrung: 20, dwerkzeug: 12, vfschneide: 500 },
      expect: [
        { label: 'Mittelpunktsvorschub vf', value: 200, tolerance: 1 },
        { label: 'Korrekturfaktor', value: 0.4, tolerance: 0.005 },
      ],
    },
    {
      values: { dbohrung: 30, dwerkzeug: 16, vfschneide: 600 },
      expect: [{ label: 'Mittelpunktsvorschub vf', value: 280, tolerance: 2 }],
    },
  ],
};
