import path from 'node:path';
import {readJSON} from './state.mjs';
import {PublishError} from './files.mjs';
import {partTemplates, templateFor} from '../parts/templates.mjs';
import {createPartStore} from '../parts/store.mjs';

// What each page is for, from specs/parts/00-parts.md, specs/components/00-components.md and
// specs/sections/00-sections.md §1.
const purposes = {
  button: 'The primary way to trigger an action, in three emphasis levels and two tones.',
  'icon-button': 'A compact square action with an icon and no visible label, for toolbars, close and utility actions.',
  link: 'Navigates to another page, section or resource through text, inline or standalone.',
  badge: 'A compact label for status, count, category or metadata. It does nothing when clicked.',
  tag: 'A compact value chip that can be removed, counted or selected, used in filters and multi-value inputs.',
  avatar: 'Represents one person or entity with an image, initials or a placeholder icon, plus an optional indicator.',
  checkbox: 'The checkbox box: unchecked, checked or mixed.',
  radio: 'The radio control: one choice in a set of options that exclude each other.',
  switch: 'The on/off switch for settings that apply immediately.',
  'text-control': 'The box users type into or open: single-line, multi-line and select trigger.',
  label: 'The field label with an optional required marker and help icon.',
  'help-text': 'A hint or validation message under a field.',
  tooltip: 'A short floating description attached to an element.',
  progress: 'Shows how far a task has progressed, as a bar or a ring.',
  spinner: 'Loading of unknown length; also used inside the loading state of Button and Icon button.',
  divider: 'Separates groups of content horizontally or vertically.',
  kbd: 'Shows a keyboard key or shortcut.',
  slider: 'Picks a value or a range by dragging a handle along a track.',
  'featured-icon': 'An icon inside a tinted shape that gives a message or card a visual anchor.',
  'button-group': 'Connected actions or a compact view switcher.',
  'text-field': 'Label + Text control + Help text, plus textarea and code fields.',
  'choice-field': 'Labeled checkbox, radio and switch; choice cards and groups.',
  'avatar-group': 'Overlapping avatar stacks and avatar + name rows.',
  select: 'Select and multi-select fields with their option list.',
  menu: 'Dropdown and context menus with their item rows.',
  'social-button': 'Sign-in buttons with provider marks, and their groups.',
  'badge-group': 'A badge with a one-line announcement message that links.',
  'rich-text-editor': 'Toolbar, floating toolbar and editing surface for formatted text.',
  'video-player': '16:9 media frame with overlay action and playback controls.',
};
// Parts, Components and Sections are compiled locally from their template and the approved foundations, one per
// page in page order.
export const parts = partTemplates.map(t => ({ id: t.id, name: t.name, page: t.page, set: t.set, level: t.level, description: purposes[t.id] || '' }));

// Builder's Parts list and actions. Every save goes through the part store, the same path as the MCP tools.
export function createParts({ outputDir }) {
  const store = createPartStore({ outputDir });
  async function status(state) {
    const draft = await readJSON(path.join(outputDir, 'foundations.json')), list = await store.list();
    const ready = ['approved', 'synced'].includes(state?.source?.review);
    return Promise.all(parts.map(async p => {
      const row = list.find(x => x.id === p.id), saved = row?.revision ? (await store.read(p.id)).part : null;
      // Builder reads "review" for a Part whose file is current.
      const status = row?.status === 'ready' ? 'review' : row?.status || 'not-prepared';
      return { ...p, status, revision: saved?.revision || 0, prepared: saved?.prepared || null, variantCount: saved?.variantCount || null,
        canPrepare: ready, reason: ready ? null : 'Approve your foundations in Builder before preparing Parts.',
        draft: saved && status !== 'outdated' && draft ? { ...saved, ...(templateFor(p.id).preview ? { preview: templateFor(p.id).preview(saved, draft) } : {}) } : null };
    }));
  }
  async function prepare(input) {
    if (!input || Object.keys(input).some(k => k !== 'ids') || !Array.isArray(input.ids) || !input.ids.length || input.ids.some(id => !parts.some(p => p.id === id))) throw new PublishError('Choose the Parts to prepare.', 400);
    return { prepared: (await store.prepare({ ids: input.ids, author: 'builder', reason: 'Prepare Parts in Builder' })).prepared.map(p => p.id) };
  }
  // Saves token assignments chosen in Builder as a new revision of the part.
  async function update(input) {
    if (!input || Object.keys(input).some(k => !['id', 'overrides', 'reset'].includes(k)) || !parts.some(p => p.id === input.id) || typeof input.overrides !== 'object' && input.reset !== true) throw new PublishError('Send the Part and its token choices.', 400);
    // Builder edits Button's tokens in place; every other Part is changed through the agent (ds_create_items_change).
    if (!templateFor(input.id).preview) throw new PublishError('Change this Part through the agent.', 400);
    const current = await readJSON(path.join(outputDir, 'parts', input.id + '.json'));
    if (!current) throw new PublishError('Prepare this Part before changing it.', 412);
    const draft = await readJSON(path.join(outputDir, 'foundations.json'));
    // The variants this system's Button has now, after any change to its structure.
    const tones = Object.keys(current.treatments || {}), emphases = Object.keys(current.treatments?.[tones[0]] || {}), states = Object.keys(current.treatments?.[tones[0]]?.[emphases[0]] || {}), sizes = (current.sizes || []).map(z => z.size);
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
    const merged = input.reset === true ? { treatments: {}, sizes: {} } : { treatments: { ...(current.overrides?.treatments || {}) }, sizes: { ...(current.overrides?.sizes || {}) } };
    for (const [k, t] of Object.entries(clean.treatments)) merged.treatments[k] = { ...(merged.treatments[k] || {}), ...t };
    for (const [k, z] of Object.entries(clean.sizes)) merged.sizes[k] = { ...(merged.sizes[k] || {}), ...z, padding: { ...(merged.sizes[k]?.padding || {}), ...(z.padding || {}) } };
    const r = await store.change({ id: input.id, expectedRevision: current.revision, ops: [{ target: 'part:' + input.id, op: 'set', field: 'overrides', value: input.reset === true ? null : merged }], reason: input.reset === true ? 'Reset token choices in Builder' : 'Token choices in Builder', author: 'builder', confirmed: true });
    return { saved: input.id, revision: r.revision };
  }
  return { status, prepare, update };
}
