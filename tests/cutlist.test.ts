import { describe, it, expect } from 'vitest';
import {
  optimize,
  optimizeStock,
  combinedSvg,
  sheetSvg,
  MAX_PARTS,
  type CutPart,
  type SheetSpec,
  type StockSpec,
  type Placement,
} from '../src/lib/cutlist';

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

/* ---------------- v2: mehrere Plattenformate & Schnittliste ---------------- */

const stockSpec = (over: Partial<StockSpec> = {}): StockSpec => ({
  stock: [{ length: 1000, width: 1000 }],
  kerf: 0,
  trim: 0,
  ...over,
});

describe('optimizeStock – mehrere Plattenformate', () => {
  it('wählt das kleinere Format, wenn das Teil darauf passt', () => {
    const r = optimizeStock([part(400, 400, 1)], stockSpec({
      stock: [
        { length: 1000, width: 1000, label: 'gross' },
        { length: 500, width: 500, label: 'klein' },
      ],
    }));
    expect(r.sheets).toHaveLength(1);
    expect(r.sheets[0].sheet.label).toBe('klein');
    expect(r.sheetsArea).toBe(500 * 500);
  });

  it('greift auf das größere Format zurück, wenn das Teil nicht auf das kleine passt', () => {
    const r = optimizeStock([part(600, 600, 1)], stockSpec({
      stock: [
        { length: 500, width: 500, label: 'klein' },
        { length: 1000, width: 1000, label: 'gross' },
      ],
    }));
    expect(r.sheets).toHaveLength(1);
    expect(r.sheets[0].sheet.label).toBe('gross');
    expect(r.unplaceable).toHaveLength(0);
  });

  it('bevorzugt eine gemeinsame Platte, statt ein zweites Format anzubrechen', () => {
    // Beide Teile passen zusammen auf die grosse Platte (600 + 400 = 1000).
    // Das ist sparsamer, als zusaetzlich die kleine Platte anzuschneiden.
    const r = optimizeStock([part(600, 600, 1), part(400, 400, 1)], stockSpec({
      stock: [
        { length: 1000, width: 1000, qty: 1, label: 'gross' },
        { length: 500, width: 500, qty: 1, label: 'klein' },
      ],
    }));
    expect(r.placedParts).toBe(2);
    expect(r.outOfStock).toBe(0);
    expect(r.sheets).toHaveLength(1);
    expect(r.sheets[0].sheet.label).toBe('gross');
  });

  it('nutzt ein zweites Format, sobald das erste die Teile nicht mehr hergibt', () => {
    // 900 passt nur auf die grosse Platte und laesst dort keinen Platz mehr
    // fuer 550 - das muss also auf die kleine Platte.
    const r = optimizeStock([part(900, 900, 1), part(550, 550, 1)], stockSpec({
      stock: [
        { length: 1000, width: 1000, qty: 1, label: 'gross' },
        { length: 600, width: 600, qty: 1, label: 'klein' },
      ],
    }));
    expect(r.placedParts).toBe(2);
    expect(r.sheets).toHaveLength(2);
    expect(r.sheets.map((x) => x.sheet.label).sort()).toEqual(['gross', 'klein']);
  });

  it('meldet Teile, die auf kein Format passen, als unplaceable', () => {
    const r = optimizeStock([part(2000, 100, 2, { label: 'Lang' })], stockSpec({
      stock: [{ length: 1000, width: 1000 }, { length: 500, width: 500 }],
    }));
    expect(r.unplaceable).toEqual([{ length: 2000, width: 100, qty: 2, label: 'Lang' }]);
    expect(r.sheets).toHaveLength(0);
  });
});

describe('optimizeStock – begrenzter Vorrat', () => {
  it('überschreitet die verfügbare Stückzahl nicht und meldet den Rest', () => {
    const r = optimizeStock([part(600, 600, 4)], stockSpec({
      stock: [{ length: 1000, width: 1000, qty: 1 }],
    }));
    expect(r.sheets).toHaveLength(1);
    expect(r.placedParts).toBe(1);
    expect(r.outOfStock).toBe(3);
    expect(r.requestedParts).toBe(4);
  });

  it('nutzt bei unbegrenztem Vorrat so viele Platten wie nötig', () => {
    const r = optimizeStock([part(600, 600, 4)], stockSpec({
      stock: [{ length: 1000, width: 1000 }],
    }));
    expect(r.sheets).toHaveLength(4);
    expect(r.outOfStock).toBe(0);
  });

  it('weicht auf das nächste Format aus, wenn das erste aufgebraucht ist', () => {
    const r = optimizeStock([part(400, 400, 3)], stockSpec({
      stock: [
        { length: 500, width: 500, qty: 1, label: 'klein' },
        { length: 1000, width: 1000, label: 'gross' },
      ],
    }));
    expect(r.placedParts).toBe(3);
    expect(r.outOfStock).toBe(0);
    expect(r.sheets.filter((s) => s.sheet.label === 'klein').length).toBeLessThanOrEqual(1);
  });
});

