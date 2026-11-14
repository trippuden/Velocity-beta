import {
  THREE, mats, mesh, box, cyl, ring, tube, at, group, decal, caster, casterSet,
  wordmarkTexture, labelTexture, targetTexture, rulerTexture, screenTexture, qrPlacardTexture, boxLabelTexture,
} from './three-kit.js';

const CH = 0.11;

function hs(n, label, pos) { return { n, label, pos }; }


export function adasFrame({ variant = 'pro', lift = null, laserKit = true } = {}) {
  const m = mats();
  const pro = variant === 'pro';
  const g = new THREE.Group();
  const halfW = pro ? 0.56 : 0.44;
  const footLen = pro ? 1.0 : 0.84;
  const footY = CH + 0.035;

  if (pro) {
    [-1, 1].forEach(s => g.add(at(box(0.1, 0.07, footLen, m.powder, 0.012), s * halfW, footY, 0)));
    g.add(at(box(halfW * 2 - 0.02, 0.07, 0.12, m.powder, 0.012), 0, footY, 0));
    g.add(at(box(0.38, 0.026, 0.3, m.powderLight, 0.006), 0, footY + 0.048, 0));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
      const c = caster(CH, { brake: true }); c.position.set(sx * halfW, 0, sz * (footLen / 2 - 0.06)); c.rotation.y = i * 0.7; g.add(c);
    });
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(([sx, sz]) => {
      const x = sx * halfW, z = sz * (footLen / 2 - 0.22);
      g.add(at(cyl(0.008, 0.15, m.steel, { seg: 12 }), x, 0.095, z));
      g.add(at(cyl(0.03, 0.012, m.rubber, { seg: 24 }), x, 0.006, z));
      g.add(at(cyl(0.03, 0.02, m.signal, { seg: 6 }), x, footY + 0.045, z));
    });
  } else {
    g.add(at(box(halfW * 2, 0.06, 0.1, m.powder, 0.012), 0, footY, 0));
    g.add(at(box(0.1, 0.06, footLen, m.powder, 0.012), 0, footY, 0));
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([sx, sz], i) => {
      const c = caster(CH, { brake: i < 2 }); c.position.set(sx * (halfW - 0.04), 0, sz * (footLen / 2 - 0.05)); c.rotation.y = i; g.add(c);
    });
  }

  const colH = pro ? 1.95 : 1.72;
  const colBase = footY + 0.035;
  const colTop = colBase + colH;
  g.add(at(box(0.13, colH, 0.11, m.powder, 0.01), 0, colBase + colH / 2, 0));
  g.add(at(box(0.042, colH - 0.12, 0.012, m.steel, 0.003), 0, colBase + colH / 2, 0.06));
  const vr = decal(rulerTexture(2000), colH - 0.3, 0.05);
  vr.rotation.set(0, Math.PI / 2, Math.PI / 2); at(vr, 0.0656, colBase + colH / 2 - 0.05, 0); vr.rotation.set(0, Math.PI / 2, Math.PI / 2);
  g.add(vr);
  const wmSide = decal(wordmarkTexture('#ffffff'), 0.42, 0.079);
  wmSide.rotation.set(0, -Math.PI / 2, Math.PI / 2); wmSide.position.set(-0.0656, colBase + colH * 0.72, 0);
  g.add(wmSide);

  if (pro) {
    g.add(at(box(0.23, 0.17, 0.2, m.powder, 0.016), 0, colTop + 0.085, 0.005));
    g.add(at(box(0.232, 0.022, 0.202, m.signal, 0.008), 0, colTop + 0.17, 0.005));
    const wm = decal(wordmarkTexture('#ffffff'), 0.19, 0.036); at(wm, 0, colTop + 0.085, 0.1065); g.add(wm);
  } else {
    g.add(at(box(0.15, 0.035, 0.13, m.signal, 0.01), 0, colTop + 0.017, 0));
    const crank = group(
      at(cyl(0.05, 0.02, m.powderLight, { axis: 'x', seg: 28 }), 0, 0, 0),
      at(box(0.012, 0.11, 0.02, m.steel, 0.005), 0.016, -0.04, 0),
      at(cyl(0.012, 0.06, m.signal, { axis: 'x', seg: 16 }), 0.05, -0.09, 0),
    );
    at(crank, 0.075, colBase + 0.95, 0); g.add(crank);
  }

  const H = lift ?? (pro ? 1.24 : 1.1);
  const barL = pro ? 2.3 : 1.7;
  const cross = new THREE.Group();
  cross.name = 'carriage';
  cross.add(at(box(0.25, 0.27, 0.2, m.powderLight, 0.014), 0, 0, 0.025));
  [-1, 1].forEach(s => cross.add(at(cyl(0.03, 0.032, m.signal, { axis: 'x', seg: 28 }), s * 0.142, 0.07, 0.05)));
  cross.add(at(box(0.012, 0.1, 0.014, m.steel, 0.005), 0.16, -0.07, 0.07));
  cross.add(at(box(barL, 0.08, 0.1, m.powder, 0.01), 0, 0, 0.17));
  const ruler = decal(rulerTexture(Math.round(barL * 1000)), barL - 0.24, 0.034); at(ruler, 0, 0.013, 0.2206); cross.add(ruler);
  const lasers = [];
  if (laserKit) {
    [-1, 1].forEach(s => {
      const lm = group(
        box(0.1, 0.1, 0.14, m.powderDeep, 0.014),
        at(box(0.102, 0.022, 0.142, m.signal, 0.006), 0, 0.05, 0),
        at(cyl(0.017, 0.012, m.lens, { axis: 'z', seg: 24 }), 0, -0.012, 0.072),
      );
      at(lm, s * (barL / 2 + 0.03), 0, 0.18); cross.add(lm);
      lasers.push([s * (barL / 2 + 0.03), -0.012, 0.26]);
    });
    cross.add(at(box(0.07, 0.05, 0.08, m.powderDeep, 0.01), 0, -0.065, 0.2));
    cross.add(at(cyl(0.012, 0.01, m.lens, { axis: 'z', seg: 20 }), 0, -0.07, 0.242));
  } else {
    [-1, 1].forEach(s => cross.add(at(box(0.03, 0.094, 0.114, m.signal, 0.008), s * (barL / 2 + 0.012), 0, 0.17)));
  }
  const tW = pro ? 1.0 : 0.82, tH = pro ? 0.62 : 0.5;
  [-1, 1].forEach(s => {
    cross.add(at(box(0.09, 0.11, 0.13, m.steel, 0.012), s * 0.4, 0, 0.18));
    cross.add(at(box(0.026, 0.3, 0.026, m.steel, 0.006), s * 0.4, 0.2, 0.2));
  });
  const board = group(box(tW + 0.05, tH + 0.05, 0.026, m.powderDeep, 0.008));
  const face = decal(targetTexture(0), tW, tH, { transparent: false }); at(face, 0, 0, 0.0136); board.add(face);
  const boardY = 0.34 + tH / 2;
  at(board, 0, boardY, 0.225); cross.add(board);
  cross.position.y = H;
  g.add(cross);

  const anchors = {
    laser: [barL / 2 + 0.03, H + 0.06, 0.25],
    target: [-tW * 0.3, H + boardY + tH * 0.25, 0.24],
    lift: pro ? [0.08, colTop + 0.12, 0.11] : [0.12, colBase + 0.95, 0],
    adjust: [-0.15, H + 0.07, 0.07],
    base: pro ? [halfW, footY + 0.06, footLen / 2 - 0.22] : [halfW - 0.04, footY, 0],
    board: [0, H + boardY, 0.225], boardSize: [tW, tH],
  };
  g.userData = {
    kind: 'adas', lift: H, liftRange: pro ? [0.45, 1.95] : [0.6, 1.6],
    lasers: lasers.map(p => [p[0], p[1] + H, p[2]]),
    centerLaser: [0, H - 0.07, 0.25],
    anchors,
    hotspots: [
      hs(1, laserKit ? 'Line lasers square the frame to the thrust line' : 'Folding frame', laserKit ? anchors.laser : anchors.base),
      hs(2, 'OEM target, set to spec height', anchors.target),
      hs(3, pro ? 'Electric lift' : 'Hand-crank height', anchors.lift),
      hs(4, 'Fine adjust: height, yaw and lateral', anchors.adjust),
      hs(5, pro ? 'Leveling jacks and locking casters' : 'Folds flat for the van', anchors.base),
    ],
  };
  return g;
}

