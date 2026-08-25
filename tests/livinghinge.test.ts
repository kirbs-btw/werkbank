import { describe, it, expect } from 'vitest';
import { buildHinge, bendPreviewSvg, MAX_ANGLE_PER_ROW, type HingeSpec } from '../src/lib/livinghinge';
import { writeSvg, writeDxf, parseDxf, entityStats } from '../src/lib/dxfsvg';

const spec = (over: Partial<HingeSpec> = {}): HingeSpec => ({
  panelWidth: 120,
  panelHeight: 100,
  angle: 90,
  radius: 20,
  thickness: 3,
  slitLength: 20,
  gap: 3,
  rowSpacing: 3,
  margin: 2,
  outline: false,
  ...over,
});

const slitsOf = (r: ReturnType<typeof buildHinge>) =>
  r.drawing.entities.filter((e) => e.layer === 'Scharnier') as {
    points: { x: number; y: number }[];
  }[];

describe('Scharnierbreite aus der Biegung', () => {
  it('rechnet die Bogenlänge der neutralen Faser', () => {
    // (20 + 1,5) · 90° = 21,5 · π/2 = 33,77 mm
    const r = buildHinge(spec());
    expect(r.stats.bandWidth).toBeCloseTo(21.5 * (Math.PI / 2), 6);
  });

  it('skaliert mit Winkel und Radius', () => {
    const halb = buildHinge(spec({ angle: 45 })).stats.bandWidth;
    const voll = buildHinge(spec({ angle: 90 })).stats.bandWidth;
    expect(voll).toBeCloseTo(halb * 2, 6);
    expect(buildHinge(spec({ radius: 40 })).stats.bandWidth).toBeGreaterThan(voll);
  });

  it('berücksichtigt die Materialstärke über die halbe Dicke', () => {
    const duenn = buildHinge(spec({ thickness: 1 })).stats.bandWidth;
    const dick = buildHinge(spec({ thickness: 6 })).stats.bandWidth;
    expect(dick - duenn).toBeCloseTo(((6 - 1) / 2) * (Math.PI / 2), 6);
  });
});

