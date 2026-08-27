import { describe, it, expect } from 'vitest';
import { tool } from '../src/tools/elektronik/operationsverstaerker';

type Werte = Record<string, number | string>;
const rechne = (v: Werte) => {
  const e = tool.compute({ art: 'nicht', r1: 10, rf: 100, uin: 0.1, ub: 12, gbp: 1, ...v });
  const holen = (label: string) => e.find((x) => x.label === label);
  const zahl = (label: string): number => {
    const r = holen(label);
    return r && typeof r.value === 'number' ? r.value : NaN;
  };
  return {
    roh: e,
    labels: e.map((x) => x.label),
    hilfe: e.map((x) => x.help ?? '').join(' '),
    vu: zahl('Verstärkung'),
    db: zahl('Verstärkung in dB'),
    uout: zahl('Ausgangsspannung'),
    uoutEinheit: holen('Ausgangsspannung')?.unit,
    rin: holen('Eingangswiderstand')?.value,
    fg: zahl('Obere Grenzfrequenz'),
    fgEinheit: holen('Obere Grenzfrequenz')?.unit,
    vuE12: zahl('Mit E12-Widerständen'),
  };
};

describe('Verstärkung', () => {
  it('folgt beim nichtinvertierenden Verstärker 1 + Rf/R1', () => {
    for (const [r1, rf] of [[10, 100], [1, 1], [4.7, 47], [100, 10]] as [number, number][]) {
      expect(rechne({ art: 'nicht', r1, rf }).vu, `${r1}/${rf}`).toBeCloseTo(1 + rf / r1, 9);
    }
  });

  it('folgt beim invertierenden Verstärker −Rf/R1', () => {
    for (const [r1, rf] of [[10, 100], [1, 1], [4.7, 47]] as [number, number][]) {
      expect(rechne({ art: 'invert', r1, rf }).vu, `${r1}/${rf}`).toBeCloseTo(-rf / r1, 9);
    }
  });

  it('kommt beim nichtinvertierenden Verstärker nie unter 1', () => {
    // 1 + Rf/R1 ist bei positiven Widerständen zwingend größer als 1 –
    // abschwächen kann diese Grundschaltung nicht.
    for (const rf of [0.001, 0.1, 1, 1000]) {
      expect(rechne({ art: 'nicht', r1: 1000, rf }).vu, `Rf=${rf}`).toBeGreaterThan(1);
    }
  });

  it('hängt nur am Verhältnis, nicht an der Größe der Widerstände', () => {
    const a = rechne({ art: 'invert', r1: 1, rf: 10 }).vu;
    const b = rechne({ art: 'invert', r1: 100, rf: 1000 }).vu;
    expect(a).toBeCloseTo(b, 9);
  });

  it('ist beim Spannungsfolger genau 1', () => {
    expect(rechne({ art: 'folger', r1: 3.3, rf: 470 }).vu).toBe(1);
  });

  it('rechnet dB aus dem Betrag', () => {
    expect(rechne({ art: 'invert', r1: 10, rf: 100 }).db).toBeCloseTo(20, 9);
    expect(rechne({ art: 'nicht', r1: 10, rf: 10 }).db).toBeCloseTo(6.0206, 4);
    expect(rechne({ art: 'invert', r1: 10, rf: 10 }).db).toBeCloseTo(0, 9);
  });
});

describe('Bandbreite', () => {
  it('rechnet mit der Rauschverstärkung, nicht mit der Signalverstärkung', () => {
    // Der Kern der Sache: Ein Inverter mit Vu = −1 hat Rauschverstärkung 2 und
    // damit die halbe Bandbreite. Wer mit |Vu| = 1 rechnet, kommt auf 1 MHz
    // und liegt um den Faktor 2 daneben.
    const inv = rechne({ art: 'invert', r1: 10, rf: 10, gbp: 1 });
    expect(inv.vu).toBeCloseTo(-1, 9);
    expect(inv.fg).toBeCloseTo(500, 9);
    expect(inv.fgEinheit).toBe('kHz');
  });

  it('gibt dem Spannungsfolger die volle Bandbreite', () => {
    const r = rechne({ art: 'folger', gbp: 3 });
    expect(r.fg).toBeCloseTo(3, 9);
    expect(r.fgEinheit).toBe('MHz');
  });

  it('stimmt bei gleicher Rauschverstärkung für beide Grundschaltungen überein', () => {
    // Nichtinvertierend mit Vu = 11 und invertierend mit Vu = −10 haben beide
    // die Rauschverstärkung 11 – also dieselbe Grenzfrequenz.
    const a = rechne({ art: 'nicht', r1: 10, rf: 100 });
    const b = rechne({ art: 'invert', r1: 10, rf: 100 });
    expect(a.vu).toBeCloseTo(11, 9);
    expect(b.vu).toBeCloseTo(-10, 9);
    expect(a.fg).toBeCloseTo(b.fg, 9);
  });

  it('halbiert sich bei doppelter Verstärkung', () => {
    const a = rechne({ art: 'nicht', r1: 10, rf: 10 }); // Vu = 2
    const b = rechne({ art: 'nicht', r1: 10, rf: 30 }); // Vu = 4
    expect(a.fg).toBeCloseTo(b.fg * 2, 6);
  });

  it('wächst linear mit dem GBP', () => {
    expect(rechne({ gbp: 4 }).fg).toBeCloseTo(rechne({ gbp: 1 }).fg * 4, 6);
  });

  it('erklärt den Unterschied beim Inverter im Hilfstext', () => {
    expect(rechne({ art: 'invert' }).hilfe).toContain('Rauschverstärkung');
    expect(rechne({ art: 'nicht' }).hilfe).not.toContain('Rauschverstärkung');
  });
});

