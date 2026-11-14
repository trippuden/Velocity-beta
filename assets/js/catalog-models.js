import * as THREE from '../vendor/three/build/three.module.min.js';
import { mats, box, cyl, at, group, mesh } from './three-kit.js';

let MM = null;
function canvasTex(w, h, draw, { srgb = true, repeat = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function perfTex(base, hole, n, { square = false, r = 0.18 } = {}) {
  return canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    c.fillStyle = hole; const s = w / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const x = (i + 0.5) * s, y = (j + 0.5) * s;
      if (square) c.fillRect(x - s * r, y - s * r, s * r * 2, s * r * 2);
      else { c.beginPath(); c.arc(x, y, s * r, 0, Math.PI * 2); c.fill(); }
    }
  });
}
function wireTex(n) {
  return canvasTex(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = '#ffffff'; const s = w / n, lw = Math.max(2, s * 0.09);
    for (let i = 0; i <= n; i++) { c.fillRect(i * s - lw / 2, 0, lw, h); c.fillRect(0, i * s - lw / 2, w, lw); }
  });
}
function ribTex() {
  return canvasTex(8, 64, (c, w, h) => { for (let y = 0; y < h; y++) { const v = 128 + 127 * Math.sin(y / h * Math.PI * 2 * 4); c.fillStyle = `rgb(${v},${v},${v})`; c.fillRect(0, y, w, 1); } }, { srgb: false });
}
function mm() {
  if (MM) return MM;
  const m = mats();
  const pc = (color, rough = 0.5, metal = 0.08, cc = 0.25) => new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: metal, clearcoat: cc, clearcoatRoughness: 0.35 });
  const st = (color, rough = 0.6, metal = 0) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const wire = wireTex(8);
  const rib = ribTex(); rib.wrapS = rib.wrapT = THREE.RepeatWrapping;
  MM = {
    black: pc('#16171a', 0.5, 0.06, 0.25),
    blackPl: st('#141518', 0.62),
    slate: pc('#454b53', 0.42, 0.18, 0.35),
    grey: pc('#858c94', 0.48, 0.3, 0.2),
    zinc: pc('#c3c8cd', 0.4, 0.55, 0.15),
    yellow: pc('#e3bd1c', 0.4, 0.05, 0.45),
    yellowPl: st('#efc11a', 0.5),
    silver: pc('#c8ccd0', 0.38, 0.45, 0.4),
    darkCase: pc('#24262a', 0.5, 0.15, 0.3),
    lightPanel: pc('#b5babf', 0.45, 0.35, 0.2),
    alu: m.alu, chrome: m.chrome, steel: m.steel, rubber: m.rubber,
    wood: st('#c39264', 0.6),
    ply: st('#d9c7a0', 0.82),
    card: st('#b08657', 0.9),
    copper: new THREE.MeshStandardMaterial({ color: '#c47c47', roughness: 0.32, metalness: 1 }),
    cable: st('#101113', 0.48),
    hose: new THREE.MeshStandardMaterial({ color: '#a2a8ae', roughness: 0.7, metalness: 0, bumpMap: rib, bumpScale: 1.2 }),
    kraft: new THREE.MeshStandardMaterial({ color: '#a8845a', roughness: 0.9, metalness: 0, side: THREE.DoubleSide }),
    filmRoll: new THREE.MeshPhysicalMaterial({ color: '#dfe6eb', roughness: 0.2, metalness: 0, transparent: true, opacity: 0.55 }),
    filmSheet: new THREE.MeshPhysicalMaterial({ color: '#e8eef2', roughness: 0.15, metalness: 0, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
    foam: st('#1e1f22', 0.95),
    white: st('#e4e6e8', 0.5),
    whiteBox: new THREE.MeshPhysicalMaterial({ color: '#eef0f2', roughness: 0.35, metalness: 0, transparent: true, opacity: 0.88 }),
    redRing: st('#b4241c', 0.45),
    blueKnob: st('#2f5fb3', 0.45),
    sticker: st('#e6c62a', 0.6),
    mesh: new THREE.MeshStandardMaterial({ color: '#b9bec4', roughness: 0.45, metalness: 0.6, map: wire, alphaMap: wire, alphaTest: 0.35, side: THREE.DoubleSide }),
    screenRed: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3b1e').multiplyScalar(1.6), toneMapped: false }),
    screenLcd: new THREE.MeshBasicMaterial({ color: new THREE.Color('#9fc4d8').multiplyScalar(0.9), toneMapped: false }),
    perfBlack: new THREE.MeshStandardMaterial({ map: perfTex('#17181b', '#060607', 16, { r: 0.16 }), roughness: 0.55, metalness: 0.1 }),
    perfGrey: new THREE.MeshStandardMaterial({ map: perfTex('#a9aeb3', '#1a1b1e', 14, { square: true, r: 0.14 }), roughness: 0.45, metalness: 0.35 }),
    primer: m.primer, paintRed: m.paintRed, paintWhite: m.paintWhite, paintBlack: m.paintBlack,
  };
  return MM;
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);
function rod(a, b, r, mat, seg = 12) {
  const A = V(...a), B = V(...b), d = B.clone().sub(A), L = d.length();
  const m = cyl(r, L, mat, { seg }); m.position.copy(A).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m;
}
function bar(a, b, s, mat) {
  const A = V(...a), B = V(...b), d = B.clone().sub(A), L = d.length();
  const m = box(s, L, s, mat, Math.min(0.004, s * 0.2)); m.position.copy(A).addScaledVector(d, 0.5);
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m;
}
function bent(points, r, mat, { radial = 10, seg = 64 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => V(...p)), false, 'catmullrom', 0.5);
  return mesh(new THREE.TubeGeometry(curve, seg, r, radial, false), mat);
}
function coil(cx, cy, cz, R, r, turns, mat, { axis = 'x', pitch = 0.012, squash = 1 } = {}) {
  const pts = [], n = Math.round(turns * 28);
  for (let i = 0; i <= n; i++) {
    const a = i / 28 * Math.PI * 2, o = (i / n - 0.5) * pitch * turns;
    const u = Math.cos(a) * R, v = Math.sin(a) * R * squash;
    pts.push(axis === 'x' ? [cx + o, cy + v, cz + u] : axis === 'z' ? [cx + u, cy + v, cz + o] : [cx + u, cy + o, cz + v]);
  }
  return bent(pts, r, mat, { seg: n * 2, radial: 8 });
}
function caster(h = 0.11, wheel = 0.05, brake = false) {
  const M = mm(); const g = new THREE.Group();
  g.add(at(box(0.07, 0.008, 0.07, M.steel, 0.002), 0, h - 0.004, 0));
  g.add(at(cyl(0.02, 0.014, M.steel, { seg: 16 }), 0, h - 0.015, 0));
  const forkH = h - 0.022 - wheel * 0.6;
  [-1, 1].forEach(s => g.add(at(box(0.005, forkH + wheel * 0.5, 0.05, M.steel, 0.0015), s * 0.02, wheel + (forkH - wheel * 0.5) / 2 + 0.002, -0.008)));
  g.add(at(cyl(wheel, 0.028, M.rubber, { axis: 'x', seg: 24 }), 0, wheel, -0.012));
  g.add(at(cyl(wheel * 0.5, 0.032, M.chrome, { axis: 'x', seg: 16 }), 0, wheel, -0.012));
  if (brake) g.add(at(box(0.026, 0.006, 0.03, M.steel, 0.002), 0, wheel * 1.6, 0.03, -0.35, 0, 0));
  return g;
}
function casters(pts, h, wheel, brakeFirst = 2) {
  return group(pts.map(([x, z], i) => { const c = caster(h, wheel, i < brakeFirst); c.position.set(x, 0, z); c.rotation.y = (i * 1.3) % Math.PI; return c; }));
}
function tray(w, d, h, mat, rim = 0.022) {
  const g = group(at(box(w, h * 0.55, d, mat, 0.01), 0, h * 0.275, 0));
  g.add(at(box(w, h, rim, mat, 0.008), 0, h / 2, d / 2 - rim / 2), at(box(w, h, rim, mat, 0.008), 0, h / 2, -d / 2 + rim / 2));
  g.add(at(box(rim, h, d, mat, 0.008), w / 2 - rim / 2, h / 2, 0), at(box(rim, h, d, mat, 0.008), -w / 2 + rim / 2, h / 2, 0));
  return g;
}

