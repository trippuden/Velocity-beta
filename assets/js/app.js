// Velocity site shell: header with catalog search, footer, preview tools and the hash router.
import { SITE, PH, PH_GROUPS, LEGACY, CALIBRATION, DEPT_ALIAS } from './data.js';
import { esc, rt, icon, quote, syncAddButtons, toast, viewerCanEdit, getDb } from './core.js';
import { catalog, photoAttrs, famHref, deptHref, brandHref, nCodes, nPages, loaded } from './catalog-data.js';
import { search } from './search.js';
import { home } from './views/home.js';
import { catalogIndex, deptPage, familyPage, searchPage, deptOrder, countsSource, nDepts } from './views/catalog.js';
import { brandsIndex, brandPage } from './views/brands.js';
import { bay } from './views/bay.js';
import { calibration } from './views/calibration.js';
import { training } from './views/training.js';
import { about, support } from './views/company.js';
import { quotePage, leads } from './views/quote.js';

const $ = (s, el = document) => el.querySelector(s);
const main = $('#main');

/* ---------- header ---------- */

const WM_PATH = 'M34.300000000000004 0.0 0.8 -68.8H28.200000000000003L40.800000000000004 -39.900000000000006Q41.5 -38.400000000000006 42.6 -35.550000000000004Q43.7 -32.7 44.900000000000006 -29.550000000000004Q46.1 -26.400000000000002 47.0 -23.8H47.7Q48.5 -26.1 49.6 -29.1Q50.7 -32.1 51.85 -35.0Q53.0 -37.9 53.900000000000006 -39.900000000000006L66.7 -68.8H93.0L59.5 0.0Z M105.70000000000002 0.0V-68.8H179.20000000000002V-51.7H130.5V-42.800000000000004H172.5V-26.6H130.5V-17.1H180.0V0.0Z M196.20000000000002 0.0V-68.8H220.9V-18.900000000000002H265.5V0.0Z M322.30000000000007 1.2000000000000002Q308.20000000000005 1.2000000000000002 297.90000000000003 -3.1Q287.6 -7.4 282.0 -15.350000000000001Q276.40000000000003 -23.3 276.40000000000003 -34.4Q276.40000000000003 -45.5 282.0 -53.5Q287.6 -61.5 297.90000000000003 -65.75Q308.20000000000005 -70.0 322.30000000000007 -70.0Q336.50000000000006 -70.0 346.75000000000006 -65.75Q357.00000000000006 -61.5 362.6 -53.5Q368.20000000000005 -45.5 368.20000000000005 -34.4Q368.20000000000005 -23.3 362.6 -15.350000000000001Q357.00000000000006 -7.4 346.75000000000006 -3.1Q336.50000000000006 1.2000000000000002 322.30000000000007 1.2000000000000002ZM322.30000000000007 -15.9Q327.00000000000006 -15.9 330.80000000000007 -17.150000000000002Q334.6 -18.400000000000002 337.30000000000007 -20.75Q340.00000000000006 -23.1 341.4000000000001 -26.3Q342.80000000000007 -29.5 342.80000000000007 -33.300000000000004V-35.7Q342.80000000000007 -39.5 341.4000000000001 -42.650000000000006Q340.00000000000006 -45.800000000000004 337.30000000000007 -48.10000000000001Q334.6 -50.400000000000006 330.80000000000007 -51.650000000000006Q327.00000000000006 -52.900000000000006 322.30000000000007 -52.900000000000006Q317.6 -52.900000000000006 313.80000000000007 -51.650000000000006Q310.00000000000006 -50.400000000000006 307.30000000000007 -48.10000000000001Q304.6 -45.800000000000004 303.20000000000005 -42.650000000000006Q301.8 -39.5 301.8 -35.7V-33.300000000000004Q301.8 -29.5 303.20000000000005 -26.3Q304.6 -23.1 307.30000000000007 -20.75Q310.00000000000006 -18.400000000000002 313.80000000000007 -17.150000000000002Q317.6 -15.9 322.30000000000007 -15.9Z M425.90000000000003 1.2000000000000002Q411.00000000000006 1.2000000000000002 401.20000000000005 -2.85Q391.40000000000003 -6.9 386.55000000000007 -14.8Q381.70000000000005 -22.700000000000003 381.70000000000005 -34.4Q381.70000000000005 -51.5 393.00000000000006 -60.75Q404.30000000000007 -70.0 426.1 -70.0Q438.1 -70.0 447.20000000000005 -66.25Q456.30000000000007 -62.5 461.45000000000005 -55.85Q466.6 -49.2 466.6 -40.5H442.6Q442.6 -44.1 440.5 -46.900000000000006Q438.40000000000003 -49.7 434.6 -51.300000000000004Q430.80000000000007 -52.900000000000006 425.70000000000005 -52.900000000000006Q419.30000000000007 -52.900000000000006 415.1500000000001 -50.60000000000001Q411.00000000000006 -48.300000000000004 409.05000000000007 -44.400000000000006Q407.1 -40.5 407.1 -35.7V-33.2Q407.1 -28.6 409.05000000000007 -24.650000000000002Q411.00000000000006 -20.700000000000003 415.00000000000006 -18.3Q419.00000000000006 -15.9 425.20000000000005 -15.9Q430.90000000000003 -15.9 434.95000000000005 -17.400000000000002Q439.00000000000006 -18.900000000000002 441.1500000000001 -21.6Q443.30000000000007 -24.3 443.30000000000007 -27.900000000000002H466.6Q466.6 -19.5 461.75 -12.9Q456.90000000000003 -6.300000000000001 447.80000000000007 -2.5500000000000003Q438.70000000000005 1.2000000000000002 425.90000000000003 1.2000000000000002Z M483.0 0.0V-68.8H507.70000000000005V0.0Z M551.1 0.0V-49.900000000000006H521.9V-68.8H605.0V-49.900000000000006H575.8000000000001V0.0Z M647.8000000000001 0.0V-27.1L613.5000000000001 -68.8H642.4000000000001L660.3000000000001 -45.6H661.0000000000001L678.9000000000001 -68.8H706.7L672.5000000000001 -27.1V0.0Z';
// The Lock + VELOCITY wordmark (Archivo Expanded Black, outlined). Spec: /mnt/project-files/velocity/brand/
export const wordmark = (cls = '') => `<span class="wm ${cls}"><svg class="wm__svg" viewBox="0 0 805.81 68.6" role="img" aria-label="Velocity"><rect width="34.3" height="34.3" fill="currentColor"/><rect x="34.3" y="34.3" width="34.3" height="34.3" fill="currentColor"/><circle cx="34.3" cy="34.3" r="7.89" fill="#FF3D1F"/><path transform="translate(97.41,68.6)" d="${WM_PATH}" fill="currentColor"/></svg></span>`;

