// Shared helpers: escaping, the quote list, lead capture, small UI pieces.
import { SITE, SOURCES } from './data.js';

/* ---------- text ---------- */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);

// rich text: a string, a placeholder from ph(), or an array of either
export function rt(x) {
  if (x == null) return '';
  if (Array.isArray(x)) return x.map(rt).join('');
  if (typeof x === 'object' && x.__ph) return `<span class="ph${String(x.value).length <= 26 ? ' nowrap' : ''}" data-ph="${esc(x.label)}">${esc(x.value)}</span>`;
  return esc(x);
}
export const plain = (x) => (x == null ? '' : Array.isArray(x) ? x.map(plain).join('') : typeof x === 'object' && x.__ph ? x.value : String(x));

export const pad2 = (n) => String(n).padStart(2, '0');
export const num = (n) => Number(n || 0).toLocaleString('en-US');

/* ---------- quote list (kept in this browser only, as an unsent draft) ---------- */

// v2: lines are the catalog's part numbers. A quote saved under the old kit list starts fresh.
const KEY = 'velocity.quote.v2';
// a line is a part number in whatever format its brand prints (SP202002, 48-22-9000) or a product family id (F058).
// The quote page shows only the lines the catalog knows, so this check just keeps junk out of the saved list.
export const isItemId = (id) => typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9 ./+_-]{1,39}$/.test(id);
const listeners = new Set();
export const quote = {
  items: new Map(),
  source: '',
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      (o.items || []).forEach(([id, q]) => { if (isItemId(id) && q > 0) this.items.set(id, Math.min(999, q | 0)); });
      this.source = o.source || '';
    } catch { /* storage unavailable: start empty */ }
  },
  save() { try { localStorage.setItem(KEY, JSON.stringify({ items: [...this.items], source: this.source })); } catch { /* ignore */ } },
  set(id, qty) {
    if (!isItemId(id)) return;
    qty = Math.max(0, Math.min(999, qty | 0));
    if (qty) this.items.set(id, qty); else this.items.delete(id);
    this.save(); this.emit();
  },
  add(id, n = 1) { this.set(id, (this.items.get(id) || 0) + n); },
  qty(id) { return this.items.get(id) || 0; },
  clear() { this.items.clear(); this.source = ''; this.save(); this.emit(); },
  count() { let c = 0; this.items.forEach(q => c += q); return c; },
  lines() { return [...this.items].map(([id, qty]) => ({ id, qty })); },
  on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  emit() { listeners.forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); },
};

/* ---------- platform: shared database and viewer (only inside the published page) ---------- */

const withTimeout = (p, ms, fallback) => Promise.race([p, new Promise(r => setTimeout(() => r(fallback), ms))]);
let dbP = null, userP = null;
export function getDb() {
  if (!dbP) dbP = (async () => {
    try { return null; /* standalone copy: no db service, forms show the not-sent panel */ }
    catch { return null; }
  })();
  return dbP;
}
export function getUser() {
  if (!userP) userP = (async () => {
    try { return null; /* standalone copy: no user service, forms show the not-sent panel */ }
    catch { return null; }
  })();
  return userP;
}
export async function viewerCanEdit() {
  const u = await getUser();
  if (!u) return false;
  try { return !!(await u.canEdit()); } catch { return false; }
}

export function makeRef(prefix) {
  const A = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const b = new Uint8Array(5);
  (window.crypto || {}).getRandomValues ? crypto.getRandomValues(b) : b.forEach((_, i) => b[i] = Math.random() * 256);
  return `${prefix}-${[...b].map(x => A[x % A.length]).join('')}`;
}

