import { CALIBRATION, HOME_DEPTS, TRAINING } from '../data.js';
import { esc, icon, addButton, syncAddButtons, revealIn, num, fitHints } from '../core.js';
import { catalog, detail, photoAttrs, photoURL, famPack, famHref, deptHref, brandHref, brandDeptHref, liveBrands, soonBrands, nameList, nCodes, nPages, codeSlug, codeInTail, loaded } from '../catalog-data.js';
import { search } from '../search.js';

const rivets = '<i class="rv"></i><i class="rv"></i><i class="rv"></i><i class="rv"></i>';
export const lockMark = (cls = '') => `<svg class="lockmark ${cls}" viewBox="0 0 2 2" aria-hidden="true"><rect width="1" height="1" fill="currentColor"/><rect x="1" y="1" width="1" height="1" fill="currentColor"/><circle cx="1" cy="1" r=".23" fill="#FF3D1F"/></svg>`;

export function photo(key, { pack = '', src = '', alt = '', cls = '', eager = false, w = 0, h = 0, cap = false } = {}) {
  if (!key) return `<span class="ph-none ${cls}">${lockMark()}<span>No photo in the catalog</span></span>`;
  return `<img class="${cls}" ${src ? `src="${src}"` : photoAttrs(key, pack, eager)} alt="${esc(alt)}" decoding="async"${w && h ? ` width="${w}" height="${h}"` : ''}${cap && w && h ? ` style="--nw:${w}px;--nh:${h}px"` : ''}>`;
}

export const loading = (what = 'the catalog') => `<div class="wrap cat-wait"><p class="kicker">Loading ${esc(what)}</p><div class="laser cat-wait__bar"></div></div>`;
export const missing = (what) => `<div class="wrap nf"><p class="kicker">Catalog</p><h1 class="h1 h1--sm">That ${esc(what)} isn’t in the catalog.</h1><p class="lede">It may have moved. Search a part number or open a department.</p><p class="row-gap"><a class="btn btn--signal" href="#search">Search the catalog ${icon('search')}</a><a class="btn btn--line" href="#catalog">All departments</a></p></div>`;
export const failed = () => `<div class="wrap nf"><p class="kicker">Catalog</p><h1 class="h1 h1--sm">The catalog didn’t load.</h1><p class="lede">Check your connection and reload the page. You can still call or email us your list.</p><p class="row-gap"><button type="button" class="btn btn--signal" data-reload>Reload ${icon('rotate')}</button><a class="btn btn--line" href="#quote">Send your list</a></p></div>`;

export function famCard(f, { lead = '', pack = '', brand = null } = {}) {
  const href = famHref(f);
  const more = f.all > 1 ? `<span class="fcard__more">${nCodes(f.all)}</span>` : '';
  return `<article class="fcard">
    <a class="fcard__img" href="${href}" tabindex="-1" aria-hidden="true">${photo(f.photo, { pack: pack || f.lp, w: f.w, h: f.h })}</a>
    <div class="fcard__body">
      ${rivets}
      ${brand ? `<p class="fcard__brand">${esc(brand.name)}</p>` : ''}
      <p class="fcard__code">${f.code ? `<span class="pn">${esc(f.code)}</span>` : '<span class="pn pn--none">Ask for the part number</span>'}${more}</p>
      <h3 class="fcard__name"><a href="${href}">${esc(f.name)}</a></h3>
      ${lead || f.short ? `<p class="fcard__short">${esc(lead || f.short)}</p>` : ''}
    </div>
  </article>`;
}

export function famRows(ids, cat, { brand = false } = {}) {
  return `<ul class="clist clist--wide clist--rows">${ids.map(id => {
    const f = cat.fam[id];
    const meta = [brand && esc(cat.brand[f.brand].name), f.all > 1 && nCodes(f.all)].filter(Boolean).join(' · ');
    return `<li class="clist__i">
      <span class="clist__t">${f.code ? `<span class="pn">${esc(f.code)}</span>` : ''}<a class="clist__n" href="${famHref(f)}">${esc(f.name)}</a>${meta ? `<span class="clist__fam">${meta}</span>` : ''}</span>
      ${f.all === 1 && f.code ? addButton(f.code, f.name, { text: 'Add' }) : `<a class="btn btn--line btn--sm" href="${famHref(f)}"><span>Open</span>${icon('arrow')}</a>`}
    </li>`;
  }).join('')}</ul>`;
}

const deptPhoto = (d, cat, brand) => {
  if (!brand || d.hb === brand.id || (!d.hb && d.brands[0] === brand.id)) return photo(d.hero, { pack: 'set/heroes' });
  const f = d.by[brand.id].fams.map(id => cat.fam[id]).find(x => x.photo);
  return f ? photo(f.photo, { pack: f.lp }) : '';
};

export function deptTile(d, { big = false, brand = null, cat = null } = {}) {
  const part = brand ? d.by[brand.id] : d;
  const subs = part.subs.map(([s]) => s).filter(Boolean);
  const img = deptPhoto(d, cat, brand);
  return `<a class="dtile ${big ? 'dtile--big' : ''} ${img ? '' : 'dtile--bare'}" href="${brand ? brandDeptHref(brand, d) : deptHref(d)}">
    ${img ? `<span class="dtile__img">${img}</span>` : ''}
    <span class="dtile__body">
      <span class="dtile__n"><span>${nCodes(part.codes)}</span></span>
      <span class="dtile__name">${esc(d.name)} ${icon('arrow')}</span>
      ${subs.length ? `<span class="dtile__subs">${esc(subs.slice(0, 4).join(' · '))}${subs.length > 4 ? ` · ${subs.length - 4} more` : ''}</span>` : `<span class="dtile__subs">${esc(d.blurb)}</span>`}
    </span>
  </a>`;
}