function renderHeader() {
  $('#hdr').innerHTML = `
  <div class="hdr__in">
    <a class="hdr__brand" href="#home" aria-label="Velocity home">${wordmark()}</a>
    <button type="button" class="hdr__pv" data-open-drawer aria-controls="drawer" title="Placeholders to confirm"><i></i><span>Preview</span><b>${PH.size}</b></button>
    <nav class="nav" aria-label="Main">
      <button type="button" class="nav__a nav__a--menu" data-mega aria-expanded="false" aria-controls="mega" data-nav="catalog">Catalog ${icon('down')}</button>
      <a class="nav__a" href="#bay" data-nav="bay">Build your bay</a>
      <a class="nav__a" href="#calibration" data-nav="calibration">Calibration</a>
      <a class="nav__a" href="#training" data-nav="training">Training</a>
      <a class="nav__a" href="#about" data-nav="about">About</a>
    </nav>
    <form class="hs" role="search" data-hs autocomplete="off">
      <label class="sr" for="hs-q">Search the catalog</label>
      ${icon('search')}
      <input id="hs-q" class="hs__in" type="search" name="q" placeholder="Search part numbers" enterkeyhint="search" aria-autocomplete="list" aria-controls="hs-drop" aria-expanded="false">
      <kbd class="hs__k" aria-hidden="true">/</kbd>
      <button type="button" class="hs__x" data-hs-x aria-label="Close search">${icon('close')}</button>
      <div class="hs__drop" id="hs-drop" role="listbox" hidden></div>
    </form>
    <div class="hdr__right">
      <a class="hdr__phone" href="${SITE.phoneHref}">${icon('phone')}<span>${rt(SITE.phone)}</span></a>
      <button type="button" class="hdr__sbtn" data-msearch aria-label="Search the catalog">${icon('search')}</button>
      <a class="btn btn--signal btn--sm hdr__quote" href="#quote" data-nav="quote"><span>Quote</span><span class="qbadge" data-qcount aria-label="items in quote">0</span></a>
      <button type="button" class="hdr__burger" aria-label="Open menu" aria-expanded="false" aria-controls="mnav">${icon('menu')}</button>
    </div>
  </div>
  <div class="mega" id="mega" hidden>
    <div class="mega__in">
      <div>
        <p class="mega__h">Brands</p>
        <div class="mbrands" data-mega-brands></div>
        <p class="mega__h">Departments <span data-mega-count></span></p>
        <div class="mega__depts" data-mega-depts><p class="small" style="color:#8d929a">Loading the catalog…</p></div>
      </div>
      <div class="mega__side">
        <a class="mega__feature" href="#catalog"><strong>The whole catalog</strong><span data-mega-all>Every brand and department, with part numbers, photos and specs.</span>${icon('arrow')}</a>
        <a class="mega__feature" href="#bay"><strong>Build your bay</strong><span>Drop real catalog products into a 3D bay and send the whole bay as one quote.</span>${icon('arrow')}</a>
        <a class="mega__feature" href="#quote"><strong>Paint, masking and tape</strong><span>Velocity carries shop supplies too. Send your own list with your quote.</span>${icon('arrow')}</a>
      </div>
    </div>
  </div>
  <div class="mnav" id="mnav" hidden>
    <nav class="mnav__in" aria-label="Mobile">
      <form class="hs hs--m" role="search" data-hs autocomplete="off">
        <label class="sr" for="hs-qm">Search the catalog</label>
        ${icon('search')}
        <input id="hs-qm" class="hs__in" type="search" name="q" placeholder="Search part numbers or products" enterkeyhint="search" aria-autocomplete="list" aria-controls="hs-drop-m" aria-expanded="false">
        <div class="hs__drop" id="hs-drop-m" role="listbox" hidden></div>
      </form>
      <a href="#catalog">Catalog</a>
      <div class="mnav__grp" data-mnav-brands hidden></div>
      <details class="mnav__fold" data-mnav-fold hidden>
        <summary><span>Shop by department</span><span class="mnav__n" data-mnav-n></span>${icon('down')}</summary>
        <div class="mnav__depts" data-mnav-depts></div>
      </details>
      <a href="#bay">Build your bay</a>
      <a href="#calibration">Calibration equipment</a>
      <a href="#training">Training</a>
      <a href="#about">About Velocity</a>
      <a href="#support">Support</a>
      <a class="btn btn--signal" href="#quote">Get a quote</a>
      <p class="mnav__phone">${icon('phone')} ${rt(SITE.phone)}</p>
      <button type="button" class="mnav__pv" data-open-drawer aria-controls="drawer"><i></i><span>Preview build: <b>${PH.size}</b> placeholders to confirm</span></button>
    </nav>
  </div>`;

  const mega = $('#mega'), trigger = $('[data-mega]');
  let closeT = 0, hoverAt = 0;
  const open = (v) => {
    clearTimeout(closeT);
    mega.hidden = !v; trigger.setAttribute('aria-expanded', String(v));
    document.body.classList.toggle('mega-open', v);
  };
  // a click that lands just after the pointer opened the menu keeps it open, so it never flickers shut
  trigger.addEventListener('click', () => { if (!mega.hidden && Date.now() - hoverAt < 700) return; open(mega.hidden); });
  const hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hoverable) {
    trigger.addEventListener('mouseenter', () => { if (mega.hidden) hoverAt = Date.now(); open(true); });
    trigger.addEventListener('mouseleave', () => { closeT = setTimeout(() => open(false), 220); });
    mega.addEventListener('mouseenter', () => clearTimeout(closeT));
    mega.addEventListener('mouseleave', () => { closeT = setTimeout(() => open(false), 220); });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { open(false); toggleMobile(false); toggleSearch(false); closeDrawer(); }
    // "/" jumps to the catalog search, the way parts counters and code search boxes work
    if (e.key === '/' && !e.target.closest('input, textarea, select, [contenteditable]')) {
      e.preventDefault();
      if (window.matchMedia('(max-width: 1240px)').matches) toggleSearch(true);
      else { const box = $('#hs-q'); box.focus(); box.select(); }
    }
  });
  document.addEventListener('click', e => { if (!mega.hidden && !e.target.closest('#mega, [data-mega]')) open(false); });

  const burger = $('.hdr__burger'), mnav = $('#mnav');
  const toggleMobile = (v) => {
    mnav.hidden = !v; burger.setAttribute('aria-expanded', String(v));
    burger.innerHTML = icon(v ? 'close' : 'menu');
    burger.setAttribute('aria-label', v ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('mnav-open', v);
  };
  burger.addEventListener('click', () => { toggleSearch(false); toggleMobile(mnav.hidden); });

  // narrow screens: the search button opens the search box across the header
  const sbtn = $('[data-msearch]'), hdrForm = $('.hdr__in > .hs');
  const toggleSearch = (v) => {
    if (v === document.body.classList.contains('hs-open')) return;
    document.body.classList.toggle('hs-open', v);
    sbtn.setAttribute('aria-expanded', String(v));
    if (v) { toggleMobile(false); open(false); setTimeout(() => $('#hs-q').focus(), 20); }
    else hdrForm.__close && hdrForm.__close();
  };
  sbtn.setAttribute('aria-expanded', 'false');
  sbtn.setAttribute('aria-controls', 'hs-q');
  sbtn.addEventListener('click', () => toggleSearch(true));
  $('[data-hs-x]').addEventListener('click', () => toggleSearch(false));
  document.addEventListener('click', e => { if (document.body.classList.contains('hs-open') && !e.target.closest('.hdr__in > .hs, [data-msearch]')) toggleSearch(false); });
  window.__closeMenus = () => { open(false); toggleMobile(false); toggleSearch(false); document.querySelectorAll('[data-hs]').forEach(f => f.__close && f.__close()); };

  document.querySelectorAll('[data-hs]').forEach(bindSearch);

  catalog().then(cat => {
    const depts = deptOrder(cat);
    $('[data-mega-count]').textContent = String(cat.depts.length);
    $('[data-mega-all]').textContent = `${nCodes(cat.counts.codes)} in ${nDepts(cat.depts.length)}. ${countsSource(cat)}`;
    // a brand whose catalog is listed shows how much of it there is; one that is named but not listed yet says so
    const brandMeta = (b) => (b.live ? nCodes(b.codes) : 'Catalog being added');
    $('[data-mega-brands]').innerHTML = cat.brands.map(b => `<a class="mbrand ${b.live ? '' : 'mbrand--soon'}" href="${brandHref(b)}"><span class="mbrand__n">${esc(b.name)}</span><span class="mbrand__c">${brandMeta(b)}</span>${icon('arrow')}</a>`).join('')
      + `<a class="mbrand mbrand--all" href="#brands"><span class="mbrand__n">All brands</span>${icon('arrow')}</a>`;
    const mb = $('[data-mnav-brands]');
    mb.innerHTML = `<p class="mnav__h">Shop by brand</p>${cat.brands.map(b => `<a class="mnav__sub" href="${brandHref(b)}"><span>${esc(b.name)}</span><span class="mnav__c">${brandMeta(b)}</span></a>`).join('')}`;
    mb.hidden = false;
    $('[data-mnav-n]').textContent = String(cat.depts.length);
    $('[data-mnav-fold]').hidden = false;
    $('[data-mega-depts]').innerHTML = depts.map(d => `<a class="mdept" href="${deptHref(d)}">
        <span class="mdept__img"><img ${photoAttrs(d.hero, 'set/heroes')} alt="" decoding="async"></span>
        <span class="mdept__t"><span class="mdept__n">${esc(d.name)}</span><span class="mdept__c">${nCodes(d.codes)}</span></span>
      </a>`).join('') + `<a class="mdept mdept--cal" href="#calibration"><span class="mdept__img mdept__img--cal" aria-hidden="true"><span class="caltarget"></span></span><span class="mdept__t"><span class="mdept__n">${esc(CALIBRATION.name)}</span><span class="mdept__c mdept__c--status">${esc(CALIBRATION.status)}</span></span></a>`;
    $('[data-mnav-depts]').innerHTML = depts.map(d => `<a class="mnav__sub" href="${deptHref(d)}"><span>${esc(d.name)}</span></a>`).join('') + `<a class="mnav__sub" href="#calibration"><span>${esc(CALIBRATION.name)}</span><span class="mnav__c">${esc(CALIBRATION.status)}</span></a>`;
    // the placeholder in the header box says how much there is to search, when the box is wide enough to say it
    const box = $('#hs-q'), long = `Search ${cat.counts.codes.toLocaleString('en-US')} part numbers`;
    const fit = () => { box.placeholder = box.clientWidth >= 252 || !box.clientWidth ? long : 'Search part numbers'; };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(box);
  }).catch(() => { $('[data-mega-depts]').innerHTML = '<p class="small" style="color:#c3c7cd">The catalog didn’t load. Reload the page to try again.</p>'; });
}

