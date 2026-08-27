/**
 * Prüft die fertige Seite in `dist/` auf Barrieren, die sich im HTML feststellen
 * lassen: Felder ohne Beschriftung, Bedienelemente ohne Namen, übersprungene
 * Überschriftenebenen, doppelte `id`, fehlendes Grundgerüst.
 *
 * Aufruf: `npm run a11ycheck` (nach `npm run build`).
 * Rückgabewert 1, wenn etwas gefunden wurde.
 *
 * Die Regeln stehen in `src/lib/a11ycheck.ts` und sind dort ohne Dateisystem
 * getestet; hier passiert nur das Einsammeln.
 */

import { readdirSync, statSync, readFileSync } from 'fs';
import { join, relative } from 'path';
import { pruefeSeite } from '../src/lib/a11ycheck.ts';

const DIST = 'dist';

function htmlDateien(dir) {
  const out = [];
  for (const eintrag of readdirSync(dir)) {
    const pfad = join(dir, eintrag);
    if (statSync(pfad).isDirectory()) out.push(...htmlDateien(pfad));
    else if (pfad.endsWith('.html')) out.push(pfad);
  }
  return out;
}

const dateien = htmlDateien(DIST);
/** Regel → Fundstellen. Gleiche Muster auf vielen Seiten einmal zeigen, nicht 177-mal. */
const nachRegel = new Map();

for (const datei of dateien) {
  const seite = '/' + relative(DIST, datei).split('\\').join('/');
  for (const fund of pruefeSeite(readFileSync(datei, 'utf8'))) {
    const liste = nachRegel.get(fund.regel) ?? [];
    liste.push({ seite, stelle: fund.stelle });
    nachRegel.set(fund.regel, liste);
  }
}

console.log(`Geprüft: ${dateien.length} Seiten`);

if (nachRegel.size === 0) {
  console.log('Befunde: keine');
  process.exit(0);
}

let gesamt = 0;
for (const [regel, funde] of [...nachRegel].sort((a, b) => b[1].length - a[1].length)) {
  gesamt += funde.length;
  console.log(`\n${regel}: ${funde.length} Fundstellen auf ${new Set(funde.map((f) => f.seite)).size} Seiten`);
  // Nur verschiedene Muster zeigen – dieselbe Stelle auf 150 Seiten ist ein Befund, nicht 150.
  const muster = new Map();
  for (const f of funde) if (!muster.has(f.stelle)) muster.set(f.stelle, f.seite);
  for (const [stelle, seite] of [...muster].slice(0, 6)) {
    console.log(`   ${stelle}\n      z. B. ${seite}`);
  }
  if (muster.size > 6) console.log(`   … und ${muster.size - 6} weitere Muster`);
}

console.log(`\nSumme: ${gesamt} Fundstellen`);
process.exit(1);
