/**
 * Prüft die fertige Seite in `dist/` auf tote Verweise und verwaiste Seiten.
 *
 * Aufruf: `npm run linkcheck` (nach `npm run build`).
 * Rückgabewert 1, wenn etwas gefunden wurde – damit taugt es auch für CI.
 *
 * Die eigentliche Prüfung steht in `src/lib/linkcheck.ts` und ist dort ohne
 * Dateisystem getestet; hier passiert nur das Einsammeln der Dateien.
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { pruefe, seitenPfad } from '../src/lib/linkcheck.ts';

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

/** Liegt hinter diesem Pfad wirklich etwas? Auch Bilder und robots.txt zählen. */
function existiert(pfad) {
  const kern = pfad === '/' ? '' : pfad.replace(/^\//, '');
  return [join(DIST, kern, 'index.html'), join(DIST, `${kern}.html`), join(DIST, kern)].some(
    (k) => existsSync(k) && statSync(k).isFile(),
  );
}

const dateien = htmlDateien(DIST);
const seiten = new Map(
  dateien.map((d) => [seitenPfad(relative(DIST, d)), readFileSync(d, 'utf8')]),
);

const { tot, waisen } = pruefe(seiten, existiert);

console.log(`Geprüft: ${seiten.size} Seiten`);

if (tot.size === 0) {
  console.log('Tote Verweise: keine');
} else {
  console.log(`Tote Verweise: ${tot.size}`);
  for (const [ziel, quellen] of [...tot].sort()) {
    const wo =
      quellen.length > 3
        ? `${quellen.slice(0, 3).join(', ')} … (+${quellen.length - 3})`
        : quellen.join(', ');
    console.log(`  ${ziel}   ← ${wo}`);
  }
}

if (waisen.length === 0) {
  console.log('Verwaiste Seiten: keine');
} else {
  console.log(`Verwaiste Seiten: ${waisen.length}`);
  for (const p of waisen) console.log(`  ${p}`);
}

process.exit(tot.size > 0 || waisen.length > 0 ? 1 : 0);
