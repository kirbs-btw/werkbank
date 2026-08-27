/**
 * Prüft fertiges HTML auf Barrieren, die sich ohne Browser feststellen lassen.
 *
 * Ausdrücklich **nicht** das ganze Feld: Farbkontraste, Fokusreihenfolge und
 * Verhalten mit Hilfsmitteln brauchen einen echten Browser. Was hier steht,
 * sind die Fehler, die man beim Bauen macht und beim Ansehen nicht bemerkt –
 * ein Eingabefeld ohne Beschriftung sieht auf dem Bildschirm völlig normal aus,
 * ist mit Screenreader aber ein namenloses Kästchen.
 *
 * Die Prüfung arbeitet mit Mustern statt mit einem echten Parser. Das reicht,
 * weil das HTML aus einem Generator kommt und wohlgeformt ist; für fremdes
 * HTML wäre es zu grob.
 */

export interface Fund {
  /** Kurzname der Regel, etwa `feld-ohne-namen`. */
  regel: string;
  /** Was gefunden wurde – gekürzt, damit die Ausgabe lesbar bleibt. */
  stelle: string;
}

const kuerze = (s: string, n = 90): string =>
  s.replace(/\s+/g, ' ').trim().slice(0, n);

/** Attributwert aus einem Start-Tag lesen. */
function attr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i'));
  return m ? m[1] : null;
}

/** Sichtbarer Text ohne Tags. */
function nurText(html: string): string {
  return html
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;|&#\d+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Eingabefelder ohne zugänglichen Namen.
 *
 * Gültig ist: `aria-label`, `aria-labelledby`, ein `<label for="…">` mit
 * passender `id` – oder das Feld steht innerhalb eines `<label>`.
 */
export function felderOhneNamen(html: string): Fund[] {
  const funde: Fund[] = [];
  const fuerIds = new Set<string>();
  for (const m of html.matchAll(/<label\b[^>]*\sfor="([^"]+)"/gi)) fuerIds.add(m[1]);

  // Bereiche, die innerhalb eines <label> liegen – dort ist die Beschriftung implizit.
  const inLabel: [number, number][] = [];
  for (const m of html.matchAll(/<label\b[\s\S]*?<\/label>/gi)) {
    inLabel.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  const stecktInLabel = (pos: number) => inLabel.some(([a, b]) => pos >= a && pos < b);

  for (const m of html.matchAll(/<(input|select|textarea)\b[^>]*>/gi)) {
    const tag = m[0];
    const typ = (attr(tag, 'type') ?? '').toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image'].includes(typ)) continue;
    if (attr(tag, 'aria-label') || attr(tag, 'aria-labelledby')) continue;
    const id = attr(tag, 'id');
    if (id && fuerIds.has(id)) continue;
    if (stecktInLabel(m.index ?? 0)) continue;
    funde.push({ regel: 'feld-ohne-namen', stelle: kuerze(tag) });
  }
  return funde;
}

/**
 * Links und Schaltflächen ohne erkennbaren Namen – etwa reine Symbolknöpfe.
 * Ein Screenreader liest dort nur „Link" oder „Schaltfläche" vor.
 */
export function bedienelementeOhneNamen(html: string): Fund[] {
  const funde: Fund[] = [];
  for (const m of html.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/gi)) {
    const [, tag, attrs, inhalt] = m;
    if (/\saria-hidden="true"/i.test(attrs)) continue;
    if (/\saria-label="[^"]+"/i.test(attrs) || /\saria-labelledby="[^"]+"/i.test(attrs)) continue;
    if (tag.toLowerCase() === 'a' && !/\shref=/i.test(attrs)) continue; // Anker ohne Ziel
    if (nurText(inhalt).length > 0) continue;
    if (/<img\b[^>]*\salt="[^"]+"/i.test(inhalt)) continue; // Bild mit Alternativtext
    funde.push({ regel: 'bedienelement-ohne-namen', stelle: kuerze(m[0]) });
  }
  return funde;
}

/**
 * Übersprungene Überschriftenebenen. Wer sich per Überschriften durch die Seite
 * bewegt, verliert bei einem Sprung von h2 auf h4 die Orientierung.
 */
export function ueberschriftenSpruenge(html: string): Fund[] {
  const funde: Fund[] = [];
  let vorher = 0;
  for (const m of html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const stufe = Number(m[1]);
    if (vorher > 0 && stufe > vorher + 1) {
      funde.push({ regel: 'uebersprungene-ebene', stelle: `h${vorher} → h${stufe}: ${kuerze(nurText(m[2]), 50)}` });
    }
    vorher = stufe;
  }
  return funde;
}

/** Mehrfach vergebene `id` – Verweise darauf werden mehrdeutig. */
export function doppelteIds(html: string): Fund[] {
  const gesehen = new Set<string>();
  const funde: Fund[] = [];
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) {
    if (gesehen.has(m[1])) funde.push({ regel: 'doppelte-id', stelle: m[1] });
    else gesehen.add(m[1]);
  }
  return funde;
}

/** Grundgerüst: Sprache, genau eine Hauptüberschrift, ein Hauptbereich. */
export function grundgeruest(html: string): Fund[] {
  const funde: Fund[] = [];
  if (!/<html\b[^>]*\slang="[^"]+"/i.test(html)) {
    funde.push({ regel: 'ohne-sprache', stelle: '<html> ohne lang' });
  }
  const h1 = [...html.matchAll(/<h1\b/gi)].length;
  if (h1 !== 1) funde.push({ regel: 'h1-anzahl', stelle: `${h1} statt 1` });
  const main = [...html.matchAll(/<main\b/gi)].length;
  if (main !== 1) funde.push({ regel: 'main-anzahl', stelle: `${main} statt 1` });
  return funde;
}

/** Alle Regeln auf einer Seite. */
export function pruefeSeite(html: string): Fund[] {
  return [
    ...grundgeruest(html),
    ...felderOhneNamen(html),
    ...bedienelementeOhneNamen(html),
    ...ueberschriftenSpruenge(html),
    ...doppelteIds(html),
  ];
}

/* --- Farbkontrast --- */

/** Relative Helligkeit nach WCAG. */
export function luminanz(hex: string): number {
  const h = hex.replace('#', '');
  const voll = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const teile = [0, 2, 4].map((i) => parseInt(voll.slice(i, i + 2), 16) / 255);
  const [r, g, b] = teile.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Kontrastverhältnis zweier Farben, 1 bis 21. */
export function kontrast(vorne: string, hinten: string): number {
  const a = luminanz(vorne);
  const b = luminanz(hinten);
  const hell = Math.max(a, b);
  const dunkel = Math.min(a, b);
  return (hell + 0.05) / (dunkel + 0.05);
}
