import { describe, it, expect } from 'vitest';
import { TOOLS } from '../src/lib/registry';
import type { Tool } from '../src/lib/types';

/**
 * Alle Zeichenketten, die ein Leser tatsächlich zu sehen bekommt.
 *
 * Bezeichner bleiben ausdrücklich draußen: `slug`, `id` und `value` dürfen und
 * sollen ASCII sein – ein Feld darf `id: 'laenge'` heißen, seine Beschriftung
 * muss aber „Länge" lauten. Auch die Suchwörter bleiben unberührt: Wer
 * transliteriert sucht, soll trotzdem fündig werden.
 */
function sichtbarerText(t: Tool): [string, string][] {
  const out: [string, string][] = [];
  const add = (feld: string, v: unknown): void => {
    if (typeof v === 'string' && v.length > 0) out.push([feld, v]);
  };
  add('title', t.title);
  add('shortTitle', t.shortTitle);
  add('description', t.description);
  add('intro', t.intro);
  add('formula', t.formula);
  (t.howto ?? []).forEach((h, i) => add(`howto[${i}]`, h));
  (t.faq ?? []).forEach((f, i) => {
    add(`faq[${i}].q`, f.q);
    add(`faq[${i}].a`, f.a);
  });
  for (const inp of t.inputs) {
    add(`input.${inp.id}.label`, inp.label);
    add(`input.${inp.id}.unit`, inp.unit);
    add(`input.${inp.id}.help`, inp.help);
    if (inp.type === 'select') for (const o of inp.options) add(`input.${inp.id}.option`, o.label);
  }
  try {
    const defaults = Object.fromEntries(t.inputs.map((i) => [i.id, i.default]));
    for (const r of t.compute(defaults)) {
      add('result.label', r.label);
      add('result.unit', r.unit);
      add('result.help', r.help);
    }
  } catch {
    /* Rechner mit Sonderfällen – die prüfen ihre eigenen Tests. */
  }
  return out;
}

/**
 * Wortteile, die es im Deutschen so nicht gibt – wer sie schreibt, hat einen
 * Umlaut umschrieben. Bewusst als Wortteile und nicht als ganze Wörter: So
 * werden auch Zusammensetzungen erwischt, etwa „Gewindeueberstand".
 */
const UMSCHRIEBEN = [
  'fuer', 'ueber', 'groess', 'hoeh', 'laeng', 'waehl', 'staerke', 'schluessel',
  'zusaetz', 'gewuensch', 'naechst', 'moeglich', 'koenn', 'muess', 'verhaeltnis',
  'abhaeng', 'erhoeh', 'kuerz', 'oeffnung', 'aeuss', 'maessig', 'durchfuehr',
  'beruecksicht', 'tatsaechlich', 'jaehrlich', 'duesen', 'geraet', 'saetze',
  'naeherung', 'praezis', 'gueltig', 'gehoert', 'noetig', 'haengt', 'zaehne',
  'abkuehl', 'wuerfel', 'buendig', 'ergaenz', 'beschaedig', 'waehrend', 'aender',
  'schliesslich', 'anschliessend', 'ausreiss', 'reisst', 'fussnote', 'aussenmass',
  'sollmass', 'restmass', 'endmass', 'modellmass',
];

describe('Umlaute im sichtbaren Text', () => {
  it('kein Rechner schreibt Umlaute um', () => {
    // Vorher: 177 Fundstellen in 20 Rechnern – „fuer", „Laenge", „Gewindeueberstand".
    // Das liest sich nach Notlösung aus einer Zeit ohne Umlaute auf der Tastatur.
    const funde: string[] = [];
    for (const t of TOOLS) {
      for (const [feld, text] of sichtbarerText(t)) {
        const klein = text.toLowerCase();
        for (const teil of UMSCHRIEBEN) {
          if (klein.includes(teil)) funde.push(`${t.slug} / ${feld}: „${teil}" in „${text.slice(0, 60)}…"`);
        }
      }
    }
    expect(funde, funde.slice(0, 8).join('\n')).toEqual([]);
  });

  it('lässt Bezeichner und Suchwörter in Ruhe', () => {
    // Gegenprobe: Es gibt weiterhin Felder, die `laenge` heißen – das ist
    // richtig so, und die Regel darf sie nicht anfassen.
    const mitAsciiId = TOOLS.filter((t) => t.inputs.some((i) => /^(laenge|hoehe|groesse|breite)$/.test(i.id)));
    expect(mitAsciiId.length).toBeGreaterThan(0);
    for (const t of mitAsciiId) {
      for (const i of t.inputs) {
        if (i.id === 'laenge') expect(i.label, t.slug).not.toContain('Laenge');
      }
    }
  });

  it('behält Fachzeichen, die keine Umschreibung sind', () => {
    // `ae` ist beim Fräsen das Formelzeichen der Eingriffsbreite, nicht „ä“.
    const spanungsdicke = TOOLS.find((t) => t.slug === 'mittlere-spanungsdicke');
    expect(spanungsdicke?.inputs.some((i) => i.id === 'ae')).toBe(true);
  });
});
