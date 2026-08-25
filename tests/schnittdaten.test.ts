import { describe, it, expect } from 'vitest';
import {
  MATERIALS,
  TOOL_MATERIALS,
  MAX_THINNING,
  getMaterial,
  engagementAngle,
  meanChipThickness,
  computeCuttingData,
  type CuttingInput,
  type ToolMaterial,
} from '../src/lib/schnittdaten';

const input = (over: Partial<CuttingInput> = {}): CuttingInput => ({
  material: 'alu-knet',
  toolMaterial: 'vhm',
  d: 6,
  z: 2,
  ae: 3,
  ap: 6,
  eta: 80,
  chipThinning: false,
  ...over,
});

describe('Werkstoff-Datenbank', () => {
  it('hat eindeutige IDs und vollständige Daten', () => {
    const ids = MATERIALS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of MATERIALS) {
      expect(m.label.length, m.id).toBeGreaterThan(3);
      expect(m.note.length, m.id).toBeGreaterThan(20);
      expect(m.kc11, m.id).toBeGreaterThan(0);
      expect(m.mc, m.id).toBeGreaterThan(0);
      expect(m.fzFactor, m.id).toBeGreaterThan(0);
    }
  });

  it('hat für jedes Werkzeugmaterial einen plausiblen vc-Bereich', () => {
    for (const m of MATERIALS) {
      for (const t of TOOL_MATERIALS) {
        const [lo, hi] = m.vc[t.id];
        expect(lo, `${m.id}/${t.id}`).toBeGreaterThan(0);
        expect(hi, `${m.id}/${t.id}`).toBeGreaterThan(lo);
      }
    }
  });

  it('erlaubt mit Hartmetall stets mehr Schnittgeschwindigkeit als mit HSS', () => {
    for (const m of MATERIALS) {
      expect(m.vc.vhm[0], m.id).toBeGreaterThanOrEqual(m.vc.hss[0]);
      expect(m.vc['vhm-tialn'][1], m.id).toBeGreaterThanOrEqual(m.vc.vhm[1]);
    }
  });

  it('ordnet zähere Werkstoffe niedrigeren Schnittgeschwindigkeiten zu als Aluminium', () => {
    const alu = getMaterial('alu-knet')!;
    for (const id of ['baustahl', '42crmo4', 'v2a', 'titan', 'inconel']) {
      expect(getMaterial(id)!.vc.vhm[1], id).toBeLessThan(alu.vc.vhm[1]);
    }
  });

  it('liefert undefined für unbekannte IDs', () => {
    expect(getMaterial('gibt-es-nicht')).toBeUndefined();
  });
});

describe('Eingriffsgeometrie', () => {
  it('Eingriffswinkel: halber Eingriff = 90°, Volleingriff = 180°', () => {
    expect((engagementAngle(0.5) * 180) / Math.PI).toBeCloseTo(90, 6);
    expect((engagementAngle(1) * 180) / Math.PI).toBeCloseTo(180, 6);
  });

  it('mittlere Spanungsdicke stimmt mit dem Einzelrechner überein (hm = 2/π · fz)', () => {
    expect(meanChipThickness(0.1, 0.5)).toBeCloseTo(0.0637, 4);
    expect(meanChipThickness(0.1, 1)).toBeCloseTo(0.0637, 4);
  });

  it('hm sinkt bei kleiner radialer Zustellung (Spanausdünnung)', () => {
    expect(meanChipThickness(0.1, 0.1)).toBeLessThan(meanChipThickness(0.1, 0.5));
  });
});