export function miniSpotter() {
  const M = mm(); const g = new THREE.Group();
  const W = 0.4, zF = 0.24, zR = -0.16, zW = -0.42, yTop = 0.8, yMid = 0.5, yBot = 0.15;
  [-1, 1].forEach(s => {
    const x = s * W / 2;
    g.add(bar([x, 0.07, zF], [x, yTop, zF], 0.026, M.black));
    g.add(bar([x, yBot, zR], [x, 0.96, zR], 0.026, M.black));
    g.add(bar([x, yBot, zF], [x, yBot, zW + 0.02], 0.022, M.black));
    g.add(bar([x, yTop - 0.01, zF], [x, yTop - 0.01, zR], 0.02, M.black));
    g.add(bar([x, yMid - 0.01, zF], [x, yMid - 0.01, zR], 0.02, M.black));
    g.add(bar([x, yBot + 0.01, zF - 0.02], [x, yMid - 0.02, zR + 0.03], 0.018, M.black));
    const wx = s * (W / 2 + 0.035);
    g.add(at(cyl(0.1, 0.038, M.rubber, { axis: 'x', seg: 32 }), wx, 0.1, zW));
    g.add(at(cyl(0.07, 0.042, M.steel, { axis: 'x', seg: 24 }), wx, 0.1, zW));
    g.add(at(cyl(0.022, 0.05, M.chrome, { axis: 'x', seg: 12 }), wx, 0.1, zW));
  });
  g.add(rod([-W / 2 - 0.06, 0.1, zW], [W / 2 + 0.06, 0.1, zW], 0.008, M.steel));
  g.add(bar([-W / 2, yBot + 0.03, zW + 0.02], [-W / 2, 0.1, zW], 0.02, M.black), bar([W / 2, yBot + 0.03, zW + 0.02], [W / 2, 0.1, zW], 0.02, M.black));
  const shelf = (y, z0, z1, lip) => {
    const d = z0 - z1, zc = (z0 + z1) / 2;
    g.add(at(box(W + 0.02, 0.008, d, M.black, 0.002), 0, y, zc));
    g.add(at(box(W + 0.02, lip, 0.008, M.black, 0.002), 0, y + lip / 2, z0), at(box(W + 0.02, lip, 0.008, M.black, 0.002), 0, y + lip / 2, z1));
    [-1, 1].forEach(s => g.add(at(box(0.008, lip, d, M.black, 0.002), s * (W / 2 + 0.01), y + lip / 2, zc)));
  };
  shelf(yTop, zF + 0.02, zR - 0.01, 0.035); shelf(yMid, zF + 0.01, zR, 0.03); shelf(yBot, zF + 0.01, zW + 0.04, 0.04);
  g.add(at(box(W, 0.6, 0.006, M.black, 0.002), 0, 0.62, zR - 0.016));
  [0.62, 0.42].forEach(y => g.add(at(box(0.024, 0.05, 0.002, M.rubber, 0.001), 0.1, y + 0.2, zR - 0.02)));
  g.add(rod([-W / 2 - 0.01, 0.95, zR - 0.01], [W / 2 + 0.01, 0.95, zR - 0.01], 0.013, M.black));
  const chain = []; for (let i = 0; i < 9; i++) chain.push(at(mesh(new THREE.TorusGeometry(0.009, 0.0025, 6, 12), M.steel), 0.1 + (i % 2) * 0.002, 0.8 - i * 0.017, zR - 0.026, 0, (i % 2) * Math.PI / 2, 0));
  g.add(...chain);
  g.add(casters([[-W / 2, zF], [W / 2, zF]], 0.07, 0.034, 0));
  const cs = group();
  cs.add(at(box(0.181, 0.265, 0.32, M.silver, 0.012), 0, 0.1325, 0));
  cs.add(at(box(0.17, 0.25, 0.006, M.darkCase, 0.004), 0, 0.13, 0.161));
  cs.add(at(box(0.15, 0.095, 0.004, M.white, 0.003), 0, 0.19, 0.165));
  cs.add(at(box(0.045, 0.02, 0.003, M.screenRed, 0.001), -0.03, 0.212, 0.168));
  [[-0.05, 0.172], [-0.02, 0.172], [0.01, 0.172], [0.04, 0.2], [0.04, 0.18], [0.04, 0.16]].forEach(([x, y]) => cs.add(at(box(0.016, 0.01, 0.004, M.sticker, 0.002), x, y, 0.168)));
  [-0.04, 0.035].forEach(x => { cs.add(at(cyl(0.018, 0.02, M.rubber, { axis: 'z', seg: 18 }), x, 0.075, 0.172)); cs.add(at(cyl(0.008, 0.024, M.copper, { axis: 'z', seg: 10 }), x, 0.075, 0.175)); });
  cs.add(bent([[0, 0.265, 0.1], [0, 0.33, 0.07], [0, 0.345, 0], [0, 0.33, -0.07], [0, 0.265, -0.1]], 0.012, M.blackPl, { seg: 24 }));
  at(cs, 0, yTop + 0.008, 0.03); g.add(cs);
  g.add(bent([[-0.04, yTop + 0.083, 0.22], [-0.05, yTop - 0.05, 0.27], [-0.12, yTop - 0.2, 0.27], [-0.24, yTop - 0.24, 0.12], [-0.25, yTop - 0.05, -0.05], [-0.22, 0.95, zR - 0.03]], 0.008, M.cable));
  g.add(coil(-W / 2 - 0.04, 0.72, zR - 0.08, 0.13, 0.008, 2.2, M.cable, { axis: 'x', squash: 1.25 }));
  g.add(bent([[0.035, yTop + 0.083, 0.22], [0.05, yTop - 0.08, 0.28], [0.12, yTop - 0.32, 0.27], [0.16, yMid + 0.03, 0.1], [0.12, yMid + 0.012, -0.05]], 0.009, M.cable));
  g.add(at(coil(0.04, yMid + 0.02, -0.02, 0.1, 0.009, 2, M.cable, { axis: 'y', pitch: 0.008 }), 0, 0, 0));
  const gun = group(
    at(cyl(0.017, 0.16, M.blackPl, { seg: 16 }), 0, 0.08, 0),
    at(cyl(0.024, 0.06, M.chrome, { seg: 16 }), 0, -0.04, 0),
    at(cyl(0.006, 0.12, M.steel, { seg: 10 }), 0, -0.06, 0),
    at(cyl(0.011, 0.035, M.copper, { seg: 12, r2: 0.004 }), 0, -0.135, 0),
  );
  at(gun, -0.15, yTop - 0.3, 0.29, 0.12, 0, 0.18); gun.rotation.set(0.12, 0, 0.18); g.add(gun);
  g.add(bent([[-0.15, yTop - 0.14, 0.27], [-0.13, yTop - 0.02, 0.24], [-0.06, yTop + 0.06, 0.2]], 0.007, M.cable, { seg: 20 }));
  return g;
}

