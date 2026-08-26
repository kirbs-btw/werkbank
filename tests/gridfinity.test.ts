import { describe, it, expect } from 'vitest';
import { buildBin, toStl, previewSvg, roundedRect, GF, type BinSpec } from '../src/lib/gridfinity';
import { analyzeStl } from '../src/lib/stl';

const spec = (over: Partial<BinSpec> = {}): BinSpec => ({
  unitsX: 1,
  unitsY: 1,
  unitsZ: 3,
  wall: 1.2,
  floor: 1.2,
  compartmentsX: 1,
  compartmentsY: 1,
  lip: false,
  holes: 'keine',
  segments: 6,
  ...over,
});

/** Netz durch den eigenen STL-Analyzer prüfen – deckt Löcher und falsche Normalen auf. */
const analyze = (s: BinSpec) => analyzeStl(toStl(buildBin(s).triangles));

describe('Spezifikationsmaße', () => {
  it('hält die Konstanten der Gridfinity-Spezifikation ein', () => {
    expect(GF.GRID).toBe(42);
    expect(GF.HEIGHT_UNIT).toBe(7);
    expect(GF.BASE_HEIGHT).toBe(4.75);
    expect(GF.CORNER_R).toBe(3.75);
    expect(GF.LIP_HEIGHT).toBe(4.4);
    // Fußprofil: 0,8 + 1,8 + 2,15 = 4,75 und Versatz 0,8 + 2,15 = 2,95
    expect(0.8 + 1.8 + 2.15).toBeCloseTo(GF.BASE_HEIGHT, 9);
    expect(0.8 + 2.15).toBeCloseTo(GF.BASE_INSET, 9);
  });

  it('1×1×3 misst 41,5 × 41,5 × 21 mm (Beispiel aus der Spezifikation)', () => {
    const r = buildBin(spec({ unitsX: 1, unitsY: 1, unitsZ: 3, lip: false }));
    expect(r.stats.size[0]).toBeCloseTo(41.5, 9);
    expect(r.stats.size[1]).toBeCloseTo(41.5, 9);
    expect(r.stats.size[2]).toBeCloseTo(21, 9);
  });

  it('1×1×3 mit Stapelrand misst 25,4 mm hoch (Beispiel aus der Spezifikation)', () => {
    const r = buildBin(spec({ unitsZ: 3, lip: true }));
    expect(r.stats.size[2]).toBeCloseTo(25.4, 9);
    expect(r.stats.bodyHeight).toBeCloseTo(21, 9);
  });

  it('2×2×2 misst 83,5 × 83,5 × 14 mm (Beispiel aus der Spezifikation)', () => {
    const r = buildBin(spec({ unitsX: 2, unitsY: 2, unitsZ: 2 }));
    expect(r.stats.size).toEqual([83.5, 83.5, 14]);
  });

  it('setzt die Bohrungsmitte 13 mm von der Feldmitte (4,8 mm von der Fußkante)', () => {
    const padBottom = GF.GRID - GF.CLEARANCE - 2 * GF.BASE_INSET;
    expect(padBottom).toBeCloseTo(35.6, 9);
    expect(padBottom / 2 - GF.HOLE_INSET).toBeCloseTo(13, 9);
    // Die Magnetbohrung muss vollständig im Fuß liegen
    expect(13 + GF.MAGNET_D / 2).toBeLessThan(padBottom / 2);
  });
});

