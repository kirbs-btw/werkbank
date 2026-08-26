import { describe, it, expect } from 'vitest';
import { CROSS_LINKS, crossTools } from '../src/lib/crosslinks';
import { TOOLS, getTool } from '../src/lib/registry';
import { CATEGORIES } from '../src/lib/categories';

describe('Querverweise zwischen den Bereichen', () => {
  it('zeigen alle auf existierende Rechner', () => {
    const tot: string[] = [];
    for (const [a, b] of CROSS_LINKS) {
      if (!getTool(a)) tot.push(a);
      if (!getTool(b)) tot.push(b);
    }
    expect(tot, tot.join(', ')).toEqual([]);
  });

  it('überschreiten tatsächlich eine Kategoriegrenze', () => {
    // Sonst wäre der Eintrag im falschen Werkzeug: Verweise innerhalb einer
    // Kategorie gehören in `related`, nicht hierher.
    const drin: string[] = [];
    for (const [a, b] of CROSS_LINKS) {
      const ta = getTool(a);
      const tb = getTool(b);
      if (ta && tb && ta.category === tb.category) drin.push(`${a} ↔ ${b} (beide ${ta.category})`);
    }
    expect(drin, drin.join(' | ')).toEqual([]);
  });

  it('enthalten keine Selbstverweise und keine Wiederholungen', () => {
    const gesehen = new Set<string>();
    for (const [a, b] of CROSS_LINKS) {
      expect(a, 'Selbstverweis').not.toBe(b);
      const id = a < b ? `${a}|${b}` : `${b}|${a}`;
      expect(gesehen.has(id), `doppelt: ${id}`).toBe(false);
      gesehen.add(id);
    }
  });

  it('gelten in beide Richtungen', () => {
    for (const [a, b] of CROSS_LINKS) {
      const ta = getTool(a)!;
      const tb = getTool(b)!;
      expect(crossTools(ta, 99).map((t) => t.slug), `${a} → ${b}`).toContain(b);
      expect(crossTools(tb, 99).map((t) => t.slug), `${b} → ${a}`).toContain(a);
    }
  });

  it('liefern nie den Rechner selbst oder etwas aus seiner Kategorie', () => {
    for (const t of TOOLS) {
      for (const z of crossTools(t, 99)) {
        expect(z.slug, t.slug).not.toBe(t.slug);
        expect(z.category, `${t.slug} → ${z.slug}`).not.toBe(t.category);
      }
    }
  });

  it('halten sich an die Obergrenze', () => {
    for (const t of TOOLS) expect(crossTools(t, 2).length).toBeLessThanOrEqual(2);
  });

  it('verbinden alle Kategorien zu einem Netz', () => {
    // Vorher zerfiel die Seite in sechs Inseln: Von 409 Verweisen führte genau
    // einer über eine Kategoriegrenze. Jetzt muss jede Kategorie von jeder
    // anderen aus erreichbar sein – über beliebig viele Zwischenschritte.
    const nachbarn = new Map<string, Set<string>>();
    for (const c of CATEGORIES) if (c.slug !== 'generatoren') nachbarn.set(c.slug, new Set());
    for (const [a, b] of CROSS_LINKS) {
      const ta = getTool(a)!;
      const tb = getTool(b)!;
      nachbarn.get(ta.category)?.add(tb.category);
      nachbarn.get(tb.category)?.add(ta.category);
    }
    const start = [...nachbarn.keys()][0];
    const erreicht = new Set([start]);
    const rest = [start];
    while (rest.length > 0) {
      for (const n of nachbarn.get(rest.pop()!) ?? []) {
        if (!erreicht.has(n)) {
          erreicht.add(n);
          rest.push(n);
        }
      }
    }
    const fehlt = [...nachbarn.keys()].filter((c) => !erreicht.has(c));
    expect(fehlt, `nicht erreichbar: ${fehlt.join(', ')}`).toEqual([]);
  });

  it('erreichen einen nennenswerten Teil der Rechner', () => {
    // Kein Selbstzweck: Die Verweise sollen tragen, nicht nur existieren.
    const mit = TOOLS.filter((t) => crossTools(t).length > 0);
    expect(mit.length).toBeGreaterThan(45);
  });
});
