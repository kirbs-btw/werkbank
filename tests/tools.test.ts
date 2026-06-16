import { describe, it, expect } from 'vitest';
import { TOOLS } from '../src/lib/registry';
import { CATEGORIES } from '../src/lib/categories';

const categorySlugs = new Set(CATEGORIES.map((c) => c.slug));

describe('Tool-Registry', () => {
  it('enthält Tools', () => {
    expect(TOOLS.length).toBeGreaterThan(0);
  });

  it('hat eindeutige Slugs', () => {
    const slugs = TOOLS.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('alle Slugs sind URL-tauglich (klein, a-z0-9-)', () => {
    for (const t of TOOLS) {
      expect(t.slug, t.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe.each(TOOLS.map((t) => [t.slug, t] as const))('Tool: %s', (_slug, tool) => {
  it('hat gültige Grunddaten', () => {
    expect(tool.title.length).toBeGreaterThan(3);
    expect(tool.description.length).toBeGreaterThan(10);
    expect(categorySlugs.has(tool.category)).toBe(true);
    expect(tool.inputs.length).toBeGreaterThan(0);
    expect(tool.keywords.length).toBeGreaterThan(0);
  });

  it('compute liefert mit Default-Werten ein Ergebnis', () => {
    const defaults = Object.fromEntries(tool.inputs.map((i) => [i.id, i.default]));
    const res = tool.compute(defaults);
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThan(0);
    for (const r of res) {
      expect(r.label).toBeTruthy();
      if (typeof r.value === 'number') expect(Number.isFinite(r.value)).toBe(true);
    }
  });

  const examples = tool.examples ?? [];
  if (examples.length > 0) {
    it.each(examples.map((ex, i) => [i + 1, ex] as const))(
      'Beispiel %i stimmt',
      (_i, ex) => {
        const res = tool.compute(ex.values);
        for (const e of ex.expect) {
          const r = res.find((x) => x.label === e.label);
          expect(r, `Ergebnis "${e.label}" fehlt`).toBeTruthy();
          const val = typeof r!.value === 'number' ? r!.value : parseFloat(String(r!.value));
          expect(Math.abs(val - e.value), `${e.label}: ${val} ≠ ${e.value}`).toBeLessThanOrEqual(
            e.tolerance ?? 0.01,
          );
        }
      },
    );
  }
});
