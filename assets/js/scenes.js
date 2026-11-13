// Live scenes: the "Build your bay" scene (also the home page's hero), the older hero and viewer scenes,
// and the studio renderer used to make still images.
import { THREE, mats, shopEnvironment, frameObject, blobTexture, glowTexture, easeOutCubic, easeInOutCubic } from './three-kit.js';
import { build, adasFrame } from './models.js';
import { buildMT } from './catalog-models.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const BG_DARK = '#08090b';

export function makeRenderer({ alpha = true, preserve = false } = {}) {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha, preserveDrawingBuffer: preserve, powerPreference: 'high-performance' });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.0;
  r.shadowMap.enabled = true;
  r.shadowMap.type = THREE.PCFSoftShadowMap;
  return r;
}

/* ---------- helpers ---------- */

/** Merge a model's static meshes by material to cut draw calls. Emissive/decal meshes stay separate. */
export function optimize(root, { keepNames = [] } = {}) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map();
  const remove = [];
  root.traverse(o => {
    if (!o.isMesh) return;
    let p = o; let kept = false;
    while (p && p !== root) { if (keepNames.includes(p.name)) { kept = true; break; } p = p.parent; }
    if (kept) return;
    const mat = o.material;
    if (mat.map || mat.isMeshBasicMaterial || mat.isShadowMaterial || mat.transparent) return;
    let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
    if (!buckets.has(mat)) buckets.set(mat, []);
    buckets.get(mat).push(g);
    remove.push(o);
  });
  remove.forEach(o => o.parent && o.parent.remove(o));
  for (const [mat, geos] of buckets) {
    const merged = mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (!merged) continue;
    const me = new THREE.Mesh(merged, mat); me.castShadow = true; me.receiveShadow = true;
    root.add(me);
  }
  // drop now-empty groups
  const empties = [];
  root.traverse(o => { if (o !== root && o.isGroup && o.children.length === 0) empties.push(o); });
  empties.forEach(o => o.parent && o.parent.remove(o));
  return root;
}

function contactBlob(obj, { opacity = 0.55, spread = 1.25 } = {}) {
  const b = new THREE.Box3().setFromObject(obj);
  const sx = (b.max.x - b.min.x) * spread, sz = (b.max.z - b.min.z) * spread;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, opacity, depthWrite: false, color: 0x000000 }));
  m.rotation.x = -Math.PI / 2; m.scale.set(sx, sz, 1);
  m.position.set((b.min.x + b.max.x) / 2, 0.0015, (b.min.z + b.max.z) / 2);
  m.renderOrder = -1;
  return m;
}

function fitShadow(light, obj, margin = 1.35) {
  const b = new THREE.Box3().setFromObject(obj);
  const s = b.getBoundingSphere(new THREE.Sphere());
  const cam = light.shadow.camera;
  const r = s.radius * margin;
  cam.left = -r; cam.right = r; cam.top = r; cam.bottom = -r;
  const dir = light.position.clone().sub(light.target.position).normalize();
  light.target.position.copy(s.center);
  light.position.copy(s.center).addScaledVector(dir, s.radius * 4);
  cam.near = 0.1; cam.far = s.radius * 9;
  cam.updateProjectionMatrix();
}

function studioRig(scene, renderer, { dark = false } = {}) {
  scene.environment = shopEnvironment(renderer, dark ? { strips: 0.8, key: 0.8, fill: 0.25 } : {});
  scene.environmentIntensity = dark ? 0.75 : 1.0;
  const key = new THREE.DirectionalLight(0xffffff, dark ? 2.2 : 2.5);
  key.position.set(-1.6, 8, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.015;
  key.shadow.radius = 9; key.shadow.blurSamples = 20;
  const rim = new THREE.DirectionalLight(0xffe6d6, dark ? 1.6 : 1.1); rim.position.set(3.2, 3.2, -4.5);
  const fill = new THREE.HemisphereLight(0xffffff, 0x18191c, dark ? 0.25 : 0.4);
  scene.add(key, key.target, rim, fill);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: dark ? 0.55 : 0.2 }));
  catcher.rotation.x = -Math.PI / 2; catcher.receiveShadow = true;
  scene.add(catcher);
  return { key, rim, fill, catcher };
}

