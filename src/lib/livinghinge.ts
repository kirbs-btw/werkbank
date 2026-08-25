/**
 * Living-Hinge-Generator (Biegescharnier aus versetzten Laserschnitten).
 * Pure Funktionen ohne DOM – server- und clientseitig identisch, getestet.
 *
 * Prinzip: Quer zur Biegerichtung liegen Reihen paralleler Schlitze. Zwischen den
 * Schlitzen bleiben schmale Stege stehen; benachbarte Reihen sind um eine halbe
 * Teilung versetzt, sodass die Stege auf Lücke sitzen. Beim Biegen verdrehen sich
 * diese Stege – je mehr Reihen, desto kleiner der Winkel je Reihe und desto
 * schonender die Biegung.
 *
 * Die Breite des Scharnierbereichs folgt der Bogenlänge der neutralen Faser:
 *   b = (R + t/2) · θ         mit θ im Bogenmaß
 * Die Ausgabe nutzt das Entity-Modell aus `dxfsvg.ts`, damit die dort getesteten
 * SVG- und DXF-Exporte direkt verwendet werden können.
 */

import type { Entity, Drawing } from './dxfsvg';
import { boundsOf } from './dxfsvg';

export interface HingeSpec {
  /** Plattenbreite in Biegerichtung (mm). */
  panelWidth: number;
  /** Plattenhöhe längs der Biegeachse (mm). */
  panelHeight: number;
  /** Biegewinkel in Grad. */
  angle: number;
  /** Innerer Biegeradius in mm. */
  radius: number;
  /** Materialstärke in mm. */
  thickness: number;
  /** Länge eines Schlitzes in mm. */
  slitLength: number;
  /** Steg zwischen zwei Schlitzen derselben Reihe in mm. */
  gap: number;
  /** Angestrebter Abstand der Reihen in mm. */
  rowSpacing: number;
  /** Unbeschnittener Rand oben und unten in mm. */
  margin: number;
  /** Plattenumriss mitzeichnen. */
  outline: boolean;
}

export interface HingeStats {
  /** Breite des Scharnierbereichs (Bogenlänge der neutralen Faser) in mm. */
  bandWidth: number;
  rows: number;
  /** Tatsächlicher Reihenabstand nach gleichmäßiger Verteilung in mm. */
  actualSpacing: number;
  slits: number;
  /** Gesamte Schnittlänge in mm (ohne Umriss). */
  cutLength: number;
  /** Biegewinkel je Reihe in Grad. */
  anglePerRow: number;
  /** Öffnung eines Schlitzes an der Außenseite in mm. */
  openingPerRow: number;
  warnings: string[];
}

export interface HingeResult {
  drawing: Drawing;
  stats: HingeStats;
}

/**
 * Ab hier wird die Verdrehung je Steg sportlich. Ein harter Grenzwert existiert nicht –
 * er hängt von Material, Dicke, Schlitzlänge und Stegbreite ab. Übliche Auslegungen für
 * 3-mm-Sperrholz liegen bei etwa 5 bis 10° je Reihe; darüber steigt das Ausreißrisiko
 * spürbar und die Schlitze klaffen außen sichtbar auf.
 */
export const MAX_ANGLE_PER_ROW = 10;
/** Schlitzreste unterhalb dieser Länge werden verworfen. */
const MIN_SLIT = 1;

const DEG = Math.PI / 180;