describe('Netzqualität', () => {
  it('erzeugt ein geschlossenes Netz mit nach außen zeigenden Normalen', () => {
    const r = analyze(spec());
    expect(r.watertight, `offene Kanten: ${r.openEdges}`).toBe(true);
    expect(r.inverted).toBe(false);
    expect(r.degenerate).toBe(0);
  });

  it('bleibt geschlossen mit Stapelrand, Fächern und Bohrungen', () => {
    const varianten: Partial<BinSpec>[] = [
      { lip: true },
      { compartmentsX: 3 },
      { compartmentsY: 2 },
      { compartmentsX: 2, compartmentsY: 2 },
      { holes: 'magnet' },
      { holes: 'magnet-schraube' },
      { unitsX: 2, unitsY: 3, holes: 'magnet' },
      { lip: true, compartmentsX: 3, compartmentsY: 2, holes: 'magnet-schraube', unitsX: 2, unitsY: 2, unitsZ: 6 },
    ];
    for (const v of varianten) {
      const r = analyze(spec(v));
      expect(r.watertight, `${JSON.stringify(v)} → ${r.openEdges} offene Kanten`).toBe(true);
      expect(r.inverted, JSON.stringify(v)).toBe(false);
      expect(r.degenerate, JSON.stringify(v)).toBe(0);
    }
  });

  it('bleibt bei jeder Auflösungsstufe geschlossen', () => {
    // 8 = Vorschau, 16 = Download-Auflösung
    for (const segments of [2, 4, 8, 12, 16, 24]) {
      const r = analyze(spec({ segments, holes: 'magnet' }));
      expect(r.watertight, `segments=${segments} → ${r.openEdges} offene Kanten`).toBe(true);
    }
  });

  it('liefert exakt die erwarteten Außenmaße im Netz', () => {
    const r = analyze(spec({ unitsX: 2, unitsY: 1, unitsZ: 2, lip: true }));
    expect(r.size[0]).toBeCloseTo(83.5, 3);
    expect(r.size[1]).toBeCloseTo(41.5, 3);
    expect(r.size[2]).toBeCloseTo(18.4, 3); // 14 + 4,4 Stapelrand
    expect(r.min[2]).toBeCloseTo(0, 6);
  });
});

describe('Volumen & Fassungsvermögen', () => {
  it('Bohrungen verringern das Materialvolumen', () => {
    const ohne = buildBin(spec()).stats.volumeCm3;
    const magnet = buildBin(spec({ holes: 'magnet' })).stats.volumeCm3;
    const beides = buildBin(spec({ holes: 'magnet-schraube' })).stats.volumeCm3;
    expect(magnet).toBeLessThan(ohne);
    expect(beides).toBeLessThan(magnet);
    // vier Magnettaschen à Ø6,5 × 2 mm ≈ 0,265 cm³
    const erwartet = (4 * Math.PI * (GF.MAGNET_D / 2) ** 2 * GF.MAGNET_DEPTH) / 1000;
    expect(ohne - magnet).toBeCloseTo(erwartet, 1);
  });

  it('dickere Wände brauchen mehr Material', () => {
    expect(buildBin(spec({ wall: 2.4 })).stats.volumeCm3).toBeGreaterThan(
      buildBin(spec({ wall: 0.8 })).stats.volumeCm3,
    );
  });

  it('mehr Fächer kosten Material und Fassungsvermögen', () => {
    const eins = buildBin(spec({ unitsX: 3 }));
    const drei = buildBin(spec({ unitsX: 3, compartmentsX: 3 }));
    expect(drei.stats.volumeCm3).toBeGreaterThan(eins.stats.volumeCm3);
    expect(drei.stats.capacityMl).toBeLessThan(eins.stats.capacityMl);
  });

  it('rechnet das Fassungsvermögen aus den Fachmaßen', () => {
    const r = buildBin(spec({ unitsX: 2, compartmentsX: 2 }));
    const [w, d, h] = r.stats.compartment;
    expect(r.stats.capacityMl).toBeCloseTo((w * d * h * 2) / 1000, 6);
    expect(h).toBeCloseTo(21 - GF.BASE_HEIGHT - 1.2, 6);
  });

  it('Materialvolumen bleibt deutlich unter dem Quadervolumen', () => {
    const r = buildBin(spec({ unitsZ: 6 }));
    const quader = (r.stats.size[0] * r.stats.size[1] * r.stats.size[2]) / 1000;
    expect(r.stats.volumeCm3).toBeGreaterThan(0);
    expect(r.stats.volumeCm3).toBeLessThan(quader * 0.5);
  });
});

