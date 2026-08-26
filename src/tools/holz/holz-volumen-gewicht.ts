import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'holz-volumen-gewicht',
  category: 'holz',
  title: 'Holz Volumen- & Gewicht-Rechner',
  shortTitle: 'Holzgewicht',
  description:
    'Berechne Volumen (m³, Liter) und Gewicht von Brettern und Kanthölzern nach Holzart und Stückzahl.',
  keywords: [
    'holzgewicht berechnen',
    'holz volumen berechnen',
    'schnittholz gewicht',
    'kubikmeter holz berechnen',
  ],
  formula: 'Volumen = L · B · D · Anzahl  ·  Gewicht = Volumen · Dichte',
  inputs: [
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'mm', default: 2000, min: 0, step: 10 },
    { type: 'number', id: 'breite', label: 'Breite', unit: 'mm', default: 100, min: 0, step: 1 },
    { type: 'number', id: 'dicke', label: 'Dicke', unit: 'mm', default: 24, min: 0, step: 1 },
    { type: 'number', id: 'anzahl', label: 'Anzahl', unit: 'Stk', default: 10, min: 1, step: 1 },
    {
      type: 'select', id: 'dichte', label: 'Holzart', default: '470',
      options: [
        { value: '470', label: 'Fichte (470 kg/m³)' },
        { value: '520', label: 'Kiefer (520)' },
        { value: '660', label: 'Lärche (660)' },
        { value: '650', label: 'Birke (650)' },
        { value: '700', label: 'Eiche (700)' },
        { value: '720', label: 'Buche (720)' },
      ],
    },
  ],
  compute: (v) => {
    const l = num(v.laenge);
    const b = num(v.breite);
    const d = num(v.dicke);
    const anzahl = num(v.anzahl, 1);
    const dichte = num(v.dichte, 470);
    const volM3 = ((l * b * d) / 1e9) * anzahl;
    const liter = volM3 * 1000;
    const gewicht = volM3 * dichte;
    return [
      { label: 'Gewicht', value: gewicht, unit: 'kg', digits: 2, primary: true },
      { label: 'Volumen', value: volM3, unit: 'm³', digits: 4 },
      { label: 'Volumen (Liter)', value: liter, unit: 'L', digits: 1 },
    ];
  },
  intro:
    'Volumen mal Dichte – die Rechnung ist simpel, die Dichte ist es nicht. Die hinterlegten Werte gelten für lufttrockenes Holz mit etwa 12 bis 15 Prozent Holzfeuchte, also für Material, das trocken gelagert wurde. Frisch eingeschnittene Fichte kann fast doppelt so schwer sein, weil sie mehr Wasser als Holzsubstanz enthält. Für die Transportplanung, die Belastung eines Regals oder die Frage, ob ein Brett noch allein zu tragen ist, lohnt deshalb der Blick auf die tatsächliche Feuchte.',
  howto: [
      'Länge, Breite und Dicke eines einzelnen Bretts oder Kantholzes in Millimetern eintragen.',
      'Stückzahl angeben – der Rechner multipliziert das Volumen entsprechend.',
      'Holzart wählen; dahinter steckt die Rohdichte bei üblicher Lufttrockenheit.',
      'Gewicht und Volumen ablesen. Bei frischem oder durchnässtem Holz großzügig aufschlagen.',
  ],
  faq: [
    {
      q: 'Gilt das für trockenes oder feuchtes Holz?',
      a: 'Die Dichtewerte gelten für lufttrockenes Holz (~12–15 % Holzfeuchte). Frisches Holz ist deutlich schwerer.',
    },
  ],
  related: ['holzfeuchte-darrprobe', 'festmeter-raummeter', 'board-feet'],
  updated: '2026-08-26',
  examples: [
    {
      values: { laenge: 2000, breite: 100, dicke: 24, anzahl: 10, dichte: '470' },
      expect: [{ label: 'Gewicht', value: 22.56, tolerance: 0.05 }],
    },
  ],
};
