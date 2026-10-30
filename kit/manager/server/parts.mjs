import {readFile, rename, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {readJSON} from './state.mjs';
import {PublishError} from './files.mjs';

// Parts are compiled locally from their page spec and the published foundations, then
// reviewed in Builder before a separate Figma publication. Only Button is wired so far.
export const parts = [
  { id: 'button', name: 'Button', page: '2.1', set: 'Button', description: 'The primary way to trigger an action, in three emphasis levels and two tones.' },
];

const digest = value => createHash('sha256').update(value).digest('hex');
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'];
const emphases = ['primary', 'secondary', 'tertiary'];
const tones = ['brand', 'danger'];
const states = ['rest', 'hover', 'pressed', 'focus', 'disabled', 'loading'];
// specs/parts/2.1-button.md §4: visual padding minus space/optical, gap per size, label style per size.
const buttonSizes = { xs: { padding: 10, gap: 'space/xs', label: 'sm' }, sm: { padding: 12, gap: 'space/xs', label: 'sm' }, md: { padding: 14, gap: 'space/xs', label: 'sm' }, lg: { padding: 16, gap: 'space/sm', label: 'md' }, xl: { padding: 18, gap: 'space/sm', label: 'md' } };

function resolver(draft) {
  const vars = new Map(draft.variables.map(v => [v.name, v]));
  const modes = Object.fromEntries(draft.collections.map(c => [c.name, c.modes]));
  const resolve = (name, depth = 0) => {
    const v = vars.get(name);
    if (!v || depth > 12) return null;
    const x = v.values[modes[v.collection]?.[0]] ?? Object.values(v.values)[0];
    return x && typeof x === 'object' && x.alias ? resolve(x.alias, depth + 1) : x;
  };
  const css = value => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'r' in value) return `rgba(${[value.r, value.g, value.b].map(n => Math.round(n * 255)).join(', ')}, ${value.a ?? 1})`;
    return null;
  };
  return { vars, has: name => vars.has(name), value: resolve, color: name => css(resolve(name)) };
}

// specs/parts/2.1-button.md §5 and §7. Each entry names exact semantic roles; a role the system lacks
// falls back to its rest token and is listed in the draft notes.
function buttonTreatment(tone, emphasis, state, depth, has, notes) {
  const pick = (wanted, fallback) => { if (has(wanted)) return wanted; if (fallback && !notes.includes(`${wanted} → ${fallback}`)) notes.push(`${wanted} → ${fallback}`); return fallback; };
  const step = s => s === 'hover' || s === 'pressed' ? '/' + s : '';
  const live = ['hover', 'pressed'].includes(state) ? state : 'rest';
  if (state === 'disabled') return {
    fill: emphasis === 'primary' ? 'color/fill/neutral/subtle/disabled' : emphasis === 'secondary' ? 'color/surface/base' : 'color/fill/none',
    border: emphasis === 'tertiary' ? null : 'color/border/disabled', text: 'color/text/disabled', icon: 'color/icon/disabled', effect: null };
  let fill, border = null, text, icon;
  if (emphasis === 'primary') { fill = `color/fill/${tone}/solid${step(live)}`; text = 'color/text/on-solid'; icon = 'color/icon/on-solid'; }
  else if (tone === 'brand') {
    fill = emphasis === 'secondary' ? `color/surface/base${step(live)}` : live === 'rest' ? 'color/fill/none' : `color/fill/neutral/subtle/${live}`;
    border = emphasis === 'secondary' ? 'color/border/default' : null;
    text = live === 'rest' ? 'color/text/secondary' : 'color/text/primary';
    icon = live === 'rest' ? 'color/icon/secondary' : 'color/icon/primary';
  } else {
    fill = live === 'rest' ? (emphasis === 'secondary' ? 'color/surface/base' : 'color/fill/none') : `color/fill/danger/subtle/${live}`;
    border = emphasis === 'secondary' ? 'color/border/danger/subtle' : null;
    text = live === 'rest' ? 'color/text/danger' : pick('color/text/danger/hover', 'color/text/danger');
    icon = live === 'rest' ? 'color/icon/danger' : pick('color/icon/danger/hover', 'color/icon/danger');
  }
  const raised = depth && emphasis !== 'tertiary';
  const focus = tone === 'danger' ? 'focus/danger' : 'focus/default';
  const effect = state === 'focus' ? (raised ? pick(focus + '/control', focus) : focus) : raised ? 'elevation/control' : null;
  return { fill, border, text, icon, effect };
}