describe('Eingabegrenzen', () => {
  it('fängt unsinnige Werte ab, statt kaputte Netze zu liefern', () => {
    const r = buildBin(spec({ wall: 99, floor: 99, compartmentsX: 99, unitsZ: 1 }));
    expect(r.stats.warnings.length).toBeGreaterThan(0);
    const a = analyzeStl(toStl(r.triangles));
    expect(a.watertight).toBe(true);
  });

  it('rundet Einheiten und begrenzt die Auflösung', () => {
    const r = buildBin(spec({ unitsX: 2.7, segments: 500 }));
    expect(r.stats.size[0]).toBeCloseTo(3 * 42 - 0.5, 9);
    expect(r.stats.triangles).toBeLessThan(200000);
  });

  it('warnt bei zu schmalen Fächern', () => {
    const r = buildBin(spec({ compartmentsX: 12 }));
    expect(r.stats.warnings.some((w) => w.includes('3 mm'))).toBe(true);
  });

  it('ist deterministisch', () => {
    const a = buildBin(spec({ holes: 'magnet', lip: true }));
    const b = buildBin(spec({ holes: 'magnet', lip: true }));
    expect(a.stats).toEqual(b.stats);
    expect(Array.from(a.triangles)).toEqual(Array.from(b.triangles));
  });
});

describe('roundedRect', () => {
  it('trifft die Außenmaße und enthält die Seitenmittelpunkte', () => {
    const loop = roundedRect(0, 0, 41.5, 41.5, 3.75, 4);
    const xs = loop.map((p) => p.x);
    const ys = loop.map((p) => p.y);
    expect(Math.max(...xs)).toBeCloseTo(20.75, 9);
    expect(Math.min(...ys)).toBeCloseTo(-20.75, 9);
    // Seitenmittelpunkte sind nötig, damit die Fußunterseite ohne T-Stöße anschließt
    expect(loop.some((p) => Math.abs(p.x - 20.75) < 1e-9 && Math.abs(p.y) < 1e-9)).toBe(true);
    expect(loop.some((p) => Math.abs(p.y - 20.75) < 1e-9 && Math.abs(p.x) < 1e-9)).toBe(true);
  });
});

describe('STL & Vorschau', () => {
  it('schreibt ein gültiges binäres STL', () => {
    const r = buildBin(spec());
    const buf = toStl(r.triangles);
    expect(buf.byteLength).toBe(84 + r.stats.triangles * 50);
    expect(new DataView(buf).getUint32(80, true)).toBe(r.stats.triangles);
    expect(analyzeStl(buf).triangles).toBe(r.stats.triangles);
  });

  it('zeichnet eine Vorschau mit Füßen und Fächern', () => {
    const svg = previewSvg(spec({ unitsX: 2, compartmentsX: 2, lip: true }));
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox');
    // 2 Füße + Korpus + Oberkante + Hohlraum + 2 Fachböden + 1 Trennwand
    expect((svg.match(/<polygon/g) ?? []).length).toBeGreaterThanOrEqual(7);
  });

  it('begrenzt das Bin-Innere auf die Öffnung', () => {
    // Ohne diese Begrenzung ragen die tiefer liegenden Fachböden über die Vorderwand hinaus
    const svg = previewSvg(spec({ compartmentsX: 2 }));
    expect(svg).toContain('<clipPath id="gf-opening"');
    expect(svg).toContain('clip-path="url(#gf-opening)"');
    expect(svg.indexOf('<clipPath')).toBeLessThan(svg.indexOf('clip-path="url('));
    // Die Gruppe wird auch wieder geschlossen
    expect((svg.match(/<g /g) ?? []).length).toBe((svg.match(/<\/g>/g) ?? []).length);
  });

  it('liefert für jede Konfiguration eine gültige, vollständige Vorschau', () => {
    const varianten: Partial<BinSpec>[] = [
      {},
      { lip: false },
      { compartmentsX: 3, compartmentsY: 2 },
      { unitsX: 5, unitsY: 4, unitsZ: 2 },
      { unitsZ: 12 },
      { wall: 4, floor: 6 },
    ];
    let letzteAnzahl = 0;
    for (const v of varianten) {
      const svg = previewSvg(spec(v));
      const vb = svg.match(/viewBox="([^"]+)"/)?.[1].split(' ').map(Number) ?? [];
      expect(vb, JSON.stringify(v)).toHaveLength(4);
      expect(vb.every(Number.isFinite), JSON.stringify(v)).toBe(true);
      expect(vb[2], JSON.stringify(v)).toBeGreaterThan(0);
      expect(vb[3], JSON.stringify(v)).toBeGreaterThan(0);
      expect(svg).not.toContain('NaN');
      letzteAnzahl = (svg.match(/<polygon/g) ?? []).length;
      expect(letzteAnzahl).toBeGreaterThan(3);
    }
    // Mehr Fächer ergeben mehr Flächen in der Vorschau
    const wenig = (previewSvg(spec({ compartmentsX: 1 })).match(/<polygon/g) ?? []).length;
    const viel = (previewSvg(spec({ compartmentsX: 4 })).match(/<polygon/g) ?? []).length;
    expect(viel).toBeGreaterThan(wenig);
  });
});

