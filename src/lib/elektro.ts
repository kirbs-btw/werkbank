/**
 * Gemeinsame Hilfsmittel der Elektronik-Rechner.
 *
 * Entstanden beim zweiten Rechner der Kategorie: Die E-Reihe steckte zunächst
 * im NE555-Rechner. Spätestens beim Spannungsteiler und beim Verstärker wird
 * sie ein drittes und viertes Mal gebraucht – dann lieber einmal richtig.
 */

/** E12-Reihe, eine Dekade. Alle anderen Werte entstehen durch Zehnerpotenzen. */
export const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];

/** E24 – doppelt so fein, üblich bei 1-%-Metallschichtwiderständen. */
export const E24 = [
  10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30,
  33, 36, 39, 43, 47, 51, 56, 62, 68, 75, 82, 91,
];

/**
 * Nächster Wert einer E-Reihe.
 *
 * Verglichen wird der logarithmische Abstand, nicht der absolute: Die Reihen
 * sind geometrisch gestuft (E12 rund 20 % je Stufe), deshalb ist der relative
 * Abstand das richtige Maß. Zwischen 68 und 82 liegt die Grenze bei √(68·82) =
 * 74,7 – nicht bei 75.
 */
export function eReihe(x: number, reihe: number[] = E12): number {
  if (!(x > 0)) return 0;
  const dekade = Math.pow(10, Math.floor(Math.log10(x)));
  const kandidaten = [...reihe.map((v) => (v * dekade) / 10), 10 * dekade];
  let beste = kandidaten[0];
  for (const k of kandidaten) {
    if (Math.abs(Math.log(k / x)) < Math.abs(Math.log(beste / x))) beste = k;
  }
  return beste;
}

export const e12 = (x: number): number => eReihe(x, E12);
export const e24 = (x: number): number => eReihe(x, E24);

/**
 * Wert auf eine passende Vorsatzeinheit bringen.
 *
 * „21,3 mA" liest sich besser als „0,0213 A", und „4,7 kΩ" besser als
 * „4700 Ω". Gibt Zahl und fertige Einheit zurück, damit der Rechner beides
 * unverändert ausgeben kann.
 */
export function skaliere(x: number, basis: string): { value: number; unit: string } {
  const a = Math.abs(x);
  if (!Number.isFinite(x)) return { value: 0, unit: basis };
  if (a >= 1e6) return { value: x / 1e6, unit: `M${basis}` };
  if (a >= 1e3) return { value: x / 1e3, unit: `k${basis}` };
  if (a >= 1 || a === 0) return { value: x, unit: basis };
  if (a >= 1e-3) return { value: x * 1e3, unit: `m${basis}` };
  return { value: x * 1e6, unit: `µ${basis}` };
}

/** Nachkommastellen nach Größenordnung – dieselbe Zahl mal 0,002 und mal 4700. */
export const stellen = (x: number): number => {
  const a = Math.abs(x);
  return a >= 1000 ? 0 : a >= 100 ? 1 : a >= 1 ? 2 : 4;
};

/** Handelsübliche Belastbarkeiten von Widerständen in Watt. */
export const LEISTUNGSKLASSEN = [0.125, 0.25, 0.5, 1, 2, 3, 5, 10, 20, 50];

/**
 * Kleinste handelsübliche Belastbarkeit für eine Verlustleistung.
 *
 * Mit Reserve, voreingestellt Faktor 2: Ein Widerstand an seiner Nenngrenze
 * wird so heiß, dass er driftet und die Platine verfärbt. Die Nennleistung gilt
 * zudem nur bis etwa 70 °C Umgebungstemperatur – im geschlossenen Gehäuse ist
 * davon weniger übrig, als auf dem Bauteil steht.
 */
export function belastbarkeit(p: number, reserve = 2): number {
  const noetig = Math.max(0, p) * reserve;
  return LEISTUNGSKLASSEN.find((k) => k >= noetig) ?? LEISTUNGSKLASSEN[LEISTUNGSKLASSEN.length - 1];
}

/** Widerstandswert als lesbarer Text, etwa „4,7 kΩ". */
export function ohmText(r: number): string {
  const s = skaliere(r, 'Ω');
  return `${s.value.toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${s.unit}`;
}

/**
 * Satzbaustein für eine „so ist es kaufbar"-Zeile.
 *
 * Nennt zwei Werte nur dann, wenn sie sich unterscheiden. Fehlt diese
 * Unterscheidung, steht dort „10 kΩ statt 10 kΩ" – und das ist kein Randfall:
 * Lehrbuch- und Vorgabewerte sind gerade so gewählt, dass sie in der Reihe
 * liegen. Derselbe Widerspruch ist in zwei Rechnern unabhängig voneinander
 * entstanden, deshalb steht er jetzt an einer Stelle.
 */
export function kaufbar(ist: number, gerundet: number): string {
  const ziel = ohmText(gerundet);
  // Verglichen werden die *angezeigten* Texte, nicht die Zahlen. 1000,9 Ω und
  // 1000 Ω sind rechnerisch verschieden, stehen aber beide als „1 kΩ" da – ein
  // Zahlenvergleich hätte hier „1 kΩ statt 1 kΩ" durchgelassen. Der Satz
  // beschreibt ohnehin den gerundeten Wert, und der liegt tatsächlich auf der
  // Reihe.
  return ziel === ohmText(ist)
    ? `${ziel} steht genau so in der E12-Reihe`
    : `${ziel} statt ${ohmText(ist)}`;
}
