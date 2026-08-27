import type { Tool, ToolResult } from '../../lib/types';
import { num } from '../../lib/types';
import { belastbarkeit, e12, ohmText, skaliere, stellen } from '../../lib/elektro';

/** Welche zwei Größen der Nutzer vorgibt. Die anderen zwei folgen daraus. */
type Modus = 'ui' | 'ur' | 'up' | 'ir' | 'ip' | 'rp';

const MODI: Modus[] = ['ui', 'ur', 'up', 'ir', 'ip', 'rp'];

export const tool: Tool = {
  slug: 'ohmsches-gesetz',
  category: 'elektronik',
  title: 'Ohmsches Gesetz berechnen: U, I, R und P',
  shortTitle: 'Ohmsches Gesetz',
  description:
    'Zwei Größen eingeben, die anderen beiden fallen heraus: Spannung, Strom, Widerstand und Leistung – mit E12-Wert und nötiger Belastbarkeit des Widerstands.',
  keywords: [
    'ohmsches gesetz rechner',
    'ohmsches gesetz berechnen',
    'ohmsches gesetz online rechner',
    'spannung strom widerstand berechnen',
    'widerstand berechnen formel',
    'leistung berechnen strom spannung',
    'u = r mal i rechner',
    'vorwiderstand berechnen',
  ],
  formula: 'U = R · I;  P = U · I = I²·R = U²/R',
  inputs: [
    {
      type: 'select',
      id: 'gegeben',
      label: 'Bekannt sind',
      default: 'ur',
      help: 'Die beiden anderen Größen werden berechnet. Felder, die hier nicht vorkommen, bleiben ohne Wirkung.',
      options: [
        { value: 'ur', label: 'Spannung & Widerstand' },
        { value: 'ui', label: 'Spannung & Strom' },
        { value: 'up', label: 'Spannung & Leistung' },
        { value: 'ir', label: 'Strom & Widerstand' },
        { value: 'ip', label: 'Strom & Leistung' },
        { value: 'rp', label: 'Widerstand & Leistung' },
      ],
    },
    { type: 'number', id: 'u', label: 'Spannung U', unit: 'V', default: 5, min: 0, step: 0.1 },
    {
      type: 'number', id: 'i', label: 'Strom I', unit: 'A', default: 0.02, min: 0, step: 0.001,
      help: 'In Ampere. 20 mA sind 0,02 A.',
    },
    { type: 'number', id: 'r', label: 'Widerstand R', unit: 'Ω', default: 220, min: 0, step: 1 },
    {
      type: 'number', id: 'p', label: 'Leistung P', unit: 'W', default: 0.1, min: 0, step: 0.1,
      help: 'In Watt. 250 mW sind 0,25 W.',
    },
  ],
  compute: (v) => {
    const modus = (MODI as string[]).includes(String(v.gegeben)) ? (String(v.gegeben) as Modus) : 'ur';
    const uE = Math.max(0, num(v.u, 5));
    const iE = Math.max(0, num(v.i, 0.02));
    const rE = Math.max(0, num(v.r, 220));
    const pE = Math.max(0, num(v.p, 0.1));

    // Beide vorgegebenen Größen müssen größer als null sein: In jeder der sechs
    // Kombinationen steht mindestens eine von ihnen in einem Nenner oder unter
    // einer Wurzel. Bei null käme dort Unendlich heraus – und eine Unendlich-
    // Anzeige ist keine Antwort, sondern ein verstecktes „geht nicht".
    const vorgabe: Record<Modus, [number, number]> = {
      ui: [uE, iE], ur: [uE, rE], up: [uE, pE],
      ir: [iE, rE], ip: [iE, pE], rp: [rE, pE],
    };
    const gueltig = vorgabe[modus].every((x) => x > 0);

    let u = 0;
    let i = 0;
    let r = 0;
    let p = 0;
    if (gueltig) {
      if (modus === 'ui') { u = uE; i = iE; r = u / i; p = u * i; }
      else if (modus === 'ur') { u = uE; r = rE; i = u / r; p = (u * u) / r; }
      else if (modus === 'up') { u = uE; p = pE; i = p / u; r = (u * u) / p; }
      else if (modus === 'ir') { i = iE; r = rE; u = i * r; p = i * i * r; }
      else if (modus === 'ip') { i = iE; p = pE; u = p / i; r = p / (i * i); }
      else { r = rE; p = pE; u = Math.sqrt(p * r); i = Math.sqrt(p / r); }
    }

    // Welche zwei Größen hat der Nutzer selbst eingetragen? Die bekommen keinen
    // Hervorhebungsrahmen – hervorgehoben wird, was er nicht wusste.
    const istGegeben = (g: 'u' | 'i' | 'r' | 'p'): boolean => modus.includes(g);
    const ersteBerechnete = (['u', 'i', 'r', 'p'] as const).find((g) => !istGegeben(g));

    const hinweis = gueltig
      ? undefined
      : 'Beide vorgegebenen Größen müssen größer als null sein.';

    const zeile = (
      kuerzel: 'u' | 'i' | 'r' | 'p',
      label: string,
      wert: number,
      basis: string,
    ): ToolResult => {
      const s = skaliere(wert, basis);
      return {
        label,
        value: s.value,
        unit: s.unit,
        digits: stellen(s.value),
        primary: kuerzel === ersteBerechnete,
        help: !gueltig && kuerzel === ersteBerechnete
          ? hinweis
          : istGegeben(kuerzel)
            ? 'eingegeben'
            : undefined,
      };
    };

    const ergebnisse: ToolResult[] = [
      zeile('u', 'Spannung U', u, 'V'),
      zeile('i', 'Strom I', i, 'A'),
      zeile('r', 'Widerstand R', r, 'Ω'),
      zeile('p', 'Leistung P', p, 'W'),
    ];

    // Der E12-Wert hilft nur, wenn der Widerstand herauskam. Hat der Nutzer ihn
    // selbst eingetippt, weiß er ja bereits, welchen er in der Hand hält.
    /** Zahl samt passender Vorsatzeinheit als Fließtext, etwa „22,73 mA". */
    const alsText = (x: number, basis: string): string => {
      const s = skaliere(x, basis);
      return `${s.value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${s.unit}`;
    };

    if (!istGegeben('r') && gueltig) {
      const rE12 = e12(r);
      const s = skaliere(rE12, 'Ω');
      // Trifft der Rechenwert die Reihe zufällig genau, darf hier nicht
      // „150 Ω ist kaufbar, 150 Ω nicht" stehen. Passiert öfter als gedacht:
      // Die Lehrbuchbeispiele sind genau so gewählt, dass es aufgeht.
      const passtGenau = Math.abs(rE12 / r - 1) < 1e-9;
      ergebnisse.push({
        label: 'Nächster E12-Wert',
        value: s.value,
        unit: s.unit,
        digits: stellen(s.value),
        help: passtGenau
          ? 'Der Rechenwert steht genau so in der E12-Reihe – direkt kaufbar.'
          : `${ohmText(rE12)} ist kaufbar, ${ohmText(r)} nicht – damit fließen dann ${alsText(u / rE12, 'A')}.`,
      });
    }

    ergebnisse.push({
      label: 'Widerstand mindestens',
      value: belastbarkeit(p),
      unit: 'W',
      digits: 3,
      help: gueltig
        ? `Am Widerstand fallen ${alsText(p, 'W')} an. Mit Faktor 2 Reserve – an der Nenngrenze wird er über 100 °C heiß und driftet.`
        : undefined,
    });

    return ergebnisse;
  },
  intro:
    'Georg Simon Ohm veröffentlichte 1827 den Zusammenhang, der heute jede Schaltung trägt: Der Strom durch einen Leiter ist der anliegenden Spannung proportional, und der Proportionalitätsfaktor ist sein Widerstand. Kennt man zwei der vier Größen Spannung, Strom, Widerstand und Leistung, liegen die anderen beiden fest – es gibt keinen Fall, in dem man raten müsste. Dieser Rechner nimmt jede der sechs möglichen Kombinationen an und nennt zusätzlich das, was auf dem Papier gern vergessen wird: welchen Widerstand es wirklich zu kaufen gibt und wie viel Wärme er aushalten muss.',
  howto: [
    'Auswählen, welche beiden Größen du kennst.',
    'Die zugehörigen zwei Felder ausfüllen – die anderen bleiben ohne Wirkung.',
    'Ergebnis ablesen: Die beiden berechneten Größen stehen zwischen den eingegebenen.',
    'Bei berechnetem Widerstand die Zeile „Nächster E12-Wert" beachten – krumme Werte gibt es nicht zu kaufen.',
    'Belastbarkeit prüfen: Ein 0,25-W-Widerstand an 0,3 W wird heiß genug, um die Platine zu verfärben.',
  ],
  faq: [
    {
      q: 'Wie berechne ich den Vorwiderstand für eine LED?',
      a: 'Nicht mit der vollen Betriebsspannung, sondern mit dem Rest, der nach der LED übrig bleibt. Eine rote LED fällt rund 2 V ab; an 5 V bleiben also 3 V für den Widerstand. Mit 20 mA Wunschstrom wählst du hier „Spannung & Strom", trägst 3 V und 0,02 A ein und bekommst 150 Ω. Wer stattdessen 5 V einträgt, landet bei 250 Ω und wundert sich, dass die LED dunkler leuchtet als gedacht.',
    },
    {
      q: 'Warum reicht die Leistungsangabe auf dem Widerstand nicht aus?',
      a: 'Weil sie unter Laborbedingungen gilt – frei stehend, bei etwa 70 °C Umgebungstemperatur. In einem geschlossenen Gehäuse, dicht an anderen Bauteilen, bleibt davon spürbar weniger übrig. Dazu kommt: Ein Widerstand an seiner Nenngrenze wird über 100 °C heiß, driftet dabei im Wert und verfärbt mit der Zeit die Platine. Deshalb rechnet dieser Rechner mit Faktor 2 Reserve. Bei Dauerlast darf es gern mehr sein.',
    },
    {
      q: 'Was ist der Unterschied zwischen 0,25 W und 250 mW?',
      a: 'Keiner – es ist dieselbe Zahl in einer anderen Vorsatzeinheit. Milli bedeutet ein Tausendstel. Der Rechner schaltet die Einheit selbst um: Unter einem Watt zeigt er Milliwatt, unter einem Ampere Milliampere, ab tausend Ohm Kiloohm. Eingegeben wird immer in der Grundeinheit, also 0,02 statt 20 mA.',
    },
    {
      q: 'Gilt das Ohmsche Gesetz immer?',
      a: 'Nur für ohmsche Verbraucher, also für solche mit einem festen Widerstand: Drahtwiderstände, Heizwendeln, Kabel. Eine LED gehorcht ihm nicht – ihr Widerstand fällt mit steigender Spannung steil ab, weshalb sie ohne Vorwiderstand durchbrennt. Auch Glühlampen sind kalt deutlich niederohmiger als heiß. Und bei Wechselstrom kommen Blindwiderstände von Spulen und Kondensatoren hinzu, die vom Takt abhängen.',
    },
    {
      q: 'Warum werden alle vier Größen angezeigt, auch die eingegebenen?',
      a: 'Als Gegenprobe. Wer sich in einer Zehnerpotenz vertut, sieht es sofort: Wenn dort „5 kV" statt „5 V" steht, war die Eingabe falsch, nicht die Rechnung. Die eingegebenen Zeilen sind als solche gekennzeichnet, hervorgehoben wird nur, was du nicht wusstest.',
    },
  ],
  related: ['ne555-rechner', 'strombelastbarkeit-leiterquerschnitt', 'stepper-vref-strom'],
  updated: '2026-08-27',
  examples: [
    {
      // LED-Vorwiderstand an 5 V: 22,7 mA, gut 113 mW
      values: { gegeben: 'ur', u: 5, i: 0.02, r: 220, p: 0.1 },
      expect: [
        { label: 'Strom I', value: 22.7272, tolerance: 0.001 },
        { label: 'Leistung P', value: 113.636, tolerance: 0.01 },
        { label: 'Widerstand mindestens', value: 0.25, tolerance: 0 },
      ],
    },
    {
      // Der Lehrbuchfall: 12 V, 2 A → 6 Ω, 24 W
      values: { gegeben: 'ui', u: 12, i: 2, r: 220, p: 0.1 },
      expect: [
        { label: 'Widerstand R', value: 6, tolerance: 1e-9 },
        { label: 'Leistung P', value: 24, tolerance: 1e-9 },
        { label: 'Widerstand mindestens', value: 50, tolerance: 0 },
      ],
    },
    {
      // Rückwärts aus Widerstand und Leistung: U = √(P·R), I = √(P/R)
      values: { gegeben: 'rp', u: 5, i: 0.02, r: 100, p: 1 },
      expect: [
        { label: 'Spannung U', value: 10, tolerance: 1e-9 },
        { label: 'Strom I', value: 100, tolerance: 1e-9 },
      ],
    },
    {
      // Strom & Leistung: U = P/I, R = P/I²
      values: { gegeben: 'ip', u: 5, i: 0.5, r: 220, p: 6 },
      expect: [
        { label: 'Spannung U', value: 12, tolerance: 1e-9 },
        { label: 'Widerstand R', value: 24, tolerance: 1e-9 },
      ],
    },
  ],
};
