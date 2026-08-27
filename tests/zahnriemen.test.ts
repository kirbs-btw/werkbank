import { describe, it, expect } from 'vitest';
import { tool } from '../src/tools/cnc/zahnriemen-laenge';

type Werte = Record<string, number | string>;
const rechne = (v: Werte) => {
  const ergebnis = tool.compute({ z1: 20, z2: 20, p: '2', a: 200, ...v });
  const holen = (label: string) => {
    const r = ergebnis.find((e) => e.label === label);
    if (!r) throw new Error(`kein Ergebnis „${label}"`);
    return typeof r.value === 'number' ? r.value : NaN;
  };
  return {
    laenge: holen('Rechnerische Riemenlänge'),
    zaehne: holen('Riemen mit'),
    achsabstand: holen('Achsabstand für diesen Riemen'),
    d1: holen('Teilkreis Scheibe 1'),
    d2: holen('Teilkreis Scheibe 2'),
    umschlingung: holen('Umschlingung kleine Scheibe'),
    minAbstand: holen('Kleinster möglicher Achsabstand'),
  };
};

describe('Teilkreis', () => {
  it('folgt d = z · p / π', () => {
    expect(rechne({ z1: 20, p: '2' }).d1).toBeCloseTo((20 * 2) / Math.PI, 6);
    expect(rechne({ z2: 60, p: '5' }).d2).toBeCloseTo((60 * 5) / Math.PI, 6);
  });

  it('wächst linear mit der Zähnezahl', () => {
    expect(rechne({ z1: 40 }).d1).toBeCloseTo(2 * rechne({ z1: 20 }).d1, 6);
  });
});

describe('Riemenlänge', () => {
  it('ist bei gleich großen Scheiben genau 2a + z·p', () => {
    // Der Umfang beider Halbkreise ergibt zusammen einen vollen Kreis, und
    // π·d = π · z·p/π = z·p – die krummen Teilkreise heben sich weg.
    for (const [z, p, a] of [[20, 2, 200], [36, 3, 150], [15, 5, 80]] as [number, number, number][]) {
      expect(rechne({ z1: z, z2: z, p: String(p), a }).laenge, `z=${z} p=${p}`).toBeCloseTo(2 * a + z * p, 6);
    }
  });

  it('wächst streng mit dem Achsabstand', () => {
    let vorher = 0;
    for (const a of [60, 80, 120, 200, 400]) {
      const l = rechne({ z1: 20, z2: 60, a }).laenge;
      expect(l).toBeGreaterThan(vorher);
      vorher = l;
    }
  });

  it('ist unabhängig davon, welche Scheibe zuerst steht', () => {
    expect(rechne({ z1: 20, z2: 60, a: 150 }).laenge).toBeCloseTo(rechne({ z1: 60, z2: 20, a: 150 }).laenge, 9);
  });
});

describe('Achsabstand für den ganzzahligen Riemen', () => {
  it('führt zur gewählten Riemenlänge zurück', () => {
    // Die Umkehrung ist eine Intervallhalbierung – sie muss exakt dorthin
    // zurückfinden, wo die Vorwärtsrechnung herkam.
    for (const [z1, z2, p, a] of [[20, 20, 2, 200], [20, 60, 2, 100], [16, 48, 5, 250], [30, 30, 8, 500]] as [number, number, number, number][]) {
      const r = rechne({ z1, z2, p: String(p), a });
      const laengeDesRiemens = r.zaehne * p;
      // Der zurückgerechnete Abstand muss genau diesen Riemen ergeben
      const kontrolle = rechne({ z1, z2, p: String(p), a: r.achsabstand });
      expect(kontrolle.laenge, `z1=${z1} z2=${z2} p=${p}`).toBeCloseTo(laengeDesRiemens, 4);
    }
  });

  it('weicht höchstens einen halben Zahn vom Wunschmaß ab', () => {
    // Ein Zahn Umfang verteilt sich auf zwei Riementrume, also rund p/2 im
    // Achsabstand. Gerundet wird zur nächsten Zähnezahl, also höchstens p/4 …
    // mit etwas Luft für die Umschlingungsanteile.
    for (const a of [80, 123.4, 200, 317.7]) {
      const r = rechne({ z1: 20, z2: 40, a });
      expect(Math.abs(r.achsabstand - a), `a=${a}`).toBeLessThan(2);
    }
  });
});

describe('Umschlingung', () => {
  it('ist bei gleich großen Scheiben genau 180°', () => {
    expect(rechne({ z1: 20, z2: 20, a: 120 }).umschlingung).toBeCloseTo(180, 9);
  });

  it('wird kleiner, je unterschiedlicher die Scheiben sind', () => {
    const gleich = rechne({ z1: 20, z2: 20, a: 100 }).umschlingung;
    const wenig = rechne({ z1: 20, z2: 40, a: 100 }).umschlingung;
    const stark = rechne({ z1: 20, z2: 80, a: 100 }).umschlingung;
    expect(wenig).toBeLessThan(gleich);
    expect(stark).toBeLessThan(wenig);
  });

  it('wird bei größerem Achsabstand wieder größer', () => {
    expect(rechne({ z1: 20, z2: 80, a: 400 }).umschlingung).toBeGreaterThan(
      rechne({ z1: 20, z2: 80, a: 100 }).umschlingung,
    );
  });
});

describe('Grenzfälle', () => {
  it('nennt den Abstand, bei dem sich die Scheiben berühren', () => {
    const r = rechne({ z1: 20, z2: 40, p: '5' });
    expect(r.minAbstand).toBeCloseTo((r.d1 + r.d2) / 2, 6);
  });

  it('meldet einen zu kleinen Achsabstand, statt Unsinn zu rechnen', () => {
    // Bei überlappenden Scheiben gibt es keinen Riementrieb – dann stehen
    // Achsabstand und Umschlingung auf null statt auf einer erfundenen Zahl.
    const r = rechne({ z1: 20, z2: 60, p: '5', a: 5 });
    expect(r.achsabstand).toBe(0);
    expect(r.umschlingung).toBe(0);
    // Auch die Kopfzeile: Eine Zähnezahl für eine unmögliche Anordnung sieht
    // brauchbar aus und ist es nicht.
    expect(r.zaehne).toBe(0);
    expect(r.laenge).toBe(0);
    expect(r.minAbstand).toBeGreaterThan(5);
  });

  it('liefert bei unsinnigen Eingaben endliche Werte', () => {
    for (const v of [{ z1: 0 }, { a: 0 }, { z1: -5, z2: -5 }, { a: -100 }]) {
      for (const r of tool.compute({ z1: 20, z2: 20, p: '2', a: 200, ...v })) {
        if (typeof r.value === 'number') expect(Number.isFinite(r.value), JSON.stringify(v)).toBe(true);
      }
    }
  });
});
