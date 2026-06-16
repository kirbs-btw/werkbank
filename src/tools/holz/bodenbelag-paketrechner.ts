import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'bodenbelag-paketrechner',
  category: 'holz',
  title: 'Bodenbelag- & Laminat-Paketrechner',
  shortTitle: 'Laminat-Pakete',
  description:
    'Berechne Materialbedarf und benötigte Pakete für Laminat, Parkett oder Vinyl aus Raumfläche, Paketinhalt und Verschnitt.',
  keywords: [
    'laminat berechnen',
    'parkett pakete berechnen',
    'bodenbelag verschnitt',
    'wie viele pakete laminat',
    'vinyl bedarf berechnen',
  ],
  formula: 'Bedarf = Raumfläche · (1 + Verschnitt/100) · Pakete = aufrunden(Bedarf / Paketinhalt)',
  inputs: [
    { type: 'number', id: 'flaeche', label: 'Raumfläche', unit: 'm²', default: 20, min: 0, step: 0.5 },
    { type: 'number', id: 'paketinhalt', label: 'Inhalt pro Paket', unit: 'm²', default: 2.5, min: 0.1, step: 0.05 },
    { type: 'number', id: 'verschnitt', label: 'Verschnitt-Zuschlag', unit: '%', default: 8, min: 0, max: 30, step: 1, help: 'Gerade Verlegung ca. 5 %, Diagonal-/Fischgrätverlegung 10–15 %.' },
  ],
  compute: (v) => {
    const flaeche = num(v.flaeche);
    const paket = num(v.paketinhalt, 1);
    const verschnitt = num(v.verschnitt);
    const bedarf = flaeche * (1 + verschnitt / 100);
    const pakete = Math.ceil(bedarf / paket);
    return [
      { label: 'Materialbedarf', value: bedarf, unit: 'm²', digits: 2 },
      { label: 'Benötigte Pakete', value: pakete, unit: 'Pakete', digits: 0, primary: true },
    ];
  },
  howto: [
    'Raumfläche in m² berechnen (Länge × Breite, ggf. Teilflächen addieren).',
    'Paketinhalt vom Etikett des Bodenbelags ablesen.',
    'Verschnitt-Zuschlag wählen: gerade 5 %, diagonal/Fischgrät 10–15 %.',
    'Anzahl der aufgerundeten Pakete kaufen – Restkartons für Reparaturen aufbewahren.',
  ],
  faq: [
    {
      q: 'Warum wird auf ganze Pakete aufgerundet?',
      a: 'Bodenbeläge werden nur in ganzen Paketen verkauft. Der Rest dient als Reserve für Zuschnitte und spätere Reparaturen.',
    },
    {
      q: 'Wie viel Verschnitt sollte ich einplanen?',
      a: 'Bei gerader Verlegung reichen rund 5 %, bei diagonaler oder Fischgrät-Verlegung sind 10–15 % sinnvoll.',
    },
  ],
  related: ['holz-volumen-gewicht'],
  updated: '2026-06-15',
  examples: [
    {
      values: { flaeche: 20, paketinhalt: 2.5, verschnitt: 8 },
      expect: [
        { label: 'Materialbedarf', value: 21.6, tolerance: 0.01 },
        { label: 'Benötigte Pakete', value: 9, tolerance: 0 },
      ],
    },
  ],
};
