import type { Tool, ToolResult } from '../../lib/types';
import { num } from '../../lib/types';
import { e12, kaufbar, skaliere, stellen } from '../../lib/elektro';

type Art = 'rc-tief' | 'rc-hoch' | 'rl-tief' | 'rl-hoch';

/** Ergebniszeile aus einem Wert mit passender Vorsatzeinheit. */
const zeile = (label: string, wert: number, basis: string, rest: Partial<ToolResult> = {}): ToolResult => {
  const s = skaliere(wert, basis);
  return { label, value: s.value, unit: s.unit, digits: stellen(s.value), ...rest };
};

export const tool: Tool = {
  slug: 'rc-filter',
  category: 'elektronik',
  title: 'Grenzfrequenz berechnen: RC- und RL-Filter',
  shortTitle: 'RC/RL-Filter',
  description:
    'Berechne Grenzfrequenz, Zeitkonstante, Dämpfung und Phasenverschiebung für Tiefpass und Hochpass erster Ordnung – mit RC- oder RL-Glied.',
  keywords: [
    'tiefpass grenzfrequenz berechnen',
    'rc glied zeitkonstante rechner',
    'tiefpass hochpass rechner online',
    'grenzfrequenz berechnen formel',
    'rc tiefpass berechnen',
    'hochpass grenzfrequenz',
    'rl filter berechnen',
    'zeitkonstante rc glied',
  ],
  formula: 'RC: fg = 1 / (2π·R·C), τ = R·C;  RL: fg = R / (2π·L), τ = L/R',
  inputs: [
    {
      type: 'select',
      id: 'art',
      label: 'Filterart',
      default: 'rc-tief',
      help: 'Erster Ordnung – ein Widerstand und ein Energiespeicher. Die Flanke fällt mit 20 dB je Dekade.',
      options: [
        { value: 'rc-tief', label: 'RC-Tiefpass' },
        { value: 'rc-hoch', label: 'RC-Hochpass' },
        { value: 'rl-tief', label: 'RL-Tiefpass' },
        { value: 'rl-hoch', label: 'RL-Hochpass' },
      ],
    },
    { type: 'number', id: 'r', label: 'Widerstand R', unit: 'kΩ', default: 10, min: 0.001, step: 1 },
    {
      type: 'number', id: 'c', label: 'Kondensator C', default: 100, min: 0.001, step: 10,
      help: 'Nur beim RC-Filter.',
    },
    {
      type: 'select',
      id: 'ceinheit',
      label: 'Einheit von C',
      default: 'n',
      options: [
        { value: 'p', label: 'pF – Pikofarad' },
        { value: 'n', label: 'nF – Nanofarad' },
        { value: 'u', label: 'µF – Mikrofarad' },
      ],
    },
    {
      type: 'number', id: 'l', label: 'Spule L', unit: 'mH', default: 10, min: 0.001, step: 1,
      help: 'Nur beim RL-Filter.',
    },
    {
      type: 'number', id: 'fsig', label: 'Signalfrequenz', unit: 'Hz', default: 1000, min: 0.001, step: 100,
      help: 'Für Dämpfung und Phasenlage an dieser Stelle. Ändert die Grenzfrequenz nicht.',
    },
  ],
  compute: (v) => {
    const erlaubt: Art[] = ['rc-tief', 'rc-hoch', 'rl-tief', 'rl-hoch'];
    const art: Art = erlaubt.includes(v.art as Art) ? (v.art as Art) : 'rc-tief';
    const istRC = art.startsWith('rc');
    const istTiefpass = art.endsWith('tief');

    const r = Math.max(1e-6, num(v.r, 10)) * 1000;
    const faktor = { p: 1e-12, n: 1e-9, u: 1e-6 }[String(v.ceinheit ?? 'n')] ?? 1e-9;
    const c = Math.max(1e-18, num(v.c, 100)) * faktor;
    const l = Math.max(1e-9, num(v.l, 10)) * 1e-3;
    const fsig = Math.max(1e-6, num(v.fsig, 1000));

    // Beide Glieder verhalten sich gleich, sie unterscheiden sich nur darin,
    // wie die Zeitkonstante zustande kommt: Der Kondensator lädt sich über den
    // Widerstand, die Spule wird über ihn abgebaut.
    const tau = istRC ? r * c : l / r;
    const fg = 1 / (2 * Math.PI * tau);

    const x = fsig / fg;
    // Amplitudengang erster Ordnung. Am Knick ist er 1/√2 – das sind die
    // berühmten 3 dB, genauer 3,0103.
    const betrag = istTiefpass ? 1 / Math.sqrt(1 + x * x) : x / Math.sqrt(1 + x * x);
    const daempfung = 20 * Math.log10(betrag);
    const phase = istTiefpass
      ? -(Math.atan(x) * 180) / Math.PI
      : (Math.atan(1 / x) * 180) / Math.PI;

    const ergebnisse: ToolResult[] = [
      zeile('Grenzfrequenz', fg, 'Hz', {
        primary: true,
        help: 'Dort ist die Amplitude auf 1/√2 gefallen, also auf 70,7 % – das sind die 3 dB.',
      }),
      zeile('Zeitkonstante τ', tau, 's', {
        help: istRC
          ? 'R · C. Nach einer Zeitkonstante ist der Kondensator auf 63 % geladen.'
          : 'L / R. Nach einer Zeitkonstante ist der Spulenstrom auf 63 % gestiegen.',
      }),
      {
        label: 'Dämpfung bei Signalfrequenz',
        value: daempfung,
        unit: 'dB',
        digits: 2,
        help: `Vom Eingang bleiben ${(betrag * 100).toLocaleString('de-DE', { maximumFractionDigits: 1 })} % übrig.`,
      },
      {
        label: 'Phasenverschiebung',
        value: phase,
        unit: '°',
        digits: 1,
        help: istTiefpass
          ? 'Der Ausgang läuft nach. Bei sehr hohen Frequenzen nähert er sich −90°.'
          : 'Der Ausgang läuft vor. Bei sehr tiefen Frequenzen nähert er sich +90°.',
      },
    ];

    // Die Anstiegszeit ist eine Tiefpass-Größe: Sie beschreibt, wie schnell der
    // Ausgang einer Stufe am Eingang folgt. Beim Hochpass gibt es keinen
    // solchen Anstieg – dort fällt der Ausgang nach der Stufe wieder ab.
    if (istTiefpass) {
      // Exakt ln(9)·τ = 2,1972·τ: Von 10 % auf 90 % braucht die Ladekurve
      // ln(0,9)⁻¹ bis ln(0,1)⁻¹, und die Differenz ist ln(9). Die geläufigen
      // Faustformeln 2,2·τ und 0,35/fg sind beide gerundet und weichen um
      // 0,1 % voneinander ab – hier steht der genaue Wert.
      ergebnisse.push(
        zeile('Anstiegszeit 10–90 %', Math.log(9) * tau, 's', {
          help: 'Genau ln(9) · τ. Als Faustformel kennt man sie als 2,2 · τ oder 0,35 / Grenzfrequenz – so hängen Zeit- und Frequenzbereich zusammen.',
        }),
      );
    } else {
      ergebnisse.push(
        zeile('Abfall auf 37 %', tau, 's', {
          help: 'Nach einer Stufe am Eingang sinkt der Ausgang in dieser Zeit auf 1/e seines Sprungs.',
        }),
      );
    }

    // Kaufbare Bauteile: Beim Widerstand lohnt sich das Runden, weil er in
    // feinen Stufen zu haben ist. Kondensatoren und Spulen kommen deutlich
    // gröber gestuft – die nimmt man, wie sie in der Schublade liegen.
    const rE12 = e12(r);
    const tauE12 = istRC ? rE12 * c : l / rE12;
    ergebnisse.push(
      zeile('Mit E12-Widerstand', 1 / (2 * Math.PI * tauE12), 'Hz', {
        help: `${kaufbar(r, rE12)} – Kondensatoren und Spulen sind ohnehin gröber gestuft`,
      }),
    );

    return ergebnisse;
  },
  intro:
    'Ein Widerstand und ein Kondensator genügen, um Frequenzen zu trennen. Der Kondensator braucht Zeit zum Laden, und diese Zeit entscheidet, welche Signale durchkommen: Was langsamer schwingt als das Glied laden kann, geht durch; was schneller schwingt, wird weggebügelt. Beim Hochpass ist es umgekehrt, weil dort der Kondensator im Signalweg liegt. Der Übergang ist kein Schnitt, sondern eine Schräge – bei erster Ordnung 20 dB je Dekade. Deshalb ist die Grenzfrequenz auch keine Grenze, sondern nur die Stelle, an der schon 30 % der Amplitude fehlen.',
  howto: [
    'Filterart wählen. RC ist der Regelfall; RL kommt vor, wo ohnehin eine Drossel sitzt, etwa in Netzteilen.',
    'Widerstand eintragen – zwischen 1 kΩ und 100 kΩ ist die übliche Gegend.',
    'Kondensator oder Spule angeben und beim Kondensator die Einheit umschalten.',
    'Signalfrequenz eintragen, um Dämpfung und Phasenlage an dieser Stelle abzulesen.',
    'Wer eine Störung loswerden will: mindestens eine Dekade Abstand zur Nutzfrequenz einplanen, sonst leidet auch das Signal.',
  ],
  faq: [
    {
      q: 'Warum steckt 2π in der Formel?',
      a: 'Weil die Zeitkonstante mit dem Bogenmaß rechnet, die Frequenz aber mit Umdrehungen. τ = R · C hat die Einheit Sekunden und beschreibt, wie schnell sich der Kondensator lädt. Eine volle Schwingung sind 2π im Bogenmaß – deshalb steht zwischen Zeitkonstante und Grenzfrequenz genau dieser Faktor: fg = 1 / (2π·τ). Ein Glied mit τ = 1 ms hat also nicht 1000 Hz Grenzfrequenz, sondern 159 Hz.',
    },
    {
      q: 'Sind es genau 3 dB an der Grenzfrequenz?',
      a: 'Es sind 3,0103 dB. Definiert ist der Punkt über die Amplitude: Dort ist sie auf 1/√2 gefallen, also auf 70,7 %. In Dezibel sind das 20 · log₁₀(1/√2) = −3,0103. Die „3 dB" sind der gerundete Alltagswert. Bei der Leistung ist es dieselbe Stelle – dort ist sie auf die Hälfte gefallen, und Leistung rechnet mit dem Faktor 10 statt 20.',
    },
    {
      q: 'Wie stark dämpft ein Filter erster Ordnung?',
      a: 'Mit 20 dB je Dekade, also Faktor 10 in der Amplitude je Faktor 10 in der Frequenz. In Oktaven gerechnet sind das 6 dB. Das ist wenig: Eine Störung, die nur zehnmal über der Nutzfrequenz liegt, wird gerade um den Faktor 10 kleiner. Wer mehr braucht, staffelt mehrere Glieder oder nimmt ein Filter höherer Ordnung – zwei Stufen machen 40 dB je Dekade.',
    },
    {
      q: 'Was hat die Anstiegszeit mit der Grenzfrequenz zu tun?',
      a: 'Sie sind dasselbe, einmal in der Zeit und einmal in der Frequenz betrachtet. Für erste Ordnung ist die Anstiegszeit von 10 % auf 90 % genau ln(9) · τ, also das 2,1972-fache der Zeitkonstante. Umgerechnet auf die Grenzfrequenz sind das ln(9)/2π = 0,3497 – daher die überall zitierte Faustformel 0,35/fg. Ein Oszilloskop mit 100 MHz Bandbreite kann deshalb keine Flanke unter rund 3,5 ns darstellen, nicht weil es schlecht wäre, sondern weil beides derselbe Sachverhalt ist. Umgekehrt verrät eine gemessene Anstiegszeit die Bandbreite der Strecke.',
    },
    {
      q: 'Belastet das Filter die Quelle oder die nachfolgende Stufe?',
      a: 'Beides, und das wird gern übersehen. Der Widerstand liegt im Signalweg, die Quelle muss ihn treiben. Und wenn die nächste Stufe niederohmig ist, zieht sie den Ausgang herunter und verschiebt die Grenzfrequenz. Faustregel: Der Eingangswiderstand der Folgestufe sollte mindestens zehnmal größer sein als R. Wo das nicht geht, setzt man einen Spannungsfolger dazwischen.',
    },
  ],
  related: ['operationsverstaerker', 'ohmsches-gesetz', 'ne555-rechner'],
  updated: '2026-08-27',
  examples: [
    {
      // 10 kΩ und 100 nF: τ = 1 ms, fg = 159,15 Hz
      values: { art: 'rc-tief', r: 10, c: 100, ceinheit: 'n', l: 10, fsig: 1000 },
      expect: [
        { label: 'Grenzfrequenz', value: 159.1549, tolerance: 0.001 },
        { label: 'Zeitkonstante τ', value: 1, tolerance: 1e-9 },
        { label: 'Anstiegszeit 10–90 %', value: 2.1972246, tolerance: 1e-6 },
        { label: 'Dämpfung bei Signalfrequenz', value: -16.0713, tolerance: 0.001 },
      ],
    },
    {
      // Genau an der Grenzfrequenz: −3,0103 dB und −45°
      values: { art: 'rc-tief', r: 10, c: 100, ceinheit: 'n', l: 10, fsig: 159.15494 },
      expect: [
        { label: 'Dämpfung bei Signalfrequenz', value: -3.0103, tolerance: 0.001 },
        { label: 'Phasenverschiebung', value: -45, tolerance: 0.001 },
      ],
    },
    {
      // Hochpass an derselben Stelle: gleiche Dämpfung, Phase gespiegelt
      values: { art: 'rc-hoch', r: 10, c: 100, ceinheit: 'n', l: 10, fsig: 159.15494 },
      expect: [
        { label: 'Dämpfung bei Signalfrequenz', value: -3.0103, tolerance: 0.001 },
        { label: 'Phasenverschiebung', value: 45, tolerance: 0.001 },
      ],
    },
    {
      // RL: τ = L/R = 10 mH / 1 kΩ = 10 µs
      values: { art: 'rl-tief', r: 1, c: 100, ceinheit: 'n', l: 10, fsig: 1000 },
      expect: [
        { label: 'Zeitkonstante τ', value: 10, tolerance: 1e-9 },
        { label: 'Grenzfrequenz', value: 15.9155, tolerance: 0.001 },
      ],
    },
  ],
};
