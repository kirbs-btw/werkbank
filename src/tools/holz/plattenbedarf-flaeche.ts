import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'plattenbedarf-flaeche',
  category: 'holz',
  title: 'Plattenbedarf für Fläche berechnen',
  shortTitle: 'Plattenbedarf',
  description:
    'Wie viele Holzplatten (OSB, Spanplatte, Sperrholz, MDF) brauchst du für eine Fläche? Inklusive Verschnitt, Restfläche und überdeckter Gesamtfläche.',
  keywords: [
    'plattenbedarf berechnen',
    'osb platten anzahl',
    'spanplatten flaeche rechner',
    'sperrholz bedarf',
    'wie viele platten für fläche',
    'plattenanzahl verschnitt',
    'mdf platten berechnen',
  ],
  formula:
    'Plattenfläche = Plattenbreite · Plattenlänge · Platten = aufrunden(Fläche · (1 + Verschnitt/100) / Plattenfläche)',
  inputs: [
    { type: 'number', id: 'flaeche', label: 'Zu deckende Fläche', unit: 'm²', default: 24, min: 0, step: 0.1 },
    { type: 'number', id: 'breite', label: 'Plattenbreite', unit: 'm', default: 1.25, min: 0.01, step: 0.01, help: 'Standardplatten oft 1,25 m breit.' },
    { type: 'number', id: 'laenge', label: 'Plattenlänge', unit: 'm', default: 2.5, min: 0.01, step: 0.01, help: 'z. B. 2,5 m (OSB) oder 2,8 m.' },
    { type: 'number', id: 'verschnitt', label: 'Verschnitt-Zuschlag', unit: '%', default: 10, min: 0, max: 50, step: 1 },
  ],
  compute: (v) => {
    const flaeche = num(v.flaeche);
    const breite = num(v.breite, 1.25);
    const laenge = num(v.laenge, 2.5);
    const verschnitt = num(v.verschnitt);

    const plattenflaeche = breite * laenge;
    const benoetigt = plattenflaeche > 0 ? (flaeche * (1 + verschnitt / 100)) / plattenflaeche : 0;
    const anzahl = Math.ceil(benoetigt);
    const gedeckt = anzahl * plattenflaeche;
    const rest = gedeckt - flaeche;

    return [
      { label: 'Benötigte Platten', value: anzahl, unit: 'Stück', digits: 0, primary: true },
      { label: 'Fläche je Platte', value: plattenflaeche, unit: 'm²', digits: 3 },
      { label: 'Gesamte Plattenfläche', value: gedeckt, unit: 'm²', digits: 2 },
      { label: 'Überschuss / Restfläche', value: rest, unit: 'm²', digits: 2 },
    ];
  },
  intro:
    'Ob Unterboden, Dachschalung, Trockenbauwand oder Möbelkorpus – dieser Rechner sagt dir, wie viele Holzwerkstoffplatten du für eine bestimmte Fläche brauchst. Du gibst die zu deckende Fläche, das Plattenformat (z. B. 1,25 × 2,50 m) und einen Verschnitt-Zuschlag für Anpassungen und Reste ein. Das Ergebnis wird auf ganze Platten aufgerundet und zeigt zugleich, wie viel Restfläche übrig bleibt, damit du nicht zu knapp bestellst.',
  howto: [
    'Die zu beplankende oder zu beplattende Fläche in Quadratmeter eintragen.',
    'Plattenformat des gewählten Werkstoffs (Breite × Länge) angeben.',
    'Verschnitt-Zuschlag wählen – bei vielen Zuschnitten und Ecken eher 10–15 %.',
    'Aufgerundete Plattenzahl bestellen; die Restfläche dient als Reserve.',
  ],
  faq: [
    {
      q: 'Welcher Verschnitt ist sinnvoll?',
      a: 'Bei großen, einfachen Flächen reichen 5–8 %. Bei vielen Ausschnitten, Schrägen oder kleinteiligen Bereichen plane 10–15 % ein, weil mehr Reststücke unbrauchbar werden.',
    },
    {
      q: 'Welche Plattenformate sind üblich?',
      a: 'OSB häufig 2500 × 1250 mm, Spanplatten 2800 × 2070 mm, Sperrholz oft 2500 × 1250 mm oder 1525 × 1525 mm. Trage immer das reale Format deiner Platten ein.',
    },
    {
      q: 'Berücksichtigt der Rechner Plattenstöße?',
      a: 'Indirekt über den Verschnitt-Zuschlag. Bei verklebten oder genuteten Platten ohne Fugenmaß ist die effektive Deckfläche minimal kleiner – der Zuschlag fängt das ab.',
    },
    {
      q: 'Kann ich auch Wandflächen rechnen?',
      a: 'Ja, die Berechnung gilt für jede ebene Fläche. Ziehe größere Öffnungen (Türen, Fenster) vorher von der Fläche ab, kleine Aussparungen deckt der Verschnitt mit ab.',
    },
  ],
  related: ['bretter-pro-quadratmeter', 'leimholz-bretter', 'bodenbelag-paketrechner'],
  updated: '2026-06-16',
  examples: [
    {
      values: { flaeche: 24, breite: 1.25, laenge: 2.5, verschnitt: 10 },
      expect: [
        { label: 'Benötigte Platten', value: 9, tolerance: 0 },
        { label: 'Fläche je Platte', value: 3.125, tolerance: 0.001 },
      ],
    },
    {
      values: { flaeche: 30, breite: 1.25, laenge: 2.5, verschnitt: 0 },
      expect: [{ label: 'Benötigte Platten', value: 10, tolerance: 0 }],
    },
  ],
};
