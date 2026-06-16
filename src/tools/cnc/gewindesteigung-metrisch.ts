import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Regelgewinde-Steigungen nach DIN 13-1 (mm)
const STEIGUNG: Record<string, number> = {
  '3': 0.5,
  '4': 0.7,
  '5': 0.8,
  '6': 1.0,
  '8': 1.25,
  '10': 1.5,
  '12': 1.75,
  '14': 2.0,
  '16': 2.0,
  '18': 2.5,
  '20': 2.5,
};

export const tool: Tool = {
  slug: 'gewindesteigung-metrisch',
  category: 'cnc',
  title: 'Metrische Gewindesteigung & Kernloch (M3–M20)',
  shortTitle: 'Gewindesteigung',
  description:
    'Steigung, Kernlochdurchmesser und Flankendurchmesser für metrische Regelgewinde M3 bis M20 nach DIN 13. Kernloch = d − P, Flankendurchmesser exakt.',
  keywords: [
    'gewindesteigung metrisch tabelle',
    'kernloch bohrer durchmesser',
    'm6 steigung kernloch',
    'metrisches regelgewinde tabelle',
    'gewinde kernlochdurchmesser berechnen',
    'flankendurchmesser metrisch',
    'kerndurchmesser gewinde',
  ],
  formula: 'Kernloch ≈ d − P;  Flankendurchmesser d2 = d − 0,6495 · P',
  inputs: [
    {
      type: 'select',
      id: 'gewinde',
      label: 'Gewindegröße (Regelgewinde)',
      default: '6',
      options: [
        { value: '3', label: 'M3' },
        { value: '4', label: 'M4' },
        { value: '5', label: 'M5' },
        { value: '6', label: 'M6' },
        { value: '8', label: 'M8' },
        { value: '10', label: 'M10' },
        { value: '12', label: 'M12' },
        { value: '14', label: 'M14' },
        { value: '16', label: 'M16' },
        { value: '18', label: 'M18' },
        { value: '20', label: 'M20' },
      ],
    },
  ],
  compute: (v) => {
    const key = String(v.gewinde);
    const d = num(key, 6);
    const p = STEIGUNG[key] ?? 1.0;
    const kernloch = d - p;
    // Flankendurchmesser d2 = d - 0.6495 * P (ISO-Spitzgewinde 60°)
    const d2 = d - 0.6495 * p;
    // Kerndurchmesser des Bolzens d3 = d - 1.2269 * P
    const d3 = d - 1.2269 * p;
    return [
      { label: 'Empfohlener Kernlochbohrer', value: kernloch, unit: 'mm', digits: 2, primary: true },
      { label: 'Steigung P', value: p, unit: 'mm', digits: 2 },
      { label: 'Flankendurchmesser d2', value: d2, unit: 'mm', digits: 3 },
      { label: 'Kerndurchmesser Bolzen d3', value: d3, unit: 'mm', digits: 3 },
    ];
  },
  intro:
    'Diese Tabelle liefert für metrische ISO-Regelgewinde M3 bis M20 die genormte Steigung P nach DIN 13 sowie die wichtigsten Durchmesser. Der empfohlene Kernlochbohrer entspricht näherungsweise dem Nenndurchmesser minus der Steigung (d − P), der Flankendurchmesser d2 = d − 0,6495 · P beschreibt das eigentliche Tragprofil. Wer ein Gewinde von Hand oder per CNC schneidet, findet hier sofort den richtigen Bohrer und die Steigung für die Gewindezyklen.',
  howto: [
    'Gewindegröße aus der Liste wählen (z. B. M6 für ein Regelgewinde mit 6 mm Nenndurchmesser).',
    'Empfohlenen Kernlochbohrer ablesen – das ist der Durchmesser für die Vorbohrung.',
    'Steigung P für die CNC-Gewindezyklen oder die Wahl des Gewindebohrers übernehmen.',
    'Bei Bedarf Flanken- und Kerndurchmesser für Toleranz- und Traganteilbetrachtungen nutzen.',
  ],
  faq: [
    {
      q: 'Warum Kernloch = Nenndurchmesser minus Steigung?',
      a: 'Diese Faustformel d − P trifft den genormten Kernlochdurchmesser für rund 100 % Traganteil sehr gut. Beispiel M6: 6 − 1,0 = 5,0 mm, M8: 8 − 1,25 = 6,75 ≈ 6,8 mm. Für leichteres Schneiden wählt man oft 60-75 % Traganteil und etwas größer.',
    },
    {
      q: 'Was ist Regelgewinde gegenüber Feingewinde?',
      a: 'Regelgewinde ist die Standardsteigung nach DIN 13-1 (z. B. M8 mit P = 1,25 mm). Feingewinde hat eine kleinere Steigung (M8×1 oder M8×0,75) und damit größere Kernlöcher und feinere Verstellung. Dieser Rechner nutzt die Regelsteigungen.',
    },
    {
      q: 'Wofür der Flankendurchmesser d2?',
      a: 'Der Flankendurchmesser ist das Maß, an dem die tragenden Flanken anliegen, und das eigentliche Passmaß eines Gewindes. d2 = d − 0,6495 · P. Er wird mit Gewindemessdraht oder -lehre geprüft und ist für die Gewindetoleranz (z. B. 6g/6H) maßgeblich.',
    },
    {
      q: 'Kann ich diese Werte fürs CNC-Gewindefräsen nutzen?',
      a: 'Ja. Die Steigung P steuert den Vorschub pro Umdrehung im Gewindezyklus, und das Kernloch ist der Ausgangsbohrungsdurchmesser. Beim Gewindefräsen wird häufig sogar exakt das Kernlochmaß vorgebohrt und das Profil dann mit dem Gewindefräser erzeugt.',
    },
  ],
  related: ['gewindebohren-drehzahl', 'vorschub-umrechnung', 'spitzenzuschlag-bohren'],
  updated: '2026-06-16',
  examples: [
    {
      values: { gewinde: '6' },
      expect: [
        { label: 'Empfohlener Kernlochbohrer', value: 5.0, tolerance: 0.01 },
        { label: 'Steigung P', value: 1.0, tolerance: 0.01 },
      ],
    },
    {
      values: { gewinde: '8' },
      expect: [
        { label: 'Empfohlener Kernlochbohrer', value: 6.75, tolerance: 0.01 },
        { label: 'Flankendurchmesser d2', value: 7.188, tolerance: 0.01 },
      ],
    },
  ],
};
