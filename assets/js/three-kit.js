import * as THREE from '../vendor/three/build/three.module.min.js';
import { RoundedBoxGeometry } from '../vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js';

export { THREE };

export const PALETTE = {
  graphite: '#23262b',
  graphiteDeep: '#17191d',
  graphiteLight: '#33373e',
  signal: '#ff3d1f',
  steel: '#c4c9d0',
  rubber: '#111215',
  paper: '#c7b083',
  primer: '#8b9197',
};

let M = null;
export function mats() {
  if (M) return M;
  M = {
    powder: new THREE.MeshPhysicalMaterial({ color: PALETTE.graphite, roughness: 0.5, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.35 }),
    powderDeep: new THREE.MeshPhysicalMaterial({ color: PALETTE.graphiteDeep, roughness: 0.55, metalness: 0.05, clearcoat: 0.25, clearcoatRoughness: 0.4 }),
    powderLight: new THREE.MeshPhysicalMaterial({ color: PALETTE.graphiteLight, roughness: 0.48, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
    signal: new THREE.MeshPhysicalMaterial({ color: PALETTE.signal, roughness: 0.36, metalness: 0.0, clearcoat: 0.6, clearcoatRoughness: 0.22 }),
    signalMatte: new THREE.MeshStandardMaterial({ color: '#f2541c', roughness: 0.8, metalness: 0 }),
    steel: new THREE.MeshStandardMaterial({ color: PALETTE.steel, roughness: 0.3, metalness: 1.0 }),
    alu: new THREE.MeshStandardMaterial({ color: '#d5d9de', roughness: 0.42, metalness: 0.85 }),
    chrome: new THREE.MeshStandardMaterial({ color: '#eceef1', roughness: 0.07, metalness: 1.0 }),
    rubber: new THREE.MeshStandardMaterial({ color: PALETTE.rubber, roughness: 0.86, metalness: 0 }),
    plastic: new THREE.MeshStandardMaterial({ color: '#1b1c1f', roughness: 0.45, metalness: 0 }),
    plasticGrey: new THREE.MeshStandardMaterial({ color: '#3a3d42', roughness: 0.55, metalness: 0 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#0a0b0d', roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 }),
    paper: new THREE.MeshStandardMaterial({ color: PALETTE.paper, roughness: 0.88, metalness: 0, side: THREE.DoubleSide }),
    paperGreen: new THREE.MeshStandardMaterial({ color: '#9fb08a', roughness: 0.88, metalness: 0, side: THREE.DoubleSide }),
    film: new THREE.MeshStandardMaterial({ color: '#eef1f4', roughness: 0.25, metalness: 0, transparent: true, opacity: 0.82, side: THREE.DoubleSide }),
    tape: new THREE.MeshStandardMaterial({ color: '#e6d7ae', roughness: 0.65, metalness: 0 }),
    cardboard: new THREE.MeshStandardMaterial({ color: '#b08657', roughness: 0.92, metalness: 0 }),
    primer: new THREE.MeshStandardMaterial({ color: PALETTE.primer, roughness: 0.62, metalness: 0, side: THREE.DoubleSide }),
    paintRed: new THREE.MeshPhysicalMaterial({ color: '#8f1717', roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide }),
    paintWhite: new THREE.MeshPhysicalMaterial({ color: '#e9eaec', roughness: 0.25, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide }),
    paintBlack: new THREE.MeshPhysicalMaterial({ color: '#141518', roughness: 0.22, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide }),
    paintSilver: new THREE.MeshPhysicalMaterial({ color: '#9ea4ab', roughness: 0.3, metalness: 0.7, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide }),
    pad: new THREE.MeshStandardMaterial({ color: '#141518', roughness: 0.95, metalness: 0 }),
    white: new THREE.MeshStandardMaterial({ color: '#f1f2f3', roughness: 0.55, metalness: 0 }),
    black: new THREE.MeshStandardMaterial({ color: '#0c0d0f', roughness: 0.6, metalness: 0 }),
    lens: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff5a3d').multiplyScalar(2.2), toneMapped: false }),
    led: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(3), toneMapped: false }),
  };
  return M;
}

const geoCache = new Map();
function rbGeo(w, h, d, r, seg) {
  const key = `${w.toFixed(4)}|${h.toFixed(4)}|${d.toFixed(4)}|${r.toFixed(4)}|${seg}`;
  let g = geoCache.get(key);
  if (!g) { g = new RoundedBoxGeometry(w, h, d, seg, r); geoCache.set(key, g); }
  return g;
}

export function mesh(geo, mat, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = shadow; m.receiveShadow = shadow;
  return m;
}

export function box(w, h, d, mat, r = 0.004, seg = 2) {
  const rr = Math.min(r, Math.min(w, h, d) / 2 - 0.0002);
  const g = rr > 0.0006 ? rbGeo(w, h, d, rr, seg) : new THREE.BoxGeometry(w, h, d);
  return mesh(g, mat);
}

export function cyl(r, h, mat, { axis = 'y', seg = 32, r2 = null, open = false } = {}) {
  const g = new THREE.CylinderGeometry(r2 ?? r, r, h, seg, 1, open);
  const m = mesh(g, mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  return m;
}

export function ring(ri, ro, h, mat, { axis = 'y', seg = 40 } = {}) {
  const pts = [
    new THREE.Vector2(ri, -h / 2), new THREE.Vector2(ro, -h / 2),
    new THREE.Vector2(ro, h / 2), new THREE.Vector2(ri, h / 2), new THREE.Vector2(ri, -h / 2),
  ];
  const g = new THREE.LatheGeometry(pts, seg);
  const m = mesh(g, mat);
  if (axis === 'x') m.rotation.z = Math.PI / 2;
  if (axis === 'z') m.rotation.x = Math.PI / 2;
  return m;
}

export function tube(points, radius, mat, { seg = 96, radial = 10, closed = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed, 'catmullrom', 0.5);
  return mesh(new THREE.TubeGeometry(curve, seg, radius, radial, closed), mat);
}

export function at(obj, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  obj.position.set(x, y, z);
  if (rx || ry || rz) obj.rotation.set(rx, ry, rz);
  return obj;
}

export function group(...children) {
  const g = new THREE.Group();
  children.flat().forEach(c => c && g.add(c));
  return g;
}

export function decal(tex, w, h, { transparent = true, emissive = false } = {}) {
  const mat = emissive
    ? new THREE.MeshBasicMaterial({ map: tex, transparent, toneMapped: false })
    : new THREE.MeshStandardMaterial({ map: tex, transparent, roughness: 0.6, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.receiveShadow = !emissive;
  return m;
}

export function caster(h = 0.11, { brake = false, wheel = 0.05 } = {}) {
  const m = mats();
  const g = new THREE.Group();
  g.add(at(box(0.07, 0.008, 0.07, m.steel, 0.002), 0, h - 0.004, 0));
  g.add(at(cyl(0.022, 0.014, m.steel, { seg: 20 }), 0, h - 0.015, 0));
  const forkH = h - 0.022 - wheel * 0.6;
  [-1, 1].forEach(s => g.add(at(box(0.005, forkH + wheel * 0.5, 0.05, m.steel, 0.0015), s * 0.021, wheel + (forkH - wheel * 0.5) / 2 + 0.002, -0.008)));
  g.add(at(cyl(wheel, 0.03, m.rubber, { axis: 'x', seg: 28 }), 0, wheel, -0.012));
  g.add(at(cyl(wheel * 0.45, 0.034, m.steel, { axis: 'x', seg: 20 }), 0, wheel, -0.012));
  if (brake) g.add(at(box(0.03, 0.006, 0.03, mats().signal, 0.002), 0, wheel * 1.55, 0.03, -0.35, 0, 0));
  return g;
}

export function casterSet(hx, hz, h = 0.11, opts = {}) {
  const g = new THREE.Group();
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
    const c = caster(h, { brake: i >= 2 && opts.brake !== false, wheel: opts.wheel });
    c.position.set(sx * hx, 0, sz * hz);
    c.rotation.y = (i * 0.9) % Math.PI;
    g.add(c);
  });
  return g;
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, { srgb = true, aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = aniso;
  t.needsUpdate = true;
  return t;
}
function setFont(ctx, weight, size, family = 'Archivo', stretch = 'expanded') {
  try { ctx.fontStretch = stretch; } catch (e) {   }
  ctx.font = `${weight} ${size}px ${family}, "Arial Black", Arial, sans-serif`;
}
const texCache = new Map();
function cached(key, fn) { if (!texCache.has(key)) texCache.set(key, fn()); return texCache.get(key); }

export function wordmarkTexture(color = '#ffffff', { mark = true, w = 1024, h = 192 } = {}) {
  return cached(`wm-${color}-${mark}-${w}x${h}`, () => {
    const [c, ctx] = canvas(w, h);
    const s = h * 0.62;
    let x = h * 0.12;
    if (mark) {
      const q = s / 2, y0 = (h - s) / 2;
      ctx.fillStyle = color; ctx.fillRect(x, y0, q, q); ctx.fillRect(x + q, y0 + q, q, q);
      ctx.fillStyle = '#FF3D1F'; ctx.beginPath(); ctx.arc(x + q, y0 + q, s * 0.115, 0, Math.PI * 2); ctx.fill();
      x += s + h * 0.22;
    }
    setFont(ctx, 800, h * 0.6);
    ctx.fillStyle = color; ctx.textBaseline = 'middle';
    ctx.letterSpacing = `${h * 0.03}px`;
    ctx.fillText('VELOCITY', x, h / 2 + h * 0.03);
    return tex(c);
  });
}

export function labelTexture(text, { color = '#ffffff', bg = null, w = 512, h = 96, size = 0.5, family = '"IBM Plex Mono", monospace', weight = 600, align = 'left' } = {}) {
  return cached(`lbl-${text}-${color}-${bg}-${w}-${h}-${align}`, () => {
    const [c, ctx] = canvas(w, h);
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
    ctx.font = `${weight} ${Math.round(h * size)}px ${family}`;
    ctx.fillStyle = color; ctx.textBaseline = 'middle';
    ctx.textAlign = align;
    ctx.fillText(text, align === 'left' ? h * 0.2 : align === 'center' ? w / 2 : w - h * 0.2, h / 2);
    return tex(c);
  });
}

export function targetTexture(variant = 0) {
  return cached(`target-${variant}`, () => {
    const W = 1200, H = 760;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = '#f4f4f2'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0d0d0f';
    const pad = 70;
    if (variant === 0 || variant === 3) {
      const cols = variant === 0 ? 10 : 14, rows = variant === 0 ? 6 : 8;
      const cw = (W - pad * 2) / cols, ch = (H - pad * 2 - 40) / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if ((i + j) % 2 === 0) ctx.fillRect(pad + i * cw, pad + j * ch, cw, ch);
    } else if (variant === 1) {
      const cols = 9, rows = 5;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        ctx.beginPath(); ctx.arc(pad + 40 + i * ((W - pad * 2 - 80) / (cols - 1)), pad + 30 + j * ((H - pad * 2 - 100) / (rows - 1)), 34, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      for (let k = 0; k < 5; k++) { ctx.lineWidth = 26; ctx.strokeStyle = '#0d0d0f'; const inset = 90 + k * 64; ctx.strokeRect(inset, inset * 0.62, W - inset * 2, H - inset * 1.24 - 40); }
      const s = 60; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) ctx.fillRect(W / 2 - 2 * s + i * s, H / 2 - 2 * s - 20 + j * s, s, s);
    }
    ctx.lineWidth = 10; ctx.strokeStyle = '#ff3d1f';
    const L = 46, m = 22;
    [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([x, y, sx, sy]) => {
      ctx.beginPath(); ctx.moveTo(x, y + sy * L); ctx.lineTo(x, y); ctx.lineTo(x + sx * L, y); ctx.stroke();
    });
    ctx.font = '600 22px "IBM Plex Mono", monospace'; ctx.fillStyle = '#4b4f55';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`VEL-CAL  TGT-0${variant + 1}  1:1`, pad, H - 34);
    ctx.textAlign = 'right'; ctx.fillText('VELOCITY', W - pad, H - 34);
    return tex(c);
  });
}

export function rulerTexture(lengthMm = 2300, { vertical = false } = {}) {
  return cached(`ruler-${lengthMm}-${vertical}`, () => {
    const W = 4096, H = 96;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = '#1a1c20'; ctx.fillRect(0, 0, W, H);
    const pxPerMm = W / lengthMm;
    ctx.fillStyle = '#d9dce0';
    for (let mm = 0; mm <= lengthMm; mm += 10) {
      const x = mm * pxPerMm;
      const big = mm % 100 === 0, mid = mm % 50 === 0;
      const th = big ? H * 0.5 : mid ? H * 0.34 : H * 0.2;
      ctx.fillRect(x, 0, big ? 3 : 2, th);
    }
    ctx.font = '500 26px "IBM Plex Mono", monospace'; ctx.textBaseline = 'bottom';
    const center = lengthMm / 2;
    for (let mm = 0; mm <= lengthMm; mm += 100) {
      const label = Math.abs(Math.round(mm - center));
      ctx.fillText(String(label), mm * pxPerMm + 6, H - 8);
    }
    ctx.fillStyle = '#ff3d1f'; ctx.fillRect(center * pxPerMm - 2, 0, 5, H);
    const t = tex(c);
    if (vertical) { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; }
    return t;
  });
}

export function screenTexture(kind = 'stud') {
  return cached(`screen-${kind}`, () => {
    const W = 640, H = 400;
    const [c, ctx] = canvas(W, H);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0d1013'); g.addColorStop(1, '#06080a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const mono = (wgt, s) => { ctx.font = `${wgt} ${s}px "IBM Plex Mono", monospace`; };
    ctx.fillStyle = '#ff3d1f'; ctx.fillRect(0, 0, W, 56);
    ctx.fillStyle = '#0b0c0e'; mono(600, 26); ctx.textBaseline = 'middle';
    if (kind === 'cal') {
      ctx.fillText('VELOCITY CAL  ·  FRONT CAMERA', 24, 29);
      const steps = ['PRE-SCAN', 'FRAME TO THRUST LINE', 'TARGET AT SPEC HEIGHT', 'RUN CALIBRATION', 'POST-SCAN + REPORT'];
      mono(500, 24);
      steps.forEach((s, i) => {
        const y = 100 + i * 56;
        ctx.fillStyle = i < 3 ? '#ff3d1f' : i === 3 ? '#ffffff' : '#5b636d';
        ctx.fillText(i < 3 ? '✓' : String(i + 1), 28, y);
        ctx.fillStyle = i <= 3 ? '#e9edf1' : '#5b636d';
        ctx.fillText(s, 70, y);
      });
      ctx.fillStyle = '#20262d'; ctx.fillRect(28, 372, W - 56, 8);
      ctx.fillStyle = '#ff3d1f'; ctx.fillRect(28, 372, (W - 56) * 0.66, 8);
    } else if (kind === 'batt') {
      ctx.fillText('MAINTAINER  ·  CAL MODE', 24, 29);
      ctx.fillStyle = '#ffffff'; ctx.font = '800 150px Archivo, Arial, sans-serif';
      try { ctx.fontStretch = 'expanded'; } catch (e) {   }
      ctx.textBaseline = 'alphabetic';
      ctx.fillText('13.6', 28, 250);
      mono(500, 30); ctx.fillStyle = '#8f99a3';
      ctx.fillText('VOLTS', 420, 246);
      ctx.fillStyle = '#20262d'; ctx.fillRect(28, 290, W - 56, 18);
      ctx.fillStyle = '#ff3d1f'; ctx.fillRect(28, 290, (W - 56) * 0.86, 18);
      mono(500, 24); ctx.fillStyle = '#c9d0d6';
      ctx.fillText('HOLDING   ·   38 A AVAILABLE', 28, 352);
    } else {
      const head = { al: 'PULL-A  ·  CD STUD', pro: 'PULL-S PRO  ·  STUD · AUTO' }[kind] || 'PULL-S  ·  STUD · AUTO';
      ctx.fillText(head, 24, 29);
      ctx.fillStyle = '#ffffff'; ctx.font = '800 150px Archivo, Arial, sans-serif';
      try { ctx.fontStretch = 'expanded'; } catch (e) {   }
      ctx.textBaseline = 'alphabetic';
      const al = kind === 'al';
      ctx.fillText(al ? '112' : kind === 'pro' ? '74' : '68', 28, 250);
      mono(500, 30); ctx.fillStyle = '#8f99a3';
      ctx.fillText(al ? 'V CHARGE' : '% POWER', al ? 330 : 260, 246);
      ctx.fillStyle = '#20262d'; ctx.fillRect(28, 290, W - 56, 18);
      ctx.fillStyle = '#ff3d1f'; ctx.fillRect(28, 290, (W - 56) * (al ? 0.78 : kind === 'pro' ? 0.74 : 0.68), 18);
      mono(500, 24); ctx.fillStyle = '#c9d0d6';
      ctx.fillText(al ? 'M5 STUD   ·   READY' : kind === 'pro' ? 'WIGGLE WIRE   ·   READY' : 'TIME 0.12 S   ·   READY', 28, 352);
    }
    return tex(c);
  });
}

export function roSheetTexture() {
  return cached('ro', () => {
    const W = 512, H = 680;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = '#f6f6f3'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#0d0e10'; ctx.font = '700 44px "IBM Plex Mono", monospace'; ctx.textBaseline = 'top';
    ctx.fillText('RO 24817', 36, 34);
    ctx.fillStyle = '#ff3d1f'; ctx.fillRect(36, 96, 120, 10);
    ctx.font = '500 24px "IBM Plex Mono", monospace'; ctx.fillStyle = '#2d3136';
    const lines = ['FRT BUMPER COVER', 'GRILLE ASSY', 'RADAR BRKT', 'L HEADLAMP', 'CLIPS (12)', 'FOG LAMP BEZEL'];
    lines.forEach((l, i) => { ctx.fillText('☐  ' + l, 36, 140 + i * 58); ctx.fillStyle = '#d8d9d4'; ctx.fillRect(36, 180 + i * 58, W - 72, 2); ctx.fillStyle = '#2d3136'; });
    ctx.fillText('MIRROR MATCHED  ✓', 36, 520);
    return tex(c);
  });
}

export function qrPlacardTexture() {
  return cached('qr-placard', () => {
    const W = 440, H = 580;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = '#f6f6f3'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff3d1f'; ctx.fillRect(0, 0, W, 18);
    ctx.fillStyle = '#0d0e10'; ctx.font = '700 46px "IBM Plex Mono", monospace'; ctx.textBaseline = 'top';
    ctx.fillText('RO 24817', 34, 44);
    const N = 25, size = 330, x0 = (W - size) / 2, y0 = 120, cell = size / N;
    let seed = 24817;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    ctx.fillStyle = '#0d0e10';
    const finder = (fx, fy) => fx < 8 && fy < 8;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      if (finder(i, j) || finder(N - 1 - i, j) || finder(i, N - 1 - j)) continue;
      if (rnd() > 0.52) ctx.fillRect(x0 + i * cell, y0 + j * cell, cell + 0.5, cell + 0.5);
    }
    [[0, 0], [N - 7, 0], [0, N - 7]].forEach(([fx, fy]) => {
      const X = x0 + fx * cell, Y = y0 + fy * cell;
      ctx.fillStyle = '#0d0e10'; ctx.fillRect(X, Y, cell * 7, cell * 7);
      ctx.fillStyle = '#f6f6f3'; ctx.fillRect(X + cell, Y + cell, cell * 5, cell * 5);
      ctx.fillStyle = '#0d0e10'; ctx.fillRect(X + cell * 2, Y + cell * 2, cell * 3, cell * 3);
    });
    ctx.font = '600 26px "IBM Plex Mono", monospace'; ctx.fillStyle = '#2d3136';
    ctx.fillText('BAY 3  ·  RACK-PS', 34, 478);
    ctx.fillStyle = '#8a8f96'; ctx.font = '500 20px "IBM Plex Mono", monospace';
    ctx.fillText('SCAN TO OPEN THE RO', 34, 520);
    return tex(c);
  });
}

export function boxLabelTexture(title, sub = '') {
  return cached(`box-${title}-${sub}`, () => {
    const W = 512, H = 256;
    const [c, ctx] = canvas(W, H);
    ctx.fillStyle = '#16181c'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff3d1f'; ctx.fillRect(0, 0, 22, H);
    let fs = 56;
    setFont(ctx, 800, fs);
    while (ctx.measureText(title).width > W - 80 && fs > 20) { fs -= 2; setFont(ctx, 800, fs); }
    ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'top'; ctx.fillText(title, 52, 52 + (56 - fs) / 2);
    ctx.font = '500 28px "IBM Plex Mono", monospace'; ctx.fillStyle = '#a4abb3'; ctx.fillText(sub, 54, 140);
    return tex(c);
  });
}

export function blobTexture() {
  return cached('blob', () => {
    const [c, ctx] = canvas(256, 256);
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(0.45, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    return tex(c, { srgb: false });
  });
}

export function glowTexture() {
  return cached('glow', () => {
    const [c, ctx] = canvas(64, 256);
    const g = ctx.createLinearGradient(0, 0, 64, 0);
    g.addColorStop(0, 'rgba(255,61,31,0)'); g.addColorStop(0.5, 'rgba(255,100,70,1)'); g.addColorStop(1, 'rgba(255,61,31,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 256);
    return tex(c);
  });
}

export function shopEnvironment(renderer, { strips = 1.0, key = 1.0, fill = 0.35, base = 0.06 } = {}) {
  const scene = new THREE.Scene();
  const geo = new THREE.BoxGeometry(); geo.deleteAttribute('uv');
  const room = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: new THREE.Color(base, base, base * 1.05) }));
  room.scale.set(40, 14, 40); room.position.y = 6;
  scene.add(room);
  const light = (intensity, color = 0xffffff) => { const m = new THREE.MeshBasicMaterial({ color }); m.color.multiplyScalar(intensity); return m; };
  for (let i = -2; i <= 2; i++) {
    const s = new THREE.Mesh(geo, light(9 * strips));
    s.scale.set(16, 0.08, 0.32); s.position.set(0, 12.9, i * 3.2);
    scene.add(s);
  }
  const k = new THREE.Mesh(geo, light(14 * key)); k.scale.set(0.1, 6, 7); k.position.set(-19.8, 6, 6); scene.add(k);
  const f = new THREE.Mesh(geo, light(8 * fill)); f.scale.set(0.1, 5, 9); f.position.set(19.8, 5, 2); scene.add(f);
  const r = new THREE.Mesh(geo, light(6 * key, 0xffe2d2)); r.scale.set(10, 4, 0.1); r.position.set(0, 5, -19.8); scene.add(r);
  const fl = new THREE.Mesh(geo, light(0.25)); fl.scale.set(30, 0.05, 30); fl.position.y = -0.95; scene.add(fl);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  return rt.texture;
}

export function frameObject(camera, object, { azimuth = 0.6, elevation = 0.28, padding = 1.12, lookYOffset = 0 } = {}) {
  object.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(object);
  const pts = [];
  object.traverse(o => {
    if (!o.isMesh || !o.visible || !o.geometry) return;
    const pos = o.geometry.attributes.position;
    const step = Math.max(1, Math.floor(pos.count / 300));
    for (let i = 0; i < pos.count; i += step) pts.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld));
  });
  const dir = new THREE.Vector3(Math.cos(elevation) * Math.sin(azimuth), Math.sin(elevation), Math.cos(elevation) * Math.cos(azimuth));
  const target = b.getCenter(new THREE.Vector3());
  let dist = b.getBoundingSphere(new THREE.Sphere()).radius * 3.2;
  const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  const tanX = tanY * camera.aspect;
  const right = new THREE.Vector3(), up = new THREE.Vector3(), v = new THREE.Vector3();
  for (let iter = 0; iter < 7; iter++) {
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target); camera.updateMatrixWorld(true);
    const inv = camera.matrixWorldInverse;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of pts) {
      v.copy(p).applyMatrix4(inv);
      const z = Math.max(1e-4, -v.z);
      const x = v.x / (z * tanX), y = v.y / (z * tanY);
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    right.setFromMatrixColumn(camera.matrixWorld, 0); up.setFromMatrixColumn(camera.matrixWorld, 1);
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    target.addScaledVector(right, cx * dist * tanX).addScaledVector(up, cy * dist * tanY);
    dist *= Math.max((maxX - minX) / 2, (maxY - minY) / 2) * padding;
  }
  target.y += lookYOffset;
  camera.position.copy(target).addScaledVector(dir, dist);
  camera.lookAt(target);
  camera.near = dist / 50; camera.far = dist * 20;
  camera.updateProjectionMatrix();
  return { target, dist, box: b };
}

export const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
export const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
