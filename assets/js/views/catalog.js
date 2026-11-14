// The catalog: department index, department pages, product family pages and search results.
// Every product, part number, spec and photo comes from the catalog data (assets/data). Nothing here has a price.
import { CALIBRATION, HOME_DEPTS, TRAINING } from '../data.js';
import { esc, icon, addButton, syncAddButtons, revealIn, num } from '../core.js';
import { catalog, detail, photoAttrs, photoURL, famPack, famHref, deptHref, nCodes, nPages, loaded } from '../catalog-data.js';
import { search } from '../search.js';

const SP = /^SP\d{6,7}$/;
const rivets = '<i class="rv"></i><i class="rv"></i><i class="rv"></i><i class="rv"></i>';
export const lockMark = (cls = '') => `<svg class="lockmark ${cls}" viewBox="0 0 2 2" aria-hidden="true"><rect width="1" height="1" fill="currentColor"/><rect x="1" y="1" width="1" height="1" fill="currentColor"/><circle cx="1" cy="1" r=".23" fill="#FF3D1F"/></svg>`;

// a photo on its own light panel; the book's white backgrounds melt into it. pack: the photo pack that holds it
// (see catalog-data.js); src: a photo already loaded
// cap: the photo is never drawn more than 1.5 times its real size (catalog.css). The book's photos are small, and a
// small photo stretched across a big panel goes soft.
export function photo(key, { pack = '', src = '', alt = '', cls = '', eager = false, w = 0, h = 0, cap = false } = {}) {
  if (!key) return `<span class="ph-none ${cls}">${lockMark()}<span>No photo in the catalog</span></span>`;
  return `<img class="${cls}" ${src ? `src="${src}"` : photoAttrs(key, pack, eager)} alt="${esc(alt)}" decoding="async"${w && h ? ` width="${w}" height="${h}"` : ''}${cap && w && h ? ` style="--nw:${w}px;--nh:${h}px"` : ''}>`;
}

const loading = (what = 'the catalog') => `<div class="wrap cat-wait"><p class="kicker">Loading ${esc(what)}</p><div class="laser cat-wait__bar"></div></div>`;
const missing = (what) => `<div class="wrap nf"><p class="kicker">Catalog</p><h1 class="h1 h1--sm">That ${esc(what)} isn’t in the catalog.</h1><p class="lede">It may have moved. Search a part number or open a department.</p><p class="row-gap"><a class="btn btn--signal" href="#search">Search the catalog ${icon('search')}</a><a class="btn btn--line" href="#catalog">All departments</a></p></div>`;
const failed = () => `<div class="wrap nf"><p class="kicker">Catalog</p><h1 class="h1 h1--sm">The catalog didn’t load.</h1><p class="lede">Check your connection and reload the page. You can still call or email us your list.</p><p class="row-gap"><button type="button" class="btn btn--signal" onclick="location.reload()">Reload ${icon('rotate')}</button><a class="btn btn--line" href="#quote">Send your list</a></p></div>`;

// a product family card, built like the data plate riveted to the equipment
export function famCard(f, { lead = '', pack = '' } = {}) {
  const href = famHref(f);
  const more = f.all > 1 ? `<span class="fcard__more">${nCodes(f.all)}</span>` : '';
  return `<article class="fcard">
    <a class="fcard__img" href="${href}" tabindex="-1" aria-hidden="true">${photo(f.photo, { pack: pack || f.lp, w: f.w, h: f.h })}</a>
    <div class="fcard__body">
      ${rivets}
      <p class="fcard__code">${f.code ? `<span class="pn">${esc(f.code)}</span>` : '<span class="pn pn--none">Ask for the part number</span>'}${more}</p>
      <h3 class="fcard__name"><a href="${href}">${esc(f.name)}</a></h3>
      ${lead || f.short ? `<p class="fcard__short">${esc(lead || f.short)}</p>` : ''}
    </div>
  </article>`;
}

