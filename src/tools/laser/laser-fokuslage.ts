import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-fokuslage',
  category: 'laser',
  title: 'Laser-Fokuslage Rechner (Schneiden & Gravieren)',
  shortTitle: 'Fokuslage',
  description:
    'Bestimme die optimale Fokushöhe beim Laserschneiden: Fokus auf der Oberfläche zum Gravieren, ins Material versenkt (ca. 1/3 Dicke) beim dicken Schnitt.',
  keywords: [
    'laser fokus einstellen',
    'fokuslage laserschneiden',
    'fokushöhe berechnen laser',
    'laser fokus material dicke',
    'brennweite laser fokus',
    'laser z höhe einstellen',
  ],
  formula:
    'Gravieren: Fokus = Oberfläche (0);  dicker Schnitt: Fokus = −Dicke × Anteil (z. B. 1/3) unter die Oberfläche',
  inputs: [
    { type: 'number', id: 'dicke', label: 'Materialdicke', unit: 'mm', default: 6, min: 0.1, step: 0.1, help: 'Stärke des Werkstücks.' },
    {
      type: 'select', id: 'modus', label: 'Aufgabe', default: 'schnitt',
      options: [
        { value: 'gravur', label: 'Gravieren (Fokus auf Oberfläche)' },
        { value: 'schnitt', label: 'Schneiden (Fokus ins Material)' },
      ],
      help: 'Beim Gravieren liegt der Fokus auf der Oberfläche, beim Schneiden etwas darunter.',
    },
    { type: 'number', id: 'anteil', label: 'Fokus-Tiefenanteil', unit: '%', default: 33, min: 0, max: 100, step: 1, help: 'Wie tief der Fokus relativ zur Dicke unter die Oberfläche wandert (Schneiden), oft 30-50 %.' },
  ],
  compute: (v) => {
    const dicke = num(v.dicke);
    const modus = String(v.modus);
    const anteil = num(v.anteil);
    const tiefe = modus === 'gravur' ? 0 : dicke * (anteil / 100);
    const zVerstellung = -tiefe; // gegenüber Oberflächenfokus nach unten
    return [
      { label: 'Fokus unter Oberfläche', value: tiefe, unit: 'mm', digits: 2, primary: true, help: 'Tiefe des Fokuspunkts unter der Werkstückoberfläche' },
      { label: 'Z-Verstellung ggü. Oberflächenfokus', value: zVerstellung, unit: 'mm', digits: 2 },
    ];
  },
  intro:
    'Die Fokuslage ist die Höhe, in der der Laserstrahl seinen kleinsten Durchmesser und damit die höchste Energiedichte hat. Beim Gravieren legt man den Fokus genau auf die Oberfläche, um eine scharfe, schmale Linie zu erhalten. Beim Schneiden dickerer Materialien verschiebt man ihn dagegen etwas ins Material hinein – häufig auf etwa ein Drittel der Dicke –, damit die Schnittfuge über die gesamte Stärke gleichmäßig und möglichst senkrecht bleibt. Dieser Rechner gibt die passende Fokustiefe und die nötige Z-Verstellung an.',
  howto: [
    'Materialdicke in mm eintragen.',
    'Aufgabe wählen: Gravieren (Fokus auf Oberfläche) oder Schneiden (Fokus ins Material).',
    'Beim Schneiden den Tiefenanteil festlegen (Standard 33 %, bei sehr dickem Material bis ca. 50 %).',
    'Den Schneidkopf nach dem Fokussieren auf die Oberfläche um den angezeigten Z-Wert nach unten verstellen.',
  ],
  faq: [
    { q: 'Warum den Fokus beim Schneiden ins Material legen?', a: 'Ein auf der Oberfläche liegender Fokus erzeugt unten eine breitere, schräge Fuge. Verschiebt man ihn etwa auf ein Drittel der Dicke, verteilt sich die hohe Energiedichte besser über die Materialhöhe und der Schnitt wird gerader und sauberer.' },
    { q: 'Wie finde ich überhaupt den Nullpunkt auf der Oberfläche?', a: 'Über den Fokusabstand der Linse: viele Maschinen nutzen ein Abstandsplättchen oder einen Autofokus-Sensor. Der Plattenabstand entspricht der Brennweite, dort liegt der Fokus auf der Oberfläche.' },
    { q: 'Spielt die Brennweite der Linse eine Rolle?', a: 'Ja. Kurze Brennweiten (z. B. 1,5 Zoll) bündeln stark und eignen sich für dünnes Material und feine Gravur. Lange Brennweiten (z. B. 2,5-4 Zoll) haben einen größeren Fokusbereich und schneiden dickeres Material gleichmäßiger.' },
    { q: 'Gilt die Drittel-Regel immer?', a: 'Sie ist ein bewährter Startwert. Bei sehr dickem Acryl für glänzende Kanten fokussiert man oft tiefer (bis zur Hälfte), bei dünnem Material reicht der Oberflächenfokus. Ein Testschnitt zeigt das beste Ergebnis.' },
  ],
  related: ['laser-einstellung-material', 'kerf-kompensation', 'laser-schnittzeit'],
  updated: '2026-06-16',
  examples: [
    { values: { dicke: 6, modus: 'schnitt', anteil: 33 }, expect: [{ label: 'Fokus unter Oberfläche', value: 1.98, tolerance: 0.01 }] },
    { values: { dicke: 4, modus: 'gravur', anteil: 33 }, expect: [{ label: 'Fokus unter Oberfläche', value: 0, tolerance: 0.01 }] },
  ],
};
