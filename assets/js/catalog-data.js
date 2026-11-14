// The product catalog (assets/data, made by velocity-build/catalog/build.py).
// index.json holds every brand, department, product family and part number; a department's detail file is loaded
// the first time one of its product pages opens. Nothing here has a price.
// Brands: every family carries a brand id. A brand with families is live and has its own catalog pages
// (#b-martech, #b-martech-d-welding); a brand without any is named on the site as "catalog being added" and lists
// nothing. A new brand needs no code here: its families arrive in the data with its id.
import { DEPT_EXTRA, BRAND_COPY } from './data.js';

const BASE = 'assets/data/';
let indexP = null;
const detailP = new Map();
let CAT = null;

// page addresses are plain names (letters, digits, hyphens) so a link to a product or department survives being
// shared from the preview: #d-welding, #p-f009-digital-mini-spotter, #p-f009-digital-mini-spotter-SP202018
// a part number the way it goes in an address or an element id, whatever a brand's numbers look like (48-22-9000)
export const codeSlug = (code) => String(code).replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const famHref = (f, code = '') => `#p-${f.id.toLowerCase()}-${f.slug}${code ? `-${codeSlug(code)}` : ''}`;
export const deptHref = (d) => `#d-${d.id}`;
export const brandHref = (b) => `#b-${b.id}`;
// one brand's part of a department: #b-martech-d-welding
export const brandDeptHref = (b, d) => `#b-${b.id}-d-${d.id}`;

const getJSON = (url) => fetch(url).then(r => { if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.json(); });

/* Photos. The host serves at most 512 files for this site and the book has 1,866 photos, so the photos ship in
   packs (assets/p, made by velocity-build/catalog/pack.py), each a JSON map of photo key to base64 WebP:
     f/<FID>        every photo of one product family (its page, its part numbers, quote lines)
     d/<dept>.<n>   the card photos of a department, LIST_CHUNK families a pack in catalog order; pack 0 also holds
                    the department's own photo for the top of its page
     set/<name>     heroes (department tiles, menu, training), featured (home), near (calibration), bay (builder)
   An <img> names its photo and its pack; the photo loads from the pack when the image comes near the screen. */
const LIST_CHUNK = 24; // keep in step with pack.py
const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const packP = new Map();
const pack = (name) => {
  if (!packP.has(name)) packP.set(name, getJSON(`assets/p/${name}.json`).catch(e => { packP.delete(name); throw e; }));
  return packP.get(name);
};
export const famPack = (fid) => `f/${fid}`;
// a photo as a data: URL, or null when its pack doesn't hold it
export const photoURL = (key, name) => pack(name).then(p => (p[key] ? `data:image/webp;base64,${p[key]}` : null));
// the attributes of an <img> for a catalog photo: blank until its pack arrives. eager loads it now, not on approach
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
// a photo whose pack didn't arrive tries again when the connection comes back
window.addEventListener('online', () => document.querySelectorAll('img[data-pl="fail"]').forEach(img => { delete img.dataset.pl; watch(img); }));

export function catalog() {
  if (!indexP) indexP = getJSON(BASE + 'index.json').then(build).catch(e => { indexP = null; throw e; });
  return indexP;
}
// the catalog if it has already loaded, else null (for code that must not wait)
export const loaded = () => CAT;

function build(raw) {
  // brands in display order, with the site's words about each one (data.js)
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
    // by: the department's groups, families and part numbers for each brand that has products in it
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
  // which department pack holds each family's card photo, and the department's own photo
  depts.forEach(d => { d.hp = `d/${d.id}.0`; d.fams.forEach((id, i) => { fam[id].lp = `d/${d.id}.${Math.floor(i / LIST_CHUNK)}`; }); });
  brands.forEach(b => {
    b.depts = depts.filter(d => d.by[b.id]);
    b.fams = b.depts.flatMap(d => d.by[b.id].fams);
    b.codes = b.fams.reduce((s, id) => s + fam[id].all, 0);
    b.live = b.fams.length > 0;
    // a brand whose products come without photos lists them as rows of part numbers, not photo cards
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

// the part number a product address ends with, if it ends with one: "digital-mini-spotter-SP202018" gives SP202018.
// The longest ending that is a part number wins, so numbers with hyphens of their own are found whole.
export function codeInTail(cat, tail) {
  const parts = String(tail || '').toLowerCase().split('-').filter(Boolean);
  for (let i = 0; i < parts.length; i++) { const c = cat.codeKey.get(parts.slice(i).join('-')); if (c) return c; }
  return '';
}

// a quote line id is a part number (SP202020) or, for a product the book prints no number for, its family id (F058)
export function resolveItem(cat, id) {
  if (!cat) return null;
  const c = cat.codes.get(id);
  if (c) { const f = cat.fam[c.fid]; return { id, code: c.code, label: c.label || f.name, fam: f, brand: cat.brand[f.brand], photo: c.photo || f.photo }; }
  const f = cat.fam[id];
  if (f) return { id, code: '', label: f.name, fam: f, brand: cat.brand[f.brand], photo: f.photo };
  return null;
}

// the brands whose catalog is on the site, and the ones named as "being added"
export const liveBrands = (cat) => cat.brands.filter(b => b.live);
export const soonBrands = (cat) => cat.brands.filter(b => !b.live);
// "Martech" / "Martech and Milwaukee" / "Martech, Milwaukee and Acme"
export const nameList = (names) => (names.length < 3 ? names.join(' and ') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

// "1 part number" / "11 part numbers"
export const nCodes = (n) => `${n.toLocaleString('en-US')} part number${n === 1 ? '' : 's'}`;
// a product page holds one product with its versions and accessories, or a range of tools: it is not a count of products
export const nPages = (n) => `${n.toLocaleString('en-US')} product page${n === 1 ? '' : 's'}`;
