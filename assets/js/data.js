/* Velocity site content.
   The product catalog itself is data in assets/data and photo packs in assets/p: brands, 21 departments, and for the
   Martech catalog 2,391 part numbers on 416 product pages with 1,866 photos. A product page is one product with its
   versions and accessories, or a range of tools, so the site counts part numbers, never "products". This file holds
   everything else: contact details, the pages' words, the words about each brand, the bay builder's products and the
   old links.
   Rules this content follows (Tripp, Nov 2026): no made-up facts, customers or claims; no response-time or
   support-speed promises; no prices anywhere on the site; training is something a shop asks for on its quote, never
   a promise; a brand is named only once Velocity has confirmed it, and never as an "authorized" or "official" dealer.
   Anything wrapped in ph() is a placeholder that still needs a real answer from the Velocity team: ph() registers it
   in PH so the preview's "What we need" list stays complete. */

export const PH = new Map();
export function ph(value, group, label) {
  const key = `${group}|${label}`;
  if (!PH.has(key)) PH.set(key, { group, label, value: String(value) });
  return { __ph: true, value: String(value), label };
}
// questions for the Velocity team that have no spot on the page yet (they show in the "What we need" list only)
const ask = (group, label, value = 'To confirm') => { ph(value, group, label); };

/* ---------- company ---------- */

export const SITE = {
  name: 'Velocity',
  descriptor: 'Equipment and supplies for collision shops',
  legal: ph('Velocity Equipment LLC', 'Contact & company', 'Legal company name'),
  phone: ph('(800) 555-0199', 'Contact & company', 'Sales phone number'),
  phoneHref: 'tel:+18005550199',
  email: ph('sales@velocity.example', 'Contact & company', 'Sales email address'),
  hq: ph('City, ST', 'Contact & company', 'Where Velocity is based (city, state)'),
};

ask('Contact & company', 'Phone hours, if any should be listed', 'Not shown');
ask('Products & catalog', 'Brands named on the site', 'Martech and Milwaukee. Others wait for your OK');
ask('Products & catalog', 'Milwaukee: what Velocity carries, and written dealer permission for its photos and descriptions');
ask('Products & catalog', 'Which catalog products Velocity stocks, and which ship to order');
ask('Products & catalog', 'US voltage versions of the 230 V and 400 V machines');
ask('Products & catalog', 'Paint, masking and tape lines: brands and part numbers to add');
ask('Products & catalog', 'Lines from Velocity’s other partners to add: product lists, part numbers and photos');
ask('Products & catalog', 'Calibration equipment supplier and lineup');
ask('Policies', 'Warranty terms by product line', 'Not shown');
ask('Policies', 'Returns, shipping and freight terms', 'Not shown');
ask('Training', 'Who trains, where, and what it costs', 'Not shown');
ask('Photos & story', 'Founder name, background and photo');
ask('Photos & story', 'Velocity logo pick (logo round 2)');

export const STORY = {
  founder: ph('[Founder name]', 'Photos & story', 'Founder name, background and photo'),
  origin: ph('Velocity started after SEMA 2026.', 'Photos & story', 'The founding story, in the founder’s words'),
};

/* ---------- brands: the site's words about each brand in the catalog data ---------- */

// ids match the brand list in assets/data/index.json (velocity-build/catalog/brands.json). Each brand's name is set in
// the site's own type: no logos, no artwork. line: one line for cards and menus. lede: the top of its page.
// facts: what the brand prints about itself, with where it says so. Nothing here claims a dealer status.
export const BRAND_COPY = {
  martech: {
    // its catalog prints metric units and European voltages: pages that list it carry the shop-power note
    euro: true,
    line: 'Frame benches, welders, spray booths, dust extraction, lifts and hand tools.',
    lede: 'Martech is a body shop equipment company from Albacete, Spain. Its line runs from frame benches, welders and spray booths to dust extraction, lifts and the hand tools around them.',
    // pages 3 to 5 of the Martech general catalog, in Martech's own figures
    facts: [
      ['In the bodywork market', 'Since 1987'],
      ['Main plant', 'Albacete, Spain: 11,900 m², with the exhibition center, logistics hub, training and customer service on site'],
      ['Quality system', 'Certified by AENOR, the Spanish standards and certification body'],
      ['Its own shops', 'Four body and paint shops, working 5,000 labor hours a month'],
    ],
    factsSource: 'From Martech’s general catalog. The figures are Martech’s own.',
  },
  milwaukee: {
    line: 'Ask for Milwaukee on your quote while its catalog is being added.',
    lede: 'Velocity carries Milwaukee. Its catalog isn’t on the site yet, so there are no part numbers, photos or specs to browse here.',
  },
};

/* ---------- departments: what the catalog index says around the book's data ---------- */

