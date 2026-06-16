import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-gravur-zeit',
  category: 'laser',
  title: 'Laser-Gravurzeit Rechner (Rastergravur)',
  shortTitle: 'Gravurzeit',
  description:
    'Schätze die Dauer einer flächigen Rastergravur aus Gravurfläche, Scangeschwindigkeit und Linienabstand (DPI) – inklusive Umkehrzeit-Aufschlag.',
  keywords: [
    'laser gravurzeit berechnen',
    'rastergravur dauer rechner',
    'gravur zeit laser fläche',
    'lasergravur geschwindigkeit',
    'linienabstand dpi gravur',
    'wie lange dauert lasergravur',
  ],
  formula:
    'Anzahl Linien = Höhe / Linienabstand;  Zeit = (Fläche / Linienabstand) / Geschwindigkeit;  + Umkehraufschlag',
  inputs: [
    { type: 'number', id: 'breite', label: 'Gravurbreite', unit: 'mm', default: 100, min: 0, step: 1, help: 'Breite des zu gravierenden Bildbereichs.' },
    { type: 'number', id: 'hoehe', label: 'Gravurhöhe', unit: 'mm', default: 60, min: 0, step: 1, help: 'Höhe des Bildbereichs (bestimmt die Anzahl der Zeilen).' },
    { type: 'number', id: 'speed', label: 'Scangeschwindigkeit', unit: 'mm/s', default: 300, min: 1, step: 10, help: 'Verfahrgeschwindigkeit des Kopfs in einer Gravurlinie.' },
    { type: 'number', id: 'abstand', label: 'Linienabstand', unit: 'mm', default: 0.1, min: 0.01, step: 0.01, help: 'Zeilenabstand; 0,1 mm entspricht ca. 254 DPI, 0,0635 mm ca. 400 DPI.' },
    { type: 'number', id: 'umkehr', label: 'Umkehr-/Beschleunigungsaufschlag', unit: '%', default: 20, min: 0, max: 100, step: 1, help: 'Am Zeilenende bremst und beschleunigt der Kopf; das kostet Zeit.' },
  ],
  compute: (v) => {
    const b = num(v.breite);
    const h = num(v.hoehe);
    const speed = num(v.speed, 1);
    const abstand = num(v.abstand, 0.1);
    const umkehr = num(v.umkehr);
    const zeilen = abstand > 0 ? h / abstand : 0;
    const wegMm = zeilen * b;
    const reineSek = speed > 0 ? wegMm / speed : 0;
    const gesamtSek = reineSek * (1 + umkehr / 100);
    const gesamtMin = gesamtSek / 60;
    return [
      { label: 'Gravurzeit', value: gesamtMin, unit: 'min', digits: 2, primary: true, help: 'inkl. Umkehr-/Beschleunigungsaufschlag' },
      { label: 'Gravurzeit in Sekunden', value: gesamtSek, unit: 's', digits: 0 },
      { label: 'Anzahl Gravurlinien', value: zeilen, unit: 'Linien', digits: 0 },
      { label: 'Verfahrweg gesamt', value: wegMm / 1000, unit: 'm', digits: 1 },
    ];
  },
  intro:
    'Bei einer Rastergravur fährt der Laserkopf das Bild Zeile für Zeile ab, ähnlich einem Tintenstrahldrucker. Die Dauer hängt davon ab, wie viele Zeilen entstehen (Gravurhöhe geteilt durch Linienabstand) und wie schnell der Kopf jede Zeile abfährt. Der enge Linienabstand bei hohen DPI-Werten vervielfacht die Zeilenzahl – deshalb dauert eine feine Gravur deutlich länger als ein einfacher Schnitt. Dieser Rechner liefert eine belastbare Zeitschätzung für die Kalkulation.',
  howto: [
    'Gravurbreite und -höhe des Bildbereichs in mm eintragen.',
    'Scangeschwindigkeit in mm/s aus den Maschineneinstellungen übernehmen.',
    'Linienabstand wählen (kleiner Abstand = höhere DPI = feinere, aber langsamere Gravur).',
    'Umkehraufschlag für das Abbremsen am Zeilenende schätzen (oft 15-30 %) und Gravurzeit ablesen.',
  ],
  faq: [
    { q: 'Wie rechne ich DPI in Linienabstand um?', a: 'Linienabstand in mm = 25,4 / DPI. 254 DPI ergeben 0,1 mm, 300 DPI ungefähr 0,085 mm und 500 DPI rund 0,051 mm. Je höher die DPI, desto mehr Zeilen und desto länger die Gravur.' },
    { q: 'Warum dauert eine Gravur länger als ein Schnitt gleicher Größe?', a: 'Beim Schneiden folgt der Strahl nur den Konturlinien. Bei der Flächengravur muss er die komplette Fläche zeilenweise abrastern; bei 0,1 mm Abstand sind das schon 10 Linien pro Millimeter Höhe.' },
    { q: 'Was bedeutet der Umkehraufschlag?', a: 'Am Ende jeder Zeile muss der Kopf abbremsen, die Richtung wechseln und wieder beschleunigen (Overscan). Diese Totzeiten verlängern die rein rechnerische Scanzeit, besonders bei schmalen Motiven und hoher Geschwindigkeit.' },
    { q: 'Gilt die Rechnung auch für Vektorgravur?', a: 'Nein. Diese Formel gilt für flächige Rastergravur. Eine reine Linien- bzw. Vektorgravur verhält sich wie ein Schnitt – dafür ist der Schnittzeit-Rechner besser geeignet.' },
  ],
  related: ['laser-gravurflaeche', 'laser-schnittkosten', 'laser-schnittzeit'],
  updated: '2026-06-16',
  examples: [
    { values: { breite: 100, hoehe: 60, speed: 300, abstand: 0.1, umkehr: 0 }, expect: [{ label: 'Gravurzeit', value: 3.3333, tolerance: 0.01 }] },
    { values: { breite: 100, hoehe: 60, speed: 300, abstand: 0.1, umkehr: 20 }, expect: [{ label: 'Gravurzeit', value: 4, tolerance: 0.01 }] },
  ],
};
