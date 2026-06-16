import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'duesen-druckgeschwindigkeit',
  category: '3d-druck',
  title: 'Maximale Druckgeschwindigkeit aus Volumenstrom',
  shortTitle: 'Max. Druckspeed',
  description:
    'Berechne die maximal mögliche Druckgeschwindigkeit aus dem Hotend-Maximalfluss, der Schichthöhe und der Linienbreite, um Underextrusion zu vermeiden.',
  keywords: [
    'maximale druckgeschwindigkeit berechnen',
    'max print speed flow rechner',
    'druckgeschwindigkeit hotend limit',
    'wie schnell drucken fdm',
    'volumenstrom in geschwindigkeit',
    'underextrusion geschwindigkeit',
  ],
  formula: 'max. Geschwindigkeit = Maximalfluss / (Schichthöhe × Linienbreite)',
  inputs: [
    { type: 'number', id: 'maxflow', label: 'Hotend-Maximalfluss', unit: 'mm³/s', default: 12, min: 0.1, step: 0.5, help: 'Aus Flow-Test oder Datenblatt.' },
    { type: 'number', id: 'schicht', label: 'Schichthöhe', unit: 'mm', default: 0.2, min: 0.04, max: 1, step: 0.01 },
    { type: 'number', id: 'breite', label: 'Linienbreite', unit: 'mm', default: 0.45, min: 0.1, max: 2, step: 0.01 },
    { type: 'number', id: 'sicherheit', label: 'Sicherheitsreserve', unit: '%', default: 0, min: 0, max: 50, step: 1, help: 'Abschlag für saubere Oberflächen.' },
  ],
  compute: (v) => {
    const maxflow = num(v.maxflow);
    const schicht = num(v.schicht);
    const breite = num(v.breite);
    const sicherheit = num(v.sicherheit) / 100;
    const querschnitt = schicht * breite;
    const maxSpeed = querschnitt > 0 ? maxflow / querschnitt : 0;
    const empfohlen = maxSpeed * (1 - sicherheit);
    return [
      { label: 'Maximale Geschwindigkeit', value: maxSpeed, unit: 'mm/s', digits: 1, primary: true },
      { label: 'Empfohlene Geschwindigkeit', value: empfohlen, unit: 'mm/s', digits: 1, help: 'Nach Abzug der Sicherheitsreserve.' },
    ];
  },
  intro:
    'Wie schnell ein FDM-Drucker tatsächlich extrudieren kann, begrenzt nicht die Mechanik, sondern der maximale Volumenstrom des Hotends. Aus diesem Maximalfluss, der Schichthöhe und der Linienbreite ergibt sich die höchste Geschwindigkeit, bei der noch genug Material aufgeschmolzen wird. Dieser Rechner kehrt die Volumenstrom-Formel um und liefert dir die Obergrenze – inklusive einer Sicherheitsreserve, damit Außenwände und Oberflächen sauber bleiben.',
  howto: [
    'Maximalfluss des Hotends eintragen (z. B. aus dem „Max Volumetric Speed"-Test in OrcaSlicer).',
    'Geplante Schichthöhe und Linienbreite des Profils angeben.',
    'Sicherheitsreserve wählen: 10–20 % für sichtbare Außenwände, 0 % als absolutes Limit fürs Infill.',
    'Empfohlene Geschwindigkeit als Obergrenze für extrudierende Bewegungen im Slicer setzen.',
  ],
  faq: [
    { q: 'Begrenzt nicht die Motorgeschwindigkeit?', a: 'Bei modernen Druckern ist meist das Aufschmelzen der Flaschenhals, nicht die Mechanik. Erst wenn der Volumenstrom passt, lohnt es, an Beschleunigung und Bewegungsgrenzen zu drehen.' },
    { q: 'Gilt das Limit für alle Linien gleich?', a: 'Nein: Dünne Außenwände bei kleiner Schichthöhe brauchen weniger Fluss und erlauben hohe Speeds; dickes Infill mit großer Schichthöhe stößt schnell ans Flusslimit.' },
    { q: 'Warum eine Sicherheitsreserve?', a: 'Genau am Maximalfluss zu drucken führt leicht zu lokaler Underextrusion an Ecken und Beschleunigungsphasen. 10–20 % Abstand halten die Oberflächen sauber.' },
    { q: 'Wie steigere ich die mögliche Geschwindigkeit?', a: 'Mit einem Hochfluss-Hotend (Volcano, CHT-Düse), höherer Drucktemperatur oder größerer Schichthöhe – alles erhöht den verfügbaren bzw. genutzten Volumenstrom.' },
  ],
  related: ['max-volumenstrom', 'linienbreite-rechner', 'druckzeit-schaetzung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { maxflow: 12, schicht: 0.2, breite: 0.45, sicherheit: 0 },
      expect: [
        { label: 'Maximale Geschwindigkeit', value: 133.3, tolerance: 0.2 },
        { label: 'Empfohlene Geschwindigkeit', value: 133.3, tolerance: 0.2 },
      ],
    },
    {
      values: { maxflow: 12, schicht: 0.2, breite: 0.45, sicherheit: 15 },
      expect: [
        { label: 'Maximale Geschwindigkeit', value: 133.3, tolerance: 0.2 },
        { label: 'Empfohlene Geschwindigkeit', value: 113.3, tolerance: 0.3 },
      ],
    },
  ],
};
