import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'purge-volumen-mehrfarb',
  category: '3d-druck',
  title: 'Mehrfarb-Purge-Volumen & Abfall Rechner',
  shortTitle: 'Purge-Volumen',
  description:
    'Berechne den Filamentabfall durch Farbwechsel beim Mehrfarbdruck: Purge-Volumen, Länge, Gewicht und Kosten aus Wechselzahl und Spülmenge.',
  keywords: [
    'purge volumen berechnen mehrfarb',
    'filament abfall farbwechsel',
    'wipe tower volumen rechner',
    'mmu ams purge menge',
    'spülvolumen 3d druck kosten',
    'mehrfarbdruck abfall berechnen',
  ],
  formula:
    'Gesamt-Purge = Anzahl Wechsel × Purge je Wechsel; Länge = Volumen / (π/4 × d²)',
  inputs: [
    { type: 'number', id: 'wechsel', label: 'Anzahl Farbwechsel', unit: '', default: 200, min: 1, step: 1, help: 'Tool-Changes aus dem Slicer (über alle Schichten).' },
    { type: 'number', id: 'purge', label: 'Purge je Wechsel', unit: 'mm³', default: 140, min: 1, step: 5, help: 'Spülvolumen pro Wechsel; AMS-Standard oft 100–200 mm³.' },
    { type: 'number', id: 'dfila', label: 'Filamentdurchmesser', unit: 'mm', default: 1.75, min: 1, max: 4, step: 0.05 },
    { type: 'number', id: 'dichte', label: 'Materialdichte', unit: 'g/cm³', default: 1.24, min: 0.5, max: 3, step: 0.01 },
    { type: 'number', id: 'preis', label: 'Filamentpreis', unit: 'EUR/kg', default: 22, min: 0, step: 1 },
  ],
  compute: (v) => {
    const wechsel = num(v.wechsel);
    const purge = num(v.purge);
    const df = num(v.dfila);
    const dichte = num(v.dichte);
    const preis = num(v.preis);
    const volMm3 = wechsel * purge;
    const querschnitt = (Math.PI / 4) * df * df;
    const laengeM = querschnitt > 0 ? volMm3 / querschnitt / 1000 : 0;
    const gewicht = (volMm3 / 1000) * dichte;
    const kosten = (gewicht / 1000) * preis;
    return [
      { label: 'Purge-Volumen gesamt', value: volMm3 / 1000, unit: 'cm³', digits: 1, primary: true, help: 'Reiner Abfall durch Farbwechsel.' },
      { label: 'Abfall-Länge', value: laengeM, unit: 'm', digits: 1 },
      { label: 'Abfall-Gewicht', value: gewicht, unit: 'g', digits: 1 },
      { label: 'Abfall-Kosten', value: kosten, unit: 'EUR', digits: 2 },
    ];
  },
  intro:
    'Beim Mehrfarbdruck mit AMS, MMU oder manuellem Wechsel muss bei jedem Farbwechsel die alte Farbe aus der Düse gespült werden – dieses Purge-Material landet im Wipe-Tower oder als Abfallknäuel und kann den realen Verbrauch verdoppeln. Das Gesamtvolumen ergibt sich aus der Zahl der Farbwechsel mal dem Spülvolumen je Wechsel. Über Filamentquerschnitt, Dichte und Preis rechnet der Rechner das in Länge, Gewicht und Eurokosten um, damit du Wechselzahl und Purge-Einstellung bewusst optimierst.',
  howto: [
    'Anzahl der Farbwechsel aus dem Slicer übernehmen (Tool-Changes über das gesamte Modell).',
    'Purge-Volumen je Wechsel eintragen – steht in den Slicer-Einstellungen der Spülmatrix.',
    'Filamentdurchmesser, Dichte und Kilopreis des Materials angeben.',
    'Abfallvolumen, -gewicht und -kosten ablesen und ggf. Spülmengen reduzieren.',
  ],
  faq: [
    { q: 'Wie senke ich das Purge-Volumen?', a: 'Spülmengen in der Flush-Matrix für ähnliche Farben reduzieren, Farbwechsel pro Schicht minimieren, einen Spülturm als Objekt mitnutzen oder das Purge in Infill/Stützen ableiten.' },
    { q: 'Was ist ein realistisches Purge je Wechsel?', a: 'Helle nach dunkler Farbe braucht wenig, dunkel nach hell viel. Bambu/Prusa nutzen je nach Farbpaar grob 70–250 mm³; der eingestellte Mittelwert genügt für die Schätzung.' },
    { q: 'Zählt das Purge zur Druckzeit?', a: 'Ja, indirekt: Jedes Spülen kostet Zeit für Tower-Bewegung und Extrusion. Mehr Wechsel bedeuten also auch längere Drucke, nicht nur mehr Abfall.' },
    { q: 'Kann ich das Abfallfilament wiederverwenden?', a: 'Sortenreines Purge lässt sich mit einem Recycler einschmelzen oder als Granulat sammeln. Gemischte Farben sind eher dekorativer Reststoff oder Müll.' },
    { q: 'Warum mehr Verbrauch als das Modell selbst?', a: 'Bei kleinen, oft die Farbe wechselnden Modellen übersteigt das Spülmaterial leicht das Bauteilgewicht – deshalb lohnt die getrennte Kalkulation des Abfalls.' },
  ],
  related: ['filament-kosten', 'druckpreis-kalkulation', 'stuetzmaterial-anteil'],
  updated: '2026-06-16',
  examples: [
    {
      values: { wechsel: 200, purge: 140, dfila: 1.75, dichte: 1.24, preis: 22 },
      expect: [
        { label: 'Purge-Volumen gesamt', value: 28.0, tolerance: 0.1 },
        { label: 'Abfall-Gewicht', value: 34.7, tolerance: 0.2 },
        { label: 'Abfall-Kosten', value: 0.76, tolerance: 0.02 },
      ],
    },
  ],
};