// shown on department tiles and pages next to the counts; ids match assets/data/index.json
export const DEPT_EXTRA = {};
// departments to lead the home page tiles with; empty = catalog order, which already runs the way a repair moves
// through the shop (frame and welding, dent and panel repair, sanding, paint, booths, then the shop around them)
export const HOME_DEPTS = [];
// department ids from earlier previews that were split or renamed in the Nov 13 re-sort: links to them still land
export const DEPT_ALIAS = { 'smart-repair': 'dent-repair', 'electric-tools': 'plastic-repair' };

// calibration is a department on this site with no products yet: the supplier is being chosen
export const CALIBRATION = {
  id: 'calibration',
  name: 'ADAS calibration equipment',
  short: 'Calibration',
  status: 'Supplier being chosen',
  blurb: 'Velocity will sell ADAS calibration equipment. The supplier is being chosen now, so there are no kits listed here yet.',
};

/* ---------- sourced industry numbers (Calibration page) ---------- */

export const SOURCES = {
  ccc: {
    name: 'CCC Intelligent Solutions',
    title: 'The Current State of Calibrations: A Turning Point for Collision Repair',
    date: 'Nov 2025',
    url: 'https://www.cccis.com/news-and-insights/posts/the-current-state-of-calibrations-a-turning-point-for-collision-repair',
  },
};
export const STATS = [
  { value: '23%', label: 'of repairable estimates included a calibration in 2025. In 2017 it was 0.9%.', src: 'ccc' },
  { value: '+3', unit: 'days', label: 'added to a DRP repair that needs one calibration. More than one adds 5.5 days.', src: 'ccc' },
  { value: '$500', label: 'is the average calibration bill per repairable vehicle, nearly double five years ago.', src: 'ccc' },
];

/* ---------- how buying works (home, catalog, quote) ---------- */

export const STEPS = [
  { t: 'Find it', b: 'Search a part number or a product, or open a department. Every listing carries its part numbers, specs and photos.' },
  { t: 'Build your list', b: 'Add what you need to your quote, with quantities. Send your own list too, paint, masking and tape included.' },
  { t: 'Get it priced', b: 'Velocity prices the list in writing and confirms the voltage and version for your shop before you order.' },
  { t: 'Ask about training', b: 'If your techs haven’t run a machine before, tick the training box on the quote and Velocity works it out with your shop.' },
];

/* ---------- FAQs ---------- */

export const FAQ = [
  { q: 'Do you repair cars?', a: 'No. Velocity sells equipment, tools and supplies to collision shops, and trains shops on equipment it sells. Your shop does the repairs.' },
  { q: 'Which brands do you sell?', a: 'Each brand has its own catalog on the site, split by department. Open Brands in the menu to see which catalogs are listed and which are being added. If you need a brand you don’t see, ask on your quote.' },
  { q: 'Why are there no prices on the site?', a: 'Prices depend on what you order, how many, and where it ships. Add part numbers to your quote and send it, and Velocity sends back a written price.' },
  { q: 'The specs say 230 V or 400 V. Will it run in my shop?', a: 'Specs on this site are shown the way the factory prints them: metric units, and European voltages for most machines. Tell us your shop’s power on the quote so the right version gets quoted.' },
  { q: 'Can I order something that isn’t on the site?', a: 'Ask. Velocity carries paint, masking, tape and shop supplies, and more lines that aren’t listed here yet. Put the items in the notes of your quote, or send your list.' },
  { q: 'Do you train on the equipment?', a: 'Velocity trains shops on equipment it sells. Tick the training box on your quote, tell us what you’re buying and who needs to learn it, and we work it out with your shop.' },
  { q: 'Do you sell calibration equipment?', a: 'It’s coming. Velocity is choosing the supplier now. Leave your details on the Calibration page and we’ll let you know when the lineup is set.' },
  { q: 'What warranty comes with it?', a: 'It depends on the product. Ask on your quote and the terms come back with the price.' },
];

/* ---------- training (the page states only what Velocity has confirmed: it trains on what it sells, when needed) ---------- */

export const TRAINING = {
  examples: [
    ['welding', 'Spot welders and MIG welders'],
    ['dent-repair', 'Dent pullers, steel and aluminum'],
    ['benches', 'Frame benches and measuring'],
    ['paint', 'Spray guns and gun washers'],
    ['plastic-repair', 'Plastic welders and repair tools'],
    ['dent-repair', 'PDR and glue pulling'],
  ],
};

/* ---------- products the pages pick out (velocity-build/catalog/pack.py packs their photos from these lists) ---------- */

// home: one product from each corner of the catalog, big equipment to small tools
export const FEATURED = ['F001', 'F009', 'F050', 'F086', 'F023', 'F265', 'F128', 'F368'];
// calibration: products in the catalog today that sit next to calibration work in a shop (alignment and aim come first)
export const CAL_NEAR = ['F095', 'F094', 'F030', 'F103'];