describe('Aussteuergrenze', () => {
  it('begrenzt den Ausgang auf die Betriebsspannung', () => {
    const r = rechne({ art: 'nicht', r1: 1, rf: 99, uin: 0.5, ub: 12 });
    expect(r.vu).toBeCloseTo(100, 9);
    expect(r.uout).toBeCloseTo(12, 9); // statt der rechnerischen 50 V
    expect(r.hilfe).toContain('abgeschnitten');
  });

  it('begrenzt auch nach unten', () => {
    const r = rechne({ art: 'invert', r1: 1, rf: 100, uin: 1, ub: 9 });
    expect(r.uout).toBeCloseTo(-9, 9);
  });

  it('schweigt, solange der Ausgang hineinpasst', () => {
    expect(rechne({ uin: 0.1 }).hilfe).not.toContain('abgeschnitten');
  });

  it('lässt das Vorzeichen des Inverters stehen', () => {
    const r = rechne({ art: 'invert', r1: 10, rf: 100, uin: 0.1 });
    expect(r.uout).toBeLessThan(0);
    expect(r.uout).toBeCloseTo(-1, 9);
  });

  it('schaltet die Einheit mit', () => {
    const r = rechne({ art: 'nicht', r1: 10, rf: 10, uin: 0.01 });
    expect(r.uout).toBeCloseTo(20, 9);
    expect(r.uoutEinheit).toBe('mV');
  });
});

describe('Eingangswiderstand', () => {
  it('ist beim Inverter genau R1', () => {
    const r = rechne({ art: 'invert', r1: 4.7 });
    expect(r.rin).toBeCloseTo(4.7, 9);
    expect(r.roh.find((x) => x.label === 'Eingangswiderstand')?.unit).toBe('kΩ');
  });

  it('ist bei den anderen Schaltungen keine Zahl, sondern eine Aussage', () => {
    // Eine Zahl hinzuschreiben wäre erfunden – der Wert hängt am Bauteil,
    // nicht an der Beschaltung, und reicht über Größenordnungen.
    for (const art of ['nicht', 'folger']) {
      expect(rechne({ art }).rin, art).toBe('sehr hoch');
    }
  });

  it('erklärt den Impedanzwandler nur beim Spannungsfolger', () => {
    // Vorher stand dieser Satz auch beim nichtinvertierenden Verstärker – also
    // eine Erklärung zu einer Schaltung, die der Leser nicht gewählt hat.
    // Gefunden in der Browser-Probe.
    expect(rechne({ art: 'folger' }).hilfe).toContain('Impedanzwandler');
    expect(rechne({ art: 'nicht' }).hilfe).not.toContain('Impedanzwandler');
    expect(rechne({ art: 'nicht' }).hilfe).not.toContain('Spannungsfolger');
  });
});

describe('E12-Widerstände', () => {
  it('erscheinen nur, wo es Widerstände gibt', () => {
    expect(rechne({ art: 'nicht' }).labels).toContain('Mit E12-Widerständen');
    expect(rechne({ art: 'invert' }).labels).toContain('Mit E12-Widerständen');
    expect(rechne({ art: 'folger' }).labels).not.toContain('Mit E12-Widerständen');
  });

  it('rechnen die Verstärkung aus kaufbaren Werten', () => {
    // 3,7 kΩ gibt es nicht, 3,9 kΩ schon.
    const r = rechne({ art: 'nicht', r1: 3.7, rf: 47 });
    expect(r.vuE12).toBeCloseTo(1 + 47 / 3.9, 9);
    expect(r.hilfe).toContain('3,9 kΩ');
  });

  it('bleiben bei bereits kaufbaren Werten unverändert', () => {
    const r = rechne({ art: 'nicht', r1: 10, rf: 100 });
    expect(r.vuE12).toBeCloseTo(r.vu, 9);
  });
});

describe('Robustheit', () => {
  it('liefert bei unsinnigen Eingaben endliche Werte', () => {
    const faelle: Werte[] = [
      { r1: 0 }, { rf: 0 }, { uin: -1 }, { ub: 0 }, { gbp: 0 },
      { r1: -10, rf: -10 }, { art: 'quatsch' }, { art: 'invert', r1: 0 },
    ];
    for (const v of faelle) {
      for (const r of tool.compute({ art: 'nicht', r1: 10, rf: 100, uin: 0.1, ub: 12, gbp: 1, ...v })) {
        if (typeof r.value === 'number') {
          expect(Number.isFinite(r.value), `${JSON.stringify(v)} → ${r.label}`).toBe(true);
        }
      }
    }
  });

  it('behandelt eine unbekannte Grundschaltung wie den Standardfall', () => {
    expect(rechne({ art: 'quatsch' }).vu).toBeCloseTo(rechne({ art: 'nicht' }).vu, 9);
  });
});
