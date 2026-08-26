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
    slug: 'living-hinge',
    title: 'Living-Hinge-Generator (Biegescharnier für Laser)',
    shortTitle: 'Living Hinge',
    description:
      'Erzeuge das Schnittmuster für ein Biegescharnier: Biegewinkel, Radius und Materialstärke eingeben – der Generator berechnet Breite und Reihen und gibt das Muster als SVG oder DXF aus.',
    keywords: [
      'living hinge generator',
      'biegescharnier laser',
      'living hinge muster',
      'holz biegen laser schlitze',
      'kerf bending muster',
      'sperrholz biegen laser',
      'federscharnier lasercut',
    ],
  },
  {
    slug: 'gridfinity-baseplate',
    title: 'Gridfinity-Grundplatten-Generator (STL)',
    shortTitle: 'Gridfinity-Grundplatte',
    description:
      'Erzeuge passende Gridfinity-Grundplatten als druckfertiges STL: Rastergröße frei wählbar, optional mit Boden – maßhaltig nach Spezifikation, direkt im Browser.',
    keywords: [
      'gridfinity baseplate generator',
      'gridfinity grundplatte stl',
      'gridfinity baseplate drucken',
      'gridfinity raster grundplatte',
      'gridfinity baseplate maße',
      'grundplatte gridfinity erstellen',
    ],
  },
  {
    slug: 'gridfinity-generator',
    title: 'Gridfinity-Generator (Bins als STL)',
    shortTitle: 'Gridfinity',
    description:
      'Erzeuge maßhaltige Gridfinity-Bins als druckfertiges STL: Rastergröße, Höhe, Fächer, Stapelrand und Magnetbohrungen frei wählbar – nach offizieller Spezifikation, direkt im Browser.',
    keywords: [
      'gridfinity generator',
      'gridfinity bin generator stl',
      'gridfinity box erstellen',
      'gridfinity einsatz generator',
      'gridfinity stl online',
      'gridfinity bin mit fächern',
      'gridfinity maße spezifikation',
    ],
  },
  {
    slug: 'dxf-svg-konverter',
    title: 'DXF ⇄ SVG Konverter',
    shortTitle: 'DXF ⇄ SVG',
    description:
      'DXF in SVG umwandeln oder SVG in DXF konvertieren – maßhaltig in Millimeter, mit Bögen, Kreisen und Layern. Die Datei bleibt in deinem Browser.',
    keywords: [
      'dxf in svg umwandeln',
      'svg in dxf konvertieren',
      'dxf konverter online kostenlos',
      'svg zu dxf laser',
      'dxf svg converter deutsch',
      'dxf datei öffnen online',
      'vektor konverter cnc',
    ],
  },
  {
    slug: 'stl-analyse',
    title: 'STL-Analyse – Volumen, Gewicht & Druckkosten',
    shortTitle: 'STL-Analyse',
    description:
      'STL-Datei per Drag & Drop analysieren: Volumen, Oberfläche, Abmessungen, Materialbedarf, Gewicht und Druckkosten – inklusive Dichtheitsprüfung. Die Datei bleibt in deinem Browser.',
    keywords: [
      'stl volumen filament rechner',
      'stl datei analysieren online',
      'stl volumen berechnen',
      'stl gewicht berechnen',
      '3d druck kosten aus stl',
      'stl viewer volumen kostenlos',
      'stl wasserdicht prüfen',
      'filament verbrauch stl',
    ],
  },
  {
    slug: 'fingerzinken-box',
    title: 'Fingerzinken-Box-Generator (Kiste als SVG & DXF)',
    shortTitle: 'Fingerzinken-Box',
    description:
      'Erzeuge eine passgenaue Kiste mit Fingerzinken: Maße, Materialstärke und Schnittfuge eingeben – alle Zuschnitte werden fertig verzinkt als SVG oder DXF für Laser und CNC ausgegeben.',
    keywords: [
      'fingerzinken box generator',
      'laser box generator deutsch',
      'kiste fingerzinken generator',
      'box generator svg dxf',
      'kiste lasern vorlage',
      'fingerzinken berechnen',
      'holzkiste konstruieren online',
    ],
  },
  {
    slug: 'zuschnittoptimierung',
    title: 'Zuschnittoptimierung – Plattenzuschnitt & Schnittplan',
    shortTitle: 'Zuschnittoptimierung',
    description:
      'Optimiere deinen Plattenzuschnitt kostenlos: Teileliste eingeben, Verschnitt minimieren und den fertigen Schnittplan drucken oder als SVG speichern – unbegrenzt viele Teile, ohne Anmeldung.',
    keywords: [
      'zuschnittoptimierung online',
      'zuschnittoptimierung kostenlos',
      'plattenzuschnitt rechner',
      'verschnittoptimierung online',
      'schnittplan erstellen online',
      'sägeplan optimierung kostenlos',
      'plattenaufteilung rechner',
      'cutlist optimizer deutsch',
    ],
  },
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
  {
    slug: 'zahnrad',
    title: 'Zahnrad-Generator (Evolvente, SVG & DXF)',
    shortTitle: 'Zahnrad',
    description:
      'Erzeuge ein Stirnrad mit Evolventenverzahnung aus Modul, Zähnezahl und Eingriffswinkel – mit allen Maßen und Export als SVG oder DXF.',
    keywords: [
      'zahnrad generator',
      'zahnrad zeichnen dxf',
      'evolventenverzahnung berechnen',
      'stirnrad modul zähnezahl',
      'gear generator dxf',
    ],
  },
];

export const getGenerator = (slug: string): Generator | undefined =>
  GENERATORS.find((g) => g.slug === slug);
