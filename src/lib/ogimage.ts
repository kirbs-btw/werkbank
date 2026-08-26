/**
 * Vorschaubilder (Open Graph) zur Build-Zeit erzeugen – ohne fremden Dienst.
 *
 * Der entscheidende Kniff: **Der Text wird in Pfade umgewandelt**, bevor das
 * SVG gerastert wird. Ein `<text>`-Element bräuchte beim Rastern eine
 * installierte Schrift; welche Schriften auf dem Build-Server liegen, weiß
 * niemand sicher, und im Zweifel fällt das Bild auf eine beliebige Ersatzschrift
 * zurück oder bleibt leer. Als Pfad ist der Text unabhängig davon – das
 * erzeugte SVG enthält keinerlei Schriftbezug mehr.
 *
 * Gesetzt wird Glyphe für Glyphe mit eigenem Kerning statt über die
 * Shaping-Maschine von opentype.js: Deren Feature-Tabellen stolpern über Inters
 * `ccmp`-Lookups, und für lateinischen Text bringt Shaping ohnehin nichts, was
 * Kerning nicht auch leistet.
 */

/** Das Nötige aus opentype.js – so bleibt dieses Modul ohne harte Abhängigkeit testbar. */
export interface GlyphLike {
  index: number;
  advanceWidth: number;
  getPath(x: number, y: number, size: number): { toPathData(dezimalstellen: number): string };
}
export interface FontLike {
  unitsPerEm: number;
  charToGlyph(zeichen: string): GlyphLike;
  getKerningValue(a: GlyphLike, b: GlyphLike): number;
}

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Farben aus dem Seitendesign. */
export const OG_FARBEN = {
  grund: '#18181b',
  akzent: '#ea580c',
  text: '#ffffff',
  gedaempft: '#a1a1aa',
} as const;

/** Breite einer Zeichenkette in Pixeln, inklusive Kerning. */
export function textWidth(font: FontLike, text: string, size: number): number {
  const s = size / font.unitsPerEm;
  let x = 0;
  let vorher: GlyphLike | null = null;
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (vorher) x += font.getKerningValue(vorher, g) * s;
    x += g.advanceWidth * s;
    vorher = g;
  }
  return x;
}

/** Zeichenkette als SVG-Pfaddaten, Grundlinie bei y. */
export function textPath(font: FontLike, text: string, x: number, y: number, size: number): string {
  const s = size / font.unitsPerEm;
  const teile: string[] = [];
  let cursor = x;
  let vorher: GlyphLike | null = null;
  for (const ch of text) {
    const g = font.charToGlyph(ch);
    if (vorher) cursor += font.getKerningValue(vorher, g) * s;
    const d = g.getPath(cursor, y, size).toPathData(2);
    if (d) teile.push(d);
    cursor += g.advanceWidth * s;
    vorher = g;
  }
  return teile.join(' ');
}

/**
 * Bricht Text auf eine feste Breite um. Passt er nicht in `maxLines` Zeilen,
 * wird die letzte gekürzt und mit … abgeschlossen – lieber ein sauber
 * abgeschnittener Titel als einer, der aus dem Bild läuft.
 */
export function wrapText(
  font: FontLike,
  text: string,
  size: number,
  maxWidth: number,
  maxLines: number,
): string[] {
  const woerter = text.split(/\s+/).filter(Boolean);
  if (woerter.length === 0 || maxLines < 1) return [];

  const zeilen: string[] = [];
  let aktuell = '';
  let i = 0;
  for (; i < woerter.length; i++) {
    const versuch = aktuell ? `${aktuell} ${woerter[i]}` : woerter[i];
    if (!aktuell || textWidth(font, versuch, size) <= maxWidth) {
      aktuell = versuch;
      continue;
    }
    zeilen.push(aktuell);
    aktuell = '';
    if (zeilen.length === maxLines) break; // Wort i bleibt übrig
    aktuell = woerter[i];
  }
  if (aktuell && zeilen.length < maxLines) {
    zeilen.push(aktuell);
    i = woerter.length;
  }

  // Rest übrig? Letzte Zeile wortweise kürzen, bis das Auslassungszeichen passt.
  // Wortweise, nicht zeichenweise – ein abgeschnittenes „Darrmas …“ sieht nach
  // Fehler aus, ein weggelassenes Wort nach Absicht.
  if (i < woerter.length && zeilen.length > 0) {
    let letzte = zeilen[zeilen.length - 1];
    while (textWidth(font, `${letzte} …`, size) > maxWidth && letzte.includes(' ')) {
      letzte = letzte.slice(0, letzte.lastIndexOf(' '));
    }
    zeilen[zeilen.length - 1] = `${letzte} …`;
  }

  // Notbremse für ein einzelnes Wort, das allein schon zu breit ist: Hier hilft
  // nur zeichenweises Kürzen, sonst liefe es aus dem Bild.
  return zeilen.map((z) => {
    if (textWidth(font, z, size) <= maxWidth) return z;
    let k = z;
    while (k.length > 1 && textWidth(font, `${k}…`, size) > maxWidth) k = k.slice(0, -1);
    return `${k}…`;
  });
}

