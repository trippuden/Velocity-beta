// Calibration: a department with no products yet. Velocity is choosing the supplier, so this page says so,
// shows the sourced industry numbers, and takes names for when the lineup is set. No kits, no prices.
import { CALIBRATION, STATS, CAL_NEAR } from '../data.js';
import { esc, icon, cite, sectionHead, revealIn, countUp, bindLeadForm, contactFields, contactSummary, scoreLead } from '../core.js';
import { catalog } from '../catalog-data.js';
import { famCard, crumbs } from './catalog.js';

const SYSTEMS = ['Front camera', 'Front radar', 'Blind spot radar', 'Surround view cameras', 'Not sure yet'];

export const calibration = {
  id: 'calibration', nav: 'calibration', title: 'ADAS calibration equipment',
  render(el) {
    el.innerHTML = `
    <section class="phead phead--dark calhead">
      <div class="wrap phead__grid">
        <div>
          ${crumbs([['Home', '#home'], ['Catalog', '#catalog'], ['Calibration']])}
          <p class="status-chip"><i></i>${esc(CALIBRATION.status)}</p>
          <h1 class="h1 h1--md">Calibration equipment is coming.</h1>
          <p class="lede phead__lede">${esc(CALIBRATION.blurb)}</p>
          <div class="row-gap"><a class="btn btn--signal btn--lg" href="#cal-form" data-scroll="cal-form">Get told when it’s ready ${icon('arrow')}</a></div>
        </div>
        <div class="calhead__fig" aria-hidden="true"><span class="caltarget caltarget--big"></span></div>
      </div>
    </section>

    <section class="sec">
      <div class="wrap">
        ${sectionHead({ idx: '01', kicker: 'Why it matters', title: 'Calibration is part of the repair.', lede: 'Cameras and radar sit behind bumpers, glass, mirrors and grilles. Here is what the numbers say about the work, from a published industry source.' })}
        <div class="stats stats--${STATS.length}" data-reveal>${STATS.map(s => {
          const n = parseFloat(s.value.replace(/[^0-9.]/g, ''));
          const pre = (s.value.startsWith('+') ? '+' : '') + (s.value.startsWith('$') ? '$' : '');
          const suf = s.value.endsWith('%') ? '%' : '';
          return `<div class="stat"><p class="stat__v"><span data-count="${n}" data-pre="${esc(pre)}" data-suf="${esc(suf)}">${esc(s.value)}</span>${s.unit ? `<small>${esc(s.unit)}</small>` : ''}</p><p class="stat__l">${esc(s.label)}</p>${cite(s.src)}</div>`;
        }).join('')}</div>
      </div>
    </section>

    <section class="sec sec--tight paper rule-top">
      <div class="wrap two-col">
        <div>${sectionHead({ idx: '02', kicker: 'Where it stands', title: 'What we can tell you today.' })}</div>
        <ul class="facts">
          <li><b>Velocity will sell it.</b><span>ADAS calibration equipment joins the catalog once the supplier is chosen.</span></li>
          <li><b>Velocity will train on it.</b><span>When your techs need it, Velocity trains them on the calibration equipment it sells.</span></li>
          <li><b>Your tech does the calibration.</b><span>Velocity sells the equipment and trains. It doesn’t calibrate cars or repair them.</span></li>
          <li><b>No kits or prices yet.</b><span>The lineup, specs and prices go on this page when they’re set, and not before.</span></li>
        </ul>
      </div>
    </section>

    <section class="sec sec--tight" data-near-sec hidden>
      <div class="wrap">
        <div class="split-head">${sectionHead({ idx: '03', kicker: 'In the catalog now', title: 'Alignment and aim.', lede: 'Wheel alignment and headlight aim are in the catalog today, with the lifts that go under them.' })}</div>
        <div class="fgrid fgrid--4" data-near></div>
      </div>
    </section>

    <section class="sec dark" id="cal-form">
      <div class="wrap two-col">
        <div>
          ${sectionHead({ idx: '04', kicker: 'Get told first', title: 'Leave your details.', lede: 'Tell us what your shop calibrates today. When the lineup is set, Velocity contacts you with the equipment, the training and the prices.' })}
        </div>
        <div class="qform qform--dark" data-form-host>
          <form class="form" novalidate data-cal-form>
            ${contactFields()}
            <div class="field"><span class="field__l">How do you handle calibrations today?</span><div class="choice-row">${[['sublet', 'We sublet them'], ['some', 'Some in-house'], ['dealer', 'The dealer does them'], ['none', 'We don’t see them yet']].map(([v, l], i) => `<label class="choice"><input type="radio" name="today" value="${v}" ${i === 0 ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div></div>
            <div class="field"><span class="field__l">Systems you see most <span class="field__opt">(pick any)</span></span><div class="choice-row">${SYSTEMS.map(s => `<label class="choice"><input type="checkbox" name="systems" value="${esc(s)}"><span>${esc(s)}</span></label>`).join('')}</div></div>
            <label class="field"><span>Anything else? <span class="field__opt">(optional)</span></span><textarea name="notes" rows="3" placeholder="The makes you see most, how many calibrations a month, what you use now"></textarea></label>
            <div class="form__submit"><button type="submit" class="btn btn--signal btn--lg">Keep me posted ${icon('arrow')}</button><p class="form__note">We use this to contact you about calibration equipment. No newsletter, no reselling your info.</p></div>
          </form>
        </div>
      </div>
    </section>`;

    const offs = [revealIn(el), countUp(el)];
    let gone = false;
    catalog().then(cat => {
      if (gone) return;
      const fams = CAL_NEAR.map(id => cat.fam[id]).filter(Boolean);
      if (!fams.length) return;
      el.querySelector('[data-near]').innerHTML = fams.map(f => famCard(f, { pack: 'set/near' })).join('');
      el.querySelector('[data-near-sec]').hidden = false;
    }).catch(() => {});

    bindLeadForm(el.querySelector('[data-cal-form]'), {
      type: 'calibration', prefix: 'C',
      build: (d) => {
        const systems = [].concat(d.systems || []);
        const sc = scoreLead({ timeline: d.today === 'sublet' ? '90' : 'research', role: d.role, type: 'calibration' });
        return {
          lead: { name: d.name, shop: d.shop, email: d.email, phone: d.phone, zip: d.zip, role: d.role, score: sc.score, tier: sc.tier, details: { today: d.today, systems: systems.join(', '), notes: d.notes || '' } },
          summary: `CALIBRATION: KEEP ME POSTED\n${contactSummary(d)}\n\nCalibrations today: ${d.today}\nSystems seen most: ${systems.join(', ') || 'not given'}\nNotes: ${d.notes || 'none'}`,
        };
      },
      success: { title: 'You’re on the list.', body: 'When the calibration lineup is set, Velocity contacts you with the equipment, the training and the prices. Keep the reference number above.' },
    });
    return () => { gone = true; offs.forEach(f => f()); };
  },
};