export const VIEW_PRESETS = {
  default: { azimuth: 0.62, elevation: 0.24, padding: 1.06 },
  'cal-1': { azimuth: 0.55, elevation: 0.24, padding: 1.04 },
  'cal-2': { azimuth: 0.55, elevation: 0.3, padding: 1.04 },
  'cal-x': { azimuth: 0.55, elevation: 0.3, padding: 1.04 },
  'pull-s': { azimuth: 0.62, elevation: 0.26, padding: 1.04 },
  'pull-sp': { azimuth: 0.62, elevation: 0.2, padding: 1.04 },
  'pull-a': { azimuth: 0.62, elevation: 0.2, padding: 1.04 },
  'prep-2': { azimuth: 0.5, elevation: 0.22, padding: 1.04 },
  'prep-4': { azimuth: 0.5, elevation: 0.2, padding: 1.04 },
  'prep-6': { azimuth: 0.5, elevation: 0.18, padding: 1.04 },
  'cart-t': { azimuth: 0.6, elevation: 0.24, padding: 1.04 },
  'cart-c': { azimuth: -0.7, elevation: 0.22, padding: 1.04 },
  'rack-b8': { azimuth: 0.85, elevation: 0.2, padding: 1.04 },
  'rack-ps': { azimuth: 0.55, elevation: 0.18, padding: 1.04 },
  'rack-p6': { azimuth: 0.95, elevation: 0.22, padding: 1.04 },
};

/* ---------- studio renders (product images) ---------- */

export function createStudioRenderer({ width = 1400, height = 1050, dark = false } = {}) {
  const renderer = makeRenderer({ alpha: true, preserve: true });
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  return {
    renderer,
    render(id, { type = 'image/webp', quality = 0.9 } = {}) {
      const scene = new THREE.Scene();
      const rig = studioRig(scene, renderer, { dark });
      const obj = build(id);
      scene.add(obj);
      fitShadow(rig.key, obj);
      scene.add(contactBlob(obj));
      const cam = new THREE.PerspectiveCamera(24, width / height, 0.01, 100);
      frameObject(cam, obj, VIEW_PRESETS[id] || VIEW_PRESETS.default);
      renderer.setClearColor(0x000000, 0);
      renderer.render(scene, cam);
      const url = renderer.domElement.toDataURL(type, quality);
      scene.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
      if (scene.environment) scene.environment.dispose();
      return url;
    },
    dispose() { renderer.dispose(); },
  };
}

/* ---------- shared bay set ---------- */

function epoxyFloor(size = 60, color = '#0b0c0e', envI = 0.35) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.0, envMapIntensity: envI });
  const f = new THREE.Mesh(new THREE.PlaneGeometry(size, size), m);
  f.rotation.x = -Math.PI / 2; f.receiveShadow = true;
  return f;
}

function floorLine(x0, z0, x1, z1, w, color, opacity = 1) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, transparent: opacity < 1, opacity });
  const l = new THREE.Mesh(new THREE.PlaneGeometry(w, len), m);
  l.rotation.x = -Math.PI / 2;
  l.rotation.z = -Math.atan2(x1 - x0, z1 - z0);
  l.position.set((x0 + x1) / 2, 0.0012, (z0 + z1) / 2);
  l.receiveShadow = true;
  return l;
}

function bayMarkings({ halfW = 2.6, z0 = -5.2, z1 = 9, ticks = true } = {}) {
  const g = new THREE.Group();
  const yellow = '#d6a20a';
  g.add(floorLine(-halfW, z0, -halfW, z1, 0.1, yellow, 0.95));
  g.add(floorLine(halfW, z0, halfW, z1, 0.1, yellow, 0.95));
  if (ticks) for (let z = Math.ceil(z0); z <= z1; z += 0.5) {
    const long = Number.isInteger(z);
    [-1, 1].forEach(s => g.add(floorLine(s * (halfW - 0.05), z, s * (halfW - 0.05 - (long ? 0.22 : 0.12)), z, 0.018, '#c9ced4', 0.55)));
  }
  return g;
}

function laserMaterial(intensity = 4) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3d1f').multiplyScalar(intensity), toneMapped: false, transparent: true, depthWrite: false });
}

/** Laser line on the floor + glow + fan from the emitter. Returns group with .setProgress(0..1) */
function laserLine(emitter, zStart, length, { x = 0, width = 0.007, glow = 0.14, fan = true, intensity = 4 } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.PlaneGeometry(width, 1); geo.translate(0, -0.5, 0);
  const line = new THREE.Mesh(geo, laserMaterial(intensity)); line.rotation.x = -Math.PI / 2;
  line.position.set(x, 0.003, zStart);
  const ggeo = new THREE.PlaneGeometry(glow, 1); ggeo.translate(0, -0.5, 0);
  const gm = new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0xff3d1f, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const halo = new THREE.Mesh(ggeo, gm); halo.rotation.x = -Math.PI / 2; halo.position.set(x, 0.0035, zStart);
  g.add(line, halo);
  let fanMesh = null;
  if (fan) {
    const fg = new THREE.BufferGeometry();
    fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    fg.setAttribute('color', new THREE.BufferAttribute(new Float32Array([0.5, 0.2, 0.08, 0.06, 0.02, 0.005, 0.0, 0.0, 0.0]), 3));
    const fm = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    fanMesh = new THREE.Mesh(fg, fm);
    g.add(fanMesh);
  }
  g.userData.setProgress = (p) => {
    const L = Math.max(0.0001, length * p);
    line.scale.y = L; halo.scale.y = L;
    line.visible = halo.visible = p > 0.001;
    if (fanMesh) {
      const a = fanMesh.geometry.attributes.position;
      a.setXYZ(0, emitter[0], emitter[1], emitter[2]);
      a.setXYZ(1, x, 0.004, zStart + 0.02);
      a.setXYZ(2, x, 0.004, zStart + L);
      a.needsUpdate = true; fanMesh.geometry.computeBoundingSphere();
      fanMesh.visible = p > 0.001;
    }
  };
  g.userData.setIntensity = (k) => { line.material.opacity = k; halo.material.opacity = 0.6 * k; if (fanMesh) fanMesh.material.opacity = 0.5 * k; };
  g.userData.setProgress(1);
  return g;
}

