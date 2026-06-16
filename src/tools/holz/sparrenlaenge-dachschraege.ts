import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'sparrenlaenge-dachschraege',
  category: 'holz',
  title: 'Sparrenlänge bei Dachschräge berechnen',
  shortTitle: 'Sparrenlänge',
  description:
    'Berechne die Sparrenlänge aus halber Spannweite und Dachneigungswinkel – inklusive Firsthöhe, Dachüberstand und reiner Sparrenlänge ohne Überstand.',
  keywords: [
    'sparrenlänge berechnen',
    'sparren länge dachneigung',
    'dachsparren rechner',
    'sparrenlänge formel',
    'firsthöhe berechnen',
    'dachüberstand sparren',
    'satteldach sparren länge',
  ],
  formula:
    'Sparren (ohne Überstand) = halbe Spannweite / cos(Neigung) · Firsthöhe = halbe Spannweite · tan(Neigung) · Gesamtsparren = Sparren + Überstand / cos(Neigung)',
  inputs: [
    { type: 'number', id: 'spannweite', label: 'Gebäudebreite (Spannweite)', unit: 'm', default: 8, min: 0, step: 0.1, help: 'Außenwand zu Außenwand quer zum First.' },
    { type: 'number', id: 'neigung', label: 'Dachneigung', unit: '°', default: 35, min: 1, max: 80, step: 0.5 },
    { type: 'number', id: 'ueberstand', label: 'Dachüberstand (horizontal)', unit: 'cm', default: 50, min: 0, step: 1, help: 'Horizontaler Vorsprung über die Wand hinaus.' },
  ],
  compute: (v) => {
    const spannweite = num(v.spannweite);
    const neigungGrad = num(v.neigung, 35);
    const ueberstandM = num(v.ueberstand) / 100;

    const halbe = spannweite / 2;
    const rad = (neigungGrad * Math.PI) / 180;
    const cos = Math.cos(rad);

    const sparrenOhne = cos !== 0 ? halbe / cos : 0;
    const firsthoehe = halbe * Math.tan(rad);
    const ueberstandSchraeg = cos !== 0 ? ueberstandM / cos : 0;
    const sparrenGesamt = sparrenOhne + ueberstandSchraeg;

    return [
      { label: 'Sparrenlänge gesamt', value: sparrenGesamt, unit: 'm', digits: 3, primary: true },
      { label: 'Sparren ohne Überstand', value: sparrenOhne, unit: 'm', digits: 3 },
      { label: 'Firsthöhe über Auflager', value: firsthoehe, unit: 'm', digits: 3 },
      { label: 'Überstand (schräg gemessen)', value: ueberstandSchraeg, unit: 'm', digits: 3 },
    ];
  },
  intro:
    'Bei einem symmetrischen Satteldach läuft jeder Sparren vom First bis zur Außenwand und dann als Dachüberstand weiter. Dieser Rechner ermittelt die schräg gemessene Sparrenlänge aus der halben Gebäudebreite und dem Dachneigungswinkel und addiert den gewünschten Dachüberstand. Zusätzlich erhältst du die Firsthöhe über dem Auflager – nützlich für die Planung von Kniestock, Dachgaube und Materialbestellung. Die Maße verstehen sich entlang der Sparrenachse.',
  howto: [
    'Gebäudebreite quer zum First (Außenkante zu Außenkante) eintragen.',
    'Geplante Dachneigung in Grad angeben – häufig 30–45° beim Satteldach.',
    'Horizontalen Dachüberstand in Zentimetern wählen (Traufüberstand).',
    'Die Gesamt-Sparrenlänge bestellen; Firsthöhe für die Höhenplanung nutzen.',
  ],
  faq: [
    {
      q: 'Wird die Sparrenlänge bis zur Firstmitte gerechnet?',
      a: 'Dieser Rechner nutzt die halbe Spannweite bis zur Mittelachse. Bei einem First mit Firstpfette oder Aufdoppelung musst du an der Firstseite je nach Konstruktion noch ein paar Zentimeter abziehen.',
    },
    {
      q: 'Warum wird der Überstand durch den Kosinus geteilt?',
      a: 'Der Dachüberstand wird meist horizontal angegeben. Entlang der schrägen Sparrenachse ist er länger – exakt um den Faktor 1/cos(Neigung).',
    },
    {
      q: 'Wie hänge ich Höhe der Außenwand und Kniestock dran?',
      a: 'Die Firsthöhe gilt ab Oberkante Auflager (Fußpfette). Addiere die Wand-/Kniestockhöhe darauf, um die absolute Firsthöhe über dem Boden zu erhalten.',
    },
    {
      q: 'Gilt das auch für ein Pultdach?',
      a: 'Beim Pultdach läuft der Sparren über die volle Breite. Trage dann statt der halben die ganze Spannweite ein, indem du die „Gebäudebreite“ verdoppelt eingibst – oder rechne die Breite direkt als Lauflänge.',
    },
  ],
  related: ['dachneigung', 'treppen-steigung', 'kreissaege-schnitttiefe-winkel'],
  updated: '2026-06-16',
  examples: [
    {
      values: { spannweite: 8, neigung: 35, ueberstand: 50 },
      expect: [
        { label: 'Sparren ohne Überstand', value: 4.883, tolerance: 0.01 },
        { label: 'Firsthöhe über Auflager', value: 2.801, tolerance: 0.01 },
      ],
    },
    {
      values: { spannweite: 10, neigung: 45, ueberstand: 0 },
      expect: [
        { label: 'Sparrenlänge gesamt', value: 7.071, tolerance: 0.01 },
        { label: 'Firsthöhe über Auflager', value: 5, tolerance: 0.01 },
      ],
    },
  ],
};