export const nDepts = (n) => `${n} department${n === 1 ? '' : 's'}`;
export function brandsLine(cat) {
  const live = liveBrands(cat).map(b => b.name), soon = soonBrands(cat).map(b => b.name);
  return [live.length ? `${nameList(live)} ${live.length === 1 ? 'is' : 'are'} on the site in full.` : '', soon.length ? `${nameList(soon)} ${soon.length === 1 ? 'is' : 'are'} being added.` : ''].filter(Boolean).join(' ');
}

export function brandCard(b, cat) {
  if (!b.live) return `<a class="bcard bcard--soon" href="${brandHref(b)}">
    <span class="bcard__body">
      <span class="bcard__k bcard__k--status"><i></i>Catalog being added</span>
      <span class="bcard__name">${esc(b.name)} ${icon('arrow')}</span>
      <span class="bcard__line">${esc(b.line || `Ask for ${b.name} on your quote while its catalog is being added.`)}</span>
    </span>
  </a>`;
  const shots = b.depts.filter(d => d.hb === b.id || (!d.hb && d.brands[0] === b.id)).slice(0, 3);
  return `<a class="bcard ${shots.length ? '' : 'bcard--bare'}" href="${brandHref(b)}">
    ${shots.length ? `<span class="bcard__imgs" aria-hidden="true">${shots.map(d => `<span class="bcard__img">${photo(d.hero, { pack: 'set/heroes' })}</span>`).join('')}</span>` : ''}
    <span class="bcard__body">
      <span class="bcard__k">${nCodes(b.codes)} · ${nDepts(b.depts.length)}</span>
      <span class="bcard__name">${esc(b.name)} ${icon('arrow')}</span>
      ${b.line ? `<span class="bcard__line">${esc(b.line)}</span>` : ''}
    </span>
  </a>`;
}
export const brandGrid = (cat, list = cat.brands) => `<div class="bgrid bgrid--${Math.min(list.length, 3)}">${list.map(b => brandCard(b, cat)).join('')}</div>`;

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

export function deptOrder(cat) {
  const first = HOME_DEPTS.map(id => cat.dept[id]).filter(Boolean);
  return [...first, ...cat.depts.filter(d => !HOME_DEPTS.includes(d.id))];
}

export const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb">${items.map(([l, h], i) => {
  const last = i === items.length - 1, inner = h && !last ? `<a href="${h}">${esc(l)}</a>` : esc(l);
  return i === 0 ? inner : `<span>${inner}</span>`;
}).join('')}</nav>`;

export const powerNote = `<p class="note">${icon('bolt')}<span>Specs are shown the way the factory prints them: metric units, and European voltages (230 V or 400 V) for most machines. Tell us your shop’s power on the quote and the right version gets quoted.</span></p>`;
export const powerNoteFor = (brands) => (brands.some(b => b && b.euro) ? powerNote : '');
const TRAIN_DEPTS = new Set(TRAINING.examples.map(([d]) => d));
const EURO_V = /\b(230|400|380|220)\s?V\b|\b(230|400)\s?\/\s?\d/;


export const listTile = () => `<a class="dtile dtile--list" href="#quote">
  <span class="dtile__body">
    <span class="dtile__n">Not listed here yet</span>
    <span class="dtile__name">Paint, masking, tape and more lines ${icon('arrow')}</span>
    <span class="dtile__subs">Velocity carries shop supplies and more lines that aren’t on the site yet. Put them in the notes of your quote, or send your own list.</span>
  </span>
</a>`;

export const catalogIndex = {
  id: 'catalog', nav: 'catalog', title: 'Catalog',
  render(el) {
    el.innerHTML = `
    <section class="phead cat-head">
      <div class="wrap">
        ${crumbs([['Home', '#home'], ['Catalog']])}
        <h1 class="h1">The catalog.</h1>
        <div class="cat-head__row">
          <p class="lede phead__lede">Shop by brand or by department. Every product carries its part numbers, specs and photos. Add what you need to your quote and Velocity sends back a written price.</p>
          <div>
            <dl class="counts counts--3" data-counts></dl>
            <p class="counts__src" data-counts-src></p>
          </div>
        </div>
        <form class="bigsearch" data-bigsearch role="search">
          <label class="sr" for="cat-q">Search the catalog</label>
          ${icon('search')}<input id="cat-q" name="q" type="search" autocomplete="off" placeholder="Part number or product" data-hints="Search a part number or a product: SP202002, spot welder, bumper rack|Search a part number or a product|Part number or product|Part number|Search" enterkeyhint="search">
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
    const stopHint = fitHints(el);
    let gone = false, stopReveal = () => {};
    catalog().then(cat => {
      if (gone) return;
      const c = cat.counts;
      el.querySelector('[data-counts]').innerHTML = [[c.codes, 'part numbers'], [c.depts, 'departments'], [c.photos, 'photos']]
        .map(([v, l]) => `<div><dt>${esc(l)}</dt><dd>${num(v)}</dd></div>`).join('');
      el.querySelector('[data-counts-src]').textContent = countsSource(cat);
      const body = el.querySelector('[data-body]');
      body.innerHTML = `<div class="wrap">
        <section class="catsec catsec--first" id="by-brand">
          <header class="catsec__head"><h2>Shop by brand</h2><a class="link-arrow" href="#brands">All brands ${icon('arrow')}</a></header>
          ${brandGrid(cat)}
        </section>
        <section class="catsec" id="by-department">
          <header class="catsec__head"><h2>Shop by department</h2><p class="catsec__meta">${nDepts(cat.depts.length)}</p></header>
          <div class="dgrid">${deptOrder(cat).map(d => deptTile(d)).join('')}${calTile()}${listTile()}</div>
        </section>
        ${powerNoteFor(liveBrands(cat))}
      </div>`;
      body.querySelectorAll('.dtile, .bcard').forEach((t, i) => { t.setAttribute('data-reveal', ''); t.style.transitionDelay = `${Math.min(i, 12) * 30}ms`; });
      stopReveal = revealIn(body);
    }).catch((e) => { console.error(e); if (!gone) el.querySelector('[data-body]').innerHTML = failed(); });
    return () => { gone = true; stopReveal(); stopHint(); };
  },
};