/** Wireframe vehicle used to show where the car sits relative to the equipment. Front faces +Z. */
export function ghostCar() {
  const prof = [[2.36, 0.3], [2.41, 0.5], [2.3, 0.71], [1.22, 0.86], [0.48, 1.38], [-0.72, 1.43], [-1.66, 1.07], [-2.3, 0.99], [-2.4, 0.6], [-2.32, 0.32]];
  const halfAt = y => 0.9 - Math.max(0, y - 0.9) * 0.36;
  const pts = [];
  const sidePts = s => prof.map(([z, y]) => new THREE.Vector3(s * halfAt(y), y, z));
  const L = sidePts(-1), R = sidePts(1);
  const seg = (a, b) => pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
  [L, R].forEach(S => { for (let i = 0; i < S.length; i++) seg(S[i], S[(i + 1) % S.length]); });
  for (let i = 0; i < L.length; i++) seg(L[i], R[i]);
  // belt line + rocker
  [-1, 1].forEach(s => { seg(new THREE.Vector3(s * 0.9, 0.9, -2.3), new THREE.Vector3(s * 0.9, 0.9, 1.22)); });
  // wheels
  [[-1, 1.42], [1, 1.42], [-1, -1.42], [1, -1.42]].forEach(([s, z]) => {
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
      seg(new THREE.Vector3(s * 0.92, 0.34 + Math.sin(a0) * 0.34, z + Math.cos(a0) * 0.34), new THREE.Vector3(s * 0.92, 0.34 + Math.sin(a1) * 0.34, z + Math.cos(a1) * 0.34));
    }
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#b9c8d8', transparent: true, opacity: 0.5, depthWrite: false }));
  const g = new THREE.Group(); g.add(lines);
  // footprint on the floor
  const fp = new THREE.Group();
  fp.add(floorLine(-0.92, -2.4, -0.92, 2.4, 0.012, '#9fb0c2', 0.45));
  fp.add(floorLine(0.92, -2.4, 0.92, 2.4, 0.012, '#9fb0c2', 0.45));
  fp.add(floorLine(0, -2.6, 0, 2.6, 0.01, '#9fb0c2', 0.35));
  g.add(fp);
  return g;
}

function sensorCone(origin, target, radius, color = 0xff3d1f, opacity = 0.14) {
  const o = new THREE.Vector3(...origin), t = new THREE.Vector3(...target);
  const len = o.distanceTo(t);
  const geo = new THREE.ConeGeometry(radius, len, 40, 1, true);
  geo.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  m.position.copy(o);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), t.clone().sub(o).normalize());
  return m;
}

/** Thin wireframe pyramid from a sensor to its calibration target (what the camera or radar 'sees'). */
function fovLines(origin, center, w, h) {
  const o = new THREE.Vector3(...origin), c = new THREE.Vector3(...center);
  const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => new THREE.Vector3(c.x + sx * w / 2, c.y + sy * h / 2, c.z));
  const pts = [];
  corners.forEach(k => pts.push(o.x, o.y, o.z, k.x, k.y, k.z));
  corners.forEach((k, i) => { const n = corners[(i + 1) % 4]; pts.push(k.x, k.y, k.z, n.x, n.y, n.z); });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const mat = new THREE.LineBasicMaterial({ color: new THREE.Color('#ff5a3d').multiplyScalar(1.6), transparent: true, opacity: 0.8, toneMapped: false, depthWrite: false });
  const g = new THREE.Group(); g.add(new THREE.LineSegments(geo, mat));
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff5a3d').multiplyScalar(2), toneMapped: false }));
  dot.position.copy(o); g.add(dot);
  return g;
}

/* ---------- interaction: drag to orbit ---------- */

