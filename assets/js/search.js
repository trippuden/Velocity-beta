
const norm = (s) => String(s || '').toLowerCase()
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/º/g, '').replace(/[“”"]/g, ' in ').replace(/&/g, ' and ')
  .replace(/[^a-z0-9/.+-]+/g, ' ').replace(/\s+/g, ' ').trim();

const SYN = {
  wrench: ['wrench', 'spanner'], wrenches: ['wrench', 'spanner'],
  cart: ['cart', 'trolley'], carts: ['cart', 'trolley'], toolbox: ['trolley', 'tool chest'], rollcab: ['trolley'], 'roll cab': ['trolley'],
  hood: ['hood', 'bonnet'], trunk: ['trunk', 'tailgate'], tire: ['tire', 'tyre', 'wheel'], tires: ['tire', 'tyre', 'wheel'],
  dent: ['dent', 'spotter', 'puller'], puller: ['puller', 'spotter', 'pull'], stud: ['stud', 'spotter', 'washer'],
  welder: ['weld', 'spotter', 'mig', 'punto'], welding: ['weld', 'spotter', 'mig', 'punto'],
  frame: ['frame', 'bench'], straightening: ['bench', 'straighten', 'pull'],
  da: ['sander', 'orbit', 'da 2000'], sander: ['sander', 'sanding'], sanding: ['sander', 'sanding', 'abrasive'],
  sandpaper: ['abrasive', 'sheet abrasive', 'disc'], paper: ['paper', 'masking'], masking: ['masking', 'mask'],
  tape: ['masking', 'tape', 'film'], plastic: ['plastic', 'plast', 'film', 'polythene'],
  paint: ['paint', 'spray'], gun: ['gun'], spraygun: ['spray gun'], 'paint gun': ['spray gun'],
  booth: ['booth', 'spray booth'], prep: ['prep', 'preparation', 'sanding area'], 'mixing room': ['paint box'],
  curing: ['curing', 'uv', 'infrared', 'drying'], ir: ['infrared', 'ir'], heat: ['heat', 'heater', 'hot air', 'induction'],
  dust: ['dust', 'vacuum', 'suction', 'extraction'], vacuum: ['vacuum', 'suction', 'koriolis'], vac: ['vacuum', 'suction'],
  exhaust: ['exhaust'], compressor: ['compressor'], hose: ['hose'], reel: ['reel'],
  rivet: ['rivet', 'riveter'], riveter: ['riveter', 'rivet'], 'vise grip': ['lock-grip', 'self grip'], 'vice grip': ['lock-grip', 'self grip'],
  clamp: ['clamp'], 'c clamp': ['c-clamp'], socket: ['socket'], ratchet: ['ratchet'], torx: ['torx'], allen: ['hex'],
  screwdriver: ['screwdriver'], pliers: ['pliers', 'pincers'], snips: ['snip', 'scissors'], hammer: ['hammer'], dolly: ['dolly', 'dollies'],
  pdr: ['paintless', 'pdr', 'whale tail', 'glue'], paintless: ['paintless', 'pdr'], glue: ['glue', 'adh', 'pull up'],
  creeper: ['creeper', 'inspection trolley'], stool: ['stool'], jack: ['jack'], lift: ['lift'], hoist: ['lift', 'crane'],
  aligner: ['aligner', 'alignment'], alignment: ['aligner', 'alignment'], balancer: ['balancer'], changer: ['changer'],
  ac: ['a/c', 'air conditioning', '1234yf'], 'a/c': ['a/c', 'air conditioning', '1234yf'], freon: ['1234yf', 'a/c'],
  ev: ['ev', 'electric vehicle', 'hybrid', 'insulated', '1,000 v'], hybrid: ['hybrid', 'ev', 'insulated'],
  battery: ['battery'], charger: ['charger', 'starter'], jumper: ['starter', 'booster'], booster: ['booster', 'starter'],
  ozone: ['ozone'], purifier: ['purifier'], fan: ['fan'], heater: ['heater'],
  rack: ['rack', 'stand', 'holder'], stand: ['stand', 'rack'], 'bumper rack': ['bumper rack', 'bumper stand'],
  'parts cart': ['parts cart', 'parts carrier'], 'panel stand': ['panel stand'], 'door stand': ['door stand'],
  windshield: ['glass', 'windscreen'], glass: ['glass', 'windscreen'], cutter: ['cutter', 'cutting'], plasma: ['plasma'],
  mig: ['mig'], tig: ['tig'], spot: ['spot', 'punto'], aluminum: ['aluminum', 'alu', 'almg'], steel: ['steel'],
  meter: ['meter', 'measuring', 'gauge'], measuring: ['measuring', 'meter', 'gauge', 'tram'], gauge: ['gauge', 'meter'],
  light: ['light', 'lamp', 'led'], lamp: ['lamp', 'light', 'led'], polisher: ['polisher', 'polishing'], buffer: ['polisher', 'polishing'],
  compound: ['compound', 'polishing'], washer: ['washer'], 'gun washer': ['gun washer', 'spray gun washer'],
};

const isCodeQuery = (q) => /^(sp)?\s?\d{3,7}$/i.test(q.replace(/\s+/g, ''));

let IDX = null;
function index(cat) {
  if (IDX && IDX.cat === cat) return IDX;
  const deptName = Object.fromEntries(cat.depts.map(d => [d.id, norm(d.name + ' ' + d.short)]));
  const famLabels = new Map();
  cat.codes.forEach(c => { if (c.role === 0) famLabels.set(c.fid, (famLabels.get(c.fid) || '') + ' ' + norm(c.label)); });
  const brandKey = Object.fromEntries(cat.brands.map(b => [b.id, norm(b.name)]));
  const fams = cat.fams.filter(f => !f.dup).map(f => ({
    f, name: ' ' + norm(f.name), sub: ' ' + norm(f.sub) + ' ' + deptName[f.dept], short: ' ' + norm(f.short), labels: ' ' + (famLabels.get(f.id) || ''),
  }));
  const codes = [...cat.codes.values()].map(c => ({ c, brand: cat.fam[c.fid].brand, code: c.code.toLowerCase(), label: ' ' + norm(c.label), fam: ' ' + norm(cat.fam[c.fid].name) }));
  IDX = { cat, fams, codes, brandKey };
  return IDX;
}

function alts(tok) {
  const s = SYN[tok];
  return s ? [...new Set([tok, ...s.map(norm)])] : [tok];
}
const has = (hay, w) => hay.includes(' ' + w);

export function tokens(q) {
  let t = norm(q);
  const multi = Object.keys(SYN).filter(k => k.includes(' ') && t.includes(k));
  multi.forEach(k => { t = t.replace(k, k.replace(/ /g, '_')); });
  return t.split(' ').filter(Boolean).map(w => w.replace(/_/g, ' '));
}

export function search(cat, q, { famLimit = 60, codeLimit = 80, brand = '' } = {}) {
  const raw = String(q || '').trim();
  if (!raw) return { fams: [], codes: [], brands: [], exact: null, q: raw };
  const { fams, codes, brandKey } = index(cat);
  let words = tokens(raw);
  const brands = cat.brands.filter(b => (!brand || b.id === brand) && words.some(w => w.length >= 3 && (brandKey[b.id].startsWith(w) || w.startsWith(brandKey[b.id]))));
  const named = cat.brands.find(b => words.includes(brandKey[b.id]));
  if (named) { words = words.filter(w => w !== brandKey[named.id]); if (!brand) brand = named.id; }
  const mine = (bid) => !brand || bid === brand;
  if (!words.length) return { fams: [], codes: [], brands, exact: null, q: raw, brandOnly: true };
  const whole = cat.codeKey.get(raw.toLowerCase().replace(/\s+/g, ''));
  if (whole && mine(cat.fam[cat.codes.get(whole).fid].brand) && !isCodeQuery(raw)) {
    const c = cat.codes.get(whole), key = whole.toLowerCase();
    const more = codes.filter(x => x.c !== c && mine(x.brand) && x.code.startsWith(key)).sort((a, b) => a.code.localeCompare(b.code)).slice(0, codeLimit - 1).map(x => x.c);
    return { fams: [cat.fam[c.fid]], codes: [c, ...more], brands, exact: c, q: raw };
  }
  if (isCodeQuery(raw)) {
    const digits = raw.replace(/\D/g, '');
    const want = 'sp' + digits;
    const hit = codes.filter(x => mine(x.brand) && (x.code.startsWith(want) || x.code.includes(digits)))
      .sort((a, b) => (b.code === want) - (a.code === want) || (b.code.startsWith(want)) - (a.code.startsWith(want)) || a.code.localeCompare(b.code))
      .slice(0, codeLimit).map(x => x.c);
    const exact = hit.find(c => c.code.toLowerCase() === want) || null;
    const famIds = [...new Set(hit.map(c => c.fid))];
    return { fams: famIds.slice(0, famLimit).map(id => cat.fam[id]), codes: hit, brands, exact, q: raw };
  }
  const groups = words.map(alts);
  const famScored = [];
  for (const x of fams) {
    if (!mine(x.f.brand)) continue;
    let score = 0, ok = true;
    for (const g of groups) {
      let best = 0;
      for (const w of g) {
        const syn = w !== g[0] ? 0.8 : 1;
        if (has(x.name, w)) best = Math.max(best, 10 * syn + (x.name.startsWith(' ' + w) ? 2 : 0));
        else if (has(x.labels, w)) best = Math.max(best, 5 * syn);
        else if (has(x.sub, w)) best = Math.max(best, 4 * syn);
        else if (has(x.short, w)) best = Math.max(best, 2 * syn);
      }
      if (!best) { ok = false; break; }
      score += best;
    }
    if (ok) famScored.push([score + Math.min(3, x.f.n / 10), x.f]);
  }
  famScored.sort((a, b) => b[0] - a[0] || a[1].name.localeCompare(b[1].name));
  const codeScored = [];
  for (const x of codes) {
    if (!mine(x.brand)) continue;
    let score = 0, ok = true;
    for (const g of groups) {
      let best = 0;
      for (const w of g) {
        const syn = w !== g[0] ? 0.8 : 1;
        if (has(x.label, w)) best = Math.max(best, 8 * syn);
        else if (has(x.fam, w)) best = Math.max(best, 3 * syn);
        else if (x.code.includes(w)) best = Math.max(best, 6);
      }
      if (!best) { ok = false; break; }
      score += best;
    }
    if (ok) codeScored.push([score - x.c.role * 0.5, x.c]);
  }
  codeScored.sort((a, b) => b[0] - a[0] || a[1].code.localeCompare(b[1].code));
  return { fams: famScored.slice(0, famLimit).map(s => s[1]), codes: codeScored.slice(0, codeLimit).map(s => s[1]), brands, exact: null, q: raw, totalFams: famScored.length, totalCodes: codeScored.length };
}
