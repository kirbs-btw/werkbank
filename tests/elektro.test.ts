import { describe, it, expect } from 'vitest';
import {
  E12, E24, eReihe, e12, e24, skaliere, stellen, belastbarkeit, ohmText, kaufbar, LEISTUNGSKLASSEN,
} from '../src/lib/elektro';
import { tool } from '../src/tools/elektronik/ohmsches-gesetz';

describe('E-Reihen', () => {
  it('treffen ihre eigenen Werte', () => {
    for (const v of E12) expect(e12(v), `E12 ${v}`).toBeCloseTo(v, 9);
    for (const v of E24) expect(e24(v), `E24 ${v}`).toBeCloseTo(v, 9);
  });

  it('rechnen über Dekaden hinweg', () => {
    expect(e12(0.47)).toBeCloseTo(0.47, 9);
    expect(e12(4700)).toBeCloseTo(4700, 6);
    expect(e12(69.8)).toBe(68);
  });

  it('runden logarithmisch, nicht arithmetisch', () => {
    // Grenze zwischen 68 und 82 liegt bei √(68·82) = 74,67 – nicht bei 75.
    expect(e12(74.5)).toBe(68);
    expect(e12(75)).toBe(82);
  });

  it('liegen bei E24 nie weiter daneben als bei E12', () => {
    // Die feinere Reihe enthält die gröbere nicht vollständig (E12 hat 39,
    // E24 auch), aber treffen muss sie mindestens so gut.
    for (let x = 10; x < 100; x += 0.37) {
      const d12 = Math.abs(Math.log(e12(x) / x));
      const d24 = Math.abs(Math.log(e24(x) / x));
      expect(d24, `x=${x}`).toBeLessThanOrEqual(d12 + 1e-12);
    }
  });

  it('weichen bei E12 nie mehr als 11,8 % ab', () => {
    // Nicht 10 %, obwohl E12 die Reihe der 10-%-Widerstände ist: Die Reihe ist
    // gerundet und dadurch nicht sauber geometrisch. Der ideale Faktor wäre
    // ¹²√10 = 1,2115, der Schritt 12 → 15 macht aber 1,25 – der größte der
    // Reihe, alle anderen liegen bei rund 1,2. Der schlechteste Fall ist der
    // halbe Schritt, also √1,25 = 1,118. Bei x = 13,6 wird das erreicht.
    let schlimmster = 0;
    for (let x = 1; x < 1000; x += 0.7) {
      schlimmster = Math.max(schlimmster, Math.abs(e12(x) / x - 1));
      expect(Math.abs(e12(x) / x - 1), `x=${x}`).toBeLessThan(0.119);
    }
    expect(schlimmster).toBeGreaterThan(0.1); // sonst prüft die Schranke nichts
  });

  it('bleiben bei unsinnigen Eingaben endlich', () => {
    for (const v of [0, -1, NaN, -Infinity]) {
      expect(Number.isFinite(eReihe(v)), `${v}`).toBe(true);
    }
  });
});

describe('Vorsatzeinheiten', () => {
  it('wählen die lesbare Größenordnung', () => {
    expect(skaliere(0.0213, 'A')).toEqual({ value: 21.3, unit: 'mA' });
    expect(skaliere(4700, 'Ω')).toEqual({ value: 4.7, unit: 'kΩ' });
    expect(skaliere(2_200_000, 'Ω')).toEqual({ value: 2.2, unit: 'MΩ' });
    expect(skaliere(5, 'V')).toEqual({ value: 5, unit: 'V' });
    expect(skaliere(0.0000047, 'F')).toEqual({ value: 4.7, unit: 'µF' });
  });

  it('lassen die null in Ruhe', () => {
    expect(skaliere(0, 'A')).toEqual({ value: 0, unit: 'A' });
  });

  it('behalten den Zahlenwert bei', () => {
    // Skaliert wird die Darstellung, nicht die Physik.
    for (const x of [0.000012, 0.5, 7, 1234, 9_999_999]) {
      const s = skaliere(x, 'V');
      const faktor = { 'µV': 1e-6, 'mV': 1e-3, 'V': 1, 'kV': 1e3, 'MV': 1e6 }[s.unit]!;
      expect(s.value * faktor, `${x}`).toBeCloseTo(x, 12);
    }
  });

  it('kommen mit negativen Werten zurecht', () => {
    expect(skaliere(-0.05, 'A')).toEqual({ value: -50, unit: 'mA' });
  });

  it('fangen Unendlich ab', () => {
    expect(Number.isFinite(skaliere(Infinity, 'V').value)).toBe(true);
  });

  it('schreiben Widerstände lesbar', () => {
    expect(ohmText(4700)).toBe('4,7 kΩ');
    expect(ohmText(220)).toBe('220 Ω');
    expect(ohmText(1_000_000)).toBe('1 MΩ');
  });
});

