import type { Tool, CategorySlug } from './types';

/**
 * Auto-Registry: sammelt alle Tools aus src/tools/** ein.
 * Neue Rechner = einfach neue Datei anlegen, die `export const tool: Tool` exportiert.
 * Kein zentrales File muss editiert werden → konfliktfreies paralleles Anlegen.
 */
const modules = import.meta.glob<{ tool: Tool }>('../tools/**/*.ts', { eager: true });

export const TOOLS: Tool[] = Object.values(modules)
  .map((m) => m.tool)
  .filter((t): t is Tool => Boolean(t && t.slug))
  .sort((a, b) => a.title.localeCompare(b.title, 'de'));

export function getTool(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

export function toolsByCategory(category: CategorySlug | string): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}

export function relatedTools(tool: Tool, limit = 4): Tool[] {
  const explicit = (tool.related ?? [])
    .map((s) => getTool(s))
    .filter((t): t is Tool => Boolean(t));
  if (explicit.length >= limit) return explicit.slice(0, limit);
  // Auffüllen mit Tools aus derselben Kategorie.
  const sameCat = toolsByCategory(tool.category).filter(
    (t) => t.slug !== tool.slug && !explicit.some((e) => e.slug === t.slug),
  );
  return [...explicit, ...sameCat].slice(0, limit);
}

export function categoryCount(category: CategorySlug | string): number {
  return toolsByCategory(category).length;
}

export const TOTAL_TOOLS = TOOLS.length;