/* ---------- live catalog search in the header ---------- */

function bindSearch(form) {
  const input = form.querySelector('.hs__in'), drop = form.querySelector('.hs__drop');
  let t = 0, items = [], active = -1, lastQ = '';
  const close = () => { drop.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; form.classList.remove('is-open'); };
  form.__close = close;
  const setActive = (i) => {
    active = i;
    items.forEach((a, k) => { a.classList.toggle('is-on', k === i); a.setAttribute('aria-selected', String(k === i)); });
    if (items[i]) items[i].scrollIntoView({ block: 'nearest' });
  };
  const paint = (cat, q) => {
    if (!q) { close(); return; }
    const r = search(cat, q, { famLimit: 5, codeLimit: 6 });
    const nf = r.totalFams ?? r.fams.length, nc = r.totalCodes ?? r.codes.length;
    const codes = r.exact ? [r.exact, ...r.codes.filter(c => c !== r.exact)].slice(0, 6) : r.codes.slice(0, 6);
    const mixed = new Set([...r.fams.map(f => f.brand), ...codes.map(c => cat.fam[c.fid].brand)]).size > 1;
    drop.innerHTML = `${r.brands.length ? `<p class="hs__h">Brands</p>${r.brands.map(b => `<a class="hs__i hs__i--brand" role="option" href="${brandHref(b)}"><span class="hs__t"><span class="hs__n">${esc(b.name)}</span><span class="hs__m">${b.live ? `${nCodes(b.codes)} in ${nDepts(b.depts.length)}` : 'Catalog being added'}</span></span>${icon('arrow')}</a>`).join('')}` : ''}
      ${r.fams.length ? `<p class="hs__h">Products</p>${r.fams.map(f => `<a class="hs__i" role="option" href="${famHref(f)}"><span class="hs__img">${f.photo ? `<img ${photoAttrs(f.photo, f.lp, true)} alt="" decoding="async">` : ''}</span><span class="hs__t"><span class="hs__n">${esc(f.name)}</span><span class="hs__m">${mixed ? `${esc(cat.brand[f.brand].name)} · ` : ''}${esc(cat.dept[f.dept].name)} · ${nCodes(f.all)}</span></span></a>`).join('')}` : ''}
      ${codes.length ? `<p class="hs__h">Part numbers</p>${codes.map(c => `<a class="hs__i hs__i--code" role="option" href="${famHref(cat.fam[c.fid], c.code)}"><span class="pn">${esc(c.code)}</span><span class="hs__t"><span class="hs__n">${esc(c.label)}</span></span></a>`).join('')}` : ''}
      ${nf || nc ? `<a class="hs__all" role="option" href="#search/${encodeURIComponent(q)}">See all results for “${esc(q)}” <span>${[nc && nCodes(nc), nf && nPages(nf)].filter(Boolean).join(', ')}</span>${icon('arrow')}</a>` : r.brands.length ? '' : `<p class="hs__none">Nothing in the catalog matches “${esc(q)}”. Velocity carries more than the site lists: <a href="#quote" data-quote-note="${esc(q)}">ask on a quote</a>.</p>`}`;
    items = [...drop.querySelectorAll('.hs__i, .hs__all')];
    drop.hidden = false; form.classList.add('is-open'); input.setAttribute('aria-expanded', 'true');
    setActive(-1);
  };
  const run = () => {
    const q = input.value.trim();
    if (q === lastQ && !drop.hidden) return;
    lastQ = q;
    const cat = loaded();
    if (cat) paint(cat, q); else catalog().then(c => paint(c, input.value.trim())).catch(() => {});
  };
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(run, 90); });
  input.addEventListener('focus', () => { if (input.value.trim()) { lastQ = ''; run(); } else catalog().catch(() => {}); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown' && items.length) { e.preventDefault(); setActive(Math.min(items.length - 1, active + 1)); }
    else if (e.key === 'ArrowUp' && items.length) { e.preventDefault(); setActive(Math.max(-1, active - 1)); }
    else if (e.key === 'Escape') { close(); input.blur(); }
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (active >= 0 && items[active]) { location.hash = items[active].getAttribute('href').slice(1); }
    else if (q) location.hash = `search/${encodeURIComponent(q)}`;
    close(); input.blur();
    window.__closeMenus && window.__closeMenus();
  });
  drop.addEventListener('mousedown', e => { if (e.target.closest('a')) e.preventDefault(); }); // keep focus until the click lands
  drop.addEventListener('click', e => { if (e.target.closest('a')) { close(); input.value = ''; lastQ = ''; input.blur(); } });
  document.addEventListener('click', e => { if (!drop.hidden && !form.contains(e.target)) close(); });
}

