import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Regelsteigung je Nenndurchmesser (DIN 13-1) als Vergleichswert.
const REGEL: Record<string, number> = {
  '8': 1.25,
  '10': 1.5,
  '12': 1.75,
  '16': 2.0,
  '20': 2.5,
};

export const tool: Tool = {
  slug: 'feingewinde-steigung',
  category: 'schrauben',
  title: 'Feingewinde-Steigung wählen (DIN 13)',
  shortTitle: 'Feingewinde',
  description:
    'Wähle die passende Feingewinde-Steigung für M8 bis M20, vergleiche sie mit dem Regelgewinde und sieh den größeren Spannungsquerschnitt des Feingewindes.',
  keywords: [
    'feingewinde steigung tabelle',
    'feingewinde auswahl',
    'm10x1 steigung',
    'feingewinde din 13',
    'regelgewinde feingewinde unterschied',
    'feingewinde spannungsquerschnitt',
    'welche feingewinde steigung',
  ],
  formula: 'As = π/4 · (d − 0,9382 · P)²  mit Feingewinde-Steigung P',
  inputs: [
    {
      type: 'select', id: 'd', label: 'Nenndurchmesser', default: '10',
      options: [
        { value: '8', label: 'M8' },
        { value: '10', label: 'M10' },
        { value: '12', label: 'M12' },
        { value: '16', label: 'M16' },
        { value: '20', label: 'M20' },
      ],
    },
    {
      type: 'select', id: 'p', label: 'Feingewinde-Steigung P', default: '1.0',
      options: [
        { value: '0.75', label: '0,75 mm' },
        { value: '1.0', label: '1,0 mm' },
        { value: '1.25', label: '1,25 mm' },
        { value: '1.5', label: '1,5 mm' },
        { value: '2.0', label: '2,0 mm' },
      ],
      help: 'Typische DIN-13-Feinsteigungen; nicht jede Kombination ist genormt.',
    },
  ],
  compute: (v) => {
    const d = num(v.d);
    const P = num(v.p);
    const regel = REGEL[String(v.d)] ?? 1.5;
    const ds = d - 0.9382 * P;
    const as = (Math.PI / 4) * ds * ds;
    return [
      { label: 'Regelsteigung (Vergleich)', value: regel, unit: 'mm', digits: 2 },
      { label: 'Gewählte Feinsteigung', value: P, unit: 'mm', digits: 2 },
      { label: 'Spannungsquerschnitt As', value: as, unit: 'mm²', digits: 1, primary: true },
    ];
  },
  intro:
    'Feingewinde haben bei gleichem Nenndurchmesser eine kleinere Steigung als das Regelgewinde, dadurch einen größeren Kern- und Spannungsquerschnitt und einen geringeren Steigungswinkel. Das macht sie selbsthemmender gegen Lösen und höher belastbar, erfordert aber sauberere Toleranzen. Der Rechner zeigt für M8 bis M20 die Regelsteigung als Vergleich und den Spannungsquerschnitt der gewählten Feinsteigung, sodass man Vor- und Nachteile direkt abwägen kann.',
  howto: [
    'Nenndurchmesser der Schraube wählen.',
    'Gewünschte Feingewinde-Steigung auswählen (z. B. 1,0 mm für M10×1).',
    'Regelsteigung als Vergleich und den Spannungsquerschnitt ablesen.',
    'Feiner = mehr Tragquerschnitt und Selbsthemmung, gröber = robuster gegen Beschädigung.',
  ],
  faq: [
    { q: 'Warum hat ein Feingewinde mehr Tragfähigkeit?', a: 'Bei kleinerer Steigung wird weniger Material aus dem Kern geschnitten, der Kerndurchmesser und damit der Spannungsquerschnitt steigen. Eine M10×1 hat einen größeren As als die M10-Regelgewinde mit 1,5 mm Steigung.' },
    { q: 'Wann nimmt man Feingewinde?', a: 'Bei dünnwandigen Bauteilen, für feinfühlige Einstellungen, bei Verbindungen mit hoher Vorspannung und überall dort, wo Selbsthemmung gegen Vibrationslösen gefragt ist, etwa an Hydraulik- und Maschinenteilen.' },
    { q: 'Welche Feinsteigungen gibt es für M10?', a: 'Nach DIN 13 sind für M10 die Feinsteigungen 1,25 mm, 1,0 mm und 0,75 mm genormt, gegenüber der Regelsteigung von 1,5 mm. Am gängigsten ist M10×1.' },
    { q: 'Sind Feingewinde anfälliger?', a: 'Ja, die flacheren und kleineren Gewindegänge sind empfindlicher gegen Beschädigung, Verschmutzung und Überdrehen. In rauer Umgebung oder bei häufigem Lösen ist das Regelgewinde robuster.' },
  ],
  related: ['spannungsquerschnitt', 'metrisches-gewinde-tabelle', 'kernlochbohrer'],
  updated: '2026-06-16',
  examples: [
    { values: { d: '10', p: '1.0' }, expect: [{ label: 'Spannungsquerschnitt As', value: 64.5, tolerance: 0.5 }] },
    { values: { d: '12', p: '1.5' }, expect: [{ label: 'Spannungsquerschnitt As', value: 88.1, tolerance: 0.5 }] },
  ],
};