export function deptTile(d, { big = false } = {}) {
  const subs = d.subs.map(([s]) => s).filter(Boolean);
  return `<a class="dtile ${big ? 'dtile--big' : ''}" href="${deptHref(d)}">
    <span class="dtile__img">${photo(d.hero, { pack: 'set/heroes' })}</span>
    <span class="dtile__body">
      <span class="dtile__n"><span>${nCodes(d.codes)}</span></span>
      <span class="dtile__name">${esc(d.name)} ${icon('arrow')}</span>
      ${subs.length ? `<span class="dtile__subs">${esc(subs.slice(0, 4).join(' · '))}${subs.length > 4 ? ` · ${subs.length - 4} more` : ''}</span>` : `<span class="dtile__subs">${esc(d.blurb)}</span>`}
    </span>
  </a>`;
}

export function calTile() {
  return `<a class="dtile dtile--cal" href="#calibration">
    <span class="dtile__img dtile__img--cal" aria-hidden="true"><span class="caltarget"></span></span>
    <span class="dtile__body">
      <span class="dtile__n dtile__n--status"><i></i>${esc(CALIBRATION.status)}</span>
      <span class="dtile__name">${esc(CALIBRATION.name)} ${icon('arrow')}</span>
      <span class="dtile__subs">Velocity is choosing the supplier now. Leave your details and we’ll tell you when the lineup is set.</span>
    </span>
  </a>`;
}

// departments in the order the home page leads with, then the rest in catalog order
export function deptOrder(cat) {
  const first = HOME_DEPTS.map(id => cat.dept[id]).filter(Boolean);
  return [...first, ...cat.depts.filter(d => !HOME_DEPTS.includes(d.id))];
}