describe('optimizeStock – Kosten', () => {
  const parts = [part(400, 400, 4)];
  const mixed = (withPrices: boolean): StockSpec =>
    stockSpec({
      stock: [
        { length: 1000, width: 1000, label: 'gross', price: withPrices ? 20 : 0 },
        { length: 500, width: 500, label: 'klein', price: withPrices ? 2 : 0 },
      ],
    });

  it('ohne Preise entscheidet die Fläche und die Plattenzahl', () => {
    const r = optimizeStock(parts, mixed(false));
    // Beide Varianten belegen 1 000 000 mm² – die Lösung mit weniger Platten gewinnt
    expect(r.sheets).toHaveLength(1);
    expect(r.sheets[0].sheet.label).toBe('gross');
    expect(r.cost).toBe(0);
  });

  it('mit Preisen gewinnt die günstigere Lösung, auch wenn sie mehr Platten braucht', () => {
    const r = optimizeStock(parts, mixed(true));
    expect(r.cost).toBe(8); // 4 × 2 € statt 1 × 20 €
    expect(r.sheets).toHaveLength(4);
    expect(r.sheets.every((s) => s.sheet.label === 'klein')).toBe(true);
  });

  it('summiert die Kosten der tatsächlich verwendeten Platten', () => {
    const r = optimizeStock([part(600, 600, 3)], stockSpec({
      stock: [{ length: 1000, width: 1000, price: 7.5 }],
    }));
    expect(r.sheets).toHaveLength(3);
    expect(r.cost).toBeCloseTo(22.5, 6);
  });
});

describe('Schnittliste & Nummerierung', () => {
  it('nummeriert je Platte fortlaufend ab 1', () => {
    const r = optimizeStock([part(300, 300, 6)], stockSpec({ stock: [{ length: 1000, width: 700 }] }));
    for (const sheet of r.sheets) {
      const nums = sheet.placements.map((p) => p.num);
      expect(nums).toEqual(Array.from({ length: nums.length }, (_, i) => i + 1));
    }
  });

  it('vergibt die Nummern in Lesereihenfolge (oben links zuerst)', () => {
    const r = optimizeStock([part(300, 300, 4)], stockSpec({ stock: [{ length: 1000, width: 1000 }] }));
    const p = r.sheets[0].placements;
    for (let i = 1; i < p.length; i++) {
      const vorher = p[i - 1];
      const jetzt = p[i];
      expect(vorher.y < jetzt.y || (Math.abs(vorher.y - jetzt.y) < 1e-9 && vorher.x <= jetzt.x)).toBe(true);
    }
  });

  it('hängt Maße und Preis der Platte an jedes Layout', () => {
    const r = optimizeStock([part(400, 400, 1)], stockSpec({
      stock: [{ length: 800, width: 600, label: 'Multiplex', price: 12.5 }],
    }));
    expect(r.sheets[0].sheet).toEqual({ length: 800, width: 600, label: 'Multiplex', price: 12.5 });
  });

  it('leitet einen Namen ab, wenn keiner angegeben ist', () => {
    const r = optimizeStock([part(400, 400, 1)], stockSpec({ stock: [{ length: 800, width: 600 }] }));
    expect(r.sheets[0].sheet.label).toBe('800 × 600');
  });
});

describe('SVG-Ausgabe mit gemischten Formaten', () => {
  const mixedResult = () =>
    optimizeStock([part(900, 900, 1), part(550, 550, 1)], stockSpec({
      stock: [
        { length: 1000, width: 1000, qty: 1, label: 'gross' },
        { length: 600, width: 600, qty: 1, label: 'klein' },
      ],
    }));

  it('zeichnet jede Platte in ihrer eigenen Größe', () => {
    const r = mixedResult();
    const svgs = r.sheets.map((s) => sheetSvg(s));
    expect(svgs.some((s) => s.includes('viewBox="0 0 1000 1000"'))).toBe(true);
    expect(svgs.some((s) => s.includes('viewBox="0 0 600 600"'))).toBe(true);
  });

  it('stapelt gemischte Formate ohne Überlappung im Gesamt-SVG', () => {
    const r = mixedResult();
    const svg = combinedSvg(r);
    expect(svg).toContain('mm"');
    expect(svg).toContain('gross');
    expect(svg).toContain('klein');
    // Blatthöhe deckt beide Platten samt Abständen ab
    const h = parseFloat(svg.match(/height="([\d.]+)mm"/)![1]);
    expect(h).toBeGreaterThan(1000 + 600);
  });

  it('liefert bei leerem Ergebnis kein kaputtes SVG', () => {
    expect(combinedSvg(optimizeStock([], stockSpec()))).toBe('');
  });

  it('zeigt die Teilenummer im Plan', () => {
    const r = optimizeStock([part(400, 400, 2)], stockSpec({ stock: [{ length: 1000, width: 1000 }] }));
    const svg = sheetSvg(r.sheets[0]);
    expect(svg).toContain('Nr. 1');
    expect(svg).toContain('Nr. 2');
  });
});

describe('optimizeStock – Robustheit', () => {
  it('ist deterministisch', () => {
    const s = stockSpec({ stock: [{ length: 1000, width: 800 }, { length: 600, width: 400 }] });
    const p = [part(350, 300, 5), part(500, 200, 3)];
    expect(optimizeStock(p, s)).toEqual(optimizeStock(p, s));
  });

  it('kommt ohne Lagerformate klar', () => {
    const r = optimizeStock([part(100, 100, 1)], stockSpec({ stock: [] }));
    expect(r.sheets).toHaveLength(0);
    expect(r.cost).toBe(0);
  });

  it('ignoriert ungültige Formate', () => {
    const r = optimizeStock([part(100, 100, 1)], stockSpec({
      stock: [{ length: 0, width: 500 }, { length: 500, width: 500 }],
    }));
    expect(r.sheets).toHaveLength(1);
    expect(r.sheets[0].sheet.length).toBe(500);
  });

  it('berücksichtigt Kerf und Randbeschnitt auf allen Formaten', () => {
    const r = optimizeStock([part(460, 460, 1)], stockSpec({
      stock: [{ length: 500, width: 500 }],
      kerf: 4,
      trim: 25,
    }));
    // nutzbar sind 450 × 450 – das Teil passt nicht mehr
    expect(r.unplaceable).toHaveLength(1);
  });
});