export function compileButton(draft, plan, overrides = {}) {
  const r = resolver(draft), notes = [], decisions = [];
  const depth = plan?.domains?.elevation?.inputs?.treatment ? plan.domains.elevation.inputs.treatment !== 'none' : draft.effectStyles.some(e => e.name === 'elevation/control');
  const weight = ['semibold', 'medium', 'bold', 'regular'].find(w => draft.textStyles.some(s => s.name === `type/body/sm/${w}`));
  if (!weight) throw new PublishError('The foundations have no body text styles for the Button label.', 412);
  const faces = [...new Set(draft.textStyles.filter(st => st.name.startsWith('type/body/')).map(st => st.name.split('/').at(-1)))];
  if (weight !== 'semibold') decisions.push({ key: 'Button text weight', value: weight[0].toUpperCase() + weight.slice(1), style: `type/body/{sm,md}/${weight}`, decidedBy: 'AI', reason: `The button guide asks for semi-bold text, but your text styles only come in ${faces.join(', ')}. ${weight[0].toUpperCase() + weight.slice(1)} is the closest.` });
  decisions.push({ key: 'Shadow', value: depth ? 'Primary and Secondary buttons get a soft shadow' : 'No shadow', decidedBy: 'AI', reason: depth ? 'Your foundations use layered shadows, so raised buttons get the same soft shadow.' : 'Your foundations use flat surfaces without shadows.' });
  // Every measurement is assigned to a semantic token, never a raw value. The spec's visual padding has
  // no exact space step, so it starts at the nearest one and the user tunes it in Builder.
  const space = draft.variables.filter(v => v.collection === 'Space' && !v.name.endsWith('/optical') && typeof r.value(v.name) === 'number');
  const nearest = px => space.reduce((a, b) => Math.abs(r.value(b.name) - px) < Math.abs(r.value(a.name) - px) || Math.abs(r.value(b.name) - px) === Math.abs(r.value(a.name) - px) && r.value(b.name) > r.value(a.name) ? b : a).name;
  const sides = ['top', 'right', 'bottom', 'left'], none = space.find(v => r.value(v.name) === 0)?.name || 'space/none';
  const sizeRows = sizes.map(size => {
    const x = nearest(buttonSizes[size].padding), o = overrides.sizes?.[size] || {};
    return { size, height: o.height || `size/control/${size}`, padding: { top: o.padding?.top || none, right: o.padding?.right || x, bottom: o.padding?.bottom || none, left: o.padding?.left || x },
      gap: o.gap || buttonSizes[size].gap, icon: 'size/icon/md', label: o.label || `type/body/${buttonSizes[size].label}/${weight}`, inset: 'space/optical', radius: o.radius || 'radius/control', borderWidth: 'border/width/default' };
  });
  decisions.push({ key: 'Side spacing', value: sizeRows.map(z => `${z.size}: ${z.padding.left.split('/').at(-1)}`).join(', '), decidedBy: 'AI', reason: 'The button guide uses 10, 12, 14, 16 and 18 px, but only some of those are spacing tokens. Each size starts at the nearest token; adjust them in the panel.' });
  const primitives = [], tokens = [];
  for (const z of sizeRows) {
    for (const side of sides) tokens.push({ name: `button/padding-${side}/${z.size}`, collection: 'Components', type: 'FLOAT', values: { Value: { alias: z.padding[side] } }, description: `${side[0].toUpperCase() + side.slice(1)} padding of ${z.size} buttons, outside the optical text inset.`, scopes: ['GAP'], codeSyntax: { WEB: `var(--button-padding-${side}-${z.size})` } });
    tokens.push({ name: `button/gap/${z.size}`, collection: 'Components', type: 'FLOAT', values: { Value: { alias: z.gap } }, description: `Space between the icon and label of ${z.size} buttons.`, scopes: ['GAP'], codeSyntax: { WEB: `var(--button-gap-${z.size})` } });
  }
  const defined = name => r.has(name) || draft.effectStyles.some(e => e.name === name);
  const treatments = Object.fromEntries(tones.map(tone => [tone, Object.fromEntries(emphases.map(e => [e, Object.fromEntries(states.map(s => [s, { ...buttonTreatment(tone, e, s, depth, defined, notes), ...(overrides.treatments?.[`${tone}|${e}|${s}`] || {}) }]))]))]));
  const missing = [...new Set(Object.values(treatments).flatMap(t => Object.values(t).flatMap(e => Object.values(e).flatMap(s => [s.fill, s.border, s.text, s.icon].filter(Boolean)))).filter(n => !r.has(n)))];
  for (const s of sizeRows) for (const n of [s.height, s.icon, s.inset, s.radius, s.borderWidth, s.gap, ...Object.values(s.padding)]) if (!r.has(n)) missing.push(n);
  for (const t of Object.values(treatments).flatMap(x => Object.values(x).flatMap(y => Object.values(y)))) if (t.effect && !defined(t.effect)) missing.push(t.effect);
  for (const s of sizeRows) if (!draft.textStyles.some(t => t.name === s.label)) missing.push(s.label);
  if (missing.length) throw new PublishError('The foundations are missing roles the Button needs: ' + [...new Set(missing)].slice(0, 6).join(', '), 412);
  return {
    format: 'ds-create/part@1', id: 'button', page: '2.1', name: 'Button', set: 'Button',
    variantPattern: 'Size=md, Emphasis=primary, Tone=brand, State=rest, Icon only=false',
    properties: [
      { name: 'Size', type: 'variant', values: sizes, default: 'md' }, { name: 'Emphasis', type: 'variant', values: emphases, default: 'primary' },
      { name: 'Tone', type: 'variant', values: tones, default: 'brand' }, { name: 'State', type: 'variant', values: states, default: 'rest' },
      { name: 'Icon only', type: 'variant', values: ['false', 'true'], default: 'false' }, { name: 'Label', type: 'text', default: 'Button' },
      { name: 'Show leading icon', type: 'boolean', default: false }, { name: 'Show trailing icon', type: 'boolean', default: false },
      { name: 'Leading icon', type: 'instance swap', default: 'plus' }, { name: 'Trailing icon', type: 'instance swap', default: 'arrow-right' },
      { name: 'Show loading text', type: 'boolean', default: true },
    ],
    variantCount: sizes.length * emphases.length * tones.length * states.length * 2,
    primitives, tokens, sizes: sizeRows, treatments, depth, decisions, notes, overrides,
  };
}

