// Training: what Velocity has confirmed and nothing more. It trains shops on equipment it sells, and a shop asks
// for it (the box on the quote, or the form here); Velocity then works it out with that shop. No page says training
// is free, included or guaranteed. Who trains, where and what it costs are open questions for the Velocity team.
import { TRAINING } from '../data.js';
import { esc, icon, sectionHead, revealIn, bindLeadForm, contactFields, contactSummary, scoreLead, fitHints } from '../core.js';
import { catalog, deptHref } from '../catalog-data.js';
import { crumbs, photo, lockMark } from './catalog.js';

const pad = (n) => String(n).padStart(2, '0');
const HOW = [
  ['Tell us what you’re buying', 'Tick the training box on your quote, or use the form below for equipment you already have.'],
  ['Tell us who needs to learn it', 'How many techs, what they run today, and what they haven’t run before.'],
  ['We work it out with you', 'Velocity comes back to your shop about what training fits: who it’s for, when, and what it covers.'],
];

export const training = {
  id: 'training', nav: 'training', title: 'Training',
  render(el) {
    el.innerHTML = `
    <section class="phead phead--dark">
      <div class="wrap phead__grid">
        <div>
          ${crumbs([['Home', '#home'], ['Training']])}
          <h1 class="h1 h1--md">Training on the equipment.</h1>
          <p class="lede phead__lede">Velocity trains shops on equipment it sells. If your techs already know the machine, skip it. If they haven’t run one before, ask, and we work it out with your shop.</p>
          <div class="row-gap"><a class="btn btn--signal btn--lg" href="#train-form" data-scroll="train-form">Ask about training ${icon('arrow')}</a><a class="btn btn--ghost btn--lg" href="#quote">Add it to a quote</a></div>
        </div>
      </div>
    </section>

    <section class="sec">
      <div class="wrap">
        ${sectionHead({ idx: '01', kicker: 'What we train on', title: 'The equipment we sell.', lede: 'A few of the machines shops ask about most often. If it’s in the catalog and your techs need to learn it, ask.' })}
        <div class="tgrid" data-tgrid>${TRAINING.examples.map(([d, t], i) => `<a class="tcard" href="#d-${esc(d)}" data-dept="${esc(d)}" data-reveal data-reveal-d="${i % 3}">
          <span class="tcard__img" data-img></span>
          <span class="tcard__body"><span class="tcard__n">${pad(i + 1)}</span><span class="tcard__t">${esc(t)}</span><span class="tcard__d" data-dname></span></span>
        </a>`).join('')}</div>
      </div>
    </section>

    <section class="sec sec--tight paper rule-top">
      <div class="wrap two-col">
        <div>${sectionHead({ idx: '02', kicker: 'How it works', title: 'Ask. We work it out.' })}</div>
        <ol class="psteps">${HOW.map(([t, b], i) => `<li><span>${pad(i + 1)}</span><b>${esc(t)}</b><p>${esc(b)}</p></li>`).join('')}</ol>
      </div>
    </section>

    <section class="sec dark" id="train-form">
      <div class="wrap two-col">
        <div>
          ${sectionHead({ idx: '03', kicker: 'Training request', title: 'Tell us who needs it.', lede: 'Name the equipment and how many techs. Velocity comes back to you about it.' })}
          <p class="trainmark">${lockMark()}<span>Velocity sells equipment and trains shops on it. Your shop does the repairs.</span></p>
        </div>
        <div class="qform qform--dark" data-form-host>
          <form class="form" novalidate data-train-form>
            ${contactFields()}
            <label class="field"><span>Equipment</span><input name="equipment" required placeholder="Part numbers or names" data-hints="Part numbers or names, for example SP202002 Digital Mini Spotter|For example SP202002 Digital Mini Spotter|Part numbers or names"></label>
            <div class="form__row">
              <label class="field"><span>Techs to train</span><select name="techs" required><option value="">How many?</option><option value="1">1</option><option value="2">2</option><option value="3-4">3 to 4</option><option value="5+">5 or more</option></select></label>
              <label class="field"><span>Do you have the equipment yet?</span><select name="have"><option value="buying">Buying it from Velocity</option><option value="have">We have it already</option><option value="unsure">Not sure yet</option></select></label>
            </div>
            <label class="field"><span>What should they learn? <span class="field__opt">(optional)</span></span><textarea name="notes" rows="3" placeholder="What your techs run today and what’s new to them"></textarea></label>
            <div class="form__submit"><button type="submit" class="btn btn--signal btn--lg">Send the request ${icon('arrow')}</button><p class="form__note">We use this to talk training through with you. No newsletter, no reselling your info.</p></div>
          </form>
        </div>
      </div>
    </section>`;

    const offs = [revealIn(el)];
    let gone = false;
    catalog().then(cat => {
      if (gone) return;
      el.querySelectorAll('[data-dept]').forEach(a => {
        const d = cat.dept[a.dataset.dept]; if (!d) return;
        a.setAttribute('href', deptHref(d));
        a.querySelector('[data-img]').innerHTML = photo(d.hero, { pack: 'set/heroes' });
        a.querySelector('[data-dname]').textContent = d.name;
      });
    }).catch(() => {});

    bindLeadForm(el.querySelector('[data-train-form]'), {
      type: 'training', prefix: 'T',
      build: (d) => {
        const sc = scoreLead({ timeline: d.have === 'buying' ? '30' : '90', role: d.role, bays: d.techs === '5+' ? '5-9' : d.techs === '3-4' ? '2-4' : '1', type: 'training' });
        return {
          lead: { name: d.name, shop: d.shop, email: d.email, phone: d.phone, zip: d.zip, role: d.role, score: sc.score, tier: sc.tier, details: { equipment: d.equipment, techs: d.techs, have: d.have, notes: d.notes || '' } },
          summary: `TRAINING REQUEST\n${contactSummary(d)}\n\nEquipment: ${d.equipment}\nTechs: ${d.techs}\nEquipment status: ${d.have}\nNotes: ${d.notes || 'none'}`,
        };
      },
      success: { title: 'Training request received.', body: 'Velocity comes back to you about training. Keep the reference number above.' },
    });
    offs.push(fitHints(el));
    return () => { gone = true; offs.forEach(f => f()); };
  },
};
