import { openDialog, closeDialog, revealInteraction } from './ui-motion.mjs';
export function setupPublish() {
  const $ = id => document.getElementById(id);
  const dialog = $('publish-dialog');
  let flow, request, timer, reviewHash, submitting = false;
  function draw(next) {
    const previous = flow;
    flow = next;
    if (!reviewHash && next.figma.hash) reviewHash = next.figma.hash;
    const stale = !!reviewHash && reviewHash !== next.figma.hash;
    const running = ['queued', 'running'].includes(next.job?.status);
    const complete = next.figma.complete && !running && !stale;
    $('publish-simulation').hidden = !next.simulation;
    $('publish-revision').textContent = next.figma.revision ? `Saved foundation draft · Revision ${next.figma.revision}` : 'Saved Figma baseline';
    const target = $('publish-figma-url');
    if (!target.value && next.figma.url) target.value = next.figma.url;
    target.disabled = running || complete || submitting;
    const moveFocus = complete && document.activeElement === $('publish-figma');
    $('publish-target-field').hidden = complete;
    $('publish-approval-note').hidden = complete;
    $('publish-figma').hidden = complete;
    $('publish-figma').disabled = !next.figma.canStart || stale || submitting;
    $('publish-figma').textContent = running ? 'Publishing…' : next.job && !complete ? 'Try again' : 'Publish to Figma';
    $('publish-cancel').hidden = !running;
    $('publish-cancel').disabled = submitting;
    $('publish-figma-state').textContent = complete ? 'Complete' : running ? 'In progress' : next.figma.reason ? 'Unavailable' : ['failed', 'blocked', 'cancelled', 'interrupted'].includes(next.job?.status) ? 'Needs attention' : 'Ready';
    $('publish-figma-state').dataset.status = complete ? 'ready' : running ? 'generating' : 'pending';
    $('publish-status').textContent = stale ? 'The saved draft changed. Close Publish and review the new revision before continuing.' : complete ? 'Foundations are available in Figma. Continue to step 2.' : next.figma.reason || next.job?.message || `${next.agent.name} will verify the file and fonts, generate foundations, and run the token audit.`;
    $('publish-open-figma').hidden = !complete || !next.figma.url;
    if (next.figma.url) $('publish-open-figma').href = next.figma.url;
    const available = next.build.available && !stale;
    $('publish-build-step').setAttribute('aria-disabled', String(!available));
    $('publish-build-state').textContent = !available ? 'Locked' : ({ building: 'In progress', failed: 'Needs attention', incomplete: 'Continue build' }[next.build.status] || 'Ready');
    $('publish-build-state').dataset.status = 'pending';
    $('publish-build-description').textContent = !available ? 'Available after the current foundations are generated and audited in Figma.' : next.build.status === 'ready' ? 'An earlier build is recorded. Run ds-create build to continue or rebuild from these foundations.' : 'Create the components and documentation from your Figma foundations.';
    $('publish-command-section').hidden = !available || next.build.status === 'building';
    if (dialog.open && previous && (previous.job?.status !== next.job?.status || previous.figma.complete !== next.figma.complete)) { revealInteraction($('publish-status'), 'step'); if (available) revealInteraction($('publish-command-section'), 'step'); }
    if (moveFocus && !$('publish-command-section').hidden) $('publish-copy').focus({ preventScroll: true });
  }
  function showError(message) { $('publish-error').textContent = message; $('publish-error').hidden = !message; }
  async function check() {
    request?.abort();
    const current = new AbortController(); request = current;
    $('publish-recheck').disabled = true;
    try {
      const response = await fetch('/api/publish-flow', { cache: 'no-store', signal: AbortSignal.any([current.signal, AbortSignal.timeout(4500)]) });
      if (!response.ok) throw new Error('Could not check publishing status. Reconnect to Builder and try again.');
      const result = await response.json();
      if (dialog.open && request === current) draw(result);
    } catch (e) {
      if (request === current && dialog.open) { $('publish-figma').disabled = true; showError(e.name === 'AbortError' ? 'Status check timed out. Check the connection and try again.' : e.message); }
    } finally { if (request === current) $('publish-recheck').disabled = false; }
  }
  async function post(endpoint, body) {
    if (submitting || !flow) return;
    submitting = true; showError(''); draw(flow);
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DS-Create-Token': flow.csrfToken }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The local agent could not start. Try again.');
      await check();
    } catch (e) { showError(e.message); }
    finally { submitting = false; if (dialog.open && flow) draw(flow); }
  }
  $('publish').addEventListener('click', () => {
    reviewHash = null; flow = null; showError('');
    $('publish-figma').disabled = true; $('publish-command-section').hidden = true;
    $('publish-status').textContent = 'Checking saved foundations and the local agent…';
    openDialog(dialog); dialog.scrollTop = 0; check();
    timer = setInterval(() => { if (!submitting) check(); }, 2000);
  });
  $('publish-figma').addEventListener('click', () => { if ($('publish-figma-url').reportValidity() && flow?.figma.canStart && reviewHash === flow.figma.hash) post('/api/publish-figma', { hash: reviewHash, figmaUrl: $('publish-figma-url').value.trim() }); });
  $('publish-cancel').addEventListener('click', () => post('/api/publish-cancel', {}));
  $('publish-recheck').addEventListener('click', () => { showError(''); check(); });
  $('publish-close').addEventListener('click', () => closeDialog(dialog));
  dialog.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); closeDialog(dialog); } });
  dialog.addEventListener('close', () => { clearInterval(timer); request?.abort(); request = null; $('publish').focus({ preventScroll: true }); });
  $('publish-command').addEventListener('click', e => e.target.select());
  $('publish-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('ds-create build'); $('publish-copy-feedback').textContent = 'Command copied. Paste it into your agent.'; }
    catch { $('publish-command').focus(); $('publish-command').select(); $('publish-copy-feedback').textContent = 'Copy the selected command manually.'; }
  });
}
