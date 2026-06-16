import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'terrassendielen-bedarf',
  category: 'holz',
  title: 'Terrassendielen-Bedarf berechnen',
  shortTitle: 'Terrassendielen',
  description:
    'Berechne Laufmeter, Stückzahl und Dielenreihen für deine Terrasse aus Fläche, Dielenbreite und Fugenabstand – inklusive Verschnittzuschlag.',
  keywords: [
    'terrassendielen berechnen',
    'terrassendielen bedarf',
    'wie viele terrassendielen pro m2',
    'laufmeter terrassendielen',
    'dielen mit fuge berechnen',
    'terrasse holz menge',
    'terrassendielen stückzahl',
  ],
  formula:
    'Reihen = Breite / (Dielenbreite + Fuge) · Laufmeter = Reihen · Länge · Stück = aufrunden(Laufmeter / Dielenlänge) · Verschnitt wird aufgeschlagen',
  inputs: [
    { type: 'number', id: 'breite', label: 'Terrassenbreite (quer zu den Dielen)', unit: 'mm', default: 4000, min: 1, step: 10, help: 'Maß senkrecht zur Dielenlängsrichtung.' },
    { type: 'number', id: 'laenge', label: 'Terrassenlänge (Dielenrichtung)', unit: 'mm', default: 5000, min: 1, step: 10 },
    { type: 'number', id: 'dielenbreite', label: 'Dielenbreite', unit: 'mm', default: 145, min: 1, step: 1 },
    { type: 'number', id: 'fuge', label: 'Fugenabstand', unit: 'mm', default: 5, min: 0, step: 1, help: 'Abstand zwischen zwei Dielen für Quellen/Schwinden.' },
    { type: 'number', id: 'dielenlaenge', label: 'Lieferlänge der Diele', unit: 'mm', default: 4000, min: 1, step: 10 },
    { type: 'number', id: 'verschnitt', label: 'Verschnittzuschlag', unit: '%', default: 10, min: 0, step: 1 },
  ],
  compute: (v) => {
    const breite = num(v.breite);
    const laenge = num(v.laenge);
    const dielenbreite = num(v.dielenbreite, 1);
    const fuge = num(v.fuge);
    const dielenlaenge = num(v.dielenlaenge, 1);
    const verschnitt = num(v.verschnitt);

    const teilung = dielenbreite + fuge;
    const reihen = teilung > 0 ? Math.ceil(breite / teilung) : 0;
    const laufmeterNetto = (reihen * laenge) / 1000;
    const laufmeter = laufmeterNetto * (1 + verschnitt / 100);
    const stueck = dielenlaenge > 0 ? Math.ceil((laufmeter * 1000) / dielenlaenge) : 0;
    const flaeche = (breite * laenge) / 1_000_000;

    return [
      { label: 'Anzahl Dielenreihen', value: reihen, unit: 'Reihen', digits: 0 },
      { label: 'Laufmeter inkl. Verschnitt', value: laufmeter, unit: 'm', digits: 1, primary: true },
      { label: 'Benötigte Dielen', value: stueck, unit: 'Stück', digits: 0 },
      { label: 'Terrassenfläche', value: flaeche, unit: 'm²', digits: 2 },
    ];
  },
  intro:
    'Dieser Rechner ermittelt, wie viele Terrassendielen du für eine rechteckige Fläche brauchst. Entscheidend ist nicht nur die reine Quadratmeterzahl, sondern die Teilung aus Dielenbreite plus Fugenabstand: Erst daraus ergibt sich die Anzahl der Reihen quer zur Verlegerichtung und damit die tatsächlichen Laufmeter. Aus den Laufmetern und der gelieferten Dielenlänge folgt die Stückzahl, ergänzt um einen Verschnittzuschlag für Zuschnitte und Ausschuss.',
  howto: [
    'Terrassenbreite quer zur Dielenrichtung und die Länge in Dielenrichtung messen (in mm).',
    'Dielenbreite und gewünschten Fugenabstand (meist 4–8 mm bei Holz) eintragen.',
    'Lieferlänge der Dielen und einen Verschnittzuschlag von 5–10 % angeben.',
    'Ergebnis liefert Reihenanzahl, Laufmeter inkl. Verschnitt und die zu bestellende Dielenzahl.',
  ],
  faq: [
    {
      q: 'Warum muss ich die Fuge mitrechnen?',
      a: 'Holzdielen brauchen einen Abstand, um beim Quellen und Schwinden Platz zu haben. Die Fuge zählt zur belegten Breite mit, reduziert also die Reihenzahl gegenüber einer fugenlosen Rechnung leicht. Bei 145 mm Diele und 5 mm Fuge belegt jede Reihe effektiv 150 mm.',
    },
    {
      q: 'Welcher Verschnittzuschlag ist sinnvoll?',
      a: 'Bei rechteckigen Flächen mit zur Dielenlänge passenden Lieferlängen reichen 5 %. Bei diagonaler Verlegung, vielen Aussparungen oder ungünstigen Längenverhältnissen plane 10–15 % ein.',
    },
    {
      q: 'Gilt die Rechnung auch für WPC-Dielen?',
      a: 'Ja. WPC und Bambus haben oft schmalere Fugen (3–6 mm) und feste Längen. Trage einfach die Herstellerangaben zu Breite, Fuge und Lieferlänge ein.',
    },
    {
      q: 'Wie hängt das mit der Unterkonstruktion zusammen?',
      a: 'Die Dielen laufen rechtwinklig zu den Unterkonstruktionslatten. Die Lattenanzahl richtet sich nach der Terrassenlänge und dem zulässigen Auflagerabstand der Diele, nicht nach der Dielenzahl selbst.',
    },
  ],
  related: ['schrauben-terrassendielen', 'unterkonstruktion-abstand', 'bodenbelag-paketrechner'],
  updated: '2026-06-16',
  examples: [
    {
      values: { breite: 4000, laenge: 5000, dielenbreite: 145, fuge: 5, dielenlaenge: 4000, verschnitt: 10 },
      expect: [
        { label: 'Anzahl Dielenreihen', value: 27, tolerance: 0 },
        { label: 'Laufmeter inkl. Verschnitt', value: 148.5, tolerance: 0.2 },
        { label: 'Benötigte Dielen', value: 38, tolerance: 0 },
        { label: 'Terrassenfläche', value: 20, tolerance: 0.01 },
      ],
    },
  ],
};
