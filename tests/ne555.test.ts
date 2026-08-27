import { describe, it, expect } from 'vitest';
import { tool } from '../src/tools/elektronik/ne555-rechner';
import { e12 } from '../src/lib/elektro';

type Werte = Record<string, number | string>;
const rechne = (v: Werte) => {
  const ergebnis = tool.compute({ art: 'astabil', r1: 4.7, r2: 68, c: 10, ceinheit: 'u', ...v });
  const holen = (label: string): number => {
    const r = ergebnis.find((e) => e.label === label);
    return r && typeof r.value === 'number' ? r.value : NaN;
  };
  return {
    labels: ergebnis.map((e) => e.label),
    hilfe: ergebnis.map((e) => e.help ?? '').join(' '),
    f: holen('Frequenz'),
    T: holen('Periodendauer'),
    high: holen('Ausgang high'),
    low: holen('Ausgang low'),
    tast: holen('Tastverhältnis'),
    fE12: holen('Mit E12-Bauteilen'),
    impuls: holen('Impulsdauer'),
    impulsS: holen('Impulsdauer in Sekunden'),
  };
};

describe('E12-Reihe', () => {
  it('trifft die Reihenwerte selbst', () => {
    for (const v of [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82]) {
      expect(e12(v), `${v}`).toBeCloseTo(v, 9);
    }
  });

  it('rechnet über Dekaden hinweg', () => {
    expect(e12(0.47)).toBeCloseTo(0.47, 9);
    expect(e12(4700)).toBeCloseTo(4700, 6);
    expect(e12(69.8)).toBe(68);
    expect(e12(9.5)).toBe(10);
  });

  it('rundet logarithmisch, nicht arithmetisch', () => {
    // Zwischen 68 und 82 liegt die Grenze bei √(68·82) = 74,67 – nicht bei 75.
    expect(e12(74.5)).toBe(68);
    expect(e12(75)).toBe(82);
  });

  it('bleibt bei unsinnigen Eingaben endlich', () => {
    for (const v of [0, -1, NaN]) expect(Number.isFinite(e12(v))).toBe(true);
  });
});

describe('Astabil', () => {
  it('folgt f = 1 / (ln2 · (R1 + 2·R2) · C)', () => {
    for (const [r1, r2, c] of [[1, 1, 1], [4.7, 68, 10], [10, 100, 0.1]] as [number, number, number][]) {
      const soll = 1 / (Math.LN2 * (r1 * 1000 + 2 * r2 * 1000) * c * 1e-6);
      expect(rechne({ r1, r2, c }).f, `R1=${r1} R2=${r2}`).toBeCloseTo(soll, 9);
    }
  });

  it('setzt sich aus High- und Low-Zeit zusammen', () => {
    const r = rechne({ r1: 3.3, r2: 47, c: 4.7 });
    expect(r.high + r.low).toBeCloseTo(r.T, 9);
    expect(r.f).toBeCloseTo(1000 / r.T, 9);
  });

  it('liegt ohne Diode immer über 50 % Tastverhältnis', () => {
    // Der Ladeweg führt über R1 + R2, der Entladeweg nur über R2 – die
    // High-Zeit kann gar nicht kürzer werden. Auch mit winzigem R1 nicht.
    for (const r1 of [0.1, 1, 10, 100, 1000]) {
      const t = rechne({ r1, r2: 10 }).tast;
      expect(t, `R1=${r1}`).toBeGreaterThan(50);
    }
    // …nähert sich aber beliebig an, je kleiner R1 wird.
    expect(rechne({ r1: 0.1, r2: 10000 }).tast).toBeLessThan(50.01);
  });

  it('sagt das auch dazu', () => {
    expect(rechne({}).hilfe).toContain('immer über 50');
  });

  it('ist unabhängig von der Einheit, wenn der Wert mitskaliert', () => {
    expect(rechne({ c: 1, ceinheit: 'u' }).f).toBeCloseTo(rechne({ c: 1000, ceinheit: 'n' }).f, 9);
  });

  it('halbiert die Frequenz bei doppeltem Kondensator', () => {
    expect(rechne({ c: 20 }).f).toBeCloseTo(rechne({ c: 10 }).f / 2, 9);
  });
});