function orbitDrag(el, state, { minAz = -1.2, maxAz = 1.2, minEl = 0.04, maxEl = 0.55, onStart, onMove } = {}) {
  let down = null;
  const onDown = e => {
    down = { x: e.clientX, y: e.clientY, az: state.tAz, el: state.tEl, decided: e.pointerType !== 'touch', id: e.pointerId };
    onStart && onStart();
  };
  const onMoveE = e => {
    if (!down || e.pointerId !== down.id) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    if (!down.decided) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) { down = null; return; }
      down.decided = true;
    }
    if (el.setPointerCapture && !el.hasPointerCapture(e.pointerId)) { try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
    state.tAz = THREE.MathUtils.clamp(down.az - dx * 0.006, minAz, maxAz);
    state.tEl = THREE.MathUtils.clamp(down.el + dy * 0.004, minEl, maxEl);
    state.lastInput = performance.now();
    onMove && onMove();
  };
  const onUp = () => { down = null; };
  el.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMoveE, { passive: true });
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  return () => {
    el.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMoveE);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
}

function loopController(host, tick) {
  let raf = 0, visible = true, onscreen = true, running = false, last = performance.now();
  const frame = now => {
    raf = 0;
    if (!visible || !onscreen) { running = false; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const keep = tick(dt, now);
    if (keep !== false) raf = requestAnimationFrame(frame); else running = false;
  };
  const start = () => { if (!running && visible && onscreen) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } };
  const io = new IntersectionObserver(ents => { onscreen = ents.some(e => e.isIntersecting); if (onscreen) start(); }, { threshold: 0.01 });
  io.observe(host);
  const vis = () => { visible = document.visibilityState !== 'hidden'; if (visible) start(); };
  document.addEventListener('visibilitychange', vis);
  return { start, stop() { if (raf) cancelAnimationFrame(raf); raf = 0; running = false; io.disconnect(); document.removeEventListener('visibilitychange', vis); } };
}

/* ---------- hero: calibration bay at night ---------- */

