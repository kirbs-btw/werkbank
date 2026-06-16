import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'kerf-kompensation',
  category: 'laser',
  title: 'Kerf-Kompensation Rechner (Laserschneiden)',
  shortTitle: 'Kerf-Kompensation',
  description:
    'Berechne das korrekte Konturmaß beim Laserschneiden: Innenmaße werden um Kerf/2, Außenmaße um Kerf/2 versetzt, damit Teile maßgenau passen.',
  keywords: [
    'kerf kompensation laser',
    'kerf ausgleich berechnen',
    'schnittfugenbreite laser',
    'kerf offset rechner',
    'laser passgenau schneiden',
    'fugenbreite ausgleich laser',
    'kerf maßkorrektur',
  ],
  formula:
    'Außenkontur: Sollmaß − Kerf;  Innenkontur (Loch): Sollmaß + Kerf;  Offset pro Seite = Kerf / 2',
  inputs: [
    { type: 'number', id: 'sollmass', label: 'Sollmaß (gewünschtes Endmaß)', unit: 'mm', default: 50, min: 0, step: 0.1, help: 'Das Maß, das das fertige Teil bzw. die Öffnung haben soll.' },
    { type: 'number', id: 'kerf', label: 'Kerf (Schnittfugenbreite)', unit: 'mm', default: 0.2, min: 0, step: 0.01, help: 'Materialverlust durch den Laserstrahl, oft 0,1-0,3 mm. Vorher an einem Testschnitt ermitteln.' },
    {
      type: 'select', id: 'kontur', label: 'Konturtyp', default: 'aussen',
      options: [
        { value: 'aussen', label: 'Außenkontur (Teilumriss)' },
        { value: 'innen', label: 'Innenkontur (Loch/Ausschnitt)' },
      ],
      help: 'Außenkontur wird kleiner gezeichnet, Innenkontur größer.',
    },
  ],
  compute: (v) => {
    const soll = num(v.sollmass);
    const kerf = num(v.kerf);
    const innen = String(v.kontur) === 'innen';
    const offsetSeite = kerf / 2;
    const kontur = innen ? soll + kerf : soll - kerf;
    return [
      { label: 'Konturmaß (CAD-Zeichnung)', value: kontur, unit: 'mm', digits: 3, primary: true, help: innen ? 'Loch größer zeichnen' : 'Umriss kleiner zeichnen' },
      { label: 'Offset pro Seite', value: offsetSeite, unit: 'mm', digits: 3 },
      { label: 'Maßabweichung gesamt', value: kerf, unit: 'mm', digits: 3 },
    ];
  },
  intro:
    'Der Laserstrahl trägt beim Schneiden eine schmale Schnittfuge ab, den sogenannten Kerf. Schneidet man exakt auf der Konturlinie, fällt ein Außenteil um eine halbe Fugenbreite zu klein und ein Loch um eine halbe Fugenbreite zu groß aus. Dieser Rechner liefert das korrigierte Konturmaß für die CAD-Zeichnung, damit Steckverbindungen und Passungen tatsächlich klemmen.',
  howto: [
    'Sollmaß eintragen: das Endmaß, das das Teil oder die Öffnung später haben soll.',
    'Kerf eintragen: Schnittfugenbreite des Lasers für dieses Material (zuvor an einem Probeschnitt messen).',
    'Konturtyp wählen: Außenkontur (Teilumriss) oder Innenkontur (Loch/Ausschnitt).',
    'Konturmaß übernehmen und im CAD genau auf dieses Maß zeichnen bzw. einen Offset von Kerf/2 anwenden.',
  ],
  faq: [
    { q: 'Was ist der Kerf beim Laserschneiden?', a: 'Der Kerf ist die Breite der Schnittfuge, die der Laserstrahl beim Trennen abträgt. Sie hängt von Strahlfokus, Leistung, Material und Dicke ab und liegt typisch zwischen 0,1 und 0,3 mm.' },
    { q: 'Wie ermittle ich den Kerf für mein Material?', a: 'Schneide ein Quadrat mit bekanntem Sollmaß und miss das fertige Außenteil mit dem Messschieber. Die Differenz zwischen Soll- und Istmaß ist der gesamte Kerf, also der Wert für dieses Feld.' },
    { q: 'Warum wird ein Loch größer und ein Teil kleiner gezeichnet?', a: 'Der Strahl fräst an beiden Schnittseiten je eine halbe Fugenbreite weg. Beim Außenteil verschwindet Material vom Teil (es wird kleiner), beim Loch verschwindet Material vom Rand (es wird größer). Deshalb gleicht man genau gegenläufig aus.' },
    { q: 'Welchen Kerf hat der Laser auf der Innen- und Außenseite?', a: 'Pro Schnittseite wirkt Kerf/2. Für eine Passung von Zapfen und Loch addiert sich der Effekt: Wer beide Maße um Kerf/2 korrigiert, erreicht eine spielfreie Steckverbindung.' },
  ],
  related: ['laser-schnittzeit', 'laser-einstellung-material', 'laser-fokuslage'],
  updated: '2026-06-16',
  examples: [
    { values: { sollmass: 50, kerf: 0.2, kontur: 'aussen' }, expect: [{ label: 'Konturmaß (CAD-Zeichnung)', value: 49.8, tolerance: 0.001 }] },
    { values: { sollmass: 10, kerf: 0.15, kontur: 'innen' }, expect: [{ label: 'Konturmaß (CAD-Zeichnung)', value: 10.15, tolerance: 0.001 }] },
  ],
};
