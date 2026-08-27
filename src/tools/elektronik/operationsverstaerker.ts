import type { Tool, ToolResult } from '../../lib/types';
import { num } from '../../lib/types';
import { e12, ohmText, skaliere, stellen } from '../../lib/elektro';

type Art = 'nicht' | 'invert' | 'folger';

/** Zahl samt passender Vorsatzeinheit als Fließtext, etwa „90,9 kHz". */
const alsText = (x: number, basis: string): string => {
  const s = skaliere(x, basis);
  return `${s.value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${s.unit}`;
};

export const tool: Tool = {
  slug: 'operationsverstaerker',
  category: 'elektronik',
  title: 'Operationsverstärker berechnen: Verstärkung & Bandbreite',
  shortTitle: 'Operationsverstärker',
  description:
    'Berechne Verstärkung, Ausgangsspannung, Eingangswiderstand und obere Grenzfrequenz für invertierende und nichtinvertierende OPV-Schaltungen – samt E12-Widerständen.',
  keywords: [
    'operationsverstärker verstärkung berechnen',
    'nichtinvertierender verstärker rechner',
    'invertierender verstärker berechnen',
    'opv verstärkung formel',
    'operationsverstärker rechner online',
    'verstärkung in db berechnen',
    'gain bandwidth product rechner',
    'spannungsfolger opv',
  ],
  formula:
    'nichtinvertierend: Vu = 1 + Rf/R1;  invertierend: Vu = −Rf/R1;  f_g = GBP / (1 + Rf/R1)',
  inputs: [
    {
      type: 'select',
      id: 'art',
      label: 'Grundschaltung',
      default: 'nicht',
      options: [
        { value: 'nicht', label: 'Nichtinvertierend' },
        { value: 'invert', label: 'Invertierend' },
        { value: 'folger', label: 'Spannungsfolger (Impedanzwandler)' },
      ],
    },
    {
      type: 'number', id: 'r1', label: 'R1', unit: 'kΩ', default: 10, min: 0.001, step: 1,
      help: 'Invertierend: vom Eingang zum Minus-Eingang. Nichtinvertierend: vom Minus-Eingang nach Masse.',
    },
    {
      type: 'number', id: 'rf', label: 'Rückkopplung Rf', unit: 'kΩ', default: 100, min: 0.001, step: 10,
      help: 'Vom Ausgang zurück auf den Minus-Eingang. Beim Spannungsfolger entfallen beide Widerstände.',
    },
    {
      type: 'number', id: 'uin', label: 'Eingangsspannung', unit: 'V', default: 0.1, min: 0, step: 0.01,
      help: '100 mV sind 0,1 V.',
    },
    {
      type: 'number', id: 'ub', label: 'Betriebsspannung', unit: '±V', default: 12, min: 0.1, step: 1,
      help: 'Gegen Masse gerechnet. Nur für die Aussteuergrenze – die Verstärkung hängt nicht daran.',
    },
    {
      type: 'number', id: 'gbp', label: 'Verstärkungs-Bandbreite-Produkt', unit: 'MHz', default: 1, min: 0.001, step: 0.5,
      help: 'Steht im Datenblatt als GBP oder GBW. TL072: 3 MHz, LM358: 0,7 MHz, µA741: 1 MHz.',
    },
  ],
  compute: (v) => {
    const art: Art = v.art === 'invert' ? 'invert' : v.art === 'folger' ? 'folger' : 'nicht';
    const r1k = Math.max(0.001, num(v.r1, 10));
    const rfk = Math.max(0.001, num(v.rf, 100));
    const uin = Math.max(0, num(v.uin, 0.1));
    const ub = Math.max(0.001, num(v.ub, 12));
    const gbp = Math.max(1, num(v.gbp, 1) * 1e6);

    const verhaeltnis = rfk / r1k;

    // Signalverstärkung: was am Ausgang ankommt.
    const vu = art === 'folger' ? 1 : art === 'invert' ? -verhaeltnis : 1 + verhaeltnis;

    // Rauschverstärkung: was die Gegenkopplung sieht. Beim invertierenden
    // Verstärker ist sie NICHT gleich der Signalverstärkung – und sie allein
    // bestimmt die Bandbreite. Ein Inverter mit Vu = −1 hat Rauschverstärkung 2
    // und damit nur die halbe Grenzfrequenz. Genau hier rechnen die meisten
    // Rechner im Netz falsch.
    const rauschVu = art === 'folger' ? 1 : 1 + verhaeltnis;
    const grenzfrequenz = gbp / rauschVu;

    const uoutIdeal = vu * uin;
    const uebersteuert = Math.abs(uoutIdeal) > ub;
    const uout = uebersteuert ? Math.sign(uoutIdeal) * ub : uoutIdeal;

    const db = 20 * Math.log10(Math.abs(vu));

    const warnungen: string[] = [];
    if (uebersteuert) {
      warnungen.push(
        `Der Ausgang würde ${alsText(Math.abs(uoutIdeal), 'V')} brauchen und wird bei ±${ub} V begrenzt – die Kuppen werden abgeschnitten.`,
      );
    }
    if (rfk > 1000) warnungen.push('Über 1 MΩ machen sich Eingangsruheströme und Rauschen bemerkbar.');

    const ergebnisse: ToolResult[] = [
      {
        label: 'Verstärkung',
        value: vu,
        unit: '×',
        digits: stellen(vu),
        primary: true,
        help: art === 'invert'
          ? 'Das Minuszeichen ist keine Rechenpanne: Der Ausgang läuft dem Eingang entgegen.'
          : art === 'folger'
            ? 'Der Spannungsfolger verstärkt nicht – er entkoppelt.'
            : undefined,
      },
      {
        label: 'Verstärkung in dB', value: db, unit: 'dB', digits: 2,
        help: 'Betrag, ohne Vorzeichen – Dezibel kennen keine Phasenlage.',
      },
      {
        label: 'Ausgangsspannung',
        value: skaliere(uout, 'V').value,
        unit: skaliere(uout, 'V').unit,
        digits: stellen(skaliere(uout, 'V').value),
        help: warnungen.join(' ') || undefined,
      },
    ];

    if (art === 'invert') {
      ergebnisse.push({
        label: 'Eingangswiderstand',
        value: skaliere(r1k * 1000, 'Ω').value,
        unit: skaliere(r1k * 1000, 'Ω').unit,
        digits: stellen(skaliere(r1k * 1000, 'Ω').value),
        help: 'Genau R1: Der Minus-Eingang liegt auf virtueller Masse, die Quelle sieht nur diesen Widerstand.',
      });
    } else {
      // Der Zusatz über den Impedanzwandler gehört nur zum Spannungsfolger.
      // Beim nichtinvertierenden Verstärker stand dort vorher ein Satz über
      // eine Schaltung, die der Leser gar nicht gewählt hat.
      ergebnisse.push({
        label: 'Eingangswiderstand',
        value: 'sehr hoch',
        help: art === 'folger'
          ? 'Das Signal geht direkt auf den Plus-Eingang – je nach Bauart Megaohm bis Teraohm. Genau dafür ist der Spannungsfolger da: Er belastet die Quelle nicht und heißt deshalb auch Impedanzwandler.'
          : 'Das Signal geht direkt auf den Plus-Eingang – je nach Bauart Megaohm bis Teraohm. Die Quelle wird also kaum belastet.',
      });
    }

    ergebnisse.push({
      label: 'Obere Grenzfrequenz',
      value: skaliere(grenzfrequenz, 'Hz').value,
      unit: skaliere(grenzfrequenz, 'Hz').unit,
      digits: stellen(skaliere(grenzfrequenz, 'Hz').value),
      help: art === 'invert'
        ? `Gerechnet mit der Rauschverstärkung ${rauschVu.toLocaleString('de-DE', { maximumFractionDigits: 2 })}, nicht mit ${Math.abs(vu).toLocaleString('de-DE', { maximumFractionDigits: 2 })} – beim Inverter sind das zwei verschiedene Zahlen.`
        : 'Dort ist die Verstärkung um 3 dB eingebrochen. Für saubere Signale mindestens Faktor 10 Luft lassen.',
    });

    if (art !== 'folger') {
      const r1E = e12(r1k) * 1000;
      const rfE = e12(rfk) * 1000;
      const vuE = art === 'invert' ? -(rfE / r1E) : 1 + rfE / r1E;
      ergebnisse.push({
        label: 'Mit E12-Widerständen',
        value: vuE,
        unit: '×',
        digits: stellen(vuE),
        help: `${ohmText(r1E)} und ${ohmText(rfE)} – so sind sie kaufbar`,
      });
    }

    return ergebnisse;
  },
  intro:
    'Ein Operationsverstärker verstärkt von sich aus hunderttausendfach – viel zu viel, um damit etwas anzufangen. Brauchbar wird er erst durch Gegenkopplung: Ein Teil des Ausgangs läuft auf den Minus-Eingang zurück, und plötzlich hängt die Verstärkung nur noch am Verhältnis zweier Widerstände. Der Baustein selbst kommt in der Formel nicht mehr vor. Genau das macht die Schaltung so berechenbar – und verführt dazu, zwei Grenzen zu übersehen: Der Ausgang kommt nie über die Betriebsspannung hinaus, und die Bandbreite schrumpft in dem Maß, in dem die Verstärkung wächst.',
  howto: [
    'Grundschaltung wählen. Nichtinvertierend verstärkt phasenrichtig und belastet die Quelle kaum, invertierend dreht das Signal um.',
    'R1 und Rf eintragen – nur ihr Verhältnis zählt, nicht ihre Größe. 1 kΩ bis 100 kΩ sind die übliche Gegend.',
    'Eingangsspannung angeben, um die Ausgangsspannung zu prüfen.',
    'Betriebsspannung eintragen: Der Rechner meldet, wenn der Ausgang anschlagen würde.',
    'GBP aus dem Datenblatt übernehmen und die Grenzfrequenz mit der höchsten Signalfrequenz vergleichen.',
  ],
  faq: [
    {
      q: 'Warum ist die Grenzfrequenz beim invertierenden Verstärker niedriger als erwartet?',
      a: 'Weil die Bandbreite nicht an der Signalverstärkung hängt, sondern an der Rauschverstärkung – und die ist beim Inverter eine andere Zahl. Ein invertierender Verstärker mit Vu = −1 (Rf = R1) hat die Rauschverstärkung 1 + Rf/R1 = 2. Bei 1 MHz GBP ergibt das 500 kHz, nicht 1 MHz. Der Grund: Die Gegenkopplung sieht das Verhältnis vom Ausgang zum Minus-Eingang, und dort teilen R1 und Rf unabhängig davon, wo das Signal eingespeist wird. Viele Rechner im Netz übergehen das.',
    },
    {
      q: 'Kommen wirklich nur die Widerstandsverhältnisse vor?',
      a: 'Für die Verstärkung ja, solange die Leerlaufverstärkung des Bausteins weit darüber liegt. Für alles andere nicht: Sehr kleine Widerstände belasten den Ausgang – unter 1 kΩ wird es bei vielen Typen eng. Sehr große machen die Eingangsruheströme sichtbar und rauschen; über 1 MΩ meldet der Rechner das. In der Praxis landet man deshalb fast immer zwischen 1 kΩ und 100 kΩ.',
    },
    {
      q: 'Was passiert, wenn der Ausgang die Betriebsspannung erreicht?',
      a: 'Er bleibt dort stehen und die Signalkuppen werden abgeschnitten – aus einem Sinus wird ein Rechteck mit runden Ecken. Dabei rechnet der Rechner noch großzügig: Reale Bausteine erreichen die Betriebsspannung nicht ganz. Ein TL072 bleibt gut 1,5 V darunter, ein µA741 rund 2 V. Nur Rail-to-Rail-Typen kommen auf wenige Millivolt heran. Wer die Aussteuergrenze wirklich braucht, zieht diese Reserve noch ab.',
    },
    {
      q: 'Wofür ist ein Spannungsfolger gut, wenn er nicht verstärkt?',
      a: 'Er trennt zwei Schaltungsteile voneinander. Sein Eingang belastet die Quelle praktisch nicht, sein Ausgang kann dagegen Strom liefern. Typischer Fall: ein hochohmiger Spannungsteiler oder ein Sensor, der zusammenbricht, sobald man ihn belastet. Dazwischen ein Spannungsfolger, und die Spannung bleibt stehen. Als Nebeneffekt hat er die volle Bandbreite des Bausteins – seine Rauschverstärkung ist 1.',
    },
    {
      q: 'Brauche ich eine symmetrische Versorgung?',
      a: 'Für Wechselspannungssignale um Masse herum ja, sonst wird die negative Halbwelle abgeschnitten. Mit einfacher Versorgung legt man den Plus-Eingang stattdessen über einen Spannungsteiler auf die halbe Betriebsspannung – dann schwingt das Signal um diesen künstlichen Nullpunkt. Der Rechner nimmt symmetrische Versorgung an; bei einfacher Versorgung ist die nutzbare Aussteuerung entsprechend die Hälfte.',
    },
  ],
  related: ['ohmsches-gesetz', 'ne555-rechner', 'stepper-vref-strom'],
  updated: '2026-08-27',
  examples: [
    {
      // Standardfall: 10k/100k nichtinvertierend → Vu = 11
      values: { art: 'nicht', r1: 10, rf: 100, uin: 0.1, ub: 12, gbp: 1 },
      expect: [
        { label: 'Verstärkung', value: 11, tolerance: 1e-9 },
        { label: 'Verstärkung in dB', value: 20.828, tolerance: 0.01 },
        { label: 'Ausgangsspannung', value: 1.1, tolerance: 1e-9 },
        { label: 'Obere Grenzfrequenz', value: 90.909, tolerance: 0.01 },
      ],
    },
    {
      // Invertierend mit Vu = −1: Rauschverstärkung 2, also halbe Bandbreite
      values: { art: 'invert', r1: 10, rf: 10, uin: 0.1, ub: 12, gbp: 1 },
      expect: [
        { label: 'Verstärkung', value: -1, tolerance: 1e-9 },
        { label: 'Verstärkung in dB', value: 0, tolerance: 1e-9 },
        { label: 'Obere Grenzfrequenz', value: 500, tolerance: 1e-6 },
      ],
    },
    {
      // Spannungsfolger: Vu = 1, volle Bandbreite
      values: { art: 'folger', r1: 10, rf: 100, uin: 2.5, ub: 12, gbp: 1 },
      expect: [
        { label: 'Verstärkung', value: 1, tolerance: 1e-9 },
        { label: 'Ausgangsspannung', value: 2.5, tolerance: 1e-9 },
        { label: 'Obere Grenzfrequenz', value: 1, tolerance: 1e-9 },
      ],
    },
    {
      // Übersteuerung: 0,5 V mal 100 wären 50 V, bei ±12 V ist Schluss
      values: { art: 'nicht', r1: 1, rf: 99, uin: 0.5, ub: 12, gbp: 1 },
      expect: [
        { label: 'Verstärkung', value: 100, tolerance: 1e-9 },
        { label: 'Ausgangsspannung', value: 12, tolerance: 1e-9 },
      ],
    },
  ],
};