describe('computeCuttingData', () => {
  it('rechnet Drehzahl und Vorschub aus den Grundformeln', () => {
    const r = computeCuttingData(input());
    // vc = Mitte aus 200–400 = 300 m/min
    expect(r.vc).toBeCloseTo(300, 6);
    expect(r.n).toBeCloseTo((300 * 1000) / (Math.PI * 6), 3);
    expect(r.fzBase).toBeCloseTo(0.108, 6);
    expect(r.vf).toBeCloseTo(r.fz * 2 * r.n, 6);
  });

  it('Zeitspanvolumen und Leistung hängen konsistent zusammen', () => {
    const r = computeCuttingData(input());
    expect(r.q).toBeCloseTo((3 * 6 * r.vf) / 1000, 6);
    expect(r.pc).toBeCloseTo((r.q * r.kc) / 60000, 6);
    expect(r.p).toBeCloseTo(r.pc / 0.8, 6);
  });

  it('Spanausdünnungs-Ausgleich hebt fz bei kleinem ae an, nicht bei halbem Eingriff', () => {
    const halb = computeCuttingData(input({ ae: 3, chipThinning: true }));
    expect(halb.thinningFactor).toBeCloseTo(1, 6);

    const adaptiv = computeCuttingData(input({ ae: 0.6, chipThinning: true }));
    expect(adaptiv.thinningFactor).toBeGreaterThan(1.9);
    expect(adaptiv.fz).toBeCloseTo(adaptiv.fzBase * adaptiv.thinningFactor, 6);
    expect(adaptiv.vf).toBeGreaterThan(halb.vf);
  });

  it('hält die mittlere Spanungsdicke durch den Ausgleich näherungsweise konstant', () => {
    const halb = computeCuttingData(input({ ae: 3, chipThinning: true }));
    const adaptiv = computeCuttingData(input({ ae: 0.9, chipThinning: true }));
    expect(adaptiv.hm).toBeCloseTo(halb.hm, 3);
  });

  it('begrenzt den Ausgleich auf das 2,5-fache und warnt dabei', () => {
    const r = computeCuttingData(input({ ae: 0.05, chipThinning: true }));
    expect(r.thinningFactor).toBeLessThanOrEqual(MAX_THINNING + 1e-9);
    expect(r.warnings.some((w) => w.includes('begrenzt'))).toBe(true);
  });

  it('ohne Ausgleich bleibt fz auf dem Tabellenwert', () => {
    const r = computeCuttingData(input({ ae: 0.6, chipThinning: false }));
    expect(r.thinningFactor).toBe(1);
    expect(r.fz).toBeCloseTo(r.fzBase, 6);
  });

  it('kc steigt bei dünnerem Span (Kienzle)', () => {
    const dick = computeCuttingData(input({ ae: 3 }));
    const duenn = computeCuttingData(input({ ae: 0.3 }));
    expect(duenn.hm).toBeLessThan(dick.hm);
    expect(duenn.kc).toBeGreaterThan(dick.kc);
  });

  it('warnt bei ungeeigneter Werkzeug-Werkstoff-Kombination', () => {
    const r = computeCuttingData(input({ material: 'stahl-gehaertet', toolMaterial: 'hss' }));
    expect(r.warnings.some((w) => w.toLowerCase().includes('ungeeignet'))).toBe(true);
    const ok = computeCuttingData(input({ material: 'stahl-gehaertet', toolMaterial: 'vhm-tialn' }));
    expect(ok.warnings.some((w) => w.toLowerCase().includes('ungeeignet'))).toBe(false);
  });

  it('warnt bei zu großer Schnitttiefe', () => {
    const r = computeCuttingData(input({ ap: 20, d: 6 }));
    expect(r.warnings.some((w) => w.includes('Schnitttiefe'))).toBe(true);
  });

  it('begrenzt ae auf den Fräserdurchmesser (Nut ist das Maximum)', () => {
    const nut = computeCuttingData(input({ ae: 6, d: 6 }));
    const zuViel = computeCuttingData(input({ ae: 99, d: 6 }));
    expect(zuViel.q).toBeCloseTo(nut.q, 6);
    expect(zuViel.phiDeg).toBeCloseTo(180, 6);
  });

  it('liefert für jede Werkstoff-Werkzeug-Kombination endliche, positive Werte', () => {
    for (const m of MATERIALS) {
      for (const t of TOOL_MATERIALS) {
        const r = computeCuttingData(input({ material: m.id, toolMaterial: t.id as ToolMaterial, chipThinning: true }));
        for (const [key, val] of Object.entries(r)) {
          if (typeof val === 'number') {
            expect(Number.isFinite(val), `${m.id}/${t.id} → ${key} = ${val}`).toBe(true);
            expect(val, `${m.id}/${t.id} → ${key}`).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('fängt unsinnige Eingaben ab, statt NaN zu liefern', () => {
    const r = computeCuttingData(input({ d: 0, z: 0, ae: 0, ap: 0 }));
    expect(Number.isFinite(r.n)).toBe(true);
    expect(Number.isFinite(r.vf)).toBe(true);
    expect(r.q).toBe(0);
  });

  it('ist deterministisch', () => {
    expect(computeCuttingData(input())).toEqual(computeCuttingData(input()));
  });
});
