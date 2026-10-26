import { milliseconds, easingCurve, previewTiming } from './motion-values.mjs';
export { milliseconds, easingCurve, previewTiming } from './motion-values.mjs';

export function motionPlan(duration, easing, reduced, distance) {
  const ms = milliseconds(duration), curve = easingCurve(easing);
  if (ms === null || !curve) return null;
  const travel = Number.isFinite(distance) ? Math.max(0, distance) : 0;
  return { duration: reduced ? Math.min(ms, 120) : ms, easing: curve.css, reduced,
    keyframes: reduced ? [{ opacity: .25, transform: 'translateX(0px)' }, { opacity: 1, transform: 'translateX(0px)' }] :
      [{ opacity: 1, transform: 'translateX(0px)' }, { opacity: 1, transform: `translateX(${travel}px)` }] };
}

export function createMotionPreview({ draft, resultFor, modeFor, escape, previewCard, modeControls, renderAll, renderCanvas }) {
  const active = new Map();
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const short = name => name.split('/').at(-1).replaceAll('-', ' ');
  const title = name => { const label = short(name); return label.charAt(0).toUpperCase() + label.slice(1); };
  const durationKey = (name, mode) => `motion-duration:${name}:${mode}`;
  let current;
  function model(f) {
    current = f;
    const mode = modeFor(f);
    const rows = prefix => f.variables.filter(v => v.name.startsWith(`motion/${prefix}/`)).map(v => {
      const result = resultFor(v, mode);
      return { ...v, result: { ...result, value: v.type === 'TIMING' ? previewTiming(v.type, result.value) : result.value } };
    });
    const durations = rows('duration'), easings = rows('easing'), delays = rows('delay');
    const d = durations.find(v => v.name === draft.settings.get('motion-duration-token')) || durations.find(v => v.name.endsWith('/base')) || durations[0];
    const e = easings.find(v => v.name === draft.settings.get('motion-easing-token')) || easings.find(v => v.name.endsWith('/standard')) || easings[0];
    const override = d ? draft.settings.get(durationKey(d.name, mode)) : undefined;
    return { mode, durations, easings, delays, d, e, duration: override ?? d?.result.value, edited: override !== undefined,
      reduced: media.matches || mode?.toLowerCase() === 'reduced' };
  }
  const playButton = (group, label = 'Play') => `<button type="button" class="button" data-motion-play="${group}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>${label}</button>`;
  const status = group => `<span class="motion-status" data-motion-status="${group}" role="status">Ready</span>`;
  const track = (group, duration, easing) => `<div class="motion-lane" data-motion-group="${group}" data-motion-ms="${escape(duration)}" data-motion-easing="${escape(easingCurve(easing)?.css || '')}"><span class="motion-dot" aria-hidden="true"></span><span class="motion-endpoint" aria-hidden="true"></span></div>`;
  function curveSVG(curve) {
    if (!curve) return '<p>Curve unavailable</p>';
    const [a, b, c, d] = curve.points;
    const lo = Math.min(0, b, d), hi = Math.max(1, b, d);
    const x = v => 20 + v * 100, y = v => 120 - (v - lo) / (hi - lo) * 100;
    return `<svg class="motion-curve" viewBox="0 0 140 140" role="img" aria-label="Easing curve ${escape(curve.points.join(', '))}"><path class="curve-axis" d="M20 ${y(1)} V${y(0)} H120"/><path class="curve-handle" d="M20 ${y(0)} L${x(a)} ${y(b)} M120 ${y(1)} L${x(c)} ${y(d)}"/><path class="curve-line" d="M20 ${y(0)} C${x(a)} ${y(b)} ${x(c)} ${y(d)} 120 ${y(1)}"/><circle cx="${x(a)}" cy="${y(b)}" r="3"/><circle cx="${x(c)}" cy="${y(d)}" r="3"/></svg>`;
  }
  function content(f, query = '') {
    const m = model(f), plan = motionPlan(m.duration, m.e?.result.value, m.reduced, 0);
    const intro = (heading, copy) => `<div class="section-intro"><h2>${heading}</h2><p>${copy}</p></div>`;
    const matches = v => `${v.name} ${v.description || ''}`.toLowerCase().includes(query.toLowerCase());
    const card = plan ? previewCard(`<span>${escape(title(m.d.name))} · ${escape(title(m.e.name))}</span><code>${plan.duration}ms · ${m.reduced ? 'Fade / instant' : 'Travel'}</code>`,
      `${track('selected', plan.duration, plan.easing)}<div class="motion-ends"><span>Start</span><span>End</span></div><div class="motion-actions">${playButton('selected', 'Play transition')}<button type="button" class="button" data-motion-reset>Reset position</button>${status('selected')}</div>`, { className: 'motion-selected', stageClass: 'motion-stage', caption: `<p class="motion-caption"><code>${escape(m.d.name)}</code> + <code>${escape(m.e.name)}</code>${m.edited ? ' · Preview duration' : ''}</p>` }) : '<p class="notice">No valid duration and easing pair is available in this mode. Check the saved Motion tokens.</p>';
    return `<section class="section">${intro('Transition preview', 'Choose a duration and easing in the workspace, then play the transition to see how they work together.')}${card}<p class="workspace-help">${m.reduced ? `${media.matches ? 'Your device requests reduced motion. ' : ''}This preview uses instant changes or fades capped at 120ms. Source timings remain listed below.` : 'Playback starts on demand and runs once. Reduced mode replaces travel with an instant change or a short fade.'}</p></section>
      <section class="section">${intro('Durations', m.reduced ? 'Compare saved timings as instant changes or short fades, with no spatial movement.' : 'Compare the same distance with different timings. All lanes start together and use the selected easing.')}${previewCard(`<span>${escape(m.mode || 'Saved')} durations</span>${playButton('durations', 'Compare durations')}`, `<div class="motion-comparison">${m.durations.filter(matches).map(v => `<div class="motion-comparison-row"><div><strong>${escape(title(v.name))}</strong><code>${escape(v.name)}</code></div>${track('durations', v.result.error ? '' : v.result.value, m.e?.result.value || '')}<code>${milliseconds(v.result.value) ?? 'Unavailable'}${milliseconds(v.result.value) === null ? '' : 'ms'}</code></div>`).join('') || '<p>No duration tokens match.</p>'}</div>${status('durations')}`, { stageClass: 'motion-comparison-stage' })}</section>
      <section class="section">${intro('Easing curves', 'Compare how each curve accelerates and settles over the selected duration.')}
      <div class="motion-easing-grid">${m.easings.filter(matches).map((v, i) => {
        const curve = v.result.error ? null : easingCurve(v.result.value), group = `easing-${i}`;
        return previewCard(`<span>${escape(title(v.name))}</span>${curve ? playButton(group) : ''}`, `${curveSVG(curve)}${curve ? track(group, m.duration, curve.css) : ''}<code>${escape(curve?.points.join(', ') || v.result.error || (v.type === 'EASING' ? `${v.result.value?.type || 'Native easing'} · Browser preview unavailable` : 'Invalid curve'))}</code>${status(group)}`, { stageClass: 'motion-easing-stage', caption: `<p class="motion-caption"><code>${escape(v.name)}</code>${v.description ? `<span>${escape(v.description)}</span>` : ''}</p>` });
      }).join('') || '<p>No easing tokens match.</p>'}</div></section>
      <section class="section">${intro('Delays', 'Delays control when a response begins or how long a message stays visible. They do not change transition speed.')}<table class="value-table"><thead><tr><th scope="col">Token</th><th scope="col">Delay</th><th scope="col">Source</th></tr></thead><tbody>${m.delays.filter(matches).map(v => `<tr><td><code>${escape(v.name)}</code><p>${escape(v.description || '')}</p></td><td><code>${milliseconds(v.result.value) ?? 'Unavailable'}${milliseconds(v.result.value) === null ? '' : 'ms'}</code></td><td><code>${escape(v.result.alias || v.collection)}</code></td></tr>`).join('')}</tbody></table></section>`;
  }
  function workspace(f) {
    const m = model(f);
    const select = (id, label, rows, chosen) => `<label class="workspace-field" for="${id}"><span>${label}</span><select id="${id}">${rows.map(v => `<option value="${escape(v.name)}" ${v.name === chosen?.name ? 'selected' : ''}>${escape(title(v.name))}</option>`).join('')}</select></label><code class="motion-source">${escape(chosen?.name || 'No saved token')}</code>`;
    return `<section class="inspector-section"><h3>Mode</h3>${modeControls(f)}</section><section class="inspector-section"><h3>Transition</h3>${select('motion-duration-token', 'Duration token', m.durations, m.d)}${select('motion-easing-token', 'Easing token', m.easings, m.e)}<label class="workspace-field" for="motion-duration-ms"><span>Preview duration</span><span class="spacing-unit-input"><input id="motion-duration-ms" type="number" min="0" max="60000" step="1" value="${milliseconds(m.duration) ?? ''}" /><span>ms</span></span></label><p class="workspace-help">Fine-tuning affects the selected transition and easing samples. Duration comparison keeps the saved values.</p><div class="motion-actions">${playButton('selected', 'Play transition')}</div><p class="workspace-help">${m.reduced ? 'Reduced preview: instant change or short fade.' : 'Standard preview: one movement from start to end.'}</p></section>`;
  }
  function stop() {
    for (const [dot, animation] of active) { animation.cancel(); dot.style.transform = ''; dot.style.opacity = ''; }
    active.clear();
    document.querySelectorAll('[data-motion-status]').forEach(el => { el.textContent = 'Ready'; });
  }
  function play(group) {
    if (!current) return;
    const m = model(current);
    const lanes = [...document.querySelectorAll('[data-motion-group]')].filter(el => el.dataset.motionGroup === group);
    const output = [...document.querySelectorAll('[data-motion-status]')].find(el => el.dataset.motionStatus === group);
    const animations = [];
    for (const lane of lanes) {
      const dot = lane.querySelector('.motion-dot');
      const previous = active.get(dot);
      previous?.cancel(); active.delete(dot);
      const plan = motionPlan(lane.dataset.motionMs, lane.dataset.motionEasing, m.reduced, lane.clientWidth - dot.offsetWidth);
      if (!plan) continue;
      const animation = dot.animate(plan.keyframes, { duration: plan.duration, easing: plan.easing, fill: 'forwards' });
      active.set(dot, animation);
      animations.push(animation);
    }
    if (!animations.length) { if (output) output.textContent = 'Saved timing unavailable'; return; }
    if (output) output.textContent = 'Playing…';
    Promise.all(animations.map(a => a.finished)).then(() => {
      if (output?.isConnected) output.textContent = animations.every(a => a.effect.getTiming().duration === 0) ? 'Instant change' : 'Complete';
    }).catch(() => { /* replaced or reset; never let an old playback overwrite new feedback */ });
  }
  function click(e) {
    const playTarget = e.target.closest('[data-motion-play]');
    if (playTarget) { play(playTarget.dataset.motionPlay); return true; }
    if (e.target.closest('[data-motion-reset]')) { stop(); return true; }
    return false;
  }
  function change(e) {
    if (!['motion-duration-token', 'motion-easing-token'].includes(e.target.id)) return false;
    draft.settings.set(e.target.id, e.target.value); renderAll(); return true;
  }
  function input(e) {
    if (e.target.id !== 'motion-duration-ms') return false;
    if (!current || !e.target.validity.valid || e.target.value === '') return true;
    const m = model(current), ms = milliseconds(e.target.value);
    if (m.d && ms !== null) { draft.settings.set(durationKey(m.d.name, m.mode), ms); renderCanvas(); }
    return true;
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  media.addEventListener('change', () => { stop(); if (location.hash === '#motion') renderAll(); });
  return { content, workspace, stop, click, change, input };
}