export function arcPuller() {
  const M = mm(); const g = new THREE.Group();
  const L = 0.82, D = 0.46, yT = 0.82;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    g.add(at(box(0.04, yT - 0.2, 0.03, M.alu, 0.012), sx * (L / 2 - 0.05), 0.2 + (yT - 0.2) / 2, sz * (D / 2 - 0.05)));
    g.add(at(box(0.05, 0.05, 0.04, M.blackPl, 0.01), sx * (L / 2 - 0.05), 0.2, sz * (D / 2 - 0.05)));
  });
  const top = tray(L, D, 0.06, M.blackPl, 0.03); at(top, 0, yT, 0); g.add(top);
  const bot = tray(L - 0.04, D - 0.02, 0.05, M.blackPl, 0.025); at(bot, 0, 0.17, 0); g.add(bot);
  g.add(at(box(L - 0.14, 0.17, D - 0.1, M.darkCase, 0.006), 0, yT - 0.09, 0));
  [0, 1].forEach(i => {
    const y = yT - 0.045 - i * 0.085;
    g.add(at(box(L - 0.16, 0.075, 0.012, M.lightPanel, 0.004), 0, y, D / 2 - 0.044));
    g.add(at(box(L - 0.2, 0.012, 0.02, M.alu, 0.004), 0, y + 0.03, D / 2 - 0.032));
  });
  [-1, 1].forEach(s => g.add(bent([[s * (L / 2 - 0.02), yT + 0.03, D / 2 - 0.07], [s * (L / 2 + 0.06), yT + 0.07, D / 2 - 0.1], [s * (L / 2 + 0.08), yT + 0.08, 0], [s * (L / 2 + 0.06), yT + 0.07, -D / 2 + 0.1], [s * (L / 2 - 0.02), yT + 0.03, -D / 2 + 0.07]], 0.019, M.blackPl, { seg: 32 })));
  g.add(casters([[-L / 2 + 0.06, -D / 2 + 0.06], [L / 2 - 0.06, -D / 2 + 0.06], [-L / 2 + 0.06, D / 2 - 0.06], [L / 2 - 0.06, D / 2 - 0.06]], 0.12, 0.05, 2));
  const zP = -D / 2 + 0.03, yP0 = yT + 0.06, yP1 = yT + 0.5;
  [-1, 1].forEach(s => g.add(at(box(0.03, yP1 - yT + 0.08, 0.025, M.alu, 0.008), s * (L / 2 - 0.08), yT + (yP1 - yT + 0.08) / 2, zP - 0.012)));
  g.add(at(box(L - 0.18, yP1 - yP0, 0.008, M.perfGrey, 0.003), 0, (yP0 + yP1) / 2, zP));
  const yB = yP1 + 0.06;
  g.add(at(box(L + 0.1, 0.03, 0.03, M.alu, 0.006), 0, yB, zP + 0.01));
  [-1, 1].forEach(s => {
    g.add(at(box(0.04, 0.06, 0.05, M.steel, 0.006), s * (L / 2 + 0.03), yB, zP + 0.01));
    g.add(bar([s * (L / 2 + 0.03), yB - 0.02, zP + 0.01], [s * (L / 2 + 0.03), yB - 0.2, zP + 0.02], 0.02, M.steel));
    const pad = at(box(0.07, 0.022, 0.06, M.rubber, 0.008), s * (L / 2 + 0.06), yB - 0.22, zP + 0.03); pad.rotation.z = s * 0.6; g.add(pad);
  });
  g.add(at(box(0.05, 0.06, 0.05, M.steel, 0.006), 0, yB, zP + 0.015));
  g.add(at(cyl(0.007, 0.32, M.chrome, { seg: 10 }), 0, yB - 0.03, zP + 0.04));
  g.add(at(box(0.11, 0.016, 0.02, M.blackPl, 0.006), 0, yB + 0.13, zP + 0.04));
  [-0.25, -0.12, 0.13, 0.25].forEach((x, i) => {
    g.add(at(cyl(0.011, 0.25, M.wood, { seg: 10 }), x, yP1 - 0.2, zP + 0.04));
    g.add(at(box(0.1 - (i % 2) * 0.02, 0.026, 0.026, M.steel, 0.006), x, yP1 - 0.07, zP + 0.04));
    g.add(at(box(0.03, 0.02, 0.02, M.steel, 0.004), x, yP1 - 0.05, zP + 0.02));
  });
  const ap = group(
    at(box(0.13, 0.22, 0.28, M.darkCase, 0.012), 0, 0.11, 0),
    at(box(0.07, 0.045, 0.004, M.screenLcd, 0.002), -0.02, 0.17, 0.141),
    at(cyl(0.012, 0.012, M.sticker, { axis: 'z', seg: 16 }), 0.035, 0.17, 0.146),
    at(box(0.1, 0.004, 0.003, M.blackPl, 0.001), 0, 0.06, 0.141), at(box(0.1, 0.004, 0.003, M.blackPl, 0.001), 0, 0.075, 0.141),
    bent([[0, 0.22, 0.08], [0, 0.27, 0.05], [0, 0.27, -0.05], [0, 0.22, -0.08]], 0.01, M.blackPl, { seg: 16 }),
  );
  at(ap, -0.04, yT + 0.035, -0.02); g.add(ap);
  g.add(coil(0.2, yT + 0.05, 0.02, 0.1, 0.009, 2.4, M.cable, { axis: 'y', pitch: 0.008 }));
  const gun = group(at(box(0.04, 0.05, 0.16, M.blackPl, 0.012), 0, 0, 0), at(cyl(0.012, 0.06, M.copper, { axis: 'z', seg: 12 }), 0, 0, 0.1), at(box(0.025, 0.08, 0.035, M.blackPl, 0.008), 0, -0.05, -0.04));
  gun.rotation.set(0, 0.5, Math.PI / 2); at(gun, 0.3, yT + 0.06, 0.07); gun.rotation.set(0, 0.5, Math.PI / 2); g.add(gun);
  g.add(at(box(0.16, 0.035, 0.11, M.whiteBox, 0.006), -0.27, yT + 0.05, 0.05));
  return g;
}

