// Builder controls save as you change them. Each control queues its ops; after a short pause the queue is sent as one
// revision through the same store the agent's MCP tools use. A stale revision refreshes and retries once.
const $ = id => document.getElementById(id);
const PAUSE_MS = 300;

export function setupFoundationSave({ getState, refresh }) {
  const queue = new Map();
  let timer = null, sending = null, status = null;
  const local = () => getState()?.source?.kind === 'local';
  // A status without a revision (saving, an error) holds until the next revision arrives.
  function say(text, revision = null) {
    status = { text, revision, since: getState()?.source?.revision };
    const el = $('foundation-save-status');
    if (el) el.textContent = text;
  }
  async function post(route, body) {
    const response = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DS-Create-Token': getState()?.csrfToken || '' }, body: JSON.stringify(body), signal: AbortSignal.timeout(15000) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(result.error || 'This change could not be saved.'), { status: response.status });
    return result;
  }
  async function flush() {
    timer = null;
    if (sending) await sending;
    if (!queue.size) return;
    const keys = [...queue.keys()], ops = [...queue.values()].flat();
    queue.clear();
    sending = (async () => {
      say('Saving…');
      const reason = `Edited in Builder: ${keys.join(', ')}`.slice(0, 200);
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const result = await post('/api/foundations', { expectedRevision: getState()?.source?.revision, ops, reason });
          say(`Saved · revision ${result.revision}`, result.revision);
          await refresh();
          return;
        } catch (e) {
          if (e.status === 409 && attempt === 0) { await refresh(); continue; }
          say(e.message);
          return;
        }
      }
    })();
    await sending;
    sending = null;
    if (queue.size) schedule();
  }
  function schedule() { clearTimeout(timer); timer = setTimeout(flush, PAUSE_MS); }
  // key names the control, so a slider dragged ten times sends only its last value.
  function save(key, ops) {
    if (!local()) return;
    queue.set(key, ops.map(op => ({ target: 'foundations', ...op })));
    schedule();
  }
  async function undo() {
    const revision = getState()?.source?.revision;
    if (!local() || !(revision > 1)) return;
    try {
      const result = await post('/api/foundations-restore', { revision: revision - 1, expectedRevision: revision });
      say(`Restored revision ${revision - 1} · revision ${result.revision}`, result.revision);
      await refresh();
    } catch (e) { say(e.message); }
  }
  // Edits not sent yet; previews must stay until they are saved.
  const pending = () => !!timer || queue.size > 0;
  function text(state) {
    const source = state?.source;
    if (status && (status.revision ?? status.since) === source?.revision) return status.text;
    if (source?.kind !== 'local') return '';
    return source.savedBy === 'mcp' ? `Revision ${source.revision} · saved by agent` : `Revision ${source.revision} · changes save automatically`;
  }
  return { save, undo, pending, text };
}
