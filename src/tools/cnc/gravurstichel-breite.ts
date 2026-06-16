import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'gravurstichel-breite',
  category: 'cnc',
  title: 'Gravurstichel- & V-Nut-Breite aus Tiefe',
  shortTitle: 'V-Stichel Breite',
  description:
    'Berechne die Linienbreite eines V-Gravurstichels bzw. die V-Nut-Breite aus Spitzenwinkel und Eintauchtiefe – oder umgekehrt die nötige Tiefe.',
  keywords: [
    'gravurstichel breite berechnen',
    'v-nut breite tiefe',
    'v-bit eintauchtiefe linienbreite',
    'gravur linienbreite winkel',
    'vcarve tiefe breite',
    'spitzenwinkel gravur breite',
    'v-stichel breite tiefe rechner',
  ],
  formula: 'Breite = 2 · Tiefe · tan(Spitzenwinkel/2);  Tiefe = Breite / (2 · tan(Spitzenwinkel/2))',
  inputs: [
    {
      type: 'select',
      id: 'modus',
      label: 'Berechnungsmodus',
      default: 'tiefe2breite',
      options: [
        { value: 'tiefe2breite', label: 'Breite aus Tiefe' },
        { value: 'breite2tiefe', label: 'Tiefe aus Breite' },
      ],
    },
    {
      type: 'select',
      id: 'winkel',
      label: 'Spitzenwinkel V-Stichel',
      default: '90',
      options: [
        { value: '10', label: '10° (Feingravur)' },
        { value: '15', label: '15°' },
        { value: '20', label: '20°' },
        { value: '30', label: '30°' },
        { value: '45', label: '45°' },
        { value: '60', label: '60°' },
        { value: '90', label: '90° (V-Nut Standard)' },
        { value: '120', label: '120° (Fasen/Senken)' },
      ],
      help: 'Vollwinkel der V-Spitze.',
    },
    { type: 'number', id: 'wert', label: 'Eingabewert (Tiefe oder Breite)', unit: 'mm', default: 0.5, min: 0, step: 0.05, help: 'Je nach Modus Eintauchtiefe bzw. gewünschte Linienbreite.' },
  ],
  compute: (v) => {
    const modus = String(v.modus || 'tiefe2breite');
    const winkelGrad = num(v.winkel, 90);
    const wert = num(v.wert);
    const halbRad = (winkelGrad / 2) * (Math.PI / 180);
    const tanHalb = Math.tan(halbRad);
    if (modus === 'breite2tiefe') {
      const tiefe = tanHalb > 0 ? wert / (2 * tanHalb) : 0;
      return [
        { label: 'Benötigte Eintauchtiefe', value: tiefe, unit: 'mm', digits: 3, primary: true },
        { label: 'Halber Spitzenwinkel', value: winkelGrad / 2, unit: '°', digits: 1 },
      ];
    }
    const breite = 2 * wert * tanHalb;
    return [
      { label: 'Linienbreite (V-Nut-Breite)', value: breite, unit: 'mm', digits: 3, primary: true },
      { label: 'Halber Spitzenwinkel', value: winkelGrad / 2, unit: '°', digits: 1 },
    ];
  },
  intro:
    'Ein V-förmiger Gravurstichel erzeugt je tiefer er eintaucht eine breitere Linie – die Breite hängt direkt vom Spitzenwinkel ab. Für saubere Gravuren, V-Nuten und VCarve-Arbeiten musst du Tiefe und Breite aufeinander abstimmen: Ein spitzer Winkel (z. B. 10°) liefert feine Haarlinien, ein stumpfer 90°-Stichel breite Nuten. Der Rechner liefert beide Richtungen – Breite aus Tiefe oder die nötige Tiefe für eine gewünschte Linienbreite. Geometrisch ist die Linie an der Oberfläche die Sehne des V-Querschnitts.',
  howto: [
    'Modus wählen: Breite aus Tiefe oder Tiefe aus gewünschter Breite.',
    'Spitzenwinkel des V-Stichels auswählen (Vollwinkel laut Werkzeug).',
    'Tiefe bzw. Breite in mm eintragen.',
    'Ergebnis ablesen und die Z-Eintauchtiefe im CAM entsprechend setzen.',
  ],
  faq: [
    {
      q: 'Gilt die Formel auch für eine V-Nut mit Flachboden?',
      a: 'Die Formel gilt für die reine V-Spitze. Hat der Stichel eine kleine Flachspitze (Flat), ist die reale Breite um diese Flachbreite größer – dann Flachbreite zur berechneten V-Breite addieren.',
    },
    {
      q: 'Wie bekomme ich besonders feine Linien?',
      a: 'Mit kleinem Spitzenwinkel und geringer Eintauchtiefe. Ein 15°-Stichel ergibt bei 0,1 mm Tiefe nur etwa 0,026 mm Linienbreite – ideal für feine Schrift und Layouts.',
    },
    {
      q: 'Warum wird meine Gravur breiter als geplant?',
      a: 'Meist taucht der Stichel zu tief ein – oft wegen Unebenheit des Materials oder ungenauer Z-Nullung. Schon Zehntelmillimeter mehr Tiefe verbreitern die Linie sichtbar, weil Breite und Tiefe linear gekoppelt sind.',
    },
    {
      q: 'Kann ich damit auch Fasenbreiten berechnen?',
      a: 'Für 45°-Fasen ist ein eigener Rechner sinnvoller, da dort die Fasenkante an der Bauteilkante betrachtet wird. Für V-Nuten und Gravuren in der Fläche passt dieser Rechner.',
    },
  ],
  related: ['fasenbreite-45-grad', 'kegelwinkel', 'theoretische-rautiefe'],
  updated: '2026-06-16',
  examples: [
    {
      values: { modus: 'tiefe2breite', winkel: '90', wert: 0.5 },
      expect: [{ label: 'Linienbreite (V-Nut-Breite)', value: 1.0, tolerance: 0.005 }],
    },
    {
      values: { modus: 'tiefe2breite', winkel: '60', wert: 0.5 },
      expect: [{ label: 'Linienbreite (V-Nut-Breite)', value: 0.577, tolerance: 0.005 }],
    },
    {
      values: { modus: 'breite2tiefe', winkel: '90', wert: 2 },
      expect: [{ label: 'Benötigte Eintauchtiefe', value: 1.0, tolerance: 0.005 }],
    },
  ],
};
