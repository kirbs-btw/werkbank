import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'pfostenfundament-beton',
  category: 'holz',
  title: 'Beton für Pfostenfundament berechnen',
  shortTitle: 'Pfostenfundament',
  description:
    'Berechne Lochvolumen, benötigten Beton und Anzahl Trockenbeton-Säcke für Punktfundamente von Zaun- oder Carportpfosten.',
  keywords: [
    'beton pfostenfundament berechnen',
    'wie viel beton für pfosten',
    'punktfundament beton menge',
    'trockenbeton säcke berechnen',
    'zaunpfosten einbetonieren menge',
    'fundament loch volumen',
    'beton pro pfosten',
  ],
  formula:
    'Lochvolumen je Pfosten = π · (Ø/2)² · Tiefe · Beton gesamt = Volumen · Anzahl Pfosten · Säcke = aufrunden(Beton / Ergiebigkeit je Sack)',
  inputs: [
    { type: 'number', id: 'durchmesser', label: 'Loch-Durchmesser', unit: 'mm', default: 300, min: 1, step: 10, help: 'Bei rundem Erdloch oder Aushub.' },
    { type: 'number', id: 'tiefe', label: 'Loch-Tiefe', unit: 'mm', default: 800, min: 1, step: 10, help: 'Mind. Frosttiefe ca. 800 mm.' },
    { type: 'number', id: 'anzahl', label: 'Anzahl Pfosten', unit: 'Stück', default: 9, min: 1, step: 1 },
    { type: 'number', id: 'ergiebigkeit', label: 'Ergiebigkeit je Sack', unit: 'l', default: 12.5, min: 1, step: 0.5, help: '25-kg-Trockenbeton ergibt ca. 12,5 l Frischbeton.' },
  ],
  compute: (v) => {
    const durchmesser = num(v.durchmesser);
    const tiefe = num(v.tiefe);
    const anzahl = num(v.anzahl);
    const ergiebigkeit = num(v.ergiebigkeit, 1);

    const radiusM = durchmesser / 2 / 1000;
    const tiefeM = tiefe / 1000;
    const volumenJeLochL = Math.PI * radiusM * radiusM * tiefeM * 1000;
    const volumenGesamtL = volumenJeLochL * anzahl;
    const volumenGesamtM3 = volumenGesamtL / 1000;
    const saecke = ergiebigkeit > 0 ? Math.ceil(volumenGesamtL / ergiebigkeit) : 0;

    return [
      { label: 'Betonvolumen je Loch', value: volumenJeLochL, unit: 'l', digits: 1 },
      { label: 'Betonvolumen gesamt', value: volumenGesamtM3, unit: 'm³', digits: 3 },
      { label: 'Benötigte Säcke', value: saecke, unit: 'Sack', digits: 0, primary: true },
    ];
  },
  intro:
    'Dieser Rechner ermittelt, wie viel Beton du zum Einbetonieren von Pfosten brauchst. Das Volumen je Loch folgt aus einem zylindrischen Erdloch mit Durchmesser und Tiefe; multipliziert mit der Pfostenzahl ergibt sich der Gesamtbedarf. Anhand der Ergiebigkeit handelsüblicher 25-kg-Trockenbetonsäcke (rund 12,5 Liter Frischbeton je Sack) wird die zu kaufende Sackzahl aufgerundet.',
  howto: [
    'Durchmesser des ausgehobenen Lochs messen oder festlegen (bei Erdbohrer = Bohrdurchmesser).',
    'Tiefe eintragen – mindestens Frosttiefe, in Deutschland meist rund 80 cm.',
    'Anzahl der Pfosten und die Ergiebigkeit deines Trockenbetonsacks angeben.',
    'Ergebnis liefert Volumen je Loch, Gesamtvolumen in m³ und die aufgerundete Sackzahl.',
  ],
  faq: [
    {
      q: 'Muss ich das Pfostenvolumen abziehen?',
      a: 'Wird ein H-Anker oder Pfostenträger einbetoniert, ist der verdrängte Anteil gering und kann als Sicherheitsreserve im Volumen bleiben. Steht ein dicker Vollholzpfosten direkt im Beton, kannst du dessen Querschnitt mal Einbindetiefe abziehen.',
    },
    {
      q: 'Wie tief muss das Fundament sein?',
      a: 'Damit Frost das Fundament nicht anhebt, sollte es bis unter die Frosttiefe reichen – in Deutschland je nach Region 80 bis 120 cm. Für hohe Zäune oder Tore lieber tiefer und breiter ausführen.',
    },
    {
      q: 'Wie viel ergibt ein 25-kg-Sack Trockenbeton?',
      a: 'Etwa 12,5 Liter Frischbeton, je nach Produkt 11–13 Liter. Prüfe die Herstellerangabe auf dem Sack und trage den genauen Wert ein.',
    },
    {
      q: 'Eckiges statt rundes Loch – stimmt die Rechnung dann?',
      a: 'Nein, dieser Rechner geht von einem runden Loch aus. Für ein rechteckiges Fundament rechne Breite × Tiefe × Höhe separat; die Sackzahl ergibt sich analog über die Ergiebigkeit.',
    },
  ],
  related: ['zaun-pfostenabstand', 'bretter-pro-quadratmeter'],
  updated: '2026-06-16',
  examples: [
    {
      values: { durchmesser: 300, tiefe: 800, anzahl: 9, ergiebigkeit: 12.5 },
      expect: [
        { label: 'Betonvolumen je Loch', value: 56.5, tolerance: 0.5 },
        { label: 'Betonvolumen gesamt', value: 0.509, tolerance: 0.005 },
        { label: 'Benötigte Säcke', value: 41, tolerance: 0 },
      ],
    },
  ],
};
