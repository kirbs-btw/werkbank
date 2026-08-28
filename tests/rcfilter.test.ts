import { describe, it, expect } from 'vitest';
import { tool } from '../src/tools/elektronik/rc-filter';

type Werte = Record<string, number | string>;
const rechne = (v: Werte) => {
  const e = tool.compute({ art: 'rc-tief', r: 10, c: 100, ceinheit: 'n', l: 10, fsig: 1000, ...v });
  const holen = (label: string) => e.find((x) => x.label === label);
  const zahl = (label: string): number => {
    const r = holen(label);
    return r && typeof r.value === 'number' ? r.value : NaN;
  };
  return {
    roh: e,
    labels: e.map((x) => x.label),
    hilfe: e.map((x) => x.help ?? '').join(' '),
    fg: zahl('Grenzfrequenz'),
    fgEinheit: holen('Grenzfrequenz')?.unit,
    tau: zahl('Zeitkonstante τ'),
    tauEinheit: holen('Zeitkonstante τ')?.unit,
    db: zahl('Dämpfung bei Signalfrequenz'),
    phase: zahl('Phasenverschiebung'),
    anstieg: zahl('Anstiegszeit 10–90 %'),
    abfall: zahl('Abfall auf 37 %'),
    fgE12: zahl('Mit E12-Widerstand'),
  };
};

/** Grenzfrequenz in Hz, unabhängig von der angezeigten Vorsatzeinheit. */
const fgHz = (v: Werte): number => {
  const r = rechne(v);
  const faktor: Record<string, number> = { 'µHz': 1e-6, mHz: 1e-3, Hz: 1, kHz: 1e3, MHz: 1e6 };
  return r.fg * (faktor[r.fgEinheit ?? 'Hz'] ?? 1);
};

describe('Grenzfrequenz und Zeitkonstante', () => {
  it('folgen beim RC-Glied fg = 1/(2π·R·C)', () => {
    for (const [rk, cn] of [[10, 100], [1, 10], [47, 4.7], [100, 1000]] as [number, number][]) {
      const soll = 1 / (2 * Math.PI * rk * 1000 * cn * 1e-9);
      expect(fgHz({ r: rk, c: cn }), `R=${rk}k C=${cn}n`).toBeCloseTo(soll, 6);
    }
  });

  it('folgen beim RL-Glied fg = R/(2π·L)', () => {
    for (const [rk, lmh] of [[1, 10], [10, 1], [4.7, 47]] as [number, number][]) {
      const soll = (rk * 1000) / (2 * Math.PI * lmh * 1e-3);
      expect(fgHz({ art: 'rl-tief', r: rk, l: lmh }), `R=${rk}k L=${lmh}mH`).toBeCloseTo(soll, 4);
    }
  });

  it('hängen über fg = 1/(2π·τ) zusammen', () => {
    // Der Faktor 2π ist die häufigste Fehlerquelle: τ = 1 ms sind nicht
    // 1000 Hz, sondern 159 Hz.
    const r = rechne({ r: 10, c: 100 });
    expect(r.tau).toBeCloseTo(1, 9);
    expect(r.tauEinheit).toBe('ms');
    expect(r.fg).toBeCloseTo(159.1549, 3);
  });

  it('sind für Tief- und Hochpass mit denselben Bauteilen gleich', () => {
    // Die Bauteile bestimmen den Knick, die Beschaltung nur, welche Seite
    // durchgelassen wird.
    expect(fgHz({ art: 'rc-tief' })).toBeCloseTo(fgHz({ art: 'rc-hoch' }), 9);
    expect(fgHz({ art: 'rl-tief' })).toBeCloseTo(fgHz({ art: 'rl-hoch' }), 9);
  });

  it('halbieren sich bei doppeltem Kondensator', () => {
    expect(fgHz({ c: 200 })).toBeCloseTo(fgHz({ c: 100 }) / 2, 6);
  });

  it('steigen beim RL-Glied mit dem Widerstand, statt zu fallen', () => {
    // Beim RC senkt ein größerer Widerstand die Grenzfrequenz, beim RL hebt
    // er sie – τ = L/R statt R·C.
    expect(fgHz({ r: 20 })).toBeLessThan(fgHz({ r: 10 }));
    expect(fgHz({ art: 'rl-tief', r: 20 })).toBeGreaterThan(fgHz({ art: 'rl-tief', r: 10 }));
  });

  it('rechnen die Kondensator-Einheiten ineinander um', () => {
    expect(fgHz({ c: 1, ceinheit: 'u' })).toBeCloseTo(fgHz({ c: 1000, ceinheit: 'n' }), 6);
    expect(fgHz({ c: 1, ceinheit: 'n' })).toBeCloseTo(fgHz({ c: 1000, ceinheit: 'p' }), 6);
  });
});

