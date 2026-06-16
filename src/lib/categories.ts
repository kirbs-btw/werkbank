import type { CategorySlug } from './types';

export interface Category {
  slug: CategorySlug;
  name: string;
  /** Kurzbeschreibung für Kategorie-Seite + Meta. */
  description: string;
  /** SEO-Intro (1–2 Sätze). */
  tagline: string;
  /** Inline-SVG-Pfad (24x24, stroke). */
  icon: string;
  accent: string;
}

// Heroicons/Lucide-ähnliche 24x24 stroke-Pfade.
export const CATEGORIES: Category[] = [
  {
    slug: '3d-druck',
    name: '3D-Druck',
    tagline: 'Filament, Kosten, Gewicht & Druckzeit im Griff.',
    description:
      'Rechner rund um den 3D-Druck: Filamentkosten, Verbrauch, Gewicht, Druckzeit und Kalibrierung – für FDM, PLA, PETG & Co.',
    icon: 'M3 7l9-4 9 4-9 4-9-4zm0 0v10l9 4 9-4V7M12 11v10',
    accent: 'brand',
  },
  {
    slug: 'cnc',
    name: 'CNC & Fräsen',
    tagline: 'Schnittdaten, Drehzahl & Vorschub präzise berechnen.',
    description:
      'CNC-Rechner für Schnittgeschwindigkeit, Drehzahl, Vorschub und Zahnvorschub – pro Material und Werkzeug.',
    icon: 'M12 2v4m0 12v4M4.9 4.9l2.8 2.8m8.6 8.6l2.8 2.8M2 12h4m12 0h4M4.9 19.1l2.8-2.8m8.6-8.6l2.8-2.8M12 8a4 4 0 100 8 4 4 0 000-8z',
    accent: 'brand',
  },
  {
    slug: 'holz',
    name: 'Holz & Zuschnitt',
    tagline: 'Volumen, Gewicht, Brettmeter & Verschnitt optimieren.',
    description:
      'Holz-Rechner: Festmeter, Raummeter, Brettmeter, Holzgewicht und Zuschnitt- bzw. Verschnittoptimierung.',
    icon: 'M3 9l9-6 9 6v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm4 11V12h10v8',
    accent: 'brand',
  },
  {
    slug: 'metall',
    name: 'Metall & Blech',
    tagline: 'Materialgewicht, Blechabwicklung & K-Faktor.',
    description:
      'Metall-Rechner: Gewicht von Stahl, Alu & Edelstahl nach Profil, Blechabwicklung, Biegezugabe und K-Faktor.',
    icon: 'M4 6h16v4H4zM4 14h16v4H4z',
    accent: 'brand',
  },
  {
    slug: 'schrauben',
    name: 'Schrauben & Gewinde',
    tagline: 'Anzugsmoment, Kernloch & Gewindetabellen.',
    description:
      'Schrauben- & Gewinde-Rechner: Anzugsdrehmoment nach Festigkeitsklasse, Kernlochbohrer-Durchmesser und metrische Gewindetabellen.',
    icon: 'M12 2v6m0 0l-2 2 2 2 2-2-2-2zm0 6v12m-3-3h6m-6 3h6',
    accent: 'brand',
  },
  {
    slug: 'laser',
    name: 'Laser',
    tagline: 'Kerf, Schnittzeit, -kosten & Gravurzeit berechnen.',
    description:
      'Laser-Rechner: Kerf-/Fugen-Kompensation, Schnittzeit und Schnittkosten, Gravurzeit und Material-Einstellwerte für CO₂- und Diodenlaser.',
    icon: 'M12 2v5m0 10v5M2 12h5m10 0h5M12 9a3 3 0 100 6 3 3 0 000-6z',
    accent: 'brand',
  },
  {
    slug: 'generatoren',
    name: 'Generatoren',
    tagline: 'Bohrbilder & Muster als SVG/DXF erzeugen.',
    description:
      'Parametrische Generatoren: erzeuge Lochkreis-Bohrbilder als druck- und laserfertige SVG/DXF-Dateien für CNC, Laser und Fräse.',
    icon: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 5a4 4 0 100 8 4 4 0 000-8z',
    accent: 'brand',
  },
];

export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

export function getCategory(slug: string): Category | undefined {
  return CATEGORY_MAP[slug];
}
