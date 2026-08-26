/**
 * Trianguliert ein Polygon **mit Löchern** – ohne Brücken.
 *
 * Der bisherige Weg fädelte jedes Loch über eine nullbreite Brücke an die
 * Außenkontur und ließ dann Ohren schneiden. Das geht gut, solange die Brücke
 * aus zwei getrennten Kanten besteht. Sobald das Ohr am Brückenpunkt
 * geschnitten wird, verschmelzen die beiden zu einer Berührung in einem
 * einzigen Punkt – und auf so einem Ring ist Ohrenschneiden nicht mehr
 * zuverlässig: Es findet „konvexe Ohren", die gar kein Material sind.
 *
 * Hier wird stattdessen von oben nach unten über das Polygon gestrichen und an
 * den kritischen Ecken eine Diagonale eingezogen, bis nur noch y-monotone
 * Teilstücke übrig sind; die lassen sich einzeln problemlos zerlegen. Löcher
 * brauchen dabei keine Sonderbehandlung – sie sind einfach weitere Ringe im
 * Kantensatz, gegenläufig orientiert.
 *
 * Entscheidend für den Einsatz als Deckfläche: **Es entstehen keine neuen
 * Punkte.** Eingezogen werden nur Diagonalen zwischen vorhandenen Ecken, und
 * die kommen in der fertigen Zerlegung genau zweimal vor, heben sich in der
 * Kantenbilanz also auf. Jede ursprüngliche Randkante bleibt genau einmal
 * übrig – nur so passt die Deckfläche später kantengenau auf die beschnittenen
 * Seitenwände.
 */

export interface Pt {
  x: number;
  y: number;
}

