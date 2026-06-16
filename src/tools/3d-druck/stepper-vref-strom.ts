import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'stepper-vref-strom',
  category: '3d-druck',
  title: 'Stepper VREF Rechner (A4988 / DRV8825 / TMC2208)',
  shortTitle: 'Stepper VREF',
  description:
    'Berechne die VREF-Spannung für Schrittmotor-Treiber aus Motorstrom und Sense-Widerstand und stelle A4988, DRV8825 oder TMC2208 korrekt ein.',
  keywords: [
    'vref berechnen stepper',
    'a4988 vref einstellen',
    'drv8825 vref rechner',
    'tmc2208 vref strom',
    'schrittmotor strom einstellen',
    'rsense vref motorstrom',
    'treiber vref potentiometer',
  ],
  formula:
    'A4988: VREF = I × 8 × Rsense · TMC2208: VREF = I_rms × √2 × 8 × Rsense · DRV8825: VREF = I × 5 × Rsense',
  inputs: [
    {
      type: 'select', id: 'treiber', label: 'Treiber-Typ', default: 'a4988',
      options: [
        { value: 'a4988', label: 'A4988 (Faktor 8 × Rsense)' },
        { value: 'drv8825', label: 'DRV8825 (Faktor 5 × Rsense)' },
        { value: 'tmc2208', label: 'TMC2208/2209 (Effektivstrom × √2)' },
      ],
      help: 'TMC im VREF-Modus; bei UART zählt die Firmware-Einstellung.',
    },
    { type: 'number', id: 'strom', label: 'Gewünschter Motorstrom', unit: 'A', default: 0.8, min: 0.05, max: 3, step: 0.05, help: 'A4988/DRV8825: Spitzenstrom. TMC: Effektivstrom (RMS).' },
    { type: 'number', id: 'rsense', label: 'Sense-Widerstand', unit: 'Ω', default: 0.1, min: 0.01, max: 1, step: 0.01, help: 'Typisch: A4988 0,05–0,2 Ω · DRV8825 0,1 Ω · TMC2208 0,11 Ω.' },
  ],
  compute: (v) => {
    const treiber = String(v.treiber);
    const strom = num(v.strom);
    const rsense = num(v.rsense);
    let vref = 0;
    if (treiber === 'drv8825') {
      vref = strom * 5 * rsense;
    } else if (treiber === 'tmc2208') {
      vref = strom * Math.SQRT2 * 8 * rsense;
    } else {
      vref = strom * 8 * rsense;
    }
    const mv = vref * 1000;
    return [
      { label: 'VREF-Spannung', value: vref, unit: 'V', digits: 3, primary: true, help: 'Am Poti / VREF-Pin gegen GND messen.' },
      { label: 'VREF in Millivolt', value: mv, unit: 'mV', digits: 0 },
    ];
  },
  intro:
    'Die VREF-Spannung am Treiber-Poti legt fest, wie viel Strom dein Schrittmotor bekommt – zu wenig führt zu Schrittverlusten, zu viel zu Überhitzung. Bei A4988 und DRV8825 stellst du den Spitzenstrom über VREF = I × Faktor × Rsense ein, wobei der Faktor (8 bzw. 5) und der Sense-Widerstand boardabhängig sind. Bei TMC-Treibern im VREF-Modus rechnest du mit dem Effektivstrom und dem Faktor √2, weil hier der RMS-Wert geregelt wird. Miss anschließend mit dem Multimeter zwischen Poti und GND nach.',
  howto: [
    'Treiber-Typ wählen – der Faktor und das Strom-Verständnis (Spitze vs. Effektiv) hängen davon ab.',
    'Gewünschten Motorstrom eintragen; übliche Werte: NEMA17 für X/Y/E etwa 0,6–0,9 A Effektivstrom.',
    'Sense-Widerstand des Boards aus dem Datenblatt oder Aufdruck (R100 = 0,1 Ω) eingeben.',
    'Berechnete VREF einstellen, am Poti messen und Motortemperatur im Betrieb kontrollieren.',
  ],
  faq: [
    { q: 'Spitzen- oder Effektivstrom angeben?', a: 'Bei A4988 und DRV8825 bezieht sich die Formel auf den Spitzenstrom (etwa Nennstrom × 1,4). Bei TMC2208/2209 gibst du den Effektivstrom (RMS) ein – meist 70–85 % des Motornennstroms.' },
    { q: 'Woher kenne ich meinen Rsense?', a: 'Der Wert steht im Boardschema oder als SMD-Aufdruck nahe der Treiberplätze (R050 = 0,05 Ω, R100 = 0,1 Ω, R110 = 0,11 Ω). Falsche Annahme verfälscht den Strom direkt.' },
    { q: 'Warum wird mein Motor zu heiß?', a: 'Meist ist VREF zu hoch oder der Rsense falsch angesetzt. Senke den Strom in 0,05-A-Schritten; bis ca. 50–60 °C Motortemperatur ist normal.' },
    { q: 'Gilt das auch bei UART-Treibern?', a: 'Wenn du TMC2208/2209 per UART konfigurierst, setzt die Firmware den Strom direkt in mA – das VREF-Poti ist dann meist inaktiv. Der Rechner gilt dann nur für den reinen VREF/Standalone-Modus.' },
    { q: 'Wie genau muss ich messen?', a: 'Auf etwa ±0,02 V genau reicht. Das Poti ist empfindlich; drehe in kleinen Schritten und miss bei eingeschalteter, aber stillstehender Maschine.' },
  ],
  related: ['e-steps-kalibrierung', 'stromkosten-3d-druck', 'riemenspannung-frequenz'],
  updated: '2026-06-16',
  examples: [
    {
      values: { treiber: 'a4988', strom: 0.8, rsense: 0.1 },
      expect: [
        { label: 'VREF-Spannung', value: 0.64, tolerance: 0.001 },
        { label: 'VREF in Millivolt', value: 640, tolerance: 1 },
      ],
    },
    {
      values: { treiber: 'tmc2208', strom: 0.8, rsense: 0.11 },
      expect: [
        { label: 'VREF-Spannung', value: 0.995, tolerance: 0.005 },
      ],
    },
  ],
};