/* ---------------- Grundplatte ---------------- */

import { buildBaseplate, baseplatePreviewSvg, roundedRectCorners, PLATE, SOCKET_RELIEF, PLATE_JOIN, type BaseplateSpec } from '../src/lib/gridfinity';

const plate = (over: Partial<BaseplateSpec> = {}): BaseplateSpec => ({
  unitsX: 2,
  unitsY: 2,
  floor: 0,
  segments: 6,
  ...over,
});

/** Halbe Breite des Bin-Fusses in Hoehe z ueber seiner Unterkante. */
function binHalf(z: number): number {
  const inset = z <= 0.8 ? 2.95 - z : z <= 2.6 ? 2.15 : Math.max(0, 2.15 - (z - 2.6));
  return (GF.GRID - GF.CLEARANCE) / 2 - inset;
}
/** Halbe Breite der Fassung in Hoehe dz ueber ihrem Grund (inkl. Ruecknahme). */
function socketHalf(dz: number): number {
  const inset =
    (dz <= 0.7 ? 2.85 - dz : dz <= 2.5 ? 2.15 : Math.max(0, 2.15 - (dz - 2.5))) + SOCKET_RELIEF;
  return GF.GRID / 2 - inset;
}

describe('Grundplatte – Spezifikationsmaße', () => {
  it('hält Profilhöhe, Versatz und Eckradius ein', () => {
    expect(PLATE.HEIGHT).toBe(4.65);
    expect(0.7 + 1.8 + 2.15).toBeCloseTo(PLATE.HEIGHT, 9);
    expect(0.7 + 2.15).toBeCloseTo(PLATE.INSET, 9);
    expect(PLATE.CORNER_R).toBe(4);
    // Der Eckradius des Bins liegt genau 0,25 mm darunter
    expect(PLATE.CORNER_R - GF.CORNER_R).toBeCloseTo(0.25, 9);
  });

  it('misst Rasterfelder × 42 mm ohne Abzug', () => {
    const r = buildBaseplate(plate({ unitsX: 3, unitsY: 2 }));
    expect(r.stats.size).toEqual([126, 84, 4.65]);
    expect(r.stats.cells).toBe(6);
  });

  it('rechnet den Boden auf die Höhe auf', () => {
    expect(buildBaseplate(plate({ floor: 1.2 })).stats.size[2]).toBeCloseTo(4.65 + 1.2, 9);
  });
});