export function targetLibrary() {
  const m = mats();
  const g = new THREE.Group();
  const W = 1.04, D = 0.56;
  g.add(at(box(W, 0.05, D, m.powder, 0.01), 0, CH + 0.025, 0));
  g.add(casterSet(W / 2 - 0.07, D / 2 - 0.07, CH));
  [-1, 1].forEach(s => g.add(at(box(0.036, 1.2, 0.036, m.powder, 0.008), s * (W / 2 - 0.02), CH + 0.05 + 0.6, -D / 2 + 0.02)));
  g.add(at(cyl(0.017, W - 0.02, m.steel, { axis: 'x' }), 0, CH + 1.24, -D / 2 + 0.02));
  [-1, 1].forEach(s => g.add(at(box(0.036, 0.036, D - 0.04, m.powder, 0.008), s * (W / 2 - 0.02), CH + 0.62, 0)));
  for (let i = 0; i < 7; i++) {
    const x = -W / 2 + 0.1 + i * ((W - 0.2) / 6);
    g.add(at(box(0.012, 0.15, D - 0.08, m.steel, 0.003), x, CH + 0.05 + 0.075, 0));
  }
  const variants = [0, 1, 2, 3, 0, 2];
  const heights = [0.62, 0.55, 0.72, 0.6, 0.5, 0.66];
  for (let i = 0; i < 6; i++) {
    const x = -W / 2 + 0.1 + (i + 0.5) * ((W - 0.2) / 6);
    const h = heights[i], w = 0.46;
    const b = group(box(0.022, h + 0.03, w + 0.03, m.powderDeep, 0.005));
    const f = decal(targetTexture(variants[i]), w, h, { transparent: false });
    f.rotation.y = Math.PI / 2; at(f, 0.0115, 0, 0); f.rotation.y = Math.PI / 2; b.add(f);
    b.rotation.y = -0.12 + i * 0.03;
    at(b, x, CH + 0.06 + h / 2, 0.01); b.rotation.y = -0.12 + i * 0.03;
    g.add(b);
  }
  const plate = decal(labelTexture('CAL-X  TARGET LIBRARY', { color: '#ffffff', bg: '#17191d', w: 1024, h: 96 }), 0.6, 0.056);
  at(plate, 0, CH + 0.025, D / 2 + 0.0005); g.add(plate);
  g.userData = { kind: 'targets', hotspots: [hs(1, 'Make-specific camera targets', [0.1, 1.0, 0.1]), hs(2, 'Padded slots keep boards flat', [-0.3, CH + 0.15, D / 2])] };
  return g;
}

function cornerReflector(size, mat) {
  const s = size;
  const v = new Float32Array([
    0, 0, 0, s, 0, 0, 0, s, 0,
    0, 0, 0, 0, s, 0, 0, 0, s,
    0, 0, 0, 0, 0, s, s, 0, 0,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(v, 3));
  geo.computeVertexNormals();
  const mm = mat.clone(); mm.side = THREE.DoubleSide;
  const me = mesh(geo, mm);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), new THREE.Vector3(0, 0, 1));
  me.quaternion.copy(q);
  return me;
}

export function radarKit() {
  const m = mats();
  const g = new THREE.Group();
  const stand = (h) => {
    const s = new THREE.Group();
    s.add(at(cyl(0.23, 0.03, m.powder, { seg: 40 }), 0, 0.035, 0));
    for (let i = 0; i < 3; i++) { const a = i * 2.094; s.add(at(cyl(0.02, 0.02, m.rubber, { seg: 16 }), Math.sin(a) * 0.19, 0.01, Math.cos(a) * 0.19)); }
    s.add(at(cyl(0.021, h, m.steel, { seg: 20 }), 0, 0.05 + h / 2, 0));
    s.add(at(cyl(0.03, 0.05, m.signal, { seg: 20 }), 0, 0.05 + h * 0.45, 0));
    s.add(at(box(0.08, 0.08, 0.08, m.powderDeep, 0.01), 0, 0.05 + h, 0));
    return s;
  };
  const s1 = stand(0.95);
  const plate = group(box(0.36, 0.36, 0.02, m.powderDeep, 0.006), at(box(0.32, 0.32, 0.006, m.chrome, 0.001), 0, 0, 0.012));
  at(plate, 0, 0.05 + 0.95 + 0.04, 0.07); s1.add(plate);
  at(s1, -0.34, 0, 0); g.add(s1);
  const s2 = stand(0.55);
  const cr = cornerReflector(0.24, m.steel); at(cr, 0, 0.05 + 0.55 + 0.06, 0.05); s2.add(cr);
  at(s2, 0.36, 0, -0.12); g.add(s2);
  const kase = group(
    box(0.62, 0.16, 0.42, m.powder, 0.03),
    at(box(0.64, 0.02, 0.44, m.powderDeep, 0.008), 0, 0.02, 0),
    ...[-1, 1].map(sx => at(box(0.06, 0.04, 0.02, m.signal, 0.006), sx * 0.18, 0.02, 0.22)),
    at(box(0.16, 0.02, 0.03, m.plastic, 0.008), 0, 0.09, 0),
  );
  at(kase, 0.08, 0.08, 0.5, 0, -0.18, 0); g.add(kase);
  g.userData = { kind: 'radar', hotspots: [hs(1, 'Flat reflector for front radar aim', [-0.34, 1.05, 0.1]), hs(2, 'Corner reflector for blind-spot radar', [0.36, 0.7, -0.05])] };
  return g;
}

export function ldwStand() {
  const m = mats();
  const g = new THREE.Group();
  g.add(at(cyl(0.16, 0.024, m.powder, { seg: 36 }), 0, 0.012, 0));
  for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.5; g.add(at(cyl(0.018, 0.014, m.rubber, { seg: 14 }), Math.sin(a) * 0.13, 0.007, Math.cos(a) * 0.13)); }
  g.add(at(cyl(0.015, 0.64, m.steel, { seg: 16 }), 0, 0.024 + 0.32, 0));
  g.add(at(cyl(0.026, 0.04, m.signal, { seg: 18 }), 0, 0.44, 0));
  const bw = 0.46, bh = 0.32, by = 0.66 + bh / 2;
  const board = group(box(bw + 0.03, bh + 0.03, 0.018, m.powderDeep, 0.005));
  const f = decal(targetTexture(3), bw, bh, { transparent: false }); at(f, 0, 0, 0.0096); board.add(f);
  board.rotation.x = -0.1; at(board, 0, by, 0.02); g.add(board);
  g.add(at(box(0.05, 0.05, 0.03, m.powderDeep, 0.008), 0, by - bh / 2 - 0.02, 0.0));
  g.userData = { kind: 'adas', hotspots: [hs(1, 'Lane departure target', [0, by + 0.04, 0.05])] };
  return g;
}

export function scanTablet() {
  const m = mats();
  const g = new THREE.Group();
  const TW = 0.34, TH = 0.235;
  const tab = group(box(TW, TH, 0.026, m.plastic, 0.012));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => tab.add(at(box(0.05, 0.05, 0.034, m.signal, 0.012), sx * (TW / 2 - 0.018), sy * (TH / 2 - 0.018), 0)));
  const scr = decal(screenTexture('cal'), TW - 0.05, (TW - 0.05) * 0.625, { emissive: true, transparent: false }); at(scr, 0, 0, 0.0135); tab.add(scr);
  tab.rotation.x = -0.32; at(tab, 0, TH / 2 * Math.cos(0.32) + 0.012, 0.0); g.add(tab);
  const stand = box(0.16, 0.014, 0.16, m.powderDeep, 0.004); stand.rotation.x = 0.9; at(stand, 0, 0.06, -0.07); g.add(stand);
  const kase = group(
    box(0.46, 0.09, 0.34, m.powderDeep, 0.022),
    at(box(0.47, 0.016, 0.35, m.powder, 0.006), 0, 0.02, 0),
    at(box(0.14, 0.022, 0.03, m.signal, 0.008), 0, 0.03, 0.17),
    ...[-1, 1].map(sx => at(box(0.05, 0.03, 0.016, m.steel, 0.004), sx * 0.15, 0.02, 0.176)),
  );
  kase.rotation.y = 0.35; at(kase, -0.36, 0.045, -0.12); g.add(kase);
  g.userData = { kind: 'adas', hotspots: [hs(1, 'Scan tablet', [0, TH * 0.75, 0.04])] };
  return g;
}

export function surroundMat({ w = 0.92, d = 0.5 } = {}) {
  const m = mats();
  const g = new THREE.Group();
  g.add(at(box(w + 0.04, 0.008, d + 0.04, m.rubber, 0.003), 0, 0.004, 0));
  const f = decal(targetTexture(0), w, d, { transparent: false }); f.rotation.x = -Math.PI / 2; at(f, 0, 0.0085, 0); g.add(f);
  g.userData = { kind: 'adas', hotspots: [hs(1, '360-camera target', [w * 0.3, 0.02, 0])] };
  return g;
}

const put = (obj, x, z, ry = 0) => { obj.position.set(x, 0, z); obj.rotation.y = ry; return obj; };
const xf = ([px, py, pz], x, z, ry = 0) => [x + px * Math.cos(ry) + pz * Math.sin(ry), py, z - px * Math.sin(ry) + pz * Math.cos(ry)];