function palmSander() {
  const M = mm();
  const s = group(
    at(cyl(0.075, 0.013, M.yellowPl, { seg: 32 }), 0, 0.0065, 0),
    at(cyl(0.07, 0.014, M.blackPl, { seg: 28 }), 0, 0.02, 0),
    at(cyl(0.052, 0.04, M.blackPl, { seg: 24, r2: 0.058 }), 0, 0.047, 0),
    at(cyl(0.056, 0.008, M.redRing, { seg: 24 }), 0, 0.068, 0),
    at(cyl(0.045, 0.03, M.yellowPl, { seg: 24, r2: 0.05 }), 0, 0.087, 0),
    at(box(0.055, 0.006, 0.09, M.chrome, 0.003), 0, 0.104, -0.035),
    at(cyl(0.017, 0.11, M.blackPl, { axis: 'z', seg: 14 }), 0, 0.06, -0.1),
    at(cyl(0.02, 0.05, M.blackPl, { axis: 'z', seg: 14 }), 0, 0.06, -0.17),
  );
  return s;
}
const KOR_TRAY = 0.98 + 0.03;
const SANDERS = [[-0.15, 0.06, 0.4], [0.15, -0.02, -0.5]];
const SANDER_PORTS = SANDERS.map(([x, z, ry]) => [x - 0.195 * Math.sin(ry), KOR_TRAY + 0.06, z - 0.195 * Math.cos(ry)]);
export function sanders() {
  const g = new THREE.Group();
  SANDERS.forEach(([x, z, ry]) => { const ps = palmSander(); ps.rotation.y = ry; at(ps, x, KOR_TRAY, z); ps.rotation.y = ry; g.add(ps); });
  return g;
}
export function koriolis() {
  const M = mm(); const g = new THREE.Group();
  const W = 0.58, D = 0.62, y0 = 0.12, yT = 0.98;
  g.add(at(box(W + 0.05, 0.07, D + 0.04, M.darkCase, 0.01), 0, y0 + 0.035, 0));
  g.add(at(box(W, yT - y0 - 0.07, D, M.darkCase, 0.012), 0, y0 + 0.07 + (yT - y0 - 0.07) / 2, 0));
  const tt = tray(W + 0.1, D + 0.12, 0.05, M.blackPl, 0.028); at(tt, 0, yT, 0); g.add(tt);
  g.add(casters([[-W / 2 + 0.05, -D / 2 + 0.05], [W / 2 - 0.05, -D / 2 + 0.05], [-W / 2 + 0.05, D / 2 - 0.05], [W / 2 - 0.05, D / 2 - 0.05]], y0, 0.04, 2));
  const zF = D / 2;
  g.add(at(box(0.22, 0.16, 0.06, M.white, 0.01), 0.08, 0.8, zF + 0.03));
  [0.04, 0.11].forEach(x => g.add(at(box(0.05, 0.055, 0.012, M.blackPl, 0.006), x, 0.77, zF + 0.064)));
  g.add(at(box(0.014, 0.026, 0.01, M.blackPl, 0.003), 0.02, 0.845, zF + 0.064), at(box(0.014, 0.026, 0.01, M.screenRed, 0.003), 0.045, 0.845, zF + 0.064));
  g.add(at(box(0.045, 0.06, 0.004, M.sticker, 0.002), 0.165, 0.81, zF + 0.061));
  g.add(at(cyl(0.018, 0.08, M.chrome, { seg: 14 }), -0.16, 0.78, zF + 0.04));
  g.add(at(cyl(0.022, 0.012, M.white, { axis: 'z', seg: 18 }), -0.16, 0.835, zF + 0.05));
  g.add(at(cyl(0.014, 0.04, M.filmRoll, { seg: 12 }), -0.16, 0.725, zF + 0.04));
  g.add(rod([-0.16, 0.78, zF + 0.04], [-0.04, 0.78, zF + 0.04], 0.006, M.chrome));
  g.add(at(box(0.1, 0.1, 0.012, M.blackPl, 0.01), 0, 0.52, zF + 0.006));
  g.add(at(cyl(0.03, 0.06, M.blackPl, { axis: 'z', seg: 16 }), 0, 0.52, zF + 0.04));
  [-1, 1].forEach(s => {
    const x = s * (W / 2 + 0.035);
    g.add(bent([[x, 0.94, 0.08], [x + s * 0.05, 0.94, 0.08], [x + s * 0.06, 0.88, 0.08]], 0.006, M.chrome, { seg: 10, radial: 6 }));
    g.add(at(cyl(0.008, 0.012, M.blueKnob, { seg: 8 }), x + s * 0.06, 0.87, 0.08));
    g.add(coil(x + s * 0.03, 0.62, 0.0, 0.22, 0.021, 2, M.hose, { axis: 'x', pitch: 0.03, squash: 1.35 }));
    g.add(bent([[s * 0.02, 0.52, zF + 0.07], [s * 0.12, 0.42, zF + 0.1], [s * (W / 2 - 0.02), 0.32, zF + 0.04], [x + s * 0.03, 0.36, 0.16]], 0.021, M.hose, { seg: 48 }));
    const port = SANDER_PORTS[s < 0 ? 0 : 1];
    g.add(bent([[x + s * 0.03, 0.9, 0.04], [x + s * 0.01, yT + 0.13, -0.02], [port[0] + s * 0.06, yT + 0.11, port[2] - 0.08], [port[0], port[1], port[2] - 0.02]], 0.017, M.hose, { seg: 40 }));
    g.add(at(cyl(0.022, 0.03, M.blackPl, { axis: 'z', seg: 12 }), port[0], port[1], port[2] - 0.01));
  });
  return g;
}

