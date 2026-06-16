import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-air-assist-luftverbrauch',
  category: 'laser',
  title: 'Laser Air-Assist Luftverbrauch Rechner',
  shortTitle: 'Air-Assist',
  description:
    'Schätze Austrittsgeschwindigkeit und Luftverbrauch der Air-Assist-Düse aus Düsendurchmesser und Druck – mit Hinweis auf gesperrte (Schall-)Strömung.',
  keywords: [
    'air assist luftverbrauch',
    'laser düse druck rechner',
    'air assist düsendurchmesser',
    'druckluft verbrauch laser',
    'austrittsgeschwindigkeit düse',
    'air assist einstellen laser',
    'liter pro minute laser luft',
  ],
  formula:
    'v = min(√(2·Δp/ρ); Schallgeschw.);  Q = Düsenfläche × v  (bei Überdruck Schallgrenze ≈ 343 m/s)',
  inputs: [
    { type: 'number', id: 'duese', label: 'Düsendurchmesser', unit: 'mm', default: 1.5, min: 0.1, step: 0.1, help: 'Bohrung der Air-Assist-Düse (oft 0,8-2 mm).' },
    { type: 'number', id: 'druck', label: 'Vordruck', unit: 'bar', default: 1, min: 0.1, step: 0.1, help: 'Überdruck vor der Düse (typisch 0,5-3 bar).' },
  ],
  compute: (v) => {
    const dMm = num(v.duese, 1.5);
    const druckBar = num(v.druck, 1);
    const rho = 1.2; // kg/m³ Luft
    const dPa = druckBar * 1e5;
    const vBernoulli = Math.sqrt((2 * dPa) / rho);
    const vSchall = 343; // m/s, gesperrte Strömung
    const vAustritt = Math.min(vBernoulli, vSchall);
    const rM = dMm / 1000 / 2;
    const flaeche = Math.PI * rM * rM; // m²
    const qM3s = flaeche * vAustritt;
    const qLmin = qM3s * 1000 * 60; // l/min
    return [
      { label: 'Luftverbrauch', value: qLmin, unit: 'l/min', digits: 1, primary: true, help: 'ungefährer Volumenstrom am Düsenaustritt' },
      { label: 'Austrittsgeschwindigkeit', value: vAustritt, unit: 'm/s', digits: 0 },
      { label: 'Düsenquerschnitt', value: flaeche * 1e6, unit: 'mm²', digits: 3 },
    ];
  },
  intro:
    'Der Air-Assist bläst Luft durch eine Düse direkt auf die Schnittstelle. Er drückt Rauch und Schmelze aus der Fuge, kühlt das Material und schützt die Linse vor Schmauch – das verbessert Schnittkante und Geschwindigkeit deutlich. Wie viel Druckluft dabei verbraucht wird, hängt von Düsendurchmesser und Vordruck ab. Dieser Rechner schätzt die Austrittsgeschwindigkeit und den Luftverbrauch in Litern pro Minute. Wichtig: Oberhalb von etwa einem halben bis einem bar Überdruck strömt die Luft mit Schallgeschwindigkeit (gesperrte Strömung), weshalb die Geschwindigkeit hier auf rund 343 m/s begrenzt wird – die Werte sind Näherungen zur Auslegung von Kompressor und Düse.',
  howto: [
    'Düsendurchmesser der Air-Assist-Düse in mm eintragen.',
    'Vordruck vor der Düse in bar angeben.',
    'Luftverbrauch in l/min ablesen und mit der Liefermenge deines Kompressors vergleichen.',
    'Bei zu hohem Verbrauch eine kleinere Düse oder geringeren Druck wählen – beim Gravieren reicht meist wenig Luft.',
  ],
  faq: [
    { q: 'Wofür ist der Air-Assist gut?', a: 'Er entfernt Rauch und geschmolzenes Material aus der Schnittfuge, verhindert Flammenbildung und hält die Linse sauber. Das Ergebnis sind sauberere Kanten, weniger Verbrennungen und oft höhere Schnittgeschwindigkeit.' },
    { q: 'Viel Druck ist immer besser?', a: 'Nein. Beim Schneiden hilft kräftiger Air-Assist, beim Gravieren kann zu viel Luft jedoch Ruß über die Oberfläche verteilen und das Bild verschmieren. Für Gravur reicht meist ein sanfter Luftstrom mit geringem Druck.' },
    { q: 'Warum wird die Geschwindigkeit gedeckelt?', a: 'Strömt Luft aus Überdruck ins Freie, erreicht sie an der engsten Stelle die Schallgeschwindigkeit und kann nicht weiter beschleunigen (gesperrte Strömung). Deshalb begrenzt der Rechner die Austrittsgeschwindigkeit auf etwa 343 m/s.' },
    { q: 'Wie genau ist der Luftverbrauch?', a: 'Es ist eine Näherung aus Düsenfläche und Austrittsgeschwindigkeit ohne Durchflussbeiwert und Kompressibilität. Der reale Verbrauch liegt meist etwas niedriger. Für die Kompressorauswahl mit Reserve ist der Wert dennoch brauchbar.' },
  ],
  related: ['laser-abluft-volumenstrom', 'laser-einstellung-material', 'laser-fokuslage'],
  updated: '2026-06-16',
  examples: [
    { values: { duese: 1.5, druck: 1 }, expect: [{ label: 'Austrittsgeschwindigkeit', value: 343, tolerance: 1 }] },
    { values: { duese: 1.5, druck: 1 }, expect: [{ label: 'Luftverbrauch', value: 36.4, tolerance: 1 }] },
  ],
};
