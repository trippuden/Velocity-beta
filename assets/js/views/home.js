// Home: the whole line on one page. A live 3D bay of real catalog products, shop by brand, shop by department,
// how buying works, the bay builder, training (asked for on the quote), calibration (supplier being chosen) and the
// questions shops ask. Every count on the page is read from the catalog data.
import { SITE, STEPS, FAQ, TRAINING, CALIBRATION, STATS, PRESETS, BAY_ITEMS, FEATURED } from '../data.js';
import { esc, rt, icon, cite, revealIn, countUp, loadScenes, webglOK, reducedMotion, sectionHead, num, fitHints } from '../core.js';
import { catalog, liveBrands, soonBrands, nameList, nCodes } from '../catalog-data.js';
import { deptTile, calTile, listTile, deptOrder, famCard, brandGrid, brandsLine } from './catalog.js';

const pad = (n) => String(n).padStart(2, '0');
const ITEM = Object.fromEntries(BAY_ITEMS.map(i => [i.model, i]));
// the hero rolls through the builder's own starting points, each one real catalog products
const SHOW = ['body', 'prep', 'storage', 'full'].map(id => PRESETS.find(p => p.id === id)).filter(Boolean);

// the still frame under the 3D scene. With 3D on it is the empty bay, the scene's own first frame, so the products
// roll in on top of it; without 3D (or with reduced motion, where the bay opens full) it is the full bay.
const poster = (full) => `<picture data-poster><source media="(max-width: 960px)" srcset="assets/img/hero-bay-m${full ? '' : '-empty'}.webp"><img class="hero__poster" src="assets/img/hero-bay${full ? '' : '-empty'}.webp" alt="" aria-hidden="true" fetchpriority="high"></picture>`;

function hero(live) {
  return `
  <section class="hero hero--bay" aria-label="Velocity: equipment and supplies for collision shops">
    <div class="hero__stage" data-hero-stage>
      ${poster(!live)}
      <div class="tags" data-tags aria-hidden="true"></div>
      <div class="hero__hud" aria-hidden="true">
        <div class="hud__row"><span>Bay 01</span><b data-hud="name">${esc(SHOW[0].name)}</b></div>
        <div class="hud__row"><span>On the floor</span><b data-hud="n">0</b><span>pieces</span></div>
        <div class="hud__row"><span class="hud__dot"></span><span class="hud__status" data-hud="status">Real catalog products</span></div>
      </div>
      <p class="hero__drag" aria-hidden="true">${icon('rotate')} Drag to look around</p>
    </div>
    <div class="hero__scrim"></div>
    <div class="hero__copy">
      <p class="hero__eyebrow"><span>Collision shop equipment</span><span>Shop supplies</span><span>Training</span></p>
      <h1><span class="ln">Equip the whole shop.</span> <span class="ln">One quote.</span></h1>
      <p class="hero__lede">Welders and dent pullers, frame benches, spray booths, dust extraction, hand tools, lifts, carts and racks, each with its part numbers, specs and photos. Paint, masking and tape go on the same quote. Need your techs trained on a machine? Ask on the quote.</p>
      <form class="bigsearch bigsearch--hero" data-hero-search role="search">
        <label class="sr" for="hero-q">Search the catalog</label>
        ${icon('search')}<input id="hero-q" name="q" type="search" autocomplete="off" placeholder="Part number or product" data-hints="Part number or product|Part number|Search" enterkeyhint="search">
        <button type="submit" class="btn btn--signal">Search</button>
      </form>
      <div class="hero__cta">
        <a class="btn btn--signal btn--lg" href="#catalog">Open the catalog ${icon('arrow')}</a>
        <a class="btn btn--ghost btn--lg" href="#bay">Build your bay in 3D</a>
      </div>
    </div>
    <div class="hero__rail" data-rail>${rail(null)}</div>
  </section>`;
}

// the strip under the hero: what is on the site, in the catalog's own numbers. Before the catalog has loaded the
// places hold a dash, so no number is ever shown that the data didn't give.
function rail(cat) {
  const live = cat ? liveBrands(cat) : [], soon = cat ? soonBrands(cat) : [];
  const items = !cat ? [['Catalog', '–'], ['Departments', '–'], ['Brands', '–']]
    : live.length === 1
      ? [[`${live[0].name} catalog`, nCodes(live[0].codes)], ['Departments', num(cat.depts.length)], soon.length ? [soon.length === 1 ? soon[0].name : nameList(soon.map(b => b.name)), 'Catalog being added'] : ['More lines', 'Being added']]
      : [['Part numbers listed', num(cat.counts.codes)], ['Brands on the site', nameList(live.map(b => b.name))], ['Departments', num(cat.depts.length)]];
  items.push(['Training', 'Ask for it on your quote']);
  return items.map(([k, v]) => `<div class="rail__i"><span class="rail__k">${esc(k)}</span><span class="rail__v">${esc(v)}</span></div>`).join('');
}