/** Fläche mit Vorzeichen; positiv heißt gegen den Uhrzeigersinn. */
export function ringArea(ring: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

/** Sweep-Reihenfolge: weiter oben zuerst, bei gleicher Höhe weiter links. */
function hoeher(a: Pt, b: Pt): boolean {
  return a.y > b.y || (a.y === b.y && a.x < b.x);
}

type Art = 'start' | 'ende' | 'teilung' | 'zusammen' | 'regulaer';

/**
 * Trianguliert Außenkontur plus Löcher.
 *
 * Zurück kommen die Punkte in einer gemeinsamen Liste (erst außen, dann die
 * Löcher der Reihe nach) und die Dreiecke als Indizes darauf. Die Punkte sind
 * dieselben Objekte wie in der Eingabe, nur umsortiert – wer die Zuordnung zu
 * eigenen Daten braucht, findet sie über die Position in dieser Liste.
 */
export function triangulateWithHoles(
  outer: readonly Pt[],
  holes: readonly (readonly Pt[])[] = [],
): { points: Pt[]; triangles: [number, number, number][] } {
  const ringe: Pt[][] = [];
  const aussen = outer.slice();
  if (ringArea(aussen) < 0) aussen.reverse(); // außen gegen den Uhrzeigersinn
  ringe.push(aussen);
  for (const h of holes) {
    const loch = h.slice();
    if (ringArea(loch) > 0) loch.reverse(); // Löcher im Uhrzeigersinn
    if (loch.length >= 3) ringe.push(loch);
  }

  const points: Pt[] = [];
  const next: number[] = [];
  const prev: number[] = [];
  for (const ring of ringe) {
    const start = points.length;
    for (let i = 0; i < ring.length; i++) {
      points.push(ring[i]);
      next.push(start + ((i + 1) % ring.length));
      prev.push(start + ((i - 1 + ring.length) % ring.length));
    }
  }
  const n = points.length;
  if (n < 3) return { points, triangles: [] };

  /* --- 1. Ecken einordnen --- */
  const art: Art[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const v = points[i];
    const u = points[prev[i]];
    const w = points[next[i]];
    const kreuz = (v.x - u.x) * (w.y - v.y) - (v.y - u.y) * (w.x - v.x);
    const beideUnten = hoeher(v, u) && hoeher(v, w);
    const beideOben = hoeher(u, v) && hoeher(w, v);
    if (beideUnten) art[i] = kreuz > 0 ? 'start' : 'teilung';
    else if (beideOben) art[i] = kreuz > 0 ? 'ende' : 'zusammen';
    else art[i] = 'regulaer';
  }

  /* --- 2. Sweep von oben nach unten, Diagonalen sammeln --- */
  const diagonalen: [number, number][] = [];
  /** Kanten, die die Sweep-Linie gerade schneiden – Kante i geht von i nach next[i]. */
  const status: { kante: number; helfer: number }[] = [];

  const xBei = (kante: number, y: number): number => {
    const a = points[kante];
    const b = points[next[kante]];
    if (a.y === b.y) return Math.min(a.x, b.x);
    return a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x);
  };
  const einfuegen = (kante: number, helfer: number): void => {
    status.push({ kante, helfer });
  };
  const entfernen = (kante: number): void => {
    const i = status.findIndex((e) => e.kante === kante);
    if (i >= 0) status.splice(i, 1);
  };
  const finden = (kante: number) => status.find((e) => e.kante === kante);
  /** Die Statuskante unmittelbar links von v. */
  const linksVon = (v: number) => {
    let beste: { kante: number; helfer: number } | undefined;
    let besteX = -Infinity;
    for (const e of status) {
      const x = xBei(e.kante, points[v].y);
      if (x <= points[v].x + 1e-12 && x > besteX) {
        besteX = x;
        beste = e;
      }
    }
    return beste;
  };

  const reihenfolge = points.map((_, i) => i).sort((a, b) => (hoeher(points[a], points[b]) ? -1 : 1));

  for (const v of reihenfolge) {
    const e = prev[v]; // die Kante, die in v endet
    switch (art[v]) {
      case 'start':
        einfuegen(v, v);
        break;
      case 'ende': {
        const s = finden(e);
        if (s && art[s.helfer] === 'zusammen') diagonalen.push([v, s.helfer]);
        entfernen(e);
        break;
      }
      case 'teilung': {
        const l = linksVon(v);
        if (l) {
          diagonalen.push([v, l.helfer]);
          l.helfer = v;
        }
        einfuegen(v, v);
        break;
      }
      case 'zusammen': {
        const s = finden(e);
        if (s && art[s.helfer] === 'zusammen') diagonalen.push([v, s.helfer]);
        entfernen(e);
        const l = linksVon(v);
        if (l) {
          if (art[l.helfer] === 'zusammen') diagonalen.push([v, l.helfer]);
          l.helfer = v;
        }
        break;
      }
      default: {
        // Liegt das Innere rechts von v? Dann läuft der Rand hier abwärts.
        const innenRechts = hoeher(points[prev[v]], points[v]) && hoeher(points[v], points[next[v]]);
        if (innenRechts) {
          const s = finden(e);
          if (s && art[s.helfer] === 'zusammen') diagonalen.push([v, s.helfer]);
          entfernen(e);
          einfuegen(v, v);
        } else {
          const l = linksVon(v);
          if (l) {
            if (art[l.helfer] === 'zusammen') diagonalen.push([v, l.helfer]);
            l.helfer = v;
          }
        }
      }
    }
  }

  /* --- 3. Aus Rand- und Diagonalkanten die Teilstücke ablaufen --- */
  const nachbarn: number[][] = Array.from({ length: n }, () => []);
  const kanten = new Set<string>();
  const addKante = (a: number, b: number): void => {
    if (a === b) return;
    const id = `${a}|${b}`;
    if (kanten.has(id)) return;
    kanten.add(id);
    nachbarn[a].push(b);
  };
  // Beide Richtungen: Zum Ablaufen der Flächen braucht jede Kante ihre zwei
  // Halbkanten – die eine begrenzt das Innere, die andere die Außenfläche. Die
  // Außenfläche fällt später über ihr Vorzeichen heraus.
  for (let i = 0; i < n; i++) {
    addKante(i, next[i]);
    addKante(next[i], i);
  }
  for (const [a, b] of diagonalen) {
    addKante(a, b);
    addKante(b, a);
  }

  const winkel = (a: number, b: number) => Math.atan2(points[b].y - points[a].y, points[b].x - points[a].x);
  for (let i = 0; i < n; i++) nachbarn[i].sort((a, b) => winkel(i, a) - winkel(i, b));

  const triangles: [number, number, number][] = [];
  const besucht = new Set<string>();
  for (let a = 0; a < n; a++) {
    for (const b of nachbarn[a]) {
      if (besucht.has(`${a}|${b}`)) continue;
      // Fläche ablaufen: an jedem Knoten die im Uhrzeigersinn nächste Kante nehmen
      const flaeche: number[] = [];
      let u = a;
      let v = b;
      for (let schutz = 0; schutz <= n * 4; schutz++) {
        besucht.add(`${u}|${v}`);
        flaeche.push(u);
        const liste = nachbarn[v];
        const pos = liste.indexOf(u);
        if (pos < 0) break;
        const w = liste[(pos - 1 + liste.length) % liste.length];
        u = v;
        v = w;
        if (u === a && v === b) break;
      }
      if (flaeche.length < 3) continue;
      const ecken = flaeche.map((i) => points[i]);
      if (ringArea(ecken) <= 0) continue; // Außenfläche oder entartet
      const teile = ohrenSchneiden(ecken);
      if (teile.length === 0) continue;
      // Der Hohlraum eines Lochs ist ebenfalls eine Fläche des Kantennetzes und
      // läuft gegen den Uhrzeigersinn – sieht also aus wie Material. Deshalb
      // wird an einem Punkt im Inneren geprüft, ob die Fläche wirklich Material
      // ist. Die Umlaufzahl über alle Ringe entscheidet das eindeutig.
      const [t0, t1, t2] = teile[0];
      const mitte = {
        x: (ecken[t0].x + ecken[t1].x + ecken[t2].x) / 3,
        y: (ecken[t0].y + ecken[t1].y + ecken[t2].y) / 3,
      };
      if (umlaufzahl(mitte, ringe) === 0) continue;
      for (const [x, y, z] of teile) {
        triangles.push([flaeche[x], flaeche[y], flaeche[z]]);
      }
    }
  }

  return { points, triangles };
}

