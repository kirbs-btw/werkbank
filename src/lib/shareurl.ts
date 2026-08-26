/**
 * Rechner-Eingaben in der Adresszeile mitführen – zum Teilen und Wiederfinden.
 *
 * Zwei Eigenschaften sind dabei wichtiger als es zunächst aussieht:
 *
 * **Nur Abweichungen wandern in die URL.** Wer nichts verstellt, bekommt keine
 * Parameter zu sehen, und wer ein Maß ändert, bekommt genau eines. Das hält die
 * Links kurz und lesbar – und sorgt nebenbei dafür, dass die geteilte Seite
 * inhaltlich dieselbe bleibt wie die kanonische ohne Parameter.
 *
 * **Fremde Werte werden geprüft, nicht geglaubt.** Ein geteilter Link kommt von
 * außen: unbekannte Parameter fliegen raus, „abc" bei einem Zahlenfeld ebenso,
 * und Werte außerhalb der erlaubten Grenzen werden auf die Grenze gezogen statt
 * durchgereicht. Sonst ließe sich über einen Link ein Rechner mit unsinnigen
 * Zahlen aufrufen und das Ergebnis als seriös weitergeben.
 */

import type { Tool, ToolInput, InputValues } from './types';

/** Zahl aus Text lesen – Komma wie Punkt als Dezimaltrenner. */
function zahl(text: string): number | null {
  const v = parseFloat(text.replace(',', '.'));
  return Number.isFinite(v) ? v : null;
}

/** Auf die im Feld erklärten Grenzen ziehen. */
function begrenzen(input: ToolInput, v: number): number {
  let out = v;
  if (input.type === 'number') {
    if (typeof input.min === 'number') out = Math.max(input.min, out);
    if (typeof input.max === 'number') out = Math.min(input.max, out);
  }
  return out;
}

/** Entspricht der Wert der Voreinstellung des Feldes? */
export function istVoreinstellung(input: ToolInput, wert: unknown): boolean {
  if (input.type === 'number') {
    const a = typeof wert === 'number' ? wert : zahl(String(wert));
    const b = typeof input.default === 'number' ? input.default : zahl(String(input.default));
    return a !== null && b !== null && a === b;
  }
  return String(wert) === String(input.default);
}

/**
 * Baut die Parameter für die Adresszeile – nur, was von der Voreinstellung
 * abweicht. Leeres Ergebnis heißt: Die saubere URL genügt.
 */
export function encodeValues(tool: Tool, values: InputValues): string {
  const p = new URLSearchParams();
  for (const input of tool.inputs) {
    const wert = values[input.id];
    if (wert === undefined || wert === null || wert === '') continue;
    if (istVoreinstellung(input, wert)) continue;
    p.set(input.id, String(wert));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

/**
 * Liest Eingaben aus einer Query-Zeichenkette. Zurück kommt nur, was zu einem
 * Feld dieses Rechners gehört und einen brauchbaren Wert hat.
 */
export function decodeValues(tool: Tool, search: string): InputValues {
  const p = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const out: InputValues = {};
  for (const input of tool.inputs) {
    const roh = p.get(input.id);
    if (roh === null || roh === '') continue;
    if (input.type === 'number') {
      const v = zahl(roh);
      if (v === null) continue; // kein Zahlwert – Feld bleibt auf Voreinstellung
      out[input.id] = begrenzen(input, v);
    } else {
      // Nur erlaubte Auswahlwerte übernehmen
      if (!input.options.some((o) => String(o.value) === roh)) continue;
      out[input.id] = roh;
    }
  }
  return out;
}

/**
 * Vollständige Adresse zum Teilen. `basis` ist die saubere Seiten-URL ohne
 * Parameter – das Kanonische bleibt damit unangetastet, egal was angehängt wird.
 */
export function shareUrl(tool: Tool, values: InputValues, basis: string): string {
  const sauber = basis.split('?')[0].split('#')[0];
  return sauber + encodeValues(tool, values);
}
