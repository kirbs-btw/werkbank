import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'planfraeszeit',
  category: 'cnc',
  title: 'Planfräs-Bahnzeit-Rechner',
  shortTitle: 'Planfräszeit',
  description:
    'Berechne die Bearbeitungszeit beim Planfräsen einer Fläche aus Länge, Breite, Eingriffsbreite ae und Vorschub vf. Mit Bahnanzahl und Gesamtweg.',
  keywords: [
    'planfräsen zeit berechnen',
    'bearbeitungszeit fräsen rechner',
    'fräszeit fläche berechnen',
    'bahnzeit cnc berechnen',
    'planfräsen dauer',
    'hauptzeit fräsen berechnen',
    'fräsbahnen berechnen',
  ],
  formula: 'Bahnen = aufrunden(B / ae);  t = (L · Bahnen) / vf  (min)',
  inputs: [
    { type: 'number', id: 'laenge', label: 'Werkstücklänge L', unit: 'mm', default: 200, min: 0, step: 1, help: 'Länge in Vorschubrichtung pro Bahn.' },
    { type: 'number', id: 'breite', label: 'Werkstückbreite B', unit: 'mm', default: 120, min: 0, step: 1, help: 'Quer zur Vorschubrichtung – bestimmt die Bahnanzahl.' },
    { type: 'number', id: 'ae', label: 'Eingriffsbreite ae', unit: 'mm', default: 40, min: 0.1, step: 1, help: 'Überdeckung pro Bahn (meist 60-80 % des Fräserdurchmessers).' },
    { type: 'number', id: 'vf', label: 'Vorschub vf', unit: 'mm/min', default: 1200, min: 1, step: 10 },
  ],
  compute: (v) => {
    const laenge = num(v.laenge);
    const breite = num(v.breite);
    const ae = num(v.ae, 1);
    const vf = num(v.vf, 1);
    const bahnen = ae > 0 ? Math.ceil(breite / ae) : 0;
    const weg = laenge * bahnen;
    const tMin = vf > 0 ? weg / vf : 0;
    return [
      { label: 'Bearbeitungszeit t', value: tMin, unit: 'min', digits: 2, primary: true },
      { label: 'Anzahl Bahnen', value: bahnen, unit: '', digits: 0 },
      { label: 'Gesamtweg', value: weg, unit: 'mm', digits: 0 },
    ];
  },
  intro:
    'Beim Planfräsen einer rechteckigen Fläche fährt der Fräser in parallelen Bahnen über das Werkstück. Die Zeit hängt von der Bahnlänge, der Zahl der Bahnen und der Vorschubgeschwindigkeit vf ab. Die Bahnanzahl ergibt sich aus der Werkstückbreite geteilt durch die Eingriffsbreite ae (aufgerundet), denn die letzte Bahn muss die Fläche vollständig abdecken. So kalkulierst du die Hauptzeit einer Schlichtüberfahrt oder schätzt den Zeitbedarf fürs Planen.',
  howto: [
    'Werkstücklänge L (Bahnrichtung) in mm eintragen.',
    'Werkstückbreite B quer dazu in mm eintragen.',
    'Eingriffsbreite ae je Bahn wählen (oft 60-80 % des Fräserdurchmessers für saubere Oberfläche).',
    'Vorschub vf in mm/min eingeben und Bearbeitungszeit, Bahnanzahl und Gesamtweg ablesen.',
  ],
  faq: [
    {
      q: 'Warum wird die Bahnanzahl aufgerundet?',
      a: 'Geht die Breite nicht glatt durch die Eingriffsbreite, bleibt ein Reststreifen, der eine weitere Bahn erfordert. Deshalb wird auf die nächste ganze Bahn aufgerundet – sonst bliebe ein ungefräster Streifen stehen.',
    },
    {
      q: 'Berücksichtigt der Rechner mehrere Tiefenschnitte?',
      a: 'Die Berechnung gilt für eine Überfahrt. Bei mehreren axialen Schnitten (mehrere ap-Lagen) multiplizierst du die Zeit mit der Anzahl der Tiefenschnitte. Diese ergibt sich aus Aufmaß geteilt durch Schnitttiefe.',
    },
    {
      q: 'Sind An- und Auslaufwege enthalten?',
      a: 'Nein, der Rechner nutzt die reine Werkstücklänge. In der Praxis kommen pro Bahn Anlauf und Überlauf (etwa der halbe Fräserdurchmesser) hinzu. Für eine genauere Zeit kannst du L entsprechend vergrößern.',
    },
    {
      q: 'Wie wähle ich ae sinnvoll?',
      a: 'Beim Schruppen geht ein hoher Anteil des Fräserdurchmessers, beim Schlichten reduziert man ae, um Rattermarken zu vermeiden. Für gute Oberflächen liegt ae typisch bei 60-80 % des Durchmessers; volle Überdeckung (ae = d) belastet den Fräser stark.',
    },
  ],
  related: ['zeitspanvolumen', 'bohrzeit', 'vorschub-umrechnung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { laenge: 200, breite: 120, ae: 40, vf: 1200 },
      expect: [
        { label: 'Bearbeitungszeit t', value: 0.5, tolerance: 0.01 },
        { label: 'Anzahl Bahnen', value: 3, tolerance: 0.01 },
      ],
    },
    {
      values: { laenge: 100, breite: 50, ae: 16, vf: 800 },
      expect: [
        { label: 'Anzahl Bahnen', value: 4, tolerance: 0.01 },
        { label: 'Bearbeitungszeit t', value: 0.5, tolerance: 0.01 },
      ],
    },
  ],
};
