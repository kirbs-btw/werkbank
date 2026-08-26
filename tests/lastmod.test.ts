import { describe, it, expect } from 'vitest';
import { lastmodFor, newest, normalizePath, formatDate, SITE_START } from '../src/lib/lastmod';
import { TOOLS } from '../src/lib/registry';
import { GENERATORS } from '../src/lib/generators';
import { CATEGORIES } from '../src/lib/categories';
import { softwareAppLd, generatorAppLd } from '../src/lib/schema';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

describe('Datumsangaben der Module', () => {
  it('jeder Rechner hat ein gültiges ISO-Datum', () => {
    for (const t of TOOLS) {
      expect(t.updated, t.slug).toBeDefined();
      expect(t.updated!, t.slug).toMatch(ISO);
    }
  });

  it('jeder Generator hat ein gültiges ISO-Datum', () => {
    for (const g of GENERATORS) {
      expect(g.updated, g.slug).toMatch(ISO);
    }
  });

  it('kein Datum liegt vor dem Seitenstart oder in der Zukunft', () => {
    // Ein Datum in der Zukunft waere ein wertloses Frische-Signal.
    const heute = new Date().toISOString().slice(0, 10);
    for (const d of [...TOOLS.map((t) => t.updated!), ...GENERATORS.map((g) => g.updated)]) {
      expect(d >= SITE_START, `${d} liegt vor dem Seitenstart`).toBe(true);
      expect(d <= heute, `${d} liegt in der Zukunft`).toBe(true);
    }
  });
});

describe('normalizePath', () => {
  it('macht aus URLs und Pfaden dieselbe Form', () => {
    expect(normalizePath('https://www.werkbank-rechner.de/rechner/abc')).toBe('/rechner/abc');
    expect(normalizePath('https://www.werkbank-rechner.de/rechner/abc/')).toBe('/rechner/abc');
    expect(normalizePath('/rechner/abc?x=1#y')).toBe('/rechner/abc');
    expect(normalizePath('rechner/abc')).toBe('/rechner/abc');
    expect(normalizePath('https://www.werkbank-rechner.de')).toBe('/');
    expect(normalizePath('/')).toBe('/');
  });
});

describe('newest', () => {
  it('liefert das jüngste Datum', () => {
    expect(newest(['2026-06-15', '2026-08-25', '2026-07-01'])).toBe('2026-08-25');
  });

  it('fällt bei leerer oder ungültiger Eingabe auf den Seitenstart zurück', () => {
    expect(newest([])).toBe(SITE_START);
    expect(newest([undefined, 'kaputt', ''])).toBe(SITE_START);
  });
});

describe('lastmodFor', () => {
  it('gibt Rechnerseiten ihr eigenes Datum', () => {
    for (const t of TOOLS.slice(0, 20)) {
      expect(lastmodFor(`/rechner/${t.slug}`)).toBe(t.updated);
    }
  });

  it('gibt Generatorseiten ihr eigenes Datum', () => {
    for (const g of GENERATORS) {
      expect(lastmodFor(`/generatoren/${g.slug}`)).toBe(g.updated);
    }
  });

  it('nimmt für Kategorieseiten das jüngste Datum ihrer Einträge', () => {
    for (const c of CATEGORIES) {
      const eigene = TOOLS.filter((t) => t.category === c.slug).map((t) => t.updated);
      if (c.slug === 'generatoren') eigene.push(...GENERATORS.map((g) => g.updated));
      expect(lastmodFor(`/kategorie/${c.slug}`), c.slug).toBe(newest(eigene));
    }
  });

  it('nimmt für Start- und Übersichtsseite das jüngste Datum überhaupt', () => {
    const alle = newest([...TOOLS.map((t) => t.updated), ...GENERATORS.map((g) => g.updated)]);
    expect(lastmodFor('/')).toBe(alle);
    expect(lastmodFor('/rechner')).toBe(alle);
  });

  it('liefert für unbekannte Pfade den Seitenstart statt zu raten', () => {
    expect(lastmodFor('/ueber-uns')).toBe(SITE_START);
    expect(lastmodFor('/gibt-es-nicht')).toBe(SITE_START);
    expect(lastmodFor('/rechner/gibt-es-nicht')).toBe(SITE_START);
  });

  it('behandelt vollständige URLs wie Pfade', () => {
    const t = TOOLS[0];
    expect(lastmodFor(`https://www.werkbank-rechner.de/rechner/${t.slug}`)).toBe(t.updated);
  });

  it('meldet nicht für jede Seite dasselbe Datum', () => {
    // Genau das war der Fehler vorher: ein Build-Zeitstempel fuer alles.
    const werte = new Set(TOOLS.map((t) => lastmodFor(`/rechner/${t.slug}`)));
    expect(werte.size).toBeGreaterThan(1);
  });
});

describe('formatDate', () => {
  it('schreibt deutsche Datumsangaben', () => {
    expect(formatDate('2026-08-26')).toBe('26.08.2026');
    expect(formatDate('2026-06-15')).toBe('15.06.2026');
  });

  it('fängt kaputte Werte ab', () => {
    expect(formatDate('unsinn')).toBe(formatDate(SITE_START));
  });
});

describe('JSON-LD Datumsangaben', () => {
  it('Rechner tragen ihr Änderungsdatum im Schema', () => {
    const t = TOOLS.find((x) => x.updated)!;
    const ld = softwareAppLd(t, `/rechner/${t.slug}`) as Record<string, unknown>;
    expect(ld.dateModified).toBe(t.updated);
    expect(ld.datePublished).toBe(SITE_START);
    expect(ld['@type']).toBe('WebApplication');
  });

  it('Generatoren ebenso', () => {
    const g = GENERATORS[0];
    const ld = generatorAppLd(g, `/generatoren/${g.slug}`) as Record<string, unknown>;
    expect(ld.dateModified).toBe(g.updated);
    expect(ld.applicationCategory).toBe('DesignApplication');
    expect(ld.url).toContain(`/generatoren/${g.slug}`);
  });

  it('dateModified stimmt mit dem Sitemap-Datum überein', () => {
    // Widerspruechliche Signale waeren schlimmer als gar keine.
    for (const t of TOOLS.slice(0, 30)) {
      const ld = softwareAppLd(t, `/rechner/${t.slug}`) as Record<string, unknown>;
      expect(ld.dateModified).toBe(lastmodFor(`/rechner/${t.slug}`));
    }
    for (const g of GENERATORS) {
      const ld = generatorAppLd(g, `/generatoren/${g.slug}`) as Record<string, unknown>;
      expect(ld.dateModified).toBe(lastmodFor(`/generatoren/${g.slug}`));
    }
  });
});