describe('Grundplatte – nimmt die erzeugten Bins auf', () => {
  it('lässt über die gesamte Profilhöhe gleichmäßig Luft je Seite', () => {
    // Oberkanten aneinander ausgerichtet: Bin-Fuss 4,75 mm, Fassung 4,65 mm tief.
    // Nennspiel 0,25 mm abzueglich der Ruecknahme, die den Steg oben rettet.
    const soll = 0.25 - SOCKET_RELIEF;
    for (let d = 0; d <= 4.65 + 1e-9; d += 0.05) {
      const luft = socketHalf(4.65 - d) - binHalf(4.75 - d);
      expect(luft, `Tiefe ${d.toFixed(2)} mm`).toBeCloseTo(soll, 6);
    }
    expect(soll).toBeGreaterThan(0.15); // fuer FDM reichlich
  });

  it('die Fassung ist an jeder Stelle weiter als der Bin-Fuß', () => {
    for (let d = 0; d <= 4.65; d += 0.01) {
      expect(socketHalf(4.65 - d)).toBeGreaterThan(binHalf(4.75 - d));
    }
  });

  it('Fassungsöffnung oben ist weiter als der breiteste Punkt des Bins', () => {
    expect(binHalf(4.75) * 2).toBeCloseTo(GF.GRID - GF.CLEARANCE, 9); // 41,5 mm
    expect(socketHalf(4.65) * 2).toBeCloseTo(GF.GRID - 2 * SOCKET_RELIEF, 9); // 41,9 mm
    expect(socketHalf(4.65) * 2).toBeGreaterThan(binHalf(4.75) * 2);
    // Oben bleibt ein Steg stehen, statt einer nicht druckbaren Schneide
    expect(GF.GRID - socketHalf(4.65) * 2).toBeCloseTo(2 * SOCKET_RELIEF, 9);
  });
});

describe('Grundplatte – Netzqualität', () => {
  const analyzePlate = (s: BaseplateSpec) => analyzeStl(toStl(buildBaseplate(s).triangles));

  it('erzeugt ein geschlossenes Netz mit nach außen zeigenden Normalen', () => {
    const r = analyzePlate(plate());
    expect(r.watertight, `offene Kanten: ${r.openEdges}`).toBe(true);
    expect(r.inverted).toBe(false);
    expect(r.degenerate).toBe(0);
  });

  it('bleibt in allen Größen und mit Boden geschlossen', () => {
    const varianten: Partial<BaseplateSpec>[] = [
      { unitsX: 1, unitsY: 1 },
      { unitsX: 4, unitsY: 1 },
      { unitsX: 3, unitsY: 3 },
      { floor: 1.2 },
      { unitsX: 2, unitsY: 3, floor: 2.4 },
    ];
    for (const v of varianten) {
      const r = analyzePlate(plate(v));
      expect(r.watertight, `${JSON.stringify(v)} → ${r.openEdges} offene Kanten`).toBe(true);
      expect(r.inverted, JSON.stringify(v)).toBe(false);
      expect(r.degenerate, JSON.stringify(v)).toBe(0);
    }
  });

  it('bleibt bei jeder Auflösungsstufe geschlossen', () => {
    for (const segments of [2, 4, 8, 16]) {
      const r = analyzePlate(plate({ segments }));
      expect(r.watertight, `segments=${segments} → ${r.openEdges} offene Kanten`).toBe(true);
    }
  });

  it('liefert die erwarteten Außenmaße im Netz', () => {
    const r = analyzePlate(plate({ unitsX: 3, unitsY: 2 }));
    expect(r.size[0]).toBeCloseTo(126, 3);
    expect(r.size[1]).toBeCloseTo(84, 3);
    expect(r.size[2]).toBeCloseTo(4.65, 3);
  });

  it('hält die Außenmaße trotz Feld-Überlappung exakt ein', () => {
    // Die Rahmen greifen nur nach innen ineinander, nicht ueber den Plattenrand hinaus
    const eins = analyzePlate(plate({ unitsX: 1, unitsY: 1 }));
    const vier = analyzePlate(plate({ unitsX: 4, unitsY: 4 }));
    expect(eins.size[0]).toBeCloseTo(42, 3);
    expect(vier.size[0]).toBeCloseTo(168, 3);
  });
});

