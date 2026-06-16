import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'anzahl-schnitte-zustellung',
  category: 'cnc',
  title: 'Anzahl Schnitte aus Aufmaß & Zustellung',
  shortTitle: 'Anzahl Schnitte',
  description:
    'Berechne, wie viele Tiefenschnitte ein Aufmaß bei gegebener maximaler Zustellung braucht – mit gleichmäßig verteilter realer Schnitttiefe.',
  keywords: [
    'anzahl schnitte berechnen',
    'zustellung aufmaß schnitte',
    'tiefenschnitte cnc berechnen',
    'schnitttiefe ap verteilen',
    'aufmaß zustellung rechner',
    'anzahl zustellungen fräsen',
    'schnittaufteilung tiefe',
  ],
  formula: 'n = aufrunden(Aufmaß / ap_max);  ap_real = Aufmaß / n  (mm)',
  inputs: [
    { type: 'number', id: 'aufmass', label: 'Gesamtaufmaß / Tiefe', unit: 'mm', default: 12, min: 0, step: 0.5, help: 'Abzutragende Materialhöhe bzw. zu erreichende Tiefe.' },
    { type: 'number', id: 'apmax', label: 'Max. Zustellung ap', unit: 'mm', default: 4, min: 0.01, step: 0.5, help: 'Größte zulässige Schnitttiefe je Lage.' },
    { type: 'number', id: 'schlicht', label: 'Schlichtaufmaß (separat)', unit: 'mm', default: 0, min: 0, step: 0.1, help: 'Wird als eigener letzter Schnitt abgezogen (optional).' },
  ],
  compute: (v) => {
    const aufmass = num(v.aufmass);
    const apmax = num(v.apmax, 0.01);
    const schlicht = Math.min(num(v.schlicht), aufmass);
    const schruppMass = Math.max(0, aufmass - schlicht);
    const nSchrupp = apmax > 0 && schruppMass > 0 ? Math.ceil(schruppMass / apmax) : 0;
    const apReal = nSchrupp > 0 ? schruppMass / nSchrupp : 0;
    const nGesamt = nSchrupp + (schlicht > 0 ? 1 : 0);
    return [
      { label: 'Anzahl Schnitte gesamt', value: nGesamt, unit: '', digits: 0, primary: true },
      { label: 'Schruppschnitte', value: nSchrupp, unit: '', digits: 0 },
      { label: 'Reale Schnitttiefe je Schruppschnitt', value: apReal, unit: 'mm', digits: 3 },
    ];
  },
  intro:
    'Lässt sich ein Aufmaß nicht in einem einzigen Schnitt abtragen, teilt man es in mehrere Tiefenlagen auf. Die Anzahl ergibt sich aus dem Aufmaß geteilt durch die maximale Zustellung ap – stets aufgerundet, da der Rest sonst stehen bliebe. Damit alle Schnitte gleich belastet sind, verteilt der Rechner das Aufmaß gleichmäßig: Statt z. B. 4 + 4 + 4 + 0,5 mm rechnet er die reale Schnitttiefe je Lage aus. Optional lässt sich ein Schlichtaufmaß abziehen, das als eigener, dünner Schlussschnitt gefahren wird.',
  howto: [
    'Gesamtaufmaß bzw. zu erreichende Tiefe in mm eingeben.',
    'Maximale Zustellung ap je Schnitt eintragen (werkzeug- und materialabhängig).',
    'Optional ein Schlichtaufmaß angeben, das separat als letzter Schnitt bleibt.',
    'Anzahl der Schnitte und die gleichmäßig verteilte reale Schnitttiefe ablesen.',
  ],
  faq: [
    {
      q: 'Warum gleichmäßig verteilen statt voller ap plus Rest?',
      a: 'Volle ap-Schnitte und ein dünner Restschnitt belasten Maschine und Werkzeug ungleichmäßig und können Maß- und Oberflächenunterschiede erzeugen. Gleichmäßige Tiefen ergeben konstante Kräfte und ein saubereres Ergebnis.',
    },
    {
      q: 'Wofür ist das Schlichtaufmaß?',
      a: 'Beim Schlichten lässt man oft 0,2–0,5 mm stehen, die in einem letzten, leichten Schnitt abgenommen werden. So bleiben Maßhaltigkeit und Oberfläche unabhängig vom Schruppverschleiß. Dieser Schnitt zählt als zusätzlicher Schnitt.',
    },
    {
      q: 'Gilt das für Tiefenzustellung beim Fräsen und Drehen?',
      a: 'Ja. Beim Fräsen ist es die axiale Zustellung ap je Lage, beim Drehen die radiale Schnitttiefe je Überlauf. In beiden Fällen wird ein Gesamtaufmaß auf mehrere Schnitte verteilt.',
    },
    {
      q: 'Wie wähle ich die maximale Zustellung?',
      a: 'Sie hängt von Werkzeug, Werkstoff und Maschinenstabilität ab. Bei Schaftfräsern liegt ap oft beim 0,5- bis 1-fachen des Durchmessers, bei Trochoidalbahnen deutlich höher. Das Werkzeug-Datenblatt gibt Anhaltswerte.',
    },
  ],
  related: ['planfraeszeit', 'zeitspanvolumen', 'zerspankraft-fc'],
  updated: '2026-06-16',
  examples: [
    {
      values: { aufmass: 12, apmax: 4, schlicht: 0 },
      expect: [
        { label: 'Anzahl Schnitte gesamt', value: 3, tolerance: 0.01 },
        { label: 'Reale Schnitttiefe je Schruppschnitt', value: 4, tolerance: 0.01 },
      ],
    },
    {
      values: { aufmass: 10, apmax: 3, schlicht: 0.5 },
      expect: [
        { label: 'Anzahl Schnitte gesamt', value: 5, tolerance: 0.01 },
        { label: 'Reale Schnitttiefe je Schruppschnitt', value: 2.375, tolerance: 0.01 },
      ],
    },
  ],
};