export const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([l, h], i) => {
  const last = i === items.length - 1, inner = h && !last ? `<a href="${h}">${esc(l)}</a>` : esc(l);
  return i === 0 ? inner : `<span>${inner}</span>`;
}).join('')}</nav>`;

const powerNote = `<p class="note">${icon('bolt')}<span>Specs are shown the way the factory prints them: metric units, and European voltages (230 V or 400 V) for most machines. Tell us your shop’s power on the quote and the right version gets quoted.</span></p>`;
const TRAIN_DEPTS = new Set(TRAINING.examples.map(([d]) => d));
const EURO_V = /\b(230|400|380|220)\s?V\b|\b(230|400)\s?\/\s?\d/;

/* ---------- catalog index ---------- */

export const catalogIndex = {
  id: 'catalog', nav: 'catalog', title: 'Catalog',
  render(el) {
    el.innerHTML = `
    <section class="phead cat-head">
      <div class="wrap">
        ${crumbs([['Home', '#home'], ['Catalog']])}
        <h1 class="h1">The catalog.</h1>
        <div class="cat-head__row">
          <p class="lede phead__lede">Welders, frame benches, spray booths, dust extraction, hand tools, air tools, lifts, carts and racks. Every product with its part numbers, specs and photos. Add what you need to your quote and Velocity sends back a written price.</p>
          <dl class="counts counts--3" data-counts></dl>
        </div>
        <form class="bigsearch" data-bigsearch role="search">
          <label class="sr" for="cat-q">Search the catalog</label>
          ${icon('search')}<input id="cat-q" name="q" type="search" autocomplete="off" placeholder="Search a part number or a product: SP202002, spot welder, bumper rack" enterkeyhint="search">
          <button type="submit" class="btn btn--signal">Search</button>
        </form>
      </div>
    </section>
    <section class="sec sec--tight cat-index" data-body>${loading()}</section>`;
    el.querySelector('[data-bigsearch]').addEventListener('submit', e => {
      e.preventDefault();
      const q = e.currentTarget.q.value.trim();
      if (q) location.hash = `search/${encodeURIComponent(q)}`;
    });
    let gone = false, stopReveal = () => {};
    catalog().then(cat => {
      if (gone) return;
      const c = cat.counts;
      el.querySelector('[data-counts]').innerHTML = [[c.codes, 'part numbers'], [c.depts, 'departments'], [c.photos, 'photos']]
        .map(([v, l]) => `<div><dt>${esc(l)}</dt><dd>${num(v)}</dd></div>`).join('');
      const body = el.querySelector('[data-body]');
      body.innerHTML = `<div class="wrap">
        <div class="dgrid">${deptOrder(cat).map(d => deptTile(d)).join('')}${calTile()}
          <a class="dtile dtile--list" href="#quote">
            <span class="dtile__body">
              <span class="dtile__n">Not listed here yet</span>
              <span class="dtile__name">Paint, masking, tape and more lines ${icon('arrow')}</span>
              <span class="dtile__subs">Velocity carries shop supplies and more lines that aren’t on the site yet. Put them in the notes of your quote, or send your own list.</span>
            </span>
          </a>
        </div>
        ${powerNote}
      </div>`;
      body.querySelectorAll('.dtile').forEach((t, i) => { t.setAttribute('data-reveal', ''); t.style.transitionDelay = `${Math.min(i, 12) * 30}ms`; });
      stopReveal = revealIn(body);
    }).catch(() => { if (!gone) el.querySelector('[data-body]').innerHTML = failed(); });
    return () => { gone = true; stopReveal(); };
  },
};

/* ---------- department ---------- */

export function deptPage(id) {
  return {
    id: 'dept', nav: 'catalog',
    title: () => (loaded() && loaded().dept[id] ? loaded().dept[id].name : 'Catalog'),
    render(el) {
      el.innerHTML = loading('the department');
      let gone = false, stopReveal = () => {}, io = null, ro = null;
      catalog().then(cat => {
        if (gone) return;
        const d = cat.dept[id];
        if (!d) { el.innerHTML = missing('department'); return; }
        document.title = `${d.name} | Velocity`;
        const subs = d.subs;
        const named = subs.filter(([s]) => s).length > 1;
        el.innerHTML = `
        <section class="phead dhead">
          <div class="wrap dhead__grid">
            <div>
              ${crumbs([['Home', '#home'], ['Catalog', '#catalog'], [d.name]])}
              <h1 class="h1 h1--md">${esc(d.name)}.</h1>
              <p class="lede phead__lede">${esc(d.blurb)}</p>
              <p class="dhead__n"><span>${nCodes(d.codes)}</span></p>
            </div>
            <div class="dhead__img">${photo(d.hero, { pack: d.hp, eager: true, w: d.hw, h: d.hh, cap: true })}</div>
          </div>
        </section>
        ${named ? `<div class="filters"><div class="wrap filters__in"><div class="chips" role="list">${subs.map(([s, ids], i) => `<a class="chip" role="listitem" href="#sub-${i}" data-sub="${i}">${esc(s || 'More')}<span class="chip__n">${ids.length}</span></a>`).join('')}</div></div></div>` : ''}
        <div class="wrap dbody">
          ${subs.map(([s, ids], i) => `<section class="catsec" id="sub-${i}" data-subsec="${i}">
            ${named ? `<header class="catsec__head"><h2>${esc(s || 'More from this department')}</h2><p class="catsec__meta">${nCodes(ids.reduce((n, fid) => n + cat.fam[fid].all, 0))}</p></header>` : ''}
            <div class="fgrid">${ids.map(fid => famCard(cat.fam[fid])).join('')}</div>
          </section>`).join('')}
          ${powerNote}
          <aside class="bay-callout"><div><h3>Want it on the floor first?</h3><p>Drop real catalog products into a 3D bay, move the camera around them, and send the whole bay as one quote.</p></div><a class="btn btn--signal" href="#bay">Build your bay ${icon('arrow')}</a></aside>
        </div>`;
        // chips scroll to their section (the hash is the route) and follow the reader down the page
        el.querySelectorAll('[data-sub]').forEach(a => a.addEventListener('click', e => {
          e.preventDefault();
          const t = el.querySelector(`#sub-${a.dataset.sub}`);
          if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - (document.querySelector('.hdr').offsetHeight + 76), behavior: 'smooth' });
        }));
        if (named && 'IntersectionObserver' in window) {
          // only the chip strip scrolls sideways; scrollIntoView would also stop the page's own smooth scroll
          const strip = el.querySelector('.chips');
          const mark = (k) => {
            let on = null;
            el.querySelectorAll('[data-sub]').forEach(c => { const v = c.dataset.sub === k; c.classList.toggle('is-on', v); if (v) on = c; });
            const left = on ? on.offsetLeft - (strip.clientWidth - on.offsetWidth) / 2 : 0;
            strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
          };
          io = new IntersectionObserver(en => en.forEach(x => {
            if (!x.isIntersecting) return;
            mark(x.target.dataset.subsec === undefined ? '' : x.target.dataset.subsec);
          }), { rootMargin: '-35% 0px -60% 0px' });
          el.querySelectorAll('[data-subsec]').forEach(s => io.observe(s));
          io.observe(el.querySelector('.dhead'));
        }
        // a busy department's chips run past the edge: a soft fade on the side that has more
        const chips = el.querySelector('.chips');
        if (chips) {
          const edges = () => { const max = chips.scrollWidth - chips.clientWidth; chips.classList.toggle('is-more-l', chips.scrollLeft > 4); chips.classList.toggle('is-more-r', chips.scrollLeft < max - 4); };
          chips.addEventListener('scroll', edges, { passive: true });
          if ('ResizeObserver' in window) { ro = new ResizeObserver(edges); ro.observe(chips); }
          edges();
        }
        el.querySelectorAll('.fcard').forEach((c, i) => { c.setAttribute('data-reveal', ''); c.style.transitionDelay = `${(i % 4) * 40}ms`; });
        stopReveal = revealIn(el);
      }).catch(() => { if (!gone) el.innerHTML = failed(); });
      return () => { gone = true; stopReveal(); if (io) io.disconnect(); if (ro) ro.disconnect(); };
    },
  };
}

