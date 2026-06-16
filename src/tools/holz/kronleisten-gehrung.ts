import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'kronleisten-gehrung',
  category: 'holz',
  title: 'Kronleisten-Gehrung (Doppelgehrung) berechnen',
  shortTitle: 'Kronleisten-Gehrung',
  description:
    'Berechne Gehrungs- und Neigungswinkel für Kron-/Deckenleisten in Sprungwinkel-Lage – die echte Doppelgehrung an der Kappsäge für jeden Eckwinkel.',
  keywords: [
    'kronleiste gehrung berechnen',
    'deckenleiste gehrungswinkel',
    'doppelgehrung kappsäge',
    'sprungwinkel leiste',
    'crown molding winkel',
    'neigungswinkel kappsäge leiste',
    'zierleiste ecke sägen',
  ],
  formula:
    'Gehrung = atan( sin(Sprungwinkel) / tan(Eckwinkel/2) ) · Neigung = asin( cos(Sprungwinkel) · cos(Eckwinkel/2) )',
  inputs: [
    { type: 'number', id: 'sprungwinkel', label: 'Sprungwinkel der Leiste', unit: '°', default: 38, min: 1, max: 89, step: 1, help: 'Winkel zwischen Leistenrückseite und Wand, oft 38° oder 45°.' },
    { type: 'number', id: 'eckwinkel', label: 'Eckwinkel des Raums', unit: '°', default: 90, min: 30, max: 179, step: 1, help: 'Innenecke meist 90°.' },
  ],
  compute: (v) => {
    const sprung = num(v.sprungwinkel, 38);
    const ecke = num(v.eckwinkel, 90);

    const sp = (sprung * Math.PI) / 180;
    const halbEcke = ((ecke / 2) * Math.PI) / 180;

    const tanHalb = Math.tan(halbEcke);
    const gehrung = tanHalb !== 0 ? (Math.atan(Math.sin(sp) / tanHalb) * 180) / Math.PI : 0;
    const neigung = (Math.asin(Math.cos(sp) * Math.cos(halbEcke)) * 180) / Math.PI;

    return [
      { label: 'Gehrungswinkel (Sägetisch)', value: gehrung, unit: '°', digits: 2, primary: true },
      { label: 'Neigungswinkel (Sägeblatt)', value: neigung, unit: '°', digits: 2 },
      { label: 'Halber Eckwinkel', value: ecke / 2, unit: '°', digits: 1 },
    ];
  },
  intro:
    'Kron- und Deckenleisten sitzen schräg zwischen Wand und Decke (Sprungwinkel). Legt man sie flach auf die Kappsäge, reicht ein einfacher Gehrungsschnitt nicht – es braucht eine Doppelgehrung aus Tischdrehung (Gehrung) und Blattneigung (Bevel). Dieser Rechner liefert beide Winkel exakt für deinen Sprungwinkel und den realen Eckwinkel des Raums. So passen Innen- und Außenecken sauber, ohne stundenlanges Probesägen an Resthölzern.',
  howto: [
    'Sprungwinkel der Leiste bestimmen (oft auf der Verpackung, meist 38° oder 45°).',
    'Eckwinkel des Raums messen – Innenecken selten exakt 90°, lieber nachmessen.',
    'Gehrungswinkel am Drehteller und Neigungswinkel am Sägeblatt einstellen.',
    'Innen- und Außenecke spiegelbildlich schneiden und an Resten kontrollieren.',
  ],
  faq: [
    {
      q: 'Wann brauche ich überhaupt eine Doppelgehrung?',
      a: 'Wenn du die Leiste flach auf den Sägetisch legst. Schneidest du sie aufgestellt „in Position“ gegen einen Anschlag, genügt ein einfacher Gehrungswinkel – dann ist dieser Rechner nicht nötig.',
    },
    {
      q: 'Welche Werte ergeben sich für 38° Sprungwinkel und 90°-Ecke?',
      a: 'Gehrung ≈ 31,62° und Neigung ≈ 33,86°. Das sind die klassischen „US-Crown“-Standardwerte für die häufigste Leistengeometrie.',
    },
    {
      q: 'Was ist der Sprungwinkel?',
      a: 'Der Sprungwinkel (Spring Angle) ist der Winkel zwischen der Leistenrückseite und der Wand, wenn die Leiste montiert ist. Übliche Werte sind 38° und 45°.',
    },
    {
      q: 'Wie behandle ich eine Außenecke?',
      a: 'Die Winkelbeträge bleiben gleich, du drehst Gehrung und Werkstücklage spiegelbildlich. Markiere dir vorab die sichtbare Seite, sonst sägst du leicht falsch herum.',
    },
  ],
  related: ['gehrungswinkel-vieleck', 'kreissaege-schnitttiefe-winkel', 'zuschnitt-laenge'],
  updated: '2026-06-16',
  examples: [
    {
      values: { sprungwinkel: 38, eckwinkel: 90 },
      expect: [
        { label: 'Gehrungswinkel (Sägetisch)', value: 31.62, tolerance: 0.05 },
        { label: 'Neigungswinkel (Sägeblatt)', value: 33.86, tolerance: 0.05 },
      ],
    },
    {
      values: { sprungwinkel: 45, eckwinkel: 90 },
      expect: [
        { label: 'Gehrungswinkel (Sägetisch)', value: 35.26, tolerance: 0.05 },
        { label: 'Neigungswinkel (Sägeblatt)', value: 30, tolerance: 0.05 },
      ],
    },
  ],
};
