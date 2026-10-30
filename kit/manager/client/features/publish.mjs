import { builderSettings } from '../../shared/ui-settings.mjs';
import { renderPublishProgress } from './publish-progress.mjs';
import { revealInteraction } from '../ui-motion.mjs';
export function publishReady(state) {
  const saved = state?.summary && state.summary.variables + state.summary.textStyles + state.summary.effectStyles > 0;
  const setupReady = !state?.setup || state.setup.status === 'ready';
  const localReady = state?.source?.kind === 'local' && !!state.source.hash && ['pending', 'approved', 'synced'].includes(state.source.review) && state.steps?.some(step => step.step === 1 && step.status === 'done');
  return !!(saved && setupReady && !state.warnings?.length && (localReady || state.status !== 'error' && state.initDone));
}
export function setupPublish() {
  const $ = id => document.getElementById(id);
  const dialog = $('publish-dialog');
  let flow, request, timer, reviewHash, submitting = false, fontKey = '';
  const fontChoices = new Map();
  // The same continuation as the agent status panel, for a request no agent is waiting for.
  function drawRecovery(next) {
    const prompt = next.recoveryPrompt || '', panel = $('publish-recovery');
    if (!prompt && panel.contains(document.activeElement)) $('publish-close').focus({ preventScroll: true });
    panel.hidden = !prompt;
    $('publish-recovery-detail').textContent = next.waitExpired ? 'The 5-minute wait ended. Copy the prompt below into your agent to publish this saved request.' : 'No agent is waiting for Builder events. Copy the prompt below into your agent to publish this saved request.';
    if ($('publish-recovery-prompt').value !== prompt) $('publish-recovery-prompt').value = prompt;
    if (!prompt) $('publish-recovery-feedback').textContent = '';
  }
  const chosen = () => (flow?.job?.fonts || []).map(role => ({ role: role.role, family: fontChoices.get(role.role) || role.family }));
  function drawFonts(next) {
    // A saved choice starts a new preparation; the setup gate then explains what happens next.
    const roles = next.job?.status === 'needs-fonts' && !next.figma.reason ? next.job.fonts || [] : [], panel = $('publish-fonts');
    panel.hidden = !roles.length;
    const key = JSON.stringify(roles);
    if (key !== fontKey) {
      fontKey = key;
      for (const role of fontChoices.keys()) if (!roles.some(r => r.role === role)) fontChoices.delete(role);
      const list = $('publish-font-roles'); list.replaceChildren();
      for (const role of roles) {
        const set = document.createElement('fieldset'); set.className = 'publish-font-role';
        const legend = document.createElement('legend'); legend.textContent = `${role.label} · ${role.family}`; set.append(legend);
        const option = (family, title, detail, note) => {
          const label = document.createElement('label'), input = document.createElement('input'), text = document.createElement('span');
          input.type = 'radio'; input.name = 'publish-font-' + role.role; input.value = family; input.checked = (fontChoices.get(role.role) || role.family) === family;
          input.addEventListener('change', () => { fontChoices.set(role.role, family); drawFonts(flow); });
          text.textContent = title;
          const small = document.createElement('small'); small.textContent = detail; text.append(small);
          if (note) { const badge = document.createElement('span'); badge.className = 'publish-font-note'; badge.textContent = ' ' + note; text.insertBefore(badge, small); }
          label.append(input, text); set.append(label);
        };
        option(role.family, `Keep ${role.family}`, `Missing in Figma: ${role.styles.join(', ')}. Make it available in Figma, then check fonts again.`);
        for (const o of role.options) option(o.family, o.family, `In Figma: ${o.styles.slice(0, 6).join(', ')}${o.styles.length > 6 ? '…' : ''}`, o.note === 'closest' ? '· closest match' : '· recommended');
        if (!role.options.length) { const none = document.createElement('small'); none.textContent = 'No similar font was found in Figma.'; set.append(none); }
        list.append(set);
      }
    }
    $('publish-fonts-apply').disabled = submitting || !chosen().some((c, i) => c.family !== roles[i]?.family);
  }
  function draw(next) {
    const previous = flow;
    flow = next;
    if (!reviewHash && next.figma.hash) reviewHash = next.figma.hash;
    const stale = !!reviewHash && reviewHash !== next.figma.hash;
    const queued=next.job?.status==='queued',running = ['queued', 'running'].includes(next.job?.status);
    const complete = next.figma.complete && !running && !stale;
    $('publish-simulation').hidden = !next.simulation;
    $('publish-revision').textContent = next.figma.revision ? `Foundations · Revision ${next.figma.revision}` : 'Foundations';
    const target = $('publish-figma-url');
    if (!target.value && next.figma.url) target.value = next.figma.url;
    target.disabled = running || complete || submitting;
    const moveFocus = complete && (document.activeElement === $('publish-figma') || $('publish-task-progress').contains(document.activeElement));
    $('publish-approval-note').textContent = complete ? 'This revision is available in Figma.' : 'Publishes the saved revision. Preview edits are excluded.';
    $('publish-figma').disabled = !next.figma.canStart || stale || submitting;
    $('publish-figma').textContent = complete ? 'Published' : queued ? 'Queued' : running ? 'Publishing…' : next.job?.status === 'needs-fonts' ? 'Check fonts again' : next.job ? 'Retry publish' : 'Publish to Figma';
    $('publish-cancel').hidden = !running;
    $('publish-cancel').disabled = submitting || !!next.job?.cancelRequested;
    $('publish-cancel').textContent = next.job?.cancelRequested ? 'Stopping…' : 'Stop';
    $('publish-status').textContent = stale ? 'The saved draft changed. Close Publish and review the new revision before continuing.' : complete ? 'Foundations are available in Figma. Continue to step 2.' : next.figma.reason || next.job?.message || 'Publish this saved revision to the selected Figma file. Your background worker checks fonts, writes foundations, and verifies the result.';
    $('publish-open-figma').hidden = !complete || !next.figma.url;
    if (next.figma.url) $('publish-open-figma').href = next.figma.url;
    renderPublishProgress($('publish-task-progress'),{...next,notice:stale?'The saved draft changed. Review the current revision before publishing.':next.figma.reason,figma:{...next.figma,complete}});
    drawRecovery(next); drawFonts(next);
    const available = next.build.available && !stale;
    $('publish-build-step').hidden = !available;
    $('publish-build-step').setAttribute('aria-disabled', String(!available));
    $('publish-build-state').textContent = !available ? 'Locked' : ({ building: 'In progress', failed: 'Needs attention', incomplete: 'Continue build' }[next.build.status] || 'Ready');
    $('publish-build-state').dataset.status = 'pending';
    $('publish-build-description').textContent = 'Next, build your components and documentation.';
    $('publish-command-section').hidden = !available || next.build.status === 'building';
    if (dialog.open && previous && (previous.job?.status !== next.job?.status || previous.figma.complete !== next.figma.complete)) { revealInteraction($('publish-status'), 'step'); if (available) revealInteraction($('publish-command-section'), 'step'); }
    if (moveFocus && !$('publish-command-section').hidden) $('publish-copy').focus({ preventScroll: true });
  }
  function showError(message) { $('publish-error').textContent = message; $('publish-error').hidden = !message; $('publish-recheck').hidden = !message; }
  async function check() {
    request?.abort();
    const current = new AbortController(); request = current;
    $('publish-recheck').disabled = true;
    try {
      const response = await fetch('/api/publish-flow', { cache: 'no-store', signal: AbortSignal.any([current.signal, AbortSignal.timeout(builderSettings.network.readTimeoutMs)]) });
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
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DS-Create-Token': flow.csrfToken }, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'The local agent could not start. Try again.');
      await check();
    } catch (e) { showError(e.message); }
    finally { submitting = false; if (dialog.open && flow) draw(flow); }
  }
  $('publish').addEventListener('click', () => {
    if ($('publish').disabled) return;
    if(dialog.open){$('publish-close').focus({preventScroll:true});return;}
    reviewHash = null; flow = null; showError('');
    $('publish-figma').disabled = true; $('publish-command-section').hidden = true;
    $('publish-status').textContent = 'Checking saved foundations and publishing status…';
    if(!dialog.open)dialog.show(); revealInteraction(dialog); check();
    timer = setInterval(() => { if (!submitting) check(); }, 2000);
  });
  $('publish-figma').addEventListener('click', () => { if ($('publish-figma-url').reportValidity() && flow?.figma.canStart && reviewHash === flow.figma.hash) post('/api/publish-figma', { hash: reviewHash, figmaUrl: $('publish-figma-url').value.trim() }); });
  $('publish-figma-url').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('publish-figma').click();}});
  $('publish-cancel').addEventListener('click', () => post('/api/publish-cancel', {}));
  $('publish-fonts-apply').addEventListener('click', async () => {
    if ($('publish-fonts-apply').disabled) return;
    await post('/api/publish-fonts', { choices: chosen() });
    if ($('publish-error').hidden) $('publish-fonts-feedback').textContent = 'Saved. Your agent prepares the new typography; review it, then publish again.';
  });
  $('publish-recovery-copy').addEventListener('click', async () => {
    const prompt = $('publish-recovery-prompt');
    try { await navigator.clipboard.writeText(prompt.value); $('publish-recovery-feedback').textContent = 'Copied. Paste into your agent to continue.'; }
    catch { prompt.focus(); prompt.select(); $('publish-recovery-feedback').textContent = 'Copy the selected prompt manually.'; }
  });
  $('publish-recheck').addEventListener('click', () => { showError(''); check(); });
  $('publish-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); dialog.close(); } });
  dialog.addEventListener('close', () => { clearInterval(timer); request?.abort(); request = null; $('publish-open').focus({ preventScroll: true }); });
  $('publish-command').addEventListener('click', e => e.target.select());
  $('publish-copy').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText('ds-create build'); $('publish-copy-feedback').textContent = 'Command copied. Paste it into your agent.'; }
    catch { $('publish-command').focus(); $('publish-command').select(); $('publish-copy-feedback').textContent = 'Copy the selected command manually.'; }
  });
  return { update(state) {
    const ready = publishReady(state);
    const reason = ready ? 'Publish foundations to Figma' : !state ? 'Checking foundation readiness. Reconnect to Builder if this persists.' : ['queued', 'running'].includes(state.setup?.status) ? 'Foundations are being prepared. Wait until the draft is ready.' : 'Prepare foundations or run ds-create init before publishing.';
    $('publish').disabled = !ready;
    $('publish').title = reason;
    $('publish').setAttribute('aria-label', ready ? 'Publish to Figma' : `Publish to Figma: ${reason}`);
  } };
}
