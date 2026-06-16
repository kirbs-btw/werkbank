# Werkbank

Programmatischer SEO-Multi-Tool-Hub für Maker & Werkstatt (3D-Druck, CNC, Laser, Holz, Metall, Schrauben).
Gebaut mit **Astro + TypeScript + Tailwind v4**, statisch generiert (Top-Core-Web-Vitals), DE-first.

## Befehle

```bash
npm install      # Abhängigkeiten installieren
npm run dev      # Dev-Server (http://localhost:4321)
npm run build    # Statische Produktion nach dist/
npm run preview  # gebaute Seite lokal testen
npm test         # Unit-Tests aller Rechner (vitest)
npm run check    # Astro/TypeScript-Typprüfung
```

## Architektur

- **`src/tools/<kategorie>/<slug>.ts`** – jeder Rechner ist ein eigenständiges, getestetes Modul
  (`export const tool: Tool`). `compute()` ist eine pure Funktion (server- + clientseitig).
- **`src/lib/registry.ts`** – sammelt Tools automatisch per `import.meta.glob` ein
  (neue Rechner = einfach neue Datei, kein zentrales File editieren → konfliktfrei skalierbar).
- **`src/components/Calculator.astro`** – generische Insel: rendert Formular + SSR-Default-Ergebnis,
  `src/scripts/calculator.ts` rechnet live im Browser.
- **SEO**: `BaseHead.astro` (Canonical, OG, hreflang), JSON-LD (`WebApplication`, `FAQPage`,
  `BreadcrumbList`, `WebSite`, `Organization`) via `src/lib/schema.ts`, Sitemap (`@astrojs/sitemap`),
  `robots.txt`.

## Neuen Rechner hinzufügen

1. Datei `src/tools/<kategorie>/<slug>.ts` anlegen.
2. `export const tool: Tool = { slug, category, title, description, keywords, inputs, compute, ... }`.
3. Mindestens ein `examples`-Eintrag (wird automatisch getestet).

Marke/Domain zentral in `src/config/site.ts`.
