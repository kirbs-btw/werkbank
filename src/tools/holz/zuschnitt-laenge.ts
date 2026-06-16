import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'zuschnitt-laenge',
  category: 'holz',
  title: 'Zuschnitt-Rechner (Stangen/Bretter)',
  shortTitle: 'Zuschnittrechner',
  description:
    'Berechne, wie viele Teile sich aus einer Stange oder einem Brett sägen lassen und wie viele Rohlinge du brauchst – inklusive Sägeblattverlust.',
  keywords: [
    'zuschnitt berechnen',
    'teile pro stange',
    'verschnitt sägeblatt',
    'wie viele bretter brauche ich',
    'materialbedarf zuschnitt',
  ],
  formula:
    'Teile/Stange = abrunden((Stocklänge + Schnittfuge) / (Teillänge + Schnittfuge)) · Stangen = aufrunden(Anzahl / Teile pro Stange)',
  inputs: [
    { type: 'number', id: 'teillaenge', label: 'Teillänge', unit: 'mm', default: 600, min: 1, step: 10 },
    { type: 'number', id: 'anzahl', label: 'Anzahl benötigter Teile', unit: 'Stk', default: 20, min: 1, step: 1 },
    { type: 'number', id: 'stocklaenge', label: 'Länge der Stange/des Bretts', unit: 'mm', default: 2000, min: 1, step: 10 },
    { type: 'number', id: 'saegeblatt', label: 'Sägeblattbreite (Schnittfuge)', unit: 'mm', default: 3, min: 0, step: 0.5, help: 'Materialverlust pro Schnitt durch die Sägeblattdicke.' },
  ],
  compute: (v) => {
    const teil = num(v.teillaenge, 1);
    const anzahl = num(v.anzahl, 1);
    const stock = num(v.stocklaenge);
    const fuge = num(v.saegeblatt);
    const proStange = Math.max(0, Math.floor((stock + fuge) / (teil + fuge)));
    const stangen = proStange > 0 ? Math.ceil(anzahl / proStange) : 0;
    return [
      { label: 'Teile pro Stange', value: proStange, unit: 'Stk', digits: 0 },
      { label: 'Benötigte Stangen', value: stangen, unit: 'Stk', digits: 0, primary: true },
    ];
  },
  howto: [
    'Länge eines einzelnen Teils und die benötigte Stückzahl eintragen.',
    'Länge der gekauften Stange oder des Bretts angeben.',
    'Sägeblattbreite (Schnittfuge) ergänzen – sie geht bei jedem Schnitt verloren.',
    'Ergebnis zeigt, wie viele Rohlinge du kaufen musst.',
  ],
  faq: [
    {
      q: 'Warum spielt die Sägeblattbreite eine Rolle?',
      a: 'Jeder Schnitt zerstäubt Material in Breite des Sägeblatts (Schnittfuge). Bei vielen Teilen pro Stange summiert sich dieser Verlust spürbar.',
    },
    {
      q: 'Wird Verschnitt am Stangenende berücksichtigt?',
      a: 'Ja, indirekt: Es werden nur vollständige Teile gezählt, der nicht nutzbare Rest am Ende fällt automatisch weg.',
    },
  ],
  related: ['holz-volumen-gewicht', 'bodenbelag-paketrechner'],
  updated: '2026-06-15',
  examples: [
    {
      values: { teillaenge: 600, anzahl: 20, stocklaenge: 2000, saegeblatt: 3 },
      expect: [
        { label: 'Teile pro Stange', value: 3, tolerance: 0 },
        { label: 'Benötigte Stangen', value: 7, tolerance: 0 },
      ],
    },
  ],
};