export function calKit(level = 1) {
  const g = new THREE.Group();
  const frame = adasFrame({ variant: 'mobile', laserKit: level >= 3 });
  g.add(frame);
  const A = frame.userData.anchors;
  const L = [-0.76, 0.74, 0.2], R = [0.76, 0.74, -0.2];
  g.add(put(ldwStand(), ...L), put(ldwStand(), ...R));
  const T = [0.2, 1.12, -0.32];
  const tab = scanTablet(); g.add(put(tab, ...T));
  const tabPt = xf(tab.userData.hotspots[0].pos, ...T);
  const hot = [];
  if (level === 1) {
    hot.push(hs(1, 'Folding frame', A.base), hs(2, 'Forward camera target', A.target), hs(3, 'Lane departure targets', xf([0, 0.86, 0.05], ...R)), hs(4, 'Scan tablet', tabPt), hs(5, 'Hand-crank height', A.lift));
  } else {
    const RK = [-1.3, 0.3, 0.42];
    const rk = radarKit(); g.add(put(rk, ...RK));
    const M1 = [-0.5, 1.78, 0.06], M2 = [0.52, 1.82, -0.06];
    g.add(put(surroundMat(), ...M1), put(surroundMat(), ...M2));
    const flat = xf(rk.userData.hotspots[0].pos, ...RK), corner = xf(rk.userData.hotspots[1].pos, ...RK), mat = xf([0.18, 0.02, 0], ...M2);
    if (level === 2) {
      hot.push(hs(1, 'Folding frame', A.base), hs(2, 'Forward camera target', A.target), hs(3, 'Front radar reflector', flat), hs(4, 'Blind-spot reflector', corner), hs(5, '360-camera targets', mat), hs(6, 'Scan tablet', tabPt));
    } else {
      const LB = [1.42, -0.12, -0.55];
      const lib = targetLibrary(); g.add(put(lib, ...LB));
      hot.push(hs(1, 'Laser positioning to the wheel plates', A.laser), hs(2, 'Forward camera target', A.target), hs(3, 'Full target library', xf(lib.userData.hotspots[0].pos, ...LB)), hs(4, 'Radar and blind-spot reflectors', flat), hs(5, '360-camera targets', mat), hs(6, 'Scan tablet', tabPt));
    }
  }
  g.userData = { kind: 'adas', hotspots: hot };
  return g;
}


function studGun(bodyMat) {
  const m = mats();
  const g = new THREE.Group();
  g.add(at(box(0.052, 0.062, 0.2, bodyMat || m.signal, 0.016), 0, 0.135, 0));
  g.add(at(box(0.054, 0.018, 0.15, m.powderDeep, 0.006), 0, 0.17, -0.015));
  const grip = box(0.04, 0.12, 0.052, m.rubber, 0.015); grip.rotation.x = 0.3; at(grip, 0, 0.07, -0.065); grip.rotation.x = 0.3; g.add(grip);
  g.add(at(box(0.012, 0.032, 0.016, m.powderDeep, 0.004), 0, 0.093, -0.02));
  g.add(at(cyl(0.013, 0.07, m.steel, { axis: 'z', seg: 20 }), 0, 0.135, 0.13));
  g.add(at(cyl(0.005, 0.03, m.chrome, { axis: 'z', seg: 12 }), 0, 0.135, 0.18));
  return g;
}

function slideHammer() {
  const m = mats();
  return group(
    at(cyl(0.008, 0.46, m.steel, { axis: 'z', seg: 14 }), 0, 0, 0),
    at(cyl(0.032, 0.09, m.powder, { axis: 'z', seg: 24 }), 0, 0, 0.06),
    at(cyl(0.019, 0.11, m.signal, { axis: 'z', seg: 20 }), 0, 0, -0.2),
    at(cyl(0.012, 0.03, m.chrome, { axis: 'z', seg: 12 }), 0, 0, 0.245),
  );
}

function welderUnit({ W = 0.36, H = 0.26, D = 0.42, screen = 'stud', handle = true } = {}) {
  const m = mats();
  const u = new THREE.Group();
  u.add(at(box(W, H, D, m.powder, 0.022), 0, H / 2 + 0.012, 0));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => u.add(at(cyl(0.018, 0.012, m.rubber, { seg: 16 }), sx * (W / 2 - 0.04), 0.006, sz * (D / 2 - 0.05))));
  u.add(at(box(W - 0.03, H - 0.04, 0.012, m.plastic, 0.008), 0, H / 2 + 0.012, D / 2 + 0.002));
  const scr = decal(screenTexture(screen), W * 0.42, W * 0.42 * 0.625, { emissive: true, transparent: false });
  at(scr, -W * 0.17, H / 2 + 0.05, D / 2 + 0.0092); u.add(scr);
  u.add(at(cyl(0.027, 0.024, m.signal, { axis: 'z', seg: 28 }), W * 0.28, H / 2 + 0.06, D / 2 + 0.018));
  u.add(at(cyl(0.02, 0.02, m.plasticGrey, { axis: 'z', seg: 24 }), W * 0.28, H / 2 - 0.02, D / 2 + 0.017));
  for (let i = 0; i < 4; i++) u.add(at(box(0.026, 0.014, 0.008, i === 0 ? m.signal : m.plasticGrey, 0.003), -W * 0.32 + i * 0.036, H / 2 - 0.05, D / 2 + 0.012));
  [-W * 0.28, -W * 0.02].forEach(x => u.add(at(cyl(0.017, 0.012, m.black, { axis: 'z', seg: 18 }), x, 0.055, D / 2 + 0.012)));
  for (let i = 0; i < 6; i++) u.add(at(box(0.004, 0.012, D - 0.12, m.black, 0.001), W / 2 + 0.001, 0.07 + i * 0.024, 0));
  if (handle) {
    [-1, 1].forEach(s => u.add(at(box(0.02, 0.045, 0.03, m.plastic, 0.006), 0, H + 0.012 + 0.02, s * 0.13)));
    u.add(at(box(0.032, 0.026, 0.3, m.signal, 0.011), 0, H + 0.012 + 0.05, 0));
  }
  const wm = decal(wordmarkTexture('#ffffff'), 0.17, 0.032); wm.rotation.y = -Math.PI / 2; at(wm, -W / 2 - 0.0015, H * 0.7, 0); wm.rotation.y = -Math.PI / 2;
  u.add(wm);
  return u;
}

export function dentPullerS1() {
  const m = mats();
  const g = new THREE.Group();
  const u = welderUnit({}); g.add(u);
  const gun = studGun(); at(gun, 0.34, 0.026, 0.36, 0, -0.7, Math.PI / 2); gun.rotation.set(0, -0.7, Math.PI / 2); g.add(gun);
  g.add(tube([[-0.1, 0.055, 0.22], [-0.08, 0.03, 0.34], [0.02, 0.012, 0.46], [0.2, 0.012, 0.5], [0.3, 0.02, 0.42]], 0.009, m.black));
  const sh = slideHammer(); sh.rotation.set(0, 0.9, 0); at(sh, -0.36, 0.033, 0.38); sh.rotation.set(0, 0.9, 0); g.add(sh);
  g.add(tube([[0, 0.055, 0.22], [0.02, 0.012, 0.3], [-0.12, 0.012, 0.56], [-0.26, 0.012, 0.6]], 0.007, m.black));
  g.add(at(box(0.07, 0.03, 0.04, m.signal, 0.008), -0.29, 0.016, 0.62, 0, 0.4, 0));
  g.userData = {
    kind: 'dent', hotspots: [
      hs(1, 'Plugs into a standard 120V outlet', [0.18, 0.12, -0.1]),
      hs(2, 'Auto mode sets power and time', [-0.06, 0.18, 0.22]),
      hs(3, 'Stud, ring, wiggle wire and shrink', [0.34, 0.06, 0.36]),
    ],
  };
  return g;
}