export function createHero(host, { hud = {}, callouts = [], reducedMotion = false, layout = () => 'wide' } = {}) {
  const renderer = makeRenderer({ alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  host.appendChild(renderer.domElement);
  renderer.domElement.className = 'gl';
  renderer.setClearColor(BG_DARK, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_DARK);
  scene.fog = new THREE.Fog(BG_DARK, 7.5, 19);
  scene.environment = shopEnvironment(renderer, { strips: 1.1, key: 0.6, fill: 0.25, base: 0.03 });
  scene.environmentIntensity = 0.55;

  scene.add(epoxyFloor());
  scene.add(bayMarkings({ halfW: 2.4, z0: -4, z1: 10 }));
  scene.add(floorLine(-0.75, -0.62, 0.75, -0.62, 0.025, '#c9ced4', 0.4));
  scene.add(floorLine(-0.75, 0.62, 0.75, 0.62, 0.025, '#c9ced4', 0.4));

  const frame = adasFrame({ variant: 'mobile', laserKit: true, lift: 0.85 });
  scene.add(frame);
  const carriage = frame.getObjectByName('carriage');
  const H_FINAL = 1.24;

  const spot = new THREE.SpotLight(0xeef2f7, 58, 16, 0.36, 0.9, 1.6);
  spot.position.set(1.1, 5.8, 3.1); spot.target.position.set(0, 0.8, 0.2);
  spot.castShadow = true; spot.shadow.mapSize.set(2048, 2048); spot.shadow.bias = -0.0003; spot.shadow.normalBias = 0.02;
  scene.add(spot, spot.target);
  const rim = new THREE.SpotLight(0xffd9c4, 80, 14, 0.34, 0.75, 1.5);
  rim.position.set(-1.6, 4.6, -3.6); rim.target.position.set(0, 1.5, 0); scene.add(rim, rim.target);
  const kick = new THREE.SpotLight(0x9fb6cc, 18, 12, 0.4, 0.8, 1.5);
  kick.position.set(4.5, 2.2, 1.5); kick.target.position.set(0, 1.2, 0); scene.add(kick, kick.target);
  // overhead LED bars (visible in reflections and at frame top)
  const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').multiplyScalar(2.2), toneMapped: false });
  for (let i = 0; i < 3; i++) { const bar = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.04, 0.16), ledMat); bar.position.set(0, 4.6, -1.5 + i * 2.6); scene.add(bar); }

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), new THREE.MeshStandardMaterial({ color: '#0e1013', roughness: 0.9 }));
  wall.position.set(0, 4, -6.5); scene.add(wall);
  const H = () => carriage.position.y;
  const emitter = () => [0, H() - 0.07, 0.25];
  const center = laserLine(emitter(), 0.55, 9.5, { width: 0.008, glow: 0.18, fan: false });
  const LX = Math.abs(frame.userData.lasers[0][0]);
  const sideL = laserLine([-LX, H(), 0.26], 0.4, 5.5, { x: -LX, width: 0.005, glow: 0.1, fan: false, intensity: 3 });
  const sideR = laserLine([LX, H(), 0.26], 0.4, 5.5, { x: LX, width: 0.005, glow: 0.1, fan: false, intensity: 3 });
  scene.add(center, sideL, sideR);

  const camera = new THREE.PerspectiveCamera(27, 1, 0.05, 60);
  const state = { az: 0.42, el: 0.15, tAz: 0.42, tEl: 0.15, dist: 7.4, target: new THREE.Vector3(0, 1.0, 0), lastInput: 0 };

  const anchors = callouts.map(c => ({ ...c, v: new THREE.Vector3(...frame.userData.hotspots.find(h => h.n === c.n).pos), left0: c.el.classList.contains('callout--l'), span: c.el.querySelector('span'), sw: 0 }));

  let w = 1, h = 1;
  const resize = () => {
    w = Math.max(1, host.clientWidth); h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const mode = layout();
    if (mode === 'wide') {
      // shift the frame into the right half so the headline owns the left
      const shift = w * 0.21;
      camera.setViewOffset(w, h, -shift, 0, w, h);
      state.dist = 7.0;
    } else {
      camera.clearViewOffset();
      state.dist = w / h < 0.9 ? 8.6 : 7.0;
    }
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();

  const t0 = performance.now();
  const INTRO = reducedMotion ? 0 : 3.2;
  const setHud = (k, v) => { if (hud[k]) hud[k].textContent = v; };

  const placeCallouts = () => {
    anchors.forEach(a => {
      const p = a.v.clone();
      if (a.n === 1 || a.n === 2 || a.n === 4) p.y += H() - frame.userData.lift; // anchors on the carriage move with it
      p.project(camera);
      const x = (p.x * 0.5 + 0.5) * w, y = (-p.y * 0.5 + 0.5) * h;
      const vis = p.z < 1 && x > 8 && x < w - 8 && y > 8 && y < h - 8;
      a.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      a.el.classList.toggle('is-off', !vis);
      // keep the label on screen: flip it to the other side of its dot when it would run off the edge
      if (!a.sw && a.span) a.sw = a.span.offsetWidth;
      if (a.sw) {
        let left = a.left0;
        if (!left && x + 18 + a.sw > w - 8) left = true;
        else if (left && x - 18 - a.sw < 8) left = false;
        a.el.classList.toggle('callout--l', left);
      }
    });
  };

  const tick = (dt, now) => {
    const t = (now - t0) / 1000;
    // intro: lift rises, lasers draw
    const pLift = INTRO ? easeInOutCubic(THREE.MathUtils.clamp(t / 1.8, 0, 1)) : 1;
    const hNow = 0.85 + (H_FINAL - 0.85) * pLift;
    carriage.position.y = hNow;
    setHud('height', String(Math.round(hNow * 1000)).padStart(4, '0'));
    const pLaser = INTRO ? easeOutCubic(THREE.MathUtils.clamp((t - 1.7) / 0.9, 0, 1)) : 1;
    const pSide = INTRO ? easeOutCubic(THREE.MathUtils.clamp((t - 2.2) / 0.8, 0, 1)) : 1;
    center.userData.setProgress(pLaser);
    sideL.userData.setProgress(pSide); sideR.userData.setProgress(pSide);
    const flick = 0.92 + Math.sin(t * 31) * 0.03 + Math.sin(t * 7.3) * 0.03;
    center.userData.setIntensity(flick);
    if (t > (INTRO ? 2.9 : 0)) { setHud('status', 'CENTERLINE LOCKED'); host.classList.add('is-locked'); }
    else setHud('status', pLift < 1 ? 'LIFT TO SPEC' : 'PROJECTING CENTERLINE');

    // camera: idle sway unless the visitor is dragging
    const idle = now - state.lastInput > 3500;
    if (idle) { state.tAz += ((0.42 + Math.sin(t * 0.18) * 0.12) - state.tAz) * 0.02; state.tEl += (0.15 - state.tEl) * 0.02; }
    state.az += (state.tAz - state.az) * Math.min(1, dt * 5);
    state.el += (state.tEl - state.el) * Math.min(1, dt * 5);
    const d = state.dist;
    camera.position.set(
      state.target.x + d * Math.cos(state.el) * Math.sin(state.az),
      state.target.y + d * Math.sin(state.el),
      state.target.z + d * Math.cos(state.el) * Math.cos(state.az),
    );
    camera.lookAt(state.target);
    renderer.render(scene, camera);
    placeCallouts();
    return true;
  };

  const loop = loopController(host, tick);
  const off = orbitDrag(renderer.domElement, state, { minAz: -0.5, maxAz: 1.25, minEl: 0.03, maxEl: 0.5 });
  loop.start();
  return {
    renderer,
    dispose() {
      loop.stop(); off(); ro.disconnect();
      renderer.dispose(); renderer.domElement.remove();
      scene.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    },
  };
}

/* ---------- product turntable viewer ---------- */