export function maskingTrolley() {
  const M = mm(); const g = new THREE.Group();
  const L = 1.5, D = 0.52, H = 1.0, r = 0.015;
  [-1, 1].forEach(s => {
    const x = s * L / 2;
    g.add(bent([[x, 0.12, D / 2], [x, H - 0.08, D / 2], [x, H - 0.01, D / 2 - 0.05], [x, H, D / 2 - 0.12], [x, H, -D / 2 + 0.12], [x, H - 0.01, -D / 2 + 0.05], [x, H - 0.08, -D / 2], [x, 0.12, -D / 2]], r, M.grey, { seg: 72 }));
    [0.3, 0.52, 0.74].forEach(y => g.add(rod([x, y, D / 2], [x, y, -D / 2], r * 0.8, M.grey)));
    g.add(rod([x, 0.12, D / 2], [x, 0.12, -D / 2], r, M.grey));
  });
  [D / 2, -D / 2].forEach(z => g.add(rod([-L / 2, 0.12, z], [L / 2, 0.12, z], r, M.grey)));
  g.add(rod([-L / 2, H - 0.06, -D / 2 + 0.02], [L / 2, H - 0.06, -D / 2 + 0.02], r * 0.9, M.grey));
  g.add(at(box(L - 0.02, 0.02, 0.26, M.blackPl, 0.006), 0, H - 0.02, -0.05));
  g.add(casters([[-L / 2 + 0.03, -D / 2], [L / 2 - 0.03, -D / 2], [-L / 2 + 0.03, D / 2], [L / 2 - 0.03, D / 2]], 0.11, 0.045, 2));
  const rolls = [[0.27, 0.06, 0.075, 0.9, -0.28, M.kraft], [0.49, 0.06, 0.07, 1.2, -0.13, M.kraft], [0.72, 0.08, 0.065, 1.3, 0.0, M.filmRoll]];
  rolls.forEach(([y, z, rr, w, xo, mat]) => {
    g.add(rod([-L / 2, y, z], [L / 2, y, z], 0.009, M.steel, 8));
    g.add(at(cyl(rr, w, mat, { axis: 'x', seg: 36 }), xo, y, z));
    g.add(at(cyl(0.032, w + 0.01, M.card, { axis: 'x', seg: 18 }), xo, y, z));
    g.add(at(box(L - 0.04, 0.03, 0.005, M.steel, 0.001), 0, y - rr * 0.35, z + rr + 0.03));
  });
  g.add(at(box(0.9, 0.001, 0.12, M.kraft, 0), -0.28, 0.27 - 0.026, 0.06 + 0.075 + 0.06));
  const sheet = mesh(new THREE.PlaneGeometry(0.9, 0.42), M.filmSheet); at(sheet, 0.2, 0.72 - 0.25, 0.08 + 0.065 + 0.035); g.add(sheet);
  const pap = mesh(new THREE.PlaneGeometry(0.85, 0.18), M.kraft); at(pap, -0.28, 0.27 - 0.12, 0.06 + 0.075 + 0.035); g.add(pap);
  return g;
}

