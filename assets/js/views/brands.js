import { FEATURED } from '../data.js';
import { esc, icon, num, revealIn, sectionHead, fitHint } from '../core.js';
import { catalog, liveBrands, nCodes, loaded } from '../catalog-data.js';
import { crumbs, loading, missing, failed, brandGrid, brandsLine, deptTile, famCard, nDepts, powerNoteFor } from './catalog.js';

const pad = (n) => String(n).padStart(2, '0');

export const brandsIndex = {
  id: 'brands', nav: 'catalog', title: 'Brands',
  render(el) {
    el.innerHTML = `
    <section class="phead cat-head">
      <div class="wrap">
        ${crumbs([['Home', '#home'], ['Catalog', '#catalog'], ['Brands']])}
        <h1 class="h1">Shop by brand.</h1>
        <p class="lede phead__lede">Each brand has its own catalog on the site, split by department. <span data-line></span></p>
      </div>
    </section>
    <section class="sec sec--tight cat-index" data-body>${loading()}</section>`;
    let gone = false, stop = () => {};
    catalog().then(cat => {
      if (gone) return;
      el.querySelector('[data-line]').textContent = brandsLine(cat);
      const body = el.querySelector('[data-body]');
      body.innerHTML = `<div class="wrap">
        ${brandGrid(cat)}
        <aside class="bay-callout bay-callout--light"><div><h3>Need a brand that isn’t here?</h3><p>Velocity carries more lines than the site lists. Name the brand and what you need on your quote.</p></div><a class="btn btn--signal" href="#quote">Ask on a quote ${icon('arrow')}</a></aside>
        <p class="row-gap"><a class="link-arrow" href="#catalog">Shop by department ${icon('arrow')}</a></p>
      </div>`;
      body.querySelectorAll('.bcard').forEach((t, i) => { t.setAttribute('data-reveal', ''); t.style.transitionDelay = `${i * 40}ms`; });
      stop = revealIn(body);
    }).catch((e) => { console.error(e); if (!gone) el.querySelector('[data-body]').innerHTML = failed(); });
    return () => { gone = true; stop(); };
  },
};

function livePage(b, cat) {
  const counts = [[b.codes, 'part numbers'], [b.depts.length, b.depts.length === 1 ? 'department' : 'departments'], ...(b.photos ? [[b.photos, 'photos']] : [])];
  const picks = FEATURED.map(id => cat.fam[id]).filter(f => f && f.brand === b.id);
  const left = (cols) => (cols - b.depts.length % cols) % cols;
  const closer = `<a class="dtile dtile--list dtile--fill" href="#search/b-${b.id}" data-f4="${left(4)}" data-f3="${left(3)}" data-f2="${left(2)}" style="--f4:${left(4) || 1};--f3:${left(3) || 1};--f2:${left(2) || 1}">
    <span class="dtile__body"><span class="dtile__n">${nCodes(b.codes)}</span><span class="dtile__name">Search the ${esc(b.name)} catalog ${icon('arrow')}</span><span class="dtile__subs">Type a part number, or what the tool does.</span></span>
  </a>`;
  return `
  <section class="phead cat-head bhead">
    <div class="wrap">
      ${crumbs([['Home', '#home'], ['Catalog', '#catalog'], [b.name]])}
      <p class="bhead__k">Brand catalog</p>
      <h1 class="h1">${esc(b.name)}.</h1>
      <div class="cat-head__row">
        <p class="lede phead__lede">${esc(b.lede || `The ${b.name} catalog on Velocity, split by department. Every listing carries its part numbers.`)}</p>
        <dl class="counts counts--${counts.length}">${counts.map(([v, l]) => `<div><dt>${esc(l)}</dt><dd>${num(v)}</dd></div>`).join('')}</dl>
      </div>
      <form class="bigsearch" data-bsearch role="search">
        <label class="sr" for="b-q">Search the ${esc(b.name)} catalog</label>
        ${icon('search')}<input id="b-q" name="q" type="search" autocomplete="off" placeholder="Search the ${esc(b.name)} catalog" enterkeyhint="search">
        <button type="submit" class="btn btn--signal">Search</button>
      </form>
    </div>
  </section>
  <section class="sec sec--tight cat-index">
    <div class="wrap">
      <section class="catsec catsec--first" id="departments">
        <header class="catsec__head"><h2>${esc(b.name)} by department</h2><p class="catsec__meta">${nDepts(b.depts.length)}</p></header>
        <div class="dgrid">${b.depts.map(d => deptTile(d, { brand: b, cat })).join('')}${closer}</div>
      </section>
      ${powerNoteFor([b])}
    </div>
  </section>
  ${b.facts && b.facts.length ? `<section class="sec sec--tight paper rule-top">
    <div class="wrap two-col">
      <div>${sectionHead({ kicker: 'The maker', title: `About ${esc(b.name)}.` })}</div>
      <div>
        <ul class="facts">${b.facts.map(([k, v]) => `<li><b>${esc(k)}</b><span>${esc(v)}</span></li>`).join('')}</ul>
        ${b.factsSource ? `<p class="facts__src">${esc(b.factsSource)}</p>` : ''}
      </div>
    </div>
  </section>` : ''}
  ${picks.length ? `<section class="sec sec--tight rule-top">
    <div class="wrap">
      <header class="catsec__head"><h2>From the ${esc(b.name)} catalog</h2><a class="link-arrow" href="#departments" data-scroll="departments">Every department ${icon('arrow')}</a></header>
      <div class="fgrid fgrid--4">${picks.map(f => famCard(f, { pack: 'set/featured' })).join('')}</div>
      <aside class="bay-callout"><div><h3>Want it on the floor first?</h3><p>Drop real catalog products into a 3D bay, move the camera around them, and send the whole bay as one quote.</p></div><a class="btn btn--signal" href="#bay">Build your bay ${icon('arrow')}</a></aside>
    </div>
  </section>` : ''}
  <section class="sec sec--tight rule-top">
    <div class="wrap final">
      <h2>Price it in writing.</h2>
      <div class="final__side">
        <p class="lede">Add ${esc(b.name)} part numbers to your quote, with anything else your shop needs. Velocity sends back a written price.</p>
        <div class="row-gap" style="margin-top:4px"><a class="btn btn--signal btn--lg" href="#quote">Get a quote ${icon('arrow')}</a><a class="btn btn--line btn--lg" href="#brands">All brands</a></div>
      </div>
    </div>
  </section>`;
}

