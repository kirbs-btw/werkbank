import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'kreissaege-schnitttiefe-winkel',
  category: 'holz',
  title: 'Kreissäge: effektive Schnitttiefe bei Gehrung',
  shortTitle: 'Schnitttiefe Winkel',
  description:
    'Berechne die reduzierte vertikale Schnitttiefe einer Hand- oder Tauchkreissäge bei geneigtem Sägeblatt (Gehrungsschnitt) – Tiefe × cos(Winkel).',
  keywords: [
    'kreissäge schnitttiefe winkel',
    'schnitttiefe gehrung berechnen',
    'tauchsäge schnitttiefe 45 grad',
    'effektive schnitttiefe kreissäge',
    'handkreissäge schräg schnitttiefe',
    'schnitttiefe bei neigung',
    'kreissäge gehrung tiefe',
  ],
  formula:
    'Effektive Tiefe = eingestellte Schnitttiefe · cos(Neigungswinkel) · Verlust = eingestellte Tiefe − effektive Tiefe',
  inputs: [
    { type: 'number', id: 'tiefe', label: 'Eingestellte Schnitttiefe (bei 0°)', unit: 'mm', default: 60, min: 0, step: 1, help: 'Maximale senkrechte Schnitttiefe der Säge.' },
    { type: 'number', id: 'winkel', label: 'Neigungswinkel des Sägeblatts', unit: '°', default: 45, min: 0, max: 60, step: 1, help: 'Gehrung gegenüber der Senkrechten, 0° = senkrecht.' },
  ],
  compute: (v) => {
    const tiefe = num(v.tiefe);
    const winkel = num(v.winkel);

    const rad = (winkel * Math.PI) / 180;
    const effektiv = tiefe * Math.cos(rad);
    const verlust = tiefe - effektiv;
    const verlustProzent = tiefe > 0 ? (verlust / tiefe) * 100 : 0;

    return [
      { label: 'Effektive senkrechte Schnitttiefe', value: effektiv, unit: 'mm', digits: 1, primary: true },
      { label: 'Tiefenverlust gegenüber 0°', value: verlust, unit: 'mm', digits: 1 },
      { label: 'Verlust in Prozent', value: verlustProzent, unit: '%', digits: 1 },
    ];
  },
  intro:
    'Dieser Rechner zeigt, wie stark die nutzbare Schnitttiefe deiner Hand- oder Tauchkreissäge schrumpft, wenn du das Sägeblatt für einen Gehrungsschnitt neigst. Geometrisch bleibt die Blattlänge im Schnitt gleich, aber die senkrecht ins Werkstück reichende Tiefe sinkt mit dem Kosinus des Neigungswinkels. Wer schräge Schnitte in dickeres Material plant, prüft so vorab, ob die Säge das Material in einem Durchgang noch durchtrennt.',
  howto: [
    'Maximale senkrechte Schnitttiefe der Säge bei 0° aus dem Datenblatt oder von der Skala ablesen.',
    'Geplanten Neigungswinkel des Sägeblatts gegenüber der Senkrechten eintragen (häufig 45°).',
    'Effektive Schnitttiefe ablesen – das ist die maximale Materialdicke, die du in einem Zug schneiden kannst.',
    'Reicht die Tiefe nicht, das Material wenden und von beiden Seiten schneiden oder eine Säge mit mehr Tiefe wählen.',
  ],
  faq: [
    {
      q: 'Warum cos und nicht sin?',
      a: 'Die ins Werkstück reichende senkrechte Tiefe ist die Ankathete zum Neigungswinkel: effektive Tiefe = Blatt-Eintauchtiefe × cos(Winkel). Bei 0° ist cos = 1 (volle Tiefe), bei 45° ist cos ≈ 0,707 (etwa 71 %).',
    },
    {
      q: 'Wie viel verliere ich bei 45°?',
      a: 'Rund 29 %. Aus 60 mm bei 0° werden etwa 42 mm bei 45°. Genau deshalb geben Hersteller getrennte Werte für 0° und 45° an.',
    },
    {
      q: 'Gilt das auch für die Tischkreissäge?',
      a: 'Ja, das Kosinus-Verhältnis gilt für jede Säge mit neigbarem Blatt. Bei der Tischkreissäge meinst du mit Schnitttiefe die Höhe, die das Blatt über den Tisch ragt.',
    },
    {
      q: 'Spielt die Materialbreite eine Rolle?',
      a: 'Für die reine Tiefe nicht. Beachte aber, dass bei Schrägschnitten die Auflage des Sägeschuhs schmaler wird und die Schnittlänge entlang der Schräge größer ist – plane Führungsschiene und Vorschub entsprechend.',
    },
  ],
  related: ['gehrungswinkel-vieleck', 'zuschnitt-laenge'],
  updated: '2026-06-16',
  examples: [
    {
      values: { tiefe: 60, winkel: 45 },
      expect: [
        { label: 'Effektive senkrechte Schnitttiefe', value: 42.4, tolerance: 0.2 },
        { label: 'Tiefenverlust gegenüber 0°', value: 17.6, tolerance: 0.2 },
        { label: 'Verlust in Prozent', value: 29.3, tolerance: 0.3 },
      ],
    },
    {
      values: { tiefe: 60, winkel: 0 },
      expect: [
        { label: 'Effektive senkrechte Schnitttiefe', value: 60, tolerance: 0.01 },
        { label: 'Verlust in Prozent', value: 0, tolerance: 0.01 },
      ],
    },
  ],
};
