// Publish = ds-create build. A vertical stepper checks that Foundations and Parts each have at least one item,
// from Builder or from Figma (Figma is optional), then hands the ds-create build prompt to the user to paste into their agent.
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

export function setupBuild({ getState }) {
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
    paint('foundations', f.ready ? 'done' : 'todo', f.ready ? 'Ready' : 'Needed',
      f.ready ? `${f.local ? `${f.local} of ${f.total} ready in Builder` : 'Not in Builder'}${useFigma ? ` · ${f.figma ? 'In Figma' : 'Figma is optional'}` : ''}` : 'No foundations yet. Add your context to prepare them.');
    // With Figma off for this session, the Figma action leaves the stepper.
    $('publish').hidden = !useFigma;
    paintSync(getState()?.sync, useFigma);
    dialog.querySelector('[data-build-context]').hidden = f.ready;
    paint('parts', p.ready ? 'done' : f.ready ? 'todo' : 'locked', p.ready ? 'Ready' : 'Needed',
      `${p.prepared} of ${p.total} Parts prepared${p.inFigma ? ` (${p.inFigma} in Figma)` : ''} · ${c.built} of ${c.total} Components${p.ready ? '' : '. Prepare at least one Part.'}`);
    step('parts').querySelector('[data-prepare-parts]').hidden = p.ready || !f.ready;
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
  $('build-copy').addEventListener('click', async () => {
    if ($('build-copy').disabled) return;
    try { await navigator.clipboard.writeText(getState()?.publishSteps?.build.prompt || ''); $('build-copied').textContent = 'Copied. Paste it into your agent.'; }
    catch { $('build-copied').textContent = 'Copy the prompt above manually.'; }
    setTimeout(() => { $('build-copied').textContent = ''; }, 2500);
  });
  return { sync };
}
