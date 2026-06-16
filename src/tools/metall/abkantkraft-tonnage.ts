import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'abkantkraft-tonnage',
  category: 'metall',
  title: 'Abkantkraft- & Tonnage-Rechner (Gesenkbiegen)',
  shortTitle: 'Abkantkraft',
  description: 'Berechne die erforderliche Biegekraft und Tonnage beim Abkanten von Blech aus Wandstärke, Gesenköffnung V, Zugfestigkeit und Biegelänge.',
  keywords: ['abkantkraft berechnen', 'tonnage abkanten rechner', 'biegekraft blech formel', 'presskraft gesenkbiegen', 'abkantpresse tonnage', 'kraft luftbiegen', 'biegekraft v-werkzeug', 'pressenkraft blech'],
  formula: 'F [kN] = (1,33 · Rm · s² · b) / (1000 · V)  (Rm in N/mm², s/b/V in mm)',
  inputs: [
    { type: 'number', id: 'dicke', label: 'Blechdicke', unit: 'mm', default: 2, min: 0.1, step: 0.1, help: 'Materialstärke s' },
    { type: 'number', id: 'breite', label: 'Biegelänge', unit: 'mm', default: 1000, min: 0, step: 10, help: 'Länge der Biegekante b' },
    { type: 'number', id: 'v', label: 'Gesenköffnung V', unit: 'mm', default: 16, min: 0.1, step: 1, help: 'Breite des V-Werkzeugs' },
    {
      type: 'select', id: 'rm', label: 'Werkstoff (Zugfestigkeit Rm)', default: '450',
      options: [
        { value: '270', label: 'Aluminium (≈270 N/mm²)' },
        { value: '400', label: 'Baustahl S235 (≈400 N/mm²)' },
        { value: '510', label: 'Baustahl S355 (≈510 N/mm²)' },
        { value: '600', label: 'Edelstahl V2A (≈600 N/mm²)' },
        { value: '450', label: 'Stahl allgemein (≈450 N/mm²)' },
      ],
    },
  ],
  compute: (v) => {
    const s = num(v.dicke, 0.1);
    const b = num(v.breite);
    const V = num(v.v, 0.1);
    const Rm = num(v.rm, 450);
    const kraftKn = V > 0 ? (1.33 * Rm * s * s * b) / (1000 * V) : 0;
    const tonnage = (kraftKn * 1000) / 9810; // kN -> t (Kraft / g)
    const kraftProMeter = b > 0 ? (kraftKn / b) * 1000 : 0;
    return [
      { label: 'Biegekraft', value: kraftKn, unit: 'kN', digits: 1, primary: true },
      { label: 'Tonnage', value: tonnage, unit: 't', digits: 2 },
      { label: 'Kraft pro Meter', value: kraftProMeter, unit: 'kN/m', digits: 1 },
    ];
  },
  intro: 'Dieser Rechner schätzt die erforderliche Biegekraft (Tonnage) beim Luftbiegen auf einer Abkantpresse. Die bewährte Werkstattformel F = 1,33 · Rm · s² · b / V berücksichtigt Blechdicke s, Zugfestigkeit Rm, Biegelänge b und die Gesenköffnung V des V-Werkzeugs. So prüfst du vor dem Biegen, ob deine Presse genug Druck liefert und welche Gesenkbreite sinnvoll ist — denn die Kraft steigt im Quadrat der Blechdicke und sinkt mit größerer V-Öffnung.',
  howto: [
    'Blechdicke s in mm eintragen.',
    'Biegelänge b (Länge der Kante) in mm angeben.',
    'Gesenköffnung V des V-Werkzeugs in mm wählen, meist das 6- bis 12-fache der Blechdicke.',
    'Werkstoff bzw. Zugfestigkeit auswählen und Biegekraft sowie Tonnage ablesen.',
  ],
  faq: [
    { q: 'Welche Gesenköffnung V soll ich wählen?', a: 'Als Faustregel V = 8·s bei Blechen bis 3 mm, bei dickeren Blechen 6·s bis 12·s. Eine größere V-Öffnung senkt die nötige Kraft, vergrößert aber den Innenradius.' },
    { q: 'Warum geht die Blechdicke quadratisch ein?', a: 'Beim Luftbiegen wirkt das Blech wie ein Träger über die V-Öffnung; das Widerstandsmoment wächst mit s². Doppelte Dicke bedeutet daher etwa vierfache Kraft.' },
    { q: 'Gilt die Formel auch für Prägebiegen?', a: 'Nein, beim Prägebiegen (Bottoming/Coining) liegt die Kraft drei- bis fünffach höher. Diese Formel gilt für das Luftbiegen, das in der Praxis am häufigsten genutzt wird.' },
    { q: 'Wie rechne ich von kN in Tonnen um?', a: 'Eine Tonne Presskraft entspricht etwa 9,81 kN. Der Rechner teilt die Kraft daher durch 9,81, um die Tonnage in Tonnen anzugeben.' },
    { q: 'Stimmt der Faktor 1,33 immer?', a: 'Er ist ein guter Mittelwert für das Luftbiegen. Manche Hersteller rechnen mit 1,42; bei sehr zähen oder hochfesten Werkstoffen kann die reale Kraft etwas höher liegen — plane Reserve ein.' },
  ],
  related: ['v-werkzeug-breite', 'minimaler-biegeradius', 'blech-abwicklung'],
  updated: '2026-06-16',
  examples: [
    {
      values: { dicke: 2, breite: 1000, v: 16, rm: '450' },
      expect: [{ label: 'Biegekraft', value: 149.6, tolerance: 1 }],
    },
    {
      values: { dicke: 3, breite: 1000, v: 24, rm: '400' },
      expect: [{ label: 'Biegekraft', value: 199.5, tolerance: 1 }],
    },
  ],
};