export function evo7() {
  const M = mm(); const g = new THREE.Group();
  const W = 0.775, D = 0.459, H = 1.0, yB = 0.12, yT = 0.94;
  const bw = W - 0.06;
  g.add(at(box(bw, yT - yB, D - 0.02, M.black, 0.01), 0, (yB + yT) / 2, 0));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(at(box(0.045, yT - yB + 0.02, 0.045, M.black, 0.012), sx * (bw / 2 - 0.005), (yB + yT) / 2, sz * (D / 2 - 0.02))));
  [-1, 1].forEach(s => { const p = at(box(0.004, yT - yB - 0.1, D - 0.1, M.perfBlack, 0.001), s * (bw / 2 + 0.002), (yB + yT) / 2 - 0.02, 0); g.add(p); });
  const tt = tray(W, D, H - yT, M.blackPl, 0.035); at(tt, 0, yT, 0); g.add(tt);
  g.add(at(box(0.18, 0.03, 0.09, M.blackPl, 0.006), -W / 2 + 0.16, yT + 0.03, -D / 2 + 0.09));
  g.add(at(cyl(0.011, 0.012, M.chrome, { axis: 'z', seg: 14 }), 0, yT - 0.035, D / 2 + 0.004));
  const ratios = [1, 1, 1, 1, 1.2, 1.5, 1.9], sum = ratios.reduce((a, b) => a + b, 0), gap = 0.006;
  let y = yT - 0.07; const usable = y - (yB + 0.04) - gap * (ratios.length - 1);
  ratios.forEach(rt => {
    const h = usable * rt / sum; y -= h / 2;
    g.add(at(box(bw - 0.07, h - 0.004, 0.012, M.slate, 0.003), 0, y, D / 2 - 0.006));
    g.add(at(box(bw - 0.07, 0.014, 0.024, M.slate, 0.004), 0, y + h / 2 - 0.01, D / 2 + 0.006));
    y -= h / 2 + gap;
  });
  const hx = W / 2 + 0.005;
  [[yT - 0.06, -0.06], [yT - 0.3, -0.12]].forEach(([yy, zz]) => g.add(at(box(0.05, 0.05, 0.045, M.lightPanel, 0.008), hx, yy, zz)));
  g.add(bent([[hx + 0.02, yT - 0.06, -0.06], [hx + 0.08, yT - 0.08, -0.05], [hx + 0.1, yT - 0.18, -0.08], [hx + 0.08, yT - 0.3, -0.12], [hx + 0.02, yT - 0.3, -0.12]], 0.018, M.blackPl, { seg: 32 }));
  g.add(casters([[-W / 2 + 0.07, D / 2 - 0.07], [W / 2 - 0.07, D / 2 - 0.07], [-W / 2 + 0.07, -D / 2 + 0.07], [W / 2 - 0.07, -D / 2 + 0.07]], yB, 0.05, 2));
  return g;
}

