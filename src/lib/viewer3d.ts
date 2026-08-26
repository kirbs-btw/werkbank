/**
 * Schlanker 3D-Viewer für Dreiecksnetze – eigener WebGL2-Renderer ohne Bibliothek.
 *
 * Warum kein three.js: Die Seite lebt von Ladezeit, und für „Netz anzeigen, drehen,
 * zoomen" braucht es keine 600 kB. Was hier steht, sind rund 200 Zeilen Mathematik
 * plus zwei kurze Shader.
 *
 * Koordinaten wie im 3D-Druck: **Z zeigt nach oben**, die Bauplatte liegt in XY.
 * Die Rechenteile (Matrizen, Kamera, Netzgrenzen) sind pure Funktionen und damit
 * testbar; nur `createViewer` braucht DOM und WebGL.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface MeshBounds {
  min: Vec3;
  max: Vec3;
  center: Vec3;
  /** Radius der umschließenden Kugel um den Mittelpunkt. */
  radius: number;
  size: Vec3;
}

/* ---------------- Matrizen (spaltenweise, wie WebGL sie erwartet) ---------------- */

export type Mat4 = Float64Array;

export function mat4Identity(): Mat4 {
  const m = new Float64Array(16);
  m[0] = m[5] = m[10] = m[15] = 1;
  return m;
}

export function mat4Multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float64Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k];
      out[c * 4 + r] = sum;
    }
  }
  return out;
}

export function mat4Translate(x: number, y: number, z: number): Mat4 {
  const m = mat4Identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}

export function mat4Perspective(fovY: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovY / 2);
  const m = new Float64Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) / (near - far);
  m[11] = -1;
  m[14] = (2 * far * near) / (near - far);
  return m;
}

const sub = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const cross = (a: Vec3, b: Vec3): Vec3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
});
const dot = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
};

export function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
  const f = norm(sub(target, eye)); // Blickrichtung
  let s = cross(f, up);
  if (Math.hypot(s.x, s.y, s.z) < 1e-9) {
    // Blick parallel zur Up-Achse – Ersatzachse nehmen, statt NaN zu erzeugen
    s = cross(f, { x: 1, y: 0, z: 0 });
    if (Math.hypot(s.x, s.y, s.z) < 1e-9) s = cross(f, { x: 0, y: 1, z: 0 });
  }
  s = norm(s);
  const u = cross(s, f);
  const m = new Float64Array(16);
  m[0] = s.x; m[4] = s.y; m[8] = s.z;
  m[1] = u.x; m[5] = u.y; m[9] = u.z;
  m[2] = -f.x; m[6] = -f.y; m[10] = -f.z;
  m[12] = -dot(s, eye);
  m[13] = -dot(u, eye);
  m[14] = dot(f, eye);
  m[15] = 1;
  return m;
}

/* ---------------- Kamera ---------------- */

/** Höchster Neigungswinkel – knapp unter senkrecht, sonst kippt die Kamera. */
export const MAX_PITCH = (89 * Math.PI) / 180;

/** Kameraposition aus Umlauf- und Neigungswinkel (Z oben). */
export function orbitPosition(yaw: number, pitch: number, distance: number, target: Vec3): Vec3 {
  const p = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
  const d = Math.max(distance, 1e-6);
  return {
    x: target.x + d * Math.cos(p) * Math.cos(yaw),
    y: target.y + d * Math.cos(p) * Math.sin(yaw),
    z: target.z + d * Math.sin(p),
  };
}

/**
 * Abstand, bei dem eine Kugel dieses Radius vollständig ins Bild passt.
 * Bei schmalen Fenstern begrenzt die waagerechte Öffnung, nicht die senkrechte.
 */
export function fitDistance(radius: number, fovY: number, aspect: number, margin = 1.15): number {
  const fovX = 2 * Math.atan(Math.tan(fovY / 2) * Math.max(aspect, 1e-6));
  const fov = Math.min(fovY, fovX);
  return (Math.max(radius, 1e-6) / Math.sin(fov / 2)) * margin;
}

/* ---------------- Netz ---------------- */