export function buildHinge(spec: HingeSpec): HingeResult {
  const warnings: string[] = [];
  const t = Math.max(0.1, spec.thickness);
  const angle = Math.max(1, Math.min(spec.angle, 360));
  const radius = Math.max(0, spec.radius);
  const H = Math.max(1, spec.panelHeight);
  const W = Math.max(1, spec.panelWidth);
  const L = Math.max(1, spec.slitLength);
  const gap = Math.max(0.2, spec.gap);
  const margin = Math.max(0, Math.min(spec.margin, H / 2 - 0.5));

  // Bogenlänge der neutralen Faser
  const bandWidth = (radius + t / 2) * angle * DEG;
  const spacing = Math.max(0.5, spec.rowSpacing);
  const rows = Math.max(2, Math.round(bandWidth / spacing));
  const actualSpacing = bandWidth / rows;

  const entities: Entity[] = [];
  if (spec.outline) {
    entities.push({
      kind: 'polyline',
      layer: 'Umriss',
      points: [
        { x: 0, y: 0 },
        { x: W, y: 0 },
        { x: W, y: H },
        { x: 0, y: H },
      ],
      closed: true,
    });
  }

  const bandStart = (W - bandWidth) / 2;
  const period = L + gap;
  const yMin = margin;
  const yMax = H - margin;
  let cutLength = 0;
  let slits = 0;

  for (let i = 0; i < rows; i++) {
    // Reihen mittig in ihrem Streifen, damit vorne und hinten je eine halbe Teilung bleibt
    const x = bandStart + (i + 0.5) * actualSpacing;
    const offset = (i % 2) * (period / 2);
    const kStart = Math.floor((yMin - offset - margin - L) / period) - 1;
    const kEnd = Math.ceil((yMax - offset - margin) / period) + 1;
    for (let k = kStart; k <= kEnd; k++) {
      const rawStart = margin + offset + k * period;
      const y0 = Math.max(rawStart, yMin);
      const y1 = Math.min(rawStart + L, yMax);
      if (y1 - y0 < MIN_SLIT) continue;
      entities.push({
        kind: 'polyline',
        layer: 'Scharnier',
        points: [
          { x, y: y0 },
          { x, y: y1 },
        ],
        closed: false,
      });
      cutLength += y1 - y0;
      slits++;
    }
  }

  const anglePerRow = angle / rows;
  // Beim Biegen öffnet sich jeder Schnitt an der Außenseite um die Materialstärke × Winkel
  const openingPerRow = t * anglePerRow * DEG;

  if (bandWidth > W) {
    warnings.push(
      `Der Scharnierbereich ist mit ${bandWidth.toFixed(1)} mm breiter als die Platte – Platte verbreitern oder Radius bzw. Winkel verringern.`,
    );
  }
  if (anglePerRow > MAX_ANGLE_PER_ROW) {
    warnings.push(
      `${anglePerRow.toFixed(1)}° je Reihe: Jeder Steg muss sich dafür kräftig verdrehen und die Schlitze klaffen außen rund ${openingPerRow.toFixed(1)} mm auf. Übliche Auslegungen bleiben unter ${MAX_ANGLE_PER_ROW}° – dafür den Reihenabstand verkleinern, damit mehr Reihen entstehen.`,
    );
  }
  if (gap < t / 2) {
    warnings.push('Die Stege sind schmaler als die halbe Materialstärke – sie brechen beim Biegen leicht aus.');
  }
  if (actualSpacing < 1.5) {
    warnings.push('Der Reihenabstand liegt unter 1,5 mm – bei Holz verbrennt der Steg zwischen den Reihen leicht.');
  }
  if (yMax - yMin < L) {
    warnings.push('Die Schlitzlänge übersteigt die nutzbare Plattenhöhe – Schlitze werden beschnitten.');
  }
  if (slits === 0) {
    warnings.push('Mit diesen Werten entsteht kein Schlitz – Randabstand oder Schlitzlänge prüfen.');
  }

  return {
    drawing: { entities, bounds: boundsOf(entities), skipped: {} },
    stats: {
      bandWidth,
      rows,
      actualSpacing,
      slits,
      cutLength,
      anglePerRow,
      openingPerRow,
      warnings,
    },
  };
}

/**
 * Vorschau des gebogenen Zustands als Seitenansicht: der Scharnierbereich als
 * Bogen, davor und dahinter die geraden Plattenabschnitte.
 */
export function bendPreviewSvg(spec: HingeSpec, stats: HingeStats): string {
  const t = Math.max(0.1, spec.thickness);
  const angle = Math.max(1, Math.min(spec.angle, 360)) * DEG;
  const r = Math.max(0, spec.radius);
  const flat = Math.max(0, (Math.max(1, spec.panelWidth) - stats.bandWidth) / 2);
  const seg = Math.max(8, Math.ceil((angle * 180) / Math.PI / 5));

  const inner: { x: number; y: number }[] = [];
  const outer: { x: number; y: number }[] = [];
  // Gerader Schenkel vor dem Bogen
  inner.push({ x: -flat, y: 0 });
  outer.push({ x: -flat, y: -t });
  for (let i = 0; i <= seg; i++) {
    const a = (angle * i) / seg;
    inner.push({ x: r * Math.sin(a), y: r * (1 - Math.cos(a)) });
    outer.push({ x: (r + t) * Math.sin(a), y: r - (r + t) * Math.cos(a) });
  }
  // Gerader Schenkel nach dem Bogen, tangential weiterlaufend
  const tx = Math.cos(angle);
  const ty = Math.sin(angle);
  const iEnd = inner[inner.length - 1];
  const oEnd = outer[outer.length - 1];
  inner.push({ x: iEnd.x + tx * flat, y: iEnd.y + ty * flat });
  outer.push({ x: oEnd.x + tx * flat, y: oEnd.y + ty * flat });

  const pts = [...inner, ...outer.slice().reverse()];
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const pad = Math.max(t * 2, 4);
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const d = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${(maxX - minX).toFixed(1)} ${(maxY - minY).toFixed(1)}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Seitenansicht der gebogenen Platte"><polygon points="${d}" fill="#ffedd5" stroke="#c2410c" stroke-width="0.6" vector-effect="non-scaling-stroke"/></svg>`;
}
