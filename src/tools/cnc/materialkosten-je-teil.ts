import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'materialkosten-je-teil',
  category: 'cnc',
  title: 'Materialkosten je Teil (Rohling) Rechner',
  shortTitle: 'Materialkosten je Teil',
  description:
    'Berechne die Materialkosten pro Werkstück aus Rohlingsmaßen, Werkstoffdichte und Materialpreis je kg – inklusive Verschnittzuschlag.',
  keywords: [
    'materialkosten je teil berechnen',
    'rohling kosten cnc',
    'werkstoff kosten pro stück',
    'materialpreis kg gewicht teil',
    'verschnitt zuschlag material',
    'kalkulation materialkosten fräsen',
    'rohteil gewicht kosten',
  ],
  formula: 'V = l·b·h;  m = V·ρ/1000;  Kosten = m · Preis · (1 + Verschnitt/100)  (€)',
  inputs: [
    { type: 'number', id: 'l', label: 'Rohlingslänge l', unit: 'mm', default: 100, min: 0, step: 1 },
    { type: 'number', id: 'b', label: 'Rohlingsbreite b', unit: 'mm', default: 60, min: 0, step: 1 },
    { type: 'number', id: 'h', label: 'Rohlingshöhe h', unit: 'mm', default: 20, min: 0, step: 1 },
    {
      type: 'select',
      id: 'mat',
      label: 'Werkstoff (Dichte)',
      default: '7.85',
      options: [
        { value: '7.85', label: 'Stahl (7,85 g/cm³)' },
        { value: '7.9', label: 'Edelstahl V2A (7,90 g/cm³)' },
        { value: '2.70', label: 'Aluminium (2,70 g/cm³)' },
        { value: '8.9', label: 'Messing/Kupfer (8,90 g/cm³)' },
        { value: '1.42', label: 'POM/Kunststoff (1,42 g/cm³)' },
      ],
    },
    { type: 'number', id: 'preis', label: 'Materialpreis', unit: '€/kg', default: 3, min: 0, step: 0.1, help: 'Einkaufspreis des Werkstoffs je Kilogramm.' },
    { type: 'number', id: 'verschnitt', label: 'Verschnittzuschlag', unit: '%', default: 15, min: 0, step: 1, help: 'Sägeschnitt, Aufmaß, Reststücke.' },
  ],
  compute: (v) => {
    const l = num(v.l);
    const b = num(v.b);
    const h = num(v.h);
    const rho = num(v.mat, 7.85);
    const preis = num(v.preis);
    const verschnitt = num(v.verschnitt);
    const volCm3 = (l * b * h) / 1000; // mm³ -> cm³
    const masseKg = (volCm3 * rho) / 1000; // g -> kg
    const kosten = masseKg * preis * (1 + verschnitt / 100);
    return [
      { label: 'Materialkosten je Teil', value: kosten, unit: '€', digits: 2, primary: true },
      { label: 'Rohteilgewicht', value: masseKg, unit: 'kg', digits: 3 },
      { label: 'Rohteilvolumen', value: volCm3, unit: 'cm³', digits: 1 },
    ];
  },
  intro:
    'Die Materialkosten je Teil sind ein zentraler Posten der Stückkalkulation, gerade bei teuren Werkstoffen wie Edelstahl, Messing oder Titan. Aus den Rohlingsmaßen ergibt sich das Volumen, über die Dichte das Gewicht und mit dem kg-Preis der Materialwert. Da beim Ablängen und Aufspannen immer Verschnitt anfällt (Sägeschnitt, Bearbeitungsaufmaß, Reststücke), berücksichtigt der Rechner einen prozentualen Zuschlag. So entspricht der Wert dem real eingekauften Material, nicht nur dem fertigen Teil.',
  howto: [
    'Maße des Rohlings (Länge, Breite, Höhe) in mm eintragen – nicht die Fertigmaße, sondern den Zuschnitt.',
    'Werkstoff mit passender Dichte auswählen.',
    'Materialpreis je Kilogramm aus der Einkaufsliste eingeben.',
    'Verschnittzuschlag in Prozent ergänzen und Materialkosten je Teil ablesen.',
  ],
  faq: [
    {
      q: 'Soll ich Rohmaß oder Fertigmaß eingeben?',
      a: 'Das Rohmaß (Zuschnitt). Du kaufst und bezahlst den Rohling, nicht das fertig gefräste Teil. Das abgespante Material ist Span – allenfalls als Schrotterlös teilweise rückvergütet.',
    },
    {
      q: 'Wie hoch ist ein realistischer Verschnittzuschlag?',
      a: 'Bei aus Stangen abgesägten Teilen oft 10–20 %, bei Plattenmaterial mit Schachtelung weniger, bei aufwändig geschachtelten Konturen mehr. Sägeschnittbreite und Spannaufmaß bestimmen den Wert.',
    },
    {
      q: 'Welche Dichte hat mein Werkstoff?',
      a: 'Stahl ≈ 7,85 g/cm³, Edelstahl ≈ 7,9, Aluminium ≈ 2,70, Messing ≈ 8,5, Kupfer ≈ 8,9, viele Kunststoffe 1,0–1,4 g/cm³. Bei Legierungen das Datenblatt prüfen.',
    },
    {
      q: 'Sind Bearbeitungskosten enthalten?',
      a: 'Nein, hier geht es nur um das Material. Maschinenstundensatz, Rüst- und Bearbeitungszeit kommen separat hinzu – dafür nutzt du die Zeit-Rechner und multiplizierst mit dem Stundensatz.',
    },
  ],
  related: ['eilgangzeit', 'bohrzeit', 'planfraeszeit'],
  updated: '2026-06-16',
  examples: [
    {
      values: { l: 100, b: 60, h: 20, mat: '7.85', preis: 3, verschnitt: 15 },
      expect: [
        { label: 'Materialkosten je Teil', value: 3.25, tolerance: 0.02 },
        { label: 'Rohteilgewicht', value: 0.942, tolerance: 0.002 },
      ],
    },
    {
      values: { l: 50, b: 50, h: 50, mat: '2.70', preis: 5, verschnitt: 0 },
      expect: [{ label: 'Materialkosten je Teil', value: 1.69, tolerance: 0.02 }],
    },
  ],
};