/** Grenzen eines flachen Dreieck-Arrays (9 Werte je Dreieck). */
export function meshBounds(triangles: ArrayLike<number>): MeshBounds {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i + 2 < triangles.length; i += 3) {
    const x = triangles[i], y = triangles[i + 1], z = triangles[i + 2];
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
  if (!Number.isFinite(minX)) {
    const zero = { x: 0, y: 0, z: 0 };
    return { min: zero, max: zero, center: zero, radius: 0, size: zero };
  }
  const center = { x: (minX + maxX) / 2, y: (minY + maxY) / 2, z: (minZ + maxZ) / 2 };
  const size = { x: maxX - minX, y: maxY - minY, z: maxZ - minZ };
  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
    center,
    size,
    radius: Math.hypot(size.x, size.y, size.z) / 2,
  };
}

/**
 * Flächennormalen je Dreieck, auf alle drei Eckpunkte verteilt. STL-Netze wirken
 * mit dieser flachen Schattierung ehrlicher als mit geglätteten Normalen –
 * man sieht die Facetten, die auch gedruckt werden.
 */
export function faceNormals(triangles: ArrayLike<number>): Float32Array {
  const out = new Float32Array(triangles.length);
  for (let i = 0; i + 8 < triangles.length; i += 9) {
    const ux = triangles[i + 3] - triangles[i];
    const uy = triangles[i + 4] - triangles[i + 1];
    const uz = triangles[i + 5] - triangles[i + 2];
    const vx = triangles[i + 6] - triangles[i];
    const vy = triangles[i + 7] - triangles[i + 1];
    const vz = triangles[i + 8] - triangles[i + 2];
    let nx = uy * vz - uz * vy;
    let ny = uz * vx - ux * vz;
    let nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    for (let k = 0; k < 3; k++) {
      out[i + k * 3] = nx;
      out[i + k * 3 + 1] = ny;
      out[i + k * 3 + 2] = nz;
    }
  }
  return out;
}

/* ---------------- Renderer ---------------- */

const VERT = `#version 300 es
in vec3 aPos;
in vec3 aNormal;
uniform mat4 uMvp;
uniform vec3 uCenter;
out vec3 vNormal;
out vec3 vPos;
void main() {
  vec3 p = aPos - uCenter;
  vNormal = aNormal;
  vPos = p;
  gl_Position = uMvp * vec4(p, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vPos;
uniform vec3 uEye;
uniform vec3 uColor;
out vec4 outColor;
void main() {
  // Beidseitig beleuchten: Netze mit falsch gedrehten Normalen sollen trotzdem
  // lesbar bleiben, statt als schwarze Flaechen zu erscheinen.
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(uEye - vPos);
  float key = max(dot(n, normalize(vec3(0.45, -0.6, 0.75))), 0.0);
  float fill = max(dot(n, normalize(vec3(-0.5, 0.4, 0.2))), 0.0) * 0.3;
  float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0) * 0.3;
  float light = 0.28 + key * 0.7 + fill + rim;
  outColor = vec4(uColor * light, 1.0);
}`;

export interface ViewerOptions {
  /** Modellfarbe als RGB 0–1. */
  color?: [number, number, number];
  /** Hintergrund als RGB 0–1. */
  background?: [number, number, number];
}

/** Ein eingefärbtes Teilnetz. */
export interface MeshPart {
  triangles: ArrayLike<number>;
  color: [number, number, number];
  /**
   * Hilfsgeometrie – Messmarken, Strecken, Markierungen. Wird gezeichnet, zählt
   * aber nicht für die Modellgrenzen.
   *
   * Der Unterschied ist nicht kosmetisch: Aus den Grenzen ergibt sich der
   * Mittelpunkt, um den die Kamera kreist. Zählten die Marken mit, verschöbe
   * jede gesetzte Marke die Kamera ein Stück – und der nächste Messklick träfe
   * daneben. Genau das war messbar: zweimal dasselbe Pixel ergab 0,26 mm
   * Abstand statt null.
   */
  helper?: boolean;
}

