// About and Support. Only what is true and confirmed; everything else is a placeholder the Velocity team fills in.
import { SITE, STORY } from '../data.js';
import { esc, rt, icon, sectionHead, revealIn, bindLeadForm, contactFields, contactSummary, scoreLead, num, fitHints } from '../core.js';
import { catalog } from '../catalog-data.js';
import { crumbs, lockMark, countsSource } from './catalog.js';

export const about = {
  id: 'about', nav: 'about', title: 'About Velocity',
  render(el) {
    el.innerHTML = `
    <section class="phead">
      <div class="wrap phead__grid">
        <div>
          ${crumbs([['Home', '#home'], ['About']])}
          <h1 class="h1 h1--md">We sell what shops run on.</h1>
          <p class="lede phead__lede">Velocity is an equipment and supply company for collision shops. We sell the equipment, tools and supplies a body shop runs on, and we train shops on equipment we sell. Your shop does the repairs.</p>
        </div>
        <div>
          <dl class="counts counts--light" data-counts></dl>
          <p class="counts__src" data-counts-src></p>
        </div>
      </div>
    </section>

    <section class="sec sec--tight rule-top">
      <div class="wrap story">
        <div class="story__photo">${lockMark()}<span>Founder photo to come</span></div>
        <div class="story__body">
          <p>${rt(STORY.origin)}</p>
          <p>Velocity was started by ${rt(STORY.founder)}. It sells collision shops the equipment and supplies they run on: welders and dent pullers, frame benches, spray booths, dust extraction, hand tools, lifts, carts and racks, plus paint, masking and tape.</p>
          <p>When your techs need to learn a machine, ask about training on your quote.</p>
        </div>
      </div>
    </section>

    <section class="sec dark">
      <div class="wrap">
        ${sectionHead({ idx: '01', kicker: 'What we do', title: 'Sell it. Train on it.' })}
        <div class="values">
          <div class="value" data-reveal><p class="value__t">We sell the equipment.</p><p>The catalogs on this site, brand by brand, each product with its part numbers, specs and photos, plus the supplies a shop goes through every week.</p></div>
          <div class="value" data-reveal data-reveal-d="1"><p class="value__t">We train on it.</p><p>Velocity trains shops on equipment it sells. Tick the training box on your quote and we work it out with your shop.</p></div>
          <div class="value" data-reveal data-reveal-d="2"><p class="value__t">We don’t repair cars.</p><p>Your shop does the repairs and the calibrations. We sell the equipment and help your techs use it.</p></div>
        </div>
      </div>
    </section>

    <section class="sec sec--tight">
      <div class="wrap">
        <div class="contact-strip contact-strip--light">
          <div><span class="k">Phone</span><a class="v" href="${SITE.phoneHref}">${rt(SITE.phone)}</a></div>
          <div><span class="k">Email</span><span class="v">${rt(SITE.email)}</span></div>
          <div><span class="k">Based in</span><span class="v">${rt(SITE.hq)}</span></div>
        </div>
        <div class="row-gap"><a class="btn btn--signal btn--lg" href="#quote">Get a quote ${icon('arrow')}</a><a class="btn btn--line btn--lg" href="#catalog">Open the catalog</a></div>
      </div>
    </section>`;
    const offs = [revealIn(el)];
    let gone = false;
    catalog().then(cat => {
      if (gone) return;
      const c = cat.counts;
      el.querySelector('[data-counts]').innerHTML = [[c.codes, 'part numbers'], [c.depts, 'departments'], [c.photos, 'photos']].map(([v, l]) => `<div><dt>${esc(l)}</dt><dd>${num(v)}</dd></div>`).join('');
      el.querySelector('[data-counts-src]').textContent = countsSource(cat);
    }).catch(() => {});
    return () => { gone = true; offs.forEach(f => f()); };
  },
};

export const support = {
  id: 'support', nav: 'support', title: 'Support',
  render(el) {
    el.innerHTML = `
    <section class="phead">
      <div class="wrap phead__grid">
        <div>
          ${crumbs([['Home', '#home'], ['Support']])}
          <h1 class="h1 h1--md">Help with your equipment.</h1>
          <p class="lede phead__lede">Call or email with the part number and what’s happening, and Velocity works it out with you. The part number is on your quote and your invoice.</p>
          <p class="final__phone" style="margin-top:22px">${icon('phone')}<a href="${SITE.phoneHref}">${rt(SITE.phone)}</a><span>·</span><span>${rt(SITE.email)}</span></p>
        </div>
      </div>
    </section>

    <section class="sec sec--tight" style="padding-top:0">
      <div class="wrap"><div class="support-grid">
        <div class="scard"><p class="scard__k">Parts and consumables</p><p class="scard__t">Find the part number.</p><p>Search the catalog for the machine, then pick its spare parts, tips, studs, filters or nozzles from its page.</p><a class="link-arrow" href="#search">Search part numbers ${icon('arrow')}</a></div>
        <div class="scard"><p class="scard__k">Warranty</p><p class="scard__t">It depends on the product.</p><p>Ask on your quote and the terms come back with the price.</p></div>
        <div class="scard"><p class="scard__k">Training</p><p class="scard__t">New to the machine?</p><p>If your techs haven’t run it before, ask about training and Velocity works it out with your shop.</p><a class="link-arrow" href="#training">Training ${icon('arrow')}</a></div>
      </div></div>
    </section>

    <section class="sec dark" id="support-form">
      <div class="wrap two-col">
        <div>${sectionHead({ idx: '01', kicker: 'Support request', title: 'Tell us what’s happening.', lede: 'The part number, what the machine is doing, and the best way to reach you.' })}</div>
        <div class="qform qform--dark" data-form-host>
          <form class="form" novalidate data-support-form>
            ${contactFields({ zip: false })}
            <label class="field"><span>Part number or machine</span><input name="part" required placeholder="For example SP202002" data-hints="For example SP202002, or Digital Mini Spotter|SP202002 or Digital Mini Spotter|For example SP202002"></label>
            <label class="field"><span>What’s happening?</span><textarea name="issue" rows="4" required placeholder="What it does, when it started, any error on the display"></textarea></label>
            <div class="field"><span class="field__l">Best way to reach you</span><div class="choice-row">${[['phone', 'Phone'], ['email', 'Email'], ['text', 'Text']].map(([v, l], i) => `<label class="choice"><input type="radio" name="reach" value="${v}" ${i === 0 ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
            <div class="form__submit"><button type="submit" class="btn btn--signal btn--lg">Send to Velocity ${icon('arrow')}</button></div>
          </form>
        </div>
      </div>
    </section>`;
    bindLeadForm(el.querySelector('[data-support-form]'), {
      type: 'support', prefix: 'S',
      build: (d) => {
        const sc = scoreLead({ timeline: 'now', role: d.role, type: 'support' });
        return {
          lead: { name: d.name, shop: d.shop, email: d.email, phone: d.phone, role: d.role, score: sc.score, tier: sc.tier, details: { part: d.part, issue: d.issue, reach: d.reach } },
          summary: `SUPPORT REQUEST\n${contactSummary(d)}\n\nPart or machine: ${d.part}\nWhat's happening: ${d.issue}\nReach by: ${d.reach}`,
        };
      },
      success: { title: 'Support request received.', body: 'Velocity will reach out the way you picked. Keep the reference number above.' },
    });
    return fitHints(el);
  },
};
