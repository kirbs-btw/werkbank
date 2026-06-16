import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schichtanzahl-rechner',
  category: '3d-druck',
  title: 'Schichtanzahl-Rechner (Höhe / Schichthöhe)',
  shortTitle: 'Schichtanzahl',
  description:
    'Berechne die Anzahl der Druckschichten aus Objekthöhe, Schichthöhe und erster Schicht – plus die SLA-Belichtungszeit für die gesamte Schichtzahl.',
  keywords: [
    'schichtanzahl berechnen 3d druck',
    'layer anzahl rechner',
    'objekthöhe schichthöhe schichten',
    'anzahl layer fdm',
    'sla schichten belichtungszeit',
    'wie viele schichten 3d druck',
  ],
  formula: 'Schichten = aufgerundet((Höhe − erste Schicht) / Schichthöhe) + 1',
  inputs: [
    { type: 'number', id: 'hoehe', label: 'Objekthöhe', unit: 'mm', default: 40, min: 0, step: 1 },
    { type: 'number', id: 'schicht', label: 'Schichthöhe', unit: 'mm', default: 0.2, min: 0.01, max: 1, step: 0.01 },
    { type: 'number', id: 'erste', label: 'Höhe erste Schicht', unit: 'mm', default: 0.2, min: 0.01, max: 1, step: 0.01, help: 'Oft etwas dicker für bessere Haftung.' },
    { type: 'number', id: 'belichtung', label: 'Belichtungszeit/Schicht (SLA)', unit: 's', default: 0, min: 0, step: 0.1, help: '0 lassen bei FDM.' },
  ],
  compute: (v) => {
    const hoehe = num(v.hoehe);
    const schicht = num(v.schicht);
    const erste = num(v.erste);
    const belichtung = num(v.belichtung);
    const rest = Math.max(0, hoehe - erste);
    const weitere = schicht > 0 ? Math.ceil(rest / schicht) : 0;
    const schichten = hoehe > 0 ? weitere + 1 : 0;
    const belichtungGesamt = schichten * belichtung;
    return [
      { label: 'Anzahl Schichten', value: schichten, unit: '', digits: 0, primary: true },
      { label: 'Belichtungszeit gesamt', value: belichtungGesamt, unit: 's', digits: 0, help: 'Nur SLA/MSLA, ohne Lift-Zeiten.' },
    ];
  },
  intro:
    'Die Schichtanzahl ergibt sich, indem man die Objekthöhe durch die Schichthöhe teilt – wobei die erste Schicht oft eine eigene, dickere Höhe für bessere Betthaftung hat. Diese Kennzahl ist beim FDM-Druck ein Maß für Risiko und Detailgrad und beim SLA-/MSLA-Druck der direkte Treiber der Druckzeit, da jede Schicht einzeln belichtet wird. Mit der optionalen Belichtungszeit schätzt der Rechner zusätzlich die reine Belichtungsdauer eines Harzdrucks.',
  howto: [
    'Höhe des Objekts in mm eintragen (Z-Maß im Slicer oder CAD).',
    'Gewünschte Schichthöhe wählen (z. B. 0,2 mm Standard, 0,05 mm für SLA).',
    'Höhe der ersten Schicht angeben – bei FDM oft 0,2–0,3 mm, bei SLA gleich der normalen Schicht.',
    'Bei Harzdruck die Belichtungszeit je Schicht ergänzen, um die Gesamtbelichtung zu schätzen.',
  ],
  faq: [
    { q: 'Warum die erste Schicht getrennt rechnen?', a: 'Sie wird häufig dicker eingestellt, damit das Teil besser am Bett haftet. Diese Höhe geht nicht mehr in die normale Schichthöhe ein.' },
    { q: 'Wird auf- oder abgerundet?', a: 'Es wird aufgerundet: Auch eine angebrochene letzte Schicht muss vollständig gedruckt werden, sonst fehlt Material an der Oberkante.' },
    { q: 'Wie hängt das mit der Druckzeit zusammen?', a: 'Bei SLA/MSLA bestimmt fast nur die Schichtzahl die Zeit, weil je Schicht belichtet und gehoben wird. Bei FDM hängt die Zeit zusätzlich stark vom Volumen ab.' },
    { q: 'Mehr Schichten = bessere Qualität?', a: 'Geringere Schichthöhe (mehr Schichten) glättet Rundungen und schräge Flächen, verlängert aber die Druckzeit deutlich. Es ist ein Kompromiss aus Optik und Tempo.' },
  ],
  related: ['druckzeit-schaetzung', 'max-volumenstrom', 'resin-kosten'],
  updated: '2026-06-16',
  examples: [
    {
      values: { hoehe: 40, schicht: 0.2, erste: 0.2, belichtung: 0 },
      expect: [
        { label: 'Anzahl Schichten', value: 200, tolerance: 0 },
      ],
    },
    {
      values: { hoehe: 50, schicht: 0.05, erste: 0.05, belichtung: 2.5 },
      expect: [
        { label: 'Anzahl Schichten', value: 1000, tolerance: 0 },
        { label: 'Belichtungszeit gesamt', value: 2500, tolerance: 0 },
      ],
    },
  ],
};