/* ---------- product family ---------- */

function codeRows(f, dt, cat, focus) {
  // the part number list: the family's own codes, with the table columns the catalog prints
  const t = dt.table, own = dt.codes || [];
  const label = (c) => (cat.codes.get(c) || {}).label || '';
  let cols = [], rows = [];
  if (t && t.rows.length) {
    cols = t.cols;
    rows = t.rows.map(r => ({ code: r[0], label: SP.test(r[0]) ? label(r[0]) : '', vals: r.slice(1) }));
    const seen = new Set(rows.map(r => r.code));
    own.forEach(([c, l]) => { if (!seen.has(c)) rows.unshift({ code: c, label: l, vals: cols.map(() => ''), lead: true }); });
  } else rows = own.map(([c, l]) => ({ code: c, label: l, vals: [] }));
  if (!rows.length) return '';
  // tables whose rows are a kit's contents (no part numbers of their own) show as a list under the kit
  const anySP = rows.some(r => SP.test(r.code));
  const showLabel = rows.some(r => r.label && !(t && cols[0] && r.vals[0] && r.label.startsWith(r.vals[0])));
  return `<section class="fsec" id="parts">
    <header class="fsec__head"><h2 class="h3">${anySP ? 'Part numbers' : 'What’s in it'}</h2><p class="fsec__meta">${anySP ? nCodes(rows.filter(r => SP.test(r.code)).length) : `${rows.length} items`}</p></header>
    <div class="ptable-wrap"><table class="ptable ${cols.length ? '' : 'ptable--simple'}">
      <thead><tr><th scope="col" class="ptable__code">${anySP ? 'Part number' : 'Item'}</th>${showLabel ? '<th scope="col">Description</th>' : ''}${cols.map(c => `<th scope="col">${esc(c)}</th>`).join('')}${anySP ? '<th scope="col" class="ptable__q"><span class="sr">Quote</span></th>' : ''}</tr></thead>
      <tbody>${rows.map(r => {
        const isSP = SP.test(r.code), c = isSP ? cat.codes.get(r.code) : null;
        return `<tr id="${isSP ? `c-${r.code}` : ''}" class="${r.code === focus ? 'is-focus' : ''}" ${c && c.photo ? `data-photo="${esc(c.photo)}"` : ''}>
          <th scope="row" class="ptable__code">${isSP ? `<span class="pn">${esc(r.code)}</span>` : esc(r.code)}</th>
          ${showLabel ? `<td class="ptable__label">${esc(r.label)}</td>` : ''}
          ${cols.map((_, i) => `<td class="ptable__v">${esc(r.vals[i] || '')}</td>`).join('')}
          ${anySP ? `<td class="ptable__q">${isSP ? addButton(r.code, r.label || f.name, { text: 'Add' }) : ''}</td>` : ''}
        </tr>`;
      }).join('')}</tbody>
    </table></div>
  </section>`;
}