export function dentPullerS() {
  const m = mats();
  const g = new THREE.Group();
  const W = 0.52, D = 0.48, top = 0.64;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(at(box(0.03, top - CH, 0.03, m.powder, 0.006), sx * (W / 2 - 0.015), CH + (top - CH) / 2, sz * (D / 2 - 0.015))));
  g.add(casterSet(W / 2 - 0.04, D / 2 - 0.04, CH));
  const low = CH + 0.08;
  [low, top].forEach(y => {
    g.add(at(box(W, 0.018, D, m.powderDeep, 0.004), 0, y, 0));
    g.add(at(box(W, 0.035, 0.012, m.powder, 0.004), 0, y + 0.017, D / 2 - 0.006));
  });
  [-1, 1].forEach(s => g.add(at(box(0.025, 0.32, 0.025, m.powder, 0.006), s * (W / 2 - 0.015), top + 0.16, -D / 2 + 0.015)));
  g.add(at(cyl(0.016, W + 0.01, m.signal, { axis: 'x', seg: 18 }), 0, top + 0.32, -D / 2 + 0.015));
  const wm = decal(wordmarkTexture('#ffffff'), 0.22, 0.041); wm.rotation.y = Math.PI / 2; at(wm, W / 2 + 0.0005, low + 0.2, -0.04); wm.rotation.y = Math.PI / 2;
  g.add(at(box(0.004, 0.12, D - 0.06, m.powder, 0.002), W / 2 - 0.002, low + 0.2, 0));
  g.add(wm);
  const UH = 0.26;
  const u = welderUnit({ W: 0.36, H: UH, D: 0.4, screen: 'stud' }); at(u, -0.02, top + 0.009, 0.02); g.add(u);
  g.add(at(box(0.07, 0.17, 0.1, m.powderDeep, 0.012), W / 2 + 0.04, top - 0.07, 0.12));
  const gun = studGun(); gun.rotation.set(-Math.PI / 2 + 0.25, 0, 0); at(gun, W / 2 + 0.04, top - 0.19, 0.12); gun.rotation.set(-Math.PI / 2 + 0.25, 0, 0); g.add(gun);
  g.add(tube([[0.1, top + 0.06, 0.23], [0.24, top + 0.12, 0.3], [W / 2 + 0.06, top + 0.05, 0.2], [W / 2 + 0.04, top - 0.02, 0.13]], 0.008, m.black));
  const sh = slideHammer(); sh.rotation.set(0, 0.95, 0); at(sh, 0.04, low + 0.04, 0.02); sh.rotation.set(0, 0.95, 0); g.add(sh);
  const sb = group(box(0.18, 0.06, 0.13, m.powder, 0.01), at(box(0.18, 0.01, 0.13, m.signal, 0.003), 0, 0.03, 0)); at(sb, -0.13, low + 0.04, -0.12); g.add(sb);
  g.add(tube([[-0.12, top + 0.07, -0.18], [-0.15, top - 0.08, -0.29], [-0.18, 0.08, -0.36], [-0.34, 0.012, -0.52]], 0.007, m.black));
  g.userData = {
    kind: 'dent', hotspots: [
      hs(1, 'Runs on 110V or 220V', [0.16, top + 0.17, -0.12]),
      hs(2, 'Power and weld time on the panel', [-0.08, top + 0.009 + UH / 2 + 0.05, 0.24]),
      hs(3, 'Stud, ring, wiggle wire and shrink', [W / 2 + 0.05, top - 0.12, 0.18]),
      hs(4, 'Seated on its own rolling cart', [0.17, low + 0.06, D / 2]),
    ],
  };
  return g;
}

function pullBridge() {
  const m = mats();
  const g = new THREE.Group();
  g.add(at(box(0.04, 0.035, 0.52, m.powder, 0.008), 0, 0.09, 0));
  [-1, 1].forEach(s => { g.add(at(box(0.03, 0.08, 0.03, m.powder, 0.006), 0, 0.045, s * 0.24)); g.add(at(box(0.05, 0.016, 0.05, m.rubber, 0.006), 0, 0.008, s * 0.24)); });
  g.add(at(cyl(0.008, 0.17, m.steel, { seg: 12 }), 0, 0.1, 0));
  g.add(at(cyl(0.007, 0.13, m.signal, { axis: 'z', seg: 12 }), 0, 0.185, 0));
  g.add(at(cyl(0.02, 0.012, m.steel, { seg: 16 }), 0, 0.022, 0));
  return g;
}

function heatGun() {
  const m = mats();
  const g = new THREE.Group();
  g.add(at(cyl(0.032, 0.17, m.signal, { axis: 'z', seg: 24 }), 0, 0.14, 0));
  g.add(at(cyl(0.018, 0.075, m.steel, { axis: 'z', seg: 20, r2: 0.022 }), 0, 0.14, 0.12));
  g.add(at(cyl(0.031, 0.012, m.black, { axis: 'z', seg: 24 }), 0, 0.14, -0.09));
  const grip = box(0.036, 0.12, 0.05, m.plastic, 0.014); grip.rotation.x = 0.25; at(grip, 0, 0.07, -0.045); grip.rotation.x = 0.25; g.add(grip);
  return g;
}

export function dentPullerS2() {
  const m = mats();
  const g = new THREE.Group();
  const W = 0.6, Hc = 0.7, D = 0.52;
  const bodyY = CH + 0.012;
  g.add(at(box(W, Hc, D, m.powder, 0.014), 0, bodyY + Hc / 2, 0));
  [0.18, 0.2, 0.28].reduce((y, dh) => {
    const cy = y - dh / 2;
    g.add(at(box(W - 0.05, dh - 0.01, 0.014, m.powderLight, 0.004), 0, cy, D / 2 + 0.006));
    g.add(at(box(W - 0.18, 0.016, 0.022, m.signal, 0.006), 0, cy + dh / 2 - 0.028, D / 2 + 0.022));
    return y - dh - 0.004;
  }, bodyY + Hc - 0.03);
  g.add(casterSet(W / 2 - 0.07, D / 2 - 0.07, CH, { wheel: 0.06 }));
  const u = welderUnit({ W: 0.5, H: 0.29, D: 0.44, handle: false, screen: 'pro' });
  at(u, 0, bodyY + Hc, -0.02); g.add(u);
  const top = bodyY + Hc + 0.3;
  g.add(at(box(0.5, 0.012, 0.44, m.powderDeep, 0.003), 0, top + 0.006, -0.02));
  [[-0.17, 0.06], [-0.04, 0.06], [0.1, 0.07]].forEach(([x, w], i) => g.add(at(box(w + 0.05, 0.05, 0.12, i === 1 ? m.signalMatte : m.plasticGrey, 0.006), x, top + 0.035, 0.08)));
  g.add(at(box(0.04, 0.8, 0.04, m.powder, 0.008), 0, top + 0.4, -D / 2 + 0.03));
  g.add(at(box(0.04, 0.04, 0.3, m.powder, 0.008), 0, top + 0.78, -D / 2 + 0.15));
  g.add(at(box(0.05, 0.08, 0.02, m.signal, 0.006), 0, top + 0.73, -D / 2 + 0.29));
  g.add(at(box(0.08, 0.2, 0.12, m.powderDeep, 0.012), W / 2 + 0.045, bodyY + Hc - 0.12, 0.08));
  const gun = studGun(); at(gun, W / 2 + 0.045, bodyY + Hc - 0.24, 0.08, -Math.PI / 2 + 0.25, 0, 0); gun.rotation.set(-Math.PI / 2 + 0.25, 0, 0); g.add(gun);
  g.add(tube([[0.14, bodyY + Hc + 0.06, 0.2], [0.24, bodyY + Hc + 0.28, 0.28], [0.12, top + 0.68, -D / 2 + 0.29], [0.3, top + 0.5, -0.05], [W / 2 + 0.05, bodyY + Hc + 0.08, 0.04], [W / 2 + 0.05, bodyY + Hc - 0.06, 0.08]], 0.009, m.black, { seg: 120 }));
  const sh = slideHammer(); sh.rotation.set(-Math.PI / 2, 0, 0); at(sh, -W / 2 - 0.03, bodyY + Hc - 0.32, 0.1); sh.rotation.set(-Math.PI / 2, 0, 0); g.add(sh);
  g.add(at(box(0.04, 0.03, 0.03, m.steel, 0.006), -W / 2 - 0.02, bodyY + Hc - 0.07, 0.1));
  const coil = mesh(new THREE.TorusGeometry(0.07, 0.006, 8, 40), m.chrome); at(coil, -W / 2 - 0.01, bodyY + 0.38, -0.12, 0, Math.PI / 2, 0); coil.rotation.set(0, Math.PI / 2, 0); g.add(coil);
  const wm = decal(wordmarkTexture('#ffffff'), 0.3, 0.056); wm.rotation.y = Math.PI / 2; at(wm, W / 2 + 0.0015, bodyY + 0.12, -0.05); wm.rotation.y = Math.PI / 2; g.add(wm);
  const pb = pullBridge(); pb.rotation.y = Math.PI / 2; at(pb, 0.02, top + 0.012, -0.1); pb.rotation.y = Math.PI / 2; g.add(pb);
  g.userData = {
    kind: 'dent', hotspots: [
      hs(1, 'Studs, washers, wiggle wire and shrinking', [0.12, top - 0.08, 0.2]),
      hs(2, 'Holster keeps the gun at hand', [W / 2 + 0.05, bodyY + Hc - 0.05, 0.14]),
      hs(3, 'Drawers for studs, washers and tips', [0, bodyY + 0.3, D / 2 + 0.02]),
      hs(4, 'Boom keeps the cable off the floor', [0, top + 0.78, -0.05]),
      hs(5, 'Pull bridge', [0.2, top + 0.2, -0.1]),
    ],
  };
  return g;
}