export function countsSource(cat) {
  const live = liveBrands(cat).map(b => b.name), soon = soonBrands(cat).map(b => b.name);
  if (!live.length) return '';
  return `${live.length === 1 ? `All from the ${live[0]} catalog.` : `From the ${nameList(live)} catalogs.`}${soon.length ? ` ${nameList(soon)} ${soon.length === 1 ? 'is' : 'are'} being added.` : ''}`;
}


export function deptPage(id, brandId = '') {
  return {
    id: 'dept', nav: 'catalog',
    title: () => {
      const cat = loaded(), d = cat && cat.dept[id], b = cat && brandId ? cat.brand[brandId] : null;
      return d ? (b ? `${b.name} ${d.name}` : d.name) : 'Catalog';
    },
    render(el) {
      el.innerHTML = loading('the department');
      let gone = false, stopReveal = () => {}, io = null, ro = null;
      catalog().then(cat => {
        if (gone) return;
        const d = cat.dept[id];
        if (!d) { el.innerHTML = missing('department'); return; }
        const b = brandId ? cat.brand[brandId] : null;
        if (brandId && !b) { el.innerHTML = missing('brand'); return; }
        if (b && !b.live) { location.replace(brandHref(b)); return; }
        if (b && !d.by[b.id]) {
          document.title = `${b.name} ${d.name} | Velocity`;
          el.innerHTML = `<div class="wrap nf"><p class="kicker">${esc(b.name)}</p><h1 class="h1 h1--sm">Nothing from ${esc(b.name)} here.</h1><p class="lede">${esc(b.name)} has no products in ${esc(d.name)} on the site. Open the department from every brand, or see what ${esc(b.name)} does list.</p><p class="row-gap"><a class="btn btn--signal" href="${deptHref(d)}">${esc(d.name)} ${icon('arrow')}</a><a class="btn btn--line" href="${brandHref(b)}">${esc(b.name)}</a></p></div>`;
          return;
        }
        document.title = `${b ? `${b.name} ` : ''}${d.name} | Velocity`;
        const part = b ? d.by[b.id] : d;
        const subs = part.subs;
        const named = subs.filter(([s]) => s).length > 1;
        const mixed = !b && d.brands.length > 1;
        const own = !b || d.hb === b.id || (!d.hb && d.brands[0] === b.id);
        const lead = b && !own ? d.by[b.id].fams.map(x => cat.fam[x]).find(x => x.photo) : null;
        const img = own ? photo(d.hero, { pack: d.hp, eager: true, w: d.hw, h: d.hh, cap: true })
          : lead ? photo(lead.photo, { pack: lead.lp, eager: true, w: lead.w, h: lead.h, cap: true }) : '';
        const by = b
          ? (d.brands.length > 1 ? `<p class="dhead__by"><a class="link-arrow" href="${deptHref(d)}">${esc(d.name)} from every brand ${icon('arrow')}</a></p>` : '')
          : d.brands.length > 1
            ? `<div class="dhead__brands"><span class="dhead__k">Brand</span><div class="chips">${[`<a class="chip is-on" href="${deptHref(d)}" aria-current="page">All brands</a>`, ...d.brands.map(x => `<a class="chip" href="${brandDeptHref(cat.brand[x], d)}">${esc(cat.brand[x].name)}</a>`)].join('')}</div></div>`
            : `<p class="dhead__by">All from <a href="${brandDeptHref(cat.brand[d.brands[0]], d)}">${esc(cat.brand[d.brands[0]].name)}</a>.</p>`;
        const list = (ids) => {
          const fams = ids.map(x => cat.fam[x]);
          const cards = fams.filter(f => !cat.brand[f.brand].rows), rows = fams.filter(f => cat.brand[f.brand].rows);
          return `${cards.length ? `<div class="fgrid">${cards.map(f => famCard(f, { brand: mixed ? cat.brand[f.brand] : null })).join('')}</div>` : ''}${rows.length ? famRows(rows.map(f => f.id), cat, { brand: mixed }) : ''}`;
        };
        el.innerHTML = `
        <section class="phead dhead">
          <div class="wrap dhead__grid ${img ? '' : 'dhead__grid--bare'}">
            <div>
              ${crumbs(b ? [['Catalog', '#catalog'], [b.name, brandHref(b)], [d.name]] : [['Home', '#home'], ['Catalog', '#catalog'], [d.name]])}
              ${b ? `<p class="dhead__brand"><a href="${brandHref(b)}">${esc(b.name)}</a></p>` : ''}
              <h1 class="h1 h1--md">${esc(d.name)}.</h1>
              <p class="lede phead__lede">${esc(d.blurb)}</p>
              <p class="dhead__n"><span>${nCodes(part.codes)}</span></p>
              ${by}
            </div>
            ${img ? `<div class="dhead__img">${img}</div>` : ''}
          </div>
        </section>
        ${named ? `<div class="filters"><div class="wrap filters__in"><div class="chips" role="list" data-subchips>${subs.map(([s], i) => `<a class="chip" role="listitem" href="#sub-${i}" data-sub="${i}">${esc(s || 'More')}</a>`).join('')}</div></div></div>` : ''}
        <div class="wrap dbody">
          ${subs.map(([s, ids], i) => `<section class="catsec" id="sub-${i}" data-subsec="${i}">
            ${named ? `<header class="catsec__head"><h2>${esc(s || 'More from this department')}</h2><p class="catsec__meta">${nCodes(ids.reduce((n, fid) => n + cat.fam[fid].all, 0))}</p></header>` : ''}
            ${list(ids)}
          </section>`).join('')}
          ${powerNoteFor(b ? [b] : d.brands.map(x => cat.brand[x]))}
          <aside class="bay-callout"><div><h3>Want it on the floor first?</h3><p>Drop real catalog products into a 3D bay, move the camera around them, and send the whole bay as one quote.</p></div><a class="btn btn--signal" href="#bay">Build your bay ${icon('arrow')}</a></aside>
        </div>`;
        el.querySelectorAll('[data-sub]').forEach(a => a.addEventListener('click', e => {
          e.preventDefault();
          const t = el.querySelector(`#sub-${a.dataset.sub}`);
          if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - (document.querySelector('.hdr').offsetHeight + 76), behavior: 'smooth' });
        }));
        const strip = el.querySelector('[data-subchips]');
        if (named && 'IntersectionObserver' in window) {
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
        if (strip) {
          const edges = () => { const max = strip.scrollWidth - strip.clientWidth; strip.classList.toggle('is-more-l', strip.scrollLeft > 4); strip.classList.toggle('is-more-r', strip.scrollLeft < max - 4); };
          strip.addEventListener('scroll', edges, { passive: true });
          if ('ResizeObserver' in window) { ro = new ResizeObserver(edges); ro.observe(strip); }
          edges();
        }
        el.querySelectorAll('.fcard').forEach((c, i) => { c.setAttribute('data-reveal', ''); c.style.transitionDelay = `${(i % 4) * 40}ms`; });
        stopReveal = revealIn(el);
      }).catch((e) => { console.error(e); if (!gone) el.innerHTML = failed(); });
      return () => { gone = true; stopReveal(); if (io) io.disconnect(); if (ro) ro.disconnect(); };
    },
  };
}


