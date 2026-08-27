import type { Tool, ToolResult } from '../../lib/types';
import { num } from '../../lib/types';
import { e12, ohmText, stellen } from '../../lib/elektro';

const LN2 = Math.LN2; // 0,6931… – Laden von ⅓ auf ⅔ der Betriebsspannung
const LN3 = Math.log(3); // 1,0986… – Laden von 0 auf ⅔ beim Monoflop

/** Die Widerstände stehen hier in kΩ, `ohmText` erwartet Ohm. */
const ohm = (kOhm: number): string => ohmText(kOhm * 1000);

export const tool: Tool = {
  slug: 'ne555-rechner',
  category: 'elektronik',
  title: 'NE555 berechnen: Frequenz, Zeit & Tastverhältnis',
  shortTitle: 'NE555-Rechner',
  description:
    'Berechne den NE555 als astabilen Oszillator oder Monoflop: Frequenz, Periodendauer, High- und Low-Zeit, Tastverhältnis – samt Bauteilwerten aus der E12-Reihe.',
  keywords: [
    'ne555 astabil berechnen',
    'ne555 oszillator rechner',
    '555 timer astabil rechner',
    'ne555 monoflop berechnen',
    'ne555 frequenz berechnen',
    '555 tastverhältnis berechnen',
    'ne555 blinker berechnen',
    'timer ic 555 formel',
  ],
  formula:
    'astabil: f = 1 / (ln2 · (R1 + 2·R2) · C);  mit Diode: f = 1 / (ln2 · (R1 + R2) · C);  monostabil: t = ln3 · R1 · C',
  inputs: [
    {
      type: 'select',
      id: 'art',
      label: 'Betriebsart',
      default: 'astabil',
      help: 'Astabil schwingt dauerhaft, monostabil gibt je Auslösung genau einen Impuls.',
      options: [
        { value: 'astabil', label: 'Astabil – Oszillator (Standard)' },
        { value: 'diode', label: 'Astabil mit Diode über R2' },
        { value: 'mono', label: 'Monostabil – Monoflop' },
      ],
    },
    {
      type: 'number', id: 'r1', label: 'R1', unit: 'kΩ', default: 4.7, min: 0.1, step: 0.1,
      help: 'Von Betriebsspannung zu Pin 7. Beim Monoflop der einzige Zeitwiderstand.',
    },
    {
      type: 'number', id: 'r2', label: 'R2', unit: 'kΩ', default: 68, min: 0.1, step: 1,
      help: 'Von Pin 7 zu Pin 6/2. Beim Monoflop ohne Wirkung.',
    },
    { type: 'number', id: 'c', label: 'Kondensator C', default: 10, min: 0.001, step: 1 },
    {
      type: 'select',
      id: 'ceinheit',
      label: 'Einheit von C',
      default: 'u',
      options: [
        { value: 'n', label: 'nF – Nanofarad' },
        { value: 'u', label: 'µF – Mikrofarad' },
      ],
    },
  ],
  compute: (v) => {
    const art = String(v.art ?? 'astabil');
    const r1k = Math.max(0.001, num(v.r1, 4.7));
    const r2k = Math.max(0.001, num(v.r2, 68));
    const r1 = r1k * 1000;
    const r2 = r2k * 1000;
    const c = Math.max(1e-15, num(v.c, 10)) * (String(v.ceinheit ?? 'u') === 'n' ? 1e-9 : 1e-6);

    // Bauteilwerte, die der 555 selbst nicht mehr sauber bedient. Beides sind
    // Erfahrungsgrenzen, keine Datenblatt-Absolutwerte – deshalb Hinweis, nicht
    // Fehler: Die Rechnung stimmt weiterhin, nur die Schaltung wird unzuverlässig.
    const warnungen: string[] = [];
    if (r1k < 1) warnungen.push('R1 unter 1 kΩ überlastet den Entladetransistor an Pin 7.');
    if (r1k + r2k > 10_000) warnungen.push('Über 10 MΩ bestimmen Leckströme das Ergebnis mehr als die Bauteile.');

    if (art === 'mono') {
      // Monoflop: C lädt über R1 von 0 auf ⅔ Vcc, dann kippt der Ausgang zurück.
      // R2 spielt keine Rolle – deshalb steht hier auch keine Frequenz.
      const t = LN3 * r1 * c;
      const tE12 = LN3 * e12(r1k) * 1000 * c;
      return [
        {
          label: 'Impulsdauer', value: t * 1000, unit: 'ms', digits: stellen(t * 1000), primary: true,
          help: warnungen.join(' ') || 'Länge des Ausgangsimpulses nach einer Auslösung an Pin 2.',
        },
        { label: 'Impulsdauer in Sekunden', value: t, unit: 's', digits: stellen(t) },
        {
          label: 'Mit E12-Bauteilen', value: tE12 * 1000, unit: 'ms', digits: stellen(tE12 * 1000),
          help: `mit R1 = ${ohm(e12(r1k))} – so ist es kaufbar`,
        },
        {
          label: 'Auslöseimpuls höchstens', value: (t * 1000) / 4, unit: 'ms', digits: stellen((t * 1000) / 4),
          help: 'Der Trigger an Pin 2 muss kürzer sein als der Ausgangsimpuls, sonst bleibt der Ausgang hängen.',
        },
      ];
    }

    // Astabil: C pendelt zwischen ⅓ und ⅔ Vcc. Geladen wird über R1 + R2,
    // entladen nur über R2 – daher ist die High-Zeit immer die längere.
    // Die Diode über R2 überbrückt R2 beim Laden, dann zählt nur noch R1.
    const mitDiode = art === 'diode';
    const rHigh = mitDiode ? r1 : r1 + r2;
    const tHigh = LN2 * rHigh * c;
    const tLow = LN2 * r2 * c;
    const T = tHigh + tLow;
    const f = 1 / T;
    const tastverhaeltnis = (tHigh / T) * 100;

    // Dieselbe Rechnung mit kaufbaren Widerständen: Was am Ende auf dem
    // Steckbrett steckt, ist nie der krumme Wunschwert.
    const r1E12 = e12(r1k) * 1000;
    const r2E12 = e12(r2k) * 1000;
    const fE12 = 1 / (LN2 * (mitDiode ? r1E12 + r2E12 : r1E12 + 2 * r2E12) * c);

    if (!mitDiode) {
      warnungen.push(
        'Im Standardaufbau liegt das Tastverhältnis immer über 50 % – für weniger braucht es die Diode über R2.',
      );
    }

    const ergebnisse: ToolResult[] = [
      {
        label: 'Frequenz', value: f, unit: 'Hz', digits: stellen(f), primary: true,
        help: warnungen.join(' ') || undefined,
      },
      { label: 'Periodendauer', value: T * 1000, unit: 'ms', digits: stellen(T * 1000) },
      {
        label: 'Ausgang high', value: tHigh * 1000, unit: 'ms', digits: stellen(tHigh * 1000),
        help: mitDiode ? 'lädt über R1 (Diode überbrückt R2)' : 'lädt über R1 + R2',
      },
      {
        label: 'Ausgang low', value: tLow * 1000, unit: 'ms', digits: stellen(tLow * 1000),
        help: 'entlädt über R2 nach Pin 7',
      },
      { label: 'Tastverhältnis', value: tastverhaeltnis, unit: '%', digits: 1 },
      {
        label: 'Mit E12-Bauteilen', value: fE12, unit: 'Hz', digits: stellen(fE12),
        help: `mit R1 = ${ohm(e12(r1k))} und R2 = ${ohm(e12(r2k))} – so ist es kaufbar`,
      },
    ];
    return ergebnisse;
  },
  intro:
    'Der NE555 ist seit 1972 im Handel und steckt bis heute in Blinkern, Zeitrelais und Tongeneratoren. Seine Zeiten hängen an nur drei Bauteilen: zwei Widerständen und einem Kondensator. Der Kondensator lädt sich über R1 und R2 auf zwei Drittel der Betriebsspannung auf, entlädt sich dann über R2 allein auf ein Drittel – und von vorn. Weil der Ladeweg länger ist als der Entladeweg, ist der Ausgang im Standardaufbau immer länger high als low. Bemerkenswert daran: Die Betriebsspannung kürzt sich vollständig heraus. Ob der Baustein an 5 V oder an 15 V hängt, ändert an der Frequenz nichts.',
  howto: [
    'Betriebsart wählen: astabil für einen Dauertakt, monostabil für einen einzelnen Impuls je Auslösung.',
    'R1 eintragen – der Widerstand von der Betriebsspannung zu Pin 7.',
    'R2 eintragen – von Pin 7 zu den zusammengeschalteten Pins 6 und 2. Beim Monoflop entfällt er.',
    'Kondensator angeben und die Einheit umschalten; Elkos ab 1 µF, Folie und Keramik darunter.',
    'Die Zeile „Mit E12-Bauteilen" ansehen: Sie zeigt, was mit kaufbaren Werten wirklich herauskommt.',
  ],
  faq: [
    {
      q: 'Warum komme ich im Standardaufbau nie unter 50 % Tastverhältnis?',
      a: 'Weil der Ladestrom durch R1 und R2 fließt, der Entladestrom aber nur durch R2. Der Ladeweg ist damit zwangsläufig der höherohmige, die High-Zeit also immer die längere. Selbst mit einem winzigen R1 nähert man sich nur asymptotisch 50 % an. Wer darunter will, legt eine Diode parallel zu R2 (Kathode Richtung Pin 6/2): Dann lädt der Kondensator an R2 vorbei, und das Tastverhältnis wird R1 / (R1 + R2) – jeder Wert ist möglich. Diese Variante steht hier als eigene Betriebsart.',
    },
    {
      q: 'Wo kommt der Faktor 0,693 her?',
      a: 'Das ist der natürliche Logarithmus von 2. Der Kondensator pendelt zwischen einem Drittel und zwei Dritteln der Betriebsspannung – die Ladekurve braucht dafür genau ln(2) Zeitkonstanten, unabhängig von der Spannung. Beim Monoflop startet der Kondensator dagegen bei null und läuft bis zwei Drittel, das sind ln(3) ≈ 1,0986 Zeitkonstanten. Die oft zitierten 1,1 · R · C sind nichts anderes als dieser Wert, gerundet.',
    },
    {
      q: 'Spielt die Betriebsspannung wirklich keine Rolle?',
      a: 'Für die Zeiten nicht: Die Schaltschwellen liegen bei einem und zwei Dritteln der Betriebsspannung, und die Ladekurve skaliert genauso mit. Beides kürzt sich heraus. Für alles andere sehr wohl – der Entladestrom an Pin 7 steigt mit der Spannung, und der Ausgang kann je nach Bauform 200 mA treiben. Ein CMOS-Typ wie der TLC555 oder ICM7555 zieht deutlich weniger Strom, verträgt hochohmigere Zeitglieder und erzeugt beim Umschalten keine Stromspitze – ansonsten rechnet er identisch.',
    },
    {
      q: 'Welche Bauteilwerte sind sinnvoll?',
      a: 'R1 sollte mindestens 1 kΩ betragen, sonst muss der Entladetransistor an Pin 7 zu viel Strom aufnehmen. Nach oben ist bei etwa 10 MΩ Schluss: Darüber sind die Leckströme des Kondensators und des Bausteins größer als der Ladestrom, und die Zeiten werden unvorhersehbar. Bei langen Zeiten kommt hinzu, dass Elektrolytkondensatoren gern 20 % Toleranz haben – die Rechnung ist dann genauer als die Schaltung.',
    },
    {
      q: 'Warum weicht meine gemessene Frequenz ab?',
      a: 'Meist an den Toleranzen: Kohleschichtwiderstände liegen bei 5 %, Elkos bei 20 % und driften zusätzlich mit der Temperatur. Zehn Prozent Abweichung sind damit völlig normal. Wenn es exakt sein muss, nimmt man einen Folienkondensator und stellt R2 mit einem Trimmpoti ein. Grob daneben liegt es meist an Pin 5: Der Steuereingang gehört über 10 nF auf Masse, sonst koppeln Störungen direkt auf die Schaltschwelle.',
    },
  ],
  related: ['stepper-vref-strom', 'stromkosten-3d-druck', 'maschinenstundensatz-3d-druck'],
  updated: '2026-08-27',
  examples: [
    {
      // Klassischer Blinker: rund 1 Hz aus kaufbaren Werten
      values: { art: 'astabil', r1: 4.7, r2: 68, c: 10, ceinheit: 'u' },
      expect: [
        { label: 'Frequenz', value: 1.0254, tolerance: 0.001 },
        { label: 'Periodendauer', value: 975.26, tolerance: 0.05 },
        { label: 'Tastverhältnis', value: 51.67, tolerance: 0.02 },
      ],
    },
    {
      // R1 = R2: Laden über 2R, Entladen über R → exakt ⅔ Tastverhältnis
      values: { art: 'astabil', r1: 1, r2: 1, c: 1, ceinheit: 'u' },
      expect: [
        { label: 'Ausgang high', value: 1.386294, tolerance: 1e-5 },
        { label: 'Ausgang low', value: 0.693147, tolerance: 1e-5 },
        { label: 'Tastverhältnis', value: 66.667, tolerance: 0.01 },
      ],
    },
    {
      // Mit Diode und gleichen Widerständen: genau 50 %
      values: { art: 'diode', r1: 10, r2: 10, c: 100, ceinheit: 'n' },
      expect: [
        { label: 'Tastverhältnis', value: 50, tolerance: 1e-9 },
        { label: 'Frequenz', value: 721.35, tolerance: 0.01 },
      ],
    },
    {
      // Monoflop: t = ln3 · R · C = 1,0986 · 10k · 100µ
      values: { art: 'mono', r1: 10, r2: 68, c: 100, ceinheit: 'u' },
      expect: [
        { label: 'Impulsdauer', value: 1098.61, tolerance: 0.05 },
        { label: 'Impulsdauer in Sekunden', value: 1.09861, tolerance: 1e-4 },
      ],
    },
  ],
};