function updateQuoteBadge() {
  const n = quote.count();
  document.querySelectorAll('[data-qcount]').forEach(b => {
    const changed = b.textContent !== String(n);
    b.textContent = n; b.classList.toggle('is-empty', n === 0);
    if (changed && n > 0) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  });
}

/* ---------- footer ---------- */

function renderFooter() {
  $('#ftr').innerHTML = `
  <div class="ftr__top">
    <div class="ftr__brand">
      ${wordmark('wm--lg')}
      <p class="ftr__line">Equipment and supplies for collision shops.</p>
      <p class="ftr__contact"><a href="${SITE.phoneHref}">${icon('phone')} ${rt(SITE.phone)}</a><span>${icon('mail')} ${rt(SITE.email)}</span></p>
    </div>
    <nav class="ftr__cols" aria-label="Footer">
      <div data-ftr-brands><p class="ftr__h">Brands</p><a href="#brands">All brands</a></div>
      <div data-ftr-depts><p class="ftr__h">Departments</p><a href="#catalog">All departments</a></div>
      <div><p class="ftr__h">Velocity</p><a href="#bay">Build your bay</a><a href="#calibration">Calibration equipment</a><a href="#training">Training</a><a href="#about">About Velocity</a><a href="#support">Support</a></div>
      <div><p class="ftr__h">Your quote</p><a href="#quote">Get a quote</a><a href="#search">Search part numbers</a><a href="#leads" data-editor-only hidden>Leads inbox</a></div>
    </nav>
  </div>
  <div class="ftr__bottom">
    <p>&copy; ${new Date().getFullYear()} ${rt(SITE.legal)}. Velocity sells equipment and supplies and trains shops on equipment it sells. We do not repair vehicles.</p>
    <p class="ftr__note">Product photos, part numbers and specs are shown as each maker publishes them. Brand names belong to their owners. Prices come on your written quote.</p>
  </div>`;
  catalog().then(cat => {
    const box = $('[data-ftr-depts]');
    box.innerHTML = `<p class="ftr__h">Departments</p>${deptOrder(cat).slice(0, 8).map(d => `<a href="${deptHref(d)}">${esc(d.name)}</a>`).join('')}<a href="#catalog">All ${cat.depts.length} departments</a>`;
    $('[data-ftr-brands]').innerHTML = `<p class="ftr__h">Brands</p>${cat.brands.map(b => `<a href="${brandHref(b)}">${esc(b.name)}</a>`).join('')}<a href="#brands">All brands</a>`;
  }).catch(() => {});
}

