import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-rotary-gravur',
  category: 'laser',
  title: 'Laser-Rotary Gravur Rechner (Zylinder & Umfang)',
  shortTitle: 'Rotary',
  description:
    'Berechne für die Rotationsgravur von Gläsern und Bechern den abwickelbaren Umfang, die Motivbreite und die Schritte pro Umdrehung bei gewählter DPI.',
  keywords: [
    'rotary gravur rechner',
    'zylinder gravur umfang',
    'glas becher lasergravur',
    'rotationsachse laser dpi',
    'umfang motivbreite gravur',
    'rundgravur laser berechnen',
    'walzengravur abwicklung',
  ],
  formula:
    'Umfang = π·Durchmesser;  abwickelbare Breite = Umfang × Abdeckung;  Schritte/Umdrehung = Umfang_Zoll × DPI',
  inputs: [
    { type: 'number', id: 'durchmesser', label: 'Objektdurchmesser', unit: 'mm', default: 70, min: 1, step: 1, help: 'Durchmesser des Glases/Bechers an der Gravurstelle.' },
    { type: 'number', id: 'abdeckung', label: 'Gravur-Umschlingung', unit: '%', default: 100, min: 1, max: 360, step: 1, help: 'Anteil des Umfangs, der graviert wird (100 % = ganz herum, weniger für einseitig).' },
    { type: 'number', id: 'dpi', label: 'Gravur-Auflösung', unit: 'DPI', default: 300, min: 1, step: 10, help: 'Auflösung längs der Drehrichtung.' },
    { type: 'number', id: 'hoehe', label: 'Motivhöhe', unit: 'mm', default: 40, min: 0, step: 1, help: 'Höhe entlang der Zylinderachse (begrenzt durch Objekt und Verfahrweg).' },
  ],
  compute: (v) => {
    const d = num(v.durchmesser);
    const abdeckung = num(v.abdeckung, 100);
    const dpi = num(v.dpi, 1);
    const h = num(v.hoehe);
    const umfang = Math.PI * d; // mm
    const breite = umfang * (Math.min(abdeckung, 360) / 100); // bei %>100 ist Mehrfachumlauf
    const umfangZoll = umfang / 25.4;
    const schritte = umfangZoll * dpi;
    const flaeche = (breite * h) / 100; // cm²
    return [
      { label: 'Umfang', value: umfang, unit: 'mm', digits: 1, primary: true, help: 'abgewickelter voller Umfang' },
      { label: 'Abwickelbare Motivbreite', value: breite, unit: 'mm', digits: 1, help: 'nutzbare Breite bei gewählter Umschlingung' },
      { label: 'Schritte pro Umdrehung', value: schritte, unit: 'Schritte', digits: 0 },
      { label: 'Gravurfläche', value: flaeche, unit: 'cm²', digits: 1 },
    ];
  },
  intro:
    'Bei der Rotationsgravur dreht eine Drehachse das Werkstück – etwa ein Glas, eine Flasche oder einen Becher – unter dem Laser, sodass die runde Mantelfläche wie eine flache Vorlage graviert werden kann. Entscheidend ist der Umfang an der Gravurstelle, denn er entspricht der maximalen Motivbreite, die einmal rund um das Objekt passt. Dieser Rechner ermittelt den abgewickelten Umfang, die nutzbare Motivbreite je nach Umschlingung und die Anzahl der Drehschritte pro Umdrehung bei der gewählten DPI. So bereitest du das Layout so vor, dass das Motiv ohne Verzerrung sauber rundherum passt.',
  howto: [
    'Durchmesser des Objekts an der Gravurstelle in mm messen und eintragen.',
    'Umschlingung wählen: 100 % graviert einmal komplett herum, weniger für ein einseitiges Motiv.',
    'Gravur-Auflösung in DPI angeben und die Motivhöhe entlang der Achse eintragen.',
    'Umfang und abwickelbare Breite als Layoutmaß übernehmen, damit das Motiv nicht verzerrt.',
  ],
  faq: [
    { q: 'Warum ist der Umfang gleich der Motivbreite?', a: 'Die Drehachse wickelt die runde Mantelfläche zu einer flachen Bahn ab. Eine volle Umdrehung entspricht genau dem Umfang π mal Durchmesser. Dein Motiv muss also so breit angelegt sein wie der Umfang, damit es ohne Stauchung rundherum passt.' },
    { q: 'Wie vermeide ich Verzerrungen?', a: 'Das Bildverhältnis muss zum Verhältnis aus Umfang und Höhe passen. Misst der Umfang z. B. 220 mm und die Höhe 40 mm, sollte das Motiv im selben mm-Verhältnis angelegt sein. Stimmen DPI in beiden Richtungen überein, bleibt das Bild proportional.' },
    { q: 'Was bedeutet die Umschlingung über 100 %?', a: 'Werte bis 360 % erlauben es, das Motiv mehrfach um den Zylinder zu legen, etwa für umlaufende Muster. Der Rechner begrenzt die Breite auf das Vielfache des Umfangs entsprechend dem gewählten Prozentwert bis maximal 360 %.' },
    { q: 'Gilt das auch für konische Becher?', a: 'Bei konischen Objekten ändert sich der Durchmesser über die Höhe, sodass ein gerades Layout schräg gravieren würde. Dann braucht es eine Konus-Korrektur oder man graviert nur ein schmales Band, in dem der Durchmesser näherungsweise konstant ist.' },
  ],
  related: ['laser-dpi-aufloesung', 'laser-gravurflaeche', 'laser-gravur-zeit'],
  updated: '2026-06-16',
  examples: [
    { values: { durchmesser: 70, abdeckung: 100, dpi: 300, hoehe: 40 }, expect: [{ label: 'Umfang', value: 219.9, tolerance: 0.2 }] },
    { values: { durchmesser: 70, abdeckung: 100, dpi: 300, hoehe: 40 }, expect: [{ label: 'Schritte pro Umdrehung', value: 2597, tolerance: 2 }] },
  ],
};
