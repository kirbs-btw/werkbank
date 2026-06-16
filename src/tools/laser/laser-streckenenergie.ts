import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-streckenenergie',
  category: 'laser',
  title: 'Laser-Streckenenergie Rechner (J/mm)',
  shortTitle: 'Streckenenergie',
  description:
    'Berechne die Streckenenergie eines Laserschnitts (J/mm) aus Leistung und Geschwindigkeit – die Kennzahl, um Einstellungen sauber zu übertragen.',
  keywords: [
    'streckenenergie laser berechnen',
    'j/mm laserschneiden',
    'linienenergie laser',
    'leistung geschwindigkeit energie',
    'laser parameter übertragen',
    'energieeintrag pro mm',
    'cut energy density laser',
  ],
  formula:
    'Streckenenergie = Leistung / Geschwindigkeit (W / (mm/s) = J/mm);  bei n Durchgängen geteilt durch n je Durchgang',
  inputs: [
    { type: 'number', id: 'leistung', label: 'Laserleistung', unit: 'W', default: 60, min: 0.1, step: 1, help: 'Tatsächliche Schnittleistung (z. B. % der Maxleistung).' },
    { type: 'number', id: 'speed', label: 'Schnittgeschwindigkeit', unit: 'mm/s', default: 15, min: 0.1, step: 0.5, help: 'Vorschub entlang der Schnittlinie.' },
    { type: 'number', id: 'durchgaenge', label: 'Anzahl Durchgänge', default: 1, min: 1, step: 1, help: 'Mehrfach abgefahrene Schnittpässe addieren sich beim Energieeintrag.' },
  ],
  compute: (v) => {
    const p = num(v.leistung);
    const speed = num(v.speed, 1);
    const n = num(v.durchgaenge, 1);
    const proDurchgang = speed > 0 ? p / speed : 0; // J/mm
    const gesamt = proDurchgang * n;
    const speedMmMin = speed * 60;
    return [
      { label: 'Streckenenergie pro Durchgang', value: proDurchgang, unit: 'J/mm', digits: 2, primary: true, help: 'Energieeintrag je mm Schnittweg' },
      { label: 'Gesamt-Streckenenergie', value: gesamt, unit: 'J/mm', digits: 2, help: 'über alle Durchgänge' },
      { label: 'Geschwindigkeit', value: speedMmMin, unit: 'mm/min', digits: 0 },
    ];
  },
  intro:
    'Die Streckenenergie beschreibt, wie viel Energie pro Millimeter Schnittweg ins Material eingebracht wird. Sie ergibt sich einfach aus der Laserleistung geteilt durch die Geschwindigkeit und hat die Einheit Joule pro Millimeter. Diese Kennzahl ist äußerst praktisch, weil sie zwei Parameter zu einer Größe zusammenfasst: Wer Leistung und Geschwindigkeit gleichsinnig ändert, hält den Energieeintrag konstant. So lassen sich Einstellungen zwischen Materialien oder Maschinen leichter übertragen und nachvollziehbar dokumentieren. Mehrere Durchgänge addieren den Energieeintrag entsprechend.',
  howto: [
    'Tatsächliche Schnittleistung in Watt eintragen (Prozentwert mal Maxleistung).',
    'Schnittgeschwindigkeit entlang der Linie in mm/s angeben.',
    'Anzahl der Durchgänge eintragen, falls mehrfach geschnitten wird.',
    'Streckenenergie ablesen und als Referenz für ähnliche Materialien oder andere Maschinen nutzen.',
  ],
  faq: [
    { q: 'Wozu ist die Streckenenergie nützlich?', a: 'Sie fasst Leistung und Geschwindigkeit zu einer einzigen Größe zusammen. Ein bewährter Energieeintrag von z. B. 4 J/mm lässt sich auf einer stärkeren Maschine bei höherer Geschwindigkeit reproduzieren – einfach Leistung und Speed im gleichen Verhältnis erhöhen.' },
    { q: 'Ist mehr Streckenenergie immer besser?', a: 'Nein. Zu viel Energie pro mm verbrennt die Kanten, erzeugt breite Fugen und Verfärbungen. Zu wenig schneidet nicht durch. Es gibt für jedes Material ein Fenster, das man über die Streckenenergie gezielt einstellt.' },
    { q: 'Warum zählt die reale Leistung, nicht der Prozentwert?', a: 'Die Formel braucht Watt. Steht die Leistung in Prozent, rechne sie mit der Nennleistung der Quelle um, da z. B. 50 % an einer 40-W- und einer 100-W-Maschine sehr unterschiedliche Energieeinträge bedeuten.' },
    { q: 'Wie wirken mehrere Durchgänge?', a: 'Jeder Durchgang bringt erneut die gleiche Streckenenergie ein, der Gesamtwert ist also das n-Fache. Mehrere schnelle Durchgänge mit geringer Einzelenergie hinterlassen oft sauberere Kanten als ein langsamer Durchgang mit hoher Energie.' },
  ],
  related: ['laser-leistungsdichte', 'laser-einstellung-material', 'laser-schnittzeit'],
  updated: '2026-06-16',
  examples: [
    { values: { leistung: 60, speed: 15, durchgaenge: 1 }, expect: [{ label: 'Streckenenergie pro Durchgang', value: 4, tolerance: 0.01 }] },
    { values: { leistung: 60, speed: 15, durchgaenge: 3 }, expect: [{ label: 'Gesamt-Streckenenergie', value: 12, tolerance: 0.01 }] },
  ],
};
