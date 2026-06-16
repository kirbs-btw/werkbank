import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-gravurflaeche',
  category: 'laser',
  title: 'Gravurfläche & Skalierung Rechner',
  shortTitle: 'Gravurfläche',
  description:
    'Berechne die effektiv gravierte Fläche aus Motivgröße und Flächendeckung und prüfe, ob das Motiv auf das Arbeitsfeld des Lasers passt.',
  keywords: [
    'gravurfläche berechnen',
    'laser arbeitsfeld passt motiv',
    'flächendeckung gravur',
    'lasergravur größe rechner',
    'motivfläche laser',
    'gravur skalierung rechner',
  ],
  formula:
    'Bildfläche = Breite × Höhe;  gravierte Fläche = Bildfläche × Deckung;  Auslastung = Bildfläche / Arbeitsfeld',
  inputs: [
    { type: 'number', id: 'breite', label: 'Motivbreite', unit: 'mm', default: 120, min: 0, step: 1, help: 'Breite des zu gravierenden Motivs.' },
    { type: 'number', id: 'hoehe', label: 'Motivhöhe', unit: 'mm', default: 80, min: 0, step: 1, help: 'Höhe des zu gravierenden Motivs.' },
    { type: 'number', id: 'deckung', label: 'Flächendeckung', unit: '%', default: 40, min: 0, max: 100, step: 1, help: 'Anteil der dunklen/gravierten Fläche am Motiv (Logo wenig, Vollfläche viel).' },
    { type: 'number', id: 'feldB', label: 'Arbeitsfeld Breite', unit: 'mm', default: 300, min: 1, step: 10, help: 'Verfahrbreite (X) deines Lasers.' },
    { type: 'number', id: 'feldH', label: 'Arbeitsfeld Höhe', unit: 'mm', default: 200, min: 1, step: 10, help: 'Verfahrhöhe (Y) deines Lasers.' },
  ],
  compute: (v) => {
    const b = num(v.breite);
    const h = num(v.hoehe);
    const deckung = num(v.deckung);
    const fb = num(v.feldB, 1);
    const fh = num(v.feldH, 1);
    const bildFlaeche = b * h; // mm²
    const graviertCm2 = (bildFlaeche * (deckung / 100)) / 100;
    const feldFlaeche = fb * fh;
    const auslastung = feldFlaeche > 0 ? (bildFlaeche / feldFlaeche) * 100 : 0;
    const passt = b <= fb && h <= fh ? 1 : 0;
    return [
      { label: 'Gravierte Fläche', value: graviertCm2, unit: 'cm²', digits: 2, primary: true, help: 'effektiv abgetragene Fläche bei der angegebenen Deckung' },
      { label: 'Motivfläche gesamt', value: bildFlaeche / 100, unit: 'cm²', digits: 2 },
      { label: 'Feldauslastung', value: auslastung, unit: '%', digits: 1 },
      { label: 'Passt aufs Arbeitsfeld', value: passt === 1 ? 'Ja' : 'Nein' },
    ];
  },
  intro:
    'Vor einer Gravur muss klar sein, ob das Motiv überhaupt auf das Arbeitsfeld des Lasers passt und wie viel Fläche tatsächlich abgetragen wird. Die reine Motivgröße (Breite × Höhe) sagt dabei wenig über die gravierte Fläche aus – ein filigranes Logo deckt nur wenige Prozent, eine Vollflächengravur fast alles. Dieser Rechner liefert die effektiv gravierte Fläche, die Auslastung des Arbeitsfelds und eine klare Passt-/Passt-nicht-Aussage, damit du Material und Aufspannung richtig planst.',
  howto: [
    'Motivbreite und -höhe in mm eintragen.',
    'Flächendeckung schätzen: dünnes Linienlogo z. B. 10-20 %, gefülltes Motiv 50-80 %, Vollfläche bis 100 %.',
    'Arbeitsfeld deines Lasers (Breite × Höhe) eintragen.',
    'Gravierte Fläche, Feldauslastung und die Passt-Aussage ablesen und Aufspannung danach planen.',
  ],
  faq: [
    { q: 'Wozu brauche ich die gravierte Fläche und nicht nur die Motivgröße?', a: 'Die gravierte Fläche bestimmt Bearbeitungsaufwand, Rauchentwicklung und – bei manchen Materialien – den Verbrauch von Markierspray oder Beschichtung. Zwei gleich große Motive können sich im Aufwand stark unterscheiden.' },
    { q: 'Wie schätze ich die Flächendeckung?', a: 'In Grafikprogrammen lässt sich der dunkle Flächenanteil über das Histogramm abschätzen. Faustwerte: Strichlogos 10-20 %, Text 15-30 %, gefüllte Grafiken 40-70 %, ganzflächige Schwärzung bis 100 %.' },
    { q: 'Was passiert, wenn das Motiv größer als das Arbeitsfeld ist?', a: 'Dann zeigt der Rechner „Nein". Du musst das Motiv skalieren, drehen oder die Gravur in mehrere Abschnitte (Tiling) aufteilen und versetzt aufspannen.' },
    { q: 'Bezieht sich die Auslastung auf die maximale Größe?', a: 'Die Feldauslastung setzt die Motivfläche ins Verhältnis zur Arbeitsfeldfläche. Sie kann über 100 % liegen, wenn das Motiv zwar von der Fläche her, aber nicht von den Abmessungen her passt – deshalb gibt es zusätzlich die separate Passt-Prüfung.' },
  ],
  related: ['laser-gravur-zeit', 'laser-schnittkosten', 'kerf-kompensation'],
  updated: '2026-06-16',
  examples: [
    { values: { breite: 120, hoehe: 80, deckung: 40, feldB: 300, feldH: 200 }, expect: [{ label: 'Gravierte Fläche', value: 38.4, tolerance: 0.01 }] },
    { values: { breite: 100, hoehe: 100, deckung: 100, feldB: 300, feldH: 200 }, expect: [{ label: 'Gravierte Fläche', value: 100, tolerance: 0.01 }] },
  ],
};