function codeList(title, list, cat, fid, sub = '') {
  if (!list || !list.length) return '';
  return `<section class="fsec">
    <header class="fsec__head"><h2 class="h3">${esc(title)}</h2><p class="fsec__meta">${nCodes(list.length)}</p></header>
    ${sub ? `<p class="fsec__sub">${esc(sub)}</p>` : ''}
    <ul class="clist">${list.map(([code, lab]) => {
      const c = cat.codes.get(code), other = c && c.fid !== fid ? cat.fam[c.fid] : null;
      const ph = c && c.photo;
      return `<li class="clist__i">
        <span class="clist__img">${ph ? photo(ph, { pack: famPack(c.fid) }) : ''}</span>
        <span class="clist__t"><span class="pn">${esc(code)}</span><span class="clist__n">${esc(lab || (c && c.label) || '')}</span>${other ? `<a class="clist__fam" href="${famHref(other, code)}">${esc(other.name)} ${icon('arrow')}</a>` : ''}</span>
        ${addButton(code, lab || (c && c.label) || code, { text: 'Add' })}
      </li>`;
    }).join('')}</ul>
  </section>`;
}

function includesBlock(inc, cat) {
  if (!inc) return '';
  const item = (x) => {
    // "Dent pulling star washer holder (SP240911)": link the code when it is in the catalog
    const m = x.match(/\(?(SP\d{6,7})\)?/);
    const c = m && cat.codes.get(m[1]);
    // "Trolley (SP232103)" reads as the name and its part number, without the brackets around the chip
    const txt = esc(x.replace(/\s*\((SP\d{6,7})\)/g, ' $1')).replace(/SP\d{6,7}/g, s => `<span class="pn">${s}</span>`);
    return `<li>${icon('check')}<span>${c ? `<a href="${famHref(cat.fam[c.fid], m[1])}">${txt}</a>` : txt}</span></li>`;
  };
  if (Array.isArray(inc)) return `<section class="fsec"><header class="fsec__head"><h2 class="h3">What comes with it</h2></header><ul class="inc">${inc.map(item).join('')}</ul></section>`;
  const keys = Object.keys(inc);
  return `<section class="fsec"><header class="fsec__head"><h2 class="h3">What comes with it</h2></header>
    <div class="incs incs--${Math.min(keys.length, 3)}">${keys.map(k => `<div class="incs__c"><p class="incs__k">${esc(k).replace(/SP\d{6,7}/g, s => `<span class="pn">${s}</span>`)}</p><ul class="inc">${inc[k].map(item).join('')}</ul></div>`).join('')}</div>
  </section>`;
}