function codeRows(f, dt, cat, focus) {
  const t = dt.table, own = dt.codes || [];
  const label = (c) => (cat.codes.get(c) || {}).label || '';
  const isCode = (c) => cat.codes.has(c);
  let cols = [], rows = [];
  if (t && t.rows.length) {
    cols = t.cols;
    rows = t.rows.map(r => ({ code: r[0], label: isCode(r[0]) ? label(r[0]) : '', vals: r.slice(1) }));
    const seen = new Set(rows.map(r => r.code));
    own.forEach(([c, l]) => { if (!seen.has(c)) rows.unshift({ code: c, label: l, vals: cols.map(() => ''), lead: true }); });
  } else rows = own.map(([c, l]) => ({ code: c, label: l, vals: [] }));
  if (!rows.length) return '';
  const anySP = rows.some(r => isCode(r.code));
  const showLabel = rows.some(r => r.label && !(t && cols[0] && r.vals[0] && r.label.startsWith(r.vals[0])));
  const block = new Map((dt.items || []).flatMap(it => it.codes.map(x => [x, it.codes[0]])));
  const more = (code) => (block.has(code) ? ` <a class="ptable__more" href="#details" data-jump="i-${codeSlug(block.get(code))}">Specs ${icon('down')}</a>` : '');
  return `<section class="fsec" id="parts">
    <header class="fsec__head"><h2 class="h3">${anySP ? 'Part numbers' : 'What’s in it'}</h2><p class="fsec__meta">${anySP ? nCodes(rows.filter(r => isCode(r.code)).length) : `${rows.length} items`}</p></header>
    <div class="ptable-wrap"><table class="ptable ${cols.length ? '' : 'ptable--simple'}">
      <thead><tr><th scope="col" class="ptable__code">${anySP ? 'Part number' : 'Item'}</th>${showLabel ? '<th scope="col">Description</th>' : ''}${cols.map(c => `<th scope="col">${esc(c)}</th>`).join('')}${anySP ? '<th scope="col" class="ptable__q"><span class="sr">Quote</span></th>' : ''}</tr></thead>
      <tbody>${rows.map(r => {
        const isSP = isCode(r.code), c = isSP ? cat.codes.get(r.code) : null;
        return `<tr${isSP ? ` id="c-${codeSlug(r.code)}"` : ''} class="${r.code === focus ? 'is-focus' : ''}" ${c && c.photo ? `data-photo="${esc(c.photo)}"` : ''}>
          <th scope="row" class="ptable__code">${isSP ? `<span class="pn">${esc(r.code)}</span>` : esc(r.code)}</th>
          ${showLabel ? `<td class="ptable__label">${esc(r.label)}${more(r.code)}</td>` : ''}
          ${cols.map((_, i) => `<td class="ptable__v">${esc(r.vals[i] || '')}</td>`).join('')}
          ${anySP ? `<td class="ptable__q">${isSP ? addButton(r.code, r.label || f.name, { text: 'Add' }) : ''}</td>` : ''}
        </tr>`;
      }).join('')}</tbody>
    </table></div>
  </section>`;
}