export function createViewer(host, id, { hotspotLayer = null, onHotspots = null, reducedMotion = false } = {}) {
  const renderer = makeRenderer({ alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.className = 'gl';
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const rig = studioRig(scene, renderer, {});
  const obj = build(id);
  if (!obj) return null;
  const pivot = new THREE.Group(); pivot.add(obj); scene.add(pivot);
  fitShadow(rig.key, obj, 1.6);
  scene.add(contactBlob(obj));
  const camera = new THREE.PerspectiveCamera(24, 1, 0.01, 100);
  const preset = VIEW_PRESETS[id] || VIEW_PRESETS.default;
  const state = { az: preset.azimuth, el: preset.elevation, tAz: preset.azimuth, tEl: preset.elevation, lastInput: 0 };
  let fit = null, w = 1, h = 1;
  const resize = () => {
    w = Math.max(1, host.clientWidth); h = Math.max(1, host.clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h;
    fit = frameObject(camera, obj, { ...preset, padding: (preset.padding || 1.06) * 1.04 });
    loop && loop.start();
  };
  const hotspots = (obj.userData.hotspots || []).map(hh => {
    let el = null;
    if (hotspotLayer) {
      el = document.createElement('button');
      el.type = 'button'; el.className = 'hotspot'; el.textContent = String(hh.n);
      el.setAttribute('aria-label', hh.label);
      el.dataset.n = hh.n;
      hotspotLayer.appendChild(el);
    }
    return { ...hh, v: new THREE.Vector3(...hh.pos), el };
  });
  onHotspots && onHotspots(hotspots);
  const tmp = new THREE.Vector3();
  const tick = (dt, now) => {
    const idle = now - state.lastInput > 2500;
    if (idle && !reducedMotion) state.tAz += dt * 0.12;
    state.az += (state.tAz - state.az) * Math.min(1, dt * 6);
    state.el += (state.tEl - state.el) * Math.min(1, dt * 6);
    const d = fit.dist, t = fit.target;
    camera.position.set(t.x + d * Math.cos(state.el) * Math.sin(state.az), t.y + d * Math.sin(state.el), t.z + d * Math.cos(state.el) * Math.cos(state.az));
    camera.lookAt(t);
    renderer.render(scene, camera);
    const camDir = camera.getWorldDirection(new THREE.Vector3());
    hotspots.forEach(hh => {
      if (!hh.el) return;
      tmp.copy(hh.v);
      const facing = tmp.clone().sub(camera.position).normalize().dot(camDir) > 0;
      tmp.project(camera);
      const x = (tmp.x * 0.5 + 0.5) * w, y = (-tmp.y * 0.5 + 0.5) * h;
      hh.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      hh.el.classList.toggle('is-off', !facing || x < 0 || x > w || y < 0 || y > h);
    });
    return !(reducedMotion && Math.abs(state.tAz - state.az) < 0.0005 && Math.abs(state.tEl - state.el) < 0.0005);
  };
  let loop = null;
  loop = loopController(host, tick);
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const off = orbitDrag(renderer.domElement, state, { minAz: -100, maxAz: 100, minEl: 0.02, maxEl: 0.9, onMove: () => loop.start() });
  loop.start();
  return {
    dispose() { loop.stop(); off(); ro.disconnect(); renderer.dispose(); renderer.domElement.remove(); hotspots.forEach(hh => hh.el && hh.el.remove()); },
  };
}

/* ---------- Build your bay ---------- */

// where each catalog product stands on the bay floor: [x, z, turn]. A second unit takes the next spot.
const SLOTS = {
  'mt-spotter': [[-1.9, 0.75, -0.8]],
  'mt-arcpuller': [[-1.95, -0.5, -0.75]],
  'mt-koriolis': [[-3.1, -1.6, -0.75]],
  'mt-sanders': [[-3.1, -1.6, -0.75]],
  'mt-masking': [[-3.75, -3.4, -0.73]],
  'mt-evo7': [[2.0, -1.6, 0.4], [2.0, 2.15, 0.4], [1.95, 0.95, 0.45], [3.35, 0.4, 0.45]],
  'mt-parts': [[0.4, -4.55, 0], [1.55, -4.55, 0], [2.7, -4.55, 0]],
  'mt-bumper': [[-2.15, -4.6, 0], [-3.45, -4.6, 0]],
  'mt-panel': [[-0.78, -4.45, 0.12], [3.95, -4.4, -0.3]],
};

export const BAY_ZONES = {
  overview: { pos: [9.2, 7.8, 11.2], look: [0, 0.1, 0.1] },
  adas: { pos: [5.4, 3.0, 9.6], look: [0.1, 0.9, 3.6] },
  dent: { pos: [-6.4, 2.9, 5.2], look: [-1.8, 0.55, 0.7] },
  masking: { pos: [-8.6, 3.6, 2.6], look: [-3.6, 0.8, -1.2] },
  carts: { pos: [7.4, 3.2, 4.4], look: [2.2, 0.55, 0.2] },
  racks: { pos: [3.2, 3.6, 3.2], look: [0.4, 0.9, -4.4] },
};

// options used only by the home page hero (the builder page leaves them off and looks and moves as before):
//   drift: a slow camera sway while nobody is dragging; shiftX: moves the bay right to clear the headline (0 to 0.5);
//   onFrame(anchors): called after each frame with every placed piece's tag point on screen.
export function createBay(host, { reducedMotion = false, onReady = null, drift = false, shiftX = 0, onFrame = null } = {}) {
  const renderer = makeRenderer({ alpha: false });
  renderer.domElement.className = 'gl';
  host.appendChild(renderer.domElement);
  renderer.setClearColor(BG_DARK, 1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG_DARK);
  scene.fog = new THREE.Fog(BG_DARK, 14, 30);
  scene.environment = shopEnvironment(renderer, { strips: 1.1, key: 0.7, fill: 0.35, base: 0.035 });
  scene.environmentIntensity = 0.6;
  scene.add(epoxyFloor(80));
  scene.add(bayMarkings({ halfW: 2.6, z0: -5.4, z1: 6.6 }));
  // back wall line + a second bay to the right for scale
  scene.add(floorLine(-6, -5.25, 6, -5.25, 0.06, '#d6a20a', 0.6));
  scene.add(floorLine(7.9, -5.4, 7.9, 6.6, 0.1, '#d6a20a', 0.8));
  const wallMat = new THREE.MeshStandardMaterial({ color: '#121418', roughness: 0.85 });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(26, 6), wallMat); wall.position.set(0, 3, -5.9); wall.receiveShadow = true; scene.add(wall);

  const car = ghostCar(); scene.add(car);

  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(5, 11, 7); sun.target.position.set(0, 0, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0xffd9c4, 1.1); rim.position.set(-6, 5, -8); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xc9d6e6, 0x101114, 0.35));

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
  const view = { pos: new THREE.Vector3(...BAY_ZONES.overview.pos), look: new THREE.Vector3(...BAY_ZONES.overview.look), tPos: new THREE.Vector3(...BAY_ZONES.overview.pos), tLook: new THREE.Vector3(...BAY_ZONES.overview.look) };
  const orbit = { az: 0, el: 0, tAz: 0, tEl: 0, lastInput: 0 };

  const instances = new Map(); // key id#i -> {obj, born, dying}
  const pulses = [];
  let w = 1, h = 1;
  let shift = shiftX;
  const resize = () => {
    w = Math.max(1, host.clientWidth); h = Math.max(1, host.clientHeight);
    // a phone-size canvas renders at the screen's full sharpness (up to 3x); a big desktop canvas stays at 1.75x
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w * h < 640000 ? 3 : 1.75));
    renderer.setSize(w, h, false);
    camera.fov = w / h < 1 ? 42 : 30;
    if (shift > 0) {
      // render the left part of a wider frame: the bay's center lands right of the middle
      const fw = w * (1 + shift);
      camera.aspect = fw / h; camera.setViewOffset(fw, h, 0, 0, w, h);
    } else { camera.aspect = w / h; camera.clearViewOffset(); }
    camera.updateProjectionMatrix(); loop && loop.start();
  };

  const prototypes = new Map();
  const getProto = id => {
    if (!prototypes.has(id)) { const o = buildMT(id) || build(id); if (!o) return null; optimize(o); prototypes.set(id, o); }
    return prototypes.get(id);
  };

  const ringGeo = new THREE.RingGeometry(0.42, 0.46, 64);
  const addPulse = (x, z) => {
    const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff3d1f').multiplyScalar(2), transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.004, z); scene.add(m);
    pulses.push({ m, t: 0 });
  };

  let selection = {};
  const setSelection = (sel, { animate = true } = {}) => {
    selection = { ...sel };
    const want = new Map(); // key -> [part, x, z, ry]
    Object.entries(selection).forEach(([id, qty]) => {
      const slots = SLOTS[id]; if (!slots || !qty) return;
      for (let i = 0; i < Math.min(qty, slots.length); i++) want.set(`${id}#${i}`, [id, ...slots[i]]);
    });
    // remove
    for (const [key, inst] of instances) if (!want.has(key) && !inst.dying) { inst.dying = performance.now(); }
    // add
    for (const [key, [id, x, z, ry]] of want) {
      if (instances.has(key)) { const inst = instances.get(key); if (inst.dying) { inst.dying = 0; inst.obj.position.y = 0; inst.obj.scale.setScalar(1); } continue; }
      const proto = getProto(id); if (!proto) continue;
      const obj = proto.clone(true);
      obj.position.set(x, 0, z); obj.rotation.y = ry;
      scene.add(obj);
      instances.set(key, { obj, born: animate && !reducedMotion ? performance.now() : 0, dying: 0, x, z });
      if (animate && !reducedMotion) addPulse(x, z);
    }
    loop.start();
  };

  const focus = zone => {
    const z = BAY_ZONES[zone] || BAY_ZONES.overview;
    view.tPos.set(...z.pos); view.tLook.set(...z.look);
    orbit.tAz = 0; orbit.tEl = 0;
    if (reducedMotion) { view.pos.copy(view.tPos); view.look.copy(view.tLook); }
    loop.start();
  };

  const tops = new Map();
  const topOf = id => { if (!tops.has(id)) { const p = getProto(id); tops.set(id, p ? new THREE.Box3().setFromObject(p).max.y : 1); } return tops.get(id); };
  const tagV = new THREE.Vector3();
  const anchors = () => {
    const out = [];
    for (const [key, inst] of instances) {
      if (inst.dying) continue;
      const id = key.split('#')[0];
      tagV.set(inst.x, topOf(id) + 0.08, inst.z).project(camera);
      out.push({ key, id, x: (tagV.x + 1) / 2 * w, y: (1 - tagV.y) / 2 * h, front: tagV.z < 1, landing: !!inst.born });
    }
    return out;
  };
  const tick = (dt, now) => {
    let busy = false;
    if (drift && !reducedMotion && now - orbit.lastInput > 2600) {
      orbit.tAz = Math.sin(now * 0.00011) * 0.32;
      orbit.tEl = Math.sin(now * 0.00007 + 1.3) * 0.06;
      busy = true;
    }
    view.pos.lerp(view.tPos, Math.min(1, dt * 3.2));
    view.look.lerp(view.tLook, Math.min(1, dt * 3.2));
    if (view.pos.distanceTo(view.tPos) > 0.002 || view.look.distanceTo(view.tLook) > 0.002) busy = true;
    orbit.az += (orbit.tAz - orbit.az) * Math.min(1, dt * 6); orbit.el += (orbit.tEl - orbit.el) * Math.min(1, dt * 6);
    if (Math.abs(orbit.tAz - orbit.az) > 0.0005 || Math.abs(orbit.tEl - orbit.el) > 0.0005) busy = true;
    // orbit offsets around look point
    const off = view.pos.clone().sub(view.look);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta += orbit.az; sph.phi = THREE.MathUtils.clamp(sph.phi - orbit.el, 0.25, 1.45);
    camera.position.copy(view.look).add(new THREE.Vector3().setFromSpherical(sph));
    camera.lookAt(view.look);
    for (const [key, inst] of instances) {
      if (inst.born) {
        const p = Math.min(1, (now - inst.born) / 520);
        const e = easeOutCubic(p);
        inst.obj.position.y = (1 - e) * 0.7; inst.obj.scale.setScalar(0.94 + 0.06 * e);
        if (p >= 1) inst.born = 0; else busy = true;
      }
      if (inst.dying) {
        const p = Math.min(1, (now - inst.dying) / 260);
        inst.obj.position.y = easeInOutCubic(p) * 0.5; inst.obj.scale.setScalar(1 - 0.25 * p);
        if (p >= 1) { scene.remove(inst.obj); instances.delete(key); } else busy = true;
      }
    }
    for (let i = pulses.length - 1; i >= 0; i--) {
      const pu = pulses[i]; pu.t += dt;
      const p = pu.t / 0.9;
      pu.m.scale.setScalar(1 + p * 2.6); pu.m.material.opacity = Math.max(0, 0.9 * (1 - p));
      if (p >= 1) { scene.remove(pu.m); pu.m.material.dispose(); pulses.splice(i, 1); } else busy = true;
    }
    renderer.render(scene, camera);
    if (onFrame) { try { onFrame(anchors()); } catch (e) { /* a tag layer error never stops the scene */ } }
    return busy || now - orbit.lastInput < 200;
  };
  let loop = null;
  loop = loopController(host, tick);
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const off = orbitDrag(renderer.domElement, orbit, { minAz: -0.9, maxAz: 0.9, minEl: -0.35, maxEl: 0.35, onMove: () => loop.start() });
  focus('overview');
  onReady && onReady();
  return {
    setSelection, focus, anchors,
    setShift(v) { shift = Math.max(0, Math.min(0.5, v || 0)); resize(); },
    snapshot(type = 'image/webp', q = 0.9) { renderer.render(scene, camera); return renderer.domElement.toDataURL(type, q); },
    settle() { view.pos.copy(view.tPos); view.look.copy(view.tLook); orbit.az = orbit.tAz; orbit.el = orbit.tEl; for (const inst of instances.values()) { inst.born = 0; inst.obj.position.y = 0; inst.obj.scale.setScalar(1); } pulses.forEach(p => scene.remove(p.m)); pulses.length = 0; renderer.render(scene, camera); },
    dispose() { loop.stop(); off(); ro.disconnect(); renderer.dispose(); renderer.domElement.remove(); },
  };
}