export function familyPage(fid, focus0 = '') {
  return {
    id: 'family', nav: 'catalog',
    title: () => (loaded() && loaded().fam[fid] ? loaded().fam[fid].name : 'Product'),
    render(el) {
      let focus = focus0;
      el.innerHTML = loading('the product');
      let gone = false, stopReveal = () => {};
      Promise.all([catalog(), detail(fid)]).then(([cat, dt]) => {
        if (gone) return;
        const f = cat.fam[fid];
        if (!f) { el.innerHTML = missing('product'); return; }
        // the book prints three products twice: the copy opens the page the catalog lists
        if (f.dup && cat.fam[f.dup]) { location.replace(famHref(cat.fam[f.dup], focus)); return; }
        if (!dt) { el.innerHTML = failed(); return; }
        const d = cat.dept[f.dept];
        const photos = dt.photos && dt.photos.length ? dt.photos : (f.photo ? [[f.photo, f.w, f.h, []]] : []);
        // a part number in the address is shown only if it belongs to this product
        const fc0 = focus && cat.codes.get(focus);
        const fc = fc0 && (fc0.fid === fid || JSON.stringify(dt).includes(`"${focus}"`)) ? fc0 : null;
        if (!fc) focus = '';
        document.title = `${f.name}${focus ? ` ${focus}` : ''} | Velocity`;
        // old links (p/f009) and links with an old slug or a stray part number get the product's own address
        const canon = famHref(f, focus);
        if (location.hash !== canon) history.replaceState(null, '', canon);
        const startPhoto = fc && fc.photo && photos.findIndex(p => p[0] === fc.photo) >= 0 ? photos.findIndex(p => p[0] === fc.photo) : 0;
        const own = (dt.codes || []).filter(([c]) => SP.test(c));
        const allSP = [...new Set([...own.map(([c]) => c), ...((dt.table && dt.table.rows) || []).map(r => r[0]).filter(c => SP.test(c))])];
        const one = allSP.length === 1 ? allSP[0] : '';
        const specs = dt.specs || [];
        const euro = EURO_V.test(JSON.stringify([specs, dt.table || '']));
        const buy = fc
          ? `<div class="buy"><p class="buy__k">${focus === one ? 'Part number' : 'You picked'}</p><p class="buy__code"><span class="pn">${esc(focus)}</span> ${esc(fc.label)}</p>${addButton(focus, fc.label, { big: true })}${allSP.length > 1 ? `<a class="buy__more" href="#parts" data-jump="parts">See all ${allSP.length} versions ${icon('down')}</a>` : ''}</div>`
          : one
            ? `<div class="buy"><p class="buy__k">Part number</p><p class="buy__code"><span class="pn">${esc(one)}</span> ${esc((cat.codes.get(one) || {}).label || f.name)}</p>${addButton(one, (cat.codes.get(one) || {}).label || f.name, { big: true })}</div>`
            : allSP.length
              ? `<div class="buy"><p class="buy__k">${allSP.length} versions</p><p class="buy__code">Pick the part numbers you need from the list below and add each one to your quote.</p><a class="btn btn--signal btn--lg" href="#parts" data-jump="parts">Pick a version ${icon('down')}</a></div>`
              : `<div class="buy"><p class="buy__k">Part number on request</p><p class="buy__code">The catalog lists this one without a part number. Add it to your quote and Velocity confirms the exact version with you.</p>${addButton(f.id, f.name, { big: true, text: 'Add to quote' })}</div>`;
        el.innerHTML = `
        <section class="fam">
          <div class="wrap">${crumbs([['Catalog', '#catalog'], [d.name, deptHref(d)], ...(f.sub ? [[f.sub, `${deptHref(d)}`]] : [])])}</div>
          <div class="wrap fam__grid">
            <div class="fam__media">
              <figure class="gal" data-gal>
                <div class="gal__main">${photos.length ? photo(photos[startPhoto][0], { pack: famPack(fid), alt: f.name, eager: true, w: photos[startPhoto][1], h: photos[startPhoto][2], cap: true }) : photo(null)}</div>
                <figcaption class="gal__cap" data-cap>${photos.length && photos[startPhoto][3].length ? photos[startPhoto][3].map(c => `<span class="pn">${esc(c)}</span>`).join('') : ''}</figcaption>
              </figure>
              ${photos.length > 1 ? `<div class="gal__thumbs" role="list">${photos.map((p, i) => `<button type="button" role="listitem" class="gal__t ${i === startPhoto ? 'is-on' : ''}" data-ph="${i}" aria-label="Photo ${i + 1} of ${photos.length}">${photo(p[0], { pack: famPack(fid), eager: true })}</button>`).join('')}</div>` : ''}
            </div>
            <div class="fam__info">
              <p class="fam__dept"><a href="${deptHref(d)}">${esc(d.short)}</a>${f.sub ? `<span>${esc(f.sub)}</span>` : ''}</p>
              <h1 class="fam__title">${esc(f.name)}</h1>
              ${dt.desc ? `<p class="fam__lede">${esc(dt.desc)}</p>` : ''}
              ${buy}
              ${specs.length ? `<div class="plate">
                ${rivets}
                <div class="plate__top"><p class="plate__model">${esc(f.name)}</p>${lockMark('plate__lock')}</div>
                <dl class="plate__specs">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
                <p class="plate__serial"><span>Part no.</span>${allSP.slice(0, 4).map(c => `<b>${esc(c)}</b>`).join('')}${allSP.length > 4 ? `<b>+${allSP.length - 4}</b>` : ''}${!allSP.length ? '<b>On request</b>' : ''}</p>
              </div>` : ''}
              ${euro ? powerNote : ''}
              ${dt.features && dt.features.length ? `<div class="fam__feats"><p class="fam__h">Features</p><ul class="ticks">${dt.features.map(x => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul></div>` : ''}
            </div>
          </div>
        </section>
        <div class="wrap fam__more">
          ${codeRows(f, dt, cat, focus)}
          ${includesBlock(dt.includes, cat)}
          ${codeList('Options and accessories', dt.acc, cat, fid)}
          ${codeList('Consumables', dt.con, cat, fid)}
          ${codeList('Spare parts and related part numbers', dt.other, cat, fid)}
          ${TRAIN_DEPTS.has(f.dept) ? `<aside class="trainnote">${lockMark()}<div><p class="trainnote__t">Need your techs trained on it?</p><p>Velocity trains shops on the equipment it sells, when they need it. Tick the training box on your quote.</p></div><a class="link-arrow" href="#training">Training ${icon('arrow')}</a></aside>` : ''}
        </div>
        <section class="sec sec--tight related"><div class="wrap" data-related></div></section>`;

        // gallery
        const gal = el.querySelector('[data-gal]');
        let cur = startPhoto;
        const show = (i) => {
          const p = photos[i]; if (!p || i === cur) return;
          cur = i;
          gal.querySelector('[data-cap]').innerHTML = p[3].map(c => `<span class="pn">${esc(c)}</span>`).join('');
          el.querySelectorAll('[data-ph]').forEach(b => b.classList.toggle('is-on', +b.dataset.ph === i));
          // the photo swaps in once it is ready, so the frame never goes blank
          photoURL(p[0], famPack(fid)).then(src => {
            if (cur !== i || !src) return;
            const im = new Image(); im.src = src;
            (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => {
              if (cur === i) gal.querySelector('.gal__main').innerHTML = photo(p[0], { src, alt: f.name, w: p[1], h: p[2], cap: true });
            });
          }).catch(() => {});
        };
        el.querySelectorAll('[data-ph]').forEach(b => b.addEventListener('click', () => show(+b.dataset.ph)));
        // a row with its own photo shows it in the gallery
        el.querySelectorAll('tr[data-photo]').forEach(tr => tr.addEventListener('mouseenter', () => {
          const i = photos.findIndex(p => p[0] === tr.dataset.photo); if (i >= 0) show(i);
        }));
        el.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
          e.preventDefault(); const t = el.querySelector(`#${a.dataset.jump}`); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));

        // related: the rest of the subsection, then the department
        const sibs = (d.subs.find(([, ids]) => ids.includes(fid)) || [, []])[1].filter(x => x !== fid);
        const rest = d.fams.filter(x => x !== fid && !sibs.includes(x));
        const rel = [...sibs, ...rest].slice(0, 8).map(x => cat.fam[x]);
        el.querySelector('[data-related]').innerHTML = rel.length ? `<header class="catsec__head"><div><h2>More in ${esc(f.sub || d.name)}</h2></div><a class="link-arrow" href="${deptHref(d)}">${esc(d.name)} ${icon('arrow')}</a></header><div class="fgrid">${rel.map(x => famCard(x)).join('')}</div>` : '';

        syncAddButtons(el);
        if (focus) {
          const row = el.querySelector(`#c-${focus}`);
          if (row) setTimeout(() => { if (!gone && allSP.length > 6) row.scrollIntoView({ block: 'center' }); }, 60);
        }
        stopReveal = revealIn(el);
      }).catch(() => { if (!gone) el.innerHTML = failed(); });
      return () => { gone = true; stopReveal(); };
    },
  };
}

