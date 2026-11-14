import { BAY_ITEMS, BAY_GROUPS, PRESETS } from '../data.js';
import { esc, icon, quote, stepper, toast, loadScenes, webglOK, reducedMotion } from '../core.js';
import { catalog, photoAttrs, famHref } from '../catalog-data.js';

// v3: the bay holds catalog products now, so a bay saved under the old kit list starts fresh
const KEY = 'velocity.bay.v3';
const ZONES = [['overview', 'Overview'], ['dent', 'Dent'], ['masking', 'Prep'], ['carts', 'Trolleys'], ['racks', 'Racks']];
const ITEM = Object.fromEntries(BAY_ITEMS.map(i => [i.model, i]));

function clean(sel) {
  const out = {};
  Object.entries(sel || {}).forEach(([id, q]) => { if (ITEM[id] && q > 0) out[id] = Math.min(ITEM[id].max, q | 0); });
  // a piece that sits on another goes when its base goes
  BAY_ITEMS.forEach(i => { if (i.needs && out[i.model] && !out[i.needs]) delete out[i.model]; });
  return out;
}
function load() {
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && typeof o === 'object' && o.sel) return { sel: clean(o.sel) }; } catch { /* ignore */ }
  return { sel: { ...PRESETS[0].items } };
}
function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch { /* ignore */ } }
// a starting point picked on the home page (read once)
function takePreset() {
  try { const id = sessionStorage.getItem('velocity.bay.preset'); sessionStorage.removeItem('velocity.bay.preset'); return PRESETS.find(p => p.id === id) || null; } catch { return null; }
}

