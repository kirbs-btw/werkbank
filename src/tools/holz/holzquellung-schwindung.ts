import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'holzquellung-schwindung',
  category: 'holz',
  title: 'Holzquellung & -schwindung berechnen',
  shortTitle: 'Quellung/Schwindung',
  description:
    'Berechne, wie viel Holz bei Feuchteänderung quillt oder schwindet – über das differentielle Schwindmaß je Holzart und Faserrichtung.',
  keywords: [
    'holz quellung berechnen',
    'holz schwindung rechner',
    'differentielles schwindmaß',
    'holz arbeiten feuchte',
    'quellmaß tangential radial',
    'holzbewegung berechnen',
    'maßänderung holzfeuchte',
  ],
  formula:
    'Maßänderung = Breite · Schwindmaß[%/%] / 100 · Feuchtedifferenz · Neumaß = Breite − Maßänderung (Trocknung) bzw. + (Befeuchtung)',
  inputs: [
    { type: 'number', id: 'breite', label: 'Bauteilbreite (quer zur Faser)', unit: 'mm', default: 200, min: 0, step: 1 },
    { type: 'number', id: 'feuchteVorher', label: 'Holzfeuchte vorher', unit: '%', default: 12, min: 0, max: 30, step: 0.5 },
    { type: 'number', id: 'feuchteNachher', label: 'Holzfeuchte nachher', unit: '%', default: 8, min: 0, max: 30, step: 0.5 },
    {
      type: 'select',
      id: 'schwindmass',
      label: 'Holzart & Richtung',
      default: '0.36',
      help: 'Differentielles Schwindmaß in % Maßänderung je 1 % Feuchteänderung.',
      options: [
        { value: '0.36', label: 'Eiche tangential (0,36)' },
        { value: '0.18', label: 'Eiche radial (0,18)' },
        { value: '0.29', label: 'Fichte tangential (0,29)' },
        { value: '0.19', label: 'Fichte radial (0,19)' },
        { value: '0.41', label: 'Buche tangential (0,41)' },
        { value: '0.20', label: 'Buche radial (0,20)' },
      ],
    },
  ],
  compute: (v) => {
    const breite = num(v.breite);
    const fVorher = num(v.feuchteVorher);
    const fNachher = num(v.feuchteNachher);
    const schwindmass = num(v.schwindmass, 0.36);

    const diff = fVorher - fNachher; // positiv = Trocknung = Schwindung
    const aenderung = (breite * schwindmass * diff) / 100;
    const neumass = breite - aenderung;
    const betrag = Math.abs(aenderung);

    return [
      { label: 'Maßänderung', value: betrag, unit: 'mm', digits: 2, primary: true },
      { label: 'Neue Breite', value: neumass, unit: 'mm', digits: 2 },
      { label: 'Feuchtedifferenz', value: Math.abs(diff), unit: '%', digits: 1 },
      { label: 'Richtung', value: diff >= 0 ? 'Schwindung' : 'Quellung' },
    ];
  },
  intro:
    'Holz „arbeitet“: Sinkt die Holzfeuchte, schwindet das Holz; steigt sie, quillt es – fast ausschließlich quer zur Faser. Wie stark, hängt vom differentiellen Schwindmaß der Holzart und der Faserrichtung ab (tangential rund doppelt so stark wie radial). Dieser Rechner ermittelt die zu erwartende Maßänderung einer Breite bei einem Wechsel der Holzfeuchte – wichtig für Gehrfugen, Dehnungsfugen bei Tischplatten, Parkett und Massivholzmöbel. Längs zur Faser ist die Bewegung vernachlässigbar.',
  howto: [
    'Breite des Bauteils quer zur Faserrichtung in Millimeter eintragen.',
    'Holzfeuchte vor und nach der Klimaänderung angeben (z. B. Einbau- vs. Nutzungsfeuchte).',
    'Holzart und Schnittrichtung (tangential/radial) auswählen.',
    'Mit der Maßänderung Dehnungsfugen, Nutspiel oder Überstand einplanen.',
  ],
  faq: [
    {
      q: 'Was ist das differentielle Schwindmaß?',
      a: 'Es gibt an, um wie viel Prozent sich eine Abmessung je 1 % Änderung der Holzfeuchte ändert – gültig im Bereich unterhalb der Fasersättigung (etwa 28–30 %).',
    },
    {
      q: 'Warum nur quer zur Faser?',
      a: 'In Faserlängsrichtung schwindet Holz nur etwa 0,1–0,3 % insgesamt und ist daher meist vernachlässigbar. Die relevante Bewegung passiert radial und tangential.',
    },
    {
      q: 'Welche Feuchtewerte soll ich ansetzen?',
      a: 'Möbel in beheizten Innenräumen pendeln oft zwischen 6 und 10 % Holzfeuchte. Rechne mit der größten erwarteten Differenz übers Jahr, um Risse und Fugen sicher zu vermeiden.',
    },
    {
      q: 'Gilt das auch über die Fasersättigung hinaus?',
      a: 'Nein. Oberhalb der Fasersättigung (≈ 28–30 %) ändert sich das Volumen praktisch nicht mehr, weil nur noch freies Wasser ein- oder austritt. Die Formel gilt darunter.',
    },
  ],
  related: ['holzfeuchte-darrprobe', 'holz-volumen-gewicht', 'leimholz-bretter'],
  updated: '2026-06-16',
  examples: [
    {
      values: { breite: 200, feuchteVorher: 12, feuchteNachher: 8, schwindmass: '0.36' },
      expect: [
        { label: 'Maßänderung', value: 2.88, tolerance: 0.01 },
        { label: 'Neue Breite', value: 197.12, tolerance: 0.02 },
      ],
    },
    {
      values: { breite: 200, feuchteVorher: 8, feuchteNachher: 12, schwindmass: '0.19' },
      expect: [{ label: 'Maßänderung', value: 1.52, tolerance: 0.01 }],
    },
  ],
};
