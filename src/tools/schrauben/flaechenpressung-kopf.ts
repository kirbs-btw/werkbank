import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'flaechenpressung-kopf',
  category: 'schrauben',
  title: 'Flächenpressung unter dem Schraubenkopf',
  shortTitle: 'Flächenpressung Kopf',
  description:
    'Berechne die Flächenpressung unter Schraubenkopf aus Vorspannkraft, Auflage- und Lochdurchmesser und prüfe sie gegen die Grenzpressung.',
  keywords: [
    'flächenpressung schraubenkopf',
    'pressung unter mutter berechnen',
    'grenzflächenpressung werkstoff',
    'auflagefläche schraube pressung',
    'flächenpressung berechnen schraube',
    'kopfauflage pressung',
    'einsinken schraubenkopf',
  ],
  formula: 'p = F / A,  A = π/4 · (d_a² − d_loch²)',
  inputs: [
    { type: 'number', id: 'f', label: 'Vorspann-/Auflagekraft F', unit: 'N', default: 20000, min: 0, step: 500 },
    { type: 'number', id: 'da', label: 'Auflage-Außendurchmesser d_a', unit: 'mm', default: 13, min: 1, step: 0.5, help: 'Außendurchmesser der Kopf- oder Scheibenauflage.' },
    { type: 'number', id: 'dloch', label: 'Lochdurchmesser d_loch', unit: 'mm', default: 9, min: 0, step: 0.5, help: 'Durchgangsloch unter dem Kopf.' },
    { type: 'number', id: 'pg', label: 'Grenzflächenpressung', unit: 'N/mm²', default: 490, min: 1, step: 10, help: 'Werkstoffabhängig: Stahl S235 ≈ 490, Alu ≈ 220, GG ≈ 850.' },
  ],
  compute: (v) => {
    const f = num(v.f);
    const da = num(v.da);
    const dloch = num(v.dloch);
    const pg = num(v.pg, 490);
    const a = (Math.PI / 4) * Math.max(0, da * da - dloch * dloch);
    const p = a > 0 ? f / a : 0;
    const ausnutzung = pg > 0 ? (p / pg) * 100 : 0;
    return [
      { label: 'Auflagefläche A', value: a, unit: 'mm²', digits: 1 },
      { label: 'Flächenpressung p', value: p, unit: 'N/mm²', digits: 1, primary: true },
      { label: 'Ausnutzung Grenzpressung', value: ausnutzung, unit: '%', digits: 0, help: 'Über 100 % sinkt der Kopf ein.' },
    ];
  },
  intro:
    'Unter dem Schraubenkopf oder der Mutter wirkt die Vorspannkraft auf eine ringförmige Auflagefläche und erzeugt dort eine Flächenpressung. Überschreitet sie die Grenzflächenpressung des verschraubten Werkstoffs, sinkt der Kopf ein, die Schraube setzt sich und verliert Vorspannung. Die Pressung ergibt sich aus Kraft geteilt durch die Ringfläche zwischen Auflage-Außendurchmesser und Durchgangsloch. Eine Unterlegscheibe vergrößert die Fläche und senkt die Pressung.',
  howto: [
    'Vorspann- oder Auflagekraft F in Newton eintragen.',
    'Auflage-Außendurchmesser angeben — Kopfauflage oder Scheibenaußendurchmesser bei Verwendung einer Scheibe.',
    'Durchgangsloch-Durchmesser eintragen.',
    'Grenzflächenpressung des Werkstoffs wählen und die Ausnutzung prüfen.',
  ],
  faq: [
    { q: 'Was passiert bei zu hoher Flächenpressung?', a: 'Überschreitet die Pressung die Grenze, fließt der Werkstoff unter dem Kopf plastisch. Der Kopf sinkt ein, die Schraube setzt sich und die Vorspannkraft sinkt dauerhaft. Bei weichen Werkstoffen wie Aluminium ist das ein häufiger Fehler.' },
    { q: 'Wie senke ich die Flächenpressung?', a: 'Mit einer größeren Unterlegscheibe oder einem größeren Kopf. Trägt die Scheibe, setzt man ihren Außendurchmesser als Auflagedurchmesser ein. Auch eine niedrigere Vorspannkraft reduziert die Pressung.' },
    { q: 'Welche Grenzpressung gilt für welchen Werkstoff?', a: 'Richtwerte: Baustahl S235 etwa 490 N/mm², vergüteter Stahl deutlich mehr, Grauguss rund 850 N/mm², Aluminiumlegierungen je nach Zustand 150 bis 250 N/mm². Genaue Werte stehen in VDI 2230.' },
    { q: 'Welche Auflagefläche hat ein M8-Kopf?', a: 'Bei SW 13 und 9 mm Loch ergibt sich eine Ringfläche von rund 70 mm². Mit Unterlegscheibe (außen 16 mm) steigt sie auf etwa 130 mm², was die Pressung fast halbiert.' },
  ],
  related: ['unterlegscheiben-masse', 'max-vorspannkraft', 'durchgangsloch'],
  updated: '2026-06-16',
  examples: [
    { values: { f: 20000, da: 13, dloch: 9, pg: 490 }, expect: [{ label: 'Auflagefläche A', value: 69.1, tolerance: 0.3 }] },
    { values: { f: 20000, da: 13, dloch: 9, pg: 490 }, expect: [{ label: 'Flächenpressung p', value: 289.5, tolerance: 1 }] },
  ],
};
