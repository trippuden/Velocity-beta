import { DEPT_EXTRA, BRAND_COPY } from './data.js';

const BASE = 'assets/data/';
let indexP = null;
const detailP = new Map();
let CAT = null;

export const codeSlug = (code) => String(code).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const famHref = (f, code = '') => `#p-${f.id.toLowerCase()}-${f.slug}${code ? `-${codeSlug(code)}` : ''}`;
export const deptHref = (d) => `#d-${d.id}`;
export const brandHref = (b) => `#b-${b.id}`;
export const brandDeptHref = (b, d) => `#b-${b.id}-d-${d.id}`;

const getJSON = (url) => fetch(url).then(r => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); });

const LIST_CHUNK = 24;
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const packP = new Map();
const pack = (name) => {
  if (!packP.has(name)) packP.set(name, getJSON(`assets/p/${name}.json`).catch(e => { packP.delete(name); throw e; }));
  return packP.get(name);
};
export const famPack = (fid) => `f/${fid}`;
export const photoURL = (key, name) => pack(name).then(p => (p[key] ? `data:image/webp;base64,${p[key]}` : null));
export const photoAttrs = (key, name, eager = false) => `src="${BLANK}" data-pk="${key}" data-pp="${name}"${eager ? ' data-pe' : ''}`;

const fill = (img) => {
  const { pk, pp } = img.dataset;
  if (!pk || !pp || img.dataset.pl) return;
  img.dataset.pl = 'wait';
  photoURL(pk, pp).then(url => {
    if (!url) { img.dataset.pl = 'none'; return; }
    img.addEventListener('load', () => img.classList.add('is-in'), { once: true });
    img.src = url;
    img.dataset.pl = 'done';
  }).catch(() => { img.dataset.pl = 'fail'; });
};
const io = 'IntersectionObserver' in window
  ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); fill(e.target); } }), { rootMargin: '600px 240px' })
  : null;
const watch = (root) => {
  const list = root.matches('img[data-pp]') ? [root] : root.querySelectorAll('img[data-pp]');
  list.forEach(img => { if (img.dataset.pl) return; if (!io || img.hasAttribute('data-pe')) fill(img); else io.observe(img); });
};
new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) watch(n); })))
  .observe(document.body, { childList: true, subtree: true });
watch(document.body);
window.addEventListener('online', () => document.querySelectorAll('img[data-pl="fail"]').forEach(img => { delete img.dataset.pl; watch(img); }));

export function catalog() {
  if (!indexP) indexP = getJSON(BASE + 'index.json').then(build).catch(e => { indexP = null; throw e; });
  return indexP;
}
export const loaded = () => CAT;

function build(raw) {
  const brands = (raw.brands && raw.brands.length ? raw.brands : [{ id: 'martech', name: 'Martech' }])
    .map(b => ({ ...b, ...(BRAND_COPY[b.id] || {}), fams: [], codes: 0, depts: [], live: false }));
  const brand = Object.fromEntries(brands.map(b => [b.id, b]));
  const brandOf = (id) => {
    if (id && !brand[id]) { const b = { id, name: id[0].toUpperCase() + id.slice(1), fams: [], codes: 0, depts: [], live: false }; brands.push(b); brand[id] = b; }
    return id || brands[0].id;
  };
  const fams = raw.fams.map(([id, slug, name, dept, sub, photo, w, h, n, code, short, np, dup = '', bid = '']) => ({ id, slug, name, dept, sub, photo, w, h, n, code, short, np, dup, brand: brandOf(bid), all: 0 }));
  const fam = Object.fromEntries(fams.map(f => [f.id, f]));
  const codes = new Map(), codeKey = new Map();
  raw.codes.forEach(([code, label, fid, role, photo]) => {
    const c = { code, label, fid, role, photo };
    codes.set(code, c);
    codeKey.set(code.toLowerCase(), code);
    const slug = codeSlug(code).toLowerCase();
    if (!codeKey.has(slug)) codeKey.set(slug, code);
    fam[fid].all++;
  });
  const order = Object.fromEntries(brands.map((b, i) => [b.id, i]));
  const depts = raw.depts.map(d => {
    const ids = d.subs.flatMap(([, list]) => list);
    const by = {};
    d.subs.forEach(([s, list]) => list.forEach(id => {
      const b = fam[id].brand;
      const x = by[b] || (by[b] = { subs: [], fams: [], codes: 0 });
      let g = x.subs.find(y => y[0] === s);
      if (!g) x.subs.push(g = [s, []]);
      g[1].push(id); x.fams.push(id); x.codes += fam[id].all;
    }));
    return { ...d, ...(DEPT_EXTRA[d.id] || {}), fams: ids, codes: ids.reduce((s, id) => s + fam[id].all, 0), by, brands: Object.keys(by).sort((a, b) => order[a] - order[b]) };
  });
  const dept = Object.fromEntries(depts.map(d => [d.id, d]));
  depts.forEach(d => { d.hp = `d/${d.id}.0`; d.fams.forEach((id, i) => { fam[id].lp = `d/${d.id}.${Math.floor(i / LIST_CHUNK)}`; }); });
  brands.forEach(b => {
    b.depts = depts.filter(d => d.by[b.id]);
    b.fams = b.depts.flatMap(d => d.by[b.id].fams);
    b.codes = b.fams.reduce((s, id) => s + fam[id].all, 0);
    b.live = b.fams.length > 0;
    b.rows = b.live && b.fams.every(id => !fam[id].photo);
  });
  CAT = { brands, brand, depts, dept, fams, fam, codes, codeKey, counts: raw.counts };
  return CAT;
}

export function detail(fid) {
  return catalog().then(cat => {
    const f = cat.fam[fid];
    if (!f) return null;
    if (!detailP.has(f.dept)) detailP.set(f.dept, getJSON(BASE + `d/${f.dept}.json`).catch(e => { detailP.delete(f.dept); throw e; }));
    return detailP.get(f.dept).then(x => x.fams[fid] || {});
  });
}

export function codeInTail(cat, tail) {
  const parts = String(tail || '').toLowerCase().split('-').filter(Boolean);
  for (let i = 0; i < parts.length; i++) { const c = cat.codeKey.get(parts.slice(i).join('-')); if (c) return c; }
  return '';
}

export function resolveItem(cat, id) {
  if (!cat) return null;
  const c = cat.codes.get(id);
  if (c) { const f = cat.fam[c.fid]; return { id, code: c.code, label: c.label || f.name, fam: f, brand: cat.brand[f.brand], photo: c.photo || f.photo }; }
  const f = cat.fam[id];
  if (f) return { id, code: '', label: f.name, fam: f, brand: cat.brand[f.brand], photo: f.photo };
  return null;
}

export const liveBrands = (cat) => cat.brands.filter(b => b.live);
export const soonBrands = (cat) => cat.brands.filter(b => !b.live);
export const nameList = (names) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

export const nCodes = (n) => `${n.toLocaleString('en-US')} part number${n === 1 ? '' : 's'}`;
export const nPages = (n) => `${n.toLocaleString('en-US')} product page${n === 1 ? '' : 's'}`;
