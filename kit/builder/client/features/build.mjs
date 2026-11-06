// Publish = ds-create build. A vertical stepper checks that Foundations and Parts each have at least one item,
// from Builder or from Figma (Figma is optional), then hands the ds-create build prompt to the user to paste into their agent.
import { copyText } from './clipboard.mjs';
import { revealInteraction } from '../ui-motion.mjs';
const $ = id => document.getElementById(id);

const SYNC_ROWS = 50;
const value = v => v && typeof v === 'object' && 'alias' in v ? v.alias : typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—');
// One line per difference between the local draft and what was last confirmed in Figma.
function diffRows(diff) {
  return [
    ...diff.changed.flatMap(c => c.fields.map(f => `${c.name}${f.field.startsWith('values.') && f.field !== 'values.Value' ? ` (${f.field.slice(7)})` : f.field.startsWith('values.') ? '' : ` ${f.field}`}: ${value(f.from)} → ${value(f.to)}`)),
    ...diff.renamed.map(r => `${r.from} → ${r.to} (renamed)`),
    ...diff.added.map(a => `${a.name} (added)`),
    ...diff.deleted.map(d => `${d.name} (deleted)`),
  ];
}
function paintSync(sync, useFigma) {
  $('build-sync').hidden = !useFigma || !sync;
  if (!useFigma || !sync) return;
  $('build-sync').dataset.state = sync.state;
  $('build-sync-state').textContent = sync.state === 'in-sync' ? 'In sync with Figma' : sync.state === 'local-changes' ? `${sync.changes} change${sync.changes === 1 ? '' : 's'} not in Figma` : 'Not in Figma yet';
  const rows = sync.state === 'local-changes' ? diffRows(sync.diff) : [];
  const items = rows.slice(0, SYNC_ROWS).map(text => Object.assign(document.createElement('li'), { textContent: text }));
  if (rows.length > SYNC_ROWS) items.push(Object.assign(document.createElement('li'), { textContent: `and ${rows.length - SYNC_ROWS} more` }));
  $('build-sync-diff').replaceChildren(...items);
  $('build-sync-diff').hidden = !items.length;
}

export function setupBuild({ getState, refresh = async () => {} }) {
  const dialog = $('build-dialog');
  const step = name => dialog.querySelector(`[data-step="${name}"]`);
  const paint = (name, state, label, text) => {
    const el = step(name);
    el.dataset.state = state;
    el.querySelector('[data-state-label]').textContent = label;
    el.querySelector('[data-step-text]').textContent = text;
  };
  function sync() {
    const s = getState()?.publishSteps;
    if (!s) return;
    const f = s.foundations, p = s.parts, c = s.components, b = s.build;
    const useFigma = s.figma !== false;
    // Saved foundations wait for the user's approval here; Figma is not needed for it.
    const source = getState()?.source, pending = source?.kind === 'local' && source.review === 'pending' && f.local > 0;
    paint('foundations', f.ready ? 'done' : 'todo', f.ready ? 'Ready' : 'Needed',
      f.ready ? `${f.local ? `${f.local} of ${f.total} ready in Builder` : 'Not in Builder'}${useFigma ? ` · ${f.figma ? 'In Figma' : 'Figma is optional'}` : ''}` : pending ? 'Review the foundations, then approve them.' : 'No foundations yet. Add your context to prepare them.');
    $('approve-foundations').hidden = !pending;
    // With Figma off for this session, the Figma action leaves the stepper.
    $('publish').hidden = !useFigma;
    paintSync(getState()?.sync, useFigma);
    dialog.querySelector('[data-build-context]').hidden = f.ready || pending;
    paint('parts', p.ready ? 'done' : f.ready ? 'todo' : 'locked', p.ready ? 'Ready' : 'Needed',
      `Prepared: ${[[p, 'Parts'], [c, 'Components'], [s.sections, 'Sections']].filter(([x]) => x).map(([x, name]) => `${x.prepared} of ${x.total} ${name}${x.inFigma ? ` (${x.inFigma} in Figma)` : ''}`).join(' · ')}${p.ready ? '' : '. Prepare at least one Part.'}`);
    // Foundations first: while Parts cannot be prepared, say why instead of offering a click the server refuses.
    const blocked = (getState()?.parts || []).find(x => x.canPrepare === false), reason = step('parts').querySelector('[data-parts-reason]');
    reason.textContent = blocked ? `${blocked.reason || 'Approve your foundations in Builder before preparing Parts.'}${pending ? ' Click Approve foundations in step 1.' : ''}` : '';
    reason.hidden = !blocked;
    step('parts').querySelector('[data-prepare-parts]').hidden = p.ready || !f.ready || !!blocked;
    step('parts').querySelector('[data-parts-copy]').hidden = p.ready;
    const open = f.ready && p.ready;
    paint('build', open ? 'todo' : 'locked', open ? 'Ready' : 'Locked',
      open ? 'Copy this prompt into your agent. It runs ds-create build from what is ready now.' : 'Unlocks when Foundations and Parts each have at least one item.');
    $('build-copy').disabled = !open;
    $('build-fallback').hidden = !open;
    $('build-command').textContent = b.prompt || '';
  }
  $('publish-open').addEventListener('click', () => {
    if (dialog.open) { dialog.close(); return; }
    $('build-error').hidden = true;
    sync(); dialog.show(); revealInteraction(dialog);
    $('build-close').focus({ preventScroll: true });
  });
  $('build-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); dialog.close(); } });
  dialog.addEventListener('close', () => $('publish-open').focus({ preventScroll: true }));
  // Publish to Figma (optional) opens its own panel, so this one steps aside.
  $('publish').addEventListener('click', () => { if (!$('publish').disabled) dialog.close(); });
  dialog.querySelector('[data-build-context]').addEventListener('click', () => { dialog.close(); $('setup-open').click(); });
  $('approve-foundations').addEventListener('click', async () => {
    const button = $('approve-foundations'), state = getState();
    button.disabled = true; $('approve-feedback').textContent = '';
    try {
      const response = await fetch('/api/foundations-approve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DS-Create-Token': state?.csrfToken || '' }, body: JSON.stringify({ hash: state?.source?.hash }), signal: AbortSignal.timeout(15000) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'The foundations could not be approved.');
      await refresh(); sync();
    } catch (error) { $('approve-feedback').textContent = error.message; }
    button.disabled = false;
  });
  $('build-copy').addEventListener('click', async () => {
    if ($('build-copy').disabled) return;
    try { await copyText(getState()?.publishSteps?.build.prompt || ''); $('build-copied').textContent = 'Copied. Paste it into your agent.'; }
    catch { $('build-copied').textContent = 'Copy the prompt above manually.'; }
    setTimeout(() => { $('build-copied').textContent = ''; }, 2500);
  });
  step('parts').querySelector('[data-parts-copy]').addEventListener('click', async () => {
    const copied = step('parts').querySelector('[data-parts-copied]');
    try { await copyText(getState()?.publishSteps?.parts?.prompt || ''); copied.textContent = 'Copied. Paste it into your agent.'; }
    catch { copied.textContent = 'Couldn\'t copy the prompt. Ask your agent to prepare the Parts with DS Create MCP.'; }
    setTimeout(() => { copied.textContent = ''; }, 2500);
  });
  return { sync };
}
