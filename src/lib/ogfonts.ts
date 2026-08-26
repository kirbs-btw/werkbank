/**
 * Schriften für die Vorschaubilder laden. Nur zur Build-Zeit benutzbar – dieses
 * Modul greift auf das Dateisystem zu und gehört deshalb nicht in den `<head>`.
 *
 * Die beiden Schnitte liegen im Repo statt in einer Abhängigkeit. Das Paket
 * `@fontsource/inter` bringt 5 MB in 252 Dateien mit, gebraucht werden davon
 * zwei mit zusammen 62 KB. Inter steht unter der SIL Open Font License 1.1, die
 * die Weitergabe ausdrücklich erlaubt; der Lizenztext liegt daneben.
 *
 * Der Pfad wird über die Projektwurzel aufgelöst, nicht relativ zum Modul.
 * Grund: Nach dem Bündeln liegt dieses Modul unter `dist/pages/`, ein relativer
 * Pfad zeigte dort ins Leere. Vites `?inline` schied ebenfalls aus – es liefert
 * im Build eine Data-URL, unter vitest aber einen Dev-Server-Pfad. Dann prüften
 * die Tests einen anderen Weg als den, der tatsächlich ausgeliefert wird.
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import opentype from 'opentype.js';
import type { FontLike } from './ogimage';

/** Vom eigenen Modul aus nach oben laufen, bis die package.json auftaucht. */
function projektWurzel(): string {
  let d = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    if (existsSync(join(d, 'package.json'))) return d;
    const oben = dirname(d);
    if (oben === d) break;
    d = oben;
  }
  return process.cwd();
}

function laden(datei: string): FontLike {
  const pfad = join(projektWurzel(), 'src', 'assets', 'fonts', datei);
  const b = readFileSync(pfad);
  return opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)) as unknown as FontLike;
}

let zwischenspeicher: { fett: FontLike; normal: FontLike } | null = null;

/** Beide Schnitte, einmal geladen und dann wiederverwendet (rund 170 Bilder je Build). */
export function ogFonts(): { fett: FontLike; normal: FontLike } {
  if (!zwischenspeicher) {
    zwischenspeicher = {
      fett: laden('inter-latin-800-normal.woff'),
      normal: laden('inter-latin-500-normal.woff'),
    };
  }
  return zwischenspeicher;
}
