import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'duesen-verschleiss',
  category: '3d-druck',
  title: 'Düsen-Verschleiß bei Abrasiv-Filament Rechner',
  shortTitle: 'Düsen-Verschleiß',
  description:
    'Schätze die Lebensdauer einer Messing- oder Stahldüse bei abrasivem Filament und die Düsenkosten pro Kilo aus Verschleißrate und Durchsatz.',
  keywords: [
    'düsen verschleiß abrasiv filament',
    'messingdüse lebensdauer carbon',
    'gehärtete düse haltbarkeit',
    'düse wechseln nach wie viel kg',
    'düsenkosten pro kg rechner',
    'abrasives filament düse verschleiß',
  ],
  formula:
    'Lebensdauer (kg) = max. Verschleiß / Verschleißrate; Kosten/kg = Düsenpreis / Lebensdauer',
  inputs: [
    {
      type: 'select', id: 'duese', label: 'Düsenmaterial', default: 'messing',
      options: [
        { value: 'messing', label: 'Messing (sehr empfindlich)' },
        { value: 'gehaertet', label: 'Gehärteter Stahl' },
        { value: 'ruby', label: 'Ruby / Hartmetall (ARS)' },
      ],
      help: 'Bestimmt die typische Verschleißrate.',
    },
    {
      type: 'select', id: 'filament', label: 'Filament-Abrasivität', default: 'cf',
      options: [
        { value: 'normal', label: 'Standard (PLA/PETG/ABS) – kaum abrasiv' },
        { value: 'glow', label: 'Glow-in-Dark / metallic – mäßig' },
        { value: 'cf', label: 'Carbon-/Glasfaser gefüllt – stark' },
        { value: 'wolfram', label: 'Wolfram-/Stahl-gefüllt – extrem' },
      ],
    },
    { type: 'number', id: 'verbrauch', label: 'Filamentverbrauch', unit: 'kg', default: 5, min: 0.1, step: 0.5, help: 'Geplante Materialmenge mit dieser Düse.' },
    { type: 'number', id: 'preis', label: 'Düsenpreis', unit: 'EUR', default: 25, min: 0, step: 1 },
  ],
  compute: (v) => {
    const duese = String(v.duese);
    const filament = String(v.filament);
    const verbrauch = num(v.verbrauch);
    const preis = num(v.preis);
    // Basis-Lebensdauer in kg bei stark abrasivem (CF) Filament je Düsentyp:
    const basisCf: Record<string, number> = { messing: 0.3, gehaertet: 5, ruby: 40 };
    // Abrasivitäts-Faktor relativ zu CF (höher = längere Lebensdauer):
    const abrasiv: Record<string, number> = { normal: 50, glow: 4, cf: 1, wolfram: 0.35 };
    const basis = basisCf[duese] ?? 0.3;
    const faktor = abrasiv[filament] ?? 1;
    const lebensdauer = basis * faktor;
    const auslastung = lebensdauer > 0 ? (verbrauch / lebensdauer) * 100 : 0;
    const kostenProKg = lebensdauer > 0 ? preis / lebensdauer : 0;
    const verschleisskosten = kostenProKg * verbrauch;
    return [
      { label: 'Erwartete Düsen-Lebensdauer', value: lebensdauer, unit: 'kg', digits: 2, primary: true, help: 'Bis spürbare Düsenaufweitung / Qualitätsverlust.' },
      { label: 'Auslastung dieser Düse', value: auslastung, unit: '%', digits: 0, help: 'Über 100 % = Wechsel überfällig.' },
      { label: 'Düsenkosten pro kg', value: kostenProKg, unit: 'EUR/kg', digits: 3 },
      { label: 'Düsenkosten für Auftrag', value: verschleisskosten, unit: 'EUR', digits: 2 },
    ];
  },
  intro:
    'Carbon-, Glasfaser- oder metallgefüllte Filamente wirken wie Schleifpaste und weiten die Düsenbohrung auf – eine Messingdüse kann schon nach wenigen hundert Gramm unbrauchbar sein, während gehärteter Stahl oder Hartmetall ein Vielfaches durchhält. Dieser Rechner schätzt aus Düsenmaterial und Filament-Abrasivität die zu erwartende Lebensdauer in Kilogramm und rechnet daraus die anteiligen Düsenkosten pro Kilo und für deinen Auftrag. So entscheidest du, ob sich die teurere verschleißfeste Düse lohnt.',
  howto: [
    'Düsenmaterial wählen – Messing ist günstig, verschleißt bei Abrasiven aber extrem schnell.',
    'Abrasivität deines Filaments einstufen (CF/GF-gefüllt = stark abrasiv).',
    'Geplanten Filamentverbrauch und den Düsenpreis eintragen.',
    'Lebensdauer und Auslastung prüfen: Bei hoher Auslastung gleich eine verschleißfeste Düse einplanen.',
  ],
  faq: [
    { q: 'Woran erkenne ich eine verschlissene Düse?', a: 'Die Bohrung weitet sich auf: Linienbreiten und Maße stimmen nicht mehr, Überextrusion und schlechte Detailwiedergabe treten auf, oft trotz korrekter Kalibrierung.' },
    { q: 'Warum keine Messingdüse für Carbon?', a: 'Messing ist weich; die harten Fasern schleifen die Spitze in kürzester Zeit auf. Für CF/GF-Filamente sind gehärteter Stahl, Hartmetall oder Ruby Pflicht.' },
    { q: 'Sind die Zahlen exakt?', a: 'Es sind Erfahrungs-Richtwerte. Reale Lebensdauer hängt von Füllgrad, Faserlänge, Düsentemperatur und Durchsatz ab – betrachte die Werte als Größenordnung, nicht als Garantie.' },
    { q: 'Lohnt sich eine teure Hartmetalldüse?', a: 'Bei viel Abrasiv ja: Die Düsenkosten pro Kilogramm fallen deutlich, weil die Lebensdauer um ein Vielfaches steigt. Der Rechner zeigt den Break-even über die Kosten/kg.' },
    { q: 'Gehärteter Stahl auch für normale Filamente?', a: 'Funktioniert, leitet die Wärme aber schlechter als Messing und kann die maximale Druckgeschwindigkeit senken. Für reines PLA/PETG ist Messing meist die bessere Wahl.' },
  ],
  related: ['linienbreite-rechner', 'max-volumenstrom', 'flow-kalibrierung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { duese: 'messing', filament: 'cf', verbrauch: 5, preis: 25 },
      expect: [
        { label: 'Erwartete Düsen-Lebensdauer', value: 0.3, tolerance: 0.001 },
        { label: 'Auslastung dieser Düse', value: 1667, tolerance: 2 },
        { label: 'Düsenkosten pro kg', value: 83.333, tolerance: 0.01 },
      ],
    },
    {
      values: { duese: 'gehaertet', filament: 'cf', verbrauch: 5, preis: 25 },
      expect: [
        { label: 'Erwartete Düsen-Lebensdauer', value: 5, tolerance: 0.01 },
        { label: 'Düsenkosten pro kg', value: 5, tolerance: 0.01 },
      ],
    },
  ],
};
