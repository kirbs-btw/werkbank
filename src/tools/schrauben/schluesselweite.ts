import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

// Schlüsselweite SW (Maulweite) für Sechskantschrauben/-muttern.
// neu = aktuelle Reihe nach DIN EN ISO 4017 / 4032,
// alt = ältere DIN 931/934 Reihe (noch häufig im Bestand).
const TABLE: Record<string, { sw: number; swAlt: number }> = {
  M3: { sw: 5.5, swAlt: 5.5 },
  M4: { sw: 7, swAlt: 7 },
  M5: { sw: 8, swAlt: 8 },
  M6: { sw: 10, swAlt: 10 },
  M8: { sw: 13, swAlt: 13 },
  M10: { sw: 16, swAlt: 17 },
  M12: { sw: 18, swAlt: 19 },
  M14: { sw: 21, swAlt: 22 },
  M16: { sw: 24, swAlt: 24 },
  M20: { sw: 30, swAlt: 30 },
};

export const tool: Tool = {
  slug: 'schluesselweite',
  category: 'schrauben',
  title: 'Schlüsselweite SW je Schraubengröße (Sechskant)',
  shortTitle: 'Schlüsselweite',
  description:
    'Finde die Schlüsselweite SW von Sechskantschrauben und -muttern M3 bis M20 — neue Reihe nach DIN EN ISO und alte DIN-Reihe im Vergleich.',
  keywords: [
    'schlüsselweite tabelle',
    'sw schraube',
    'maulweite sechskant',
    'schlüsselweite m8',
    'gabelschlüssel größe schraube',
    'sw nach gewinde',
    'sechskant schlüsselweite din',
  ],
  formula: 'Lookup SW nach DIN EN ISO 4017/4032 (neu) bzw. DIN 931/934 (alt)',
  inputs: [
    {
      type: 'select', id: 'gewinde', label: 'Gewinde', default: 'M8',
      options: [
        { value: 'M3', label: 'M3' },
        { value: 'M4', label: 'M4' },
        { value: 'M5', label: 'M5' },
        { value: 'M6', label: 'M6' },
        { value: 'M8', label: 'M8' },
        { value: 'M10', label: 'M10' },
        { value: 'M12', label: 'M12' },
        { value: 'M14', label: 'M14' },
        { value: 'M16', label: 'M16' },
        { value: 'M20', label: 'M20' },
      ],
      help: 'Standard-Sechskant; bei dünnen Köpfen oder Sonderformen abweichend.',
    },
  ],
  compute: (v) => {
    const key = String(v.gewinde);
    const row = TABLE[key] ?? TABLE.M8;
    return [
      { label: 'Schlüsselweite SW (neu)', value: row.sw, unit: 'mm', digits: 0, primary: true },
      { label: 'Schlüsselweite SW (alt)', value: row.swAlt, unit: 'mm', digits: 0 },
    ];
  },
  intro:
    'Die Schlüsselweite SW ist der Abstand zwischen zwei parallelen Flächen eines Sechskantkopfes und bestimmt, welcher Gabel-, Ring- oder Steckschlüssel passt. Mit der Umstellung auf DIN EN ISO 4017 und 4032 wurden einige Schlüsselweiten geändert: M10 erhielt SW 16 statt 17 und M12 erhielt SW 18 statt 19. Wer altes und neues Material mischt, braucht beide Werte, um nicht mit dem falschen Schlüssel anzusetzen.',
  howto: [
    'Gewindegröße der Schraube oder Mutter wählen.',
    'Schlüsselweite SW der neuen Reihe ablesen — der Standard bei aktuellem Material.',
    'Bei älteren Schrauben den Wert der alten Reihe prüfen (z. B. M10 SW 17).',
    'Passenden Schlüssel oder die richtige Steckschlüssel-Nuss auswählen.',
  ],
  faq: [
    { q: 'Warum hat meine M10 mal SW 16, mal SW 17?', a: 'Mit Einführung der Normen DIN EN ISO 4017/4032 wurde die Schlüsselweite für M10 von 17 auf 16 mm reduziert, bei M12 von 19 auf 18 mm. Beide Varianten sind im Umlauf, deshalb zeigt der Rechner beide Werte.' },
    { q: 'Gilt die SW auch für die passende Mutter?', a: 'Ja, Sechskantmuttern nach DIN EN ISO 4032 haben dieselbe Schlüsselweite wie die zugehörigen Schrauben. Bei niedrigen Muttern oder Sonderformen kann es abweichen.' },
    { q: 'Was ist mit Innensechskantschrauben?', a: 'Bei Zylinderkopf-Innensechskant (Inbus) zählt nicht die SW, sondern die Schlüsselweite des Innensechskants, z. B. 6 mm bei M8. Dieser Rechner gilt für außenliegende Sechskante.' },
    { q: 'Passt ein Zollschlüssel auf metrische SW?', a: 'Nur näherungsweise. Ein 1/2-Zoll-Schlüssel misst 12,7 mm und sitzt oft zu locker oder zu stramm. Für saubere Kraftübertragung sollte der metrische Schlüssel verwendet werden.' },
  ],
  related: ['metrisches-gewinde-tabelle', 'anzugsmoment'],
  updated: '2026-06-16',
  examples: [
    { values: { gewinde: 'M8' }, expect: [{ label: 'Schlüsselweite SW (neu)', value: 13, tolerance: 0.01 }] },
    { values: { gewinde: 'M10' }, expect: [{ label: 'Schlüsselweite SW (alt)', value: 17, tolerance: 0.01 }] },
  ],
};
