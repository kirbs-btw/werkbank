import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Zollgewinde: Nenndurchmesser in Zoll, Gänge pro Zoll (TPI),
// und das nächstgelegene metrische Regelgewinde als Orientierung.
const TABLE: Record<string, { zoll: number; tpi: number; metrisch: string }> = {
  'unc-1-4-20': { zoll: 0.25, tpi: 20, metrisch: 'M6' },
  'unc-5-16-18': { zoll: 0.3125, tpi: 18, metrisch: 'M8' },
  'unc-3-8-16': { zoll: 0.375, tpi: 16, metrisch: 'M10' },
  'unc-1-2-13': { zoll: 0.5, tpi: 13, metrisch: 'M12' },
  'unf-1-4-28': { zoll: 0.25, tpi: 28, metrisch: 'M6×0,75' },
  'unf-1-2-20': { zoll: 0.5, tpi: 20, metrisch: 'M12×1,25' },
  'bsw-1-4-20': { zoll: 0.25, tpi: 20, metrisch: 'M6' },
  'bsw-3-8-16': { zoll: 0.375, tpi: 16, metrisch: 'M10' },
};

export const tool: Tool = {
  slug: 'zollgewinde-metrisch',
  category: 'schrauben',
  title: 'Zollgewinde in mm umrechnen (UNC / UNF / Whitworth)',
  shortTitle: 'Zoll → metrisch',
  description:
    'Rechne Zollgewinde wie 1/4-20 UNC oder 1/2-13 in Millimeter um: Nenndurchmesser, Steigung aus TPI und das passende metrische Ersatzgewinde.',
  keywords: [
    'zollgewinde in mm',
    'unc umrechnen metrisch',
    'zoll gewinde tabelle mm',
    '1/4 zoll gewinde in mm',
    'tpi in steigung',
    'whitworth metrisch umrechnen',
    'unf gewinde durchmesser mm',
  ],
  formula: 'd[mm] = Zoll · 25,4   ·   P[mm] = 25,4 / TPI',
  inputs: [
    {
      type: 'select', id: 'gewinde', label: 'Zollgewinde', default: 'unc-1-4-20',
      options: [
        { value: 'unc-1-4-20', label: '1/4"-20 UNC' },
        { value: 'unc-5-16-18', label: '5/16"-18 UNC' },
        { value: 'unc-3-8-16', label: '3/8"-16 UNC' },
        { value: 'unc-1-2-13', label: '1/2"-13 UNC' },
        { value: 'unf-1-4-28', label: '1/4"-28 UNF' },
        { value: 'unf-1-2-20', label: '1/2"-20 UNF' },
        { value: 'bsw-1-4-20', label: '1/4" BSW (Whitworth)' },
        { value: 'bsw-3-8-16', label: '3/8" BSW (Whitworth)' },
      ],
      help: 'UNC = grob, UNF = fein, BSW = Whitworth (55°-Flankenwinkel).',
    },
  ],
  compute: (v) => {
    const row = TABLE[String(v.gewinde)] ?? TABLE['unc-1-4-20'];
    const dMm = row.zoll * 25.4;
    const pMm = row.tpi > 0 ? 25.4 / row.tpi : 0;
    return [
      { label: 'Nenndurchmesser', value: dMm, unit: 'mm', digits: 2, primary: true },
      { label: 'Steigung P', value: pMm, unit: 'mm', digits: 3 },
      { label: 'Gänge je Zoll (TPI)', value: row.tpi, unit: '1/Zoll', digits: 0 },
      { label: 'Metrisches Ersatzgewinde', value: row.metrisch },
    ];
  },
  intro:
    'Zollgewinde werden über ihren Nenndurchmesser in Zoll und die Gangzahl pro Zoll (TPI) beschrieben, etwa 1/4-20 UNC. Dieser Rechner wandelt beides ins metrische System: Der Durchmesser wird mit 25,4 multipliziert, die Steigung ergibt sich aus 25,4 geteilt durch TPI. Zusätzlich nennt er das nächstgelegene metrische Gewinde — praktisch, wenn man importierte Maschinen, Fahrradteile oder amerikanische Bauteile mit metrischem Werkzeug bearbeiten will.',
  howto: [
    'Zollgewinde aus der Liste wählen (UNC grob, UNF fein, BSW Whitworth).',
    'Nenndurchmesser in mm ablesen, etwa für die Bohrer- oder Materialwahl.',
    'Steigung P aus der TPI-Umrechnung für die Mutter- oder Gewindeschneiderwahl nutzen.',
    'Bei Bedarf das metrische Ersatzgewinde als ungefähre Entsprechung verwenden.',
  ],
  faq: [
    { q: 'Kann ich ein Zollgewinde durch ein metrisches ersetzen?', a: 'Nur eingeschränkt. Das Ersatzgewinde hat einen ähnlichen Durchmesser, aber meist eine andere Steigung und beim Whitworth einen anderen Flankenwinkel (55° statt 60°). Schrauben und Muttern sind daher nicht austauschbar, nur als Anhaltspunkt zu sehen.' },
    { q: 'Was bedeutet TPI?', a: 'TPI steht für Threads Per Inch, also Gänge pro Zoll. Je höher die TPI, desto feiner das Gewinde. Die metrische Steigung erhält man, indem man 25,4 mm durch die TPI teilt: 20 TPI entsprechen 1,27 mm.' },
    { q: 'Was ist der Unterschied zwischen UNC und UNF?', a: 'UNC ist das amerikanische Regelgewinde mit gröberer Steigung, UNF das Feingewinde mit mehr Gängen pro Zoll. 1/4-20 ist UNC, 1/4-28 ist UNF — gleicher Durchmesser, feinere Steigung.' },
    { q: 'Ist Whitworth dasselbe wie UNC?', a: 'Nein. Whitworth (BSW) hat einen Flankenwinkel von 55 Grad und abgerundete Gewindespitzen, UNC/UNF dagegen 60 Grad. Auch wenn Durchmesser und TPI manchmal übereinstimmen, passen die Gewinde nicht sauber zusammen.' },
  ],
  related: ['metrisches-gewinde-tabelle', 'feingewinde-steigung'],
  updated: '2026-06-16',
  examples: [
    { values: { gewinde: 'unc-1-4-20' }, expect: [{ label: 'Nenndurchmesser', value: 6.35, tolerance: 0.01 }, { label: 'Steigung P', value: 1.27, tolerance: 0.005 }] },
    { values: { gewinde: 'unc-1-2-13' }, expect: [{ label: 'Steigung P', value: 1.954, tolerance: 0.01 }] },
  ],
};