/**
 * Umlaufzahl eines Punktes über alle Ringe. Null heißt außerhalb des Materials –
 * das trifft sowohl die Fläche außen herum als auch den Hohlraum eines Lochs.
 */
function umlaufzahl(p: Pt, ringe: readonly (readonly Pt[])[]): number {
  let w = 0;
  for (const ring of ringe) {
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i];
      const b = ring[(i + 1) % ring.length];
      if (a.y <= p.y) {
        if (b.y > p.y && (b.x - a.x) * (p.y - a.y) - (p.x - a.x) * (b.y - a.y) > 0) w++;
      } else if (b.y <= p.y && (b.x - a.x) * (p.y - a.y) - (p.x - a.x) * (b.y - a.y) < 0) {
        w--;
      }
    }
  }
  return w;
}

/** Punkt im Dreieck (Rand zählt als innen). */
function imDreieck(p: Pt, a: Pt, b: Pt, c: Pt): boolean {
  const d1 = (p.x - b.x) * (a.y - b.y) - (a.x - b.x) * (p.y - b.y);
  const d2 = (p.x - c.x) * (b.y - c.y) - (b.x - c.x) * (p.y - c.y);
  const d3 = (p.x - a.x) * (c.y - a.y) - (c.x - a.x) * (p.y - a.y);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

/**
 * Ohrenschneiden für ein **einfaches** Polygon – hier genügt es, weil die
 * Teilstücke nach dem Sweep weder Löcher noch Berührstellen haben.
 *
 * Flache Ecken bekommen ein flächenloses Dreieck, statt die Zerlegung
 * anzuhalten: Sie liegen genau auf der Verbindung ihrer Nachbarn und blockieren
 * sonst jedes Ohr, dessen Kante durch sie hindurchläuft.
 */
function ohrenSchneiden(poly: Pt[]): [number, number, number][] {
  const idx = poly.map((_, i) => i);
  if (ringArea(poly) < 0) idx.reverse();
  let spanne = 0;
  for (const p of poly) spanne = Math.max(spanne, Math.abs(p.x), Math.abs(p.y));
  const FLACH = Math.max(spanne, 1) ** 2 * 1e-12;

  const out: [number, number, number][] = [];
  let schutz = idx.length * idx.length + 16;
  while (idx.length > 3 && schutz-- > 0) {
    let geschnitten = false;
    for (let i = 0; i < idx.length; i++) {
      const ia = idx[(i + idx.length - 1) % idx.length];
      const ib = idx[i];
      const ic = idx[(i + 1) % idx.length];
      const a = poly[ia];
      const b = poly[ib];
      const c = poly[ic];
      if ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) <= 0) continue;
      let frei = true;
      for (const k of idx) {
        if (k === ia || k === ib || k === ic) continue;
        if (imDreieck(poly[k], a, b, c)) {
          frei = false;
          break;
        }
      }
      if (!frei) continue;
      out.push([ia, ib, ic]);
      idx.splice(i, 1);
      geschnitten = true;
      break;
    }
    if (geschnitten) continue;

    let flach = -1;
    for (let i = 0; i < idx.length && flach < 0; i++) {
      const a = poly[idx[(i + idx.length - 1) % idx.length]];
      const b = poly[idx[i]];
      const c = poly[idx[(i + 1) % idx.length]];
      if (Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) <= FLACH) flach = i;
    }
    if (flach < 0) break;
    out.push([
      idx[(flach + idx.length - 1) % idx.length],
      idx[flach],
      idx[(flach + 1) % idx.length],
    ]);
    idx.splice(flach, 1);
  }
  if (idx.length === 3) out.push([idx[0], idx[1], idx[2]]);
  return out;
}
