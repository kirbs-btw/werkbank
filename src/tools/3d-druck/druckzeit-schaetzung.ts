import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'druckzeit-schaetzung',
  category: '3d-druck',
  title: 'Druckzeit-Schätzung (Volumen & Flussrate)',
  shortTitle: 'Druckzeit',
  description:
    'Schätze die FDM-Druckzeit aus dem Modellvolumen, der Volumenflussrate und einem Effizienzfaktor für Reise- und Beschleunigungsverluste.',
  keywords: [
    'druckzeit berechnen 3d druck',
    'druckdauer schätzen fdm',
    'volumen flussrate druckzeit',
    'wie lange dauert 3d druck',
    'druckzeit rechner filament',
    'volumenstrom druckzeit',
  ],
  formula:
    'Druckzeit = Volumen / (Flussrate × Effizienz); Effizienz berücksichtigt Reisewege und Beschleunigung',
  inputs: [
    { type: 'number', id: 'volumen', label: 'Modellvolumen', unit: 'mm³', default: 20000, min: 0, step: 100, help: 'Inklusive Stützen, aus dem Slicer.' },
    { type: 'number', id: 'flow', label: 'Volumenflussrate', unit: 'mm³/s', default: 8, min: 0.1, step: 0.1, help: 'Effektiver Materialfluss beim Drucken.' },
    { type: 'number', id: 'effizienz', label: 'Effizienz', unit: '%', default: 85, min: 10, max: 100, step: 1, help: 'Anteil reiner Druckzeit (Rest = Reisen, Bremsen).' },
  ],
  compute: (v) => {
    const volumen = num(v.volumen);
    const flow = num(v.flow);
    const eff = num(v.effizienz) / 100;
    const effFlow = flow * eff;
    const sekunden = effFlow > 0 ? volumen / effFlow : 0;
    const minuten = sekunden / 60;
    const stunden = sekunden / 3600;
    return [
      { label: 'Druckzeit (Sekunden)', value: sekunden, unit: 's', digits: 0 },
      { label: 'Druckzeit (Minuten)', value: minuten, unit: 'min', digits: 1 },
      { label: 'Druckzeit (Stunden)', value: stunden, unit: 'h', digits: 2, primary: true },
    ];
  },
  intro:
    'Diese Schätzung leitet die Druckdauer direkt aus dem Materialvolumen und der effektiven Volumenflussrate ab. Da ein Drucker nie durchgehend extrudiert, korrigiert ein Effizienzfaktor die rein rechnerische Zeit um Reisewege, Beschleunigungsphasen und Z-Hübe. So bekommst du schon vor dem Slicen eine belastbare Hausnummer, etwa um Druckaufträge zu kalkulieren oder Übernacht-Drucke zu planen.',
  howto: [
    'Modellvolumen in mm³ aus dem Slicer ablesen (oder Gewicht durch Materialdichte teilen).',
    'Effektive Volumenflussrate eintragen – typisch 5–12 mm³/s bei FDM mit 0,4-mm-Düse.',
    'Effizienz wählen: 80–90 % bei großen Volumenkörpern, 60–75 % bei filigranen Modellen mit vielen Reisewegen.',
    'Druckzeit in Stunden ablesen und als Planungsgrundlage für Strom- und Maschinenkosten nutzen.',
  ],
  faq: [
    { q: 'Warum weicht das Ergebnis vom Slicer ab?', a: 'Der Slicer simuliert jede Bewegung einzeln. Diese Schätzung rechnet mit einem mittleren Fluss und dem Effizienzfaktor, ist also bewusst eine schnelle Näherung.' },
    { q: 'Welche Effizienz ist realistisch?', a: 'Bei kompakten Klötzen erreichst du 85–90 %, bei verzweigten oder hohen, dünnen Teilen mit vielen Sprüngen eher 60–70 %.' },
    { q: 'Wie komme ich auf das Volumen?', a: 'Der Slicer zeigt das Materialvolumen direkt an. Alternativ: Gewicht in Gramm durch die Dichte (PLA ≈ 1,24 g/cm³) teilen und in mm³ umrechnen.' },
    { q: 'Gilt das auch für Resin-Drucker?', a: 'Nein, bei SLA/MSLA hängt die Zeit fast nur von der Schichtzahl und Belichtungszeit ab, nicht vom Volumen. Nutze dafür den Schichtanzahl-Rechner.' },
  ],
  related: ['max-volumenstrom', 'schichtanzahl-rechner', 'stromkosten-3d-druck'],
  updated: '2026-06-16',
  examples: [
    {
      values: { volumen: 20000, flow: 8, effizienz: 85 },
      expect: [
        { label: 'Druckzeit (Minuten)', value: 49.0, tolerance: 0.2 },
        { label: 'Druckzeit (Stunden)', value: 0.82, tolerance: 0.02 },
      ],
    },
  ],
};