/* ---------- preview pill + "to confirm" drawer ---------- */

let highlight = false;
function renderPreviewTools() {
  const groups = PH_GROUPS.map(g => {
    const rows = [...PH.values()].filter(x => x.group === g);
    if (!rows.length) return '';
    return `<section class="drawer__group"><h3>${esc(g)} <span>${rows.length}</span></h3><ul>${rows.map(r => `<li><span class="drawer__label">${esc(r.label)}</span><span class="drawer__val">${esc(r.value)}</span></li>`).join('')}</ul></section>`;
  }).join('');
  $('#drawer').innerHTML = `
    <div class="drawer__in" role="dialog" aria-modal="false">
      <div class="drawer__head">
        <p class="kicker">Preview build</p>
        <h2 id="drawerTitle">What we need from the Velocity team</h2>
        <button type="button" class="drawer__x" data-close-drawer aria-label="Close">${icon('close')}</button>
      </div>
      <p class="drawer__intro">Everything marked <span class="ph-key">like this</span> on the site is a placeholder. Swap in the real answer and the mark goes away. The rest of the list has no spot on the page yet.</p>
      <label class="switch"><input type="checkbox" data-hl ${highlight ? 'checked' : ''}><span class="switch__ui"></span><span>Highlight placeholders on the page</span></label>
      <div class="drawer__groups">${groups}</div>
      <p class="drawer__foot">Product photos, part numbers and specs come from the catalog of each line Velocity sells. The bay builder’s 3D models are built from those photos.</p>
    </div>`;
  document.addEventListener('click', e => {
    if (e.target.closest('[data-open-drawer]')) { window.__closeMenus && window.__closeMenus(); openDrawer(); }
    else if (e.target.closest('[data-close-drawer]')) closeDrawer();
  });
  $('#drawer').addEventListener('change', e => {
    if (e.target.matches('[data-hl]')) { highlight = e.target.checked; document.body.classList.toggle('show-ph', highlight); }
  });
}
function openDrawer() { const d = $('#drawer'); d.classList.add('is-open'); d.setAttribute('aria-hidden', 'false'); $('[data-close-drawer]', d).focus(); }
function closeDrawer() { const d = $('#drawer'); if (!d.classList.contains('is-open')) return; d.classList.remove('is-open'); d.setAttribute('aria-hidden', 'true'); }