// Saves a lead to the private inbox when this page is running where it can. Never claims a send that did not happen.
// Each visitor writes only their own document, leads/<their id>, holding their requests by reference number.
// The page declares rules so that only the owner and editors can read the whole inbox.
export async function saveLead(lead) {
  const [db, u] = await Promise.all([getDb(), getUser()]);
  if (!db || !u) return { ok: false, reason: 'unavailable' };
  let uid = null;
  try { uid = await u.id(); } catch { uid = null; }
  if (!uid) return { ok: false, reason: 'signed-out' };
  let doc;
  try { doc = db.doc(`leads/${uid}`); } catch { return { ok: false, reason: 'invalid_argument' }; }
  const head = { updatedAt: lead.createdAt, name: lead.name || '', shop: lead.shop || '' };
  const attempt = async () => {
    const snap = await doc.get();
    if (snap.exists) await doc.update({ ...head, requests: { [lead.ref]: lead } });
    else await doc.set({ ...head, requests: { [lead.ref]: lead } });
  };
  try { await attempt(); return { ok: true }; }
  catch (e) {
    if (e && e.code === 'unavailable') {
      await new Promise(r => setTimeout(r, 500 + Math.random() * 700));
      try { await attempt(); return { ok: true }; } catch (e2) { return { ok: false, reason: (e2 && e2.code) || 'error' }; }
    }
    return { ok: false, reason: (e && e.code) || 'error' };
  }
}

// How warm a lead is. Visible only in the inbox.
export function scoreLead({ timeline, role, bays, lines = 0, units = 0, type }) {
  let s = 0;
  s += { now: 30, '30': 22, '90': 12, research: 2 }[timeline] ?? 8;
  s += { owner: 16, manager: 12, mso: 20, estimator: 8, tech: 6, painter: 6, parts: 10, dealer: 12, other: 4 }[role] ?? 6;
  s += { '1': 4, '2-4': 9, '5-9': 14, '10+': 18 }[bays] ?? 0;
  s += lines >= 20 ? 20 : lines >= 8 ? 14 : lines >= 3 ? 9 : lines > 0 ? 5 : 0;
  s += units >= 50 ? 8 : units >= 10 ? 5 : 0;
  if (type === 'calibration') s += 4;
  s = Math.min(100, s);
  return { score: s, tier: s >= 60 ? 'hot' : s >= 35 ? 'warm' : 'cool' };
}

/* ---------- icons ---------- */

const I = {
  arrow: '<path d="M4 10h11M11 5l5 5-5 5"/>',
  out: '<path d="M7 5h8v8M15 5 5 15"/>',
  plus: '<path d="M10 4v12M4 10h12"/>',
  minus: '<path d="M4 10h12"/>',
  check: '<path d="m4 10.5 4 4 8-9"/>',
  close: '<path d="m5 5 10 10M15 5 5 15"/>',
  menu: '<path d="M3 6h14M3 10h14M3 14h14"/>',
  phone: '<path d="M6.5 3h2l1 4-1.8 1.2a9 9 0 0 0 4.1 4.1L13 10.5l4 1v2A2.5 2.5 0 0 1 14.5 16 11.5 11.5 0 0 1 4 5.5 2.5 2.5 0 0 1 6.5 3Z"/>',
  mail: '<path d="M3 5h14v10H3zM3 5l7 6 7-6"/>',
  down: '<path d="m5 8 5 5 5-5"/>',
  rotate: '<path d="M16 10a6 6 0 1 1-2-4.5M16 4v3.5h-3.5"/>',
  copy: '<path d="M7 7h9v9H7zM4 13V4h9"/>',
  list: '<path d="M7 5h10M7 10h10M7 15h10M3 5h1M3 10h1M3 15h1"/>',
  bolt: '<path d="M11 2 4 11h5l-1 7 7-9h-5z"/>',
  search: '<path d="M8.5 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11ZM12.5 12.5 17 17"/>',
  grid: '<path d="M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z"/>',
  rows: '<path d="M3 4h14M3 10h14M3 16h14"/>',
  photo: '<path d="M3 5h14v10H3zM3 13l4-4 3 3 2-2 5 5"/>',
};
export const icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square" aria-hidden="true">${I[name] || ''}</svg>`;

/* ---------- small pieces ---------- */

// calibration-target checker, n x n
export function checker(n = 4, size = 28, cls = '') {
  let r = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if ((x + y) % 2 === 0) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  return `<svg class="checker ${cls}" viewBox="0 0 ${n} ${n}" width="${size}" height="${size}" aria-hidden="true" shape-rendering="crispEdges">${r}</svg>`;
}