function brands() {
  return `
  <section class="sec sec--tight" id="brands">
    <div class="wrap">
      <div class="split-head">
        ${sectionHead({ idx: '01', kicker: 'Shop by brand', title: 'Every brand, its own catalog.', lede: '<span data-brands-line>Each brand Velocity lists has its own pages, split by department.</span>' })}
        <a class="link-arrow" href="#brands">All brands ${icon('arrow')}</a>
      </div>
      <div data-brands><p class="muted small">Loading the catalog…</p></div>
    </div>
  </section>`;
}

function depts() {
  return `
  <section class="sec sec--tight" id="departments">
    <div class="wrap">
      <div class="split-head">
        ${sectionHead({ idx: '02', kicker: 'Shop by department', title: 'From frame benches to rivets.', lede: 'Every product with its part numbers, specs and photos, sorted the way a repair moves through the shop. Open a department, or search a part number from any page.' })}
        <a class="link-arrow" href="#catalog">See the whole catalog ${icon('arrow')}</a>
      </div>
      <div class="dgrid" data-depts><p class="muted small">Loading the catalog…</p></div>
    </div>
  </section>`;
}

function featured() {
  return `
  <section class="sec sec--tight paper rule-top">
    <div class="wrap">
      <div class="split-head">
        ${sectionHead({ idx: '03', kicker: 'A look inside', title: 'Big equipment. Small parts.', lede: 'A bench that lifts 3,000 kg sits in the same catalog as the studs your dent puller burns through. Each one carries its part number, so the quote you get back matches what you asked for.' })}
      </div>
      <div class="fgrid fgrid--4" data-featured></div>
    </div>
  </section>`;
}

function steps() {
  return `
  <section class="sec dark">
    <div class="wrap">
      ${sectionHead({ idx: '04', kicker: 'How buying works', title: 'Send the list. Get it priced.', lede: 'No account and no cart checkout. Build your list from the catalog, add anything that isn’t in it, and Velocity sends back a written price.' })}
      <ol class="hsteps">${STEPS.map((s, i) => `<li class="hstep" data-reveal data-reveal-d="${i}"><span class="hstep__n">${pad(i + 1)}</span><p class="hstep__t">${esc(s.t)}</p><p class="hstep__b">${esc(s.b)}</p></li>`).join('')}</ol>
      <div class="row-gap"><a class="btn btn--signal" href="#quote">Start a quote ${icon('arrow')}</a><a class="btn btn--ghost" href="#catalog">Open the catalog</a></div>
    </div>
  </section>`;
}

function bayTeaser() {
  return `
  <section class="sec dark-2">
    <div class="wrap bayt">
      <div>
        ${sectionHead({ idx: '05', kicker: 'Build your bay', title: 'See it on the floor first.', lede: 'Pick a starting point, then add or take away pieces. Every one is a real catalog product with its part number, modeled from its photos. Move the camera around it, then send the whole bay as one quote.' })}
        <div class="bayt__starts">${PRESETS.map((p, i) => {
          const pieces = Object.values(p.items).reduce((s, q) => s + q, 0);
          return `<a class="bayt__start" href="#bay" data-bay-preset="${p.id}" data-bayt="${i}">
            <span class="bayt__sn">${pad(i + 1)}</span>
            <span class="bayt__st"><b>${esc(p.name)}</b><span>${esc(p.note)}</span></span>
            <span class="bayt__sp">${pieces} pieces</span>
            ${icon('arrow')}
          </a>`;
        }).join('')}</div>
      </div>
      <a class="bayt__img bayt__codes" href="#bay" aria-label="Open the bay builder">
        <span class="bayt__live">${icon('rotate')} In the 3D builder</span>
        <span class="bayt__sheet">${BAY_ITEMS.map((it, i) => `<span class="bayt__row"><span>${pad(i + 1)}</span><b class="pn">${esc(it.code)}</b><i data-code-label="${esc(it.code)}"></i></span>`).join('')}</span>
      </a>
    </div>
  </section>`;
}