/* ---------- router ---------- */

const STATIC = { '': home, home, catalog: catalogIndex, brands: brandsIndex, bay, calibration, training, about, support, quote: quotePage, leads };

function resolve(name) {
  if (STATIC[name]) return STATIC[name];
  let m;
  if ((m = name.match(/^d-([a-z-]+)$/))) return m[1] === 'calibration' ? { redirect: 'calibration' } : DEPT_ALIAS[m[1]] ? { redirect: `d-${DEPT_ALIAS[m[1]]}` } : deptPage(m[1]);
  // a brand's catalog, and its part of one department: b-martech, b-martech-d-welding
  if ((m = name.match(/^b-([a-z0-9]+)(?:-d-([a-z-]+))?$/))) return m[2] ? deptPage(DEPT_ALIAS[m[2]] || m[2], m[1]) : brandPage(m[1]);
  // a product, with the part number to open it on at the end: p-f009-digital-mini-spotter-SP202018.
  // A family id is one to three letters and three to six digits, so another brand's products need no new route.
  if ((m = name.match(/^p-([a-z]{1,3}\d{3,6})(?:-(.*))?$/i))) return familyPage(m[1].toUpperCase(), m[2] || '');
  // the earlier address forms (d/welding, p/f009-slug/SP202018) open the same pages
  if ((m = name.match(/^d\/([a-z-]+)$/))) return { redirect: m[1] === 'calibration' ? 'calibration' : `d-${DEPT_ALIAS[m[1]] || m[1]}` };
  if ((m = name.match(/^p\/(f\d{3})(?:-[a-z0-9-]*)?(?:\/(sp\d{6,7}))?$/i))) return familyPage(m[1].toUpperCase(), m[2] || '');
  // search, across every brand or inside one: search/spot welder, search/spot welder/b-martech
  if ((m = name.match(/^search(?:\/(.*))?$/))) {
    let q = m[1] || '';
    const b = q.match(/(?:^|\/)b-([a-z0-9]+)$/);
    if (b) q = q.slice(0, b.index);
    return searchPage(q.trim(), b ? b[1] : '');
  }
  // links from earlier previews
  if (/^course-/.test(name)) return { redirect: 'training' };
  if (/^equipment-/.test(name)) return { redirect: 'catalog' };
  return null;
}

