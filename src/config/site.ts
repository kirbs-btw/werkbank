/**
 * Zentrale Marken- & Site-Konfiguration.
 * Marke/Domain hier ändern → wirkt überall.
 */
export const SITE = {
  name: 'Werkbank',
  domain: 'werkbank-rechner.de',
  url: 'https://www.werkbank-rechner.de',
  // Claim / Tagline
  tagline: 'Rechner, Tabellen & Generatoren für Werkstatt & Maker',
  description:
    'Kostenlose Online-Rechner und Generatoren für Maker: 3D-Druck, CNC, Laser, Holz, Metall und Schrauben. Schnell, präzise, ohne Anmeldung.',
  locale: 'de',
  ogLocale: 'de_DE',
  lang: 'de-DE',
  author: 'Werkbank',
  themeColor: '#ea580c',
  // Primäre Navigation (Kategorien werden automatisch ergänzt)
  email: 'kontakt@werkbank-rechner.de',
} as const;

export const NAV_MAIN = [
  { label: 'Alle Rechner', href: '/rechner' },
  { label: 'Kategorien', href: '/#kategorien' },
  { label: 'Über uns', href: '/ueber-uns' },
] as const;
