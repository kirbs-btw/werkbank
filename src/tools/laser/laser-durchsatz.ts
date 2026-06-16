import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-durchsatz',
  category: 'laser',
  title: 'Laser-Durchsatz Rechner (Teile pro Stunde)',
  shortTitle: 'Durchsatz',
  description:
    'Berechne den Durchsatz einer Laseranlage in Teilen pro Stunde aus Zykluszeit pro Teil, Teilen pro Platte und Be-/Entladezeit je Plattenwechsel.',
  keywords: [
    'laser durchsatz berechnen',
    'teile pro stunde laser',
    'laser taktzeit rechner',
    'laserschneiden produktivität',
    'stückzahl pro stunde laser',
    'laser kapazität planen',
  ],
  formula:
    'Zeit pro Platte = Teile/Platte × Zykluszeit + Wechselzeit;  Durchsatz = Teile/Platte ÷ Zeit pro Platte × 60',
  inputs: [
    { type: 'number', id: 'zyklus', label: 'Zykluszeit pro Teil', unit: 'min', default: 1.5, min: 0, step: 0.1, help: 'Schneid- bzw. Gravurzeit eines einzelnen Teils.' },
    { type: 'number', id: 'proPlatte', label: 'Teile pro Platte', unit: 'Stk', default: 12, min: 1, step: 1, help: 'Wie viele Teile auf eine Materialplatte geschachtelt werden.' },
    { type: 'number', id: 'wechsel', label: 'Be-/Entladezeit je Platte', unit: 'min', default: 3, min: 0, step: 0.5, help: 'Platte entnehmen, neue einlegen, Teile aussortieren.' },
  ],
  compute: (v) => {
    const zyklus = num(v.zyklus);
    const proPlatte = num(v.proPlatte, 1);
    const wechsel = num(v.wechsel);
    const zeitPlatte = proPlatte * zyklus + wechsel;
    const durchsatz = zeitPlatte > 0 ? (proPlatte / zeitPlatte) * 60 : 0;
    const taktSek = durchsatz > 0 ? 3600 / durchsatz : 0;
    return [
      { label: 'Durchsatz', value: durchsatz, unit: 'Teile/h', digits: 1, primary: true },
      { label: 'Effektive Taktzeit je Teil', value: taktSek, unit: 's', digits: 0 },
      { label: 'Zeit pro Platte', value: zeitPlatte, unit: 'min', digits: 2 },
    ];
  },
  intro:
    'Der Durchsatz einer Laseranlage misst, wie viele fertige Teile pro Stunde tatsächlich entstehen. Entscheidend ist nicht nur die reine Schneidzeit eines Teils, sondern auch das Be- und Entladen der Platten: Bei kleinen Losgrößen kann der Plattenwechsel die Produktivität spürbar drücken. Dieser Rechner kombiniert Zykluszeit, Schachtelung und Wechselzeit zu einer realistischen Stundenleistung – die Basis für Liefertermine und Kapazitätsplanung.',
  howto: [
    'Zykluszeit pro Teil eintragen (Schneid- oder Gravurzeit eines einzelnen Teils).',
    'Teile pro Platte eintragen – also wie viele Teile aus einer Materialtafel geschachtelt werden.',
    'Be-/Entladezeit je Plattenwechsel eintragen (Platte raus, neue rein, Teile sortieren).',
    'Durchsatz in Teilen pro Stunde und die effektive Taktzeit pro Teil ablesen.',
  ],
  faq: [
    { q: 'Warum ist der Durchsatz niedriger als 60 / Zykluszeit?', a: 'Weil zwischen zwei Platten Stillstandzeit für das Be- und Entladen entsteht. Diese Nebenzeit verteilt sich auf alle Teile einer Platte und senkt die effektive Stundenleistung.' },
    { q: 'Wie hebe ich den Durchsatz?', a: 'Mehr Teile pro Platte (bessere Schachtelung) verteilt die Wechselzeit auf mehr Stück. Auch kürzere Rüst- und Wechselzeiten, eine automatische Be-/Entladung oder ein Wechseltisch erhöhen die Produktivität deutlich.' },
    { q: 'Was ist die effektive Taktzeit?', a: 'Sie gibt an, wie viele Sekunden im Schnitt zwischen zwei fertigen Teilen liegen – inklusive anteiliger Wechselzeit. 3600 geteilt durch den Durchsatz ergibt diesen Wert.' },
    { q: 'Berücksichtigt der Rechner Maschinenstörungen?', a: 'Nein, er rechnet mit störungsfreiem Betrieb. Für eine konservative Planung kannst du eine Anlagenverfügbarkeit von z. B. 85 % ansetzen und den Durchsatz entsprechend reduzieren.' },
  ],
  related: ['laser-schnittzeit', 'laser-schnittkosten', 'laser-gravur-zeit'],
  updated: '2026-06-16',
  examples: [
    { values: { zyklus: 1.5, proPlatte: 12, wechsel: 3 }, expect: [{ label: 'Durchsatz', value: 34.29, tolerance: 0.1 }] },
    { values: { zyklus: 2, proPlatte: 10, wechsel: 0 }, expect: [{ label: 'Durchsatz', value: 30, tolerance: 0.1 }] },
  ],
};
