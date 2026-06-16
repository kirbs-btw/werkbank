/**
 * Kern-Datenmodell der Tool-Engine.
 * Jeder Rechner ist ein Modul, das `export const tool: Tool = {...}` bereitstellt.
 * `compute` ist eine PURE Funktion (server- und clientseitig identisch ausführbar, testbar).
 */

export type CategorySlug =
  | '3d-druck'
  | 'cnc'
  | 'holz'
  | 'metall'
  | 'schrauben'
  | 'laser'
  | 'generatoren';

export interface NumberInput {
  type: 'number';
  id: string;
  label: string;
  default: number;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  help?: string;
}

export interface SelectInput {
  type: 'select';
  id: string;
  label: string;
  default: string;
  options: { value: string; label: string }[];
  unit?: string;
  help?: string;
}

export type ToolInput = NumberInput | SelectInput;

export type InputValues = Record<string, number | string>;

export interface ToolResult {
  label: string;
  /** Zahlen werden de-DE formatiert; Strings werden unverändert ausgegeben. */
  value: number | string;
  unit?: string;
  /** Nachkommastellen bei Zahlen (Default 2). */
  digits?: number;
  /** Hauptergebnis (hervorgehoben). */
  primary?: boolean;
  help?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface ToolExample {
  values: InputValues;
  /** Erwartete Ergebnisse (per Label gematcht). */
  expect: { label: string; value: number; tolerance?: number }[];
}

export interface Tool {
  slug: string;
  category: CategorySlug;
  /** H1 / Titel-Kern, z. B. "Filament-Kosten-Rechner". */
  title: string;
  /** Kurzer Titel für Karten/Navigation. */
  shortTitle?: string;
  /** Meta-Description + Intro-Teaser (1–2 Sätze, ~150 Zeichen). */
  description: string;
  /** Such-Keywords (für interne Verlinkung & Relevanz). */
  keywords: string[];
  inputs: ToolInput[];
  compute: (v: InputValues) => ToolResult[];
  /** Längere Einleitung (HTML erlaubt) – erscheint über/unter dem Rechner. */
  intro?: string;
  /** Schritt-für-Schritt Anleitung (HowTo-Schema). */
  howto?: string[];
  /** Formel-Hinweis (Mono dargestellt). */
  formula?: string;
  faq?: FaqItem[];
  /** Verwandte Tools (Slugs) für interne Verlinkung. */
  related?: string[];
  /** Testfälle (werden automatisch geprüft). */
  examples?: ToolExample[];
  /** ISO-Datum der letzten Aktualisierung. */
  updated?: string;
}

/** Hilfsfunktion für saubere number-Inputs in compute. */
export function num(v: number | string, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : fallback;
}