describe('Amplitudengang', () => {
  it('liegt an der Grenzfrequenz bei −3,0103 dB', () => {
    // Nicht bei −3: Definiert ist 1/√2 der Amplitude, das sind 3,0103 dB.
    for (const art of ['rc-tief', 'rc-hoch', 'rl-tief', 'rl-hoch']) {
      const fg = fgHz({ art });
      expect(rechne({ art, fsig: fg }).db, art).toBeCloseTo(-3.0103, 3);
    }
  });

  it('fällt beim Tiefpass mit 20 dB je Dekade', () => {
    const fg = fgHz({});
    const eine = rechne({ fsig: fg * 10 }).db;
    const zwei = rechne({ fsig: fg * 100 }).db;
    expect(eine).toBeCloseTo(-20.043, 2);
    expect(zwei - eine).toBeCloseTo(-20, 1);
  });

  it('lässt den Tiefpass weit unterhalb ungehindert durch', () => {
    expect(rechne({ fsig: fgHz({}) / 1000 }).db).toBeCloseTo(0, 4);
  });

  it('spiegelt sich beim Hochpass', () => {
    // Was der Tiefpass eine Dekade über fg dämpft, dämpft der Hochpass eine
    // Dekade darunter.
    const fg = fgHz({});
    const tief = rechne({ art: 'rc-tief', fsig: fg * 10 }).db;
    const hoch = rechne({ art: 'rc-hoch', fsig: fg / 10 }).db;
    expect(tief).toBeCloseTo(hoch, 6);
  });

  it('nennt den verbleibenden Anteil in Prozent', () => {
    expect(rechne({ fsig: fgHz({}) }).hilfe).toContain('70,7 %');
  });

  it('dämpft nie über 0 dB hinaus', () => {
    // Ein passives Filter kann nicht verstärken.
    for (const art of ['rc-tief', 'rc-hoch', 'rl-tief', 'rl-hoch']) {
      for (const f of [0.01, 1, 100, 1e5, 1e8]) {
        expect(rechne({ art, fsig: f }).db, `${art} @ ${f}`).toBeLessThanOrEqual(1e-9);
      }
    }
  });
});

describe('Phasenlage', () => {
  it('ist an der Grenzfrequenz ±45°', () => {
    const fg = fgHz({});
    expect(rechne({ art: 'rc-tief', fsig: fg }).phase).toBeCloseTo(-45, 3);
    expect(rechne({ art: 'rc-hoch', fsig: fg }).phase).toBeCloseTo(45, 3);
  });

  it('läuft beim Tiefpass gegen −90° und beim Hochpass gegen +90°', () => {
    expect(rechne({ art: 'rc-tief', fsig: 1e9 }).phase).toBeCloseTo(-90, 4);
    expect(rechne({ art: 'rc-hoch', fsig: 1e-6 }).phase).toBeCloseTo(90, 4);
  });

  it('bleibt beim Tiefpass immer negativ und beim Hochpass immer positiv', () => {
    for (const f of [0.001, 1, 1000, 1e7]) {
      expect(rechne({ art: 'rc-tief', fsig: f }).phase, `tief @ ${f}`).toBeLessThan(0);
      expect(rechne({ art: 'rc-hoch', fsig: f }).phase, `hoch @ ${f}`).toBeGreaterThan(0);
    }
  });
});