export const bay = {
  id: 'bay', nav: 'bay', title: 'Build your bay',
  render(el) {
    const st = load();
    const arriving = takePreset();
    if (arriving) st.sel = { ...arriving.items };
    el.innerHTML = `
    <div class="bay">
      <div class="bay__stage" data-stage>
        <div class="bay__title"><p>Bay builder · live 3D</p><h1>Build your bay</h1></div>
        <p class="bay__dim" data-dim></p>
        <div class="bay__empty" data-empty hidden><p>Pick a starting point or add equipment.<br>It lands on the floor here.</p></div>
        <div class="bay__zones" role="group" aria-label="Camera">${ZONES.map(([z, l]) => `<button type="button" class="zone ${z === 'overview' ? 'is-on' : ''}" data-zone="${z}" aria-pressed="${z === 'overview'}">${l}</button>`).join('')}</div>
        <p class="bay__no3d" data-no3d hidden>This browser can’t show the 3D bay. The list on the right still builds your quote.</p>
      </div>
      <aside class="bay__panel" aria-label="Bay equipment">
        <div class="bay__scroll">
          <p class="bay__h">Start from</p>
          <div class="presets">${PRESETS.map(p => `<button type="button" class="preset" data-preset="${p.id}"><b>${esc(p.name)}</b><span>${esc(p.note)}</span></button>`).join('')}</div>
          <p class="bay__h"><span>From the catalog</span><button type="button" class="tiny" data-clear style="color:#aeb3ba">Clear bay</button></p>
          <div data-groups><p class="small" style="color:#8d929a">Loading the catalog…</p></div>
          <p class="small bay__fine">Every piece here is a real catalog product with its part number, modeled from its photos. Prices come back on your quote.</p>
        </div>
        <div class="bay__sum" aria-live="polite">
          <div class="sumrow sumrow--total"><span>In this bay</span><b data-s="count">0 pieces</b></div>
          <p class="sum__codes" data-s="codes"></p>
          <button type="button" class="btn btn--signal" data-send>Send this bay for a quote ${icon('arrow')}</button>
        </div>
      </aside>
      <div class="bay-mbar">
        <div class="bay-mbar__t"><b data-m="count">0 pieces</b><span data-m="codes">Add equipment</span></div>
        <button type="button" class="btn btn--signal" data-send>Get a quote ${icon('arrow')}</button>
      </div>
    </div>`;

    const stage = el.querySelector('[data-stage]');
    let ctl = null, gone = false, cat = null;
    let zone = 'overview';   // the camera the visitor picked: it stays put when the bay changes, unless its zone empties

    const units = (id) => (st.sel[id] || 0) * (ITEM[id].qty || 1);
    const paint = ({ animate = true, focusId = null } = {}) => {
      st.sel = clean(st.sel);
      save(st);
      const pieces = Object.values(st.sel).reduce((s, q) => s + q, 0);
      const codes = BAY_ITEMS.filter(i => st.sel[i.model]).map(i => `${units(i.model) > 1 ? `${units(i.model)} × ` : ''}${i.code}`);
      const set = (k, v) => { const n = el.querySelector(`[data-s="${k}"]`); if (n) n.innerHTML = v; };
      const label = `${pieces} piece${pieces === 1 ? '' : 's'}`;
      set('count', label);
      set('codes', codes.length ? codes.map(c => `<span>${esc(c)}</span>`).join('') : 'Nothing on the floor yet.');
      el.querySelector('[data-m="count"]').textContent = label;
      el.querySelector('[data-m="codes"]').textContent = codes.length ? `${codes.length} part number${codes.length === 1 ? '' : 's'}` : 'Add equipment';
      el.querySelectorAll('[data-send]').forEach(b => (b.disabled = !pieces));
      el.querySelectorAll('[data-item]').forEach(row => {
        const id = row.dataset.item, it = ITEM[id], q = st.sel[id] || 0;
        const blocked = it.needs && !st.sel[it.needs];
        row.classList.toggle('is-in', q > 0);
        row.classList.toggle('is-blocked', !!blocked);
        row.querySelector('.stepper__v').textContent = q;
        row.querySelector('[data-step="-1"]').disabled = q <= 0;
        row.querySelector('[data-step="1"]').disabled = q >= it.max || !!blocked;
      });
      BAY_GROUPS.forEach(([g]) => {
        const n = BAY_ITEMS.filter(i => i.zone === g).reduce((s, i) => s + (st.sel[i.model] || 0), 0);
        const c = el.querySelector(`[data-gcount="${g}"]`); if (c) c.textContent = n ? `${n} in bay` : '';
      });
      el.querySelectorAll('[data-preset]').forEach(b => {
        const p = PRESETS.find(x => x.id === b.dataset.preset);
        const same = Object.keys(p.items).length === Object.keys(st.sel).length && Object.entries(p.items).every(([id, q]) => st.sel[id] === q);
        b.classList.toggle('is-on', same);
      });
      const zones = new Set(Object.keys(st.sel).map(id => ITEM[id].zone));
      el.querySelectorAll('[data-zone]').forEach(b => {
        const empty = b.dataset.zone !== 'overview' && !zones.has(b.dataset.zone);
        b.disabled = empty;
        b.title = empty ? 'Nothing in this zone yet' : '';
      });
      el.querySelector('[data-dim]').innerHTML = `Bay 01 · <b>${pieces}</b> piece${pieces === 1 ? '' : 's'} · <b>${zones.size}</b> zone${zones.size === 1 ? '' : 's'}<br>Part numbers from the catalog`;
      el.querySelector('[data-empty]').hidden = pieces > 0 || !ctl;
      if (ctl) ctl.setSelection(st.sel, { animate });
      const fz = focusId && ITEM[focusId].zone;
      if (fz) setZone(fz);
      else if (zone !== 'overview' && !zones.has(zone)) setZone('overview');
    };

    const setZone = (z) => {
      zone = z;
      el.querySelectorAll('[data-zone]').forEach(b => { const on = b.dataset.zone === z; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      if (ctl) ctl.focus(z);
    };
    // the groups that hold pieces open, the rest fold away (an empty bay opens the first two to start from)
    const openGroups = () => {
      const any = Object.keys(st.sel).length > 0;
      el.querySelectorAll('[data-group]').forEach((d, gi) => {
        d.open = any ? BAY_ITEMS.some(i => i.zone === d.dataset.group && st.sel[i.model]) : gi < 2;
      });
    };

    const renderGroups = () => {
      el.querySelector('[data-groups]').innerHTML = BAY_GROUPS.map(([g, name]) => {
        const items = BAY_ITEMS.filter(i => i.zone === g);
        return `<details class="bgroup" data-group="${g}">
          <summary>${esc(name)}<span class="bgroup__n" data-gcount="${g}"></span>${icon('down')}</summary>
          ${items.map(i => {
            const c = cat.codes.get(i.code), f = c && cat.fam[c.fid];
            const name = c ? c.label : i.code;
            const ph = (c && c.photo) || (f && f.photo);
            return `<div class="bitem" data-item="${i.model}">
              <span class="bitem__img bitem__img--photo">${ph ? `<img ${photoAttrs(ph, 'set/bay', true)} alt="" decoding="async">` : ''}</span>
              <div><p class="bitem__n">${f ? `<a href="${famHref(f, i.code)}">${esc(name)}</a>` : esc(name)}</p><p class="bitem__p"><span class="pn">${esc(i.code)}</span>${i.note ? ` · ${esc(i.note)}` : ''}${i.needs ? '<span class="bitem__need"> · Add the vacuum first</span>' : ''}</p></div>
              ${stepper(i.model, st.sel[i.model] || 0, { max: i.max, label: name })}
            </div>`;
          }).join('')}
        </details>`;
      }).join('');
    };

    el.addEventListener('click', e => {
      const step = e.target.closest('[data-item] [data-step]');
      if (step) {
        const id = step.closest('[data-item]').dataset.item, d = +step.dataset.step, it = ITEM[id];
        if (d > 0 && it.needs && !st.sel[it.needs]) return;
        const q = Math.max(0, Math.min(it.max, (st.sel[id] || 0) + d));
        if (q) st.sel[id] = q; else delete st.sel[id];
        paint({ focusId: d > 0 ? id : null });
        return;
      }
      const pre = e.target.closest('[data-preset]');
      if (pre) { st.sel = { ...PRESETS.find(p => p.id === pre.dataset.preset).items }; paint(); openGroups(); return; }
      if (e.target.closest('[data-clear]')) { st.sel = {}; paint(); openGroups(); return; }
      const z = e.target.closest('[data-zone]');
      if (z) { if (!z.disabled) setZone(z.dataset.zone); return; }
      if (e.target.closest('[data-send]')) {
        BAY_ITEMS.forEach(i => { if (st.sel[i.model]) quote.items.set(i.code, Math.min(999, (quote.items.get(i.code) || 0) + units(i.model))); });
        quote.source = 'Build your bay';
        quote.save(); quote.emit();
        toast('Your bay is in the quote. Add your shop details and send it.');
        location.hash = 'quote';
      }
    });

    catalog().then(c => {
      if (gone) return;
      cat = c;
      renderGroups();
      openGroups();
      paint({ animate: false });
    }).catch(() => {
      el.querySelector('[data-groups]').innerHTML = '<p class="small" style="color:#c3c7cd">The catalog didn’t load. Reload the page to try again.</p>';
    });

    if (webglOK()) {
      loadScenes().then(mod => {
        if (!mod || gone) return;
        try {
          ctl = mod.createBay(stage, { reducedMotion: reducedMotion() });
          // arriving from the home page: start from an empty floor and roll the picked bay in
          ctl.setSelection(arriving ? {} : clean(st.sel), { animate: false });
          if (zone !== 'overview') ctl.focus(zone);   // a view picked while the 3D was still loading
          requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('is-live')));
          if (arriving) setTimeout(() => { if (!gone && cat) paint(); }, 600);
          else if (cat) paint({ animate: false });
        } catch (e) { console.warn('bay 3D failed', e); el.querySelector('[data-no3d]').hidden = false; }
      });
    } else el.querySelector('[data-no3d]').hidden = false;
    return () => { gone = true; if (ctl) ctl.dispose(); };
  },
};
