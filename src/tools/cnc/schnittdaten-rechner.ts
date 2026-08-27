import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';
import {
  MATERIALS,
  TOOL_MATERIALS,
  GROUP_LABELS,
  getMaterial,
  computeCuttingData,
  type ToolMaterial,
} from '../../lib/schnittdaten';

const fmt = (n: number, dig = 0) => n.toLocaleString('de-DE', { maximumFractionDigits: dig });

// Richtwert-Tabelle direkt aus der Datenbank – bleibt automatisch synchron.
const TABLE = `<div class="tabelle-scroll"><table>
<thead><tr>
<th>Werkstoff</th><th>Gruppe</th><th>v<sub>c</sub> HSS</th><th>v<sub>c</sub> VHM</th><th>v<sub>c</sub> VHM besch.</th><th>f<sub>z</sub> bei Ø10</th><th>k<sub>c1.1</sub></th>
</tr></thead><tbody>
${MATERIALS.map(
  (m) =>
    `<tr><td>${m.label}</td><td>${m.group} · ${GROUP_LABELS[m.group]}</td><td>${m.vc.hss[0]}–${m.vc.hss[1]}</td><td>${m.vc.vhm[0]}–${m.vc.vhm[1]}</td><td>${m.vc['vhm-tialn'][0]}–${m.vc['vhm-tialn'][1]}</td><td>${fmt(m.fzFactor * 10, 2)} mm</td><td>${m.kc11}</td></tr>`,
).join('')}
</tbody></table></div>
<p class="tabelle-Fußnote">Schnittgeschwindigkeit v<sub>c</sub> in m/min, Zahnvorschub f<sub>z</sub> in mm/Zahn (skaliert mit dem Durchmesser), spezifische Schnittkraft k<sub>c1.1</sub> in N/mm². Richtwerte für den Einstieg – die konkreten Werte deines Werkzeugherstellers haben immer Vorrang.</p>`;