export function partsCart() {
  const M = mm(); const g = new THREE.Group();
  const W = 0.9, D = 0.6, H = 1.95, y0 = 0.12, s = 0.026;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(bar([sx * (W / 2 - s / 2), y0, sz * (D / 2 - s / 2)], [sx * (W / 2 - s / 2), H, sz * (D / 2 - s / 2)], s, M.grey)));
  const ring4 = y => {
    [-1, 1].forEach(sz => g.add(bar([-W / 2, y, sz * (D / 2 - s / 2)], [W / 2, y, sz * (D / 2 - s / 2)], s * 0.8, M.grey)));
    [-1, 1].forEach(sx => g.add(bar([sx * (W / 2 - s / 2), y, -D / 2], [sx * (W / 2 - s / 2), y, D / 2], s * 0.8, M.grey)));
  };
  [y0 + 0.08, 0.88, H - 0.01].forEach(ring4);
  [y0 + 0.1, 0.9].forEach(y => g.add(at(box(W - 0.03, 0.018, D - 0.03, M.ply, 0.003), 0, y, 0)));
  const yM0 = 0.92, yM1 = H - 0.03, hM = yM1 - yM0;
  [-1, 1].forEach(sx => {
    const p = mesh(new THREE.PlaneGeometry((W - 0.08) / 2, hM), M.mesh); at(p, sx * (W / 4 - 0.01), yM0 + hM / 2, -D / 2 + 0.03); g.add(p);
    g.add(bar([sx * 0.012, yM0, -D / 2 + 0.03], [sx * 0.012, yM1, -D / 2 + 0.03], 0.02, M.grey));
    const sp = mesh(new THREE.PlaneGeometry(D - 0.06, hM), M.mesh); sp.rotation.y = Math.PI / 2; at(sp, sx * (W / 2 - 0.02), yM0 + hM / 2, 0); sp.rotation.y = Math.PI / 2; g.add(sp);
    g.add(bar([sx * (W / 2), 0.9, D / 2 - 0.02], [sx * (W / 2 + 0.16), 0.9, D / 2 - 0.02], 0.02, M.grey));
    g.add(rod([sx * (W / 2 + 0.15), 0.9, D / 2 - 0.02], [sx * (W / 2 - 0.01), H - 0.02, D / 2 - 0.02], 0.004, M.steel, 6));
  });
  const bk = group(); const bw = 0.34, bh = 0.12, bd = 0.17;
  const bp = (w, h, x, y, z, ry = 0) => { const p = mesh(new THREE.PlaneGeometry(w, h), M.mesh); p.rotation.y = ry; at(p, x, y, z); p.rotation.y = ry; bk.add(p); };
  bp(bw, bh, 0, 0, bd / 2); bp(bd, bh, -bw / 2, 0, 0, Math.PI / 2); bp(bd, bh, bw / 2, 0, 0, Math.PI / 2);
  const bb = mesh(new THREE.PlaneGeometry(bw, bd), M.mesh); bb.rotation.x = -Math.PI / 2; at(bb, 0, -bh / 2, 0); bb.rotation.x = -Math.PI / 2; bk.add(bb);
  at(bk, W / 4, 1.14, -D / 2 + 0.03 + bd / 2); g.add(bk);
  g.add(bar([0.06, 1.72, -D / 2 + 0.06], [W / 2 - 0.05, 1.72, -D / 2 + 0.06], 0.016, M.grey));
  [0.12, 0.24, 0.36].forEach(x => g.add(bent([[x, 1.72, -D / 2 + 0.06], [x, 1.72, -D / 2 + 0.12], [x, 1.75, -D / 2 + 0.14]], 0.004, M.steel, { seg: 8, radial: 6 })));
  g.add(at(box(0.22, 0.3, 0.008, M.card, 0.003), W / 4 + 0.02, 1.48, -D / 2 + 0.045));
  g.add(at(box(0.19, 0.25, 0.002, M.white, 0.001), W / 4 + 0.02, 1.46, -D / 2 + 0.05));
  g.add(at(box(0.08, 0.02, 0.012, M.steel, 0.003), W / 4 + 0.02, 1.62, -D / 2 + 0.052));
  g.add(casters([[-W / 2 + 0.03, -D / 2 + 0.03], [W / 2 - 0.03, -D / 2 + 0.03], [-W / 2 + 0.03, D / 2 - 0.03], [W / 2 - 0.03, D / 2 - 0.03]], y0, 0.05, 2));
  [[-0.2, y0 + 0.11, 0.0, 0.34, 0.26, 0.4], [0.2, y0 + 0.11, 0.02, 0.3, 0.18, 0.36], [-0.12, 0.91, 0.04, 0.46, 0.14, 0.32]].forEach(([x, y, z, w, h, d], i) => g.add(at(box(w, h, d, M.card, 0.004), x, y + h / 2, z, 0, (i - 1) * 0.05, 0)));
  return g;
}