export function dentPullerAL() {
  const m = mats();
  const g = new THREE.Group();
  const W = 0.62, Hc = 1.0, D = 0.56;
  const bodyY = 0.14;
  g.add(at(box(W, Hc, D, m.powderDeep, 0.016), 0, bodyY + Hc / 2, 0));
  [-1, 1].forEach(s => g.add(at(box(0.006, Hc - 0.08, D - 0.08, m.alu, 0.002), s * (W / 2 + 0.002), bodyY + Hc / 2, 0)));
  g.add(at(box(W - 0.08, Hc - 0.3, 0.008, m.alu, 0.002), 0, bodyY + Hc / 2 - 0.1, D / 2 + 0.003));
  g.add(at(box(W - 0.08, 0.05, 0.012, m.signal, 0.004), 0, bodyY + 0.3, D / 2 + 0.006));
  const al = decal(labelTexture('AL', { color: '#ff3d1f', w: 256, h: 256, size: 0.78, family: 'Archivo, Arial, sans-serif', weight: 800, align: 'center' }), 0.2, 0.2);
  al.rotation.y = Math.PI / 2; at(al, W / 2 + 0.006, bodyY + Hc * 0.62, 0.05); al.rotation.y = Math.PI / 2; g.add(al);
  g.add(casterSet(W / 2 - 0.08, D / 2 - 0.08, bodyY, { wheel: 0.065 }));
  const con = group(box(W, 0.06, 0.34, m.powder, 0.012));
  const scr = decal(screenTexture('al'), 0.36, 0.225, { emissive: true, transparent: false }); scr.rotation.x = -Math.PI / 2; at(scr, -0.06, 0.0315, 0); scr.rotation.x = -Math.PI / 2; con.add(scr);
  con.add(at(cyl(0.03, 0.02, m.signal, { seg: 28 }), 0.22, 0.04, 0.02));
  con.rotation.x = 0.55; at(con, 0, bodyY + Hc + 0.07, 0.08); con.rotation.x = 0.55; g.add(con);
  [-1, 1].forEach(s => {
    g.add(at(box(0.08, 0.18, 0.1, m.powder, 0.012), s * (W / 2 - 0.06), bodyY + Hc - 0.18, D / 2 + 0.06));
    const gun = s > 0 ? studGun(m.alu) : heatGun(); gun.rotation.set(-Math.PI / 2 + 0.25, 0, 0); at(gun, s * (W / 2 - 0.06), bodyY + Hc - 0.32, D / 2 + 0.06); gun.rotation.set(-Math.PI / 2 + 0.25, 0, 0); g.add(gun);
  });
  const tgz = group(box(0.06, 0.11, 0.03, m.plastic, 0.01), at(box(0.062, 0.02, 0.032, m.signal, 0.005), 0, 0.045, 0));
  const tgs = decal(labelTexture('275°F', { color: '#ff3d1f', bg: '#0b0c0e', w: 256, h: 128, size: 0.62, align: 'center' }), 0.046, 0.023); at(tgs, 0, 0.005, 0.0156); tgz.add(tgs);
  at(tgz, -W / 2 + 0.17, bodyY + Hc - 0.12, D / 2 + 0.03); g.add(tgz);
  const reel = ring(0.05, 0.16, 0.06, m.black, { axis: 'x', seg: 48 }); at(reel, -W / 2 - 0.04, bodyY + 0.56, -0.06); g.add(reel);
  g.add(at(cyl(0.05, 0.08, m.signal, { axis: 'x', seg: 28 }), -W / 2 - 0.04, bodyY + 0.56, -0.06));
  const wm = decal(wordmarkTexture('#0d0e10'), 0.36, 0.068); at(wm, 0, bodyY + Hc * 0.66, D / 2 + 0.0075); g.add(wm);
  g.userData = {
    kind: 'dent', hotspots: [
      hs(1, 'Capacitor-discharge studs for aluminum', [W / 2 - 0.06, bodyY + Hc - 0.12, D / 2 + 0.1]),
      hs(2, 'Heat gun and temperature gauge', [-W / 2 + 0.06, bodyY + Hc - 0.12, D / 2 + 0.1]),
      hs(3, 'Aluminum tooling only', [W / 2, bodyY + Hc * 0.62, 0.05]),
    ],
  };
  return g;
}


function paperRoll(g, { W, x0, y, z, w, rr, rearZ, green = false, sheetH = 0.12 }) {
  const m = mats();
  g.add(at(cyl(0.008, W, m.steel, { axis: 'x', seg: 12 }), 0, y, z));
  [-1, 1].forEach(s => g.add(at(box(0.032, 0.032, Math.abs(z - rearZ) + 0.02, m.powder, 0.006), s * W / 2, y, (z + rearZ) / 2)));
  const pm = green ? m.paperGreen : m.paper;
  g.add(at(cyl(rr, w, pm, { axis: 'x', seg: 48 }), x0 + w / 2, y, z));
  g.add(at(ring(0.019, 0.028, w + 0.006, m.cardboard, { axis: 'x' }), x0 + w / 2, y, z));
  g.add(at(box(0.05, 0.09, 0.07, m.signal, 0.01), x0 - 0.01, y + 0.005, z + rr + 0.045));
  g.add(at(ring(0.022, 0.046, 0.025, m.tape, { axis: 'x' }), x0 + 0.03, y + 0.012, z + rr + 0.068));
  const bladeY = y - rr - 0.022, bladeZ = z + rr + 0.055;
  g.add(at(box(w + 0.03, 0.012, 0.032, m.steel, 0.002), x0 + w / 2, bladeY, bladeZ));
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w, sheetH, 1, 6), pm);
  const pos = sheet.geometry.attributes.position;
  for (let k = 0; k < pos.count; k++) { const yy = pos.getY(k); const t = (sheetH / 2 - yy) / sheetH; pos.setZ(k, t * t * 0.05); }
  pos.needsUpdate = true; sheet.geometry.computeVertexNormals();
  sheet.castShadow = true; sheet.receiveShadow = true;
  sheet.position.set(x0 + w / 2, bladeY - sheetH / 2 + 0.004, bladeZ + 0.018);
  g.add(sheet);
  const sy = y - rr * 0.35, sz = z + rr * 0.94, ey = bladeY + 0.007, ez = bladeZ + 0.016;
  const webLen = Math.hypot(ey - sy, ez - sz);
  const web = new THREE.Mesh(new THREE.PlaneGeometry(w, webLen), pm);
  web.castShadow = true; web.receiveShadow = true;
  web.position.set(x0 + w / 2, (sy + ey) / 2, (sz + ez) / 2);
  web.rotation.x = -Math.atan2(ez - sz, sy - ey);
  g.add(web);
  return { hook: [x0 - 0.01, y + 0.06, z + rr + 0.09], blade: [x0 + w * 0.3, bladeY, bladeZ + 0.02] };
}

export function maskingMachine({ widths = [0.9, 0.45, 0.3], film = false, tall = false, storage = false } = {}) {
  const m = mats();
  const g = new THREE.Group();
  const W = tall ? 1.02 : 0.98, D = tall ? 0.62 : 0.52;
  const span = tall ? 0.9 : 0.76;
  const H = tall ? 1.52 : film ? 1.3 : 1.08;
  const rearZ = -D / 2 + 0.07;
  [-1, 1].forEach(s => g.add(at(box(0.055, 0.055, D, m.powder, 0.01), s * (W / 2), CH + 0.028, 0)));
  g.add(at(box(W, 0.045, 0.045, m.powder, 0.008), 0, CH + 0.03, rearZ));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => { const c = caster(CH, { brake: i >= 2 }); c.position.set(sx * W / 2, 0, sz * (D / 2 - 0.05)); c.rotation.y = i * 0.8; g.add(c); });
  [-1, 1].forEach(s => g.add(at(box(0.05, H, 0.05, m.powder, 0.01), s * W / 2, CH + 0.055 + H / 2, rearZ)));
  g.add(at(box(W + 0.05, 0.05, 0.05, m.powder, 0.01), 0, CH + 0.055 + H, rearZ));
  if (tall) {
    [-1, 1].forEach(s => {
      const p = box(0.008, H * 0.55, 0.2, m.signal, 0.003); at(p, s * (W / 2 + 0.029), CH + 0.06 + H * 0.36, rearZ + 0.07); g.add(p);
    });
    const wm = decal(wordmarkTexture('#0d0e10', { mark: false }), 0.36, 0.06); wm.rotation.set(0, Math.PI / 2, Math.PI / 2);
    at(wm, W / 2 + 0.034, CH + 0.06 + H * 0.36, rearZ + 0.07); wm.rotation.set(0, Math.PI / 2, Math.PI / 2); g.add(wm);
    g.add(at(box(W - 0.04, 0.02, 0.26, m.powderDeep, 0.004), 0, CH + 0.055 + H + 0.035, rearZ + 0.1));
    g.add(at(box(W - 0.04, 0.05, 0.012, m.powder, 0.004), 0, CH + 0.055 + H + 0.06, rearZ + 0.225));
    [-1, 1].forEach(s => g.add(at(box(0.012, 0.05, 0.26, m.powder, 0.004), s * (W / 2 - 0.026), CH + 0.055 + H + 0.06, rearZ + 0.1)));
  } else {
    const wm = decal(wordmarkTexture('#ffffff', { mark: true }), 0.3, 0.056); at(wm, 0, CH + 0.03, rearZ + 0.0236); g.add(wm);
  }
  const n = widths.length;
  const x0 = -W / 2 + 0.07;
  let first = null;
  for (let i = 0; i < n; i++) {
    const y = CH + 0.26 + i * (span / (n - 1));
    const z = D / 2 - 0.13 - i * (tall ? 0.05 : 0.06);
    const r = paperRoll(g, { W, x0, y, z, w: widths[i], rr: 0.078 - i * (n > 4 ? 0.003 : 0.004), rearZ, green: i === 1 && !tall, sheetH: 0.12 - i * 0.008 });
    if (!first) first = r;
  }
  let filmPt = null;
  if (film) {
    const y = CH + 0.055 + H - 0.16, z = rearZ + 0.17;
    [-1, 1].forEach(s => g.add(at(box(0.03, 0.03, z - rearZ + 0.02, m.powder, 0.006), s * W / 2, y, (z + rearZ) / 2)));
    g.add(at(cyl(0.065, W - 0.06, m.film, { axis: 'x', seg: 48 }), 0, y, z));
    g.add(at(cyl(0.008, W, m.steel, { axis: 'x', seg: 12 }), 0, y, z));
    filmPt = [0.3, y + 0.07, z + 0.03];
    if (tall) {
      const tg = group(at(box(0.05, 0.11, 0.03, m.signal, 0.008), 0, 0, 0), at(ring(0.02, 0.04, 0.025, m.tape, { axis: 'z' }), 0, 0.055, 0.025));
      at(tg, W / 2 + 0.06, CH + 0.5, rearZ + 0.12); g.add(tg);
    }
  }
  let shelfPt = null;
  if (storage) {
    const sy = CH + 0.075;
    g.add(at(box(W - 0.06, 0.018, D - 0.14, m.powderDeep, 0.004), 0, sy, -0.04));
    g.add(at(box(W - 0.06, 0.04, 0.012, m.powder, 0.004), 0, sy + 0.02, -0.04 - (D - 0.14) / 2));
    [[-0.22, 0.45], [0.28, 0.3]].forEach(([x, w]) => g.add(at(cyl(0.055, w, m.paper, { axis: 'x', seg: 40 }), x, sy + 0.009 + 0.055, -0.13)));
    const tb = box(0.2, 0.1, 0.14, m.cardboard, 0.005); at(tb, 0.33, sy + 0.009 + 0.05, 0.06); g.add(tb);
    const lbl = decal(boxLabelTexture('MASKING TAPE', '3/4 IN · 48 ROLLS'), 0.15, 0.075); at(lbl, 0.33, sy + 0.06, 0.1305); g.add(lbl);
    shelfPt = [0.33, sy + 0.12, 0.08];
  }
  const hot = [hs(1, 'Tape lands on the paper edge as it pulls', first.hook), hs(2, 'Serrated blade for a straight tear', first.blade)];
  hot.push(film ? hs(3, tall ? 'Plastic roll for full-vehicle cover' : 'Plastic roll for whole panels', filmPt) : hs(3, `${n} paper widths`, [0.2, CH + 0.26 + span / 2, D / 2 - 0.15]));
  if (storage) hot.push(hs(4, 'Storage for spare rolls and tape', shelfPt), hs(5, 'Locking casters', [W / 2, 0.08, D / 2 - 0.05]));
  else hot.push(hs(4, 'Locking casters', [W / 2, 0.08, D / 2 - 0.05]));
  g.userData = { kind: 'masking', hotspots: hot };
  return g;
}