describe('Kaufbare Werte', () => {
  it('nennt zwei Werte nur, wenn sie sich unterscheiden', () => {
    expect(kaufbar(250, 270)).toBe('270 Ω statt 250 Ω');
    expect(kaufbar(150, 150)).toBe('150 Ω steht genau so in der E12-Reihe');
  });

  it('behauptet nie „X statt X"', () => {
    // Genau dieser Widerspruch ist unabhängig voneinander in zwei Rechnern
    // entstanden – im Ohmschen Gesetz und im Filter-Rechner. Deshalb steht die
    // Unterscheidung jetzt an einer Stelle und wird hier festgehalten.
    //
    // Der feine Schritt ist Absicht: Bei 1000,9 Ω unterscheiden sich Rechen-
    // und Reihenwert zwar rechnerisch, werden aber beide als „1 kΩ" angezeigt.
    // Ein Zahlenvergleich hätte das durchgelassen – deshalb entscheidet der
    // angezeigte Text.
    let mitStatt = 0;
    for (let x = 1; x < 3000; x += 0.7) {
      const teile = kaufbar(x, e12(x)).match(/^(.+?) statt (.+)$/);
      if (teile) {
        mitStatt++;
        expect(teile[1], `x=${x}`).not.toBe(teile[2]);
      }
    }
    expect(mitStatt).toBeGreaterThan(1000); // sonst prüft die Schleife nichts
  });

  it('kommt mit null und negativen Werten zurecht', () => {
    for (const x of [0, -5]) expect(typeof kaufbar(x, e12(x))).toBe('string');
  });
});

describe('Nachkommastellen', () => {
  it('richten sich nach der Größenordnung', () => {
    expect(stellen(0.002)).toBe(4);
    expect(stellen(5)).toBe(2);
    expect(stellen(150)).toBe(1);
    expect(stellen(4700)).toBe(0);
    expect(stellen(-4700)).toBe(0);
  });
});

describe('Belastbarkeit', () => {
  it('nimmt die nächstgrößere handelsübliche Klasse', () => {
    expect(belastbarkeit(0.1136)).toBe(0.25); // ×2 = 0,227
    expect(belastbarkeit(0.05)).toBe(0.125);
    expect(belastbarkeit(24)).toBe(50);
  });

  it('rechnet die Reserve wirklich ein', () => {
    // 0,2 W ohne Reserve wäre 0,25 W – mit Faktor 2 sind es 0,4 W und damit 0,5.
    expect(belastbarkeit(0.2, 1)).toBe(0.25);
    expect(belastbarkeit(0.2, 2)).toBe(0.5);
  });

  it('liefert immer eine Klasse aus der Liste', () => {
    for (const p of [0, 1e-9, 0.3, 7, 1000]) {
      expect(LEISTUNGSKLASSEN, `${p}`).toContain(belastbarkeit(p));
    }
  });

  it('deckt die Verlustleistung ab, solange die Liste reicht', () => {
    for (const p of [0.01, 0.1, 0.4, 2, 11]) {
      expect(belastbarkeit(p), `${p}`).toBeGreaterThanOrEqual(p);
    }
  });
});

