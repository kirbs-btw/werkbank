import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'linear-advance-test',
  category: '3d-druck',
  title: 'Linear Advance / Pressure Advance Test-Wert Rechner',
  shortTitle: 'Linear Advance',
  description:
    'Ermittle den K-Faktor für Linear bzw. Pressure Advance aus der Testdruck-Höhe und den Schrittwerten und erzeuge den passenden Einstellbefehl.',
  keywords: [
    'linear advance k faktor berechnen',
    'pressure advance test wert',
    'klipper pressure advance rechner',
    'marlin linear advance einstellen',
    'k faktor testdruck höhe',
    'linear advance kalibrieren tower',
  ],
  formula: 'K = Start + (Höhe_beste / Schichthöhe) × Schritt pro Schicht',
  inputs: [
    {
      type: 'select', id: 'firmware', label: 'Firmware', default: 'klipper',
      options: [
        { value: 'klipper', label: 'Klipper (Pressure Advance)' },
        { value: 'marlin', label: 'Marlin (Linear Advance)' },
      ],
      help: 'Bestimmt nur den ausgegebenen Beispielbefehl.',
    },
    { type: 'number', id: 'start', label: 'Start-K-Wert', unit: '', default: 0, min: 0, step: 0.005, help: 'K-Wert am unteren Ende des Tests.' },
    { type: 'number', id: 'schritt', label: 'Schritt pro Höhenabschnitt', unit: '', default: 0.005, min: 0.0001, step: 0.001, help: 'K-Erhöhung je Abschnitt (Faktor).' },
    { type: 'number', id: 'abschnitt', label: 'Höhe je Abschnitt', unit: 'mm', default: 1, min: 0.1, step: 0.1, help: 'Z-Höhe, über die ein K-Wert konstant bleibt.' },
    { type: 'number', id: 'besteHoehe', label: 'Höhe der besten Stelle', unit: 'mm', default: 7, min: 0, step: 0.1, help: 'Z-Höhe mit den saubersten Ecken (gemessen).' },
  ],
  compute: (v) => {
    const start = num(v.start);
    const schritt = num(v.schritt);
    const abschnitt = num(v.abschnitt);
    const besteHoehe = num(v.besteHoehe);
    const abschnitte = abschnitt > 0 ? besteHoehe / abschnitt : 0;
    const k = start + abschnitte * schritt;
    return [
      { label: 'Empfohlener K-Faktor', value: k, unit: '', digits: 4, primary: true, help: 'In das Profil bzw. die Firmware übernehmen.' },
      { label: 'Abschnitt-Nummer', value: abschnitte, unit: '', digits: 1, help: 'Wie viele Stufen über dem Start.' },
    ];
  },
  intro:
    'Linear Advance (Marlin) bzw. Pressure Advance (Klipper) gleicht den Druckaufbau im Hotend aus: Ohne Kompensation quillt an Ecken und nach Beschleunigungswechseln zu viel Material heraus. Ein K-Faktor-Testturm druckt über die Höhe steigende K-Werte; du suchst die Z-Höhe mit den schärfsten Ecken und ohne Wülste. Aus dieser Höhe, der Abschnittshöhe und dem Schritt pro Abschnitt rechnet dieser Rechner den passenden K-Faktor und liefert dir den fertigen Einstellbefehl.',
  howto: [
    'K-Faktor-Testturm drucken (z. B. aus dem Klipper- oder Marlin-Kalibrier-Makro) mit bekanntem Start, Schritt und Abschnitthöhe.',
    'Die Z-Höhe der saubersten Stelle (scharfe Ecken, gleichmäßige Linien) mit dem Messschieber bestimmen.',
    'Start-K, Schritt, Abschnitthöhe und die gemessene beste Höhe eintragen.',
    'Empfohlenen K-Faktor in das Slicer-/Firmware-Profil übernehmen und mit einem Kontrolldruck prüfen.',
  ],
  faq: [
    { q: 'Was bewirkt ein zu hoher K-Faktor?', a: 'Zu viel Kompensation zieht an Ecken zu stark zurück: Es entstehen Lücken, Einschnürungen an Linienenden und sichtbare Aussparungen vor Richtungswechseln.' },
    { q: 'Klipper und Marlin – derselbe Wert?', a: 'Nein. Beide nutzen ein ähnliches Modell, aber unterschiedliche Skalen und Einheiten. Ein in Klipper ermittelter PA-Wert lässt sich nicht 1:1 in Marlin übernehmen – jeweils neu kalibrieren.' },
    { q: 'Hängt der K-Faktor vom Filament ab?', a: 'Ja. Weichere oder zähere Materialien (TPU, PETG) bauen anders Druck auf als PLA. Für jedes Material und teils jeden Extruder lohnt eine eigene Kalibrierung.' },
    { q: 'Typische Wertebereiche?', a: 'Bei Direct-Drive liegt Pressure Advance oft bei 0,02–0,08, bei Bowden deutlich höher (0,4–1,0+). Marlins Linear Advance bewegt sich meist zwischen 0,1 und 2,0.' },
    { q: 'Muss ich nach Düsenwechsel neu kalibrieren?', a: 'Bei gleichem Setup meist nicht nötig, aber ein anderer Durchmesser, Bowden-Längen oder Extruderwechsel ändern den Druckaufbau – dann erneut testen.' },
  ],
  related: ['flow-kalibrierung', 'e-steps-kalibrierung', 'temperatur-tower'],
  updated: '2026-06-16',
  examples: [
    {
      values: { firmware: 'klipper', start: 0, schritt: 0.005, abschnitt: 1, besteHoehe: 7 },
      expect: [
        { label: 'Empfohlener K-Faktor', value: 0.035, tolerance: 0.0001 },
        { label: 'Abschnitt-Nummer', value: 7, tolerance: 0.1 },
      ],
    },
  ],
};