const notFound = {
  title: 'Page not found',
  render(el) {
    el.innerHTML = `<section class="nf wrap"><p class="kicker">404</p><h1 class="h1">That page isn’t on the floor.</h1><p class="lede">It may have moved. Search the catalog, open a department, or call us.</p><p class="row-gap"><a class="btn btn--signal" href="#catalog">Open the catalog ${icon('arrow')}</a><a class="btn btn--line" href="#home">Home</a></p></section>`;
  },
};

let cleanup = null, current = null, intent = 'load';
const scrollMem = new Map();

function route() {
  let name = location.hash.replace(/^#/, '');
  try { name = decodeURIComponent(name); } catch { /* keep the raw hash */ }
  // old links land on the page that replaced them
  if (LEGACY[name]) { name = LEGACY[name]; history.replaceState(null, '', `#${name}`); }
  let view = resolve(name);
  if (view && view.redirect) { name = view.redirect; history.replaceState(null, '', `#${name}`); view = resolve(name); }
  view = view || notFound;
  if (current !== null) scrollMem.set(current, window.scrollY);
  try { cleanup && cleanup(); } catch (e) { console.error(e); }
  cleanup = null;
  window.__closeMenus && window.__closeMenus();
  closeDrawer();
  current = name;
  document.body.dataset.view = view.id || name || 'home';
  main.innerHTML = '';
  main.className = view.dark ? 'is-dark' : '';
  try { cleanup = view.render(main) || null; }
  catch (e) { console.error(e); main.innerHTML = `<section class="wrap nf"><h1 class="h1">Something went wrong on this page.</h1><p class="lede">Reload, or call ${rt(SITE.phone)}.</p></section>`; }
  const title = typeof view.title === 'function' ? view.title() : view.title;
  document.title = title ? `${title} | Velocity` : 'Velocity | Equipment and supplies for collision shops';
  const navKey = view.nav || name.split('/')[0] || 'home';
  document.querySelectorAll('[data-nav]').forEach(a => a.classList.toggle('is-active', a.dataset.nav === navKey));
  syncAddButtons(main);
  // scroll: new navigation goes to the top, back/forward returns to where you were
  const y = intent === 'push' || intent === 'load' ? 0 : (scrollMem.get(name) || 0);
  window.scrollTo({ top: y, behavior: 'instant' });
  if (intent === 'push') main.focus({ preventScroll: true });
  intent = 'history';
}

document.addEventListener('click', e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute('data-scroll')) return;
  const target = a.getAttribute('href');
  if (target === location.hash || (target === '#home' && !location.hash)) {
    e.preventDefault();
    window.__closeMenus && window.__closeMenus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  intent = 'push';
});
window.addEventListener('hashchange', route);