/* ---------- search results ---------- */

export function searchPage(q0 = '') {
  return {
    id: 'search', nav: 'catalog', title: () => (q0 ? `Search: ${q0}` : 'Search'),
    render(el) {
      el.innerHTML = `
      <section class="phead cat-head cat-head--search">
        <div class="wrap">
          ${crumbs([['Catalog', '#catalog'], ['Search']])}
          <h1 class="h1 h1--sm">Search the catalog.</h1>
          <form class="bigsearch bigsearch--page" data-bigsearch role="search">
            <label class="sr" for="s-q">Search the catalog</label>
            ${icon('search')}<input id="s-q" name="q" type="search" autocomplete="off" value="${esc(q0)}" placeholder="Part number or product" enterkeyhint="search">
            <button type="submit" class="btn btn--signal">Search</button>
          </form>
          <p class="sres__sum" data-sum aria-live="polite"></p>
        </div>
      </section>
      <section class="sec sec--tight" style="padding-top:8px"><div class="wrap" data-res>${q0 ? loading('results') : ''}</div></section>`;
      const form = el.querySelector('[data-bigsearch]'), input = form.q;
      let gone = false, cat = null, t = 0;
      const paint = (q) => {
        const res = el.querySelector('[data-res]'), sum = el.querySelector('[data-sum]');
        document.title = q ? `Search: ${q} | Velocity` : 'Search | Velocity';
        if (!q) { sum.textContent = ''; res.innerHTML = `<p class="muted">Type a part number like <span class="pn">SP202002</span>, or what the tool does: spot welder, bumper rack, paint gun, wrench set.</p>`; return; }
        const r = search(cat, q, { famLimit: 48, codeLimit: 60 });
        const nf = r.totalFams ?? r.fams.length, nc = r.totalCodes ?? r.codes.length;
        sum.innerHTML = r.exact ? `Part number <span class="pn">${esc(r.exact.code)}</span> is in the catalog.` : (nf || nc) ? `${[nc && nCodes(nc), nf && nPages(nf)].filter(Boolean).join(' and ')} match${nf + nc === 1 ? 'es' : ''} “${esc(q)}”.` : `Nothing in the catalog matches “${esc(q)}”.`;
        const exact = r.exact ? (() => { const c = r.exact, f = cat.fam[c.fid]; return `<div class="sres__exact">
            <a class="sres__exact-img" href="${famHref(f, c.code)}">${photo(c.photo || f.photo, { pack: famPack(f.id) })}</a>
            <div><p class="pn">${esc(c.code)}</p><p class="sres__exact-n"><a href="${famHref(f, c.code)}">${esc(c.label)}</a></p><p class="muted small">${esc(f.name)} · ${esc(cat.dept[f.dept].name)}</p></div>
            ${addButton(c.code, c.label, { big: true })}
          </div>`; })() : '';
        res.innerHTML = `${exact}
          ${r.fams.length ? `<section class="sres__sec"><header class="catsec__head"><h2>Products</h2><p class="catsec__meta">${nf > r.fams.length ? `First ${r.fams.length} of ${num(nf)}` : `${num(nf)} found`}</p></header><div class="fgrid">${r.fams.map(f => famCard(f)).join('')}</div></section>` : ''}
          ${r.codes.length ? `<section class="sres__sec"><header class="catsec__head"><h2>Part numbers</h2><p class="catsec__meta">${nc > r.codes.length ? `First ${r.codes.length} of ${num(nc)}` : `${num(nc)} found`}</p></header>
            <ul class="clist clist--wide">${r.codes.map(c => { const f = cat.fam[c.fid]; return `<li class="clist__i">
              <a class="clist__img" href="${famHref(f, c.code)}" tabindex="-1" aria-hidden="true">${c.photo ? photo(c.photo, { pack: famPack(c.fid) }) : ''}</a>
              <span class="clist__t"><span class="pn">${esc(c.code)}</span><a class="clist__n" href="${famHref(f, c.code)}">${esc(c.label)}</a><span class="clist__fam">${esc(f.name)}</span></span>
              ${addButton(c.code, c.label, { text: 'Add' })}
            </li>`; }).join('')}</ul></section>` : ''}
          ${!r.fams.length && !r.codes.length ? `<div class="sres__none"><p>Velocity carries more than this catalog: paint, masking, tape and shop supplies too. Send us what you’re looking for and we’ll find it.</p><p class="row-gap"><a class="btn btn--signal" href="#quote">Ask on a quote ${icon('arrow')}</a><a class="btn btn--line" href="#catalog">Browse the departments</a></p></div>` : ''}`;
        syncAddButtons(res);
      };
      form.addEventListener('submit', e => { e.preventDefault(); const q = input.value.trim(); history.replaceState(null, '', `#search${q ? `/${encodeURIComponent(q)}` : ''}`); if (cat) paint(q); });
      input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const q = input.value.trim(); history.replaceState(null, '', `#search${q ? `/${encodeURIComponent(q)}` : ''}`); if (cat) paint(q); }, 160); });
      catalog().then(c => { if (gone) return; cat = c; paint(q0); if (!q0) input.focus(); }).catch(() => { if (!gone) el.querySelector('[data-res]').innerHTML = failed(); });
      return () => { gone = true; clearTimeout(t); };
    },
  };
}