export interface OgOptions {
  /** Große Überschrift – der Tool- oder Seitentitel. */
  titel: string;
  /** Kleine Zeile darüber, etwa die Kategorie. */
  kategorie?: string;
  /** Zeile unter dem Titel; wird auf eine Zeile gekürzt. */
  untertitel?: string;
  fontFett: FontLike;
  fontNormal: FontLike;
}

const esc = (s: string): string =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]!);

/**
 * Baut das fertige SVG. Enthält bewusst **kein** `<text>` – wer das ändert,
 * macht das Bild wieder von den Schriften des Build-Servers abhängig.
 */
export function ogSvg(opts: OgOptions): string {
  const { titel, kategorie, untertitel, fontFett, fontNormal } = opts;
  const rand = 96;
  const nutzbar = OG_WIDTH - 2 * rand;

  // Titel: je nach Länge kleiner setzen, damit auch lange Namen dreizeilig passen.
  const titelGroesse = titel.length > 46 ? 54 : titel.length > 28 ? 64 : 72;
  const zeilen = wrapText(fontFett, titel, titelGroesse, nutzbar, 3);
  const zeilenhoehe = Math.round(titelGroesse * 1.22);

  // Titelblock vertikal mittig zwischen Kopf und Fußlinie ausrichten.
  const blockHoehe = zeilen.length * zeilenhoehe;
  const startY = Math.round((OG_HEIGHT - blockHoehe) / 2) + titelGroesse * 0.78;

  const raster: string[] = [];
  for (let y = 42; y < OG_HEIGHT; y += 42) raster.push(`M0 ${y}H${OG_WIDTH}`);
  for (let x = 42; x < OG_WIDTH; x += 42) raster.push(`M${x} 0V${OG_HEIGHT}`);

  const stuecke: string[] = [
    `<rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${OG_FARBEN.grund}"/>`,
    `<path d="${raster.join('')}" stroke="${OG_FARBEN.text}" stroke-opacity="0.05" stroke-width="1" fill="none"/>`,
    // Wortmarke oben links: Werkzeugsymbol im abgerundeten Quadrat
    `<g transform="translate(${rand},64)">`,
    `<rect width="56" height="56" rx="13" fill="${OG_FARBEN.akzent}"/>`,
    `<path d="M12 38h32M16 38V24m24 14V24M16 24l5-5h14l5 5M16 24h24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`,
    `<circle cx="28" cy="16" r="2.7" fill="#fff"/>`,
    `</g>`,
    `<path d="${textPath(fontFett, 'Werkbank', rand + 74, 104, 34)}" fill="${OG_FARBEN.text}"/>`,
  ];

  if (kategorie) {
    stuecke.push(
      `<path d="${textPath(fontNormal, kategorie.toUpperCase(), rand, startY - blockHoehe / zeilen.length - 26, 24)}" fill="${OG_FARBEN.akzent}"/>`,
    );
  }

  zeilen.forEach((z, i) => {
    stuecke.push(
      `<path d="${textPath(fontFett, z, rand, startY + i * zeilenhoehe, titelGroesse)}" fill="${OG_FARBEN.text}"/>`,
    );
  });

  if (untertitel) {
    const kurz = wrapText(fontNormal, untertitel, 28, nutzbar, 1)[0] ?? '';
    stuecke.push(
      `<path d="${textPath(fontNormal, kurz, rand, startY + blockHoehe + 18, 28)}" fill="${OG_FARBEN.gedaempft}"/>`,
    );
  }

  stuecke.push(
    `<rect x="${rand}" y="${OG_HEIGHT - 96}" width="180" height="5" rx="2.5" fill="${OG_FARBEN.akzent}"/>`,
    `<path d="${textPath(fontNormal, 'werkbank-rechner.de', rand, OG_HEIGHT - 48, 26)}" fill="${OG_FARBEN.gedaempft}"/>`,
  );

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" ` +
    `viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}" role="img" aria-label="${esc(titel)}">` +
    stuecke.join('') +
    `</svg>`
  );
}