// links that open the bay builder on a starting setup (read once by the bay page)
document.addEventListener('click', e => {
  const a = e.target.closest('[data-bay-preset]');
  if (a) { try { sessionStorage.setItem('velocity.bay.preset', a.dataset.bayPreset); } catch { /* storage off: the bay opens on its default */ } }
});

// buttons that scroll to a section on the current page (the hash is reserved for routes)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-scroll]');
  if (!b) return;
  e.preventDefault();
  const t = document.getElementById(b.dataset.scroll);
  if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// add-to-quote and quantity controls anywhere on the page
document.addEventListener('click', e => {
  const add = e.target.closest('[data-add]');
  if (add) {
    const id = add.dataset.add, label = add.dataset.label || id;
    quote.add(id, 1);
    // a part number is named with what it is; a product the catalog prints no number for goes by its name
    const cat = loaded();
    toast(`<strong>${esc(cat && cat.codes.has(id) && label !== id ? `${id} ${label}` : label)}</strong> is in your quote.`, { action: { href: '#quote', label: 'View quote' } });
    return;
  }
  const step = e.target.closest('[data-stepper] [data-step]');
  if (step && step.closest('[data-addq]')) {
    const id = step.closest('[data-stepper]').dataset.stepper;
    quote.set(id, quote.qty(id) + Number(step.dataset.step));
  }
});

// "Reload" on a page that didn't load (a listener, so the page needs no inline script)
document.addEventListener('click', e => { if (e.target.closest('[data-reload]')) location.reload(); });

// links that open the quote with a line already started under "Not in the catalog?" (a brand whose catalog isn't
// on the site yet, a search that found nothing). Read once by the quote page.
document.addEventListener('click', e => {
  const a = e.target.closest('[data-quote-note]');
  if (a) { try { sessionStorage.setItem('velocity.quote.note', a.dataset.quoteNote); } catch { /* storage off: the quote opens without it */ } }
});

$('[data-skip]').addEventListener('click', () => { main.focus(); main.scrollIntoView(); });

/* ---------- boot ---------- */

quote.load();
renderHeader();
renderFooter();
renderPreviewTools();
quote.on(() => { updateQuoteBadge(); syncAddButtons(document); });
updateQuoteBadge();
route();

// editors (the owner) get the leads inbox link; everyone else never sees it
viewerCanEdit().then(ok => { if (ok) document.querySelectorAll('[data-editor-only]').forEach(e => (e.hidden = false)); document.body.classList.toggle('is-editor', ok); });
getDb();
