// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { SITE } from './src/config/site.ts';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  trailingSlash: 'never',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      // noindex-Seiten nicht in die Sitemap aufnehmen (widersprüchliche Crawl-Signale vermeiden)
      filter: (page) =>
        !['/impressum', '/impressum/', '/datenschutz', '/datenschutz/'].includes(
          new URL(page).pathname,
        ),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