/* ---------- Build your bay: catalog products with a 3D model (from the intro film, built from the book's photos) ---------- */

// model: the 3D model id in catalog-models.js; code: the part number it is; qty: units per placed model (a pair of sanders is 2)
// zone: the camera that frames it; max: how many fit on the bay floor; needs: a model it sits on
export const BAY_ITEMS = [
  { model: 'mt-spotter', code: 'SP202002', zone: 'dent', max: 1 },
  { model: 'mt-arcpuller', code: 'SP202224', zone: 'dent', max: 1 },
  { model: 'mt-koriolis', code: 'SP400903', zone: 'masking', max: 1 },
  { model: 'mt-sanders', code: 'SP767031', zone: 'masking', max: 1, qty: 2, needs: 'mt-koriolis', note: 'A pair, on the vacuum’s tray' },
  { model: 'mt-masking', code: 'SP766201', zone: 'masking', max: 1 },
  { model: 'mt-evo7', code: 'SP701006', zone: 'carts', max: 4 },
  { model: 'mt-parts', code: 'SP780104', zone: 'racks', max: 3 },
  { model: 'mt-bumper', code: 'SP780431', zone: 'racks', max: 2 },
  { model: 'mt-panel', code: 'SP780403', zone: 'racks', max: 2 },
];
export const BAY_GROUPS = [
  ['dent', 'Dent pulling'],
  ['masking', 'Prep and sanding'],
  ['carts', 'Tool trolleys'],
  ['racks', 'Racks, carts and stands'],
];
export const PRESETS = [
  { id: 'body', name: 'Body bay', note: 'Steel and aluminum dent pulling, two tool trolleys, a panel stand and a parts cart.', items: { 'mt-spotter': 1, 'mt-arcpuller': 1, 'mt-evo7': 2, 'mt-panel': 1, 'mt-parts': 1 } },
  { id: 'prep', name: 'Prep bay', note: 'Masking paper trolley, dust-free sanding on the vacuum, a trolley and a panel stand.', items: { 'mt-masking': 1, 'mt-koriolis': 1, 'mt-sanders': 1, 'mt-evo7': 1, 'mt-panel': 1 } },
  { id: 'storage', name: 'Parts and storage', note: 'Parts carts, bumper racks and panel stands along the back wall.', items: { 'mt-parts': 3, 'mt-bumper': 2, 'mt-panel': 2 } },
  { id: 'full', name: 'Full bay', note: 'Every piece in the builder, on one floor.', items: { 'mt-spotter': 1, 'mt-arcpuller': 1, 'mt-koriolis': 1, 'mt-sanders': 1, 'mt-masking': 1, 'mt-evo7': 3, 'mt-parts': 2, 'mt-bumper': 1, 'mt-panel': 1 } },
];

/* ---------- old links ---------- */

// links from earlier previews land on the closest page today. p-f009 opens that product family.
export const LEGACY = {
  adas: 'calibration', equipment: 'catalog', 'equipment-adas': 'calibration', 'equipment-dent': 'd-dent-repair', 'equipment-prep': 'd-paint',
  'equipment-masking': 'd-paint', 'equipment-carts': 'd-tool-storage', 'equipment-racks': 'd-storage', 'equipment-consumables': 'p-f015',
  'cal-1': 'calibration', 'cal-2': 'calibration', 'cal-x': 'calibration', 'cart-c': 'calibration',
  'pull-s': 'p-f009', 'pull-sp': 'p-f009', 'pull-a': 'p-f017', 'prep-2': 'p-f355', 'prep-4': 'p-f355', 'prep-6': 'p-f357',
  'cart-t': 'p-f128', 'rack-b8': 'p-f368', 'rack-ps': 'p-f366', 'rack-p6': 'p-f375',
  'vx-cal-pro': 'calibration', 'vx-cal-mobile': 'calibration', 'vx-cal-targets': 'calibration', 'vx-cal-radar': 'calibration', 'vx-cart-cal': 'calibration',
  'vx-pull-s1': 'p-f009', 'vx-pull-s2': 'p-f009', 'vx-pull-al': 'p-f017', 'vx-mask-3': 'p-f355', 'vx-mask-5': 'p-f357',
  'vx-cart-5': 'p-f128', 'vx-cart-7': 'p-f128', 'vx-rack-ro': 'p-f366', 'vx-rack-panel': 'p-f375', 'vx-rack-bumper': 'p-f368', 'vx-rack-door': 'p-f378',
  'vx-studs': 'p-f015', 'vx-electrodes': 'p-f015', 'vx-paper': 'd-paint', 'vx-tape': 'd-paint',
  dealers: 'about', partners: 'about',
};

/* ---------- the to-confirm groups, in display order ---------- */
export const PH_GROUPS = ['Contact & company', 'Products & catalog', 'Policies', 'Training', 'Photos & story'];
