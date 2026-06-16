import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'modell-skalieren',
  category: '3d-druck',
  title: 'Modell skalieren in % (Zielmaß / Istmaß)',
  shortTitle: 'Modell skalieren',
  description:
    'Berechne den Skalierungsfaktor in Prozent aus gemessenem Istmaß und gewünschtem Zielmaß und korrigiere zu kleine oder zu große 3D-Drucke exakt.',
  keywords: [
    'modell skalieren prozent',
    '3d druck skalierungsfaktor berechnen',
    'zielmaß istmaß umrechnen',
    'druck zu klein skalieren',
    'maßabweichung korrigieren 3d druck',
    'scale factor rechner slicer',
  ],
  formula: 'Skalierung % = Zielmaß / Istmaß × 100; Volumenfaktor = Skalierung³',
  inputs: [
    { type: 'number', id: 'ist', label: 'Gemessenes Istmaß', unit: 'mm', default: 49.8, min: 0.01, step: 0.1, help: 'Mit Messschieber am gedruckten Teil.' },
    { type: 'number', id: 'ziel', label: 'Gewünschtes Zielmaß', unit: 'mm', default: 50.5, min: 0, step: 0.1 },
  ],
  compute: (v) => {
    const ist = num(v.ist);
    const ziel = num(v.ziel);
    const skalierung = ist > 0 ? (ziel / ist) * 100 : 0;
    const faktor = ist > 0 ? ziel / ist : 0;
    const volumenfaktor = faktor * faktor * faktor * 100;
    return [
      { label: 'Skalierungsfaktor', value: skalierung, unit: '%', digits: 2, primary: true },
      { label: 'Volumenänderung', value: volumenfaktor, unit: '%', digits: 1, help: 'Material- und Gewichtsänderung (Faktor³).' },
    ];
  },
  intro:
    'Wenn ein gedrucktes Teil minimal zu klein oder zu groß ist, korrigierst du es nicht durch Neumodellieren, sondern über den Skalierungsfaktor im Slicer. Dieser Rechner teilt das gewünschte Zielmaß durch das per Messschieber ermittelte Istmaß und gibt den Faktor in Prozent aus. Da Skalierung in alle drei Achsen wirkt, zeigt das Tool zusätzlich die Volumenänderung, also wie stark sich Materialverbrauch und Gewicht verschieben.',
  howto: [
    'Eine bekannte Strecke am gedruckten Teil mit dem Messschieber messen (Istmaß).',
    'Das eigentlich gewünschte Maß (Zielmaß) eintragen.',
    'Skalierungsfaktor in Prozent ablesen.',
    'Wert im Slicer unter „Skalieren / Scale" gleichmäßig (uniform) auf alle Achsen anwenden und erneut drucken.',
  ],
  faq: [
    { q: 'Warum nicht in jede Achse einzeln skalieren?', a: 'Druckabweichungen entstehen oft durch Materialschwund oder Kalibrierung und betreffen meist alle Achsen ähnlich. Uniforme Skalierung erhält die Proportionen.' },
    { q: 'Was bedeutet die Volumenänderung?', a: 'Skalierung wirkt in drei Dimensionen, daher steigt das Volumen mit der dritten Potenz. 101 % Maß bedeuten rund 103 % Material und Gewicht.' },
    { q: 'Sollte ich lieber die Schwundkompensation nutzen?', a: 'Bei systematischem Schwund ja – dort stellst du einen dauerhaften Kompensationsfaktor ein. Skalieren ist die schnelle Einzelkorrektur für ein konkretes Teil.' },
    { q: 'Gilt das für Bohrungen und Passungen?', a: 'Bedingt: Uniformes Skalieren ändert auch Lochdurchmesser mit. Für reine Passungskorrekturen ist gezielte Lochkompensation oft besser.' },
  ],
  related: ['schwund-kompensation', 'linienbreite-rechner', 'schichtanzahl-rechner'],
  updated: '2026-06-16',
  examples: [
    {
      values: { ist: 49.8, ziel: 50.5 },
      expect: [
        { label: 'Skalierungsfaktor', value: 101.41, tolerance: 0.02 },
        { label: 'Volumenänderung', value: 104.3, tolerance: 0.2 },
      ],
    },
  ],
};
