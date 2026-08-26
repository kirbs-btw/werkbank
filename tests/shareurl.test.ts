import { describe, it, expect } from 'vitest';
import { encodeValues, decodeValues, shareUrl, istVoreinstellung } from '../src/lib/shareurl';
import { TOOLS } from '../src/lib/registry';
import type { Tool } from '../src/lib/types';

const testTool = (): Tool => ({
  slug: 'probe',
  category: 'cnc',
  title: 'Probe',
  description: 'Nur für den Test.',
  keywords: ['probe'],
  inputs: [
    { type: 'number', id: 'laenge', label: 'Länge', unit: 'mm', default: 100, min: 1, max: 1000 },
    { type: 'number', id: 'anzahl', label: 'Anzahl', default: 4 },
    {
      type: 'select',
      id: 'material',
      label: 'Material',
      default: 'stahl',
      options: [
        { value: 'stahl', label: 'Stahl' },
        { value: 'alu', label: 'Aluminium' },
      ],
    },
  ],
  compute: () => [{ label: 'Ergebnis', value: 1 }],
});

describe('Eingaben in der Adresszeile', () => {
  const t = testTool();

  it('nimmt nur auf, was von der Voreinstellung abweicht', () => {
    expect(encodeValues(t, { laenge: 100, anzahl: 4, material: 'stahl' })).toBe('');
    expect(encodeValues(t, { laenge: 250, anzahl: 4, material: 'stahl' })).toBe('?laenge=250');
    expect(encodeValues(t, { laenge: 250, anzahl: 4, material: 'alu' })).toBe('?laenge=250&material=alu');
  });

  it('erkennt die Voreinstellung auch als Text', () => {
    expect(istVoreinstellung(t.inputs[0], '100')).toBe(true);
    expect(istVoreinstellung(t.inputs[0], 100)).toBe(true);
    expect(istVoreinstellung(t.inputs[0], 101)).toBe(false);
    expect(istVoreinstellung(t.inputs[2], 'stahl')).toBe(true);
    expect(istVoreinstellung(t.inputs[2], 'alu')).toBe(false);
  });

  it('übergeht leere Werte', () => {
    expect(encodeValues(t, { laenge: '', anzahl: 4, material: 'stahl' })).toBe('');
  });

  it('liest Werte wieder ein', () => {
    expect(decodeValues(t, '?laenge=250&material=alu')).toEqual({ laenge: 250, material: 'alu' });
    expect(decodeValues(t, 'laenge=250')).toEqual({ laenge: 250 }); // auch ohne Fragezeichen
  });

  it('versteht das Komma als Dezimaltrenner', () => {
    expect(decodeValues(t, '?laenge=12,5')).toEqual({ laenge: 12.5 });
  });

  it('verwirft, was nicht zum Rechner gehört', () => {
    // Ein geteilter Link kommt von außen – geglaubt wird ihm nichts.
    expect(decodeValues(t, '?gibtesnicht=5')).toEqual({});
    expect(decodeValues(t, '?laenge=abc')).toEqual({});
    expect(decodeValues(t, '?material=holz')).toEqual({}); // keine erlaubte Auswahl
    expect(decodeValues(t, '?laenge=')).toEqual({});
    expect(decodeValues(t, '')).toEqual({});
  });

  it('zieht Zahlen auf die erklärten Grenzen', () => {
    // Lieber an der Grenze rechnen als mit einer negativen Länge – und lieber
    // begrenzen als den Wunsch ganz verwerfen.
    expect(decodeValues(t, '?laenge=-5')).toEqual({ laenge: 1 });
    expect(decodeValues(t, '?laenge=99999')).toEqual({ laenge: 1000 });
    expect(decodeValues(t, '?anzahl=-3')).toEqual({ anzahl: -3 }); // ohne Grenzen bleibt es stehen
  });

  it('kommt hin und zurück auf dasselbe', () => {
    const werte = { laenge: 33.5, anzahl: 9, material: 'alu' };
    expect(decodeValues(t, encodeValues(t, werte))).toEqual(werte);
  });

  it('baut eine saubere Adresse und hängt nichts doppelt an', () => {
    const basis = 'https://www.werkbank-rechner.de/rechner/probe';
    expect(shareUrl(t, { laenge: 250 }, basis)).toBe(`${basis}?laenge=250`);
    // Vorhandene Parameter und Anker werden abgeschnitten, nicht ergänzt
    expect(shareUrl(t, { laenge: 250 }, `${basis}?alt=1#unten`)).toBe(`${basis}?laenge=250`);
    expect(shareUrl(t, { laenge: 100 }, basis)).toBe(basis);
  });

  it('maskiert Sonderzeichen', () => {
    const s = testTool();
    s.inputs = [{ type: 'select', id: 'a', label: 'A', default: 'x', options: [{ value: 'x', label: 'X' }, { value: 'a b&c', label: 'Y' }] }];
    const q = encodeValues(s, { a: 'a b&c' });
    expect(q).not.toContain(' ');
    expect(decodeValues(s, q)).toEqual({ a: 'a b&c' });
  });
});

describe('Alle echten Rechner', () => {
  it('erzeugen mit ihren Voreinstellungen eine leere Query', () => {
    // Wer nichts verstellt, teilt die schlichte Adresse – die ist zugleich die
    // kanonische.
    for (const t of TOOLS) {
      const defaults = Object.fromEntries(t.inputs.map((i) => [i.id, i.default]));
      expect(encodeValues(t, defaults), t.slug).toBe('');
    }
  });

  it('überstehen Hin- und Rückweg mit veränderten Werten', () => {
    for (const t of TOOLS) {
      const werte = Object.fromEntries(
        t.inputs.map((i) => [
          i.id,
          i.type === 'number'
            ? Math.min(i.max ?? Infinity, Math.max(i.min ?? -Infinity, 42))
            : (i.options[i.options.length - 1]?.value ?? i.default),
        ]),
      );
      const zurueck = decodeValues(t, encodeValues(t, werte));
      for (const i of t.inputs) {
        if (istVoreinstellung(i, werte[i.id])) continue;
        expect(zurueck[i.id], `${t.slug}/${i.id}`).toBe(werte[i.id]);
      }
    }
  });
});