export function sectionHead({ idx = '', kicker = '', title = '', lede = '', cls = '' }) {
  return `<header class="shead ${cls}">
    <p class="kicker">${idx ? `<span class="kicker__idx">${esc(idx)}</span>` : ''}${esc(kicker)}</p>
    <h2 class="shead__title">${title}</h2>
    ${lede ? `<p class="shead__lede">${lede}</p>` : ''}
  </header>`;
}

export function cite(key) {
  const s = SOURCES[key];
  if (!s) return '';
  return `<a class="cite" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)}${s.date ? `, ${esc(s.date)}` : ''} ${icon('out')}</a>`;
}

export function stepper(id, qty, { max = 99, label = '' } = {}) {
  return `<div class="stepper" data-stepper="${esc(id)}">
    <button type="button" class="stepper__b" data-step="-1" aria-label="Remove one ${esc(label)}" ${qty <= 0 ? 'disabled' : ''}>${icon('minus')}</button>
    <output class="stepper__v" aria-live="polite">${qty}</output>
    <button type="button" class="stepper__b" data-step="1" aria-label="Add one ${esc(label)}" ${qty >= max ? 'disabled' : ''}>${icon('plus')}</button>
  </div>`;
}

// add-to-quote control for one part number (or a family id for products with no number)
export function addButton(id, label, { big = false, text = 'Add to quote' } = {}) {
  const q = quote.qty(id);
  return `<div class="addq ${q ? 'is-in' : ''} ${big ? 'addq--big' : ''}" data-addq="${esc(id)}">
    <button type="button" class="btn ${big ? 'btn--signal btn--lg' : 'btn--ink btn--sm'} addq__add" data-add="${esc(id)}" data-label="${esc(label)}">${icon('plus')}<span>${esc(text)}</span></button>
    <div class="addq__in">${stepper(id, q, { label, max: 999 })}<a class="addq__go" href="#quote">In your quote ${icon('arrow')}</a></div>
  </div>`;
}

// keep every add-to-quote control on screen in sync with the quote list
export function syncAddButtons(root = document) {
  root.querySelectorAll('[data-addq]').forEach(el => {
    const id = el.dataset.addq, q = quote.qty(id);
    el.classList.toggle('is-in', q > 0);
    const out = el.querySelector('.stepper__v'); if (out) out.textContent = q;
    const minus = el.querySelector('[data-step="-1"]'); if (minus) minus.disabled = q <= 0;
  });
  root.querySelectorAll('[data-qmark]').forEach(el => { const q = quote.qty(el.dataset.qmark); el.hidden = !q; el.textContent = q ? `×${q}` : ''; });
}

/* ---------- toasts ---------- */