function bumperCover(mat, { half = 0.6, wrapR = 0.3, wrapDeg = 80, height = 0.42 } = {}) {
  const path = [], nArc = 12, nMid = 14, wr = wrapDeg * Math.PI / 180;
  for (let i = nArc; i >= 1; i--) { const a = Math.PI / 2 + wr * (i / nArc); path.push([-half + wrapR * Math.cos(a), -wrapR + wrapR * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  for (let i = 0; i <= nMid; i++) path.push([-half + 2 * half * (i / nMid), 0, 0, 1]);
  for (let i = 1; i <= nArc; i++) { const a = Math.PI / 2 - wr * (i / nArc); path.push([half + wrapR * Math.cos(a), -wrapR + wrapR * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  const Hh = height / 2;
  const sec = [[0.11, Hh], [0.05, Hh * 0.98], [0.008, Hh * 0.86], [-0.012, Hh * 0.5], [-0.018, Hh * 0.05], [-0.014, -Hh * 0.35], [0.0, -Hh * 0.72], [0.035, -Hh * 0.93], [0.1, -Hh]];
  const verts = [], idx = [];
  path.forEach(([x, z, nx, nz]) => sec.forEach(([d, y]) => verts.push(x - nx * d, y, z - nz * d)));
  const S = sec.length;
  for (let i = 0; i < path.length - 1; i++) for (let j = 0; j < S - 1; j++) { const a = i * S + j, b = (i + 1) * S + j, c = (i + 1) * S + j + 1, d = i * S + j + 1; idx.push(a, d, b, b, d, c); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(verts.length / 3 * 2), 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return mesh(geo, mat);
}
export function bumperRack() {
  const M = mm(); const g = new THREE.Group();
  const px = 0.16, y0 = 0.1, H = 1.78, levels = [0.66, 0.98, 1.3, 1.62], arm = 0.34, r = 0.013;
  [-1, 1].forEach(sz => g.add(bar([-0.36, y0, sz * 0.36], [0.36, y0, sz * 0.36], 0.03, M.zinc)));
  g.add(bar([0, y0, -0.36], [0, y0, 0.36], 0.03, M.zinc));
  [-1, 1].forEach(sx => g.add(bar([sx * px, y0, 0], [sx * px, H, 0], 0.032, M.zinc)));
  g.add(bar([-px - 0.02, y0 + 0.02, 0], [px + 0.02, y0 + 0.02, 0], 0.03, M.zinc));
  g.add(bar([-px - 0.02, H, 0], [px + 0.02, H, 0], 0.028, M.zinc));
  levels.forEach((y, i) => {
    g.add(bar([-px - 0.04, y, 0], [px + 0.04, y, 0], 0.024, M.zinc));
    [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
      const x = sx * (px + 0.03);
      g.add(rod([x, y, 0], [x, y + 0.03, sz * arm], r, M.zinc, 10));
      g.add(at(cyl(r + 0.006, 0.03, M.blackPl, { axis: 'z', seg: 10 }), x, y + 0.03, sz * (arm + 0.01)));
    }));
    if (i === 2) { g.add(at(cyl(0.02, 0.012, M.blueKnob, { axis: 'x', seg: 6 }), -px - 0.06, y, 0.02)); }
  });
  g.add(casters([[-0.36, -0.36], [0.36, -0.36], [-0.36, 0.36], [0.36, 0.36]], y0 - 0.015, 0.04, 2));
  [[1, 3, M.paintRed], [1, 1, M.paintWhite], [-1, 2, M.paintBlack]].forEach(([side, i, mat]) => {
    const b = group(bumperCover(mat, { half: 0.52, wrapR: 0.28, height: 0.36 }));
    b.add(at(box(0.62, 0.075, 0.03, M.blackPl, 0.012), 0, -0.085, 0.004));
    [-1, 1].forEach(sx => b.add(at(cyl(0.035, 0.03, M.blackPl, { axis: 'z', seg: 18 }), sx * 0.43, -0.07, -0.004)));
    b.add(at(box(0.36, 0.09, 0.012, M.blackPl, 0.004), 0, 0.045, 0.012));
    b.rotation.y = side > 0 ? 0 : Math.PI; at(b, 0, levels[i] + 0.04, side * (arm + 0.04)); b.rotation.set(0, side > 0 ? 0 : Math.PI, 0);
    g.add(b);
  });
  return g;
}

export function panelStand() {
  const M = mm(); const g = new THREE.Group();
  const zF = 0.42, zT = 0.36, yF = 0.085, yT = 0.88, half = 0.37, s = 0.034;
  [-1, 1].forEach(sz => {
    g.add(bar([0, yF + s / 2, sz * zF], [0, yT - 0.02, -sz * zT], s, M.yellow));
    g.add(bar([-half, yF, sz * zF], [half, yF, sz * zF], s, M.yellow));
    g.add(at(cyl(0.036, 0.1, M.yellow, { axis: 'x', seg: 18 }), 0, yT, -sz * zT));
    [-1, 1].forEach(sx => g.add(at(cyl(0.04, half - 0.05, M.foam, { axis: 'x', seg: 20 }), sx * (0.05 + (half - 0.05) / 2), yT, -sz * zT)));
    [-1, 1].forEach(sx => g.add(at(cyl(0.03, 0.012, M.yellow, { axis: 'x', seg: 18 }), sx * (half + 0.006), yT, -sz * zT)));
  });
  g.add(at(cyl(0.012, 0.09, M.chrome, { axis: 'x', seg: 12 }), 0, (yF + yT) / 2 + 0.01, 0));
  const ya = 0.66, za = 0.15;
  for (let i = 0; i <= 10; i++) {
    const u = i / 10, z = lerp(-za, za, u), y = ya - 0.03 * Math.sin(u * Math.PI);
    const l = mesh(new THREE.TorusGeometry(0.008, 0.0022, 6, 12), M.steel); l.rotation.set(0, i % 2 ? 0 : Math.PI / 2, 0); at(l, 0.03, y, z); l.rotation.set(0, i % 2 ? Math.PI / 2 : 0, 0); g.add(l);
  }
  g.add(casters([[-half + 0.02, -zF], [half - 0.02, -zF], [-half + 0.02, zF], [half - 0.02, zF]], yF - s / 2, 0.035, 2));
  return g;
}
function lerp(a, b, t) { return a + (b - a) * t; }

export const MT = {
  'mt-spotter': miniSpotter,
  'mt-arcpuller': arcPuller,
  'mt-koriolis': koriolis,
  'mt-sanders': sanders,
  'mt-masking': maskingTrolley,
  'mt-evo7': evo7,
  'mt-parts': partsCart,
  'mt-bumper': bumperRack,
  'mt-panel': panelStand,
};
export function buildMT(id) { const fn = MT[id]; if (!fn) return null; const o = fn(); o.name = id; return o; }
