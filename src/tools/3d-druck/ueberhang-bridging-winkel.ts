import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'ueberhang-bridging-winkel',
  category: '3d-druck',
  title: 'Überhang-Winkel & Schichtversatz Rechner',
  shortTitle: 'Überhang-Winkel',
  description:
    'Berechne den Überhangwinkel aus Schichthöhe und Linienbreite, ermittle den horizontalen Versatz pro Schicht und prüfe, ab wann Stützen nötig werden.',
  keywords: [
    'überhang winkel 3d druck',
    'überhang ohne stützen',
    'bridging winkel berechnen',
    'schichtversatz überhang',
    'maximaler überhangwinkel fdm',
    'overhang test winkel',
    'stützen ab welchem winkel',
  ],
  formula:
    'Versatz pro Schicht = Schichthöhe / tan(Winkel ab Vertikale); 45° Versatz = halbe Linienbreite',
  inputs: [
    { type: 'number', id: 'winkel', label: 'Überhangwinkel (ab Vertikale)', unit: '°', default: 45, min: 1, max: 89, step: 1, help: '0° = senkrechte Wand, 60° = starker Überhang.' },
    { type: 'number', id: 'schicht', label: 'Schichthöhe', unit: 'mm', default: 0.2, min: 0.04, max: 1, step: 0.01 },
    { type: 'number', id: 'breite', label: 'Linienbreite', unit: 'mm', default: 0.4, min: 0.1, max: 2, step: 0.01 },
  ],
  compute: (v) => {
    const winkel = num(v.winkel);
    const schicht = num(v.schicht);
    const breite = num(v.breite);
    const rad = (winkel * Math.PI) / 180;
    const tan = Math.tan(rad);
    const versatz = schicht * tan;
    const ueberlappung = breite > 0 ? (1 - versatz / breite) * 100 : 0;
    return [
      { label: 'Versatz pro Schicht', value: versatz, unit: 'mm', digits: 3, primary: true, help: 'Horizontaler Überstand jeder neuen Schicht.' },
      { label: 'Auflage auf Vorschicht', value: ueberlappung, unit: '%', digits: 1, help: 'Unter ~50 % wird der Druck kritisch.' },
    ];
  },
  intro:
    'Der Überhangwinkel beschreibt, wie weit eine Wand von der Senkrechten abweicht: 0° ist eine gerade Wand, ab etwa 45° wird es für viele Drucker kritisch. Bei jeder neuen Schicht ragt das Material um den horizontalen Versatz über die darunterliegende Bahn hinaus – liegt dieser Versatz nahe an der Linienbreite, fehlt die Auflage und die Schicht hängt durch. Dieser Rechner zeigt dir den Versatz pro Schicht und wie viel Prozent jeder Bahn noch auf der Vorschicht aufliegt, damit du Stützen gezielt setzt.',
  howto: [
    'Überhangwinkel deines Modells ab der Vertikalen eingeben (45° ist die klassische Faustregel-Grenze).',
    'Schichthöhe und Linienbreite aus dem Slicer-Profil übernehmen.',
    'Versatz pro Schicht ablesen und mit der Linienbreite vergleichen.',
    'Sinkt die Auflage unter ~50 %, Schichthöhe reduzieren, kühlen oder Stützen aktivieren.',
  ],
  faq: [
    { q: 'Warum sind 45° die übliche Grenze?', a: 'Bei 45° entspricht der Versatz genau der Schichthöhe; jede Bahn liegt dann noch zu etwa der Hälfte auf der Vorschicht. Darüber wird die Auflagefläche so klein, dass das Material durchhängt.' },
    { q: 'Hilft eine kleinere Schichthöhe bei Überhängen?', a: 'Ja. Bei gleicher Linienbreite verringert eine feinere Schicht den absoluten Versatz, sodass mehr Bahn aufliegt und steilere Überhänge sauber gelingen.' },
    { q: 'Wie wird der Winkel im Slicer gemessen?', a: 'Slicer geben den Überhang oft als Winkel zur Senkrechten an (Schwellwert für Stützen, z. B. 50°). Genau diesen Wert gibst du hier ein.' },
    { q: 'Was ist mit Bridging?', a: 'Bridging ist ein 90°-Sonderfall (waagerechte Überspannung). Hier zählt nicht der Versatz, sondern die Brückenlänge und gute Bauteilkühlung – dafür eignet sich ein eigener Brückentest.' },
    { q: 'Bessere Kühlung statt Stützen?', a: 'Oft ja: Starke Bauteilkühlung erstarrt das überstehende Material schneller und ermöglicht steilere Überhänge ohne Stützmaterial, besonders bei PLA.' },
  ],
  related: ['stuetzmaterial-anteil', 'linienbreite-rechner', 'schichtanzahl-rechner'],
  updated: '2026-06-16',
  examples: [
    {
      values: { winkel: 45, schicht: 0.2, breite: 0.4 },
      expect: [
        { label: 'Versatz pro Schicht', value: 0.2, tolerance: 0.001 },
        { label: 'Auflage auf Vorschicht', value: 50.0, tolerance: 0.1 },
      ],
    },
    {
      values: { winkel: 60, schicht: 0.2, breite: 0.4 },
      expect: [
        { label: 'Versatz pro Schicht', value: 0.346, tolerance: 0.002 },
        { label: 'Auflage auf Vorschicht', value: 13.4, tolerance: 0.2 },
      ],
    },
  ],
};
