import path from 'node:path';
import {readJSON} from './state.mjs';
import {PublishError} from './files.mjs';
import {templateFor} from '../parts/templates.mjs';
import {createPartStore} from '../parts/store.mjs';

// Parts are compiled locally from their template and the approved foundations. Only Button is wired so far.
export const parts = [
  { id: 'button', name: 'Button', page: '2.1', set: 'Button', description: 'The primary way to trigger an action, in three emphasis levels and two tones.' },
];

const previewButton = templateFor('button').preview;

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
        draft: saved && status !== 'outdated' && draft ? { ...saved, preview: previewButton(saved, draft) } : null };
    }));
  }
  async function prepare(input) {
    if (!input || Object.keys(input).some(k => k !== 'ids') || !Array.isArray(input.ids) || !input.ids.length || input.ids.some(id => !parts.some(p => p.id === id))) throw new PublishError('Choose the Parts to prepare.', 400);
    return { prepared: (await store.prepare({ ids: input.ids, author: 'builder', reason: 'Prepare Parts in Builder' })).prepared.map(p => p.id) };
  }
  // Saves token assignments chosen in Builder as a new revision of the part.
  async function update(input) {
    if (!input || Object.keys(input).some(k => !['id', 'overrides', 'reset'].includes(k)) || !parts.some(p => p.id === input.id) || typeof input.overrides !== 'object' && input.reset !== true) throw new PublishError('Send the Part and its token choices.', 400);
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