function trainingBand() {
  return `
  <section class="sec">
    <div class="wrap trainb trainb--light">
      <div>
        ${sectionHead({ idx: '06', kicker: 'Training', title: 'Need your techs trained?', lede: 'If your techs haven’t run a machine before, tick the training box on your quote. Tell us what you’re buying and who needs to learn it, and Velocity works it out with your shop. Skip it if your techs already know the equipment.' })}
        <a class="btn btn--ink" href="#training">How training works ${icon('arrow')}</a>
      </div>
      <ul class="tlist">${TRAINING.examples.map(([d, t], i) => `<li><a href="#d-${esc(d)}"><span class="tlist__n">${pad(i + 1)}</span><span class="tlist__t">${esc(t)}</span>${icon('arrow')}</a></li>`).join('')}</ul>
    </div>
  </section>`;
}

function calBand() {
  return `
  <section class="sec dark calband">
    <div class="wrap">
      <div class="calband__head">
        <div>
          <p class="kicker"><span class="kicker__idx">07</span>Calibration</p>
          <h2 class="h2">ADAS calibration equipment is coming.</h2>
        </div>
        <div>
          <p class="lede">${esc(CALIBRATION.blurb)}</p>
          <div class="row-gap"><a class="btn btn--signal" href="#calibration">Get told when it’s ready ${icon('arrow')}</a></div>
        </div>
      </div>
      <div class="stats stats--${STATS.length}" data-reveal>${STATS.map(s => {
        const n = parseFloat(s.value.replace(/[^0-9.]/g, ''));
        const pre = (s.value.startsWith('+') ? '+' : '') + (s.value.startsWith('$') ? '$' : '');
        const suf = s.value.endsWith('%') ? '%' : '';
        return `<div class="stat"><p class="stat__v"><span data-count="${n}" data-pre="${esc(pre)}" data-suf="${esc(suf)}">${esc(s.value)}</span>${s.unit ? `<small>${esc(s.unit)}</small>` : ''}</p><p class="stat__l">${esc(s.label)}</p>${cite(s.src)}</div>`;
      }).join('')}</div>
    </div>
  </section>`;
}

function faq() {
  return `
  <section class="sec">
    <div class="wrap two-col">
      <div class="sticky-col">${sectionHead({ idx: '08', kicker: 'Questions', title: 'What shops ask us.' })}</div>
      <div class="faq">${FAQ.map(f => `<details><summary>${esc(f.q)}${icon('plus')}</summary><div class="faq__a"><p>${esc(f.a)}</p></div></details>`).join('')}</div>
    </div>
  </section>`;
}

function final() {
  return `
  <section class="sec sec--tight rule-top">
    <div class="wrap final">
      <h2>Send us your list.</h2>
      <div class="final__side">
        <p class="lede">Part numbers from the catalog, paint and supplies from your own list, or just what you’re trying to do. Velocity prices it in writing.</p>
        <div class="row-gap" style="margin-top:4px"><a class="btn btn--signal btn--lg" href="#quote">Get a quote ${icon('arrow')}</a></div>
        <p class="final__phone">${icon('phone')}<a href="${SITE.phoneHref}">${rt(SITE.phone)}</a><span>·</span><span>${rt(SITE.email)}</span></p>
      </div>
    </div>
  </section>`;
}