describe('Reihen & Muster', () => {
  it('verteilt die Reihen gleichmäßig über den Scharnierbereich', () => {
    const r = buildHinge(spec());
    expect(r.stats.rows).toBeGreaterThan(1);
    expect(r.stats.actualSpacing).toBeCloseTo(r.stats.bandWidth / r.stats.rows, 9);
    const xs = [...new Set(slitsOf(r).map((s) => s.points[0].x))].sort((a, b) => a - b);
    expect(xs).toHaveLength(r.stats.rows);
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i] - xs[i - 1]).toBeCloseTo(r.stats.actualSpacing, 6);
    }
  });

  it('zentriert den Scharnierbereich in der Platte', () => {
    const r = buildHinge(spec({ panelWidth: 200 }));
    const xs = slitsOf(r).map((s) => s.points[0].x);
    const mitte = (Math.min(...xs) + Math.max(...xs)) / 2;
    expect(mitte).toBeCloseTo(100, 6);
  });

  it('setzt die Stege benachbarter Reihen auf Lücke – das macht das Scharnier biegsam', () => {
    const r = buildHinge(spec());
    const xs = [...new Set(slitsOf(r).map((s) => s.points[0].x))].sort((a, b) => a - b);
    const reihe = (x: number) =>
      slitsOf(r)
        .filter((s) => Math.abs(s.points[0].x - x) < 1e-9)
        .map((s) => ({ von: s.points[0].y, bis: s.points[1].y }))
        .sort((p, q) => p.von - q.von);
    const a = reihe(xs[0]);
    const b = reihe(xs[1]);
    expect(a.length).toBeGreaterThan(1);
    expect(b.length).toBeGreaterThan(1);

    /** Mitte jedes stehengebliebenen Stegs einer Reihe. */
    const stege = (row: { von: number; bis: number }[]) =>
      row.slice(0, -1).map((s, i) => (s.bis + row[i + 1].von) / 2);
    const ueberdeckt = (row: { von: number; bis: number }[], y: number) =>
      row.some((s) => y > s.von && y < s.bis);

    for (const y of stege(a)) expect(ueberdeckt(b, y), `Steg bei y=${y} liegt nicht auf Lücke`).toBe(true);
    for (const y of stege(b)) expect(ueberdeckt(a, y), `Steg bei y=${y} liegt nicht auf Lücke`).toBe(true);

    // Der Versatz der Reihen beträgt eine halbe Teilung aus Schlitz und Steg
    const periode = 20 + 3;
    const innenA = a.map((s) => s.von).filter((y) => y > 2 + 1e-9);
    const innenB = b.map((s) => s.von).filter((y) => y > 2 + 1e-9);
    expect(Math.abs(innenA[0] - innenB[0])).toBeCloseTo(periode / 2, 6);
  });

  it('hält den Randabstand oben und unten ein', () => {
    const margin = 5;
    const r = buildHinge(spec({ margin }));
    for (const s of slitsOf(r)) {
      expect(s.points[0].y).toBeGreaterThanOrEqual(margin - 1e-9);
      expect(s.points[1].y).toBeLessThanOrEqual(100 - margin + 1e-9);
    }
  });

  it('erzeugt bei Randabstand 0 Schlitze bis an die Plattenkante', () => {
    const r = buildHinge(spec({ margin: 0 }));
    const ys = slitsOf(r).flatMap((s) => [s.points[0].y, s.points[1].y]);
    expect(Math.min(...ys)).toBeCloseTo(0, 6);
    expect(Math.max(...ys)).toBeCloseTo(100, 6);
  });

  it('alle Schlitze sind senkrecht und liegen innerhalb der Platte', () => {
    const r = buildHinge(spec({ panelWidth: 150, panelHeight: 80 }));
    for (const s of slitsOf(r)) {
      expect(s.points[0].x).toBeCloseTo(s.points[1].x, 9);
      expect(s.points[1].y).toBeGreaterThan(s.points[0].y);
      expect(s.points[0].x).toBeGreaterThanOrEqual(0);
      expect(s.points[0].x).toBeLessThanOrEqual(150);
    }
  });

  it('verwirft zu kurze Schlitzreste', () => {
    for (const s of slitsOf(buildHinge(spec({ margin: 1.4 })))) {
      expect(s.points[1].y - s.points[0].y).toBeGreaterThanOrEqual(1);
    }
  });

  it('summiert die Schnittlänge korrekt', () => {
    const r = buildHinge(spec());
    const summe = slitsOf(r).reduce((s, e) => s + (e.points[1].y - e.points[0].y), 0);
    expect(r.stats.cutLength).toBeCloseTo(summe, 6);
    expect(r.stats.slits).toBe(slitsOf(r).length);
  });

  it('zeichnet den Umriss nur auf Wunsch', () => {
    expect(buildHinge(spec({ outline: false })).drawing.entities.some((e) => e.layer === 'Umriss')).toBe(false);
    const mit = buildHinge(spec({ outline: true }));
    const umriss = mit.drawing.entities.find((e) => e.layer === 'Umriss');
    expect(umriss).toMatchObject({ closed: true });
    expect(mit.drawing.bounds).toEqual({ minX: 0, minY: 0, maxX: 120, maxY: 100 });
  });
});

