import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'eilgangzeit',
  category: 'cnc',
  title: 'Eilgang- & Positionierzeit Rechner',
  shortTitle: 'Eilgangzeit',
  description:
    'Berechne die Positionierzeit im Eilgang aus Verfahrweg und Eilganggeschwindigkeit – wahlweise mit Beschleunigungsaufschlag für kurze Wege.',
  keywords: [
    'eilgangzeit berechnen',
    'positionierzeit cnc',
    'eilgang geschwindigkeit weg zeit',
    'nebenzeit cnc berechnen',
    'verfahrzeit rechner cnc',
    'rapid traverse zeit',
    'leerwege fräsen zeit',
  ],
  formula: 'v_mms = v · 1000 / 60;  t = s / v_mms + t_acc  (s)',
  inputs: [
    { type: 'number', id: 's', label: 'Verfahrweg s', unit: 'mm', default: 500, min: 0, step: 10, help: 'Zurückgelegter Weg im Eilgang (Luftweg / Positionierung).' },
    { type: 'number', id: 'v', label: 'Eilganggeschwindigkeit', unit: 'm/min', default: 30, min: 0.1, step: 1, help: 'Rapid-Geschwindigkeit der Achse, oft 20–60 m/min.' },
    { type: 'number', id: 'acc', label: 'Beschl.-Zuschlag je Weg', unit: 's', default: 0, min: 0, step: 0.05, help: 'Pauschale Zeit für Anfahren/Bremsen pro Positionierung (optional).' },
    { type: 'number', id: 'anz', label: 'Anzahl Positionierungen', unit: '', default: 1, min: 1, step: 1, help: 'Wie oft dieser Weg gefahren wird (z. B. je Bohrung).' },
  ],
  compute: (v) => {
    const s = num(v.s);
    const vmin = num(v.v, 0.1);
    const acc = num(v.acc);
    const anz = Math.max(1, Math.round(num(v.anz, 1)));
    const vmms = (vmin * 1000) / 60;
    const tEine = vmms > 0 ? s / vmms + acc : 0;
    const tGesS = tEine * anz;
    const tGesMin = tGesS / 60;
    return [
      { label: 'Zeit je Positionierung', value: tEine, unit: 's', digits: 3, primary: true },
      { label: 'Gesamtzeit', value: tGesS, unit: 's', digits: 2 },
      { label: 'Gesamtzeit in Minuten', value: tGesMin, unit: 'min', digits: 3 },
    ];
  },
  intro:
    'Eilgangwege sind reine Nebenzeit – das Werkzeug schneidet nicht, die Achse positioniert nur. Bei vielen Bohrungen, Werkzeugwechseln oder Konturwechseln summieren sich diese Luftwege spürbar auf. Die Grundzeit ist Weg geteilt durch Geschwindigkeit; auf kurzen Wegen erreicht die Achse die Maximalgeschwindigkeit jedoch nicht, daher kann ein pauschaler Beschleunigungszuschlag je Positionierung addiert werden. So lässt sich die Taktzeit realistischer kalkulieren.',
  howto: [
    'Verfahrweg s in mm eingeben (z. B. Abstand zwischen zwei Bohrungen).',
    'Eilganggeschwindigkeit der Maschine in m/min eintragen (Datenblatt).',
    'Optional einen Beschleunigungszuschlag je Positionierung in Sekunden ergänzen.',
    'Anzahl der Positionierungen festlegen und Einzel- sowie Gesamtzeit ablesen.',
  ],
  faq: [
    {
      q: 'Warum brauche ich überhaupt einen Beschleunigungszuschlag?',
      a: 'Auf kurzen Wegen beschleunigt und bremst die Achse, ohne die Eilganggeschwindigkeit zu erreichen. Die reine Weg/Geschwindigkeit-Rechnung unterschätzt die Zeit dann. Ein Pauschalwert (oft 0,05–0,3 s je Bewegung) gleicht das aus.',
    },
    {
      q: 'Fahren X, Y und Z gleichzeitig?',
      a: 'Moderne Steuerungen interpolieren die Achsen, sodass die Bewegung etwa der längsten Einzelachse entspricht – nicht der Summe. Setze für s die längste beteiligte Achsstrecke ein, nicht die Wegsumme aller Achsen.',
    },
    {
      q: 'Wie wirkt sich der Eilgang auf die Stückzeit aus?',
      a: 'Bei Teilen mit vielen kurzen Schnitten (Bohrbilder, Gravuren) macht die Positionierung einen großen Anteil aus. Kurze Wege, sinnvolle Bohrreihenfolge und hohe Rapid-Geschwindigkeit senken die Nebenzeit deutlich.',
    },
    {
      q: 'Gilt das auch für G1-Vorschubwege?',
      a: 'Nein, hier wird der Eilgang (G0) betrachtet. Für Vorschubwege im Schnitt nutzt du die Bearbeitungszeit-Rechner mit dem programmierten Vorschub vf in mm/min.',
    },
  ],
  related: ['bohrzeit', 'planfraeszeit', 'vorschub-umrechnung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { s: 500, v: 30, acc: 0, anz: 1 },
      expect: [{ label: 'Zeit je Positionierung', value: 1.0, tolerance: 0.01 }],
    },
    {
      values: { s: 100, v: 24, acc: 0.1, anz: 10 },
      expect: [
        { label: 'Zeit je Positionierung', value: 0.35, tolerance: 0.01 },
        { label: 'Gesamtzeit', value: 3.5, tolerance: 0.05 },
      ],
    },
  ],
};