// Resolved values for Builder's preview only; Figma publication uses the token names above.
export function previewButton(part, draft) {
  const r = resolver(draft), withTokens = { ...draft, variables: [...draft.variables, ...part.primitives, ...part.tokens], collections: [...draft.collections, { name: 'Components', modes: ['Value'] }] }, rp = resolver(withTokens);
  const shadow = name => { const e = draft.effectStyles.find(x => x.name === name); return e ? e.effects.map(x => `${x.offset?.x ?? 0}px ${x.offset?.y ?? 0}px ${x.radius ?? 0}px ${x.spread ?? 0}px ${x.color?.alias ? r.color(x.color.alias) : 'transparent'}`).join(', ') : null; };
  const colors = prefixes => draft.variables.filter(v => v.type === 'COLOR' && prefixes.some(p => v.name.startsWith(p))).map(v => ({ name: v.name, value: r.color(v.name) }));
  const numbers = prefixes => draft.variables.filter(v => v.type === 'FLOAT' && prefixes.some(p => v.name.startsWith(p))).map(v => ({ name: v.name, value: r.value(v.name) }));
  const style = name => { const s = draft.textStyles.find(t => t.name === name); return s && { fontFamily: s.fontFamily, fontStyle: s.fontStyle, fontSize: s.fontSize, lineHeight: s.lineHeight?.value ?? null, letterSpacing: s.letterSpacing?.value ?? 0, weight: r.value(s.bound?.fontWeight) ?? 400 }; };
  return {
    sizes: part.sizes.map(s => ({ size: s.size, height: rp.value(s.height), padding: Object.fromEntries(Object.entries(s.padding).map(([k, v]) => [k, rp.value(v)])), gap: rp.value(s.gap), icon: rp.value(s.icon), inset: rp.value(s.inset), radius: rp.value(s.radius), borderWidth: rp.value(s.borderWidth), label: style(s.label), labelStyle: s.label })),
    // Token choices per control, with their resolved value, so Builder can preview any assignment.
    options: {
      fill: colors(['color/fill/', 'color/surface/']), border: colors(['color/border/']), text: colors(['color/text/']), icon: colors(['color/icon/']),
      effect: draft.effectStyles.map(e => ({ name: e.name, value: shadow(e.name) })),
      height: numbers(['size/control/']), space: numbers(['space/']).filter(o => !o.name.endsWith('/optical')), radius: numbers(['radius/']),
      label: draft.textStyles.map(t => ({ name: t.name, value: style(t.name) })),
    },
    treatments: Object.fromEntries(Object.entries(part.treatments).map(([tone, e]) => [tone, Object.fromEntries(Object.entries(e).map(([em, st]) => [em, Object.fromEntries(Object.entries(st).map(([s, t]) => [s, { fill: r.color(t.fill), border: t.border ? r.color(t.border) : null, text: r.color(t.text), icon: r.color(t.icon), shadow: t.effect ? shadow(t.effect) : null }]))]))])),
  };
}

