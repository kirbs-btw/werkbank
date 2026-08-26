import type { Tool, ToolResult, InputValues } from '../lib/types';
import { formatResult } from '../lib/format';
import { decodeValues, shareUrl } from '../lib/shareurl';

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

/**
 * Werte aus der Adresszeile in die Felder schreiben. Was dort nicht steht oder
 * nicht taugt, bleibt auf der Voreinstellung – geprüft wird in `decodeValues`.
 */
function applyFromUrl(form: HTMLFormElement, tool: Tool): void {
  const werte = decodeValues(tool, window.location.search);
  for (const [id, wert] of Object.entries(werte)) {
    const el = form.querySelector<HTMLInputElement | HTMLSelectElement>(`[data-input="${id}"]`);
    if (el) el.value = String(wert);
  }
}

/**
 * Adresszeile nachführen, damit sich der Stand teilen und neu laden lässt.
 *
 * Bewusst verzögert und nur bei echter Änderung: Safari lässt rund 100
 * `replaceState`-Aufrufe je 30 Sekunden zu und wirft danach einen Fehler –
 * bei jedem Tastendruck zu schreiben, wäre also ein sicherer Weg in die
 * Ausnahme.
 */
function makeUrlWriter(tool: Tool): (values: InputValues) => void {
  let timer = 0;
  let zuletzt = '';
  return (values: InputValues): void => {
    const ziel = shareUrl(tool, values, window.location.href);
    if (ziel === zuletzt) return;
    zuletzt = ziel;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      try {
        window.history.replaceState(null, '', ziel);
      } catch {
        /* Adresszeile ist ein Zusatz, kein Muss – Rechner läuft weiter. */
      }
    }, 400);
  };
}

async function initRoot(root: HTMLElement): Promise<void> {
  const slug = root.dataset.slug;
  if (!slug) return;
  const tool = await loadTool(slug);
  if (!tool) return;
  const form = root.querySelector<HTMLFormElement>('[data-calc-form]');
  const out = root.querySelector<HTMLElement>('[data-results]');
  if (!form || !out) return;

  applyFromUrl(form, tool);
  const schreibeUrl = makeUrlWriter(tool);

  const update = (): void => {
    const werte = readValues(form, tool);
    try {
      renderResults(out, tool.compute(werte));
    } catch {
      /* Eingabe unvollständig – Ergebnis stehen lassen. */
    }
    schreibeUrl(werte);
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();

  const teilen = root.querySelector<HTMLButtonElement>('[data-share]');
  if (teilen) {
    const beschriftung = teilen.textContent ?? 'Link kopieren';
    teilen.addEventListener('click', async () => {
      const url = shareUrl(tool, readValues(form, tool), window.location.href);
      let geklappt = false;
      try {
        await navigator.clipboard.writeText(url);
        geklappt = true;
      } catch {
        /* Zwischenablage verweigert – dann eben der Hinweis unten. */
      }
      teilen.textContent = geklappt ? 'Link kopiert' : 'Kopieren nicht möglich';
      window.setTimeout(() => {
        teilen.textContent = beschriftung;
      }, 2000);
    });
  }
}

function init(): void {
  document
    .querySelectorAll<HTMLElement>('[data-calc]')
    .forEach((root) => void initRoot(root));
}

if (document.readyState !== 'loading') init();
else document.addEventListener('DOMContentLoaded', init);
