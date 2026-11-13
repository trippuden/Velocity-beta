// The product catalog, built from the maker's catalogue v7.0 (assets/data, made by velocity-build/catalog/build.py).
// index.json holds every department, product family and part number; a department's detail file is loaded the
// first time one of its product pages opens. Nothing here has a price: the book prints none.
import { DEPT_EXTRA } from './data.js';

const BASE = 'assets/data/';
let indexP = null;
const detailP = new Map();
let CAT = null;

// page addresses are plain names (letters, digits, hyphens) so a link to a product or department survives being
// shared from the preview: #d-welding, #p-f009-digital-mini-spotter, #p-f009-digital-mini-spotter-SP202018
export const famHref = (f, code = '') => `#p-${f.id.toLowerCase()}-${f.slug}${code ? `-${code}` : ''}`;
export const deptHref = (d) => `#d-${d.id}`;

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
  const fams = raw.fams.map(([id, slug, name, dept, sub, photo, w, h, n, code, short, np, dup = '']) => ({ id, slug, name, dept, sub, photo, w, h, n, code, short, np, dup, all: 0 }));
  const fam = Object.fromEntries(fams.map(f => [f.id, f]));
  const codes = new Map();
  raw.codes.forEach(([code, label, fid, role, photo]) => {
    const c = { code, label, fid, role, photo };
    codes.set(code, c);
    fam[fid].all++;
  });
  const depts = raw.depts.map(d => {
    const ids = d.subs.flatMap(([, list]) => list);
    return { ...d, ...(DEPT_EXTRA[d.id] || {}), fams: ids, codes: ids.reduce((s, id) => s + fam[id].all, 0) };
  });
  const dept = Object.fromEntries(depts.map(d => [d.id, d]));
  // which department pack holds each family's card photo, and the department's own photo
  depts.forEach(d => { d.hp = `d/${d.id}.0`; d.fams.forEach((id, i) => { fam[id].lp = `d/${d.id}.${Math.floor(i / LIST_CHUNK)}`; }); });
  CAT = { depts, dept, fams, fam, codes, counts: raw.counts, source: raw.source };
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

// a quote line id is a part number (SP202020) or, for a product the book prints no number for, its family id (F058)
export function resolveItem(cat, id) {
  if (!cat) return null;
  const c = cat.codes.get(id);
  if (c) { const f = cat.fam[c.fid]; return { id, code: c.code, label: c.label || f.name, fam: f, photo: c.photo || f.photo }; }
  const f = cat.fam[id];
  if (f) return { id, code: '', label: f.name, fam: f, photo: f.photo };
  return null;
}

// "1 part number" / "11 part numbers"
export const nCodes = (n) => `${n.toLocaleString('en-US')} part number${n === 1 ? '' : 's'}`;
export const nFams = (n) => `${n.toLocaleString('en-US')} product${n === 1 ? '' : 's'}`;