export function wallMasker() {
  const m = mats();
  const g = new THREE.Group();
  const W = 0.98, H = 0.66, D = 0.32;
  const rearZ = -D / 2 + 0.02;
  g.add(at(box(W + 0.08, H, 0.02, m.powder, 0.006), 0, H / 2 + 0.03, rearZ));
  [-1, 1].forEach(s => {
    g.add(at(box(0.05, 0.03, D + 0.06, m.powder, 0.006), s * (W / 2 - 0.02), 0.015, 0.02));
    g.add(at(box(0.04, H, 0.04, m.powderDeep, 0.008), s * (W / 2 + 0.02), H / 2 + 0.03, rearZ + 0.03));
    g.add(at(box(0.05, 0.022, 0.004, m.black, 0.002), s * (W / 2 - 0.08), H - 0.01, rearZ + 0.0115));
  });
  const wm = decal(wordmarkTexture('#ffffff'), 0.26, 0.049); at(wm, 0, H - 0.04, rearZ + 0.0105); g.add(wm);
  const x0 = -W / 2 + 0.07;
  const r0 = paperRoll(g, { W, x0, y: 0.29, z: rearZ + 0.19, w: 0.9, rr: 0.078, rearZ });
  paperRoll(g, { W, x0, y: 0.53, z: rearZ + 0.13, w: 0.45, rr: 0.072, rearZ, green: true, sheetH: 0.11 });
  g.userData = { kind: 'masking', hotspots: [hs(1, 'Tape lands on the paper edge as it pulls', r0.hook), hs(2, 'Serrated blade for a straight tear', r0.blade), hs(3, 'Bolts to the wall or stands on a bench', [W / 2 - 0.02, 0.04, D / 2 + 0.02])] };
  return g;
}


export function toolCart({ drawers = 5, width = 0.76, height = 0.86, depth = 0.47, pro = false, locking = false } = {}) {
  const m = mats();
  const g = new THREE.Group();
  const CHc = 0.125;
  const bodyY = CHc + 0.012;
  g.add(at(box(width, height, depth, m.powder, 0.014), 0, bodyY + height / 2, 0));
  const topY = bodyY + height;
  if (pro) {
    g.add(at(box(width + 0.02, 0.026, depth + 0.02, m.steel, 0.005), 0, topY + 0.013, 0));
  } else {
    g.add(at(box(width - 0.004, 0.012, depth - 0.004, m.powderDeep, 0.003), 0, topY + 0.006, 0));
    g.add(at(box(width, 0.045, 0.014, m.powder, 0.005), 0, topY + 0.022, depth / 2 - 0.007));
    g.add(at(box(width, 0.045, 0.014, m.powder, 0.005), 0, topY + 0.022, -depth / 2 + 0.007));
    [-1, 1].forEach(s => g.add(at(box(0.014, 0.045, depth, m.powder, 0.005), s * (width / 2 - 0.007), topY + 0.022, 0)));
  }
  const ratios = drawers === 7 ? [0.62, 0.62, 0.75, 0.85, 1, 1.15, 1.45] : drawers === 3 ? [0.8, 1, 1.45] : drawers === 4 ? [0.75, 0.9, 1.1, 1.45] : [0.65, 0.7, 0.9, 1.1, 1.5];
  const usable = height - 0.06, gap = 0.008;
  const sum = ratios.reduce((a, b) => a + b, 0);
  let y = topY - 0.03;
  const drawerYs = [];
  ratios.forEach(r => {
    const dh = (usable - gap * (ratios.length - 1)) * r / sum;
    y -= dh / 2;
    g.add(at(box(width - 0.05, dh, 0.014, m.powderLight, 0.004), 0, y, depth / 2 + 0.006));
    g.add(at(box(width - 0.17, 0.016, 0.024, m.signal, 0.007), 0, y + dh / 2 - 0.022, depth / 2 + 0.024));
    drawerYs.push(y);
    y -= dh / 2 + gap;
  });
  const hx = width / 2 + 0.055;
  g.add(at(cyl(0.015, depth - 0.08, m.steel, { axis: 'z', seg: 18 }), hx, topY - 0.06, 0));
  [-1, 1].forEach(s => g.add(at(box(0.06, 0.03, 0.03, m.powderDeep, 0.008), width / 2 + 0.028, topY - 0.06, s * (depth / 2 - 0.07))));
  g.add(at(cyl(0.011, 0.012, m.chrome, { axis: 'z', seg: 16 }), width / 2 - 0.06, topY - 0.022, depth / 2 + 0.014));
  g.add(casterSet(width / 2 - 0.07, depth / 2 - 0.07, CHc, { wheel: 0.06 }));
  const wm = decal(wordmarkTexture('#ffffff'), Math.min(0.36, depth * 0.7), Math.min(0.36, depth * 0.7) * 0.1875);
  wm.rotation.y = -Math.PI / 2; at(wm, -width / 2 - 0.0015, bodyY + height * 0.78, 0); wm.rotation.y = -Math.PI / 2; g.add(wm);
  if (pro) {
    g.add(at(box(0.04, 0.32, 0.06, m.powderDeep, 0.008), -width / 2 - 0.022, bodyY + height * 0.5, depth / 2 - 0.08));
    for (let i = 0; i < 4; i++) g.add(at(box(0.008, 0.035, 0.03, m.signal, 0.004), -width / 2 - 0.044, bodyY + height * 0.5 - 0.11 + i * 0.07, depth / 2 - 0.08));
    const bx = -width / 2 - 0.085, by = bodyY + height * 0.84, bd = depth - 0.16;
    g.add(at(box(0.15, 0.008, bd, m.powderDeep, 0.002), bx, by - 0.055, -0.02));
    g.add(at(box(0.008, 0.11, bd, m.powder, 0.003), bx - 0.071, by, -0.02));
    [-1, 1].forEach(s => g.add(at(box(0.15, 0.11, 0.008, m.powder, 0.003), bx, by, -0.02 + s * (bd / 2 - 0.004))));
  }
  g.userData = {
    kind: 'cart', topY, hotspots: [
      hs(1, 'Full-width pulls you can grab with gloves on', [0, drawerYs[0] + 0.03, depth / 2 + 0.04]),
      hs(2, pro ? 'Stainless top with power on the side' : 'Lipped top tray', [width * 0.3, topY + 0.03, 0]),
      locking ? hs(3, 'Locking drawers, one key', [width / 2 - 0.06, topY - 0.022, depth / 2 + 0.03]) : hs(3, 'Ball-bearing slides, 100 lb per drawer', [-width * 0.3, drawerYs[drawerYs.length - 1], depth / 2 + 0.02]),
      hs(4, locking ? '5 in casters, two locking' : 'Locking casters', [width / 2 - 0.07, 0.06, depth / 2 - 0.07]),
    ],
  };
  return g;
}

