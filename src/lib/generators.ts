/**
 * Registry der interaktiven Generatoren (eigene Seiten unter /generatoren/<slug>).
 * Generatoren sind – anders als die rechner-basierten Tools – maßgeschneiderte
 * Seiten mit SVG/Canvas-Ausgabe und Datei-Export.
 */
export interface Generator {
  slug: string;
  title: string;
  shortTitle?: string;
  description: string;
  keywords: string[];
}

export const GENERATORS: Generator[] = [
  {
    slug: 'lochkreis',
    title: 'Lochkreis-Generator (SVG & DXF)',
    shortTitle: 'Lochkreis',
    description:
      'Erzeuge ein präzises Lochkreis-Bohrbild mit allen Koordinaten und exportiere es als SVG oder DXF für CNC, Laser und Fräse.',
    keywords: [
      'lochkreis berechnen',
      'lochkreis generator',
      'bohrbild lochkreis',
      'teilkreis bohrungen berechnen',
      'bolt circle generator',
    ],
  },
];

export const getGenerator = (slug: string): Generator | undefined =>
  GENERATORS.find((g) => g.slug === slug);