describe('Grundplatte – Material & Grenzen', () => {
  it('ist überwiegend Hohlraum, nicht Vollmaterial', () => {
    const r = buildBaseplate(plate());
    const quader = (r.stats.size[0] * r.stats.size[1] * r.stats.size[2]) / 1000;
    expect(r.stats.volumeCm3).toBeGreaterThan(quader * 0.05);
    expect(r.stats.volumeCm3).toBeLessThan(quader * 0.6);
  });

  it('ein Boden erhöht das Materialvolumen', () => {
    expect(buildBaseplate(plate({ floor: 2 })).stats.volumeCm3).toBeGreaterThan(
      buildBaseplate(plate({ floor: 0 })).stats.volumeCm3,
    );
  });

  it('mehr Felder brauchen mehr Material', () => {
    expect(buildBaseplate(plate({ unitsX: 4, unitsY: 4 })).stats.volumeCm3).toBeGreaterThan(
      buildBaseplate(plate({ unitsX: 2, unitsY: 2 })).stats.volumeCm3,
    );
  });

  it('warnt bei sehr großen Platten und zu dünnem Boden', () => {
    expect(buildBaseplate(plate({ unitsX: 8, unitsY: 8 })).stats.warnings.length).toBeGreaterThan(0);
    expect(buildBaseplate(plate({ floor: 0.4 })).stats.warnings.some((w) => w.includes('dünn'))).toBe(true);
  });

  it('ist deterministisch', () => {
    expect(buildBaseplate(plate()).stats).toEqual(buildBaseplate(plate()).stats);
  });
});

describe('roundedRectCorners', () => {
  it('Rahmen-Überlappung und Fassungs-Rücknahme müssen sich unterscheiden', () => {
    // Waeren beide gleich, faenden die Seitenmittelpunkte benachbarter Felder
    // exakt aufeinander und die gemeinsamen Kanten waeren doppelt belegt.
    expect(PLATE_JOIN).not.toBeCloseTo(SOCKET_RELIEF, 9);
    expect(PLATE_JOIN).toBeGreaterThan(0);
    expect(SOCKET_RELIEF).toBeGreaterThan(0);
  });

  it('rundet nur die angegebenen Ecken', () => {
    const loop = roundedRectCorners(0, 0, 100, 100, [10, 0, 0, 0], 4);
    // Die drei scharfen Ecken liegen exakt auf den Eckpunkten
    expect(loop.some((p) => Math.abs(p.x + 50) < 1e-9 && Math.abs(p.y - 50) < 1e-9)).toBe(true);
    expect(loop.some((p) => Math.abs(p.x + 50) < 1e-9 && Math.abs(p.y + 50) < 1e-9)).toBe(true);
    // Die gerundete Ecke dagegen nicht
    expect(loop.some((p) => Math.abs(p.x - 50) < 1e-9 && Math.abs(p.y - 50) < 1e-9)).toBe(false);
    expect(Math.max(...loop.map((p) => p.x))).toBeCloseTo(50, 9);
  });

  it('verhält sich mit gleichen Radien wie roundedRect', () => {
    expect(roundedRectCorners(1, 2, 40, 30, [3, 3, 3, 3], 5)).toEqual(roundedRect(1, 2, 40, 30, 3, 5));
  });
});

describe('Grundplatte – Vorschau', () => {
  it('zeichnet Platte, Fassungen und Böden', () => {
    const svg = baseplatePreviewSvg(plate({ unitsX: 2, unitsY: 2 }));
    expect(svg).toContain('<svg');
    // Korpus + Oberseite + je Feld Fassung und Boden
    expect((svg.match(/<polygon/g) ?? []).length).toBe(2 + 2 * 4);
    expect(svg).not.toContain('NaN');
  });

  it('liefert für jede Größe eine gültige Vorschau', () => {
    for (const v of [{ unitsX: 1, unitsY: 1 }, { unitsX: 5, unitsY: 3 }, { floor: 2 }]) {
      const svg = baseplatePreviewSvg(plate(v));
      const vb = svg.match(/viewBox="([^"]+)"/)?.[1].split(' ').map(Number) ?? [];
      expect(vb).toHaveLength(4);
      expect(vb.every(Number.isFinite)).toBe(true);
      expect(vb[2]).toBeGreaterThan(0);
    }
  });
});
