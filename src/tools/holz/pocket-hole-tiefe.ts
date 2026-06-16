import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'pocket-hole-tiefe',
  category: 'holz',
  title: 'Pocket-Hole / Taschenbohrung berechnen',
  shortTitle: 'Pocket-Hole',
  description:
    'Berechne für die Taschenbohrung (Pocket Hole) die Bohrtiefe am Anschlag und die passende Schraubenlänge je Materialstärke – ohne Durchbruch.',
  keywords: [
    'pocket hole rechner',
    'taschenbohrung tiefe',
    'pocket hole schraubenlänge',
    'kreg bohrtiefe einstellen',
    'taschenloch schraube material',
    'pockethole materialstärke',
    'schräge bohrung schraube',
  ],
  formula:
    'Bohrtiefe-Anschlag ≈ Materialstärke + 50 mm · empfohlene Schraube = Materialstärke + min(Materialstärke; 25 mm), gerundet auf 5 mm',
  inputs: [
    { type: 'number', id: 'staerke', label: 'Materialstärke', unit: 'mm', default: 19, min: 6, max: 60, step: 0.5, help: 'Dicke des Bauteils mit der Tasche.' },
    {
      type: 'select',
      id: 'winkel',
      label: 'Bohrwinkel der Lehre',
      default: '15',
      help: 'Pocket-Hole-Lehren bohren meist unter etwa 15°.',
      options: [
        { value: '15', label: 'Standard ≈ 15°' },
        { value: '12', label: 'Flacher ≈ 12°' },
      ],
    },
  ],
  compute: (v) => {
    const staerke = num(v.staerke, 19);
    const winkel = num(v.winkel, 15);

    const bohrtiefe = staerke + 50;
    const rohSchraube = staerke + Math.min(staerke, 25);
    const schraube = Math.max(20, Math.round(rohSchraube / 5) * 5);
    const einbindung = schraube - staerke;

    return [
      { label: 'Empfohlene Schraubenlänge', value: schraube, unit: 'mm', digits: 0, primary: true },
      { label: 'Bohrtiefe am Anschlag', value: bohrtiefe, unit: 'mm', digits: 0 },
      { label: 'Einbindung ins Gegenstück', value: einbindung, unit: 'mm', digits: 0 },
      { label: 'Bohrwinkel', value: winkel, unit: '°', digits: 0 },
    ];
  },
  intro:
    'Die Taschenbohrung (Pocket Hole) ist eine schnelle, schraubenbasierte Holzverbindung: Eine Lehre führt den Bohrer unter flachem Winkel ins Werkstück, sodass die Schraube schräg ins angrenzende Bauteil läuft. Damit die Schraube weder durchbricht noch zu wenig greift, müssen Bohrtiefe und Schraubenlänge zur Materialstärke passen. Dieser Rechner liefert beide Werte aus der eingegebenen Materialstärke: eine sichere Einbindung ins Gegenstück, ohne die Sichtseite zu durchbohren. Die Schraubenlänge ist auf gängige 5-mm-Stufen gerundet.',
  howto: [
    'Materialstärke des Bauteils mit der Tasche in Millimeter eintragen.',
    'Bohrwinkel der verwendeten Lehre wählen (meist etwa 15°).',
    'Bohrtiefe am Tiefenanschlag des Bohrers einstellen (Stellring).',
    'Empfohlene Schraubenlänge wählen und die Verbindung verschrauben.',
  ],
  faq: [
    {
      q: 'Wie verhindere ich, dass die Schraube durchbricht?',
      a: 'Die Schraube darf höchstens so weit ins Gegenstück reichen wie dessen Materialstärke. Der Rechner begrenzt die Einbindung daher auf maximal 25 mm und rundet auf eine sichere Standardlänge.',
    },
    {
      q: 'Warum schräg bohren statt gerade?',
      a: 'Der flache Winkel von rund 15° lässt die Schraube tief und stabil ins angrenzende Bauteil greifen, während Kopf und Tasche unauffällig auf der Innen- oder Rückseite verschwinden.',
    },
    {
      q: 'Welche Schraubenart soll ich nehmen?',
      a: 'Spezielle Pocket-Hole-Schrauben mit selbstbohrender Spitze und flachem Kopf, der sich in den Taschengrund setzt. Für Hartholz Feingewinde, für Weichholz und Spanplatte Grobgewinde.',
    },
    {
      q: 'Gilt das auch für dünne Platten?',
      a: 'Unter etwa 12 mm wird es eng: Die Tasche braucht eine Mindesttiefe. Sehr dünne Werkstoffe sind für Pocket Holes ungeeignet, hier sind Dübel oder Lamellos besser.',
    },
  ],
  related: ['duebelabstand', 'schrauben-terrassendielen', 'leimholz-bretter'],
  updated: '2026-06-16',
  examples: [
    {
      values: { staerke: 19, winkel: '15' },
      expect: [
        { label: 'Empfohlene Schraubenlänge', value: 40, tolerance: 0 },
        { label: 'Bohrtiefe am Anschlag', value: 69, tolerance: 0 },
      ],
    },
    {
      values: { staerke: 38, winkel: '15' },
      expect: [
        { label: 'Empfohlene Schraubenlänge', value: 65, tolerance: 0 },
        { label: 'Einbindung ins Gegenstück', value: 27, tolerance: 0 },
      ],
    },
  ],
};
