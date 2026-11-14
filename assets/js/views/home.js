// Home: the whole line on one page. A live 3D bay of real catalog products, the departments, how buying works,
// the bay builder, training, calibration (supplier being chosen) and the questions shops ask.
import { SITE, STEPS, FAQ, TRAINING, CALIBRATION, STATS, PRESETS, BAY_ITEMS, FEATURED } from '../data.js';
import { esc, rt, icon, cite, revealIn, countUp, loadScenes, webglOK, reducedMotion, sectionHead, num } from '../core.js';
import { catalog, famHref, deptHref, nCodes } from '../catalog-data.js';
import { deptTile, calTile, deptOrder, famCard, photo, lockMark } from './catalog.js';

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
      <p class="hero__lede">Welders and dent pullers, frame benches, spray booths, dust extraction, hand tools, lifts, carts and racks, each with its part numbers, specs and photos. Paint, masking and tape go on the same quote. Velocity trains your techs on the equipment when they need it.</p>
      <form class="bigsearch bigsearch--hero" data-hero-search role="search">
        <label class="sr" for="hero-q">Search the catalog</label>
        ${icon('search')}<input id="hero-q" name="q" type="search" autocomplete="off" placeholder="Part number or product" enterkeyhint="search">
        <button type="submit" class="btn btn--signal">Search</button>
      </form>
      <div class="hero__cta">
        <a class="btn btn--signal btn--lg" href="#catalog">Open the catalog ${icon('arrow')}</a>
        <a class="btn btn--ghost btn--lg" href="#bay">Build your bay in 3D</a>
      </div>
    </div>
    <div class="hero__rail" data-rail>
      <div class="rail__i"><span class="rail__k">Part numbers listed</span><span class="rail__v" data-rail="codes">2,391</span></div>
      <div class="rail__i"><span class="rail__k">Departments</span><span class="rail__v" data-rail="depts">21</span></div>
      <div class="rail__i"><span class="rail__k">More lines</span><span class="rail__v">Being added</span></div>
      <div class="rail__i"><span class="rail__k">Training</span><span class="rail__v">On the equipment you buy</span></div>
    </div>
  </section>`;
}

function depts() {
  return `
  <section class="sec" id="departments">
    <div class="wrap">
      <div class="split-head">
        ${sectionHead({ idx: '01', kicker: 'The catalog', title: 'From frame benches to rivets.', lede: 'Every product with its part numbers, specs and photos, sorted the way a repair moves through the shop. Open a department, or search a part number from any page.' })}
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
        ${sectionHead({ idx: '02', kicker: 'A look inside', title: 'Big equipment. Small parts.', lede: 'A bench that lifts 3,000 kg sits in the same catalog as the studs your dent puller burns through. Each one carries its part number, so the quote you get back matches what you asked for.' })}
      </div>
      <div class="fgrid fgrid--4" data-featured></div>
    </div>
  </section>`;
}

function steps() {
  return `
  <section class="sec dark">
    <div class="wrap">
      ${sectionHead({ idx: '03', kicker: 'How buying works', title: 'Send the list. Get it priced.', lede: 'No account and no cart checkout. Build your list from the catalog, add anything that isn’t in it, and Velocity sends back a written price.' })}
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
        ${sectionHead({ idx: '04', kicker: 'Build your bay', title: 'See it on the floor first.', lede: 'Pick a starting point, then add or take away pieces. Every one is a real catalog product with its part number, modeled from its photos. Move the camera around it, then send the whole bay as one quote.' })}
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
        ${sectionHead({ idx: '05', kicker: 'Training', title: 'We train your techs on it.', lede: 'If your techs haven’t run a machine before, Velocity trains them on it. Tell us what you’re buying and who needs to learn it, and we set it up with you. Skip it if your techs already know the equipment.' })}
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
          <p class="kicker"><span class="kicker__idx">06</span>Calibration</p>
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
      <div class="sticky-col">${sectionHead({ idx: '07', kicker: 'Questions', title: 'What shops ask us.' })}</div>
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
    el.innerHTML = hero(live) + depts() + featured() + steps() + bayTeaser() + trainingBand() + calBand() + faq() + final();
    let gone = false, ctl = null, timer = 0;
    const offs = [revealIn(el), countUp(el)];

    el.querySelector('[data-hero-search]').addEventListener('submit', e => {
      e.preventDefault();
      const q = e.currentTarget.q.value.trim();
      location.hash = q ? `search/${encodeURIComponent(q)}` : 'catalog';
    });

    let cat = null;
    catalog().then(c => {
      if (gone) return;
      cat = c;
      el.querySelector('[data-rail="depts"]').textContent = num(c.counts.depts);
      el.querySelector('[data-rail="codes"]').textContent = num(c.counts.codes);
      const grid = el.querySelector('[data-depts]');
      grid.innerHTML = deptOrder(c).map(d => deptTile(d)).join('') + calTile() + `<a class="dtile dtile--list" href="#quote"><span class="dtile__body"><span class="dtile__n">Not listed here yet</span><span class="dtile__name">Paint, masking, tape and more lines ${icon('arrow')}</span><span class="dtile__subs">Velocity carries shop supplies and more lines that aren’t on the site yet. Put them in the notes of your quote, or send your own list.</span></span></a>`;
      grid.querySelectorAll('.dtile').forEach((t, i) => { t.setAttribute('data-reveal', ''); t.style.transitionDelay = `${(i % 4) * 50}ms`; });
      el.querySelector('[data-featured]').innerHTML = FEATURED.map(id => c.fam[id]).filter(Boolean).map(f => famCard(f, { pack: 'set/featured' })).join('');
      el.querySelectorAll('[data-code-label]').forEach(i => { const x = c.codes.get(i.dataset.codeLabel); i.textContent = x ? x.label : ''; });
      offs.push(revealIn(el));
    }).catch(() => {
      if (gone) return;
      el.querySelector('[data-depts]').innerHTML = '<p class="muted">The catalog didn’t load. Reload the page to try again.</p>';
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
