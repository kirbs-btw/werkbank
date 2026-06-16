import type { Tool, ToolResult, InputValues } from '../lib/types';
import { formatResult } from '../lib/format';

// Lazy-Glob: jedes Tool wird ein eigener Chunk → nur das benötigte wird geladen.
const modules = import.meta.glob<{ tool: Tool }>('../tools/**/*.ts');

async function loadTool(slug: string): Promise<Tool | null> {
  const key = Object.keys(modules).find((k) => k.endsWith(`/${slug}.ts`));
  if (!key) return null;
  const mod = await modules[key]();
  return mod.tool ?? null;
}

function readValues(form: HTMLFormElement, tool: Tool): InputValues {
  const values: InputValues = {};
  for (const input of tool.inputs) {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(
      `[data-input="${input.id}"]`,
    );
    if (!el) {
      values[input.id] = input.default;
      continue;
    }
    if (input.type === 'number') {
      const v = parseFloat(el.value.replace(',', '.'));
      values[input.id] = Number.isFinite(v) ? v : input.default;
    } else {
      values[input.id] = el.value;
    }
  }
  return values;
}

function renderResults(container: HTMLElement, results: ToolResult[]): void {
  container.innerHTML = results
    .map((r) => {
      const f = formatResult(r);
      const unit = f.unit
        ? ` <span class="text-sm font-sans text-zinc-500">${f.unit}</span>`
        : '';
      const help = r.help
        ? `<span class="mt-0.5 block text-xs font-normal text-zinc-500">${r.help}</span>`
        : '';
      return `<div class="flex items-baseline justify-between gap-4 border-b border-zinc-100 py-3 last:border-0 ${
        r.primary ? 'text-lg' : ''
      }"><span class="${
        r.primary ? 'font-semibold text-zinc-900' : 'text-zinc-600'
      }">${r.label}${help}</span><span class="whitespace-nowrap font-mono font-semibold ${
        r.primary ? 'text-brand-700' : 'text-zinc-900'
      }">${f.value}${unit}</span></div>`;
    })
    .join('');
}

async function initRoot(root: HTMLElement): Promise<void> {
  const slug = root.dataset.slug;
  if (!slug) return;
  const tool = await loadTool(slug);
  if (!tool) return;
  const form = root.querySelector<HTMLFormElement>('[data-calc-form]');
  const out = root.querySelector<HTMLElement>('[data-results]');
  if (!form || !out) return;

  const update = (): void => {
    try {
      const results = tool.compute(readValues(form, tool));
      renderResults(out, results);
    } catch {
      /* Eingabe unvollständig – Ergebnis stehen lassen. */
    }
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
}

function init(): void {
  document
    .querySelectorAll<HTMLElement>('[data-calc]')
    .forEach((root) => void initRoot(root));
}

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
