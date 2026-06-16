import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'bretter-pro-quadratmeter',
  category: 'holz',
  title: 'Bretter pro Quadratmeter berechnen',
  shortTitle: 'Bretter pro m²',
  description:
    'Berechne, wie viele Bretter pro Quadratmeter du brauchst – aus Brettbreite und optionalem Fugen- oder Überlappungsmaß, inklusive Laufmeter.',
  keywords: [
    'bretter pro quadratmeter berechnen',
    'wie viele bretter pro m2',
    'brettbedarf berechnen',
    'profilbretter pro m2',
    'rhombusleisten pro quadratmeter',
    'fassadenbretter menge',
    'laufmeter bretter pro m2',
  ],
  formula:
    'Deckbreite = Brettbreite + Fuge − Überlappung · Bretter/m² = 1000 / Deckbreite (pro lfm Höhe) · Laufmeter/m² = 1000 / Deckbreite',
  inputs: [
    { type: 'number', id: 'brettbreite', label: 'Brettbreite (Nennmaß)', unit: 'mm', default: 120, min: 1, step: 1 },
    { type: 'number', id: 'fuge', label: 'Fugenabstand', unit: 'mm', default: 0, min: 0, step: 1, help: 'Sichtbare Fuge zwischen den Brettern (z. B. offene Verlegung).' },
    { type: 'number', id: 'ueberlappung', label: 'Überlappung', unit: 'mm', default: 0, min: 0, step: 1, help: 'Bei überlappender/Boden-Deckel-Verlegung das überdeckte Maß.' },
  ],
  compute: (v) => {
    const brettbreite = num(v.brettbreite);
    const fuge = num(v.fuge);
    const ueberlappung = num(v.ueberlappung);

    const deckbreite = brettbreite + fuge - ueberlappung;
    const laufmeterProM2 = deckbreite > 0 ? 1000 / deckbreite : 0;
    const bretterProM2BeiM = laufmeterProM2; // Stück je m² bei 1 m Brettlänge

    return [
      { label: 'Effektive Deckbreite', value: deckbreite, unit: 'mm', digits: 1 },
      { label: 'Laufmeter je m²', value: laufmeterProM2, unit: 'm/m²', digits: 2, primary: true },
      { label: 'Bretter je m² (bei 1 m Länge)', value: bretterProM2BeiM, unit: 'Stück', digits: 2 },
    ];
  },
  intro:
    'Dieser Rechner sagt dir, wie viele Bretter beziehungsweise wie viele Laufmeter du je Quadratmeter Fläche brauchst – etwa für eine Holzfassade, Verkleidung oder Wandvertäfelung. Maßgeblich ist nicht die Nennbreite, sondern die effektive Deckbreite: Sie steigt durch sichtbare Fugen und sinkt durch Überlappungen wie bei der Boden-Deckel-Schalung. Aus der Deckbreite folgen die Laufmeter je Quadratmeter und – bei einer angenommenen Brettlänge von 1 m – die Stückzahl.',
  howto: [
    'Brettbreite als Nennmaß eintragen (bei Nut-und-Feder ggf. die sichtbare Deckbreite).',
    'Bei offener Verlegung den gewünschten Fugenabstand angeben.',
    'Bei überlappender Schalung das überdeckte Maß als Überlappung eintragen.',
    'Laufmeter je m² mit deiner Fassaden- oder Wandfläche multiplizieren, dann Verschnitt zuschlagen.',
  ],
  faq: [
    {
      q: 'Wie komme ich von Laufmetern auf Stückzahl?',
      a: 'Teile die gesamten Laufmeter durch die tatsächliche Brettlänge. Bei 8,33 lfm/m², 20 m² Fläche und 4 m langen Brettern: 8,33 × 20 / 4 ≈ 42 Bretter, plus Verschnitt.',
    },
    {
      q: 'Was bedeutet Deckbreite bei Nut-und-Feder?',
      a: 'Profilbretter geben oft Nennbreite und kleinere Deckbreite an, weil die Feder in der Nut verschwindet. Trage am besten direkt die Deckbreite als Brettbreite ein und lass Fuge und Überlappung auf 0.',
    },
    {
      q: 'Wie rechne ich Boden-Deckel-Schalung?',
      a: 'Dort überlappen die Deckbretter die Bodenbretter. Erfasse die Verlegung am besten getrennt nach Boden- und Deckelreihe; jede Reihe hat ihre eigene effektive Deckbreite aus Brettbreite minus Überlappung.',
    },
    {
      q: 'Muss ich Verschnitt einrechnen?',
      a: 'Ja. Plane je nach Verlegung und Fläche 5–10 % Verschnitt zusätzlich ein, bei vielen Aussparungen rund um Fenster und Türen eher mehr.',
    },
  ],
  related: ['terrassendielen-bedarf', 'zuschnitt-laenge'],
  updated: '2026-06-16',
  examples: [
    {
      values: { brettbreite: 120, fuge: 0, ueberlappung: 0 },
      expect: [
        { label: 'Effektive Deckbreite', value: 120, tolerance: 0.01 },
        { label: 'Laufmeter je m²', value: 8.33, tolerance: 0.02 },
        { label: 'Bretter je m² (bei 1 m Länge)', value: 8.33, tolerance: 0.02 },
      ],
    },
    {
      values: { brettbreite: 120, fuge: 10, ueberlappung: 0 },
      expect: [
        { label: 'Effektive Deckbreite', value: 130, tolerance: 0.01 },
        { label: 'Laufmeter je m²', value: 7.69, tolerance: 0.02 },
      ],
    },
  ],
};