export interface Viewer {
  /** Netz setzen (flaches Dreieck-Array, 9 Werte je Dreieck). */
  setMesh(triangles: ArrayLike<number>): void;
  /** Mehrere Teilnetze mit eigener Farbe – zeigt etwa beide Hälften eines Schnitts. */
  setParts(parts: MeshPart[]): void;
  /** Kamera auf das Netz einpassen. */
  resetView(): void;
  /**
   * Aktuelle Ansicht als PNG-Datenurl. Zeichnet dafür synchron und liest sofort
   * aus – nach dem Compositing gibt WebGL den Puffer frei, ein späterer Zugriff
   * liefert nur Schwarz.
   */
  snapshot(): string | null;
  /**
   * Kamera in Modellkoordinaten samt Bildgröße – die Angaben, aus denen sich
   * ein Klick in einen Strahl durch die Szene umrechnen lässt.
   */
  camera(): { eye: Vec3; target: Vec3; fovY: number; width: number; height: number };
  destroy(): void;
  readonly bounds: MeshBounds;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

/**
 * Baut den Viewer auf einem Canvas auf. Gibt `null` zurück, wenn WebGL2 fehlt –
 * die aufrufende Seite zeigt dann einen Hinweis statt eines leeren Rahmens.
 */
export function createViewer(canvas: HTMLCanvasElement, opts: ViewerOptions = {}): Viewer | null {
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const prog = vs && fs ? gl.createProgram() : null;
  if (!vs || !fs || !prog) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;

  const color = opts.color ?? [0.92, 0.55, 0.25];
  const bg = opts.background ?? [0.98, 0.98, 0.99];
  const locPos = gl.getAttribLocation(prog, 'aPos');
  const locNormal = gl.getAttribLocation(prog, 'aNormal');
  const uMvp = gl.getUniformLocation(prog, 'uMvp');
  const uEye = gl.getUniformLocation(prog, 'uEye');
  const uColor = gl.getUniformLocation(prog, 'uColor');
  const uCenter = gl.getUniformLocation(prog, 'uCenter');

  const vao = gl.createVertexArray();
  const posBuf = gl.createBuffer();
  const normBuf = gl.createBuffer();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
  gl.enableVertexAttribArray(locPos);
  gl.vertexAttribPointer(locPos, 3, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, normBuf);
  gl.enableVertexAttribArray(locNormal);
  gl.vertexAttribPointer(locNormal, 3, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  gl.enable(gl.DEPTH_TEST);
  gl.clearColor(bg[0], bg[1], bg[2], 1);

  interface Teil { buffer: WebGLBuffer | null; normals: WebGLBuffer | null; count: number; color: [number, number, number] }
  const teile: Teil[] = [];
  let vertexCount = 0;
  let bounds = meshBounds([]);
  const fovY = (45 * Math.PI) / 180;
  let yaw = -Math.PI / 4;
  let pitch = Math.PI / 6;
  let distance = 10;
  let dirty = true;
  let frame = 0;

  const target = { x: 0, y: 0, z: 0 };

  function aspect(): number {
    return canvas.clientWidth > 0 && canvas.clientHeight > 0
      ? canvas.clientWidth / canvas.clientHeight
      : 1;
  }

  function resetView(): void {
    yaw = -Math.PI / 4;
    pitch = Math.PI / 6;
    distance = fitDistance(bounds.radius || 1, fovY, aspect());
    dirty = true;
  }

  function draw(): void {
    frame = 0;
    if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (vertexCount === 0) return;

    const eye = orbitPosition(yaw, pitch, distance, target);
    const near = Math.max(distance / 1000, 0.01);
    const far = distance * 4 + bounds.radius * 4 + 10;
    const proj = mat4Perspective(fovY, aspect(), near, far);
    const view = mat4LookAt(eye, target, { x: 0, y: 0, z: 1 });
    const mvp = mat4Multiply(proj, view);

    gl.useProgram(prog);
    gl.uniformMatrix4fv(uMvp, false, new Float32Array(mvp));
    gl.uniform3f(uEye, eye.x, eye.y, eye.z);
    gl.uniform3f(uCenter, bounds.center.x, bounds.center.y, bounds.center.z);
    gl.bindVertexArray(vao);
    for (const t of teile) {
      if (t.count === 0) continue;
      gl.uniform3f(uColor, t.color[0], t.color[1], t.color[2]);
      gl.bindBuffer(gl.ARRAY_BUFFER, t.buffer);
      gl.vertexAttribPointer(locPos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, t.normals);
      gl.vertexAttribPointer(locNormal, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, t.count);
    }
    gl.bindVertexArray(null);
  }

  function schedule(): void {
    if (frame) return;
    frame = requestAnimationFrame(draw);
  }

  /* --- Bedienung --- */
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let pinch = 0;

  const onDown = (e: PointerEvent): void => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent): void => {
    if (!dragging) return;
    yaw -= (e.clientX - lastX) * 0.01;
    pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch + (e.clientY - lastY) * 0.01));
    lastX = e.clientX;
    lastY = e.clientY;
    schedule();
  };
  const onUp = (e: PointerEvent): void => {
    dragging = false;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };
  const onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    distance = Math.max(bounds.radius * 0.2 + 0.01, distance * (e.deltaY > 0 ? 1.12 : 0.89));
    schedule();
  };
  const onTouch = (e: TouchEvent): void => {
    if (e.touches.length !== 2) {
      pinch = 0;
      return;
    }
    e.preventDefault();
    const d = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY,
    );
    if (pinch > 0 && d > 0) {
      distance = Math.max(bounds.radius * 0.2 + 0.01, (distance * pinch) / d);
      schedule();
    }
    pinch = d;
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('touchmove', onTouch, { passive: false });
  canvas.style.touchAction = 'none';

  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => schedule()) : null;
  observer?.observe(canvas);

  schedule();

  return {
    camera() {
      // Gezeichnet wird um bounds.center verschoben; für die Rückrechnung in
      // Modellkoordinaten muss der Mittelpunkt wieder dazu.
      const e = orbitPosition(yaw, pitch, distance, target);
      return {
        eye: { x: e.x + bounds.center.x, y: e.y + bounds.center.y, z: e.z + bounds.center.z },
        target: { ...bounds.center },
        fovY,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
      };
    },
    setMesh(triangles) {
      this.setParts([{ triangles, color }]);
    },
    setParts(parts) {
      // Alte Puffer freigeben, bevor neue entstehen
      for (const t of teile) {
        gl.deleteBuffer(t.buffer);
        gl.deleteBuffer(t.normals);
      }
      teile.length = 0;

      const alle: number[] = [];
      for (const part of parts) {
        const positions =
          part.triangles instanceof Float32Array
            ? part.triangles
            : Float32Array.from(part.triangles as ArrayLike<number>);
        const normals = faceNormals(part.triangles);
        const pb = gl.createBuffer();
        const nb = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pb);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, nb);
        gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
        teile.push({ buffer: pb, normals: nb, count: Math.floor(positions.length / 3), color: part.color });
        if (!part.helper) for (let i = 0; i < part.triangles.length; i++) alle.push(part.triangles[i]);
      }
      vertexCount = teile.reduce((n, t) => n + t.count, 0);
      const vorher = bounds.radius;
      bounds = meshBounds(alle);
      // Kamera nur neu einpassen, wenn sich die Größe wirklich ändert –
      // sonst springt die Ansicht bei jedem Schieberegler-Schritt zurück.
      if (Math.abs(bounds.radius - vorher) > vorher * 0.01 + 1e-9) resetView();
      schedule();
    },
    resetView() {
      resetView();
      schedule();
    },
    snapshot() {
      if (vertexCount === 0) return null;
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
      draw(); // synchron zeichnen, damit der Puffer beim Auslesen noch steht
      try {
        return canvas.toDataURL('image/png');
      } catch {
        return null;
      }
    },
    destroy() {
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('touchmove', onTouch);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(normBuf);
      for (const t of teile) {
        gl.deleteBuffer(t.buffer);
        gl.deleteBuffer(t.normals);
      }
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    },
    get bounds() {
      return bounds;
    },
  };
}
