/**
 * opentype.js liefert keine Typdeklarationen mit. Gebraucht wird nur ein
 * schmaler Ausschnitt – Datei einlesen und Glyphen zu Pfaden machen. Die
 * fachliche Schnittstelle steht in `ogimage.ts` als `FontLike`; hier steht
 * lediglich, was das Paket selbst hergibt.
 */
declare module 'opentype.js' {
  export interface Path {
    toPathData(dezimalstellen?: number): string;
    extend(pfad: Path): void;
  }
  export interface Glyph {
    index: number;
    advanceWidth: number;
    getPath(x: number, y: number, groesse: number): Path;
  }
  export interface Font {
    unitsPerEm: number;
    charToGlyph(zeichen: string): Glyph;
    getKerningValue(a: Glyph, b: Glyph): number;
    getAdvanceWidth(text: string, groesse: number): number;
  }
  export function parse(puffer: ArrayBuffer): Font;
  const _default: { parse: typeof parse };
  export default _default;
}
