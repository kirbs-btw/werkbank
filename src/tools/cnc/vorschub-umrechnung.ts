import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'vorschub-umrechnung',
  category: 'cnc',
  title: 'Vorschub umrechnen: mm/min ↔ mm/U ↔ mm/Zahn',
  shortTitle: 'Vorschub-Umrechnung',
  description:
    'Rechne den Vorschub zwischen mm/min, mm/Umdrehung und mm/Zahn um – aus Drehzahl und Zähnezahl. vf = n · f = n · z · fz für Fräser und Bohrer.',
  keywords: [
    'vorschub umrechnen mm/min mm/u',
    'vorschub pro zahn berechnen',
    'fz berechnen fräsen',
    'vf in mm pro umdrehung',
    'zahnvorschub rechner',
    'vorschubgeschwindigkeit umrechnen',
    'mm/min in mm/u',
  ],
  formula: 'vf = n · z · fz = n · f  (mm/min);  f = z · fz (mm/U)',
  inputs: [
    { type: 'number', id: 'fz', label: 'Vorschub pro Zahn fz', unit: 'mm/Zahn', default: 0.05, min: 0, step: 0.005, help: 'Zahnvorschub aus den Schnittdaten.' },
    { type: 'number', id: 'z', label: 'Zähnezahl z', unit: '', default: 4, min: 1, step: 1, help: 'Schneidenzahl des Fräsers (Bohrer = 2, Drehmeißel = 1).' },
    { type: 'number', id: 'n', label: 'Drehzahl n', unit: '1/min', default: 3000, min: 1, step: 10 },
  ],
  compute: (v) => {
    const fz = num(v.fz);
    const z = num(v.z, 1);
    const n = num(v.n);
    const f = z * fz;
    const vf = n * f;
    return [
      { label: 'Vorschubgeschwindigkeit vf', value: vf, unit: 'mm/min', digits: 0, primary: true },
      { label: 'Vorschub pro Umdrehung f', value: f, unit: 'mm/U', digits: 3 },
      { label: 'Vorschub pro Zahn fz', value: fz, unit: 'mm/Zahn', digits: 4 },
    ];
  },
  intro:
    'Schnittdaten geben den Vorschub je nach Quelle in drei Einheiten an: als Vorschubgeschwindigkeit vf (mm/min, das was die Steuerung im G-Code braucht), als Vorschub pro Umdrehung f (mm/U) oder als Zahnvorschub fz (mm/Zahn). Dieser Rechner verbindet alle drei über vf = n · z · fz, sodass du aus den Hersteller-Tabellenwerten direkt den richtigen F-Wert für deine Drehzahl und Zähnezahl bekommst. Das vermeidet teure Fehlinterpretationen der Einheiten.',
  howto: [
    'Vorschub pro Zahn fz aus der Schnittdaten-Tabelle des Werkzeugs eintragen.',
    'Zähnezahl z des Fräsers eingeben (Bohrer hat 2 Schneiden).',
    'Drehzahl n in 1/min eintragen.',
    'Vorschubgeschwindigkeit vf für den G-Code sowie f und fz zur Kontrolle ablesen.',
  ],
  faq: [
    {
      q: 'Welche Größe brauche ich für den G-Code?',
      a: 'In den meisten Steuerungen (G94) wird der Vorschub als vf in mm/min programmiert. fz und f sind die Tabellengrößen aus den Schnittdaten, aus denen sich vf für deine konkrete Drehzahl und Zähnezahl ergibt.',
    },
    {
      q: 'Warum ist der Zahnvorschub fz so wichtig?',
      a: 'fz bestimmt die Spanungsdicke jeder einzelnen Schneide und damit Standzeit, Oberfläche und Schnittkräfte. Ein zu kleiner fz lässt die Schneide reiben statt schneiden (Verschleiß), ein zu großer überlastet sie. Darum geben Hersteller fz an, nicht vf.',
    },
    {
      q: 'Wie rechne ich von vf zurück auf fz?',
      a: 'Stelle die Formel um: fz = vf / (n · z). So prüfst du, ob ein vorhandener vf-Wert zu einem sinnvollen Zahnvorschub für dein Werkzeug passt.',
    },
    {
      q: 'Gilt das auch fürs Drehen?',
      a: 'Beim Drehen mit einem einschneidigen Meißel ist z = 1, damit sind f und fz identisch und vf = n · f. Beim Fräsen mit mehreren Schneiden multipliziert die Zähnezahl den Vorschub pro Umdrehung.',
    },
  ],
  related: ['drehzahl-vorschub', 'vorschub-drehen', 'planfraeszeit'],
  updated: '2026-06-16',
  examples: [
    {
      values: { fz: 0.05, z: 4, n: 3000 },
      expect: [
        { label: 'Vorschubgeschwindigkeit vf', value: 600, tolerance: 0.5 },
        { label: 'Vorschub pro Umdrehung f', value: 0.2, tolerance: 0.001 },
      ],
    },
    {
      values: { fz: 0.1, z: 2, n: 1000 },
      expect: [{ label: 'Vorschubgeschwindigkeit vf', value: 200, tolerance: 0.5 }],
    },
  ],
};
