import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Senkkopfschrauben mit 90°-Senkung (DIN 7991 / ISO 10642).
// dk = theoretischer Kopfdurchmesser (scharfkantig),
// durchgang = empfohlenes Durchgangsloch (Reihe mittel, DIN EN 20273).
const TABLE: Record<string, { dk: number; durchgang: number }> = {
  M3: { dk: 6.0, durchgang: 3.4 },
  M4: { dk: 8.0, durchgang: 4.5 },
  M5: { dk: 10.0, durchgang: 5.5 },
  M6: { dk: 12.0, durchgang: 6.6 },
  M8: { dk: 16.0, durchgang: 9.0 },
  M10: { dk: 20.0, durchgang: 11.0 },
  M12: { dk: 24.0, durchgang: 13.5 },
};

export const tool: Tool = {
  slug: 'senkungsdurchmesser',
  category: 'schrauben',
  title: 'Senkungsdurchmesser für Senkkopfschrauben (90°)',
  shortTitle: 'Senkung',
  description:
    'Berechne Senkungsdurchmesser und Senktiefe für Senkkopfschrauben mit 90°-Kopf (DIN 7991) — damit der Schraubenkopf bündig versenkt sitzt.',
  keywords: [
    'senkung berechnen',
    'senkungsdurchmesser tabelle',
    'senkkopf versenken 90 grad',
    'senktiefe senkkopfschraube',
    'din 7991 senkung',
    'kegelsenker durchmesser',
    'senkbohrer m6',
  ],
  formula: 'Senkdurchmesser ≈ dk + 0,4 mm · Senktiefe t = (D − dDurchgang) / 2  (90°-Senkung)',
  inputs: [
    {
      type: 'select', id: 'gewinde', label: 'Gewinde', default: 'M6',
      options: [
        { value: 'M3', label: 'M3' },
        { value: 'M4', label: 'M4' },
        { value: 'M5', label: 'M5' },
        { value: 'M6', label: 'M6' },
        { value: 'M8', label: 'M8' },
        { value: 'M10', label: 'M10' },
        { value: 'M12', label: 'M12' },
      ],
      help: 'Senkkopf mit 90°-Kopfwinkel (DIN 7991 / ISO 10642).',
    },
  ],
  compute: (v) => {
    const key = String(v.gewinde);
    const row = TABLE[key] ?? TABLE.M6;
    const senk = row.dk + 0.4; // kleiner Zuschlag, damit der Kopf bündig verschwindet
    const tiefe = (senk - row.durchgang) / 2; // 90°-Senkung: je Seite 45°
    return [
      { label: 'Kopfdurchmesser dk', value: row.dk, unit: 'mm', digits: 1 },
      { label: 'Senkungsdurchmesser', value: senk, unit: 'mm', digits: 1, primary: true },
      { label: 'Durchgangsloch', value: row.durchgang, unit: 'mm', digits: 1 },
      { label: 'Senktiefe t', value: tiefe, unit: 'mm', digits: 2 },
    ];
  },
  intro:
    'Damit eine Senkkopfschraube bündig oder versenkt im Bauteil sitzt, muss eine 90°-Senkung passend zum Kopfdurchmesser gebohrt werden. Dieser Rechner liefert für DIN-7991-Senkkopfschrauben den Kopfdurchmesser dk, den empfohlenen Senkungsdurchmesser an der Oberfläche sowie die Senktiefe, die sich bei 90° aus der halben Differenz von Senkungs- und Durchgangsloch ergibt. So findet man die richtige Einstellung für Kegelsenker oder den Tiefenanschlag.',
  howto: [
    'Gewindegröße der Senkkopfschraube wählen.',
    'Durchgangsloch zuerst bohren (angezeigter Wert).',
    'Mit einem 90°-Kegelsenker auf den Senkungsdurchmesser senken.',
    'Senktiefe als Kontrolle nutzen; bei bündigem Sitz sollte der Kopf gerade verschwinden.',
  ],
  faq: [
    { q: 'Warum 90 Grad?', a: 'Metrische Senkkopfschrauben nach DIN 7991 und ISO 10642 haben einen Kopfwinkel von 90 Grad. Der Kegelsenker muss denselben Winkel haben, sonst trägt der Kopf nicht flächig und die Verbindung sitzt schief.' },
    { q: 'Wie kommt die Senktiefe zustande?', a: 'Bei 90 Grad steht jede Kegelflanke unter 45 Grad. Damit ist die Tiefe gleich dem Radiusunterschied zwischen Senkung und Durchgangsloch, also (Senkdurchmesser − Durchgangsloch) / 2.' },
    { q: 'Warum etwas mehr als der Kopfdurchmesser?', a: 'Ein kleiner Zuschlag von etwa 0,4 mm stellt sicher, dass der Kopf vollständig in der Senkung verschwindet und die Kante nicht übersteht, auch bei Maßtoleranzen der Schraube.' },
    { q: 'Gilt das auch für Holzschrauben mit Senkkopf?', a: 'Holzschrauben-Senkköpfe haben oft andere Winkel und Kopfdurchmesser. Hier gelten die Werte für metrische Maschinen-Senkkopfschrauben nach DIN 7991; für Holzschrauben besser die Herstellerangabe nutzen.' },
  ],
  related: ['durchgangsloch', 'metrisches-gewinde-tabelle', 'schluesselweite'],
  updated: '2026-06-16',
  examples: [
    { values: { gewinde: 'M6' }, expect: [{ label: 'Senkungsdurchmesser', value: 12.4, tolerance: 0.05 }, { label: 'Senktiefe t', value: 2.9, tolerance: 0.05 }] },
    { values: { gewinde: 'M8' }, expect: [{ label: 'Senkungsdurchmesser', value: 16.4, tolerance: 0.05 }] },
  ],
};