function soonPage(b, cat) {
  const others = liveBrands(cat);
  const steps = [
    ['Open a quote', 'No account needed. Part numbers from the catalogs on the site go on the same list.'],
    [`Write what you want from ${b.name}`, 'Tool names or part numbers and how many, under “Not in the catalog?”.'],
    ['Get it priced', 'Velocity sends back a written price.'],
  ];
  return `
  <section class="phead phead--dark bhead bhead--soon">
    <div class="wrap">
      ${crumbs([['Home', '#home'], ['Catalog', '#catalog'], [b.name]])}
      <p class="status-chip"><i></i>Catalog being added</p>
      <h1 class="h1">${esc(b.name)}.</h1>
      <p class="lede phead__lede">${esc(b.lede || `Velocity carries ${b.name}. Its catalog isn’t on the site yet, so there are no part numbers, photos or specs to browse here.`)}</p>
      <div class="row-gap"><a class="btn btn--signal btn--lg" href="#quote" data-quote-note="${esc(b.name)}: ">Ask for ${esc(b.name)} on a quote ${icon('arrow')}</a><a class="btn btn--ghost btn--lg" href="#brands">All brands</a></div>
    </div>
  </section>
  <section class="sec sec--tight paper">
    <div class="wrap two-col">
      <div>${sectionHead({ kicker: 'Until it’s listed', title: 'Ask on your quote.' })}</div>
      <ol class="psteps">${steps.map(([t, p], i) => `<li><span>${pad(i + 1)}</span><b>${esc(t)}</b><p>${esc(p)}</p></li>`).join('')}</ol>
    </div>
  </section>
  ${others.length ? `<section class="sec sec--tight rule-top">
    <div class="wrap">
      <header class="catsec__head"><h2>On the site now</h2><a class="link-arrow" href="#catalog">The whole catalog ${icon('arrow')}</a></header>
      ${brandGrid(cat, others)}
    </div>
  </section>` : ''}`;
}

export function brandPage(id) {
  return {
    id: 'brand', nav: 'catalog',
    title: () => (loaded() && loaded().brand[id] ? loaded().brand[id].name : 'Brand'),
    render(el) {
      el.innerHTML = loading('the brand');
      let gone = false, stop = () => {}, stopHint = () => {};
      catalog().then(cat => {
        if (gone) return;
        const b = cat.brand[id];
        if (!b) { el.innerHTML = missing('brand'); return; }
        document.title = `${b.name} | Velocity`;
        el.innerHTML = b.live ? livePage(b, cat) : soonPage(b, cat);
        const form = el.querySelector('[data-bsearch]');
        if (form) {
          form.addEventListener('submit', e => {
            e.preventDefault();
            const q = form.q.value.trim();
            if (q) location.hash = `search/${encodeURIComponent(q)}/b-${b.id}`;
          });
          stopHint = fitHint(form.q, [`Search the ${b.name} catalog: part number or product`, `Search the ${b.name} catalog`, `Search ${b.name}`, 'Search']);
        }
        el.querySelectorAll('.dtile, .bcard').forEach((t, i) => { t.setAttribute('data-reveal', ''); t.style.transitionDelay = `${Math.min(i, 12) * 30}ms`; });
        stop = revealIn(el);
      }).catch((e) => { console.error(e); if (!gone) el.innerHTML = failed(); });
      return () => { gone = true; stop(); stopHint(); };
    },
  };
}

