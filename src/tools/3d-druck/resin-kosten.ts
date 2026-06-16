import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'resin-kosten',
  category: '3d-druck',
  title: 'Resin-Kosten-Rechner (SLA / MSLA)',
  shortTitle: 'Resin-Kosten',
  description:
    'Berechne die Materialkosten eines SLA-/MSLA-Drucks aus dem Resinvolumen in Millilitern, dem Literpreis und einem Aufschlag für Stützen und Verluste.',
  keywords: [
    'resin kosten rechner',
    'sla druckkosten berechnen',
    'harz preis pro liter',
    'resin verbrauch kosten',
    'msla materialkosten',
    'resin ml kosten umrechnen',
  ],
  formula: 'Kosten = (Volumen_ml × (1 + Verlust%) / 1000) × Preis_je_Liter',
  inputs: [
    { type: 'number', id: 'volumen', label: 'Resinvolumen', unit: 'ml', default: 25, min: 0, step: 1, help: 'Aus dem Slicer (z. B. Lychee, CHITUBOX).' },
    { type: 'number', id: 'preis', label: 'Resinpreis', unit: '€/L', default: 45, min: 0, step: 1 },
    { type: 'number', id: 'verlust', label: 'Aufschlag (Stützen/Verlust)', unit: '%', default: 0, min: 0, max: 100, step: 1, help: 'Zusatz für anhaftendes Harz und Ausschuss.' },
  ],
  compute: (v) => {
    const volumen = num(v.volumen);
    const preis = num(v.preis);
    const verlust = num(v.verlust) / 100;
    const effVolumen = volumen * (1 + verlust);
    const kosten = (effVolumen / 1000) * preis;
    const proMl = preis / 1000;
    return [
      { label: 'Materialkosten', value: kosten, unit: '€', digits: 2, primary: true },
      { label: 'Effektives Volumen', value: effVolumen, unit: 'ml', digits: 1 },
      { label: 'Preis je Milliliter', value: proMl, unit: '€/ml', digits: 4 },
    ];
  },
  intro:
    'Beim SLA- und MSLA-Druck wird Material nicht in Gramm, sondern in Millilitern flüssigem Resin verbraucht – der Slicer gibt dieses Volumen direkt aus. Dieser Rechner rechnet das ml-Volumen mit dem Literpreis in Eurokosten um und lässt dich einen Aufschlag für am Modell und in der Wanne verbleibendes Harz sowie Ausschuss berücksichtigen. So kalkulierst du Verkaufspreise oder vergleichst, ob sich ein günstigeres Standardharz gegenüber einem teuren ABS-Like lohnt.',
  howto: [
    'Resinvolumen in Millilitern aus deinem Slicer (Lychee, CHITUBOX, voxeldance) ablesen.',
    'Literpreis des verwendeten Harzes eintragen (1 L = 1000 ml).',
    'Optional einen Aufschlag für anhaftendes Harz, Reinigung und Fehldrucke ergänzen (z. B. 5–10 %).',
    'Materialkosten ablesen und für Preiskalkulation oder Materialvergleich nutzen.',
  ],
  faq: [
    { q: 'Warum rechnet man Resin in ml statt Gramm?', a: 'SLA-Slicer geben das verdrängte Volumen aus. Die Dichte der meisten Harze liegt bei etwa 1,1 g/ml, ml und g sind also fast, aber nicht ganz gleich.' },
    { q: 'Sollte ich Strom und Belichtung auch einrechnen?', a: 'Für reine Materialkosten nein. MSLA-Drucker verbrauchen wenig Strom; für eine Vollkalkulation kombiniere diesen Wert mit Strom- und Maschinenstundensatz.' },
    { q: 'Wie hoch ist ein realistischer Verlustaufschlag?', a: 'In der Praxis sind 5–15 % sinnvoll, je nach Stützanteil, Anzahl Fehldrucke und Resin, das beim Abtropfen und Reinigen verloren geht.' },
    { q: 'Was kostet günstiges Standardresin?', a: 'Standardharze liegen oft bei 20–35 €/L, Spezialharze (zäh, ABS-Like, durchsichtig) bei 45–90 €/L. Den Preis je ml zeigt dir der Rechner zum direkten Vergleich.' },
  ],
  related: ['druckpreis-kalkulation', 'maschinenstundensatz-3d-druck', 'stromkosten-3d-druck'],
  updated: '2026-06-16',
  examples: [
    {
      values: { volumen: 25, preis: 45, verlust: 0 },
      expect: [
        { label: 'Materialkosten', value: 1.125, tolerance: 0.001 },
        { label: 'Preis je Milliliter', value: 0.045, tolerance: 0.0001 },
      ],
    },
    {
      values: { volumen: 100, preis: 50, verlust: 10 },
      expect: [
        { label: 'Materialkosten', value: 5.5, tolerance: 0.01 },
        { label: 'Effektives Volumen', value: 110, tolerance: 0.1 },
      ],
    },
  ],
};
