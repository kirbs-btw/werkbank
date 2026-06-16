import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'spindelleistung-fraesen',
  category: 'cnc',
  title: 'Spindelleistung beim Fräsen berechnen',
  shortTitle: 'Spindelleistung',
  description:
    'Berechne die Spindelleistung beim Fräsen aus Zeitspanvolumen Q und spezifischer Schnittkraft kc. Prüfe, ob deine CNC-Fräse den Schnitt schafft.',
  keywords: [
    'spindelleistung berechnen',
    'schnittleistung fräsen rechner',
    'benötigte leistung fräsen',
    'antriebsleistung cnc',
    'fräsleistung berechnen',
    'spezifische schnittkraft kc',
    'leistungsbedarf fräsen',
  ],
  formula: 'P = Q · kc / (60000 · η)  (kW), mit Q in cm³/min, kc in N/mm²',
  inputs: [
    { type: 'number', id: 'q', label: 'Zeitspanvolumen Q', unit: 'cm³/min', default: 20, min: 0, step: 0.5, help: 'Abgetragenes Materialvolumen pro Minute (MRR).' },
    { type: 'number', id: 'kc', label: 'Spezifische Schnittkraft kc', unit: 'N/mm²', default: 2200, min: 1, step: 50, help: 'Werkstoffabhängig: Alu ~800, Baustahl ~1800-2200, Edelstahl ~2500-3000.' },
    { type: 'number', id: 'eta', label: 'Wirkungsgrad η', unit: '%', default: 80, min: 1, max: 100, step: 1, help: 'Mechanischer Wirkungsgrad von Spindel und Antrieb.' },
  ],
  compute: (v) => {
    const q = num(v.q);
    const kc = num(v.kc);
    const eta = num(v.eta, 80) / 100;
    const pSchnitt = (q * kc) / 60000;
    const pAntrieb = eta > 0 ? pSchnitt / eta : 0;
    return [
      { label: 'Antriebsleistung P', value: pAntrieb, unit: 'kW', digits: 2, primary: true },
      { label: 'Reine Schnittleistung Pc', value: pSchnitt, unit: 'kW', digits: 2 },
    ];
  },
  intro:
    'Die Spindelleistung ist die mechanische Leistung, die der Antrieb aufbringen muss, um das Material zu zerspanen. Sie ergibt sich aus dem Zeitspanvolumen Q und der spezifischen Schnittkraft kc des Werkstoffs, geteilt durch den Wirkungsgrad. Wer einen großen Schnitt plant, prüft damit vorab, ob die vorhandene CNC-Fräse genug Leistung hat oder ob Zustellung und Vorschub reduziert werden müssen.',
  howto: [
    'Zeitspanvolumen Q in cm³/min eintragen (aus ae · ap · vf / 1000 oder dem MRR-Rechner).',
    'Spezifische Schnittkraft kc des Werkstoffs wählen (Tabellenwert, z. B. Baustahl rund 2000 N/mm²).',
    'Wirkungsgrad η der Maschine angeben (typisch 75-85 %).',
    'Antriebsleistung P in kW ablesen und mit der Nennleistung der Spindel vergleichen.',
  ],
  faq: [
    {
      q: 'Wie unterscheiden sich Schnittleistung und Antriebsleistung?',
      a: 'Die reine Schnittleistung Pc ist die am Werkstück umgesetzte Leistung. Die Antriebsleistung P liegt darüber, weil Lager, Riemen und Getriebe Verluste verursachen. Diese Verluste fängt der Wirkungsgrad η ein.',
    },
    {
      q: 'Woher bekomme ich den kc-Wert?',
      a: 'kc ist die spezifische Schnittkraft (Kraft je mm² Spanquerschnitt). Sie steht in Zerspanungstabellen. Richtwerte: Aluminium 700-900, Baustahl 1800-2200, legierter Stahl 2200-2600, Edelstahl 2500-3000 N/mm². Der Wert sinkt mit größerer Spanungsdicke.',
    },
    {
      q: 'Meine Maschine hat zu wenig Leistung – was tun?',
      a: 'Reduziere das Zeitspanvolumen: kleinere axiale oder radiale Zustellung, geringerer Vorschub. Da P linear von Q abhängt, halbiert eine Halbierung von Q auch die Leistung.',
    },
    {
      q: 'Gilt die Formel auch fürs Drehen?',
      a: 'Im Prinzip ja, denn auch beim Drehen ist P = Q · kc / 60000. Q berechnet sich dort aus Schnitttiefe · Vorschub · Schnittgeschwindigkeit. Der kc-Bezug auf die Spanungsdicke bleibt gleich.',
    },
  ],
  related: ['zeitspanvolumen', 'spindel-drehmoment', 'schnittgeschwindigkeit'],
  updated: '2026-06-16',
  examples: [
    {
      values: { q: 20, kc: 2200, eta: 80 },
      expect: [
        { label: 'Antriebsleistung P', value: 0.92, tolerance: 0.02 },
        { label: 'Reine Schnittleistung Pc', value: 0.73, tolerance: 0.02 },
      ],
    },
    {
      values: { q: 60, kc: 800, eta: 100 },
      expect: [{ label: 'Antriebsleistung P', value: 0.8, tolerance: 0.02 }],
    },
  ],
};
