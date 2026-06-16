import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'dachneigung',
  category: 'holz',
  title: 'Dachneigungs-Rechner',
  shortTitle: 'Dachneigung',
  description:
    'Berechne Dachneigung in Grad und Prozent sowie die Sparrenlänge aus Firsthöhe und halber Dachbreite – für Sattel- und Pultdächer.',
  keywords: [
    'dachneigung berechnen',
    'dachneigung grad prozent',
    'sparrenlänge berechnen',
    'dachwinkel berechnen',
    'satteldach neigung',
  ],
  formula:
    'Winkel = atan(Höhe / Basis) · Neigung % = Höhe / Basis · 100 · Sparrenlänge = √(Höhe² + Basis²)',
  inputs: [
    { type: 'number', id: 'hoehe', label: 'Firsthöhe (über Auflager)', unit: 'mm', default: 2000, min: 0, step: 10 },
    { type: 'number', id: 'basis', label: 'Halbe Dachbreite (horizontal)', unit: 'mm', default: 4000, min: 1, step: 10, help: 'Horizontaler Abstand von Außenwand bis Firstmitte.' },
  ],
  compute: (v) => {
    const hoehe = num(v.hoehe);
    const basis = num(v.basis, 1);
    const grad = (Math.atan(hoehe / basis) * 180) / Math.PI;
    const prozent = (hoehe / basis) * 100;
    const sparren = Math.sqrt(hoehe * hoehe + basis * basis);
    return [
      { label: 'Dachneigung', value: grad, unit: '°', digits: 2, primary: true },
      { label: 'Neigung in Prozent', value: prozent, unit: '%', digits: 1 },
      { label: 'Sparrenlänge', value: sparren, unit: 'mm', digits: 0 },
    ];
  },
  howto: [
    'Firsthöhe ab Oberkante Auflager (Wand) bis zur Firstmitte messen.',
    'Halbe Dachbreite als horizontalen Abstand von der Außenwand bis zur Firstmitte eintragen.',
    'Ergebnis liefert Neigungswinkel, Prozentgefälle und reine Sparrenlänge (ohne Dachüberstand).',
  ],
  faq: [
    {
      q: 'Enthält die Sparrenlänge den Dachüberstand?',
      a: 'Nein. Berechnet wird die Länge vom Auflager bis zum First. Für den Dachüberstand (Traufe) musst du die gewünschte Länge addieren.',
    },
    {
      q: 'Wie rechne ich Grad in Prozent um?',
      a: 'Prozent = tan(Winkel)·100. 45° entsprechen 100 %, 26,57° entsprechen 50 %.',
    },
  ],
  related: ['treppen-steigung'],
  updated: '2026-06-15',
  examples: [
    {
      values: { hoehe: 2000, basis: 4000 },
      expect: [
        { label: 'Dachneigung', value: 26.57, tolerance: 0.05 },
        { label: 'Neigung in Prozent', value: 50, tolerance: 0.1 },
        { label: 'Sparrenlänge', value: 4472, tolerance: 1 },
      ],
    },
  ],
};