describe('Zeitbereich', () => {
  it('zeigt die Anstiegszeit nur beim Tiefpass', () => {
    // Beim Hochpass gibt es nach einer Stufe keinen Anstieg, sondern einen
    // Abfall – eine Anstiegszeit dort wäre eine erfundene Größe.
    expect(rechne({ art: 'rc-tief' }).labels).toContain('Anstiegszeit 10–90 %');
    expect(rechne({ art: 'rc-hoch' }).labels).not.toContain('Anstiegszeit 10–90 %');
    expect(rechne({ art: 'rc-hoch' }).labels).toContain('Abfall auf 37 %');
  });

  it('rechnet die Anstiegszeit exakt als ln(9) · τ', () => {
    // Nicht 2,2 · τ: Von 10 % auf 90 % braucht die Ladekurve ln(9) = 2,1972
    // Zeitkonstanten. Die 2,2 sind der gerundete Alltagswert.
    const r = rechne({ r: 10, c: 100 });
    expect(r.anstieg).toBeCloseTo(Math.log(9) * r.tau, 9);
    expect(Math.log(9)).toBeCloseTo(2.1972246, 6);
  });

  it('deckt sich mit der Faustformel 0,35 / fg auf 0,1 % genau', () => {
    // Beides beschreibt denselben Sachverhalt, aber 0,35 ist selbst gerundet:
    // exakt wäre ln(9)/2π = 0,34970. Daher rühren die 0,086 % Unterschied –
    // sie sind kein Rechenfehler, sondern die Rundung in der Faustformel.
    const r = rechne({ r: 47, c: 22 });
    const faustformel = 0.35 / fgHz({ r: 47, c: 22 });
    const abweichung = Math.abs(r.anstieg / 1000 / faustformel - 1);
    expect(abweichung).toBeLessThan(0.001);
    expect(abweichung).toBeGreaterThan(0.0005); // sonst prüft die Schranke nichts
    expect(Math.log(9) / (2 * Math.PI)).toBeCloseTo(0.3497, 4);
  });

  it('nennt beim Hochpass die Zeitkonstante selbst', () => {
    const r = rechne({ art: 'rc-hoch' });
    expect(r.abfall).toBeCloseTo(r.tau, 9);
  });
});

describe('E12-Widerstand', () => {
  it('rechnet mit dem kaufbaren Wert', () => {
    // 11,3 kΩ gibt es nicht, 12 kΩ schon.
    const r = rechne({ r: 11.3 });
    expect(r.hilfe).toContain('12 kΩ');
    expect(r.fgE12).toBeCloseTo(rechne({ r: 12 }).fg, 6);
  });

  it('ändert nichts, wenn der Wert schon in der Reihe steht', () => {
    const r = rechne({ r: 10 });
    expect(r.fgE12).toBeCloseTo(r.fg, 9);
  });

  it('behauptet dann nicht „10 kΩ statt 10 kΩ"', () => {
    // Derselbe Widerspruch wie im Ohmschen Gesetz, hier unabhängig noch einmal
    // entstanden. Gefunden, indem die Ergebniszeilen durch die Formatierung
    // der Seite gerendert wurden – kein Test hatte darauf geschaut.
    expect(rechne({ r: 10 }).hilfe).toContain('10 kΩ steht genau so in der E12-Reihe');
    expect(rechne({ r: 10 }).hilfe).not.toContain('statt');
    expect(rechne({ r: 11.3 }).hilfe).toContain('12 kΩ statt 11,3 kΩ');
  });
});

describe('Robustheit', () => {
  it('liefert bei unsinnigen Eingaben endliche Werte', () => {
    const faelle: Werte[] = [
      { r: 0 }, { c: 0 }, { l: 0 }, { fsig: 0 }, { r: -10 }, { c: -100 },
      { art: 'quatsch' }, { art: 'rl-hoch', l: 0 }, { fsig: 1e12 },
    ];
    for (const v of faelle) {
      for (const r of tool.compute({ art: 'rc-tief', r: 10, c: 100, ceinheit: 'n', l: 10, fsig: 1000, ...v })) {
        if (typeof r.value === 'number') {
          expect(Number.isFinite(r.value), `${JSON.stringify(v)} → ${r.label}`).toBe(true);
        }
      }
    }
  });

  it('behandelt eine unbekannte Filterart wie den Standardfall', () => {
    expect(fgHz({ art: 'quatsch' })).toBeCloseTo(fgHz({ art: 'rc-tief' }), 9);
  });

  it('fällt bei unbekannter Kondensator-Einheit auf Nanofarad zurück', () => {
    expect(fgHz({ ceinheit: 'x' })).toBeCloseTo(fgHz({ ceinheit: 'n' }), 9);
  });
});
