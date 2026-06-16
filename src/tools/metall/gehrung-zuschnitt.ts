import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'gehrung-zuschnitt',
  category: 'metall',
  title: 'Gehrungsschnitt-Rechner (Profilrahmen)',
  shortTitle: 'Gehrung',
  description: 'Berechne Gehrungswinkel und Schnittflächenlänge für Profilrahmen aus Eckwinkel und Profilbreite zum sauberen Zuschnitt von Rohr und Flachprofil.',
  keywords: ['gehrungswinkel berechnen', 'gehrungsschnitt rechner', 'profilrahmen gehrung', 'eckverbindung rahmen winkel', 'gehrung 45 grad', 'schnittlänge gehrung', 'rahmen zuschnitt metall', 'gehrungssäge winkel'],
  formula: 'Gehrungswinkel = (180° − Eckwinkel)/2 ;  Schnittflächenlänge = Breite / sin(Eckwinkel/2)',
  inputs: [
    { type: 'number', id: 'eckwinkel', label: 'Rahmen-Eckwinkel (innen)', unit: '°', default: 90, min: 1, max: 179, step: 1, help: 'Innenwinkel der Ecke, z. B. 90° beim Rechteckrahmen' },
    { type: 'number', id: 'breite', label: 'Profilbreite (Schnittseite)', unit: 'mm', default: 40, min: 0, step: 1, help: 'Breite der zu durchtrennenden Profilseite' },
    { type: 'number', id: 'aussenmass', label: 'Rahmen-Außenmaß einer Seite', unit: 'mm', default: 1000, min: 0, step: 1, help: 'Optional: Außenlänge für Innenmaß-Hinweis' },
  ],
  compute: (v) => {
    const ecke = num(v.eckwinkel, 90);
    const breite = num(v.breite);
    const aussen = num(v.aussenmass);
    const halb = ecke / 2;
    const gehrungswinkel = (180 - ecke) / 2; // Winkel gegenüber dem rechtwinkligen Schnitt
    const sinHalb = Math.sin((halb * Math.PI) / 180);
    const schnittlaenge = sinHalb > 0 ? breite / sinHalb : 0;
    // Innenmaß einer Seite (zwei Gehrungen): Außenmaß minus 2x Versatz je Ecke.
    // Versatz = breite / tan(halber Eckwinkel); bei 90° ist tan(45°)=1 -> Versatz = breite.
    const tanHalb = Math.tan((halb * Math.PI) / 180);
    const versatz = tanHalb !== 0 ? breite / tanHalb : 0;
    const innenmass = aussen - 2 * versatz;
    return [
      { label: 'Gehrungswinkel (ab Anschlag)', value: gehrungswinkel, unit: '°', digits: 2, primary: true },
      { label: 'Sägewinkel pro Stück', value: halb, unit: '°', digits: 2 },
      { label: 'Schnittflächenlänge', value: schnittlaenge, unit: 'mm', digits: 2 },
      { label: 'Innenmaß der Seite', value: innenmass, unit: 'mm', digits: 1 },
    ];
  },
  intro: 'Damit zwei Profile an einer Rahmenecke bündig zusammenstoßen, muss jedes Teil auf den halben Eckwinkel gesägt werden — bei einer rechtwinkligen Ecke also auf 45°. Dieser Rechner liefert aus dem gewünschten Eckwinkel den Sägewinkel pro Stück, den an der Gehrungssäge meist von der 90°-Stellung gemessenen Anschlagwinkel sowie die Länge der schrägen Schnittfläche über die Profilbreite. So gelingen Bilderrahmen, Tür- und Maschinenrahmen aus Rohr oder Flachprofil ohne Spalt.',
  howto: [
    'Gewünschten Innen-Eckwinkel des Rahmens eintragen — 90° für ein Rechteck.',
    'Breite der Profilseite angeben, die durchtrennt wird.',
    'Optional das Außenmaß einer Rahmenseite eingeben, um das Innenmaß abzuschätzen.',
    'Sägewinkel einstellen und die Schnittflächenlänge zur Kontrolle nutzen.',
  ],
  faq: [
    { q: 'Warum 45° bei einer rechtwinkligen Ecke?', a: 'Die beiden Teile teilen sich den 90°-Eckwinkel hälftig. Jedes Profil wird daher auf 45° gesägt, sodass die Schnittflächen flächig aufeinandertreffen.' },
    { q: 'Was bedeutet der Winkel ab Anschlag?', a: 'Viele Kapp- und Gehrungssägen messen den Schwenkwinkel ab der 90°-Stellung. Bei 45°-Gehrung steht die Säge also auf 45° ab Anschlag — der Rechner gibt diesen Wert als Gehrungswinkel aus.' },
    { q: 'Wie berechnet sich die Schnittflächenlänge?', a: 'Die schräge Schnittfläche ist länger als die Profilbreite: Länge = Breite / sin(halber Eckwinkel). Bei 40 mm Breite und 90°-Ecke ergibt das rund 56,6 mm.' },
    { q: 'Gilt das auch für andere Winkel als 90°?', a: 'Ja. Für ein Sechseck (Innenwinkel 120°) sägst du auf 60°, für ein Achteck (135°) auf 67,5°. Der Sägewinkel ist immer der halbe Eckwinkel.' },
    { q: 'Stimmt das Innenmaß genau?', a: 'Es ist ein Anhaltswert auf Basis von Außenmaß minus zweimal dem Versatz durch die Gehrung. Bei rechtwinkligen Rahmen ist der Versatz je Ecke gleich der Profilbreite; bei spitzeren oder stumpferen Winkeln ändert er sich.' },
  ],
  related: ['rechteckrohr-gewicht', 'quadratrohr-gewicht', 'blech-abwicklung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { eckwinkel: 90, breite: 40, aussenmass: 1000 },
      expect: [{ label: 'Schnittflächenlänge', value: 56.57, tolerance: 0.05 }],
    },
    {
      values: { eckwinkel: 120, breite: 30, aussenmass: 500 },
      expect: [{ label: 'Sägewinkel pro Stück', value: 60, tolerance: 0.01 }],
    },
  ],
};
