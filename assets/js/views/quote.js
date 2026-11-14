// The quote: a list of catalog part numbers (or product families a catalog prints no number for), each with its
// brand, anything the shop wants that isn't in the catalog, and the shop's details. Velocity prices it in writing.
// No prices on the site.
import { esc, icon, quote, stepper, bindLeadForm, contactFields, contactSummary, scoreLead, getDb, viewerCanEdit, copyText } from '../core.js';
import { catalog, resolveItem, famHref, famPack, loaded } from '../catalog-data.js';
import { crumbs, photo } from './catalog.js';

const POWER = [['', 'Not sure'], ['1ph-240', '120/240 V single-phase'], ['3ph-208', '208 V three-phase'], ['3ph-240', '240 V three-phase'], ['3ph-480', '480 V three-phase']];

export const quotePage = {
  id: 'quote', nav: 'quote', title: 'Get a quote',
  render(el) {
    el.innerHTML = `
    <section class="phead">
      <div class="wrap">
        ${crumbs([['Home', '#home'], ['Quote']])}
        <h1 class="h1">Get a quote.</h1>
        <p class="lede phead__lede">Add part numbers from the catalog, write in anything that isn’t in it, and tell us about your shop. Velocity sends back a written price. No obligation.</p>
      </div>
    </section>
    <section class="sec" style="padding-top:0">
      <div class="wrap quote">
        <div>
          <p class="prod__h"><span>Your list</span><span data-qcount-label></span></p>
          <div data-qhint></div>
          <div data-qlist></div>
          <p class="small muted" style="margin-top:18px" data-source></p>
          <div class="row-gap" data-qtools><a class="btn btn--line btn--sm" href="#catalog">${icon('plus')}<span>Add from the catalog</span></a><a class="btn btn--line btn--sm" href="#bay">Build your bay</a><a class="btn btn--line btn--sm" href="#search">${icon('search')}<span>Search part numbers</span></a></div>
        </div>
        <div class="qform" data-form-host>
          <h2>About your shop</h2>
          <p>So the quote matches your shop the first time.</p>
          <form class="form" novalidate data-quote-form>
            ${contactFields()}
            <label class="field" id="q-extra"><span>Not in the catalog? <span class="field__opt">(optional)</span></span><textarea name="extra" rows="3" placeholder="Paint, masking paper, tape, abrasives, a brand that isn’t listed yet: brand, size and how many"></textarea></label>
            <div class="form__row">
              <label class="field"><span>Shop power</span><select name="power">${POWER.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select></label>
              <label class="field"><span>Bays</span><select name="bays" required><option value="">How many?</option><option value="1">1</option><option value="2-4">2 to 4</option><option value="5-9">5 to 9</option><option value="10+">10 or more</option></select></label>
            </div>
            <div class="field"><span class="field__l">When do you need it?</span><div class="choice-row">${[['now', 'Now'], ['30', 'Within 30 days'], ['90', 'Within 90 days'], ['research', 'Just pricing it out']].map(([v, l], i) => `<label class="choice"><input type="radio" name="timeline" value="${v}" ${i === 1 ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
            <label class="checkline"><input type="checkbox" name="training" value="yes"><span class="checkline__box">${icon('check')}</span><span>Train my techs on this equipment</span></label>
            <label class="field"><span>Anything we should know? <span class="field__opt">(optional)</span></span><textarea name="notes" rows="3" placeholder="Floor space, what you’re replacing, the work you do most"></textarea></label>
            <div class="form__submit"><button type="submit" class="btn btn--signal btn--lg">Request my quote ${icon('arrow')}</button><p class="form__note">We use this to quote you. No newsletter, no reselling your info.</p></div>
          </form>
        </div>
      </div>
    </section>`;

    const list = el.querySelector('[data-qlist]');
    let gone = false;
    const paint = () => {
      const cat = loaded();
      const lines = quote.lines();
      const n = quote.count();
      el.querySelector('[data-qcount-label]').textContent = lines.length ? `${lines.length} line${lines.length === 1 ? '' : 's'} · ${n} item${n === 1 ? '' : 's'}` : '';
      el.querySelector('[data-source]').textContent = quote.source ? `Started from: ${quote.source}.` : '';
      // an empty list carries its own ways in, so the row of shortcuts under it shows only once there is a list
      el.querySelector('[data-qtools]').hidden = !lines.length;
      if (!lines.length) {
        list.innerHTML = `<div class="qempty"><p>Nothing on your list yet. Add part numbers from the catalog, start from a bay, or just send the form with what you’re looking for in the notes.</p><div class="row-gap" style="margin-top:0"><a class="btn btn--ink" href="#catalog">Open the catalog ${icon('arrow')}</a><a class="btn btn--line" href="#bay">Build your bay</a><a class="btn btn--line" href="#search">${icon('search')}<span>Search part numbers</span></a></div></div>`;
        return;
      }
      list.innerHTML = `<div class="qlist">${lines.map(({ id, qty }) => {
        const it = cat ? resolveItem(cat, id) : null;
        const href = it ? famHref(it.fam, it.code) : '#catalog';
        return `<div class="qline" data-line="${esc(id)}">
          <a class="qline__img" href="${href}">${it && it.photo ? photo(it.photo, { pack: famPack(it.fam.id) }) : ''}</a>
          <div><p class="qline__m">${it && it.code ? esc(it.code) : cat && !it ? 'Not in the catalog now' : 'Part number on request'}${it ? `<span class="qline__b">${esc(it.brand.name)}</span>` : ''}</p><p class="qline__n"><a href="${href}">${esc(it ? it.label : id)}</a></p>${it && it.label !== it.fam.name ? `<p class="qline__p">${esc(it.fam.name)}</p>` : ''}</div>
          <div class="qline__r">${stepper(id, qty, { label: it ? it.label : id, max: 999 })}<button type="button" class="qline__x" data-remove="${esc(id)}">Remove</button></div>
        </div>`;
      }).join('')}</div>
      <p class="qtotals__note">${icon('mail')}<span>Prices aren’t on the site. Velocity prices this list in writing.</span></p>`;
    };
    list.addEventListener('click', e => {
      const x = e.target.closest('[data-remove]');
      if (x) { quote.set(x.dataset.remove, 0); return; }
      const s = e.target.closest('[data-step]');
      if (!s) return;
      const id = s.closest('[data-stepper]').dataset.stepper;
      quote.set(id, quote.qty(id) + Number(s.dataset.step));
    });
    const off = quote.on(paint);
    paint();
    catalog().then(() => { if (!gone) paint(); }).catch(() => {});

    const form = el.querySelector('[data-quote-form]');
    // a link that asked for something the catalog doesn't list ("Ask for Milwaukee on a quote") starts that line
    // under "Not in the catalog?" and says so at the top, where a phone lands
    let note = '';
    try { note = sessionStorage.getItem('velocity.quote.note') || ''; sessionStorage.removeItem('velocity.quote.note'); } catch { /* storage off */ }
    note = note.slice(0, 120);
    if (note.trim()) {
      const box = form.extra;
      if (!box.value.includes(note.trim())) box.value = box.value ? `${box.value.replace(/\s+$/, '')}\n${note}` : note;
      const what = note.trim().replace(/:$/, '');
      el.querySelector('[data-qhint]').innerHTML = `<p class="note qhint">${icon('plus')}<span><b>${esc(what)}</b> is started on your quote under “Not in the catalog?”. Add the tools or part numbers you want and how many.</span><a class="link-arrow" href="#q-extra" data-scroll="q-extra">Go to it ${icon('arrow')}</a></p>`;
      // a keyboard that pops up on a phone would cover the page: only a mouse-and-keyboard screen gets the cursor
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) { box.focus({ preventScroll: true }); box.setSelectionRange(box.value.length, box.value.length); }
    }
    bindLeadForm(form, {
      type: 'quote', prefix: 'Q',
      build: (d) => {
        const cat = loaded();
        const items = quote.lines().map(({ id, qty }) => { const it = cat ? resolveItem(cat, id) : null; return { id, code: it ? it.code : '', label: it ? it.label : id, family: it ? it.fam.name : '', brand: it ? it.brand.name : '', qty }; });
        const units = items.reduce((s, i) => s + i.qty, 0);
        const sc = scoreLead({ timeline: d.timeline, role: d.role, bays: d.bays, lines: items.length + (d.extra ? 1 : 0), units });
        const power = (POWER.find(([v]) => v === d.power) || POWER[0])[1];
        return {
          lead: { name: d.name, shop: d.shop, email: d.email, phone: d.phone, zip: d.zip, role: d.role, score: sc.score, tier: sc.tier, items, lines: items.length, units, source: quote.source || '', details: { bays: d.bays, power, timeline: d.timeline, training: d.training === 'yes' ? 'yes' : 'no', extra: d.extra || '', notes: d.notes || '' } },
          summary: `QUOTE REQUEST\n${contactSummary(d)}\n\nBays: ${d.bays}\nShop power: ${power}\nTimeline: ${d.timeline}\nTraining wanted: ${d.training === 'yes' ? 'yes' : 'no'}\n\nList:\n${items.length ? items.map(i => `  ${i.qty} x ${i.code || '(no part number)'} ${i.label}${i.brand ? ` [${i.brand}]` : ''}`).join('\n') : '  nothing from the catalog'}\n\nNot in the catalog: ${d.extra || 'none'}\n${quote.source ? `Started from: ${quote.source}\n` : ''}Notes: ${d.notes || 'none'}`,
        };
      },
      success: { title: 'Quote request received.', body: 'Velocity prices your list and sends back a written quote. Keep the reference number above handy.' },
    });
    form.addEventListener('lead-saved', () => quote.clear());
    return () => { gone = true; off(); };
  },
};

/* ---------- private leads inbox (owner and editors only) ---------- */

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];
const TYPES = [['all', 'All'], ['quote', 'Quotes'], ['training', 'Training'], ['calibration', 'Calibration'], ['support', 'Support']];

export const leads = {
  id: 'leads', nav: 'leads', title: 'Leads inbox',
  render(el) {
    el.innerHTML = `
    <section class="phead">
      <div class="wrap">
        ${crumbs([['Home', '#home'], ['Leads inbox']])}
        <h1 class="h1" style="font-size:clamp(36px,4.6vw,72px)">Leads inbox</h1>
        <p class="lede phead__lede" data-sub>Checking access…</p>
      </div>
    </section>
    <section class="sec" style="padding-top:0"><div class="wrap" data-body></div></section>`;
    const body = el.querySelector('[data-body]'), sub = el.querySelector('[data-sub]');
    let unsub = null, gone = false, timer = 0;
    const state = { docs: [], type: 'all', status: 'all', q: '', open: new Set() };

    (async () => {
      const [db, ed] = await Promise.all([getDb(), viewerCanEdit()]);
      if (gone) return;
      if (!db || !ed) {
        sub.textContent = 'This page is for the Velocity team.';
        body.innerHTML = `<div class="inbox-empty"><p>Quote, training, calibration and support requests from the site land here for the owner and editors. Nothing is shown to anyone else.</p><p style="margin-top:16px"><a class="btn btn--ink" href="#home">Back to the site</a></p></div>`;
        return;
      }
      sub.textContent = 'Every quote, training, calibration and support request from the site. Only you and editors can see this page.';
      body.innerHTML = `<p class="muted small">Loading leads…</p>`;
      timer = setTimeout(() => { if (!state.loaded) body.innerHTML = `<div class="inbox-empty"><p>The inbox can’t be reached right now. It fills in when the connection comes back.</p></div>`; }, 10000);
      // one document per visitor (leads/<visitor id>), each holding that visitor's requests by reference number
      unsub = db.collection('leads').orderBy('updatedAt', 'desc').limit(300).onSnapshot(snap => {
        state.loaded = true; clearTimeout(timer);
        state.docs = snap.docs.flatMap(d => {
          const b = d.data() || {};
          return Object.entries(b.requests || {}).map(([ref, r]) => ({ ...r, ref: r.ref || ref, id: `${d.id}|${ref}` }));
        }).sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        paint();
      }, err => {
        clearTimeout(timer);
        body.innerHTML = `<div class="inbox-empty"><p>The inbox stopped updating (${esc(err && err.code || 'error')}). Reload the page to try again.</p></div>`;
      });
    })();

    const fmtDate = (t) => { try { return new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); } catch { return ''; } };
    const linesOf = (d) => (Array.isArray(d.items) ? d.items.length : Number(d.lines) || 0);
    const unitsOf = (d) => (Array.isArray(d.items) ? d.items.reduce((s, i) => s + (Number(i.qty) || 0), 0) : Number(d.units) || 0);

    function paint() {
      const q = state.q.toLowerCase();
      const rows = state.docs.filter(d => (state.type === 'all' || d.type === state.type) && (state.status === 'all' || (d.status || 'new') === state.status) && (!q || [d.ref, d.name, d.shop, d.email].join(' ').toLowerCase().includes(q)));
      const open = state.docs.filter(d => d.type === 'quote' && !['won', 'lost'].includes(d.status || 'new'));
      const hot = state.docs.filter(d => d.tier === 'hot' && (d.status || 'new') === 'new').length;
      body.innerHTML = `
        <div class="kpis" style="margin-bottom:28px">
          <div class="kpi"><span class="kpi__l">Leads</span><span class="kpi__v">${state.docs.length}</span><span class="kpi__s">${state.docs.filter(d => (d.status || 'new') === 'new').length} new</span></div>
          <div class="kpi"><span class="kpi__l">Hot and untouched</span><span class="kpi__v is-sig">${hot}</span><span class="kpi__s">Call these first</span></div>
          <div class="kpi"><span class="kpi__l">Open quotes</span><span class="kpi__v">${open.length}</span><span class="kpi__s">${open.reduce((s, d) => s + linesOf(d), 0)} lines to price</span></div>
        </div>
        <div class="inbox-tools">
          <div class="chips" style="flex:none">${TYPES.map(([v, l]) => `<button type="button" class="chip ${state.type === v ? 'is-on' : ''}" data-type="${v}">${l}</button>`).join('')}</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <select class="status-sel" data-status-filter aria-label="Status"><option value="all">Any status</option>${STATUSES.map(s => `<option value="${s}" ${state.status === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select>
            <input class="status-sel" style="width:220px" type="search" placeholder="Search name, shop, ref" value="${esc(state.q)}" data-search aria-label="Search leads">
          </div>
        </div>
        ${rows.length ? `<table class="ltable"><thead><tr><th>Ref</th><th>Received</th><th>Type</th><th>Who</th><th>List</th><th>Score</th><th>Status</th></tr></thead><tbody>
          ${rows.map(d => `<tr data-row="${esc(d.id)}">
            <td class="ref">${esc(d.ref || d.id)}${d.sample ? '<span class="samplepill">Sample</span>' : ''}</td>
            <td class="mono small">${esc(fmtDate(d.createdAt))}</td>
            <td><span class="typepill">${esc(d.type || '')}</span></td>
            <td class="who"><b>${esc(d.name || '')}</b><span>${esc(d.shop || '')}</span></td>
            <td class="mono">${linesOf(d) ? `${linesOf(d)} lines · ${unitsOf(d)} items` : 'None'}</td>
            <td><span class="tierpill tierpill--${esc(d.tier || 'cool')}">${esc(d.tier || 'cool')} ${Number(d.score) || 0}</span></td>
            <td><select class="status-sel" data-status="${esc(d.id)}" aria-label="Status for ${esc(d.ref || d.id)}">${STATUSES.map(s => `<option value="${s}" ${(d.status || 'new') === s ? 'selected' : ''}>${s[0].toUpperCase() + s.slice(1)}</option>`).join('')}</select></td>
          </tr>${state.open.has(d.id) ? `<tr class="ldetail"><td colspan="7"><div style="display:grid;gap:12px;padding:6px 0 10px"><pre>${esc(d.summary || JSON.stringify(d.details || {}, null, 2))}</pre><p><button type="button" class="btn btn--line btn--sm" data-copy-lead="${esc(d.id)}">${icon('copy')}<span>Copy details</span></button></p></div></td></tr>` : ''}`).join('')}
        </tbody></table>` : `<div class="inbox-empty"><p>${state.docs.length ? 'No leads match these filters.' : 'No leads yet. Send a request from the Quote page and it lands here.'}</p></div>`}`;
    }

    body.addEventListener('click', e => {
      const t = e.target.closest('[data-type]');
      if (t) { state.type = t.dataset.type; paint(); return; }
      const c = e.target.closest('[data-copy-lead]');
      if (c) { const d = state.docs.find(x => x.id === c.dataset.copyLead); if (d) copyText(d.summary || '', c); return; }
      if (e.target.closest('select, input, button, a')) return;
      const row = e.target.closest('[data-row]');
      if (row) { const id = row.dataset.row; state.open.has(id) ? state.open.delete(id) : state.open.add(id); paint(); }
    });
    body.addEventListener('change', async e => {
      const s = e.target.closest('[data-status]');
      if (s) {
        const db = await getDb();
        s.disabled = true;
        const [uid, ref] = s.dataset.status.split('|');
        try { await db.doc(`leads/${uid}`).update({ requests: { [ref]: { status: s.value, statusAt: Date.now() } } }); }
        catch (err) { s.disabled = false; s.insertAdjacentHTML('afterend', `<span class="field__err" style="display:block">Not saved (${esc(err && err.code || 'error')})</span>`); }
        return;
      }
      if (e.target.matches('[data-status-filter]')) { state.status = e.target.value; paint(); }
    });
    body.addEventListener('input', e => {
      if (e.target.matches('[data-search]')) { state.q = e.target.value; const pos = e.target.selectionStart; paint(); const s = body.querySelector('[data-search]'); s.focus(); s.setSelectionRange(pos, pos); }
    });
    return () => { gone = true; clearTimeout(timer); if (unsub) unsub(); };
  },
};
