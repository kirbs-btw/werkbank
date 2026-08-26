// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { SITE } from './src/config/site.ts';
import { lastmodFor, normalizePath } from './src/lib/lastmod.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  trailingSlash: 'never',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      // noindex-Seiten nicht in die Sitemap aufnehmen (widersprüchliche Crawl-Signale vermeiden)
      filter: (page) =>
        !['/impressum', '/impressum/', '/datenschutz', '/datenschutz/'].includes(
          new URL(page).pathname,
        ),
      // Kein globaler Build-Zeitstempel: Jede Seite meldet ihr echtes
      // Änderungsdatum, sonst ist das lastmod-Signal wertlos.
      serialize(item) {
        const path = normalizePath(item.url);
        item.lastmod = lastmodFor(path);
        item.priority = path === '/' ? 1 : path === '/rechner' || path.startsWith('/kategorie/') ? 0.8 : 0.7;
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