export function calCart() {
  const m = mats();
  const W = 0.64, D = 0.5;
  const g = toolCart({ drawers: 3, width: W, height: 0.78, depth: D });
  const topY = g.userData.topY;
  g.add(at(box(0.042, 0.46, 0.042, m.powder, 0.008), 0.24, topY + 0.25, -0.19));
  const arm = group(at(box(0.05, 0.04, 0.14, m.powderDeep, 0.008), 0, 0, 0.06));
  const tab = group(box(0.4, 0.27, 0.024, m.plastic, 0.016));
  const scr = decal(screenTexture('cal'), 0.37, 0.231, { emissive: true, transparent: false }); at(scr, 0, 0, 0.0125); tab.add(scr);
  tab.rotation.set(-0.18, 0, 0); at(tab, -0.06, 0.03, 0.14); tab.rotation.set(-0.18, 0, 0); arm.add(tab);
  arm.rotation.set(0, -0.3, 0); at(arm, 0.24, topY + 0.47, -0.19); arm.rotation.set(0, -0.3, 0); g.add(arm);
  const sx = -W / 2 - 0.13, sy = topY - 0.4, sd = D - 0.12;
  g.add(at(box(0.25, 0.018, sd, m.powderDeep, 0.004), sx + 0.005, sy, 0));
  g.add(at(box(0.012, 0.05, sd, m.powder, 0.004), sx - 0.12, sy + 0.025, 0));
  [-1, 1].forEach(s => g.add(at(box(0.25, 0.05, 0.012, m.powder, 0.004), sx + 0.005, sy + 0.025, s * (sd / 2 - 0.006))));
  [-1, 1].forEach(s => { const br = box(0.018, 0.2, 0.02, m.powder, 0.004); br.rotation.z = 0.78; at(br, -W / 2 - 0.07, sy - 0.07, s * (sd / 2 - 0.05)); br.rotation.z = 0.78; g.add(br); });
  const bm = group(box(0.17, 0.09, 0.25, m.plastic, 0.018), at(box(0.172, 0.018, 0.252, m.signal, 0.006), 0, 0.036, 0));
  const bs = decal(screenTexture('batt'), 0.13, 0.081, { emissive: true, transparent: false }); bs.rotation.y = -Math.PI / 2; at(bs, -0.0856, -0.006, 0.0); bs.rotation.y = -Math.PI / 2; bm.add(bs);
  at(bm, sx + 0.01, sy + 0.009 + 0.045, 0.0); g.add(bm);
  g.add(tube([[sx - 0.02, sy + 0.06, 0.13], [sx - 0.12, sy + 0.05, 0.17], [sx - 0.15, sy - 0.12, 0.16], [sx - 0.13, sy - 0.28, 0.12]], 0.006, m.black));
  g.add(tube([[sx - 0.02, sy + 0.06, 0.1], [sx - 0.12, sy + 0.04, 0.12], [sx - 0.16, sy - 0.1, 0.08], [sx - 0.15, sy - 0.24, 0.05]], 0.006, m.black));
  [[0.12, m.signal], [0.05, m.black]].forEach(([z, mm], i) => { const c = box(0.03, 0.07, 0.02, mm, 0.006); at(c, sx - 0.14 + i * 0.01, sy - 0.3 + i * 0.04, z); g.add(c); });
  g.userData.hotspots = [
    hs(1, 'Tablet mount swings to face the driver seat', [0.2, topY + 0.6, 0.0]),
    hs(2, 'Battery maintainer shelf', [sx - 0.04, sy + 0.12, 0.04]),
    hs(3, 'Drawers for clamps, plates and cables', [0.05, topY - 0.25, D / 2 + 0.03]),
  ];
  g.userData.kind = 'cart';
  return g;
}


export function partsCart() {
  const m = mats();
  const g = new THREE.Group();
  const W = 0.98, D = 0.56, H = 1.56;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(at(box(0.034, H, 0.034, m.powder, 0.006), sx * (W / 2 - 0.017), CH + H / 2, sz * (D / 2 - 0.017))));
  g.add(casterSet(W / 2 - 0.05, D / 2 - 0.05, CH));
  const shelves = [CH + 0.08, CH + 0.62, CH + 1.12];
  shelves.forEach(y => {
    g.add(at(box(W - 0.01, 0.014, D - 0.01, m.powderDeep, 0.003), 0, y, 0));
    g.add(at(box(W - 0.01, 0.04, 0.012, m.powder, 0.004), 0, y + 0.02, D / 2 - 0.006));
  });
  const boxes = [
    [0, -0.28, 0.4, 0.32, 0.42], [0, 0.18, 0.46, 0.22, 0.38],
    [1, -0.2, 0.55, 0.24, 0.4], [1, 0.25, 0.32, 0.36, 0.36],
    [2, -0.25, 0.4, 0.18, 0.34], [2, 0.12, 0.3, 0.14, 0.3], [2, 0.36, 0.16, 0.12, 0.22],
  ];
  boxes.forEach(([si, x, w, h, d], i) => {
    const b = box(w, h, d, m.cardboard, 0.004);
    at(b, x, shelves[si] + 0.007 + h / 2, -0.02 + (i % 2) * 0.03, 0, (i % 3 - 1) * 0.04, 0); b.rotation.set(0, (i % 3 - 1) * 0.04, 0); g.add(b);
    if (i % 2 === 0) {
      const lbl = decal(boxLabelTexture('OEM', `PN 5211${i}0-${12 + i}`), Math.min(0.18, w * 0.6), Math.min(0.09, h * 0.4));
      at(lbl, x, shelves[si] + 0.007 + h * 0.55, -0.02 + (i % 2) * 0.03 + d / 2 + 0.0015); g.add(lbl);
    }
  });
  const holder = group(box(0.25, 0.33, 0.012, m.plastic, 0.004));
  const sheet = decal(qrPlacardTexture(), 0.22, 0.29, { transparent: false }); at(sheet, 0, 0, 0.0065); holder.add(sheet);
  holder.rotation.y = Math.PI / 2; at(holder, W / 2 + 0.012, CH + 1.3, 0); holder.rotation.y = Math.PI / 2; g.add(holder);
  const sign = group(box(W - 0.04, 0.12, 0.016, m.signal, 0.006));
  const st = decal(labelTexture('RO 24817  ·  BAY 3', { color: '#0d0e10', w: 1024, h: 128, size: 0.55 }), 0.6, 0.075); at(st, -0.12, 0, 0.0085); sign.add(st);
  at(sign, 0, CH + H - 0.07, D / 2 - 0.01); g.add(sign);
  g.userData = {
    kind: 'rack', hotspots: [
      hs(1, 'One cart per repair order', [0.2, CH + H - 0.07, D / 2 + 0.01]),
      hs(2, 'QR placard ties the cart to its RO', [W / 2 + 0.02, CH + 1.36, 0]),
      hs(3, 'Three shelves', [-0.35, shelves[1] + 0.03, D / 2]),
    ],
  };
  return g;
}

function doorGeometry(w = 1.08, h = 0.92, t = 0.05) {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(w, 0); s.lineTo(w, h * 0.5); s.quadraticCurveTo(w, h * 0.58, w * 0.96, h * 0.6);
  s.lineTo(w * 0.62, h); s.lineTo(w * 0.06, h); s.quadraticCurveTo(0, h, 0, h * 0.92); s.lineTo(0, 0);
  const hole = new THREE.Path();
  hole.moveTo(w * 0.08, h * 0.62); hole.lineTo(w * 0.86, h * 0.62); hole.lineTo(w * 0.6, h * 0.92); hole.lineTo(w * 0.1, h * 0.92); hole.lineTo(w * 0.08, h * 0.62);
  s.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 10 });
  geo.translate(-w / 2, -h / 2, -t / 2);
  return geo;
}

