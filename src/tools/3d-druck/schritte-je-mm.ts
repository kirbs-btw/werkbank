import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schritte-je-mm',
  category: '3d-druck',
  title: 'Schritte je mm für Achsantriebe berechnen',
  shortTitle: 'Schritte je mm',
  description:
    'Berechne steps/mm für Riemen- und Spindelantriebe aus Motorschritten, Mikroschritten und Antriebsdaten – samt Auflösung und Höchstgeschwindigkeit.',
  keywords: [
    'steps per mm berechnen',
    'schritte pro mm',
    'steps mm rechner 3d drucker',
    'e steps achse berechnen',
    'gt2 steps per mm',
    'spindel steps per mm',
    'mikroschritte auflösung',
  ],
  formula: 'Schritte/mm = (Motorschritte · Mikroschritte) / Weg je Umdrehung',
  inputs: [
    {
      type: 'select',
      id: 'art',
      label: 'Antrieb',
      default: '2',
      help: 'Bei Riemen zählt die Zähnezahl der Scheibe, bei Spindeln die Steigung.',
      options: [
        { value: '2', label: 'Zahnriemen GT2 (2 mm)' },
        { value: '3', label: 'Zahnriemen GT3 / HTD 3M (3 mm)' },
        { value: '5', label: 'Zahnriemen HTD 5M / T5 (5 mm)' },
        { value: '0', label: 'Gewindespindel (Steigung unten)' },
      ],
    },
    {
      type: 'number', id: 'motor', label: 'Motorschritte je Umdrehung', unit: 'Schritte', default: 200, min: 1, step: 1,
      help: '200 bei 1,8°-Motoren, 400 bei 0,9°.',
    },
    {
      type: 'select', id: 'micro', label: 'Mikroschritte', default: '16',
      options: [
        { value: '1', label: '1 – Vollschritt' }, { value: '2', label: '2' }, { value: '4', label: '4' },
        { value: '8', label: '8' }, { value: '16', label: '16 – üblich' }, { value: '32', label: '32' },
        { value: '64', label: '64' }, { value: '128', label: '128' }, { value: '256', label: '256' },
      ],
    },
    {
      type: 'number', id: 'z', label: 'Zähne der Riemenscheibe', unit: 'Zähne', default: 20, min: 1, step: 1,
      help: 'Nur beim Riemenantrieb. 20 Zähne sind der Standard.',
    },
    {
      type: 'number', id: 'steigung', label: 'Spindelsteigung', unit: 'mm/U', default: 8, min: 0.1, step: 0.5,
      help: 'Nur bei Spindeln: Weg je Umdrehung. Eine T8 mit vier Gängen macht 8 mm.',
    },
    {
      type: 'number', id: 'fmax', label: 'Höchste Schrittfrequenz', unit: 'kHz', default: 40, min: 1, step: 5,
      help: 'Was die Steuerung schafft – oft 30 bis 50 kHz je Achse.',
    },
  ],
  compute: (v) => {
    const teilung = num(v.art, 2);
    const motor = Math.max(1, num(v.motor, 200));
    const micro = Math.max(1, num(v.micro, 16));
    const z = Math.max(1, num(v.z, 20));
    const steigung = Math.max(0.001, num(v.steigung, 8));
    const fmax = Math.max(0.001, num(v.fmax, 40)) * 1000;

    // Riemen: Weg je Umdrehung ist der Teilkreisumfang, und der ist genau z · p.
    const wegProU = teilung > 0 ? z * teilung : steigung;
    const schritteProU = motor * micro;
    const schritteProMm = schritteProU / wegProU;
    const aufloesung = 1 / schritteProMm;
    const vollschritt = wegProU / motor;
    const vmax = fmax / schritteProMm;

    return [
      { label: 'Schritte je mm', value: schritteProMm, unit: 'Schritte/mm', digits: 3, primary: true },
      {
        label: 'Auflösung je Mikroschritt', value: aufloesung * 1000, unit: 'µm', digits: 2,
        help: 'Kleinster ansteuerbarer Weg – die erreichbare Genauigkeit liegt deutlich darüber.',
      },
      { label: 'Weg je Umdrehung', value: wegProU, unit: 'mm', digits: 3 },
      {
        label: 'Auflösung im Vollschritt', value: vollschritt * 1000, unit: 'µm', digits: 2,
        help: 'Was der Motor ohne Mikroschritte macht. Nur hier hält er sein volles Drehmoment.',
      },
      {
        label: 'Geschwindigkeit bei Höchstfrequenz', value: vmax, unit: 'mm/s', digits: 0,
        help: 'Darüber verliert die Steuerung Schritte, egal was der Motor könnte.',
      },
    ];
  },
  intro:
    'Ein Schrittmotor kennt keine Millimeter, sondern nur Schritte. Wie viele davon auf einen Millimeter gehen, hängt an drei Dingen: den Schritten je Motorumdrehung, der Mikroschritt-Einstellung des Treibers und dem Weg, den die Mechanik je Umdrehung zurücklegt. Beim Riemen ist dieser Weg schlicht Zähnezahl mal Teilung – die krummen Teilkreisdurchmesser kürzen sich weg. Bei der Spindel ist es die Steigung. Wer den Wert falsch einträgt, druckt maßhaltig falsch: Ein um 2 % zu kleiner Wert macht aus 100 mm gleichmäßig 102.',
  howto: [
    'Antriebsart wählen – GT2 mit 20 Zähnen ist an X und Y der Regelfall, an Z sitzt meist eine Spindel.',
    'Motorschritte eintragen: 200 bei einem 1,8°-Motor, 400 bei 0,9°.',
    'Mikroschritte des Treibers angeben; 16 ist die übliche Einstellung.',
    'Zähnezahl oder Steigung eintragen, je nach Antrieb.',
    'Den Wert in die Firmware übernehmen und mit einer gedruckten 100-mm-Strecke nachmessen.',
  ],
  faq: [
    {
      q: 'Warum kommen bei GT2 mit 20 Zähnen genau 80 Schritte heraus?',
      a: 'Weil sich die Zahlen glatt kürzen: 200 Schritte mal 16 Mikroschritte sind 3200 Schritte je Umdrehung, und der Riemen legt dabei 20 · 2 = 40 mm zurück. 3200 / 40 = 80. Deshalb steht in fast jeder Bambu-, Ender- und Prusa-Firmware für X und Y die 80.',
    },
    {
      q: 'Mehr Mikroschritte, feineres Ergebnis?',
      a: 'Nur rechnerisch. Mikroschritte teilen den Vollschritt elektrisch auf, aber das Haltemoment sinkt mit der Feinheit: Bei 1/16 hält der Motor an der Zwischenposition nur noch rund ein Zehntel der Kraft. Die tatsächliche Genauigkeit begrenzen Riemenspannung, Spiel und Steifigkeit – nicht die Zahl im Treiber.',
    },
    {
      q: 'Mein Teil ist durchgehend ein paar Prozent zu groß. Liegt das hier?',
      a: 'Sehr wahrscheinlich ja, wenn der Fehler über die ganze Strecke gleichmäßig wächst. Miss eine lange Strecke, etwa 100 mm, und rechne den Wert um: neu = alt · gemessen / gewünscht. Ist der Fehler dagegen unabhängig von der Länge immer gleich groß, liegt es eher an der Düsenbreite oder am Spiel.',
    },
    {
      q: 'Was hat die Höchstfrequenz damit zu tun?',
      a: 'Jeder Schritt braucht einen Impuls. Bei 80 Schritten/mm und 40 kHz sind rechnerisch 500 mm/s möglich; bei 400 Schritten/mm an einer Z-Spindel nur noch 100. Feinere Auflösung kostet also Geschwindigkeit – deshalb fahren Achsen mit hoher Schrittzahl je mm oft langsamer, als der Motor es hergäbe.',
    },
  ],
  related: ['e-steps-kalibrierung', 'stepper-vref-strom', 'schwund-kompensation'],
  updated: '2026-08-27',
  examples: [
    {
      // Der klassische X/Y-Wert: GT2, 20 Zähne, 1,8°-Motor, 1/16
      values: { art: '2', motor: 200, micro: '16', z: 20, steigung: 8, fmax: 40 },
      expect: [
        { label: 'Schritte je mm', value: 80, tolerance: 0.001 },
        { label: 'Weg je Umdrehung', value: 40, tolerance: 0.001 },
        { label: 'Auflösung je Mikroschritt', value: 12.5, tolerance: 0.01 },
        { label: 'Geschwindigkeit bei Höchstfrequenz', value: 500, tolerance: 0.5 },
      ],
    },
    {
      // Der klassische Z-Wert: T8-Spindel mit 8 mm Steigung
      values: { art: '0', motor: 200, micro: '16', z: 20, steigung: 8, fmax: 40 },
      expect: [
        { label: 'Schritte je mm', value: 400, tolerance: 0.001 },
        { label: 'Auflösung je Mikroschritt', value: 2.5, tolerance: 0.01 },
      ],
    },
    {
      // 0,9°-Motor verdoppelt die Schrittzahl
      values: { art: '2', motor: 400, micro: '16', z: 20, steigung: 8, fmax: 40 },
      expect: [{ label: 'Schritte je mm', value: 160, tolerance: 0.001 }],
    },
  ],
};
