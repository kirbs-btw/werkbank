import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'anzahl-schrauben-last',
  category: 'schrauben',
  title: 'Anzahl Schrauben für eine Last berechnen',
  shortTitle: 'Anzahl Schrauben',
  description:
    'Berechne, wie viele Schrauben eine Last tragen müssen — aus Gesamtlast, zulässiger Kraft je Schraube und Sicherheitsfaktor inkl. Aufrundung.',
  keywords: [
    'anzahl schrauben berechnen',
    'wie viele schrauben für last',
    'schraubenanzahl tragkraft',
    'schrauben dimensionieren last',
    'anzahl befestigungspunkte',
    'last pro schraube',
    'schrauben für gewicht',
  ],
  formula: 'n = aufrunden( F_last · S / F_zul )',
  inputs: [
    { type: 'number', id: 'last', label: 'Gesamtlast F', unit: 'N', default: 5000, min: 0, step: 100, help: 'Zu tragende Kraft, z. B. Gewicht · 9,81 für eine Masse.' },
    { type: 'number', id: 'fzul', label: 'Zulässige Kraft je Schraube', unit: 'N', default: 7000, min: 1, step: 100, help: 'Tragfähigkeit einer Schraube, z. B. aus Vorspann- oder Scherkraftrechner.' },
    { type: 'number', id: 'sf', label: 'Sicherheitsfaktor', default: 1.5, min: 1, step: 0.25, help: 'Reserve gegen Überlast und ungleiche Lastverteilung.' },
  ],
  compute: (v) => {
    const last = num(v.last);
    const fzul = num(v.fzul);
    const sf = num(v.sf, 1.5);
    const bedarf = fzul > 0 ? (last * sf) / fzul : 0;
    const n = Math.max(1, Math.ceil(bedarf));
    const auslastung = n > 0 ? (last * sf) / (n * fzul) * 100 : 0;
    return [
      { label: 'Rechnerischer Bedarf', value: bedarf, unit: 'Stück', digits: 2 },
      { label: 'Benötigte Schrauben', value: n, unit: 'Stück', digits: 0, primary: true },
      { label: 'Last je Schraube (gewählt)', value: n > 0 ? last / n : 0, unit: 'N', digits: 0 },
      { label: 'Auslastung', value: auslastung, unit: '%', digits: 0, help: 'Bezogen auf die zulässige Kraft inkl. Sicherheit.' },
    ];
  },
  intro:
    'Wenn eine Verbindung eine bestimmte Last übertragen soll, ergibt sich die nötige Schraubenzahl aus der Gesamtlast, der zulässigen Tragkraft je Schraube und einem Sicherheitsfaktor. Da nur ganze Schrauben einbaubar sind, wird der rechnerische Bedarf immer aufgerundet. Der Rechner zeigt zusätzlich die tatsächliche Last je Schraube und die Auslastung, damit die Reserve sichtbar bleibt. Voraussetzung ist eine gleichmäßige Lastverteilung auf alle Schrauben.',
  howto: [
    'Gesamtlast in Newton eintragen (Masse in kg mal 9,81 ergibt die Gewichtskraft).',
    'Zulässige Kraft je Schraube angeben — z. B. aus dem Vorspann- oder Abscherkraft-Rechner.',
    'Sicherheitsfaktor wählen, typisch 1,5 bis 3 je nach Anwendung.',
    'Aufgerundete Schraubenzahl ablesen und die Auslastung prüfen.',
  ],
  faq: [
    { q: 'Warum wird immer aufgerundet?', a: 'Eine halbe Schraube gibt es nicht. Ergibt die Rechnung 3,2 Schrauben, müssen es 4 sein, damit die zulässige Last sicher unterschritten wird. Der Rechner rundet deshalb stets auf die nächste ganze Zahl auf.' },
    { q: 'Welche zulässige Kraft soll ich einsetzen?', a: 'Bei Zugbelastung die zulässige Vorspann- bzw. Zugkraft, bei Querlast die zulässige Scherkraft. Beide Werte liefern die jeweiligen Rechner. Immer mit Sicherheitsabstand zur Bruchkraft arbeiten.' },
    { q: 'Tragen wirklich alle Schrauben gleich?', a: 'Nur bei idealer, symmetrischer Anordnung. In der Praxis tragen einzelne Schrauben mehr, etwa bei exzentrischer Last oder Setzen einzelner Verbindungen. Deshalb der Sicherheitsfaktor.' },
    { q: 'Wie rechne ich eine Masse in eine Last um?', a: 'Multipliziere die Masse in Kilogramm mit der Erdbeschleunigung 9,81 m/s². 500 kg entsprechen also rund 4905 N Gewichtskraft.' },
    { q: 'Was sagt die Auslastung aus?', a: 'Sie gibt an, wie viel der zulässigen Kraft inklusive Sicherheit tatsächlich genutzt wird. Liegt sie deutlich unter 100 Prozent, ist Reserve vorhanden; nahe 100 Prozent ist die Verbindung knapp dimensioniert.' },
  ],
  related: ['scherkraft-schraube', 'max-vorspannkraft', 'vorspannkraft'],
  updated: '2026-06-16',
  examples: [
    { values: { last: 5000, fzul: 7000, sf: 1.5 }, expect: [{ label: 'Benötigte Schrauben', value: 2, tolerance: 0.01 }] },
    { values: { last: 20000, fzul: 7000, sf: 2 }, expect: [{ label: 'Benötigte Schrauben', value: 6, tolerance: 0.01 }] },
  ],
};