export function toast(html, { action = null, ms = 4200 } = {}) {
  const region = document.getElementById('toasts');
  if (!region) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<span>${html}</span>${action ? `<a class="toast__a" href="${esc(action.href)}">${esc(action.label)} ${icon('arrow')}</a>` : ''}`;
  region.appendChild(t);
  requestAnimationFrame(() => t.classList.add('is-in'));
  setTimeout(() => { t.classList.remove('is-in'); setTimeout(() => t.remove(), 400); }, ms);
}

/* ---------- forms ---------- */

export function readForm(form) {
  const o = {};
  new FormData(form).forEach((v, k) => {
    v = typeof v === 'string' ? v.trim().slice(0, 2000) : v;
    if (k in o) o[k] = [].concat(o[k], v); else o[k] = v;
  });
  return o;
}

export function validate(form) {
  let first = null;
  form.querySelectorAll('[data-err]').forEach(e => e.remove());
  form.querySelectorAll('.field.is-bad').forEach(f => f.classList.remove('is-bad'));
  form.querySelectorAll('input, select, textarea').forEach(el => {
    const v = (el.value || '').trim();
    let msg = '';
    if (el.required && !v) msg = 'Required';
    else if (v && el.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Check the email address';
    else if (v && el.type === 'tel' && v.replace(/\D/g, '').length < 10) msg = 'Use a 10-digit phone number';
    else if (v && el.dataset.zip !== undefined && !/^\d{5}$/.test(v)) msg = 'Use a 5-digit ZIP';
    if (msg) {
      const f = el.closest('.field');
      if (f) { f.classList.add('is-bad'); f.insertAdjacentHTML('beforeend', `<span class="field__err" data-err>${msg}</span>`); }
      el.setAttribute('aria-invalid', 'true');
      first = first || el;
    } else el.removeAttribute('aria-invalid');
  });
  if (first) first.focus();
  return !first;
}

export async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    if (btn) { const old = btn.innerHTML; btn.innerHTML = `${icon('check')}<span>Copied</span>`; setTimeout(() => (btn.innerHTML = old), 1800); }
    return true;
  } catch { return false; }
}

// what a visitor sees when the request could not be delivered from this preview
export function notSentPanel(summary) {
  return `<div class="notsent">
    <p class="notsent__title">${icon('mail')} This preview cannot send requests yet.</p>
    <p>Nothing was sent. When the site goes live, this form delivers to ${rt(SITE.email)}. To send it now, copy your request and email or call ${rt(SITE.phone)}.</p>
    <textarea class="notsent__text" readonly rows="6">${esc(summary)}</textarea>
    <button type="button" class="btn btn--ink btn--sm" data-copy>${icon('copy')}<span>Copy request</span></button>
  </div>`;
}

/* ---------- text box hints ---------- */

// A hint cut off mid-word reads as broken, most of all on a phone. The hints run longest first and the box shows
// the first one that fits in its own type at its own width; it picks again when the box changes size.
export function fitHint(input, hints) {
  const probe = document.createElement('span');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:pre;pointer-events:none';
  let off = false, ro = null;
  const stop = () => { off = true; if (ro) ro.disconnect(); };
  const fit = () => {
    if (off) return;
    if (!input.isConnected) { stop(); return; }
    const w = input.clientWidth;
    let pick = hints[0];
    if (w) {
      const cs = getComputedStyle(input);
      for (const k of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontStretch', 'letterSpacing', 'textTransform']) probe.style[k] = cs[k];
      // a search box keeps room at its end for the browser's own clear button, even while it is empty
      const room = w - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0) - (input.type === 'search' ? 26 : 2);
      document.body.appendChild(probe);
      pick = hints[hints.length - 1];
      for (const h of hints) { probe.textContent = h; if (probe.getBoundingClientRect().width <= room) { pick = h; break; } }
      document.body.removeChild(probe);
    }
    if (input.placeholder !== pick) input.placeholder = pick;
  };
  fit();
  // the site's typeface can arrive after the first measure: measure again once it is in
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit).catch(() => {});
  if ('ResizeObserver' in window) { ro = new ResizeObserver(fit); ro.observe(input); }
  return stop;
}
// every box under root that lists its hints in data-hints ("long|shorter|shortest")
export function fitHints(root) {
  const offs = [...root.querySelectorAll('input[data-hints]')].map(i => fitHint(i, i.dataset.hints.split('|').map(s => s.trim()).filter(Boolean)));
  return () => offs.forEach(f => f());
}

/* ---------- motion ---------- */

export const reducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// reveal-on-scroll for elements with [data-reveal]
export function revealIn(root) {
  const els = root.querySelectorAll('[data-reveal]');
  if (!('IntersectionObserver' in window) || reducedMotion()) { els.forEach(e => e.classList.add('is-in')); return () => {}; }
  const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach(e => io.observe(e));
  return () => io.disconnect();
}

// count-up numbers for [data-count]
export function countUp(root) {
  const els = root.querySelectorAll('[data-count]');
  if (!('IntersectionObserver' in window) || reducedMotion()) return () => {};
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    const el = en.target, end = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    const pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const t0 = performance.now(), D = 1100;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (end * e).toFixed(dec) + suf;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.4 });
  els.forEach(e => io.observe(e));
  return () => io.disconnect();
}

/* ---------- 3D loader ---------- */

let scenesP = null;
export function loadScenes() {
  if (!scenesP) scenesP = withTimeout(import('./scenes.js').catch(e => { console.warn('3D unavailable', e); return null; }), 15000, null);
  return scenesP;
}
export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

/* ---------- lead forms (quote, training, dealer, support) ---------- */

let editorP = null;
const isEditor = () => (editorP = editorP || viewerCanEdit());

// build(data, ref) -> { lead, summary }. Saves to the private inbox when this page can; otherwise says plainly nothing was sent.
export function bindLeadForm(form, { type, prefix, build, success }) {
  const host = form.closest('[data-form-host]') || form.parentElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    host.querySelectorAll('.notsent').forEach(n => n.remove());
    if (!validate(form)) return;
    const data = readForm(form);
    const ref = makeRef(prefix);
    const { lead, summary } = build(data, ref);
    const btn = form.querySelector('[type="submit"]');
    const label = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span>Sending…</span>';
    const res = await saveLead({ ...lead, ref, type, summary, createdAt: Date.now(), status: 'new', page: location.hash || '#home' });
    btn.disabled = false; btn.innerHTML = label;
    if (res.ok) {
      const ed = await isEditor();
      form.hidden = true;
      host.insertAdjacentHTML('beforeend', `<div class="success" tabindex="-1" data-success>
        <p class="success__ref">REF ${esc(ref)}</p>
        <h3>${esc(success.title)}</h3>
        <p>${success.body}</p>
        ${ed ? `<p class="editor-note">Preview: this request is in your private leads inbox. Only you and editors can see it. <a href="#leads" style="color:#fff;text-decoration:underline">Open the inbox</a></p>` : ''}
        <p><button type="button" class="btn btn--ghost btn--sm" data-again>Send another</button></p>
      </div>`);
      const s = host.querySelector('[data-success]');
      s.focus();
      s.querySelector('[data-again]').addEventListener('click', () => { s.remove(); form.reset(); form.hidden = false; form.dispatchEvent(new Event('reset-ui')); });
      form.dispatchEvent(new CustomEvent('lead-saved', { detail: { ref } }));
    } else {
      form.insertAdjacentHTML('afterend', notSentPanel(summary));
      const panel = host.querySelector('.notsent');
      panel.querySelector('[data-copy]').addEventListener('click', ev => {
        copyText(summary, ev.currentTarget).then(ok => { if (!ok) { const ta = panel.querySelector('textarea'); ta.focus(); ta.select(); } });
      });
      panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
}

// the contact block every form shares
export function contactFields({ roleOptions = null, zip = true } = {}) {
  const roles = roleOptions || [['owner', 'Owner'], ['manager', 'Shop or body shop manager'], ['parts', 'Parts or purchasing'], ['estimator', 'Estimator'], ['tech', 'Body tech'], ['painter', 'Painter'], ['mso', 'MSO / multi-location'], ['dealer', 'Dealer or distributor'], ['other', 'Other']];
  return `
    <div class="form__row">
      <label class="field"><span>Your name</span><input name="name" autocomplete="name" required></label>
      <label class="field"><span>Shop or company</span><input name="shop" autocomplete="organization" required></label>
    </div>
    <div class="form__row">
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
      <label class="field"><span>Phone</span><input name="phone" type="tel" autocomplete="tel" inputmode="tel" required></label>
    </div>
    <div class="form__row">
      <label class="field"><span>Your role</span><select name="role" required><option value="">Choose one</option>${roles.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
      ${zip ? `<label class="field"><span>Shop ZIP code</span><input name="zip" inputmode="numeric" autocomplete="postal-code" maxlength="5" data-zip required></label>` : '<span></span>'}
    </div>`;
}

export const contactSummary = (d) => `${d.name} · ${d.shop}\n${d.email} · ${d.phone}${d.zip ? ` · ZIP ${d.zip}` : ''}\nRole: ${d.role || ''}`;
