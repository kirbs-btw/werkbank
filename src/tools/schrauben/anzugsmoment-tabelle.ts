import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Richtwerte für das Anzugsdrehmoment in Nm (Reibungszahl µ = 0,14,
// Ausnutzung 90 % der Streckgrenze, metrisches Regelgewinde),
// angelehnt an die Drehmomenttabellen nach VDI 2230.
const TABLE: Record<string, { '8.8': number; '10.9': number; '12.9': number }> = {
  M4: { '8.8': 2.8, '10.9': 4.1, '12.9': 4.8 },
  M5: { '8.8': 5.5, '10.9': 8.1, '12.9': 9.5 },
  M6: { '8.8': 9.5, '10.9': 14, '12.9': 16.5 },
  M8: { '8.8': 23, '10.9': 34, '12.9': 40 },
  M10: { '8.8': 46, '10.9': 68, '12.9': 79 },
  M12: { '8.8': 79, '10.9': 117, '12.9': 137 },
  M16: { '8.8': 195, '10.9': 290, '12.9': 340 },
};

export const tool: Tool = {
  slug: 'anzugsmoment-tabelle',
  category: 'schrauben',
  title: 'Anzugsmoment-Tabelle nach Festigkeitsklasse (M4–M16)',
  shortTitle: 'Drehmoment-Tabelle',
  description:
    'Schlage das empfohlene Anzugsdrehmoment für metrische Schrauben M4 bis M16 in den Festigkeitsklassen 8.8, 10.9 und 12.9 nach (µ = 0,14, Regelgewinde).',
  keywords: [
    'anzugsmoment tabelle',
    'drehmoment tabelle schrauben',
    'anzugsdrehmoment 8.8 tabelle',
    'anzugsmoment m8 8.8',
    'drehmoment m10 10.9',
    'nm tabelle festigkeitsklasse',
    'schrauben anzugsmoment richtwert',
  ],
  formula: 'Richtwerte nach VDI 2230 (µ = 0,14, 90 % Rp0,2, Regelgewinde)',
  inputs: [
    {
      type: 'select', id: 'gewinde', label: 'Gewinde', default: 'M8',
      options: [
        { value: 'M4', label: 'M4' },
        { value: 'M5', label: 'M5' },
        { value: 'M6', label: 'M6' },
        { value: 'M8', label: 'M8' },
        { value: 'M10', label: 'M10' },
        { value: 'M12', label: 'M12' },
        { value: 'M16', label: 'M16' },
      ],
    },
    {
      type: 'select', id: 'klasse', label: 'Festigkeitsklasse', default: '8.8',
      options: [
        { value: '8.8', label: '8.8' },
        { value: '10.9', label: '10.9' },
        { value: '12.9', label: '12.9' },
      ],
      help: 'Stahlschrauben nach DIN EN ISO 898-1.',
    },
  ],
  compute: (v) => {
    const key = String(v.gewinde);
    const klasse = String(v.klasse) as '8.8' | '10.9' | '12.9';
    const row = TABLE[key] ?? TABLE.M8;
    const m = row[klasse] ?? row['8.8'];
    return [
      { label: 'Anzugsmoment 8.8', value: row['8.8'], unit: 'Nm', digits: 1 },
      { label: 'Anzugsmoment 10.9', value: row['10.9'], unit: 'Nm', digits: 1 },
      { label: 'Anzugsmoment 12.9', value: row['12.9'], unit: 'Nm', digits: 1 },
      { label: 'Empfohlenes Anzugsmoment', value: m, unit: 'Nm', digits: 1, primary: true },
    ];
  },
  intro:
    'Diese Tabelle gibt das empfohlene Anzugsdrehmoment für metrische Regelgewinde-Schrauben der Festigkeitsklassen 8.8, 10.9 und 12.9 an. Die Richtwerte gelten für eine Gesamtreibungszahl von µ = 0,14 (leicht geölt) und eine Ausnutzung von rund 90 Prozent der Streckgrenze, angelehnt an die Drehmomenttabellen nach VDI 2230. Sie sind der schnellste Weg, eine Schraube mit dem Drehmomentschlüssel korrekt vorzuspannen, ohne selbst zu rechnen.',
  howto: [
    'Gewindegröße der Schraube wählen (M4 bis M16).',
    'Festigkeitsklasse 8.8, 10.9 oder 12.9 einstellen.',
    'Empfohlenes Anzugsmoment am Drehmomentschlüssel einstellen.',
    'Bei stark abweichender Schmierung den Wert anpassen — trocken mehr, geschmiert weniger.',
  ],
  faq: [
    { q: 'Für welche Reibung gelten die Werte?', a: 'Für µ = 0,14, also leicht geölte Stahlschrauben. Bei trockenem Gewinde steigt das nötige Moment um rund 20 Prozent, bei stark geschmierten oder beschichteten Schrauben sinkt es deutlich. Im Zweifel die Herstellerangabe verwenden.' },
    { q: 'Warum unterscheiden sich die Klassen so stark?', a: 'Höhere Festigkeitsklassen haben eine höhere Streckgrenze und dürfen daher stärker vorgespannt werden. 12.9 verträgt bei gleicher Größe etwa 70 Prozent mehr Drehmoment als 8.8.' },
    { q: 'Was wäre das Anzugsmoment für M8 8.8?', a: 'Rund 23 bis 25 Nm. Der genaue Wert hängt von der angesetzten Reibung ab; bei µ = 0,14 liegt er bei etwa 23 Nm, trocken eher bei 25 Nm.' },
    { q: 'Gilt das auch für Feingewinde?', a: 'Nein, die Werte gelten für das Regelgewinde. Feingewinde haben einen größeren Spannungsquerschnitt und einen kleineren Steigungswinkel, daher weicht das Anzugsmoment ab.' },
  ],
  related: ['anzugsmoment', 'max-vorspannkraft', 'metrisches-gewinde-tabelle'],
  updated: '2026-06-16',
  examples: [
    { values: { gewinde: 'M8', klasse: '8.8' }, expect: [{ label: 'Empfohlenes Anzugsmoment', value: 23, tolerance: 0.1 }] },
    { values: { gewinde: 'M10', klasse: '10.9' }, expect: [{ label: 'Empfohlenes Anzugsmoment', value: 68, tolerance: 0.1 }] },
  ],
};