const specCell = (v) => (v === '-' || v === '' ? '<span class="pcomp__no">–</span>' : esc(v));
function itemBlocks(dt, cat, focus) {
  const items = dt.items;
  if (!items || !items.length) return '';
  const label = (code) => (cat.codes.get(code) || {}).label || '';
  const n = new Set(items.flatMap(it => it.codes)).size;
  const isWide = (it) => !!it && (it.cols || []).length > 1;
  let col = 0;
  const solo = items.map((it, i) => {
    if (isWide(it)) { col = 0; return false; }
    if (col === 0 && (i === items.length - 1 || isWide(items[i + 1]))) return true;
    col = 1 - col;
    return false;
  });
  return `<section class="fsec" id="details">
    <header class="fsec__head"><h2 class="h3">Details by part number</h2><p class="fsec__meta">${nCodes(n)}</p></header>
    <div class="pitems">${items.map((it, i) => {
      const codes = it.codes, one = codes.length === 1 ? codes[0] : '';
      const c0 = cat.codes.get(codes[0]);
      const name = it.name || label(codes[0]);
      const specs = it.specs || [], cols = it.cols || [];
      const wide = cols.length > 1;
      return `<article class="pitem ${wide || solo[i] ? 'pitem--wide' : ''} ${codes.includes(focus) ? 'is-focus' : ''}" id="i-${codeSlug(codes[0])}">
        <header class="pitem__head">
          <span class="clist__img pitem__img">${c0 && c0.photo ? photo(c0.photo, { pack: famPack(c0.fid) }) : ''}</span>
          <div class="pitem__t"><p class="pitem__codes">${codes.map(x => `<span class="pn">${esc(x)}</span>`).join('')}</p><h3 class="pitem__name">${esc(name)}</h3></div>
          ${one ? addButton(one, label(one) || name, { text: 'Add' }) : ''}
        </header>
        ${it.desc ? `<p class="pitem__desc">${esc(it.desc)}</p>` : ''}
        ${specs.length && wide ? `<div class="ptable-wrap pcomp-wrap"><table class="pcomp">
          <thead><tr><th scope="col"><span class="sr">Spec</span></th>${cols.map(x => `<th scope="col"><span class="pn">${esc(x)}</span></th>`).join('')}</tr></thead>
          <tbody>${specs.map(r => `<tr><th scope="row">${esc(r[0])}</th>${r.length === 2 ? `<td colspan="${cols.length}" class="pcomp__all">${specCell(r[1])}</td>` : r.slice(1).map(v => `<td>${specCell(v)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table></div>` : ''}
        ${specs.length && !wide ? `<dl class="pspecs">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
        ${it.note ? `<p class="pitem__note">${esc(it.note)}</p>` : ''}
        ${it.features && it.features.length ? `<ul class="ticks pitem__feats">${it.features.map(x => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul>` : ''}
      </article>`;
    }).join('')}</div>
  </section>`;
}

function stepsBlock(st) {
  if (!st || !st.list || !st.list.length) return '';
  return `<section class="fsec"><header class="fsec__head"><h2 class="h3">${esc(st.title || 'How to use it')}</h2></header>
    ${st.lede ? `<p class="fsec__sub">${esc(st.lede)}</p>` : ''}
    <ol class="pguide">${st.list.map(x => `<li><span>${esc(x)}</span></li>`).join('')}</ol>
  </section>`;
}
function notesBlock(notes) {
  if (!notes || !notes.length) return '';
  return `<section class="fsec"><header class="fsec__head"><h2 class="h3">Good to know</h2></header><ul class="inc">${notes.map(x => `<li>${icon('check')}<span>${esc(x)}</span></li>`).join('')}</ul></section>`;
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
    const m = x.match(/\(?(SP\d{6,7})\)?/);
    const c = m && cat.codes.get(m[1]);
    const txt = esc(x.replace(/\s*\((SP\d{6,7})\)/g, ' $1')).replace(/SP\d{6,7}/g, s => `<span class="pn">${s}</span>`);
    return `<li>${icon('check')}<span>${c ? `<a href="${famHref(cat.fam[c.fid], m[1])}">${txt}</a>` : txt}</span></li>`;
  };
  if (Array.isArray(inc)) return `<section class="fsec"><header class="fsec__head"><h2 class="h3">What comes with it</h2></header><ul class="inc">${inc.map(item).join('')}</ul></section>`;
  const keys = Object.keys(inc);
  return `<section class="fsec"><header class="fsec__head"><h2 class="h3">What comes with it</h2></header>
    <div class="incs incs--${Math.min(keys.length, 3)}">${keys.map(k => `<div class="incs__c"><p class="incs__k">${esc(k).replace(/SP\d{6,7}/g, s => `<span class="pn">${s}</span>`)}</p><ul class="inc">${inc[k].map(item).join('')}</ul></div>`).join('')}</div>
  </section>`;
}

export function familyPage(fid, tail = '') {
  return {
    id: 'family', nav: 'catalog',
    title: () => (loaded() && loaded().fam[fid] ? loaded().fam[fid].name : 'Product'),
    render(el) {
      let focus = '';
      el.innerHTML = loading('the product');
      let gone = false, stopReveal = () => {};
      Promise.all([catalog(), detail(fid)]).then(([cat, dt]) => {
        if (gone) return;
        const f = cat.fam[fid];
        if (!f) { el.innerHTML = missing('product'); return; }
        focus = codeInTail(cat, tail);
        if (f.dup && cat.fam[f.dup]) { location.replace(famHref(cat.fam[f.dup], focus)); return; }
        if (!dt) { el.innerHTML = failed(); return; }
        const d = cat.dept[f.dept], b = cat.brand[f.brand];
        const photos = dt.photos && dt.photos.length ? dt.photos : (f.photo ? [[f.photo, f.w, f.h, []]] : []);
        const fc0 = focus && cat.codes.get(focus);
        const fc = fc0 && (fc0.fid === fid || JSON.stringify(dt).includes(`"${focus}"`)) ? fc0 : null;
        if (!fc) focus = '';
        document.title = `${f.name}${focus ? ` ${focus}` : ''} · ${b.name} | Velocity`;
        const canon = famHref(f, focus);
        if (location.hash !== canon) history.replaceState(null, '', canon);
        const startPhoto = fc && fc.photo && photos.findIndex(p => p[0] === fc.photo) >= 0 ? photos.findIndex(p => p[0] === fc.photo) : 0;
        const own = (dt.codes || []).filter(([c]) => cat.codes.has(c));
        const allSP = [...new Set([...own.map(([c]) => c), ...((dt.table && dt.table.rows) || []).map(r => r[0]).filter(c => cat.codes.has(c))])];
        const one = allSP.length === 1 ? allSP[0] : '';
        const specs = dt.specs || [];
        const euro = EURO_V.test(JSON.stringify([specs, dt.table || '', dt.items || '']));
        const buy = fc
          ? `<div class="buy"><p class="buy__k">${focus === one ? 'Part number' : 'You picked'}</p><p class="buy__code"><span class="pn">${esc(focus)}</span> ${esc(fc.label)}</p>${addButton(focus, fc.label, { big: true })}${allSP.length > 1 ? `<a class="buy__more" href="#parts" data-jump="parts">See all ${allSP.length} versions ${icon('down')}</a>` : ''}</div>`
          : one
            ? `<div class="buy"><p class="buy__k">Part number</p><p class="buy__code"><span class="pn">${esc(one)}</span> ${esc((cat.codes.get(one) || {}).label || f.name)}</p>${addButton(one, (cat.codes.get(one) || {}).label || f.name, { big: true })}</div>`
            : allSP.length
              ? `<div class="buy"><p class="buy__k">${allSP.length} versions</p><p class="buy__code">Pick the part numbers you need from the list below and add each one to your quote.</p><a class="btn btn--signal btn--lg" href="#parts" data-jump="parts">Pick a version ${icon('down')}</a></div>`
              : `<div class="buy"><p class="buy__k">Part number on request</p><p class="buy__code">The catalog lists this one without a part number. Add it to your quote and Velocity confirms the exact version with you.</p>${addButton(f.id, f.name, { big: true, text: 'Add to quote' })}</div>`;
        el.innerHTML = `
        <section class="fam">
          <div class="wrap">${crumbs([['Catalog', '#catalog'], [b.name, brandHref(b)], [d.name, brandDeptHref(b, d)], ...(f.sub ? [[f.sub, brandDeptHref(b, d)]] : [])])}</div>
          <div class="wrap fam__grid">
            <div class="fam__media">
              <figure class="gal" data-gal>
                <div class="gal__main">${photos.length ? photo(photos[startPhoto][0], { pack: famPack(fid), alt: f.name, eager: true, w: photos[startPhoto][1], h: photos[startPhoto][2], cap: true }) : photo(null)}</div>
                <figcaption class="gal__cap" data-cap>${photos.length && photos[startPhoto][3].length ? photos[startPhoto][3].map(c => `<span class="pn">${esc(c)}</span>`).join('') : ''}</figcaption>
              </figure>
              ${photos.length > 1 ? `<div class="gal__thumbs" role="list">${photos.map((p, i) => `<button type="button" role="listitem" class="gal__t ${i === startPhoto ? 'is-on' : ''}" data-ph="${i}" aria-label="Photo ${i + 1} of ${photos.length}">${photo(p[0], { pack: famPack(fid), eager: true })}</button>`).join('')}</div>` : ''}
            </div>
            <div class="fam__info">
              <p class="fam__dept"><a class="fam__brand" href="${brandHref(b)}">${esc(b.name)}</a></p>
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
          ${itemBlocks(dt, cat, focus)}
          ${stepsBlock(dt.steps)}
          ${includesBlock(dt.includes, cat)}
          ${notesBlock(dt.notes)}
          ${codeList('Options and accessories', dt.acc, cat, fid)}
          ${codeList('Consumables', dt.con, cat, fid)}
          ${codeList('Spare parts and related part numbers', dt.other, cat, fid)}
          ${TRAIN_DEPTS.has(f.dept) ? `<aside class="trainnote">${lockMark()}<div><p class="trainnote__t">Need your techs trained on it?</p><p>Velocity trains shops on equipment it sells. Tick the training box on your quote and we work it out with your shop.</p></div><a class="link-arrow" href="#training">Training ${icon('arrow')}</a></aside>` : ''}
        </div>
        <section class="sec sec--tight related"><div class="wrap" data-related></div></section>`;

        const gal = el.querySelector('[data-gal]');
        let cur = startPhoto;
        const show = (i) => {
          const p = photos[i]; if (!p || i === cur) return;
          cur = i;
          gal.querySelector('[data-cap]').innerHTML = p[3].map(c => `<span class="pn">${esc(c)}</span>`).join('');
          el.querySelectorAll('[data-ph]').forEach(b => b.classList.toggle('is-on', +b.dataset.ph === i));
          photoURL(p[0], famPack(fid)).then(src => {
            if (cur !== i || !src) return;
            const im = new Image(); im.src = src;
            (im.decode ? im.decode() : Promise.resolve()).catch(() => {}).then(() => {
              if (cur === i) gal.querySelector('.gal__main').innerHTML = photo(p[0], { src, alt: f.name, w: p[1], h: p[2], cap: true });
            });
          }).catch(() => {});
        };
        el.querySelectorAll('[data-ph]').forEach(b => b.addEventListener('click', () => show(+b.dataset.ph)));
        el.querySelectorAll('tr[data-photo]').forEach(tr => tr.addEventListener('mouseenter', () => {
          const i = photos.findIndex(p => p[0] === tr.dataset.photo); if (i >= 0) show(i);
        }));
        el.querySelectorAll('[data-jump]').forEach(a => a.addEventListener('click', e => {
          e.preventDefault(); const t = el.querySelector(`#${a.dataset.jump}`); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }));

        const mine = d.by[b.id] || { subs: [], fams: [] };
        const sibs = (mine.subs.find(([, ids]) => ids.includes(fid)) || [, []])[1].filter(x => x !== fid);
        const rest = mine.fams.filter(x => x !== fid && !sibs.includes(x));
        const rel = [...sibs, ...rest].slice(0, 8).map(x => cat.fam[x]);
        el.querySelector('[data-related]').innerHTML = rel.length ? `<header class="catsec__head"><div><h2>More in ${esc(f.sub || d.name)}</h2></div><a class="link-arrow" href="${brandDeptHref(b, d)}">${esc(b.name)} ${esc(d.name)} ${icon('arrow')}</a></header>${b.rows ? famRows(rel.map(x => x.id), cat) : `<div class="fgrid">${rel.map(x => famCard(x)).join('')}</div>`}` : '';

        syncAddButtons(el);
        if (focus) {
          const row = document.getElementById(`c-${codeSlug(focus)}`);
          if (row) setTimeout(() => { if (!gone && allSP.length > 6) row.scrollIntoView({ block: 'center' }); }, 60);
        }
        stopReveal = revealIn(el);
      }).catch((e) => { console.error(e); if (!gone) el.innerHTML = failed(); });
      return () => { gone = true; stopReveal(); };
    },
  };
}