const partFile = (outputDir, id) => path.join(outputDir, 'parts', `${id}.json`);
const write = async (file, value) => { await mkdir(path.dirname(file), { recursive: true }); await writeFile(file + '.tmp', JSON.stringify(value, null, 2) + '\n'); await rename(file + '.tmp', file); };

export function createParts({ outputDir }) {
  async function foundationsHash() { try { return digest(await readFile(path.join(outputDir, 'foundations.json'))); } catch { return null; } }
  async function status(state) {
    const hash = await foundationsHash(), draft = await readJSON(path.join(outputDir, 'foundations.json'));
    const ready = !!state?.initDone && state.source?.review === 'synced';
    return Promise.all(parts.map(async p => {
      const saved = await readJSON(partFile(outputDir, p.id));
      // A draft from an older compiler (no per-side padding) is prepared again rather than shown.
      const status = !saved ? 'not-prepared' : saved.foundationsHash !== hash || !saved.sizes?.every(z => z.padding) ? 'outdated' : saved.review === 'synced' ? 'synced' : 'review';
      return { ...p, status, revision: saved?.revision || 0, prepared: saved?.prepared || null, variantCount: saved?.variantCount || null,
        canPrepare: ready, reason: ready ? null : 'Publish your foundations to Figma before preparing Parts.',
        draft: saved && status !== 'outdated' && draft ? { ...saved, preview: previewButton(saved, draft) } : null };
    }));
  }
  async function prepare(input, state) {
    if (!input || Object.keys(input).some(k => k !== 'ids') || !Array.isArray(input.ids) || !input.ids.length || input.ids.some(id => !parts.some(p => p.id === id))) throw new PublishError('Choose the Parts to prepare.', 400);
    if (!state?.initDone || state.source?.review !== 'synced') throw new PublishError('Publish your foundations to Figma before preparing Parts.', 412);
    const draft = await readJSON(path.join(outputDir, 'foundations.json')), plan = await readJSON(path.join(outputDir, 'foundation-plan.json')), hash = await foundationsHash();
    const prepared = [];
    for (const id of input.ids) {
      const previous = await readJSON(partFile(outputDir, id)), part = compileButton(draft, plan, previous?.overrides || {});
      await write(partFile(outputDir, id), { ...part, revision: (previous?.revision || 0) + 1, foundationsHash: hash, prepared: new Date().toISOString(), review: 'pending' });
      prepared.push(id);
    }
    return { prepared };
  }
  // Saves token assignments chosen in Builder as a new revision of the draft.
  async function update(input, state) {
    if (!input || Object.keys(input).some(k => !['id', 'overrides', 'reset'].includes(k)) || !parts.some(p => p.id === input.id) || typeof input.overrides !== 'object' && input.reset !== true) throw new PublishError('Send the Part and its token choices.', 400);
    if (!state?.initDone || state.source?.review !== 'synced') throw new PublishError('Publish your foundations to Figma before changing Parts.', 412);
    const previous = await readJSON(partFile(outputDir, input.id));
    if (!previous) throw new PublishError('Prepare this Part before changing it.', 412);
    const draft = await readJSON(path.join(outputDir, 'foundations.json')), plan = await readJSON(path.join(outputDir, 'foundation-plan.json')), hash = await foundationsHash();
    // Only semantic tokens and styles can be assigned; raw primitives stay hidden.
    const known = new Set([...draft.variables.filter(v => v.collection !== 'Primitives').map(v => v.name), ...draft.effectStyles.map(e => e.name), ...draft.textStyles.map(t => t.name)]);
    const clean = { treatments: {}, sizes: {} }, ok = v => typeof v === 'string' && known.has(v) || v === null;
    for (const [key, t] of Object.entries(input.overrides?.treatments || {})) {
      const [tone, em, st] = key.split('|');
      if (!tones.includes(tone) || !emphases.includes(em) || !states.includes(st)) throw new PublishError('Unknown button variant: ' + key, 400);
      for (const [field, v] of Object.entries(t || {})) { if (!['fill', 'border', 'text', 'icon', 'effect'].includes(field) || !ok(v) || v === null && !['border', 'effect'].includes(field)) throw new PublishError(`Choose an existing token for ${field}.`, 400); (clean.treatments[key] ||= {})[field] = v; }
    }
    for (const [size, z] of Object.entries(input.overrides?.sizes || {})) {
      if (!sizes.includes(size)) throw new PublishError('Unknown button size: ' + size, 400);
      for (const [field, v] of Object.entries(z || {})) {
        if (field === 'padding') { for (const [side, x] of Object.entries(v || {})) { if (!['top', 'right', 'bottom', 'left'].includes(side) || !ok(x) || x === null) throw new PublishError('Choose a spacing token for each side.', 400); ((clean.sizes[size] ||= {}).padding ||= {})[side] = x; } }
        else if (['height', 'gap', 'radius', 'label'].includes(field) && ok(v) && v !== null) (clean.sizes[size] ||= {})[field] = v;
        else throw new PublishError(`Choose an existing token for ${field}.`, 400);
      }
    }
    // Reset drops every saved choice so the Part goes back to what the compiler picked.
    const merged = input.reset === true ? { treatments: {}, sizes: {} } : { treatments: { ...(previous.overrides?.treatments || {}) }, sizes: { ...(previous.overrides?.sizes || {}) } };
    for (const [k, t] of Object.entries(clean.treatments)) merged.treatments[k] = { ...(merged.treatments[k] || {}), ...t };
    for (const [k, z] of Object.entries(clean.sizes)) merged.sizes[k] = { ...(merged.sizes[k] || {}), ...z, padding: { ...(merged.sizes[k]?.padding || {}), ...(z.padding || {}) } };
    const part = compileButton(draft, plan, merged);
    await write(partFile(outputDir, input.id), { ...part, revision: (previous.revision || 0) + 1, foundationsHash: hash, prepared: previous.prepared, updated: new Date().toISOString(), review: 'pending' });
    return { saved: input.id, revision: (previous.revision || 0) + 1 };
  }
  return { status, prepare, update };
}
