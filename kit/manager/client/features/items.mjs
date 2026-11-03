// Every Part, Component and Section except Button, built in Builder the way Button is: its type cards and every
// variant drawn with the white-label components in this system's tokens, and build controls (colors, corners,
// spacing, type) that choose tokens. Choices save on their own through the same store as the MCP tools.
// Nothing here checks states the way the docs site does; the drawings are inert.
import { openDialog, closeDialog } from '../ui-motion.mjs';

const words = { xs: 'Extra small', '2xs': '2× small', sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large', '2xl': '2× large', rest: 'Normal', hover: 'Hover', pressed: 'Pressed', focus: 'Focused', disabled: 'Disabled', loading: 'Loading', true: 'On', false: 'Off' };
const say = v => words[v] || String(v).replaceAll('-', ' ').replace(/^./, c => c.toUpperCase());
const slotWords = { fill: 'Background', border: 'Outline', text: 'Text color', icon: 'Icon color', effect: 'Shadow', gap: 'Gap', radius: 'Corners', label: 'Text style', height: 'Height', width: 'Width' };
// A slot is named by what it does: a text slot holding a color is the text color, holding a style the text style.
const slotSay = (slot, kind) => kind === 'color' && ['text', 'label'].includes(slot) ? 'Text color' : kind === 'text' && ['text', 'label'].includes(slot) ? 'Text style'
  : kind === 'number' && slot === 'icon' ? 'Icon size' : kind === 'color' && slot === 'icon' ? 'Icon color' : slotWords[slot] || say(slot);
const cssName = name => '--' + name.replaceAll('/', '-').replaceAll('.', '_');
const isFlag = p => p.values?.every(v => v === 'true' || v === 'false');
// Which saved choice a control changes: a map row, a measure size, or one of the Part's own tokens.
const view = { id: null, selected: null, edits: { map: {}, measures: {}, tokens: {} } };
const fresh = () => ({ map: {}, measures: {}, tokens: {} });
let lib = null, uid = 0;
// A token from another prepared Part (Social button uses Button's padding): its owner and the value it ends on.
let allParts = [];
const ownerOf = name => allParts.find(p => p.draft?.tokens?.some(t => t.name === name));
const foreignValue = (options, name) => { const t = ownerOf(name)?.draft.tokens.find(x => x.name === name), v = t?.values?.Value; return v?.alias ? [...options.color, ...options.number].find(o => o.name === v.alias)?.value ?? null : v ?? null; };

const setsOf = d => d.sets || [{ name: d.set || d.name, properties: d.properties || [], private: false }];
const variantProps = set => (set.properties || []).filter(p => p.type === 'variant');
// The variant a card starts on: the set's defaults, with a panel drawn open (Menu Open=true) so its items show.
const defaultsOf = set => Object.fromEntries(variantProps(set).map(p => [p.name, p.name === 'Open' && p.values.includes('true') ? 'true' : p.default ?? p.values[0]]));
// A token map row matches a variant when every property the row names has the variant's value.
const matches = (key, combo) => key === '*' || key.split('|').every(pair => { const [k, v] = pair.split('='); return k in combo ? combo[k] === v : true; });
const rowFor = (rows, combo) => Object.keys(rows || {}).find(key => key !== '*' && matches(key, combo)) || (rows?.['*'] ? '*' : null);
// The type cards: one per look (Type, Emphasis, Provider …); Tone groups them, like Button's Brand and Danger rows.
function axesOf(set) {
  const looks = variantProps(set).filter(p => !['Size', 'State'].includes(p.name) && !isFlag(p));
  const tone = looks.find(p => p.name === 'Tone'), card = looks.find(p => p !== tone) || null;
  return { tone, card };
}
const optionFor = (options, name) => name ? [...options.color, ...options.number, ...options.text, ...options.effect, ...(options.paint || [])].find(o => o.name === name) : null;
const kindIn = (options, name) => !name ? null : options.color.some(o => o.name === name) ? 'color' : options.number.some(o => o.name === name) ? 'number' : options.text.some(o => o.name === name) ? 'text' : options.effect.some(o => o.name === name) ? 'effect' : (options.paint || []).some(o => o.name === name) ? 'paint' : null;
// A map's fill and background slots take a color or a gradient; the control is a color control either way.
const paintSlots = ['fill', 'background'];
const isGradient = value => /gradient\(/.test(String(value ?? ''));
const ownAlias = (d, name) => name in view.edits.tokens ? view.edits.tokens[name] : d.tokens.find(t => t.name === name)?.values?.Value?.alias ?? null;
// A Part's own token can hold the spec's value instead of pointing at a role (icon-button/size/md = 36).
const specValue = (d, name) => { const v = d.tokens.find(t => t.name === name)?.values?.Value; return v === undefined || v?.alias ? null : v && typeof v === 'object' && 'r' in v ? `rgba(${[v.r, v.g, v.b].map(n => Math.round(n * 255)).join(', ')}, ${v.a ?? 1})` : v; };
const ownKind = (d, name) => d.tokens.find(t => t.name === name)?.type === 'COLOR' ? 'color' : 'number';
const isOwn = (d, name) => d.tokens.some(t => t.name === name);
const mapValue = (d, set, key, slot) => view.edits.map[set]?.[key]?.[slot] !== undefined ? view.edits.map[set][key][slot] : d.map?.[set]?.[key]?.[slot] ?? null;
const measureValue = (d, set, size, slot) => view.edits.measures[set]?.[size]?.[slot] !== undefined ? view.edits.measures[set][size][slot] : d.measures?.[set]?.[size]?.[slot] ?? null;
// The token a slot ends on: a Part's own token shows the role it points at.
const finalName = (d, name) => isOwn(d, name) ? ownAlias(d, name) : name;
const shown = (kind, value) => value === null || value === undefined ? '' : kind === 'text' ? `${value.fontSize}px` : typeof value === 'number' ? `${value}px` : kind === 'effect' ? '' : isGradient(value) ? 'Gradient' : String(value);

function selection(part) {
  if (view.id !== part.id) { view.id = part.id; view.selected = null; view.edits = fresh(); }
  return view.selected;
}

// One drawing: the set, the variant, and where the drawing sits. Props are filled in at draw time.
const stage = (part, set, combo, label) => `<div class="ds-stage item-stage" inert data-item-draw="${encodeURIComponent(JSON.stringify({ id: part.id, page: part.page, set, combo }))}" role="img" aria-label="${label}"></div>`;

function choicesSection(d, escape) {
  // Fallback notes read "wanted → fallback"; the others name text that fails contrast on a gradient stop.
  const notes = (d.notes || []).filter(n => n.includes(' → ')), contrast = (d.notes || []).filter(n => !n.includes(' → ')), semibold = notes.filter(n => /\/semibold → /.test(n)), other = notes.filter(n => !semibold.includes(n));
  const weights = [...new Set(semibold.map(n => n.split(' → ')[1].split('/').at(-1)))];
  const items = [
    ...d.decisions.map(x => `<li><strong>${escape(x.key)}:</strong> ${escape(x.value)}<small>${escape(x.reason || '')}</small></li>`),
    ...(semibold.length ? [`<li><strong>Semi-bold text uses ${escape(weights.map(say).join(' and ').toLowerCase())}.</strong><small>The guide asks for semi-bold in ${semibold.length} place${semibold.length > 1 ? 's' : ''}, but your text styles have no semi-bold, so the closest weight is used.</small></li>`] : []),
    ...(other.length ? [`<li><strong>Some roles fall back to the nearest one.</strong><small>Your foundations have no ${escape([...new Set(other.map(n => n.split(' → ')[0].replace(/^color\//, '').replace(/^type\//, '')))].join(', '))}, so the closest role is used instead.</small></li>`] : []),
    ...(contrast.length ? [`<li><strong>Text has too little contrast against these gradient stops.</strong>${contrast.map(n => `<small>${escape(n)}</small>`).join('')}</li>`] : []),
  ];
  return `<section class="section" aria-labelledby="item-decisions"><div class="section-heading"><h2 id="item-decisions">Choices we made for you</h2><small>Version ${d.revision} · ${d.variantCount} variations</small></div>
    ${items.length ? `<ul class="part-decisions">${items.join('')}</ul>` : '<p class="setup-note">Your foundations had every role this needs, so nothing needed a choice.</p>'}</section>`;
}

// The cards for one set: grouped by tone when it has tones, one card per look; each card draws the variant
// you build when you select it.
function typeCards(part, set, escape, previewCard, intro) {
  const { tone, card } = axesOf(set), base = defaultsOf(set), sel = view.selected;
  const groups = tone ? tone.values : [null], looks = card ? card.values : [null];
  const one = (t, look) => {
    const combo = { ...base, ...(tone ? { Tone: t } : {}), ...(card ? { [card.name]: look } : {}) };
    const chosen = sel && sel.set === set.name && Object.entries(combo).every(([k, v]) => k === 'Size' || k === 'State' || sel.combo[k] === v);
    const shownCombo = chosen ? sel.combo : combo, title = card ? say(look) : set.name;
    return previewCard(`<span>${escape(title)}</span>`, stage(part, set.name, shownCombo, escape(`${set.name} ${Object.values(shownCombo).join(' ')}`)),
      { interactive: true, className: `part-type-card item-card${chosen ? ' is-selected' : ''}`, stageClass: 'part-type-stage', attributes: `data-item-card="${escape(JSON.stringify({ set: set.name, combo: shownCombo }))}" aria-pressed="${!!chosen}" aria-label="Select ${escape(title)}"`,
        caption: `<span class="specimen-caption">${escape(['Size', 'State'].filter(k => k in shownCombo).map(k => say(shownCombo[k])).join(' · '))}</span>` });
  };
  return `${intro}${groups.map(t => `${t ? `<h3 class="part-subheading">${escape(say(t))}</h3>` : ''}<div class="part-type-grid${part.level === 'sections' ? ' item-grid-wide' : ''}">${looks.map(look => one(t, look)).join('')}</div>`).join('')}`;
}

// Every variant of a set, like Button's matrix: rows are its looks and sizes, columns its states.
function matrix(part, set, escape) {
  const props = variantProps(set), size = props.find(p => p.name === 'Size'), state = props.find(p => p.name === 'State');
  const { tone, card } = axesOf(set), base = defaultsOf(set), sel = view.selected;
  const groups = tone ? tone.values : [null], looks = card ? card.values : [null], sizes = size ? size.values : [null], states = state ? state.values : [null];
  const cell = combo => {
    const chosen = sel && sel.set === set.name && Object.entries(combo).every(([k, v]) => sel.combo[k] === v);
    return `<button type="button" class="part-cell item-cell${chosen ? ' is-selected' : ''}" role="cell" data-item-card="${escape(JSON.stringify({ set: set.name, combo }))}" aria-pressed="${!!chosen}" aria-label="${escape(Object.values(combo).join(' '))}">${stage(part, set.name, combo, escape(Object.values(combo).join(' ')))}</button>`;
  };
  return groups.map(t => `${t ? `<h3 class="part-subheading">${escape(say(t))}</h3>` : ''}<div class="part-matrix item-matrix" role="table" aria-label="${escape(`${set.name}${t ? ' ' + t : ''}`)}">
      <div class="part-matrix-row part-matrix-head" role="row"><span role="columnheader"></span>${states.map(s => `<span role="columnheader">${escape(s ? say(s) : set.name)}</span>`).join('')}</div>
      ${looks.flatMap(look => sizes.map(z => `<div class="part-matrix-row" role="row"><span role="rowheader">${escape([look && say(look), z && say(z)].filter(Boolean).join(' · ') || set.name)}</span>${states.map(s => cell({ ...base, ...(tone ? { Tone: t } : {}), ...(card ? { [card.name]: look } : {}), ...(z ? { Size: z } : {}), ...(s ? { State: s } : {}) })).join('')}</div>`)).join('')}</div>`).join('');
}

export function itemPage(part, { escape, badge, documentFrame, previewCard, partStatus }) {
  const d = part.draft;
  selection(part);
  const sets = setsOf(d), shownSets = sets.filter(s => !s.private && (!lib || lib.has(part.page, s.name)));
  const [main, ...rest] = shownSets.length ? shownSets : sets.filter(s => !s.private);
  const body = `
    <section class="section" aria-labelledby="item-types">${typeCards(part, main, escape, previewCard, `<div class="section-intro"><h2 id="item-types">${escape(part.name)} types</h2><p>Click a card to build that ${escape(part.name.toLowerCase())}: its colors, corners, spacing and text, in your tokens.</p></div>`)}</section>
    ${choicesSection(d, escape)}
    ${rest.map((s, i) => `<section class="section" aria-labelledby="item-set-${i}">${typeCards(part, s, escape, previewCard, `<div class="section-heading"><h2 id="item-set-${i}">${escape(s.name)}</h2><small>${s.variantCount} variations</small></div>`)}</section>`).join('')}
    ${[main, ...rest].map((s, i) => `<section class="section" aria-labelledby="item-all-${i}"><div class="section-heading"><h2 id="item-all-${i}">All ${escape(s.name.toLowerCase())} variants</h2></div>${matrix(part, s, escape)}</section>`).join('')}`;
  return documentFrame(`${part.page} ${part.name}`, part.description, body, partStatus(part, badge))
    .replace('<article class="docs-reading-card"', `<article tabindex="0" data-item-wrapper aria-label="${escape(part.name)} page" class="docs-reading-card part-page${view.selected ? '' : ' is-selected'}"`);
}

// The right-hand panel: Button's build controls, for whichever variant is selected on the page.
export function itemInspector(part, { escape, options, statusLabel, parts = [] }) {
  allParts = parts;
  const d = part.draft, sel = selection(part), sets = setsOf(d);
  const chip = (kind, value) => kind === 'color' ? `<span class="token-chip" style="background:${escape(value || 'transparent')}" aria-hidden="true"></span>`
    : kind === 'effect' ? `<span class="token-chip part-chip-effect" style="box-shadow:${escape(value || 'none')}" aria-hidden="true"></span>` : `<span class="token-chip part-chip-text" aria-hidden="true">${kind === 'text' ? 'Aa' : '↔'}</span>`;
  const short = name => name ? name.replace(/^color\//, '').replace(/^type\//, '') : 'None';
  // A slot's kind comes from the slot, from what it holds in any variant of its set, so an empty slot (a variant
  // without a shadow) still opens the right picker.
  const tokenKind = name => !name ? null : isOwn(d, name) ? (ownAlias(d, name) ? kindIn(options, ownAlias(d, name)) : ownKind(d, name)) : kindIn(options, name);
  const slotInfo = (area, set, slot) => {
    const values = Object.values(d[area]?.[set] || {}).map(r => r?.[slot]);
    const kind = values.map(v => typeof v === 'string' ? tokenKind(v) : null).find(Boolean) || (slot === 'effect' ? 'effect' : 'number');
    return { kind: kind === 'paint' ? 'color' : kind, optional: values.some(v => v === null), paints: area === 'map' && paintSlots.includes(slot) && ['color', 'paint'].includes(kind) && !d.solidSlots?.[set]?.[slot] };
  };
  // One build control: a slot of a map row or of a measure size. A Part's own token behind the slot changes the
  // role it points at, or keeps the spec's value.
  const control = (area, set, key, slot, prefix = '') => {
    const current = area === 'map' ? mapValue(d, set, key, slot) : measureValue(d, set, key, slot), { kind, optional, paints } = slotInfo(area, set, slot);
    const own = isOwn(d, current), name = finalName(d, current), raw = !name && own ? specValue(d, current) : null;
    return { kind, name, value: raw ?? optionFor(options, name)?.value ?? (name && !own ? foreignValue(options, name) : undefined), label: prefix + slotSay(slot, kind), spec: raw === null ? '' : kind === 'color' ? String(raw) : raw + 'px', optional: optional && !own,
      attrs: own ? `data-item-token="${escape(current)}"` : `data-item-area="${area}" data-item-set="${escape(set)}" data-item-key="${escape(key)}" data-item-slot="${escape(slot)}"${paints ? ' data-item-paints="true"' : ''}` };
  };
  const pickAttrs = c => `data-item-pick="${c.kind}" data-label="${escape(c.label)}" data-current="${escape(c.name || '')}" ${c.spec ? `data-item-spec="${escape(c.spec)}"` : ''} ${c.optional ? 'data-optional="true"' : ''} ${c.attrs} aria-haspopup="dialog"`;
  const binding = c => `<div class="token-control part-binding"><label><span>${escape(c.label)}</span>${shown(c.kind, c.value) ? `<small class="custom-value-label">${escape(shown(c.kind, c.value))}</small>` : ''}</label><button type="button" class="token-input token-binding" ${pickAttrs(c)} aria-label="Choose a token for ${escape(c.label)}" title="${escape(c.name || c.spec || 'None')}">${chip(c.kind, c.value)}<span>${escape(c.spec ? c.spec + ' · from the spec' : short(c.name))}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>`;
  // Spacing reads like the part itself: each side where it applies (padding-x on both sides, padding-y top and bottom).
  const sideOf = { top: ['padding-top', 'padding-y', 'padding'], right: ['padding-right', 'padding-x', 'padding'], bottom: ['padding-bottom', 'padding-y', 'padding'], left: ['padding-left', 'padding-x', 'padding'] };
  const spacing = (set, size, slots, prefix) => {
    const pad = slots.filter(x => Object.values(sideOf).flat().includes(x));
    if (!pad.length) return { html: '', used: [] };
    const side = s => { const slot = sideOf[s].find(x => pad.includes(x)); if (!slot) return `<span class="part-side part-side-${s}" aria-hidden="true"></span>`;
      const c = control('measures', set, size, slot, prefix); c.label = `${c.label} (${s})`;
      return `<button type="button" class="part-side part-side-${s}" ${pickAttrs(c)} aria-label="Spacing ${s}: ${escape(c.name || c.spec)}" title="${escape(c.name || c.spec)}"><span>${escape(c.name ? c.name.replace(/^space\//, '') : 'spec')}</span><small>${escape(c.value ?? 0)}px</small></button>`; };
    return { html: `<div class="part-spacing-control"><span class="part-spacing-title">${escape(prefix ? prefix + 'inner spacing' : 'Inner spacing')}</span><div class="part-spacing">${side('top')}${side('left')}<span class="part-spacing-label" aria-hidden="true">${escape(set)}</span>${side('right')}${side('bottom')}</div></div>`, used: pad };
  };
  // A measure size of one set: its spacing box, then every other slot.
  const measureBlock = (set, size, prefix) => { const slots = Object.keys(d.measures?.[set]?.[size] || {}), box = spacing(set, size, slots, prefix);
    return box.html + slots.filter(slot => !box.used.includes(slot)).map(slot => binding(control('measures', set, size, slot, prefix))).join(''); };
  const reset = `<div class="workspace-reset"><button type="button" class="button" data-item-reset>Reset</button><small>Puts every color and size back to the choices we made for you.</small><p class="workspace-help part-save-status" data-item-save-status role="status"></p></div>`;
  // Every size shares the '*' measures: the corners, spacing and type that apply to the whole Part.
  const shared = sets.filter(s => d.measures?.[s.name]?.['*']).map(s => measureBlock(s.name, '*', sets.length > 1 ? s.name + ' · ' : '')).filter(Boolean);
  const global = shared.length ? `<section class="inspector-section"><h3>Global Appearance</h3><p class="workspace-help">Applies to every size and type.</p>${shared.join('')}</section>` : '';
  if (!sel) return `<div class="workspace-panel-header"><h2>${escape(part.name)}</h2><span class="label-beta">Overview</span></div><p class="workspace-disclaimer">Every choice is kept as soon as you make it.</p>
    <section class="inspector-section"><h3>Summary</h3><dl><div class="property"><dt>Status</dt><dd>${escape(statusLabel(part.status))}</dd></div>${sets.filter(s => !s.private).map(s => `<div class="property"><dt>${escape(s.name)}</dt><dd>${s.variantCount} variations</dd></div>`).join('')}</dl>
      <p class="workspace-help">Click a type or a variation on the page to build its colors, corners, spacing and text.</p></section>${global}${reset}`;
  const set = sets.find(s => s.name === sel.set), combo = sel.combo;
  // The parts inside follow the selected variant wherever they share a property (Badge close: Type, Tone, State).
  const rows = [set, ...sets.filter(s => s !== set && s.private)].map(s => ({ s, key: rowFor(d.map?.[s.name], combo), prefix: s === set ? '' : s.name + ' · ' })).filter(x => x.key);
  const mapControls = rows.flatMap(({ s, key, prefix }) => Object.keys(d.map[s.name][key]).map(slot => control('map', s.name, key, slot, prefix)));
  const colors = mapControls.filter(c => c.kind === 'color' || c.kind === 'effect'), others = mapControls.filter(c => c.kind === 'number' || c.kind === 'text');
  // Sizes for the selected set and the parts inside it that share its Size (Button group item, Text field addon).
  const sizeBlocks = [set, ...sets.filter(s => s !== set && s.private)].filter(s => combo.Size && d.measures?.[s.name]?.[combo.Size]).map(s => measureBlock(s.name, combo.Size, s === set ? '' : s.name + ' · ')).filter(Boolean);
  const label = variantProps(set).filter(p => !isFlag(p) || combo[p.name] === 'true').map(p => isFlag(p) ? p.name : say(combo[p.name])).join(' · ');
  return `<div class="workspace-panel-header"><h2>${escape(set.name)}</h2><span class="label-beta">${escape(label)}</span></div><p class="workspace-disclaimer">Every choice is kept as soon as you make it.</p>
    ${colors.length ? `<section class="inspector-section"><h3>Colors</h3><p class="workspace-help">For this ${escape(set.name.toLowerCase())}${combo.State ? `, ${escape(say(combo.State).toLowerCase())}` : ''}. Each state has its own colors: pick another state in the variants on the page.</p>${colors.map(binding).join('')}</section>` : ''}
    ${sizeBlocks.length || others.length ? `<section class="inspector-section"><h3>Size</h3>${combo.Size ? `<p class="workspace-help">For every ${escape(say(combo.Size).toLowerCase())} ${escape(set.name.toLowerCase())}.</p>` : ''}${sizeBlocks.join('')}${others.map(binding).join('')}</section>` : ''}
    ${global}${reset}`;
}

// The drawing props a variant passes to its white-label component: Figma property names become the
// component's props through the docs sample's controls ("Icon only" → iconOnly), flags become booleans.
function propsFor(page, combo) {
  const controls = lib.controls(page), out = {};
  for (const [name, value] of Object.entries(combo)) {
    const control = controls.find(c => c.figma === name);
    const prop = control?.name || name.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).map((w, i) => i ? w[0].toUpperCase() + w.slice(1) : w.toLowerCase()).join('');
    // A select passes its own option ("GitHub" is the github option); anything else reads as a flag or a number.
    const flat = v => String(v).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (control?.options) out[prop] = control.options.find(o => o === value) ?? control.options.find(o => flat(o) === flat(value)) ?? value;
    else out[prop] = value === 'true' ? true : value === 'false' ? false : /^\d+$/.test(value) ? Number(value) : value;
  }
  // A Part with a panel (Menu, Select) is drawn open, so its items can be built.
  if (controls.some(c => c.name === 'open' && c.type === 'boolean') && !('open' in out)) out.open = true;
  // A state is drawn, never interacted with: the white-label components force it the same way the docs do.
  if ('state' in out) {
    const state = out.state; delete out.state;
    if (['hover', 'pressed', 'focus'].includes(state)) out.forceState = state;
    else if (state === 'disabled' || state === 'loading') out[state] = true;
  }
  return out;
}

// What a drawing changes from the compiler's picks: each chosen token takes the place of the default one.
function remaps(part, set, combo, options) {
  const d = part.draft, def = d.defaults || {}, vars = [], rules = [], roots = [], paints = [];
  // background, not background-color, so a gradient paints too.
  const rootProps = { fill: 'background', background: 'background', border: 'border-color', text: 'color', label: 'color', effect: 'box-shadow' };
  let slot = null;
  const swap = (from, to) => {
    if (from === to || to === undefined) return;
    // The sample draws nothing for a slot this variant leaves empty; a token chosen for it paints the drawing's root.
    if (!from) { if (to && rootProps[slot]) roots.push([rootProps[slot], kindIn(options, to) === 'effect' ? `var(${cssName(to)})` : `var(${cssName(to)})`]); return; }
    // A slot cleared to None draws without it: no shadow, no fill.
    if (to === null) { vars.push([cssName(from), kindIn(options, from) === 'effect' ? 'none' : 'transparent']); return; }
    if (kindIn(options, to) === 'text') { const t = optionFor(options, to)?.value; if (t) rules.push([from.replaceAll('/', '-'), t]); return; }
    // A gradient cannot sit in a color variable: the elements that drew the replaced color paint the gradient.
    if (kindIn(options, to) === 'paint') { paints.push([from, to]); return; }
    vars.push([cssName(from), `var(${cssName(to)})`]);
  };
  for (const s of setsOf(d)) {
    const k = rowFor(d.map?.[s.name], combo);
    if (k) for (slot of Object.keys(d.map[s.name][k])) if (s.name === set) swap(def.map?.[s.name]?.[k]?.[slot], mapValue(d, s.name, k, slot)); else if (def.map?.[s.name]?.[k]?.[slot]) swap(def.map[s.name][k][slot], mapValue(d, s.name, k, slot));
    for (const size of ['*', combo.Size].filter(Boolean)) for (slot of Object.keys(d.measures?.[s.name]?.[size] || {})) {
      const was = def.measures?.[s.name]?.[size]?.[slot], now = measureValue(d, s.name, size, slot);
      if (!isOwn(d, now)) swap(was, now);
    }
  }
  // A Part's own token keeps its name everywhere; only the role it points at moves.
  for (const t of d.tokens) { const now = ownAlias(d, t.name), was = def.tokens?.[t.name]; if (now && now !== was) vars.push([cssName(t.name), `var(${cssName(now)})`]); }
  return { vars, rules, roots, paints };
}
// The elements a color fills: its background utility (bg-fill-brand-subtle), alone or behind a forced state.
const fillSelector = (uid, name) => { const cls = 'bg-' + name.replace(/^color\//, '').replaceAll('/', '-');
  return [`.${CSS.escape(cls)}`, `[class$=":${cls}"]`, `[class*=":${cls} "]`].map(x => `[data-item-uid="${uid}"] ${x}`).join(','); };

const weightOf = style => ({ thin: 100, light: 300, regular: 400, medium: 500, semibold: 600, bold: 700, black: 900 }[String(style || '').toLowerCase().replace(/\s|-/g, '')] || 400);
// Draws every [data-item-draw] on the page once Builder has rendered it as HTML.
export async function drawItems(state) {
  const els = [...document.querySelectorAll('[data-item-draw]')];
  const link = document.getElementById('stage-css'), version = JSON.stringify([state.source?.revision, ...(state.parts || []).map(p => p.revision)]);
  if (link && link.dataset.version !== version) { link.dataset.version = version; link.href = `/api/stage.css?v=${encodeURIComponent(version)}`; }
  if (!els.length) { lib?.sweep(); return; }
  lib ||= await import('/client/items/items.js');
  lib.sweep();
  const options = state.partOptions;
  for (const el of els) {
    const { id, page, set, combo } = JSON.parse(decodeURIComponent(el.dataset.itemDraw)), part = state.parts.find(p => p.id === id);
    if (!part?.draft || !lib.has(page, set)) { el.textContent = ''; continue; }
    const { vars, rules, roots, paints } = remaps(part, set, combo, options);
    for (const [name, value] of vars) el.style.setProperty(name, value);
    el.dataset.itemUid ||= `i${++uid}`;
    if (rules.length || roots.length || paints.length) {
      const style = document.createElement('style');
      style.textContent = paints.map(([from, to]) => `${fillSelector(el.dataset.itemUid, from)}{background-image:var(${cssName(to)});}`).join('') + roots.map(([prop, value]) => `[data-item-uid="${el.dataset.itemUid}"] > :first-child{${prop}:${value}!important;}`).join('') + rules.map(([cls, t]) => `[data-item-uid="${el.dataset.itemUid}"] .${CSS.escape(cls)}{font-family:"${String(t.fontFamily).replace(/"/g, '')}",system-ui,sans-serif;font-size:${Number(t.fontSize)}px;line-height:${t.lineHeight ? Number(t.lineHeight) + 'px' : 'normal'};font-weight:${weightOf(t.fontStyle)};}`).join('');
      el.before(style);
    }
    try { lib.render(el, { page, set, props: propsFor(page, combo) }); } catch (error) { el.textContent = ''; console.warn(`${set} could not be drawn`, combo, error); }
  }
}

// One picker for every binding, built like Button's and the foundation primitive picker.
function pickerDialog() {
  let dialog = document.getElementById('item-token-picker');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'item-token-picker'; dialog.className = 'primitive-picker'; dialog.setAttribute('aria-labelledby', 'item-token-picker-title');
  dialog.innerHTML = `<div class="primitive-picker-header"><h2 id="item-token-picker-title">Choose token</h2><button type="button" class="icon-button" data-item-picker-close aria-label="Close token picker"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <p data-item-picker-role></p><label class="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" data-item-picker-search aria-label="Search tokens" placeholder="Search tokens..."/></label>
    <div class="primitive-picker-options" role="listbox" aria-label="Tokens" data-item-picker-options></div><div class="primitive-picker-count" role="status" data-item-picker-count></div>`;
  document.body.append(dialog);
  return dialog;
}

export function setupItems({ getState, refresh, render }) {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const currentPart = () => (getState()?.parts || []).find(p => location.hash === '#part-' + p.id && p.draft && !p.draft.preview);
  let target = null;
  // The picker offers roles of the slot's kind; spacing slots start with the space scale, sizes with sizes.
  function choices(kind, current, paints = false) {
    const all = [...(getState().partOptions[kind] || []), ...(paints ? getState().partOptions.paint || [] : [])], family = current?.split('/')[0];
    return kind === 'number' && family ? [...all.filter(o => o.name.startsWith(family + '/')), ...all.filter(o => !o.name.startsWith(family + '/'))] : all;
  }
  function renderOptions() {
    const dialog = pickerDialog(); if (!target) return;
    const term = dialog.querySelector('[data-item-picker-search]').value.trim().toLowerCase(), all = choices(target.kind, target.current, target.paints);
    const matches = all.filter(o => o.name.toLowerCase().includes(term));
    const chipFor = o => target.kind === 'color' ? `<span class="token-chip" style="background:${esc(o.value)}" aria-hidden="true"></span>` : target.kind === 'effect' ? `<span class="token-chip part-chip-effect" style="box-shadow:${esc(o.value)}" aria-hidden="true"></span>` : `<span class="token-chip part-chip-text" aria-hidden="true">${target.kind === 'text' ? 'Aa' : '↔'}</span>`;
    const detail = o => target.kind === 'text' ? `${o.value?.fontSize}px` : typeof o.value === 'number' ? `${o.value}px` : target.kind === 'color' ? (isGradient(o.value) ? 'Gradient' : o.value) : '';
    const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
    const from = ownerOf(target.current), foreign = target.current && from && !all.some(o => o.name === target.current) ? `<button type="button" role="option" aria-selected="true" data-item-option="${esc(target.current)}">${target.kind === 'color' ? `<span class="token-chip" style="background:${esc(foreignValue(getState().partOptions, target.current))}" aria-hidden="true"></span>` : '<span class="token-chip part-chip-text" aria-hidden="true">↔</span>'}<span>${esc(target.current)} · from ${esc(from.name)}</span><small class="part-option-value">${esc(foreignValue(getState().partOptions, target.current) ?? '')}${target.kind === 'color' ? '' : 'px'}</small>${check}</button>` : '';
    const none = target.optional ? `<button type="button" role="option" aria-selected="${!target.current}" data-item-option=""><span class="token-chip" aria-hidden="true"></span><span>None</span>${!target.current ? check : ''}</button>` : '';
    const keep = target.spec ? `<button type="button" role="option" aria-selected="${!target.current}" data-item-option=""><span class="token-chip${target.kind === 'color' ? '' : ' part-chip-text'}" style="${target.kind === 'color' ? `background:${esc(target.spec)}` : ''}" aria-hidden="true">${target.kind === 'color' ? '' : '↔'}</span><span>Keep ${esc(target.spec)} from the spec</span>${!target.current ? check : ''}</button>` : '';
    dialog.querySelector('[data-item-picker-options]').innerHTML = foreign + none + keep + matches.map(o => `<button type="button" role="option" aria-selected="${o.name === target.current}" data-item-option="${esc(o.name)}">${chipFor(o)}<span>${esc(o.name)}</span><small class="part-option-value">${esc(detail(o))}</small>${o.name === target.current ? check : ''}</button>`).join('')
      || '<p class="primitive-empty">No tokens match. Try another name.</p>';
    dialog.querySelector('[data-item-picker-count]').textContent = `${matches.length} of ${all.length} tokens`;
  }
  function openPicker(trigger) {
    const dialog = pickerDialog();
    target = { kind: trigger.dataset.itemPick, current: trigger.dataset.current, spec: trigger.dataset.itemSpec || null, optional: trigger.dataset.optional === 'true', paints: trigger.dataset.itemPaints === 'true', trigger: { ...trigger.dataset } };
    dialog.querySelector('[data-item-picker-role]').textContent = trigger.dataset.label;
    dialog.querySelector('[data-item-picker-search]').value = '';
    renderOptions(); openDialog(dialog);
    const box = trigger.getBoundingClientRect();
    dialog.style.left = `${Math.max(12, Math.min(box.right - dialog.offsetWidth, innerWidth - dialog.offsetWidth - 12))}px`;
    dialog.style.top = `${Math.max(12, Math.min(box.bottom + 8, innerHeight - dialog.offsetHeight - 12))}px`;
    dialog.querySelector('[data-item-picker-search]').focus();
    dialog.querySelector('[data-item-option][aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  // Choices save on their own; quick picks queue up and the newest save carries every pending edit.
  let saving = Promise.resolve(), latest = 0;
  function persist({ reset = false } = {}) {
    const mine = ++latest, part = currentPart();
    saving = saving.then(async () => {
      if (mine !== latest || !part) return;
      const status = () => document.querySelector('[data-item-save-status]'), edits = view.edits;
      try {
        const body = reset ? { id: part.id, reset: true } : { id: part.id, overrides: Object.fromEntries(Object.entries(edits).filter(([, v]) => Object.keys(v).length)) };
        const response = await fetch('/api/parts-update', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DS-Create-Token': getState()?.csrfToken || '' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'This choice could not be kept. Try it again.');
        if (mine === latest) { view.edits = fresh(); await refresh(); }
      } catch (error) { view.edits = fresh(); render(); if (status()) status().textContent = error.message; }
    });
  }
  function choose(name) {
    const a = target.trigger;
    if (a.itemToken) view.edits.tokens[a.itemToken] = name || null;
    else ((view.edits[a.itemArea][a.itemSet] ||= {})[a.itemKey] ||= {})[a.itemSlot] = name || null;
    closeDialog(pickerDialog()); render(); persist();
  }
  document.addEventListener('input', e => { if (e.target.matches?.('[data-item-picker-search]')) renderOptions(); });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-item-wrapper]')) { e.preventDefault(); view.selected = null; render(); }
    const dialog = document.getElementById('item-token-picker'); if (!dialog?.open || !dialog.contains(e.target)) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(dialog); return; }
    const options = [...dialog.querySelectorAll('[data-item-option]')], i = options.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); options[(i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus(); }
  });
  document.addEventListener('click', e => {
    if (!currentPart() && !document.getElementById('item-token-picker')?.open) return;
    const pick = e.target.closest('[data-item-pick]');
    if (pick) { openPicker(pick); return; }
    const option = e.target.closest('[data-item-option]');
    if (option && target) { choose(option.dataset.itemOption); return; }
    const dialog = document.getElementById('item-token-picker');
    if (e.target.closest('[data-item-picker-close]') || dialog?.open && e.target === dialog) { const box = dialog.getBoundingClientRect(); if (e.target !== dialog || e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) closeDialog(dialog); return; }
    const cardEl = e.target.closest('[data-item-card]');
    if (cardEl) { view.selected = JSON.parse(cardEl.dataset.itemCard); render(); return; }
    if (e.target.closest('[data-item-reset]')) {
      const part = currentPart(); view.edits = fresh(); view.selected = null;
      if (part && Object.values(part.draft.overrides || {}).some(v => v && Object.keys(v).length)) { render(); persist({ reset: true }); } else render();
      return;
    }
    // The canvas captures the pointer for panning; look up what sits under the cursor to go back to the overview.
    const at = document.elementFromPoint(e.clientX, e.clientY);
    if (view.selected && at?.closest('[data-item-wrapper]') && !at.closest('button, a, input, select, label, summary')) { view.selected = null; render(); }
  });
}
