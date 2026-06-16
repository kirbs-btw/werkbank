import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'verzinkungsflaeche-rechner',
  category: 'metall',
  title: 'Verzinkungs- & Oberflächen-Rechner',
  shortTitle: 'Verzinkungsfläche',
  description: 'Berechne die zu beschichtende Oberfläche eines Blechteils für Verzinken, Eloxieren oder Lackieren samt Zinkauflage aus Schichtdicke und Fläche.',
  keywords: ['verzinkungsfläche berechnen', 'oberfläche blech beschichten', 'eloxalfläche rechner', 'lackierfläche berechnen', 'zinkauflage berechnen', 'feuerverzinken fläche', 'beschichtungsfläche m2', 'pulverbeschichtung fläche'],
  formula: 'A = 2·(b·h) + 2·t·(b+h) ;  Zinkmasse = A · sZink · 7,14 (b,h,t in mm, sZink in µm)',
  inputs: [
    { type: 'number', id: 'breite', label: 'Breite', unit: 'mm', default: 500, min: 0, step: 10 },
    { type: 'number', id: 'hoehe', label: 'Höhe / Länge', unit: 'mm', default: 1000, min: 0, step: 10 },
    { type: 'number', id: 'dicke', label: 'Blechdicke', unit: 'mm', default: 3, min: 0, step: 0.5 },
    { type: 'number', id: 'anzahl', label: 'Stückzahl', unit: 'Stk', default: 1, min: 1, step: 1 },
    { type: 'number', id: 'schicht', label: 'Schichtdicke (Zink)', unit: 'µm', default: 70, min: 0, step: 5, help: 'Feuerverzinken typ. 50–85 µm' },
  ],
  compute: (v) => {
    const b = num(v.breite);
    const h = num(v.hoehe);
    const t = num(v.dicke);
    const stk = num(v.anzahl, 1);
    const sZink = num(v.schicht);
    const flaecheMm2 = 2 * (b * h) + 2 * t * (b + h);
    const flaecheM2Stueck = flaecheMm2 / 1e6;
    const flaecheGesamt = flaecheM2Stueck * stk;
    // Zinkmasse: Fläche [mm²] x Schicht [mm] x Dichte Zink 7,14 g/cm³
    const zinkProStueckG = flaecheMm2 * (sZink / 1000) * 7.14 / 1000;
    const zinkGesamtG = zinkProStueckG * stk;
    return [
      { label: 'Oberfläche je Stück', value: flaecheM2Stueck, unit: 'm²', digits: 4, primary: true },
      { label: 'Oberfläche gesamt', value: flaecheGesamt, unit: 'm²', digits: 4 },
      { label: 'Zinkauflage gesamt', value: zinkGesamtG, unit: 'g', digits: 1 },
    ];
  },
  intro: 'Vor dem Feuerverzinken, Eloxieren, Pulvern oder Lackieren brauchst du die zu beschichtende Oberfläche — Verzinker rechnen meist pro Quadratmeter ab. Dieser Rechner ermittelt für ein rechteckiges Blechteil die Gesamtfläche aus beiden Seiten plus den vier Schmalkanten: A = 2·(b·h) + 2·t·(b+h). Zusätzlich schätzt er die Zinkauflage aus der gewählten Schichtdicke und der Zinkdichte von 7,14 g/cm³, was bei Kalkulation und Materialeinkauf hilft.',
  howto: [
    'Breite und Höhe (bzw. Länge) des Blechteils in mm eintragen.',
    'Blechdicke in mm angeben — sie bestimmt die Fläche der Schmalkanten.',
    'Stückzahl eingeben, um die Gesamtfläche der Charge zu erhalten.',
    'Schichtdicke wählen und Oberfläche sowie Zinkauflage ablesen.',
  ],
  faq: [
    { q: 'Warum zählen beide Seiten und die Kanten?', a: 'Beim Tauchverzinken oder Lackieren wird das gesamte Bauteil benetzt — beide Flachseiten plus die umlaufenden Schmalkanten. Die Kantenfläche ist 2·t·(b+h).' },
    { q: 'Wie dick ist eine Feuerverzinkung?', a: 'Je nach Materialdicke nach DIN EN ISO 1461 meist 45 bis 85 µm. Dickeres Grundmaterial nimmt mehr Zink auf; 70 µm ist ein guter Mittelwert.' },
    { q: 'Stimmt die Zinkdichte mit 7,14 g/cm³?', a: 'Ja, reines Zink hat eine Dichte von rund 7,14 g/cm³. Die Auflage ist eine Schätzung, da beim Feuerverzinken auch Eisen-Zink-Legierungsschichten entstehen.' },
    { q: 'Gilt der Rechner auch fürs Eloxieren?', a: 'Für die Flächenberechnung ja — Eloxal wird ebenfalls pro m² abgerechnet. Die Zinkauflage ist beim Eloxieren irrelevant, da dort eine Oxidschicht statt Zink entsteht.' },
    { q: 'Wie berücksichtige ich Bohrungen und Ausschnitte?', a: 'Kleine Bohrungen werden meist ignoriert. Bei großen Ausschnitten die herausgeschnittene Fläche abziehen und die inneren Schnittkanten je nach Verfahren ergänzen.' },
  ],
  related: ['materialgewicht-blech', 'blech-abwicklung', 'flachstahl-gewicht'],
  updated: '2026-06-16',
  examples: [
    {
      values: { breite: 500, hoehe: 1000, dicke: 3, anzahl: 1, schicht: 70 },
      expect: [{ label: 'Oberfläche je Stück', value: 1.009, tolerance: 0.005 }],
    },
    {
      values: { breite: 1000, hoehe: 2000, dicke: 5, anzahl: 4, schicht: 80 },
      expect: [{ label: 'Oberfläche gesamt', value: 16.12, tolerance: 0.05 }],
    },
  ],
};