type Werte = Record<string, number | string>;
const rechne = (v: Werte) => {
  const e = tool.compute({ gegeben: 'ur', u: 5, i: 0.02, r: 220, p: 0.1, ...v });
  const holen = (label: string) => e.find((x) => x.label === label);
  const zahl = (label: string): number => {
    const r = holen(label);
    return r && typeof r.value === 'number' ? r.value : NaN;
  };
  return {
    roh: e,
    labels: e.map((x) => x.label),
    primaer: e.find((x) => x.primary)?.label,
    hilfe: e.map((x) => x.help ?? '').join(' '),
    u: zahl('Spannung U'), i: zahl('Strom I'), r: zahl('Widerstand R'), p: zahl('Leistung P'),
    uE: holen('Spannung U')?.unit, iE: holen('Strom I')?.unit,
    rE: holen('Widerstand R')?.unit, pE: holen('Leistung P')?.unit,
    klasse: zahl('Widerstand mindestens'),
    e12wert: zahl('Nächster E12-Wert'),
  };
};

describe('Ohmsches Gesetz', () => {
  it('kommt aus jeder Kombination beim selben Arbeitspunkt heraus', () => {
    // 12 V, 2 A, 6 Ω, 24 W – dieselbe Schaltung, sechsmal anders befragt.
    const soll = { u: 12, i: 2, r: 6, p: 24 };
    for (const modus of ['ui', 'ur', 'up', 'ir', 'ip', 'rp']) {
      const r = rechne({ gegeben: modus, ...soll });
      expect(r.u, `${modus} → U`).toBeCloseTo(12, 9);
      expect(r.i, `${modus} → I`).toBeCloseTo(2, 9);
      expect(r.r, `${modus} → R`).toBeCloseTo(6, 9);
      expect(r.p, `${modus} → P`).toBeCloseTo(24, 9);
    }
  });

  it('hebt die erste berechnete Größe hervor, nicht die eingegebene', () => {
    expect(rechne({ gegeben: 'ur' }).primaer).toBe('Strom I');
    expect(rechne({ gegeben: 'ui' }).primaer).toBe('Widerstand R');
    expect(rechne({ gegeben: 'rp' }).primaer).toBe('Spannung U');
    expect(rechne({ gegeben: 'ip' }).primaer).toBe('Spannung U');
  });

  it('kennzeichnet die eingegebenen Größen', () => {
    const r = rechne({ gegeben: 'ur' });
    expect(r.roh.find((x) => x.label === 'Spannung U')?.help).toBe('eingegeben');
    expect(r.roh.find((x) => x.label === 'Widerstand R')?.help).toBe('eingegeben');
    expect(r.roh.find((x) => x.label === 'Strom I')?.help).toBeUndefined();
  });

  it('schaltet die Einheit auf die lesbare Größenordnung', () => {
    const r = rechne({ gegeben: 'ur', u: 5, r: 220 });
    expect(r.i).toBeCloseTo(22.7272, 3);
    expect(r.iE).toBe('mA');
    expect(r.p).toBeCloseTo(113.636, 2);
    expect(r.pE).toBe('mW');
  });

  it('nennt den E12-Wert nur, wenn der Widerstand berechnet wurde', () => {
    // Wer R selbst eingetippt hat, weiß, welchen er in der Hand hält.
    expect(rechne({ gegeben: 'ui' }).labels).toContain('Nächster E12-Wert');
    expect(rechne({ gegeben: 'ur' }).labels).not.toContain('Nächster E12-Wert');
    expect(rechne({ gegeben: 'ir' }).labels).not.toContain('Nächster E12-Wert');
    expect(rechne({ gegeben: 'rp' }).labels).not.toContain('Nächster E12-Wert');
  });

  it('rundet den E12-Wert richtig', () => {
    // 3 V bei 20 mA sind 150 Ω – das gibt es zu kaufen.
    const r = rechne({ gegeben: 'ui', u: 3, i: 0.02 });
    expect(r.r).toBeCloseTo(150, 9);
    expect(r.e12wert).toBeCloseTo(150, 9);
    // 5 V bei 20 mA sind 250 Ω – die nächste kaufbare Stufe ist 270 Ω.
    const s = rechne({ gegeben: 'ui', u: 5, i: 0.02 });
    expect(s.r).toBeCloseTo(250, 9);
    expect(s.e12wert).toBeCloseTo(270, 9);
  });

  it('behauptet nicht, ein Reihenwert sei nicht kaufbar', () => {
    // Trifft der Rechenwert die Reihe genau, stand dort vorher der Widerspruch
    // „150 Ω ist kaufbar, 150 Ω nicht". Gefunden in der Browser-Probe.
    const genau = rechne({ gegeben: 'ui', u: 3, i: 0.02 }).roh
      .find((x) => x.label === 'Nächster E12-Wert')?.help ?? '';
    expect(genau).toContain('150 Ω steht genau so in der E12-Reihe');
    expect(genau).not.toContain('statt');

    const krumm = rechne({ gegeben: 'ui', u: 5, i: 0.02 }).roh
      .find((x) => x.label === 'Nächster E12-Wert')?.help ?? '';
    expect(krumm).toContain('270 Ω statt 250 Ω');
  });

  it('nennt die Belastbarkeit mit Reserve', () => {
    expect(rechne({ gegeben: 'ur', u: 5, r: 220 }).klasse).toBe(0.25);
    expect(rechne({ gegeben: 'ui', u: 12, i: 2 }).klasse).toBe(50);
  });

  it('folgt den Grundgesetzen über einen weiten Bereich', () => {
    for (const [u, r] of [[1.5, 10], [5, 220], [12, 4700], [230, 1_000_000]] as [number, number][]) {
      const x = rechne({ gegeben: 'ur', u, r });
      const iA = skaliere(u / r, 'A');
      expect(x.i, `U=${u} R=${r}`).toBeCloseTo(iA.value, 9);
      expect(x.iE).toBe(iA.unit);
    }
  });
});