export const tool: Tool = {
  slug: 'schnittdaten-rechner',
  category: 'cnc',
  title: 'Schnittdaten-Rechner mit Material-Datenbank',
  shortTitle: 'Schnittdaten',
  description:
    'Werkstoff und Werkzeug wählen – der Rechner liefert Schnittgeschwindigkeit, Zahnvorschub, Drehzahl, Vorschub, Zeitspanvolumen und Leistung, inklusive Spanausdünnungs-Ausgleich.',
  keywords: [
    'schnittdaten rechner',
    'schnittdaten fräsen rechner',
    'feeds and speeds rechner deutsch',
    'schnittdaten aluminium fräsen',
    'schnittdatenrechner online kostenlos',
    'zerspanung schnittdaten berechnen',
    'schnittgeschwindigkeit tabelle fräsen',
    'zahnvorschub fz tabelle',
    'vorschub berechnen cnc',
  ],
  formula:
    'n = vc · 1000 / (π · d) · vf = fz · z · n · hm = fz · (2·ae/d) / φs · kc = kc1.1 / hm^mc · P = Q · kc / (60000 · η)',
  inputs: [
    {
      type: 'select',
      id: 'material',
      label: 'Werkstoff',
      default: 'alu-knet',
      options: MATERIALS.map((m) => ({ value: m.id, label: m.label })),
      help: 'Bestimmt Schnittgeschwindigkeit, Zahnvorschub und spezifische Schnittkraft.',
    },
    {
      type: 'select',
      id: 'werkzeug',
      label: 'Werkzeug',
      default: 'vhm-tialn',
      options: TOOL_MATERIALS.map((t) => ({ value: t.id, label: t.label })),
    },
    { type: 'number', id: 'd', label: 'Fräserdurchmesser d', unit: 'mm', default: 6, min: 0.1, step: 0.5 },
    { type: 'number', id: 'z', label: 'Zähnezahl z', unit: '', default: 2, min: 1, max: 20, step: 1 },
    {
      type: 'number', id: 'ae', label: 'Radiale Zustellung ae', unit: 'mm', default: 3, min: 0.01, step: 0.1,
      help: 'Eingriffsbreite quer zur Vorschubrichtung. ae = d entspricht einer Nut.',
    },
    {
      type: 'number', id: 'ap', label: 'Axiale Zustellung ap', unit: 'mm', default: 6, min: 0.01, step: 0.5,
      help: 'Schnitttiefe in Werkzeugachse.',
    },
    {
      type: 'select', id: 'thinning', label: 'Spanausdünnung ausgleichen', default: 'ja',
      options: [
        { value: 'ja', label: 'Ja – fz bei kleinem ae anheben' },
        { value: 'nein', label: 'Nein – Tabellenwert verwenden' },
      ],
      help: 'Bei ae < d/2 wird der Span dünner als fz. Der Ausgleich hebt fz an, damit die Schneide schneidet statt zu reiben (max. 2,5×).',
    },
  ],
  compute: (v) => {
    const materialId = String(v.material);
    const mat = getMaterial(materialId) ?? MATERIALS[0];
    const r = computeCuttingData({
      material: materialId,
      toolMaterial: String(v.werkzeug) as ToolMaterial,
      d: num(v.d, 6),
      z: num(v.z, 2),
      ae: num(v.ae, 3),
      ap: num(v.ap, 6),
      eta: 80,
      chipThinning: String(v.thinning) !== 'nein',
    });
    const hinweis = [...r.warnings, mat.note].join(' ');
    return [
      { label: 'Drehzahl n', value: r.n, unit: 'min⁻¹', digits: 0, primary: true },
      { label: 'Vorschub vf', value: r.vf, unit: 'mm/min', digits: 0, primary: true },
      {
        label: 'Schnittgeschwindigkeit vc', value: r.vc, unit: 'm/min', digits: 0,
        help: `Empfohlener Bereich ${fmt(r.vcMin)}–${fmt(r.vcMax)} m/min – bei Ratterneigung am unteren Rand starten.`,
      },
      {
        label: 'Zahnvorschub fz', value: r.fz, unit: 'mm/Zahn', digits: 4,
        help:
          r.thinningFactor > 1.001
            ? `Tabellenwert ${fmt(r.fzBase, 4)} mm × ${fmt(r.thinningFactor, 2)} Spanausdünnungs-Ausgleich.`
            : `Tabellenwert für Ø ${fmt(num(v.d, 6), 1)} mm bei halbem Eingriff.`,
      },
      {
        label: 'Mittlere Spanungsdicke hm', value: r.hm, unit: 'mm', digits: 4,
        help: `Eingriffswinkel ${fmt(r.phiDeg, 1)}° · Ziel ist ein hm über etwa 0,02 mm, sonst reibt die Schneide.`,
      },
      { label: 'Zeitspanvolumen Q', value: r.q, unit: 'cm³/min', digits: 2 },
      {
        label: 'Spindelleistung P', value: r.p, unit: 'kW', digits: 2,
        help: `Bei η = 80 % · Schnittkraft Fc ≈ ${fmt(r.fc, 0)} N · kc = ${fmt(r.kc, 0)} N/mm².`,
      },
      { label: 'Praxis-Hinweis', value: '', help: hinweis },
    ];
  },
  intro: `<p>Schnittdaten sind der Unterschied zwischen einem sauberen Teil und einem abgebrochenen Fräser. Statt Tabellenwerte zusammenzusuchen, wählst du hier <strong>Werkstoff und Werkzeug</strong> – der Rechner nimmt die passende Schnittgeschwindigkeit und den Zahnvorschub aus einer Datenbank mit ${MATERIALS.length} Werkstoffen und rechnet daraus Drehzahl, Vorschub, Zeitspanvolumen und benötigte Spindelleistung aus. Genau die Funktion, die spezialisierte Programme wie HSMAdvisor oder FSWizard kostenpflichtig anbieten.</p>
<p>Eingebaut ist der <strong>Spanausdünnungs-Ausgleich</strong>: Fräst du mit kleiner radialer Zustellung – etwa beim Trochoidal- oder Adaptiv-Fräsen – wird der Span dünner als der eingestellte Zahnvorschub. Ohne Korrektur reibt die Schneide, statt zu schneiden, und das Werkzeug stirbt an Hitze. Der Rechner hebt f<sub>z</sub> automatisch so weit an, dass die mittlere Spanungsdicke wieder im sinnvollen Bereich liegt (begrenzt auf das 2,5-fache).</p>
<h2>Richtwerte-Tabelle: Schnittgeschwindigkeit und Zahnvorschub</h2>
${TABLE}`,
  howto: [
    'Werkstoff aus der Liste wählen – er bestimmt Schnittgeschwindigkeit, Zahnvorschub und Schnittkraft.',
    'Werkzeugmaterial wählen: HSS, unbeschichtetes oder beschichtetes Vollhartmetall oder Wendeplattenfräser.',
    'Fräserdurchmesser und Zähnezahl eintragen (steht auf dem Werkzeug oder im Katalog).',
    'Radiale Zustellung ae und axiale Zustellung ap für deinen Schnitt angeben.',
    'Drehzahl n und Vorschub vf ins CAM oder direkt in die Steuerung übernehmen – und die Spindelleistung mit deiner Maschine abgleichen.',
  ],
  faq: [
    {
      q: 'Woher stammen die Richtwerte?',
      a: 'Es sind übliche Praxis-Startwerte aus Zerspanungstabellen und Herstellerkatalogen, bewusst konservativ in der Mitte des jeweiligen Bereichs. Sie ersetzen keine Herstellerangabe: Steht im Datenblatt deines Fräsers ein Wert, hat dieser immer Vorrang.',
    },
    {
      q: 'Was ist Spanausdünnung und warum ist der Ausgleich wichtig?',
      a: 'Bei radialer Zustellung unter dem halben Durchmesser ist die mittlere Spanungsdicke deutlich kleiner als der Zahnvorschub – die Schneide schabt, statt zu schneiden, und erzeugt Reibungswärme. Der Ausgleich erhöht fz so, dass die Spandicke wieder stimmt. Nebeneffekt: Der Vorschub steigt teils auf das Doppelte, die Bearbeitung wird also schneller und schonender zugleich.',
    },
    {
      q: 'Wie tief und wie breit darf ich zustellen?',
      a: 'Als Startpunkt gilt für Vollhartmetall in Stahl: ap bis 1×d bei ae von etwa 10 % des Durchmessers (adaptiv), oder ap von 0,5×d bei ae bis 50 %. In Aluminium ist deutlich mehr möglich. Entscheidend sind Maschinensteifigkeit und Werkzeugauskraglänge – bei langer Auskragung beides reduzieren.',
    },
    {
      q: 'Warum wird die Leistung mit 80 % Wirkungsgrad gerechnet?',
      a: 'Zwischen Motor und Schneide gehen über Riemen, Lager und Getriebe Verluste verloren; 80 % ist ein üblicher Mittelwert für Fräsmaschinen. Möchtest du mit einem anderen Wert rechnen, nutze den separaten Rechner für die Spindelleistung.',
    },
    {
      q: 'Die berechnete Drehzahl ist höher als meine Spindel kann – was nun?',
      a: 'Dann fährst du mit der maximal möglichen Drehzahl und reduzierst den Vorschub im gleichen Verhältnis, damit der Zahnvorschub erhalten bleibt. Die Schnittgeschwindigkeit sinkt dabei – das kostet Standzeit, ist aber unkritisch. Umgekehrt gilt: Vorschub niemals unabhängig von der Drehzahl senken, sonst reibt die Schneide.',
    },
    {
      q: 'Gelten die Werte auch für Gleichlauf- und Gegenlauffräsen?',
      a: 'Ja, die Schnittdaten selbst sind identisch. In der Praxis fräst man auf CNC-Maschinen mit spielfreier Spindel fast immer im Gleichlauf: bessere Oberfläche, weniger Reibung und längere Standzeit. Gegenlauf ist nur bei Maschinen mit Spiel in der Vorschubachse oder bei harter Gusshaut sinnvoll.',
    },
  ],
  related: ['schnittgeschwindigkeit', 'mittlere-spanungsdicke', 'spindelleistung-fraesen', 'zeitspanvolumen'],
  updated: '2026-08-27',
  examples: [
    {
      // Alu-Knetlegierung, VHM, Ø6 mm, 2 Schneiden, halber Eingriff, ohne Ausgleich
      values: { material: 'alu-knet', werkzeug: 'vhm', d: 6, z: 2, ae: 3, ap: 6, thinning: 'nein' },
      expect: [
        { label: 'Drehzahl n', value: 15915.5, tolerance: 1 },
        { label: 'Vorschub vf', value: 3437.7, tolerance: 1 },
        { label: 'Schnittgeschwindigkeit vc', value: 300, tolerance: 0.01 },
        { label: 'Zahnvorschub fz', value: 0.108, tolerance: 0.0001 },
      ],
    },
    {
      // Gleiches Werkzeug, adaptiver Schnitt mit 10 % Eingriff und Spanausdünnungs-Ausgleich
      values: { material: 'alu-knet', werkzeug: 'vhm', d: 6, z: 2, ae: 0.6, ap: 6, thinning: 'ja' },
      expect: [
        { label: 'Drehzahl n', value: 15915.5, tolerance: 1 },
        { label: 'Zahnvorschub fz', value: 0.2212, tolerance: 0.001 },
        { label: 'Vorschub vf', value: 7042, tolerance: 5 },
      ],
    },
    {
      // Baustahl mit beschichtetem VHM: vc-Mitte aus 120-200
      values: { material: 'baustahl', werkzeug: 'vhm-tialn', d: 10, z: 4, ae: 5, ap: 5, thinning: 'nein' },
      expect: [
        { label: 'Schnittgeschwindigkeit vc', value: 160, tolerance: 0.01 },
        { label: 'Drehzahl n', value: 5092.96, tolerance: 1 },
        { label: 'Zahnvorschub fz', value: 0.1, tolerance: 0.0001 },
      ],
    },
  ],
};