describe('Kennzahlen & Warnungen', () => {
  it('rechnet Winkel je Reihe und Schlitzöffnung', () => {
    const r = buildHinge(spec());
    expect(r.stats.anglePerRow).toBeCloseTo(90 / r.stats.rows, 9);
    expect(r.stats.openingPerRow).toBeCloseTo(3 * r.stats.anglePerRow * (Math.PI / 180), 9);
  });

  it('warnt, wenn zu wenige Reihen zu viel Winkel je Reihe ergeben', () => {
    const r = buildHinge(spec({ rowSpacing: 20 }));
    expect(r.stats.anglePerRow).toBeGreaterThan(MAX_ANGLE_PER_ROW);
    expect(r.stats.warnings.some((w) => w.includes('je Reihe'))).toBe(true);
  });

  it('warnt, wenn der Scharnierbereich breiter als die Platte ist', () => {
    const r = buildHinge(spec({ panelWidth: 20, radius: 60 }));
    expect(r.stats.warnings.some((w) => w.includes('breiter als die Platte'))).toBe(true);
  });

  it('warnt bei zu schmalen Stegen', () => {
    expect(buildHinge(spec({ gap: 0.5, thickness: 6 })).stats.warnings.some((w) => w.includes('Stege'))).toBe(true);
  });

  it('legt mindestens zwei Reihen an', () => {
    expect(buildHinge(spec({ angle: 5, radius: 1, rowSpacing: 50 })).stats.rows).toBeGreaterThanOrEqual(2);
  });

  it('fängt unsinnige Eingaben ab', () => {
    const r = buildHinge(spec({ panelHeight: 0, slitLength: 0, gap: 0, rowSpacing: 0, margin: -5, angle: 0 }));
    expect(Number.isFinite(r.stats.bandWidth)).toBe(true);
    expect(r.stats.rows).toBeGreaterThanOrEqual(2);
    for (const s of slitsOf(r)) {
      expect(Number.isFinite(s.points[0].x)).toBe(true);
      expect(Number.isFinite(s.points[0].y)).toBe(true);
    }
  });

  it('ist deterministisch', () => {
    expect(buildHinge(spec())).toEqual(buildHinge(spec()));
  });
});

describe('Export über die geprüften Konverter', () => {
  it('liefert maßhaltiges SVG', () => {
    const r = buildHinge(spec({ outline: true }));
    const svg = writeSvg(r.drawing, { margin: 0 });
    expect(svg).toContain('width="120mm"');
    expect(svg).toContain('height="100mm"');
    expect((svg.match(/<polyline/g) ?? []).length).toBe(r.stats.slits);
    expect(svg).toContain('<polygon'); // geschlossener Umriss
  });

  it('liefert DXF, das sich wieder einlesen lässt', () => {
    const r = buildHinge(spec({ outline: true }));
    const dxf = writeDxf(r.drawing);
    expect(dxf).toContain('AC1009');
    expect(dxf).toContain('Scharnier');
    const zurueck = parseDxf(dxf);
    // Schlitze sind Zwei-Punkt-Linien, der Umriss eine Polylinie
    expect(entityStats(zurueck).polyline).toBe(r.stats.slits + 1);
    expect(zurueck.bounds.maxX).toBeCloseTo(120, 3);
    expect(zurueck.bounds.maxY).toBeCloseTo(100, 3);
  });
});

describe('Biegevorschau', () => {
  it('zeichnet einen Bogen mit geraden Schenkeln', () => {
    const s = spec();
    const r = buildHinge(s);
    const svg = bendPreviewSvg(s, r.stats);
    expect(svg).toContain('<svg');
    expect(svg).toContain('<polygon');
    const pts = svg.match(/points="([^"]+)"/)![1].split(' ').map((p) => p.split(',').map(Number));
    // Alle Punkte endlich und der Bogen erreicht ungefähr den Außenradius
    for (const [x, y] of pts) {
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
    const maxAbstand = Math.max(...pts.map(([x, y]) => Math.hypot(x, y - 20)));
    expect(maxAbstand).toBeGreaterThan(20); // größer als der Innenradius
  });

  it('ergibt bei größerem Winkel eine höhere Silhouette', () => {
    const klein = bendPreviewSvg(spec({ angle: 30 }), buildHinge(spec({ angle: 30 })).stats);
    const gross = bendPreviewSvg(spec({ angle: 120 }), buildHinge(spec({ angle: 120 })).stats);
    const hoehe = (svg: string) => {
      const vb = svg.match(/viewBox="([^"]+)"/)![1].split(' ').map(Number);
      return vb[3];
    };
    expect(hoehe(gross)).toBeGreaterThan(hoehe(klein));
  });
});