export function panelStand() {
  const m = mats();
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const leg = box(0.32, 0.04, 0.045, m.powder, 0.008);
    leg.position.set(Math.cos(a) * 0.16, CH + 0.02, -Math.sin(a) * 0.16); leg.rotation.y = a; g.add(leg);
    const c = caster(CH, { brake: i < 2 }); c.position.set(Math.cos(a) * 0.31, 0, -Math.sin(a) * 0.31); g.add(c);
  }
  g.add(at(cyl(0.032, 0.95, m.powder, { seg: 24 }), 0, CH + 0.5, 0));
  g.add(at(cyl(0.026, 0.5, m.steel, { seg: 24 }), 0, CH + 1.12, 0));
  g.add(at(cyl(0.045, 0.05, m.signal, { seg: 24 }), 0, CH + 0.96, 0));
  g.add(at(box(0.012, 0.08, 0.012, m.steel, 0.004), 0.06, CH + 0.96, 0));
  const head = group(at(box(0.9, 0.05, 0.05, m.powder, 0.01), 0, 0, 0));
  [-1, 1].forEach(s => {
    head.add(at(box(0.05, 0.22, 0.05, m.powder, 0.01), s * 0.4, 0.1, 0));
    head.add(at(box(0.07, 0.26, 0.07, m.pad, 0.02), s * 0.4, 0.12, 0.06));
    head.add(at(cyl(0.02, 0.04, m.signal, { axis: 'z', seg: 16 }), s * 0.4, 0.03, -0.04));
  });
  const door = mesh(doorGeometry(), m.primer);
  at(door, 0, 0.42, 0.13, -0.12, 0, 0); door.rotation.set(-0.12, 0, 0); head.add(door);
  at(head, 0, CH + 1.36, 0, 0, 0, 0); head.rotation.x = -0.05; g.add(head);
  g.userData = { kind: 'rack', hotspots: [hs(1, 'Padded arms that will not mark fresh paint', [0.4, CH + 1.5, 0.12]), hs(2, 'Height and tilt lock', [0.06, CH + 0.96, 0.05]), hs(3, 'Rotates 360°', [0, CH + 1.36, 0.05])] };
  return g;
}

function bumperCover(mat, { half = 0.56, wrapR = 0.3, wrapDeg = 78, height = 0.44 } = {}) {
  const path = [];
  const nArc = 12, nMid = 14, wr = wrapDeg * Math.PI / 180;
  for (let i = nArc; i >= 1; i--) { const a = Math.PI / 2 + wr * (i / nArc); path.push([-half + wrapR * Math.cos(a), -wrapR + wrapR * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  for (let i = 0; i <= nMid; i++) path.push([-half + 2 * half * (i / nMid), 0, 0, 1]);
  for (let i = 1; i <= nArc; i++) { const a = Math.PI / 2 - wr * (i / nArc); path.push([half + wrapR * Math.cos(a), -wrapR + wrapR * Math.sin(a), Math.cos(a), Math.sin(a)]); }
  const H = height / 2;
  const sec = [[0.11, H], [0.05, H * 0.98], [0.008, H * 0.86], [-0.012, H * 0.5], [-0.018, H * 0.05], [-0.014, -H * 0.35], [0.0, -H * 0.72], [0.035, -H * 0.93], [0.1, -H]];
  const verts = [], idx = [];
  path.forEach(([x, z, nx, nz]) => sec.forEach(([d, y]) => verts.push(x - nx * d, y, z - nz * d)));
  const S = sec.length;
  for (let i = 0; i < path.length - 1; i++) for (let j = 0; j < S - 1; j++) {
    const a = i * S + j, b = (i + 1) * S + j, c = (i + 1) * S + j + 1, d = i * S + j + 1;
    idx.push(a, d, b, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(verts.length / 3 * 2), 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return mesh(geo, mat);
}

export function bumperRack() {
  const m = mats();
  const g = new THREE.Group();
  const L = 1.2, H = 1.62, D = 0.86;
  [-1, 1].forEach(s => {
    g.add(at(box(0.05, 0.05, D, m.powder, 0.01), s * L / 2, CH + 0.025, 0));
    const up = box(0.05, H, 0.05, m.powder, 0.01); at(up, s * L / 2, CH + 0.05 + H / 2, 0); g.add(up);
    for (let i = 0; i < 4; i++) {
      const y = CH + 0.3 + i * 0.36;
      [-1, 1].forEach(fz => {
        g.add(at(box(0.04, 0.04, 0.3, m.powder, 0.008), s * L / 2, y, fz * 0.17, 0.12 * fz, 0, 0));
        g.add(at(box(0.06, 0.055, 0.12, m.pad, 0.02), s * L / 2, y + 0.04, fz * 0.27));
      });
    }
  });
  g.add(at(box(L, 0.05, 0.05, m.powder, 0.01), 0, CH + 0.05 + H, 0));
  g.add(at(box(L, 0.04, 0.04, m.powder, 0.008), 0, CH + 0.12, 0));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => { const c = caster(CH, { brake: i >= 2 }); c.position.set(sx * L / 2, 0, sz * (D / 2 - 0.05)); g.add(c); });
  const hang = [[1, 3, m.paintWhite], [1, 1, m.paintRed], [-1, 2, m.primer], [-1, 0, m.paintBlack]];
  hang.forEach(([side, i, mat]) => {
    const b = bumperCover(mat);
    const armY = CH + 0.3 + i * 0.36;
    b.rotation.y = side > 0 ? 0 : Math.PI;
    at(b, 0, armY + 0.02, side * 0.4);
    b.rotation.set(0, side > 0 ? 0 : Math.PI, 0);
    g.add(b);
  });
  const wm = decal(wordmarkTexture('#ffffff'), 0.3, 0.056); wm.rotation.y = Math.PI / 2; at(wm, L / 2 + 0.026, CH + 0.12, 0); wm.rotation.y = Math.PI / 2; g.add(wm);
  g.userData = { kind: 'rack', hotspots: [hs(1, 'Holds eight covers, front and back', [L / 2, CH + 1.4, 0.3]), hs(2, 'Foam-padded arms', [-L / 2, CH + 0.7, 0.3])] };
  return g;
}

export function doorRack({ slots = 4, L = 1.3 } = {}) {
  const m = mats();
  const g = new THREE.Group();
  const D = 0.7, H = 1.2;
  [-1, 1].forEach(s => g.add(at(box(L, 0.05, 0.05, m.powder, 0.01), 0, CH + 0.025, s * (D / 2 - 0.025))));
  [-1, 1].forEach(s => g.add(at(box(0.05, 0.05, D, m.powder, 0.01), s * (L / 2 - 0.025), CH + 0.025, 0)));
  g.add(casterSet(L / 2 - 0.06, D / 2 - 0.06, CH));
  [-1, 1].forEach(s => {
    g.add(at(box(0.05, H, 0.05, m.powder, 0.01), s * (L / 2 - 0.025), CH + 0.05 + H / 2, 0));
    g.add(at(box(0.04, 0.04, D - 0.1, m.powder, 0.008), s * (L / 2 - 0.025), CH + 0.05 + H, 0));
  });
  g.add(at(box(L, 0.04, 0.04, m.powder, 0.008), 0, CH + 0.05 + H, 0));
  for (let i = 0; i <= slots; i++) {
    const x = -L / 2 + 0.1 + i * ((L - 0.2) / slots);
    g.add(at(box(0.03, 0.05, D - 0.08, m.pad, 0.01), x, CH + 0.075, 0));
    g.add(at(box(0.03, 0.4, 0.03, m.pad, 0.01), x, CH + 0.05 + H - 0.2, 0));
  }
  const paints = [m.primer, m.paintSilver, m.paintBlack, m.primer, m.paintRed, m.paintWhite];
  for (let i = 0; i < slots; i++) {
    const x = -L / 2 + 0.1 + (i + 0.5) * ((L - 0.2) / slots);
    const d = mesh(doorGeometry(1.0, 0.88, 0.05), paints[i % paints.length]);
    d.rotation.y = Math.PI / 2; at(d, x, CH + 0.1 + 0.44, 0, 0, Math.PI / 2, 0.02 * (i - 1.5)); d.rotation.set(0, Math.PI / 2, 0.02 * (i - 1.5));
    g.add(d);
  }
  const wm = decal(wordmarkTexture('#ffffff'), 0.3, 0.056); at(wm, 0, CH + 0.025, D / 2 + 0.0005); g.add(wm);
  g.userData = { kind: 'rack', hotspots: [hs(1, `${slots} panels on edge`, [0.2, CH + 1.1, 0.2]), hs(2, 'Padded slots, no metal on paint', [-0.4, CH + 0.1, D / 2])] };
  return g;
}


export const BUILDERS = {
  'cal-1': () => calKit(1),
  'cal-2': () => calKit(2),
  'cal-x': () => calKit(3),
  'pull-s': () => dentPullerS(),
  'pull-sp': () => dentPullerS2(),
  'pull-a': () => dentPullerAL(),
  'prep-2': () => wallMasker(),
  'prep-4': () => maskingMachine({ widths: [0.9, 0.45, 0.3], film: true }),
  'prep-6': () => maskingMachine({ widths: [0.9, 0.6, 0.45, 0.3, 0.15], film: true, tall: true, storage: true }),
  'cart-t': () => toolCart({ drawers: 4, width: 0.7, height: 0.8, depth: 0.46, locking: true }),
  'cart-c': () => calCart(),
  'rack-b8': () => bumperRack(),
  'rack-ps': () => partsCart(),
  'rack-p6': () => doorRack({ slots: 6, L: 1.56 }),
  'p-frame': () => adasFrame({ variant: 'mobile', laserKit: false }),
  'p-frame-x': () => adasFrame({ variant: 'mobile', laserKit: true }),
  'p-ldw': () => ldwStand(),
  'p-radar': () => radarKit(),
  'p-mat': () => surroundMat(),
  'p-library': () => targetLibrary(),
};

export function build(id) {
  const fn = BUILDERS[id];
  if (!fn) return null;
  const obj = fn();
  obj.name = id;
  return obj;
}