describe('Ohmsches Gesetz – Grenzfälle', () => {
  it('rechnet nicht mit null, sondern sagt es', () => {
    // In jeder der sechs Kombinationen steht eine Vorgabe im Nenner oder unter
    // einer Wurzel. Unendlich anzuzeigen wäre ein verstecktes „geht nicht".
    const nullfaelle: Werte[] = [
      { gegeben: 'ur', r: 0 }, { gegeben: 'ui', i: 0 }, { gegeben: 'up', p: 0 },
      { gegeben: 'rp', r: 0 }, { gegeben: 'ip', i: 0 }, { gegeben: 'ir', r: 0 },
    ];
    for (const v of nullfaelle) {
      const r = rechne(v);
      expect(r.u, JSON.stringify(v)).toBe(0);
      expect(r.i, JSON.stringify(v)).toBe(0);
      expect(r.r, JSON.stringify(v)).toBe(0);
      expect(r.p, JSON.stringify(v)).toBe(0);
      expect(r.hilfe, JSON.stringify(v)).toContain('größer als null');
    }
  });

  it('liefert bei unsinnigen Eingaben endliche Werte', () => {
    const faelle: Werte[] = [
      { u: -5 }, { r: -220 }, { gegeben: 'quatsch' }, { gegeben: 'ip', i: 0, p: 0 },
      { gegeben: 'up', u: 1e-9, p: 1e9 },
    ];
    for (const v of faelle) {
      for (const r of tool.compute({ gegeben: 'ur', u: 5, i: 0.02, r: 220, p: 0.1, ...v })) {
        if (typeof r.value === 'number') {
          expect(Number.isFinite(r.value), `${JSON.stringify(v)} → ${r.label}`).toBe(true);
        }
      }
    }
  });

  it('behandelt eine unbekannte Auswahl wie den Standardfall', () => {
    expect(rechne({ gegeben: 'quatsch' }).i).toBeCloseTo(rechne({ gegeben: 'ur' }).i, 9);
  });
});
