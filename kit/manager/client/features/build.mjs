// Publish = ds-create build. A vertical stepper checks that Foundations and Parts each have at least one item,
// from Builder or from Figma (Figma is optional), then hands the ds-create build prompt to the user to paste into their agent.
import { revealInteraction } from '../ui-motion.mjs';
const $ = id => document.getElementById(id);

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
    paint('foundations', f.ready ? 'done' : 'todo', f.ready ? 'Ready' : 'Needed',
      f.ready ? `${f.local ? `${f.local} of ${f.total} ready in Builder` : 'Not in Builder'} · ${f.figma ? 'In Figma' : 'Figma is optional'}` : 'No foundations yet. Add your context to prepare them.');
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