export const home = {
  id: 'home', nav: 'home', title: '',
  render(el) {
    const live = webglOK() && !reducedMotion();
    el.innerHTML = hero(live) + brands() + depts() + featured() + steps() + bayTeaser() + trainingBand() + calBand() + faq() + final();
    let gone = false, ctl = null, timer = 0;
    const offs = [revealIn(el), countUp(el), fitHints(el)];

    el.querySelector('[data-hero-search]').addEventListener('submit', e => {
      e.preventDefault();
      const q = e.currentTarget.q.value.trim();
      location.hash = q ? `search/${encodeURIComponent(q)}` : 'catalog';
    });

    let cat = null;
    catalog().then(c => {
      if (gone) return;
      cat = c;
      el.querySelector('[data-rail]').innerHTML = rail(c);
      el.querySelector('[data-brands]').innerHTML = brandGrid(c);
      el.querySelector('[data-brands-line]').textContent = `Each brand has its own pages, split by department. ${brandsLine(c)}`;
      const grid = el.querySelector('[data-depts]');
      grid.innerHTML = deptOrder(c).map(d => deptTile(d)).join('') + calTile() + listTile();
      el.querySelectorAll('.dtile, .bcard').forEach((t, i) => { t.setAttribute('data-reveal', ''); t.style.transitionDelay = `${(i % 4) * 50}ms`; });
      // a card names its brand only when the row mixes brands
      const picks = FEATURED.map(id => c.fam[id]).filter(Boolean), mixed = new Set(picks.map(f => f.brand)).size > 1;
      el.querySelector('[data-featured]').innerHTML = picks.map(f => famCard(f, { pack: 'set/featured', brand: mixed ? c.brand[f.brand] : null })).join('');
      el.querySelectorAll('[data-code-label]').forEach(i => { const x = c.codes.get(i.dataset.codeLabel); i.textContent = x ? x.label : ''; });
      offs.push(revealIn(el));
    }).catch(() => {
      if (gone) return;
      el.querySelector('[data-depts]').innerHTML = '<p class="muted">The catalog didn’t load. Reload the page to try again.</p>';
      el.querySelector('[data-brands]').innerHTML = '';
    });

    // the live bay: real catalog products roll in, one starting point after another
    const stage = el.querySelector('[data-hero-stage]'), tags = el.querySelector('[data-tags]');
    const hud = (k, v) => { const n = el.querySelector(`[data-hud="${k}"]`); if (n) n.textContent = v; };
    const label = (code) => (cat && cat.codes.get(code) ? cat.codes.get(code).label : '');
    let active = 0, lastSwap = 0;
    const tagEls = new Map();
    const drawTags = (anchors) => {
      if (!tags.isConnected) return;
      const now = performance.now();
      // one tag lights up at a time and moves on every 1.6 seconds
      const list = anchors.filter(a => a.id !== 'mt-sanders' && a.front && !a.landing);
      if (now - lastSwap > 1600 && list.length) { active = (active + 1) % list.length; lastSwap = now; }
      const seen = new Set();
      list.forEach((a, i) => {
        seen.add(a.key);
        let t = tagEls.get(a.key);
        if (!t) {
          const it = ITEM[a.id];
          t = document.createElement('div'); t.className = 'tag3d';
          t.innerHTML = `<i></i><span><b>${esc(it.code)}</b><em>${esc(label(it.code))}</em></span>`;
          tags.appendChild(t); tagEls.set(a.key, t);
        }
        t.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
        t.classList.toggle('is-live', i === active);
        t.classList.toggle('is-left', a.x > stage.clientWidth * 0.78);
      });
      for (const [k, t] of tagEls) if (!seen.has(k)) { t.remove(); tagEls.delete(k); }
      // a tag that sits under the lit tag's label steps back, so the two never read on top of each other
      const lit = [...tagEls.values()].find(t => t.classList.contains('is-live'));
      const box = lit && lit.querySelector('span').getBoundingClientRect();
      for (const t of tagEls.values()) {
        if (t === lit || !box) { t.classList.remove('is-under'); continue; }
        const b = t.querySelector('span').getBoundingClientRect();
        t.classList.toggle('is-under', b.left < box.right + 6 && b.right > box.left - 6 && b.top < box.bottom + 4 && b.bottom > box.top - 4);
      }
    };
    const show = (i, animate = true) => {
      const p = SHOW[i % SHOW.length];
      ctl.setSelection(p.items, { animate });
      hud('name', p.name);
      hud('n', String(Object.values(p.items).reduce((s, q) => s + q, 0)));
    };
    const layoutShift = () => (window.matchMedia('(max-width: 960px)').matches ? 0 : 0.34);
    // 3D didn't come up after all: show the full bay instead of the empty one
    const fullPoster = () => { const p = el.querySelector('[data-poster]'); if (p && live) p.outerHTML = poster(true); };
    if (webglOK()) {
      loadScenes().then(mod => {
        if (gone) return;
        if (!mod) { fullPoster(); return; }
        try {
          const rm = reducedMotion();
          ctl = mod.createBay(stage, { reducedMotion: rm, drift: !rm, shiftX: layoutShift(), onFrame: drawTags });
          ctl.setSelection({}, { animate: false });
          requestAnimationFrame(() => requestAnimationFrame(() => stage.classList.add('is-live')));
          if (rm) { show(SHOW.length - 1, false); return; }
          let idx = -1;
          const next = () => { if (gone) return; idx += 1; show(idx); timer = setTimeout(next, 6500); };
          timer = setTimeout(next, 700);
          const onResize = () => ctl && ctl.setShift(layoutShift());
          window.addEventListener('resize', onResize);
          offs.push(() => window.removeEventListener('resize', onResize));
        } catch (e) { console.warn('home bay failed', e); fullPoster(); }
      });
    }
    return () => { gone = true; clearTimeout(timer); offs.forEach(f => f()); if (ctl) ctl.dispose(); };
  },
};
