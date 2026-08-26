/**
 * Erzeugt zur Build-Zeit für jede Tool-, Generator- und Kategorieseite ein
 * eigenes Vorschaubild als PNG.
 *
 * Gerastert wird mit sharp, das ohnehin schon im Baum liegt (Astro nutzt es für
 * die Bildoptimierung). Das eingespeiste SVG enthält keinen Schriftbezug mehr,
 * sondern nur Pfade – siehe `ogimage.ts`.
 */

import type { APIRoute } from 'astro';
import sharp from 'sharp';
import { OG_SEITEN } from '../../lib/ogpaths';
import { ogFonts } from '../../lib/ogfonts';
import { ogSvg } from '../../lib/ogimage';

export function getStaticPaths() {
  return OG_SEITEN.map((s) => ({
    // Führenden Schrägstrich abschneiden: `/rechner/x` → `og/rechner/x.png`
    params: { pfad: s.pfad.replace(/^\//, '') },
    props: { seite: s },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { seite } = props as { seite: (typeof OG_SEITEN)[number] };
  const { fett, normal } = ogFonts();
  const svg = ogSvg({
    titel: seite.titel,
    kategorie: seite.kategorie,
    untertitel: seite.untertitel,
    fontFett: fett,
    fontNormal: normal,
  });
  const png = await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toBuffer();
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
