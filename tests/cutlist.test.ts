import { describe, it, expect } from 'vitest';
import { optimize, MAX_PARTS, type CutPart, type SheetSpec, type Placement } from '../src/lib/cutlist';

const spec = (over: Partial<SheetSpec> = {}): SheetSpec => ({
  length: 2800,
  width: 2070,
  kerf: 4,
  trim: 0,
  ...over,
});

const part = (length: number, width: number, qty = 1, over: Partial<CutPart> = {}): CutPart => ({
  length,
  width,
  qty,
  rotatable: true,
  ...over,
});

/** Prüft die Kern-Invarianten eines Layouts: alles auf der Platte, nichts überlappt. */
function assertValidLayout(placements: Placement[], s: SheetSpec): void {
  const trim = s.trim ?? 0;
  for (const p of placements) {
    expect(p.x).toBeGreaterThanOrEqual(trim - 1e-6);
    expect(p.y).toBeGreaterThanOrEqual(trim - 1e-6);
    expect(p.x + p.length).toBeLessThanOrEqual(s.length - trim + 1e-6);
    expect(p.y + p.width).toBeLessThanOrEqual(s.width - trim + 1e-6);
  }
  for (let i = 0; i < placements.length; i++) {
    for (let j = i + 1; j < placements.length; j++) {
      const a = placements[i];
      const b = placements[j];
      const overlap =
        a.x < b.x + b.length - 1e-6 &&
        b.x < a.x + a.length - 1e-6 &&
        a.y < b.y + b.width - 1e-6 &&
        b.y < a.y + a.width - 1e-6;
      expect(overlap, `Überlappung: ${JSON.stringify(a)} / ${JSON.stringify(b)}`).toBe(false);
    }
  }
}

describe('cutlist optimize', () => {
  it('packt exakt passende Teile ohne Kerf auf eine Platte (0 % Verschnitt)', () => {
    const r = optimize([part(500, 500, 4)], spec({ length: 1000, width: 1000, kerf: 0 }));
    expect(r.sheets.length).toBe(1);
    expect(r.placedParts).toBe(4);
    expect(r.wastePercent).toBeCloseTo(0, 6);
    assertValidLayout(r.sheets[0].placements, spec({ length: 1000, width: 1000, kerf: 0 }));
  });

  it('berücksichtigt die Sägeblattbreite: mit Kerf passt das zweite Teil nicht mehr', () => {
    const tight = spec({ length: 2000, width: 500 });
    const noKerf = optimize([part(1000, 500, 2)], { ...tight, kerf: 0 });
    expect(noKerf.sheets.length).toBe(1);
    // 1000 + 4 (Kerf) + 1000 = 2004 > 2000 → zweite Platte nötig
    const withKerf = optimize([part(1000, 500, 2)], { ...tight, kerf: 4 });
    expect(withKerf.sheets.length).toBe(2);
    expect(withKerf.placedParts).toBe(2);
  });

  it('dreht Teile nur, wenn erlaubt', () => {
    const s = spec({ length: 1000, width: 500, kerf: 0 });
    const rotated = optimize([part(500, 1000, 1, { rotatable: true })], s);
    expect(rotated.sheets.length).toBe(1);
    expect(rotated.sheets[0].placements[0].rotated).toBe(true);
    const fixed = optimize([part(500, 1000, 1, { rotatable: false })], s);
    expect(fixed.sheets.length).toBe(0);
    expect(fixed.unplaceable.length).toBe(1);
    expect(fixed.unplaceable[0].qty).toBe(1);
  });

  it('meldet Teile, die größer als die Platte sind, statt endlos Platten zu öffnen', () => {
    const r = optimize([part(3000, 100, 2, { label: 'Leiste' }), part(600, 400, 1)], spec());
    expect(r.unplaceable).toEqual([{ length: 3000, width: 100, qty: 2, label: 'Leiste' }]);
    expect(r.sheets.length).toBe(1);
    expect(r.placedParts).toBe(1);
    expect(r.requestedParts).toBe(3);
  });

  it('respektiert den Randbeschnitt (Trim)', () => {
    const s = spec({ length: 1000, width: 1000, kerf: 0, trim: 50 });
    const tooBig = optimize([part(950, 950, 1)], s);
    expect(tooBig.unplaceable.length).toBe(1);
    const fitsExact = optimize([part(900, 900, 1)], s);
    expect(fitsExact.sheets.length).toBe(1);
    expect(fitsExact.sheets[0].placements[0].x).toBeCloseTo(50, 6);
    expect(fitsExact.sheets[0].placements[0].y).toBeCloseTo(50, 6);
  });

  it('verteilt viele Teile auf mehrere Platten – ohne Überlappung, alles innerhalb', () => {
    const parts = [
      part(800, 600, 4, { label: 'Seite' }),
      part(762, 400, 6, { label: 'Boden' }),
      part(1200, 300, 3, { label: 'Blende' }),
      part(350, 350, 10, { label: 'Klotz' }),
      part(2500, 200, 2, { label: 'Wange' }),
    ];
    const s = spec();
    const r = optimize(parts, s);
    expect(r.placedParts).toBe(25);
    expect(r.unplaceable.length).toBe(0);
    for (const sheet of r.sheets) assertValidLayout(sheet.placements, s);
    // Flächenbilanz: Teilflächen + Verschnitt = Plattenfläche
    expect(r.partsArea / r.sheetsArea).toBeCloseTo(1 - r.wastePercent / 100, 6);
  });

  it('ist deterministisch (gleiche Eingabe → identisches Ergebnis)', () => {
    const parts = [part(600, 400, 5), part(900, 300, 3, { label: 'X' }), part(200, 180, 7)];
    const a = optimize(parts, spec());
    const b = optimize(parts, spec());
    expect(a).toEqual(b);
  });

  it('ignoriert ungültige Zeilen und kürzt bei Überschreitung des Limits', () => {
    const r = optimize(
      [part(0, 100, 1), part(100, 100, -2), part(100, 100, MAX_PARTS + 10)],
      spec({ kerf: 0 }),
    );
    expect(r.truncated).toBe(true);
    expect(r.placedParts).toBe(MAX_PARTS);
  });

  it('listet nutzbare Reststücke, größte zuerst', () => {
    // Ein Teil in der Ecke einer 1000er-Platte → große Reste bleiben
    const r = optimize([part(400, 400, 1)], spec({ length: 1000, width: 1000, kerf: 0 }));
    expect(r.sheets[0].offcuts.length).toBeGreaterThan(0);
    const areas = r.sheets[0].offcuts.map((o) => o.length * o.width);
    expect(areas).toEqual([...areas].sort((x, y) => y - x));
    // Reste + Teil dürfen zusammen die Platte nicht überschreiten
    const total = areas.reduce((s2, a2) => s2 + a2, 0) + 400 * 400;
    expect(total).toBeLessThanOrEqual(1000 * 1000 + 1e-6);
  });

  it('liefert bei leerer Eingabe ein leeres Ergebnis', () => {
    const r = optimize([], spec());
    expect(r.sheets.length).toBe(0);
    expect(r.wastePercent).toBe(0);
    expect(r.requestedParts).toBe(0);
  });
});