export function searchPage(q0 = '', brand0 = '') {
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
            ${icon('search')}<input id="s-q" name="q" type="search" autocomplete="off" value="${esc(q0)}" placeholder="Part number or product" data-hints="Part number or product|Part number|Search" enterkeyhint="search">
            <button type="submit" class="btn btn--signal">Search</button>
          </form>
          <div class="sres__scope" data-scope hidden></div>
          <p class="sres__sum" data-sum aria-live="polite"></p>
        </div>
      </section>
      <section class="sec sec--tight" style="padding-top:8px"><div class="wrap" data-res>${q0 ? loading('results') : ''}</div></section>`;
      const form = el.querySelector('[data-bigsearch]'), input = form.q, scopeEl = el.querySelector('[data-scope]');
      const stopHint = fitHints(el);
      let gone = false, cat = null, t = 0, scope = brand0;
      const addr = (q) => `#search${q ? `/${encodeURIComponent(q)}` : ''}${scope ? `/b-${scope}` : ''}`;
      const paint = (q) => {
        const res = el.querySelector('[data-res]'), sum = el.querySelector('[data-sum]');
        const b = scope ? cat.brand[scope] : null, live = liveBrands(cat);
        const where = b ? `the ${esc(b.name)} catalog` : 'the catalog';
        document.title = q ? `Search: ${q} | Velocity` : 'Search | Velocity';
        input.placeholder = b ? `Search the ${b.name} catalog` : 'Part number or product';
        scopeEl.hidden = !(b || live.length > 1);
        scopeEl.innerHTML = scopeEl.hidden ? '' : `<span class="sres__k">Search in</span><div class="chips">${[['', 'All brands'], ...live.map(x => [x.id, x.name])].map(([id, name]) => `<button type="button" class="chip ${id === scope ? 'is-on' : ''}" data-scope-to="${esc(id)}" aria-pressed="${id === scope}">${esc(name)}</button>`).join('')}</div>`;
        if (!q) { sum.textContent = ''; res.innerHTML = `<p class="muted">Type a part number like <span class="pn">SP202002</span>, or what the tool does: spot welder, bumper rack, paint gun, wrench set.</p>`; return; }
        const r = search(cat, q, { famLimit: 48, codeLimit: 60, brand: scope });
        const nf = r.totalFams ?? r.fams.length, nc = r.totalCodes ?? r.codes.length;
        const brandOf = (f) => cat.brand[f.brand];
        const mixed = new Set([...r.fams.map(f => f.brand), ...r.codes.map(c => cat.fam[c.fid].brand)]).size > 1;
        const soon = r.brands.find(x => !x.live);
        sum.innerHTML = r.exact ? `Part number <span class="pn">${esc(r.exact.code)}</span> is in ${b ? where : `the ${esc(brandOf(cat.fam[r.exact.fid]).name)} catalog`}.`
          : (nf || nc) ? `${[nc && nCodes(nc), nf && nPages(nf)].filter(Boolean).join(' and ')} match${nf + nc === 1 ? 'es' : ''} “${esc(q)}”${b ? ` in ${where}` : ''}.`
          : r.brands.length ? (soon ? `${esc(soon.name)}’s catalog isn’t on the site yet.` : `${esc(nameList(r.brands.map(x => x.name)))} ${r.brands.length === 1 ? 'has its' : 'have their'} own catalog on the site.`)
          : `Nothing in ${where} matches “${esc(q)}”.`;
        const exact = r.exact ? (() => { const c = r.exact, f = cat.fam[c.fid]; return `<div class="sres__exact">
            <a class="sres__exact-img" href="${famHref(f, c.code)}">${photo(c.photo || f.photo, { pack: famPack(f.id) })}</a>
            <div><p class="pn">${esc(c.code)}</p><p class="sres__exact-n"><a href="${famHref(f, c.code)}">${esc(c.label)}</a></p><p class="muted small">${esc(brandOf(f).name)} · ${esc(f.name)} · ${esc(cat.dept[f.dept].name)}</p></div>
            ${addButton(c.code, c.label, { big: true })}
          </div>`; })() : '';
        const none = !r.fams.length && !r.codes.length;
        res.innerHTML = `${exact}
          ${r.brands.length ? `<section class="sres__sec"><header class="catsec__head"><h2>Brands</h2></header>${brandGrid(cat, r.brands)}</section>` : ''}
          ${r.fams.length ? `<section class="sres__sec"><header class="catsec__head"><h2>Products</h2><p class="catsec__meta">${nf > r.fams.length ? `First ${r.fams.length} of ${num(nf)}` : `${num(nf)} found`}</p></header><div class="fgrid">${r.fams.map(f => famCard(f, { brand: mixed ? brandOf(f) : null })).join('')}</div></section>` : ''}
          ${r.codes.length ? `<section class="sres__sec"><header class="catsec__head"><h2>Part numbers</h2><p class="catsec__meta">${nc > r.codes.length ? `First ${r.codes.length} of ${num(nc)}` : `${num(nc)} found`}</p></header>
            <ul class="clist clist--wide">${r.codes.map(c => { const f = cat.fam[c.fid]; return `<li class="clist__i">
              <a class="clist__img" href="${famHref(f, c.code)}" tabindex="-1" aria-hidden="true">${c.photo ? photo(c.photo, { pack: famPack(c.fid) }) : ''}</a>
              <span class="clist__t"><span class="pn">${esc(c.code)}</span><a class="clist__n" href="${famHref(f, c.code)}">${esc(c.label)}</a><span class="clist__fam">${mixed ? `${esc(brandOf(f).name)} · ` : ''}${esc(f.name)}</span></span>
              ${addButton(c.code, c.label, { text: 'Add' })}
            </li>`; }).join('')}</ul></section>` : ''}
          ${none && soon ? `<div class="sres__none"><p>Velocity carries ${esc(soon.name)}, and its catalog is being added to the site. Until it is, write the ${esc(soon.name)} tools or part numbers you want on your quote.</p><p class="row-gap"><a class="btn btn--signal" href="#quote" data-quote-note="${esc(soon.name)}: ">Ask for ${esc(soon.name)} on a quote ${icon('arrow')}</a><a class="btn btn--line" href="${brandHref(soon)}">${esc(soon.name)}</a></p></div>` : ''}
          ${none && !r.brands.length ? `<div class="sres__none"><p>Velocity carries more than the site lists: paint, masking, tape and shop supplies too. Write what you’re looking for on a quote.</p><p class="row-gap"><a class="btn btn--signal" href="#quote" data-quote-note="${esc(q)}">Ask on a quote ${icon('arrow')}</a>${b ? `<button type="button" class="btn btn--line" data-scope-to="">Search every brand</button>` : `<a class="btn btn--line" href="#catalog">Browse the catalog</a>`}</p></div>` : ''}`;
        syncAddButtons(res);
      };
      const go = () => { const q = input.value.trim(); history.replaceState(null, '', addr(q)); if (cat) paint(q); };
      form.addEventListener('submit', e => { e.preventDefault(); clearTimeout(t); go(); });
      input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(go, 160); });
      el.addEventListener('click', e => {
        const s = e.target.closest('[data-scope-to]');
        if (!s || !cat) return;
        scope = s.dataset.scopeTo; go();
      });
      catalog().then(c => {
        if (gone) return;
        cat = c;
        let q = q0;
        if (scope && !cat.brand[scope]) { q = `${q0}${q0 ? '/' : ''}b-${scope}`; scope = ''; input.value = q; history.replaceState(null, '', addr(q)); }
        paint(q);
        if (!q) input.focus();
      }).catch((e) => { console.error(e); if (!gone) el.querySelector('[data-res]').innerHTML = failed(); });
      return () => { gone = true; clearTimeout(t); stopHint(); };
    },
  };
}
