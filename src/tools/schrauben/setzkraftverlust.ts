import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'setzkraftverlust',
  category: 'schrauben',
  title: 'Vorspannkraftverlust durch Setzen (Setzbetrag)',
  shortTitle: 'Setzkraftverlust',
  description:
    'Berechne den Vorspannkraftverlust einer Schraube durch Setzen aus Setzbetrag und Nachgiebigkeit nach VDI 2230 samt Restvorspannkraft.',
  keywords: [
    'setzkraftverlust berechnen',
    'vorspannkraftverlust setzen',
    'setzbetrag schraube',
    'restvorspannkraft',
    'vdi 2230 setzen',
    'schraube setzverlust',
    'klemmkraftverlust setzen',
  ],
  formula: 'F_Z = f_Z / (δ_S + δ_P),  F_rest = F_V − F_Z',
  inputs: [
    { type: 'number', id: 'fv', label: 'Montagevorspannkraft F_V', unit: 'N', default: 20000, min: 0, step: 500 },
    { type: 'number', id: 'fz', label: 'Setzbetrag f_Z', unit: 'µm', default: 11, min: 0, step: 1, help: 'Summe der Setzbeträge in Gewinde, Kopf- und Trennfugen, typ. 3–15 µm.' },
    { type: 'number', id: 'ds', label: 'Nachgiebigkeit Schraube δ_S', unit: 'µm/kN', default: 6.5, min: 0.01, step: 0.1, help: 'Elastische Nachgiebigkeit der Schraube.' },
    { type: 'number', id: 'dp', label: 'Nachgiebigkeit Bauteile δ_P', unit: 'µm/kN', default: 1.5, min: 0.01, step: 0.1, help: 'Nachgiebigkeit der verspannten Teile, meist deutlich kleiner.' },
  ],
  compute: (v) => {
    const fv = num(v.fv);
    const fzMicro = num(v.fz); // µm
    const ds = num(v.ds); // µm/kN
    const dp = num(v.dp); // µm/kN
    const sum = ds + dp; // µm/kN
    // F_Z = f_Z / (δ_S + δ_P); Ergebnis in kN, dann in N
    const fzKN = sum > 0 ? fzMicro / sum : 0; // kN
    const fzN = fzKN * 1000; // N
    const fRest = fv - fzN;
    const verlustProz = fv > 0 ? (fzN / fv) * 100 : 0;
    return [
      { label: 'Vorspannkraftverlust F_Z', value: fzN, unit: 'N', digits: 0, primary: true },
      { label: 'Vorspannkraftverlust', value: fzKN, unit: 'kN', digits: 2 },
      { label: 'Verlust in Prozent', value: verlustProz, unit: '%', digits: 1 },
      { label: 'Restvorspannkraft F_rest', value: fRest, unit: 'N', digits: 0, help: 'Verbleibende Klemmkraft nach dem Setzen.' },
    ];
  },
  intro:
    'Nach der Montage glätten sich winzige Oberflächenrauheiten in Gewinde, Kopfauflage und Trennfugen, die Verbindung setzt sich um wenige Mikrometer. Dieser Setzbetrag f_Z reduziert die Vorspannkraft, weil sich Schraube und Bauteile entspannen. Nach VDI 2230 berechnet sich der Verlust aus dem Setzbetrag geteilt durch die Summe der Nachgiebigkeiten von Schraube und Bauteilen: F_Z = f_Z / (δ_S + δ_P). Bei kurzen, steifen Schrauben fällt der Verlust prozentual besonders hoch aus.',
  howto: [
    'Montagevorspannkraft F_V eintragen.',
    'Setzbetrag f_Z schätzen — je nach Fugenzahl und Rauheit typisch 3 bis 15 µm.',
    'Nachgiebigkeiten von Schraube δ_S und Bauteilen δ_P angeben.',
    'Vorspannkraftverlust F_Z und Restvorspannkraft ablesen.',
  ],
  faq: [
    { q: 'Warum verliert eine Schraube durch Setzen Kraft?', a: 'Die rauen Kontaktflächen plätten sich unter Last leicht ab. Diese kleine Längenänderung entspannt das elastisch gedehnte System aus Schraube und Bauteilen, wodurch die Klemmkraft sinkt – auch ohne äußere Last.' },
    { q: 'Wie groß ist der Setzbetrag typisch?', a: 'Nach VDI 2230 etwa 3 µm je Gewinde, plus rund 3 µm je Kopf- und Trennfuge. In Summe liegen viele Verbindungen bei 6 bis 15 µm, abhängig von Rauheit und Anzahl der Fugen.' },
    { q: 'Warum sind lange Schrauben günstiger?', a: 'Lange, schlanke Schrauben haben eine hohe Nachgiebigkeit δ_S. Der gleiche Setzbetrag verteilt sich dann auf mehr elastische Dehnung, sodass der prozentuale Kraftverlust kleiner ausfällt. Deshalb nutzt man Dehnschrauben.' },
    { q: 'Wie beuge ich dem Verlust vor?', a: 'Durch Nachziehen nach kurzer Betriebszeit, glatte Auflageflächen, wenige Trennfugen und nachgiebige Dehnschrauben. Schon bei der Montage wird der Setzverlust als Zuschlag auf die Vorspannkraft eingeplant.' },
  ],
  related: ['schraube-laengung', 'max-vorspannkraft', 'vorspannkraft'],
  updated: '2026-06-16',
  examples: [
    { values: { fv: 20000, fz: 11, ds: 6.5, dp: 1.5 }, expect: [{ label: 'Vorspannkraftverlust F_Z', value: 1375, tolerance: 2 }] },
    { values: { fv: 20000, fz: 11, ds: 6.5, dp: 1.5 }, expect: [{ label: 'Restvorspannkraft F_rest', value: 18625, tolerance: 2 }] },
  ],
};
