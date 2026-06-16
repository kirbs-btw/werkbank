import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'lochkreis-teilung',
  category: 'metall',
  title: 'Lochkreis-Teilungs-Rechner',
  shortTitle: 'Lochkreis',
  description: 'Berechne Teilungswinkel und Sehnenabstand der Bohrungen auf einem Lochkreis sowie die Koordinaten zum Anreißen und Bohren von Flanschen und Platten.',
  keywords: ['lochkreis berechnen', 'teilungswinkel bohrungen', 'sehnenabstand lochkreis', 'lochkreis koordinaten rechner', 'bohrbild flansch', 'lochkreisdurchmesser teilung', 'bohrungen kreisförmig anordnen', 'lochabstand kreis'],
  formula: 'Winkel = 360°/n ;  Sehne s = D · sin(180°/n) ;  Koordinaten x = (D/2)·cos φ, y = (D/2)·sin φ',
  inputs: [
    { type: 'number', id: 'durchmesser', label: 'Lochkreisdurchmesser', unit: 'mm', default: 100, min: 0, step: 1, help: 'Durchmesser, auf dem die Bohrungsmitten liegen' },
    { type: 'number', id: 'anzahl', label: 'Anzahl Bohrungen', unit: 'Stk', default: 6, min: 1, step: 1 },
    { type: 'number', id: 'startwinkel', label: 'Startwinkel der 1. Bohrung', unit: '°', default: 0, min: 0, max: 360, step: 1, help: 'Lagewinkel des ersten Lochs' },
  ],
  compute: (v) => {
    const D = num(v.durchmesser);
    const n = Math.max(1, Math.round(num(v.anzahl, 1)));
    const start = num(v.startwinkel);
    const teilungswinkel = 360 / n;
    const sehne = D * Math.sin((Math.PI / n));
    const r = D / 2;
    const rad = (start * Math.PI) / 180;
    const x1 = r * Math.cos(rad);
    const y1 = r * Math.sin(rad);
    return [
      { label: 'Teilungswinkel', value: teilungswinkel, unit: '°', digits: 3, primary: true },
      { label: 'Sehnenabstand benachbart', value: sehne, unit: 'mm', digits: 2 },
      { label: 'X 1. Bohrung', value: x1, unit: 'mm', digits: 2 },
      { label: 'Y 1. Bohrung', value: y1, unit: 'mm', digits: 2 },
    ];
  },
  intro: 'Beim Bohren von Flanschen, Lochkreisen und Teilkreisen müssen die Bohrungen gleichmäßig auf einem Kreis verteilt werden. Der Teilungswinkel ist 360° geteilt durch die Bohrungszahl, der direkte Abstand zweier Nachbarbohrungen ist die Sehne s = D·sin(180°/n). Zusätzlich liefert der Rechner die X/Y-Koordinaten der ersten Bohrung relativ zum Kreismittelpunkt — praktisch zum Anreißen, für die CNC-Programmierung oder zur Kontrolle eines gekauften Flansches.',
  howto: [
    'Lochkreisdurchmesser D (Mittenkreis der Bohrungen) in mm eintragen.',
    'Anzahl der gleichmäßig verteilten Bohrungen angeben.',
    'Optional einen Startwinkel für die erste Bohrung setzen.',
    'Teilungswinkel, Sehnenabstand und Koordinaten ablesen und übertragen.',
  ],
  faq: [
    { q: 'Was ist der Teilungswinkel?', a: 'Der Winkel zwischen zwei benachbarten Bohrungen vom Mittelpunkt aus gesehen. Bei 6 Bohrungen sind das 60°, bei 8 Bohrungen 45°.' },
    { q: 'Wofür brauche ich den Sehnenabstand?', a: 'Die Sehne ist der direkte, geradlinige Abstand der Mitten zweier Nachbarbohrungen. Damit lässt sich das Bohrbild ohne Winkelmesser nur mit dem Messschieber kontrollieren.' },
    { q: 'Wie sind die Koordinaten orientiert?', a: 'Bezogen auf den Kreismittelpunkt: x in Richtung 0° (waagerecht rechts), y nach oben. Mit dem Teilungswinkel addiert man sich von Bohrung zu Bohrung weiter.' },
    { q: 'Stimmt der Sehnenabstand mit D·sin(180°/n)?', a: 'Ja. Die zwei Radien zur Sehne schließen den Teilungswinkel ein; über die halbe Sehne folgt s = 2·r·sin(180°/n) = D·sin(180°/n).' },
    { q: 'Wie genau muss ich beim Anreißen sein?', a: 'Für verschraubte Flansche sollte die Lage der Bohrungen im Zehntelmillimeter stimmen, damit die Schrauben spannungsfrei sitzen. Bei CNC-Bohrungen sind die Koordinaten direkt programmierbar.' },
  ],
  related: ['blech-abwicklung', 'drehzahl-stahlbohren', 'materialgewicht-blech'],
  updated: '2026-06-16',
  examples: [
    {
      values: { durchmesser: 100, anzahl: 6, startwinkel: 0 },
      expect: [{ label: 'Sehnenabstand benachbart', value: 50, tolerance: 0.1 }],
    },
    {
      values: { durchmesser: 120, anzahl: 4, startwinkel: 0 },
      expect: [{ label: 'Teilungswinkel', value: 90, tolerance: 0.01 }],
    },
  ],
};
