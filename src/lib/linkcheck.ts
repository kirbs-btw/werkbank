/**
 * Interne Verweise der fertigen Seite prüfen.
 *
 * Zwei Dinge fallen weder im Build noch im Typcheck auf:
 *
 * **Tote Verweise** – ein `href`, hinter dem keine Datei liegt. Der Build meldet
 * dafür nichts; der Link ist einfach da und führt ins Leere. Genau so ein Fall
 * lag im Bestand: Ein Rechner verwies auf `laser-air-assist` statt auf
 * `laser-air-assist-luftverbrauch`.
 *
 * **Verwaiste Seiten** – Seiten ohne einen einzigen Verweis auf sie. Sie stehen
 * zwar in der Sitemap, aber auf dem üblichen Weg findet sie niemand.
 *
 * Die Prüfung steckt hier als reine Funktion, damit sie ohne Dateisystem
 * testbar ist; `scripts/linkcheck.mjs` liefert ihr nur die Dateien.
 */

/** Seitenpfad einer Datei, so wie er im Browser steht. */
export function seitenPfad(relativerPfad: string): string {
  const rel = relativerPfad.split('\\').join('/').replace(/^\.?\//, '');
  const ohneIndex = rel.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
  const p = `/${ohneIndex}`;
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
}

/** Ziel ohne Anker, Parameter und abschließenden Schrägstrich. */
export function normalisiere(ziel: string): string {
  const rein = ziel.split('#')[0].split('?')[0];
  return rein.length > 1 && rein.endsWith('/') ? rein.slice(0, -1) : rein;
}

/**
 * Alle seiteninternen Verweise aus einem HTML-Text.
 *
 * Übersprungen wird alles, was nicht auf diese Seite zeigt: andere Protokolle,
 * reine Anker und relative Pfade – letztere benutzt die Seite nicht, und sie
 * ohne Basispfad aufzulösen führte nur zu Fehlalarmen.
 */
export function interneZiele(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    const ziel = m[1];
    if (/^(https?:|mailto:|tel:|data:|#|javascript:)/i.test(ziel)) continue;
    if (!ziel.startsWith('/')) continue;
    out.push(ziel);
  }
  return out;
}

export interface Befund {
  /** Totes Ziel → Seiten, auf denen der Verweis steht. */
  tot: Map<string, string[]>;
  /** Seiten, auf die niemand verweist. */
  waisen: string[];
}

/**
 * Startseite und Fehlerseite gelten nie als verwaist: Auf die 404 verlinkt man
 * nicht, die ruft der Server.
 */
const NIE_VERWAIST = new Set(['/', '/404']);

/**
 * @param seiten   Seitenpfad → HTML-Inhalt.
 * @param existiert Sagt, ob hinter einem Ziel etwas liegt. Das weiß nur, wer
 *                 das Dateisystem kennt – Bilder und `robots.txt` sind schließlich
 *                 keine Seiten.
 */
export function pruefe(
  seiten: Map<string, string>,
  existiert: (ziel: string) => boolean,
): Befund {
  const tot = new Map<string, string[]>();
  const verlinkt = new Set<string>();

  for (const [vonSeite, html] of seiten) {
    for (const ziel of interneZiele(html)) {
      const norm = normalisiere(ziel);
      if (seiten.has(norm)) verlinkt.add(norm);
      if (!existiert(norm)) {
        const liste = tot.get(ziel) ?? [];
        liste.push(vonSeite);
        tot.set(ziel, liste);
      }
    }
  }

  const waisen = [...seiten.keys()]
    .filter((p) => !verlinkt.has(p) && !NIE_VERWAIST.has(p))
    .sort();

  return { tot, waisen };
}