describe('Astabil mit Diode', () => {
  it('erreicht bei R1 = R2 genau 50 %', () => {
    expect(rechne({ art: 'diode', r1: 10, r2: 10 }).tast).toBeCloseTo(50, 9);
  });

  it('kommt unter 50 %, was der Standardaufbau nicht kann', () => {
    const r = rechne({ art: 'diode', r1: 10, r2: 90 });
    expect(r.tast).toBeCloseTo(10, 9); // R1 / (R1 + R2)
  });

  it('lädt nur noch über R1', () => {
    const r = rechne({ art: 'diode', r1: 10, r2: 47, c: 1 });
    expect(r.high).toBeCloseTo(Math.LN2 * 10_000 * 1e-6 * 1000, 9);
    expect(r.low).toBeCloseTo(Math.LN2 * 47_000 * 1e-6 * 1000, 9);
  });

  it('schwingt schneller als ohne Diode', () => {
    // Der Ladeweg ist kürzer, also ist die Periode kürzer.
    expect(rechne({ art: 'diode' }).f).toBeGreaterThan(rechne({ art: 'astabil' }).f);
  });
});

describe('Monostabil', () => {
  it('folgt t = ln3 · R1 · C', () => {
    expect(rechne({ art: 'mono', r1: 10, c: 100 }).impulsS).toBeCloseTo(Math.log(3) * 10_000 * 100e-6, 9);
  });

  it('ignoriert R2', () => {
    // R2 sitzt im Monoflop nicht im Zeitglied – die Zeit darf sich nicht rühren.
    const a = rechne({ art: 'mono', r1: 10, r2: 1 }).impuls;
    const b = rechne({ art: 'mono', r1: 10, r2: 1000 }).impuls;
    expect(a).toBeCloseTo(b, 9);
  });

  it('nennt keine Frequenz und kein Tastverhältnis', () => {
    // Ein Monoflop schwingt nicht. Eine Frequenz hinzuschreiben wäre eine
    // Zahl, die brauchbar aussieht und keine Bedeutung hat.
    const r = rechne({ art: 'mono' });
    expect(r.labels).not.toContain('Frequenz');
    expect(r.labels).not.toContain('Tastverhältnis');
    expect(r.labels).toContain('Impulsdauer');
  });

  it('rechnet ms und s ineinander um', () => {
    const r = rechne({ art: 'mono', r1: 47, c: 22 });
    expect(r.impuls).toBeCloseTo(r.impulsS * 1000, 6);
  });
});

describe('Bauteilhinweise', () => {
  it('warnt bei zu kleinem R1', () => {
    // Nicht auf „Pin 7" prüfen: Das steht auch in der harmlosen Zeile
    // „entlädt über R2 nach Pin 7". Die Warnung selbst sagt „überlastet".
    expect(rechne({ r1: 0.5 }).hilfe).toContain('überlastet');
    expect(rechne({ r1: 4.7 }).hilfe).not.toContain('überlastet');
  });

  it('warnt bei zu hochohmigem Zeitglied', () => {
    expect(rechne({ r1: 100, r2: 15_000 }).hilfe).toContain('Leckströme');
  });

  it('nennt die kaufbare Variante', () => {
    // 69,8 kΩ gibt es nicht zu kaufen, 68 kΩ schon.
    const r = tool.compute({ art: 'astabil', r1: 4.7, r2: 69.8, c: 10, ceinheit: 'u' });
    const e = r.find((x) => x.label === 'Mit E12-Bauteilen');
    expect(e?.help).toContain('68 kΩ');
    expect(rechne({ r1: 4.7, r2: 69.8 }).fE12).toBeCloseTo(rechne({ r1: 4.7, r2: 68 }).f, 9);
  });

  it('schreibt große Werte in Megaohm', () => {
    const r = tool.compute({ art: 'astabil', r1: 2200, r2: 68, c: 10, ceinheit: 'u' });
    expect(r.find((x) => x.label === 'Mit E12-Bauteilen')?.help).toContain('MΩ');
  });
});

describe('Robustheit', () => {
  it('liefert bei unsinnigen Eingaben endliche Werte', () => {
    const faelle: Werte[] = [
      { r1: 0 }, { r2: 0 }, { c: 0 }, { r1: -5 }, { c: -1 },
      { art: 'mono', r1: 0 }, { art: 'diode', r2: 0 }, { art: 'quatsch' },
    ];
    for (const v of faelle) {
      for (const r of tool.compute({ art: 'astabil', r1: 4.7, r2: 68, c: 10, ceinheit: 'u', ...v })) {
        if (typeof r.value === 'number') {
          expect(Number.isFinite(r.value), `${JSON.stringify(v)} → ${r.label}`).toBe(true);
        }
      }
    }
  });

  it('behandelt eine unbekannte Betriebsart wie den Standardfall', () => {
    expect(rechne({ art: 'quatsch' }).f).toBeCloseTo(rechne({ art: 'astabil' }).f, 9);
  });
});
