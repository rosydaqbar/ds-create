// Change requests: items picked on the Builder canvas, with the user's notes, queued for the agent.
// They live next to the drafts in change-requests.json so any agent reading the workspace can pick them up.
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { PublishError } from './files.mjs';

const clean = (value, max) => typeof value === 'string' && value.trim() && value.length <= max ? value.trim() : '';

export function createChangeRequests({ outputDir }) {
  const file = path.join(outputDir, 'change-requests.json');
  async function read() {
    try { const data = JSON.parse(await readFile(file, 'utf8')); return Array.isArray(data?.requests) ? data : { requests: [] }; }
    catch { return { requests: [] }; }
  }
  async function save(data) {
    const temp = `${file}.${process.pid}.tmp`;
    await writeFile(temp, JSON.stringify(data, null, 2) + '\n');
    await rename(temp, file);
  }
  async function list() { return (await read()).requests; }

  async function update(input) {
    const data = await read(), now = new Date().toISOString();
    const find = id => data.requests.find(r => r.id === id) || (() => { throw new PublishError('This change request no longer exists.', 404); })();
    if (input?.action === 'add') {
      const route = clean(input.route, 80), key = clean(input.key, 300), c = input.context || {};
      const context = { page: clean(c.page, 120), section: clean(c.section, 160), group: clean(c.group, 160), item: clean(c.item, 200), panel: clean(c.panel, 160), details: clean(c.details, 600) };
      if (!route || !key || !context.item) throw new PublishError('Choose an item on the canvas first.', 400);
      // One request per item: adding the same item again returns the existing card.
      const existing = data.requests.find(r => r.route === route && r.key === key);
      if (existing) return { requests: data.requests, id: existing.id };
      const request = { id: randomUUID(), route, key, status: 'open', created: now, context, notes: [] };
      data.requests.push(request);
      await save(data);
      return { requests: data.requests, id: request.id };
    }
    if (input?.action === 'note') {
      const request = find(input.id), text = clean(input.text, 2000);
      if (!text) throw new PublishError('Write a note before saving it.', 400);
      request.notes.push({ id: randomUUID(), text, created: now });
      request.updated = now;
    } else if (input?.action === 'remove-note') {
      const request = find(input.id);
      request.notes = request.notes.filter(n => n.id !== input.noteId);
      request.updated = now;
    } else if (input?.action === 'remove') {
      find(input.id);
      data.requests = data.requests.filter(r => r.id !== input.id);
    } else throw new PublishError('Unknown change request action.', 400);
    await save(data);
    return { requests: data.requests };
  }
  // A paste-ready prompt for any agent, in the same shape as the continuation prompt.
  function prompt(requests, { session, workspace }) {
    if (!requests.length) return '';
    const items = requests.map((r, i) => {
      const where = [r.context.page, r.context.section, r.context.group].filter(Boolean).join(' › ');
      const notes = r.notes.length ? r.notes.map(n => `   - ${n.text.replace(/\n+/g, ' ')}`).join('\n') : '   - No notes yet. Propose the change from this context and ask before applying it.';
      return `${i + 1}. ${r.context.item}${where ? ` (${where})` : ''}${r.context.details ? `\n   Shows: ${r.context.details}` : ''}\n   Notes:\n${notes}`;
    }).join('\n\n');
    return `Apply the change requests saved in Builder.\nds-create init-web --slug ${session}\nWorkspace: ${workspace}\nRequests: workspace/output/${session}/change-requests.json\n\n${items}\n\nChange only what each request names, using existing tokens. Ask me before publishing to Figma.`;
  }
  return { list, update, prompt };
}
