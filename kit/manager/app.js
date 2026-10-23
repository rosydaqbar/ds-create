import { openDialog, closeDialog, revealInteraction, installInteractionMotion } from './ui-motion.mjs';
import { createCanvas } from './canvas.mjs';
import { preparedFonts, fontChoices, fontStack } from './fonts/catalog.mjs';
import { spacingScale } from './spacing.mjs';
import { createFoundationControls } from './controls.js';
import { createMotionPreview } from './motion.mjs';
import { setupPublish } from './publish.mjs';
import { setupWeb } from './setup.mjs';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const paths = {
  overview: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  color: '<path d="M12 3S5 10.3 5 15a7 7 0 0 0 14 0c0-4.7-7-12-7-12Z"/>',
  typography: '<path d="m3 20 7-16 7 16M6 14h8M16 10h6M19 10v10"/>',
  space: '<path d="M4 4v16M20 4v16M7 12h10m-7-3-3 3 3 3m4-6 3 3-3 3"/>',
  shape: '<path d="M5 20V10a5 5 0 0 1 5-5h10"/><path d="M5 3v2m14 14h2M3 20h2"/>',
  elevation: '<path d="m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  motion: '<path d="M3 12h4l3-7 4 14 3-7h4"/>',
  iconography: '<circle cx="7" cy="7" r="3"/><rect x="14" y="4" width="6" height="6" rx="1"/><path d="m7 14 4 6H3l4-6Zm7 3h6m-3-3v6"/>',
  'brand-assets': '<path d="M5 21V3c5-3 9 5 14 1v11c-5 4-9-4-14-1"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20.7 13A9 9 0 0 1 11 3.3 9 9 0 1 0 20.7 13Z"/>',
  gear: '<path d="m9 3-1 3-3 1-2 3 2 2-1 3 3 2 1 3h4l1-3 3-1 2-3-2-2 1-3-3-2-1-3H9Z"/><circle cx="10" cy="11.5" r="3"/>',
  up: '<path d="m5 15 7-7 7 7"/>',
  down: '<path d="m5 9 7 7 7-7"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.overview}</svg>`;
const labels = { ready: 'Ready', review: 'Review foundations', approved: 'Ready for Figma', generating: 'Generating...', pending: 'Waiting', incomplete: 'Setup incomplete', error: 'Needs attention', skipped: 'Skipped' };
const badge = (status, label = labels[status]) => `<span class="status" data-status="${escape(status)}">${status === 'generating' ? '<span class="spinner" aria-hidden="true"></span>' : ''}${escape(label)}</span>`;
let state;
let signature = '';
let query = '';
let selectedMode = '';
let fetching = false;
let controls;
let motion;
let inspectorRoute;
let inspectorNeedsReset = true;
const draft = { name: null, product: null, values: new Map(), settings: new Map() };
let selectedToken = 'color/text/primary';
const displayName = () => draft.name ?? state.system;
const valueKey = (name, mode) => `${name}\u0000${mode}`;
const route = () => location.hash.slice(1) || 'overview';
const modeFor = f => f.modes.includes(selectedMode) ? selectedMode : f.modes[0];
const savedResult = (v, mode) => v.resolved[mode] || (Object.keys(v.resolved).length === 1 ? Object.values(v.resolved)[0] : { error: `No value for ${mode}` });
function resultFor(v, mode) {
  if (!draft.values.has(valueKey(v.name, mode))) return savedResult(v, mode);
  const value = draft.values.get(valueKey(v.name, mode));
  if (!value?.alias) return { value };
  const primitive = state.foundations.find(f => f.id === 'color').variables.find(p => p.name === value.alias);
  return primitive ? { ...savedResult(primitive, mode), alias: value.alias } : { alias: value.alias, error: 'Unresolved alias' };
}
const primitiveColors = f => f.variables.filter(v => v.type === 'COLOR' && (v.collection.toLowerCase() === 'primitives' || v.name.startsWith('palette/')));
function tokenLabel(name) {
  const parts = name.split('/');
  const label = (parts[0] === 'color' ? parts.slice(2).join(' ') || parts.at(-1) : name).replace(/[-/]/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}
function textStyle(f, style) {
  const result = { ...style };
  for (const [property, token] of Object.entries(style?.bound || {})) {
    const variable = f.variables.find(v => v.name === token);
    if (variable) result[property] = resultFor(variable, modeFor(f)).value;
  }
  return result;
}
function typeFamilies(f) {
  const ui = f.variables.find(v => v.name === 'font/family/ui');
  return [ui ? resultFor(ui, modeFor(f)).value : null, ...f.styles.map(s => textStyle(f, s).fontFamily)];
}
const previewTypeface = f => draft.settings.get('family') || fontChoices(typeFamilies(f)).initial;
const typefaceLabel = family => family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
const semanticColors = f => f.variables.filter(v => v.type === 'COLOR' && v.collection.toLowerCase() !== 'primitives' && !v.name.startsWith('palette/'));
const groupNames = { surface: 'Surfaces', text: 'Text', fill: 'Fills', border: 'Borders', icon: 'Icons', category: 'Categories', overlay: 'Overlays', shadow: 'Shadow colors', gradient: 'Gradients' };
const groupDescriptions = { surface: 'Use surface contrast to separate page backgrounds, containers, and overlays.', text: 'Use text contrast to establish emphasis while keeping content legible.', fill: 'Use fills to distinguish actions and communicate hover, pressed, and feedback states.', border: 'Use borders to define boundaries and focus rings to identify keyboard focus.', icon: 'Match icon color to the meaning and emphasis of the accompanying content.', category: 'Use distinct hues to separate categories without implying status or priority.', overlay: 'Dim supporting content so the foreground task stays clear.', shadow: 'Shadow tones distinguish raised elements from the surfaces behind them.' };
function colorGroups(f) {
  const groups = new Map();
  for (const v of semanticColors(f)) {
    if (!`${v.name} ${v.description}`.toLowerCase().includes(query.toLowerCase())) continue;
    const key = v.name.startsWith('color/') ? v.name.split('/')[1] : v.collection;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(v);
  }
  const order = Object.keys(groupNames);
  return [...groups].sort(([a], [b]) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)));
}
const valueText = result => result?.error || (typeof result?.value === 'object' ? JSON.stringify(result.value) : String(result?.value ?? '—'));
const footer = () => `<footer class="docs-page-footer"><span>Init workspace</span><span>${state?.updated ? `Output saved ${escape(new Date(state.updated).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }))}` : 'Waiting for the first saved output'}</span></footer>`;
const documentFrame = (title, description, body, status = '', titleAttributes = '') => `<article class="docs-reading-card"><header class="docs-page-header"><div class="page-title-row"><h1 ${titleAttributes}>${escape(title)}</h1>${status}</div><p>${escape(description)}</p></header>${body}${footer()}</article>`;
function previewCard(toolbar, content, { className = '', stageClass = '', attributes = '', stageAttributes = '', caption = '', interactive = false } = {}) {
  const inner = interactive ? 'span' : 'div';
  return `<div class="docs-preview ${className}" ${interactive ? '' : attributes}>${interactive ? `<button type="button" class="specimen-select" ${attributes}>` : ''}<${inner} class="docs-preview-toolbar">${toolbar}</${inner}><${inner} class="docs-stage ${stageClass}" ${stageAttributes}>${content}</${inner}>${caption}${interactive ? '</button>' : ''}</div>`;
}

function renderNav() {
  if (!state) return;
  const term = $('nav-search').value.trim().toLowerCase();
  const items = state.foundations.filter(f => f.name.toLowerCase().includes(term));
  $('nav').innerHTML = `<a class="nav-link" href="#overview" ${route() === 'overview' ? 'aria-current="page"' : ''}>${icon('overview')}<span>Overview</span></a><div class="nav-heading">Foundations</div>${items.map(f => `<a class="nav-link" href="#${f.id}" ${route() === f.id ? 'aria-current="page"' : ''}>${icon(f.id)}<span>${escape(f.name)}</span><span class="nav-dot" data-status="${f.status}" aria-label="${escape(labels[f.status])}"></span></a>`).join('')}${items.length ? '' : '<p class="nav-hint">No foundations match.</p>'}`;
}

function preview(f) {
  if (f.status !== 'ready') return `<div class="preview-empty">${badge(f.status, f.later ? 'Not generated yet' : labels[f.status])}<small>${escape(f.message)}</small></div>`;
  if (f.id === 'color') {
    const colors = f.variables.filter(v => v.name.startsWith('palette/')).slice(0, 8);
    const swatches = colors.length ? colors : f.variables.slice(0, 8);
    return `<div class="swatch-strip">${swatches.map(v => `<span data-color="${escape(valueText(resultFor(v, modeFor(f))))}" title="${escape(v.name)}"></span>`).join('')}</div><p class="specimen-description">${escape(f.description)}</p><span class="specimen-name">${f.variables.length} color variables · ${escape(f.modes.join(', '))}</span>`;
  }
  const familyName = previewTypeface(f);
  return `<div class="specimen-large" data-font="${escape(familyName)}">Aa Bb Cc</div><p class="specimen-description">${escape(f.description)}</p><span class="specimen-name">${escape(typefaceLabel(familyName))} · ${f.styles.length} text styles</span>`;
}

function overview() {
  if (state.setup && state.setup.status !== 'ready') {
    const active = ['queued', 'running'].includes(state.setup.status);
    const heading = active ? 'Preparing your foundations' : state.setup.status === 'questions' ? 'A few details are needed' : state.setup.status === 'empty' ? 'Start with your context' : 'Continue your setup';
    return documentFrame(heading, 'Create the foundations for your product, then review them here before publishing to Figma.', `<section class="section"><div class="section-intro"><h2>${active ? 'Preparation in progress' : 'Context and instructions'}</h2><p>${escape(state.setup.message || 'Describe your product and add any briefs, guidelines, or existing design tokens. No Figma file is needed yet.')}</p></div><button class="button button-primary" data-open-setup>${active ? 'View preparation' : state.setup.status === 'questions' ? 'Answer questions' : 'Open context'}</button></section><section class="section"><div class="section-intro"><h2>From context to foundations</h2><p>Your color, typography, spacing, shape, elevation, and motion will appear here after preparation. Once you approve the saved draft, Publish generates it in Figma.</p></div></section>`, badge(active ? 'generating' : 'pending', active ? 'Preparing' : 'Setup'));
  }
  const names = { ready: 'Init complete', review: 'Review foundations', approved: 'Ready for Figma', generating: 'Initializing', pending: 'Waiting for init', incomplete: 'Setup incomplete', error: 'Needs attention' };
  const statusText = 'Shared rules for color, type, spacing, and interaction keep interface decisions consistent.';
  const skipped = state.steps.filter(s => s.status === 'skip');
  return documentFrame(displayName(), statusText, `<section class="section" aria-labelledby="init-heading"><div class="section-heading"><h2 id="init-heading">Foundation setup</h2><button id="preparation-history-link" class="text-button" data-show-preparation hidden>Preparation activity</button><small>${state.steps.filter(s => s.status === 'done').length} of 4 steps complete${skipped.length ? ` · ${skipped.length} skipped` : ''}</small></div>
      <ol class="init-steps">${state.steps.map(s => `<li class="step ${escape(s.status)}"><div class="step-title">${s.status === 'done' ? icon('check') : ['building', 'qa'].includes(s.status) ? '<span class="spinner" aria-hidden="true"></span>' : ''}${escape(s.name)}</div><small>${escape({ done: 'Complete', skip: 'Skipped', building: 'In progress', qa: 'Checking', error: 'Needs attention' }[s.status] || 'Waiting')}</small></li>`).join('')}</ol>
      ${skipped.length ? `<p class="setup-note">${skipped.some(s => s.step === 2) ? 'Figma verification is required. This step was skipped; initialization remains incomplete until Figma is verified.' : 'A required step was skipped. Complete it before marking initialization complete.'}</p>` : ''}
    </section>
    ${state.source?.kind === 'local' ? `<section class="section" aria-labelledby="draft-review-heading"><div class="section-intro"><h2 id="draft-review-heading">${state.source.review === 'invalid' ? 'Restore the foundation draft' : state.source.review === 'synced' ? 'Foundations in Figma' : state.source.review === 'approved' ? 'Ready to generate in Figma' : 'Review before Figma'}</h2><p>${state.source.review === 'invalid' ? 'The saved draft is missing or invalid. Ask the agent to restore it before reviewing or continuing to Figma.' : state.source.review === 'synced' ? 'This saved revision has been generated and audited in Figma.' : state.source.review === 'approved' ? 'The saved draft is approved. Open Publish to generate it in Figma with the local agent.' : 'Inspect the saved draft. Ask the agent for changes, or open Publish to approve this revision and generate it in Figma.'}</p><p>Controller edits are previews. Ask the agent to save any changes before approving.</p><small>Saved draft · Revision ${escape(state.source.revision || 'unavailable')}</small></div></section>` : ''}
    <section class="section" aria-labelledby="foundation-preview"><div class="section-heading"><h2 id="foundation-preview">Foundation preview</h2></div><div class="preview-grid">${['color', 'typography'].map(id => {
      const f = state.foundations.find(f => f.id === id);
      return previewCard(`<a href="#${id}">${escape(f.name)}</a>${icon('arrow')}`, preview(f));
    }).join('')}</div></section>
    <section class="section" aria-labelledby="foundations-heading"><div class="section-heading"><h2 id="foundations-heading">Foundation library</h2><small>${state.summary.ready} ready to inspect</small></div><div class="foundation-list">${state.foundations.map(f => `<a class="foundation-row" href="#${f.id}">${icon(f.id)}<div><strong>${escape(f.name)}</strong><small>${escape(f.description)}</small></div><div class="row-meta">${f.count ? `<span class="count">${f.count} ${f.styles.length && !f.variables.length ? 'styles' : 'items'}</span>` : ''}${badge(f.status, f.later && f.status === 'pending' ? 'Not generated yet' : labels[f.status])}</div>${icon('arrow')}</a>`).join('')}</div></section>
    `, badge(state.status, names[state.status]), 'data-system-name');
}

function emptyFoundation(f) {
  const title = f.status === 'generating' ? 'Generating...' : f.status === 'error' ? 'This foundation needs attention' : f.status === 'skipped' ? 'Not in this init' : f.later ? 'Not generated yet' : 'Waiting for this foundation';
  return `<div class="empty-state">${f.status === 'generating' ? '<span class="spinner" aria-hidden="true"></span>' : icon(f.id)}<h2>${title}</h2><p>${escape(f.message)}</p>${f.status === 'generating' ? '<small>This view updates automatically. You can keep working in your agent.</small>' : ''}</div>`;
}

function variableTable(rows, mode) {
  return `<table class="value-table"><thead><tr><th scope="col">Token</th><th scope="col">Value</th><th scope="col">Source</th></tr></thead><tbody>${rows.map(v => {
    const result = resultFor(v, mode);
    return `<tr><td><code>${escape(v.name)}</code>${v.description ? `<p>${escape(v.description)}</p>` : ''}</td><td>${v.name.startsWith('space/') || v.name.startsWith('size/') ? `<div class="measure" data-measure="${escape(result.value)}"></div>` : ''}${v.name.startsWith('radius/') ? `<div class="shape-sample" data-radius="${escape(result.value)}"></div>` : ''}<code>${escape(valueText(result))}</code></td><td><code>${escape(result.alias || v.collection)}</code></td></tr>`;
  }).join('')}</tbody></table>`;
}

function foundation(f) {
  if (f.id === 'color') return colorDocument(f);
  if (f.id === 'space') return spacingDocument(f);
  if (f.id === 'motion' && f.status === 'ready') return documentFrame(f.name, f.description, motion.content(f, query), badge(f.status));
  if (f.id === 'shape' && f.status === 'ready') return documentFrame(f.name, f.description, controls.radiusContent(f), badge(f.status));
  const mode = modeFor(f);
  const filtered = f.variables.filter(v => `${v.name} ${v.description}`.toLowerCase().includes(query.toLowerCase()));
  const styles = f.styles.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
  let body = '';
  if (f.status !== 'ready') body = emptyFoundation(f);
  else {
    body = '<section class="section">';
    if (!filtered.length && !styles.length) body += '<p>No values match your filter.</p>';
    if (styles.length) body += `<div class="specimen-list">${styles.map(s => {
        if (f.id === 'typography') {
          const type = textStyle(f, s);
          return previewCard(`<code>${escape(s.name)}</code><span>${escape(typefaceLabel(previewTypeface(f)))} · ${escape(type.fontSize)} / ${escape(type.lineHeight ?? 'Auto')}</span>`, `<p data-font="${escape(type.fontFamily)}" data-type-size="${escape(type.fontSize)}">The shape of things to come.</p>`, { className: 'type-style' });
        }
        if (f.id === 'elevation') return previewCard(`<code>${escape(s.name)}</code>`, `<div class="effect-sample" data-effect="${escape(s.name)}"></div><small>${escape(controls.summary(s))}</small>`, { className: 'effect-style' });
        return previewCard(`<code>${escape(s.name)}</code>`, `<p>${escape(JSON.stringify(s.grids || []))}</p>`);
      }).join('')}</div>`;
      if (filtered.length) body += `${styles.length ? '<div class="section-heading"><h2>Variables</h2></div>' : ''}${variableTable(filtered, mode)}`;
    body += '</section>';
  }
  return documentFrame(f.name, f.description, body, badge(f.status));
}

function spacingFor(f) {
  const variable = f.variables.find(v => v.name === 'space/xs');
  const saved = variable ? Number(resultFor(variable, modeFor(f)).value) : 4;
  return spacingScale(draft.settings.get('space-base-rem') ?? (Number.isFinite(saved) && saved > 0 ? saved / 16 : 0.25));
}
function spacingCard(step, base = false, measureScale = 1) {
  return previewCard(`<span>${base ? 'Base unit' : `×${step.multiple}`}</span><code>${step.px}px</code>`, `<span class="measure spacing-measure" style="width:${step.px}px;transform:scaleX(${measureScale})" aria-hidden="true"></span>`, { className: 'spacing-card', stageClass: 'spacing-stage', attributes: `data-spacing-step="${base ? 'base' : step.multiple}"`, stageAttributes: `role="img" aria-label="${step.px} pixel spacing"` });
}
function spacingDocument(f) {
  if (f.status !== 'ready') return documentFrame(f.name, f.description, emptyFoundation(f), badge(f.status));
  const spacing = spacingFor(f);
  const measureScale = Math.min(1, 160 / spacing.scale.at(-1).px);
  return documentFrame(f.name, f.description, `<section class="section"><div class="section-intro"><h2>Base unit</h2><p>Use one base unit to keep padding, gaps, and alignment consistent.</p></div><div class="spacing-grid">${spacingCard(spacing.base, true, measureScale)}</div></section><section class="section"><div class="section-intro"><h2>Scale</h2><p>Use smaller steps within controls and larger steps between groups and sections.</p></div><div class="spacing-grid">${spacing.scale.map(step => spacingCard(step, false, measureScale)).join('')}</div></section>`, badge(f.status));
}
function spacingWorkspace(f) {
  const spacing = spacingFor(f);
  const measureScale = Math.min(1, 64 / spacing.density.at(-1).px);
  return `<section class="inspector-section"><h3>Base unit</h3><label class="spacing-field" for="space-base-rem"><span>Spacing</span><span class="spacing-unit-input"><input id="space-base-rem" type="number" min="0.0625" max="4" step="0.0625" value="${spacing.base.rem}" aria-label="Base spacing in rem" /><span>rem</span></span></label></section><section class="inspector-section"><h3>Density</h3><dl class="spacing-density">${spacing.density.map(step => `<div data-density="${step.multiple}"><dt>×${step.multiple}</dt><dd><span class="density-measure" style="width:${step.px * measureScale}px" aria-hidden="true"></span><code>${step.rem}rem (${step.px}px)</code></dd></div>`).join('')}</dl></section>`;
}

function colorDocument(f) {
  if (f.status !== 'ready') return documentFrame(f.name, f.description, emptyFoundation(f), badge(f.status));
  const mode = modeFor(f);
  return documentFrame(f.name, f.description, colorGroups(f).map(([key, rows]) => `<section class="section"><div class="section-intro"><h2>${escape(groupNames[key] || key)}</h2><p>${escape(groupDescriptions[key] || 'Color roles from your design system.')}</p></div><div class="color-grid">${rows.map(v => {
    const value = resultFor(v, mode);
    return previewCard(`<span>${escape(tokenLabel(v.name))}</span>`, `<span class="color-sample" data-color="${escape(valueText(value))}"></span>`, { interactive: true, className: `color-token-card ${v.name === selectedToken ? 'is-selected' : ''}`, stageClass: 'color-stage', attributes: `data-select-token="${escape(v.name)}" aria-pressed="${v.name === selectedToken}" aria-label="Select ${escape(v.name)}"`, caption: `<span class="specimen-caption"><code>${escape(v.name).replaceAll('/', '/<wbr>')}</code><small>${escape(valueText(value))}</small></span>` });
  }).join('')}</div></section>`).join('') || '<section class="section"><p>No semantic tokens match your filter.</p></section>', badge(f.status));
}

const property = (name, value) => `<div class="property"><dt>${escape(name)}</dt><dd>${escape(value)}</dd></div>`;
const field = (id, label, value, type = 'text', attrs = '') => `<label class="workspace-field" for="${id}"><span>${escape(label)}</span><input id="${id}" type="${type}" value="${escape(value)}" ${attrs} /></label>`;
function modeControls(f) {
  if (!f.modes.length) return '';
  const mode = modeFor(f);
  return `<div class="mode-switch" role="group" aria-label="${escape(f.name)} mode">${f.modes.map(m => `<button type="button" data-mode="${escape(m)}" aria-pressed="${m === mode}">${m === 'Light' ? icon('sun') : m === 'Dark' ? icon('moon') : ''}${escape(m)}</button>`).join('')}</div>`;
}
function colorWorkspace(f) {
  const mode = modeFor(f);
  return `<section class="inspector-section"><h3>Mode</h3>${modeControls(f)}</section><section class="inspector-section"><h3>Semantic tokens</h3><label class="search-field">${icon('search')}<input id="token-search" type="search" aria-label="Filter semantic tokens" placeholder="Find a token..." value="${escape(query)}" /></label><p class="workspace-help">Choose the primitive each role uses.</p></section>${colorGroups(f).map(([key, rows]) => `<details class="token-group" data-group="${escape(key)}" open><summary>${escape(groupNames[key] || key)}<span>${rows.length}</span></summary><div>${rows.map(v => {
    const i = f.variables.indexOf(v);
    const result = resultFor(v, mode);
    const value = valueText(result);
    const edited = draft.values.has(valueKey(v.name, mode));
    return `<div class="token-control ${v.name === selectedToken ? 'is-selected' : ''}" data-token-row="${escape(v.name)}"><label for="token-value-${i}" title="${escape(v.name)}"><span>${escape(tokenLabel(v.name))}</span>${edited ? '<small>Edited</small>' : ''}${!result.alias ? '<small class="custom-value-label">Custom value</small>' : ''}</label><button id="token-value-${i}" class="token-input token-binding" data-choose-primitive="${escape(v.name)}" aria-label="Choose primitive for ${escape(v.name)}" aria-haspopup="dialog" aria-controls="primitive-picker" title="${escape(result.error || (result.alias ? `Linked to ${result.alias}` : 'Custom value'))}"><span class="token-chip" data-color="${escape(value)}" aria-hidden="true"></span><span>${escape(result.alias?.replace(/^palette\//, '') || 'Custom value')}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><code class="token-path">${escape(v.name)}</code></div>`;
  }).join('')}</div></details>`).join('') || '<p class="workspace-help">No semantic tokens match your filter.</p>'}`;
}

function foundationWorkspace(f) {
  const filter = `<section class="inspector-section"><h3>Inspect</h3><label class="search-field">${icon('search')}<input id="token-search" type="search" aria-label="Filter foundation values" placeholder="Find a value..." value="${escape(query)}" /></label>${modeControls(f)}</section>`;
  if (f.status !== 'ready') return `<section class="inspector-section">${badge(f.status)}<p class="workspace-help">${escape(f.message)}</p></section>`;
  if (f.id === 'typography') {
    const choices = fontChoices(typeFamilies(f));
    const family = previewTypeface(f);
    const options = (name, families) => families.length ? `<optgroup label="${name}">${families.map(v => `<option value="${escape(v)}" ${family === v ? 'selected' : ''}>${escape(typefaceLabel(v))}</option>`).join('')}</optgroup>` : '';
    return `<section class="inspector-section"><h3>Typeface</h3><label class="workspace-field" for="type-family"><span>Preview family</span><select id="type-family">${options('System fonts', choices.system)}${options('Prepared fonts', choices.prepared)}</select></label><div class="workspace-font-sample" data-font="${escape(family)}">Aa Bb Cc</div><p id="type-font-status" class="workspace-help" role="status"></p><p class="workspace-help">${choices.system.length ? 'Your system font is selected by default. You can also preview a prepared font.' : 'No font specified. Choose Inter, Geist, or Plus Jakarta Sans.'}</p>${field('type-scale', 'Preview scale', draft.settings.get('type-scale') || 100, 'number', 'min="50" max="200" step="5"')}</section>${filter}`;
  }
  if (f.id === 'shape') return controls.radiusWorkspace(f);
  if (f.id === 'space') return spacingWorkspace(f);
  if (f.id === 'elevation') return controls.shadowWorkspace(f);
  if (f.id === 'motion') return motion.workspace(f) + filter.replace(modeControls(f), '');
  return filter;
}

function inspector(f) {
  if (state.setup && state.setup.status !== 'ready') return `<h2>Setup</h2><p class="workspace-help">Add context, answer any open questions, then review your foundations before publishing to Figma.</p><button class="button" data-open-setup>Open context</button>`;
  const identity = `<section class="inspector-section"><h3>Identity</h3>${field('ds-name', 'Name', displayName(), 'text', 'maxlength="80"')}<dl>${property('Input slug', state.inputSlug || state.slug)}</dl><label class="workspace-field" for="ds-product"><span>Product</span><select id="ds-product">${['Web', 'App', 'Web and App'].map(v => `<option ${v === (draft.product || state.product) ? 'selected' : ''}>${v}</option>`).join('')}</select></label></section><section class="inspector-section"><h3>Foundation output</h3><dl>${property('Variables', state.summary.variables)}${property('Collections', state.summary.collections)}${property('Text styles', state.summary.textStyles)}${property('Effect styles', state.summary.effectStyles)}</dl></section>`;
  return `<div class="workspace-panel-header"><h2>${escape(f?.id === 'shape' ? 'Radius' : f?.id === 'elevation' ? 'Shadow' : f?.name || 'System')}</h2><span class="label-beta">Preview</span></div><p class="workspace-disclaimer">Changes stay in this preview.</p>${f?.id === 'color' && f.status === 'ready' ? colorWorkspace(f) : f ? foundationWorkspace(f) : identity}<div class="workspace-reset"><button id="reset-preview" class="button">Reset preview</button><small>Nothing is saved to Figma or your files.</small></div>`;
}

function applySpecimens(f) {
  document.querySelectorAll('[data-color]').forEach(el => { if (CSS.supports('color', el.dataset.color)) el.style.backgroundColor = el.dataset.color; });
  const typography = state.foundations.find(f => f.id === 'typography');
  document.querySelectorAll('[data-font]').forEach(el => { const family = fontStack(previewTypeface(typography)); if (CSS.supports('font-family', family)) el.style.fontFamily = family; });
  document.querySelectorAll('[data-type-size]').forEach(el => { const size = Number(el.dataset.typeSize) * Number(draft.settings.get('type-scale') || 100) / 100; if (Number.isFinite(size) && size > 0) el.style.fontSize = `${Math.min(size, 96)}px`; });
  document.querySelectorAll('[data-measure]').forEach(el => { const size = Number(el.dataset.measure); if (Number.isFinite(size) && size >= 0) el.style.width = `${size}px`; });
  document.querySelectorAll('[data-radius]').forEach(el => { const size = Number(el.dataset.radius); if (Number.isFinite(size) && size >= 0) el.style.borderRadius = `${size}px`; });
  document.querySelectorAll('[data-effect]').forEach(el => {
    const style = f?.styles.find(s => s.name === el.dataset.effect);
    const value = style ? controls.cssFor(style) : 'none';
    if (CSS.supports('box-shadow', value)) el.style.boxShadow = value;
  });
  const fontStatus = $('type-font-status');
  if (fontStatus) {
    const family = previewTypeface(typography);
    if (!preparedFonts.some(font => font.family === family)) fontStatus.textContent = 'Using your system font';
    else {
      fontStatus.textContent = 'Loading font...';
      document.fonts.load(`400 16px ${JSON.stringify(family)}`).then(faces => {
        if ($('type-font-status') !== fontStatus) return;
        fontStatus.textContent = faces.some(face => face.status === 'loaded') ? `${family} ready` : 'Font unavailable. Try another family or reload.';
      }).catch(() => { if ($('type-font-status') === fontStatus) fontStatus.textContent = 'Font unavailable. Try another family or reload.'; });
    }
  }
}

function render() {
  if (!state) return;
  motion.stop();
  const active = document.activeElement;
  const focusId = active?.id;
  const selection = active instanceof HTMLInputElement && ['text', 'search'].includes(active.type) ? [active.selectionStart, active.selectionEnd] : null;
  const priorRoute = inspectorRoute;
  const changingInspector = inspectorRoute !== route();
  const panelScroll = changingInspector ? 0 : $('inspector').scrollTop;
  if (changingInspector) inspectorNeedsReset = true;
  inspectorRoute = route();
  const openGroups = new Map([...document.querySelectorAll('.token-group, .control-details')].map(el => [el.dataset.group || el.id, el.open]));
  const f = state.foundations.find(f => f.id === route());
  $('system-name').textContent = displayName();
  document.title = `${f?.name || 'Overview'} · ${displayName()} · DS Create Builder`;
  $('canvas-title').textContent = f?.name || 'Overview';
  $('canvas-subtitle').textContent = f?.id === 'color' ? `${modeFor(f) || 'Color'} palette · ${draft.values.size} preview changes` : f?.id === 'space' && f.status === 'ready' ? `Base spacing: ${spacingFor(f).base.rem}rem${draft.settings.has('space-base-rem') ? ' (preview)' : ' (default)'}` : f ? f.description : 'Your foundation workspace';
  $('figma-link').hidden = !state.figmaUrl;
  if (state.figmaUrl) $('figma-link').href = state.figmaUrl;
  $('preview-notice').hidden = !state.preview;
  renderNav();
  const warnings = state.warnings.map(w => `<div class="notice error-notice">${escape(w)}</div>`).join('');
  $('content').innerHTML = warnings + (route() === 'overview' ? overview() : f ? foundation(f) : documentFrame('View not found', 'Choose a foundation from the navigation.', '<div class="empty-state"><a class="button" href="#overview">Go to Overview</a></div>'));
  $('inspector').innerHTML = inspector(f);
  document.querySelectorAll('.token-group, .control-details').forEach(el => { const key = el.dataset.group || el.id; if (openGroups.has(key)) el.open = openGroups.get(key); });
  $('inspector').scrollTop = panelScroll;
  if ($('inspector').getClientRects().length) inspectorNeedsReset = false;
  applySpecimens(f);
  controls.syncInspector();
  controls.syncDialog();
  setup.visibility();
  canvas.refresh(route());
  if (changingInspector && priorRoute) { revealInteraction($('content').querySelector('.docs-reading-card')); revealInteraction($('inspector')); }
  if ($('primitive-picker').open) renderPrimitiveOptions();
  if (focusId && $(focusId) && $(focusId) !== active) {
    $(focusId).focus({ preventScroll: true });
    if (selection && $(focusId) instanceof HTMLInputElement) $(focusId).setSelectionRange(...selection);
  }
  $('announcer').textContent = `${f?.name || 'Init'}: ${labels[f?.status || state.status]}`;
}

async function refresh() {
  if (fetching) return;
  fetching = true;
  try {
    const response = await fetch('/api/state', { cache: 'no-store', signal: AbortSignal.timeout(4500) });
    if (!response.ok) throw new Error('State unavailable');
    const next = await response.json();
    $('connection-error').hidden = true;
    const nextSignature = JSON.stringify(next);
    publisher.update(next);
    if (state?.system !== next.system) draft.name = null;
    if (nextSignature !== signature) { state = next; signature = nextSignature; render(); }
  } catch {
    publisher.update(null);
    $('connection-error').hidden = false;
    if (!state) $('content').innerHTML = documentFrame('Waiting for your workspace', 'The local server is not responding.', '<div class="empty-state"><p>Retry the connection, or restart DS Create Builder from your agent.</p></div>');
  } finally { fetching = false; }
}

function theme(value) {
  document.documentElement.dataset.theme = value;
  $('theme').innerHTML = icon(value === 'dark' ? 'sun' : 'moon');
  $('theme').setAttribute('aria-label', `Switch to ${value === 'dark' ? 'light' : 'dark'} appearance`);
  try { localStorage.setItem('ds-manager-theme', value); } catch { /* storage unavailable */ }
}
let savedTheme;
try { savedTheme = localStorage.getItem('ds-manager-theme'); } catch { /* use system preference */ }
theme(savedTheme === 'dark' || !savedTheme && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
$('theme').addEventListener('click', () => theme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
installInteractionMotion();
const publisher = setupPublish();
const setup = setupWeb({ onChange: refresh });
$('search-icon').innerHTML = icon('search');
$('nav-search').addEventListener('input', renderNav);
$('retry').addEventListener('click', refresh);
document.querySelector('.skip-link').addEventListener('click', e => { e.preventDefault(); $('main').focus(); });
let pickerTarget;
function renderPrimitiveOptions() {
  const f = state.foundations.find(f => f.id === 'color');
  const token = f.variables.find(v => v.name === pickerTarget?.name);
  if (!token) return;
  const term = $('primitive-picker-search').value.trim().toLowerCase();
  const all = primitiveColors(f);
  const matches = all.filter(p => p.name.toLowerCase().includes(term));
  const alias = resultFor(token, modeFor(f)).alias;
  $('primitive-picker-options').innerHTML = matches.map(p => {
    const result = savedResult(p, modeFor(f));
    return `<button type="button" role="option" aria-selected="${p.name === alias}" data-primitive-option="${escape(p.name)}" ${result.error ? 'disabled' : ''}><span class="token-chip" data-color="${escape(valueText(result))}" aria-hidden="true"></span><span>${escape(p.name)}</span>${p.name === alias ? icon('check') : ''}</button>`;
  }).join('') || '<p class="primitive-empty">No primitives match. Try another name.</p>';
  $('primitive-picker-options').querySelectorAll('[data-color]').forEach(el => {
    if (CSS.supports('color', el.dataset.color)) el.style.backgroundColor = el.dataset.color;
  });
  $('primitive-picker-count').textContent = `${matches.length} of ${all.length} primitives`;
}
function openPrimitivePicker(trigger) {
  pickerTarget = { name: trigger.dataset.choosePrimitive, triggerId: trigger.id };
  $('primitive-picker-role').textContent = pickerTarget.name;
  $('primitive-picker-search').value = '';
  renderPrimitiveOptions();
  const picker = $('primitive-picker');
  openDialog(picker);
  const box = trigger.getBoundingClientRect();
  picker.style.left = `${Math.max(12, Math.min(box.right - picker.offsetWidth, innerWidth - picker.offsetWidth - 12))}px`;
  picker.style.top = `${Math.max(12, Math.min(box.bottom + 8, innerHeight - picker.offsetHeight - 12))}px`;
  $('primitive-picker-search').focus();
}
$('primitive-picker-search').addEventListener('input', renderPrimitiveOptions);
$('primitive-picker-close').addEventListener('click', () => closeDialog($('primitive-picker')));
$('primitive-picker').addEventListener('close', () => {
  const trigger = $(pickerTarget?.triggerId);
  if (trigger) trigger.focus({ preventScroll: true });
});
$('primitive-picker').addEventListener('click', e => {
  if (e.target !== $('primitive-picker')) return;
  const box = e.target.getBoundingClientRect();
  if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) closeDialog(e.target);
});
$('primitive-picker-options').addEventListener('click', e => {
  const option = e.target.closest('[data-primitive-option]');
  if (!option || option.disabled) return;
  const f = state.foundations.find(f => f.id === 'color');
  const token = f.variables.find(v => v.name === pickerTarget.name);
  const key = valueKey(token.name, modeFor(f));
  if (savedResult(token, modeFor(f)).alias === option.dataset.primitiveOption) draft.values.delete(key);
  else draft.values.set(key, { alias: option.dataset.primitiveOption });
  selectedToken = token.name;
  render();
  closeDialog($('primitive-picker'));
});
$('primitive-picker').addEventListener('keydown', e => {
  if (e.key === 'Escape') { e.preventDefault(); closeDialog($('primitive-picker')); return; }
  const options = [...$('primitive-picker-options').querySelectorAll('button:not(:disabled)')];
  if (!options.length) return;
  const i = options.indexOf(document.activeElement);
  let next;
  if (e.key === 'ArrowDown') next = options[(i + 1) % options.length];
  else if (e.key === 'ArrowUp') next = options[i < 0 ? options.length - 1 : (i - 1 + options.length) % options.length];
  else if (i >= 0 && e.key === 'Home') next = options[0];
  else if (i >= 0 && e.key === 'End') next = options.at(-1);
  if (next) { e.preventDefault(); next.focus(); next.scrollIntoView({ block: 'nearest' }); }
});
$('inspector').addEventListener('input', e => {
  if (motion.input(e)) return;
  const target = e.target;
  if (target.id === 'token-search') { query = target.value; render(); }
  else if (target.id === 'ds-name') { draft.name = target.value; render(); }
  else if (['space-base-rem', 'type-scale'].includes(target.id)) {
    if (!target.validity.valid || target.value === '') return;
    draft.settings.set(target.id, Number(target.value)); render();
  }
});
$('inspector').addEventListener('change', e => {
  if (motion.change(e)) return;
  const target = e.target;
  if (target.id === 'ds-product') { draft.product = target.value; }
  else if (target.id === 'type-family') { draft.settings.set('family', target.value); render(); }
});
$('inspector').addEventListener('click', e => {
  if (motion.click(e)) return;
  const trigger = e.target.closest('[data-choose-primitive]');
  if (trigger) { openPrimitivePicker(trigger); return; }
  const mode = e.target.closest('[data-mode]');
  if (mode) { selectedMode = mode.dataset.mode; render(); }
  if (e.target.closest('#reset-preview')) { draft.name = null; draft.product = null; draft.values.clear(); draft.settings.clear(); render(); }
});
$('content').addEventListener('click', e => {
  if (motion.click(e)) return;
  const token = e.target.closest('[data-select-token]');
  if (!token) return;
  selectedToken = token.dataset.selectToken;
  render();
  const row = [...document.querySelectorAll('[data-token-row]')].find(el => el.dataset.tokenRow === selectedToken);
  if (row) { row.closest('details').open = true; row.scrollIntoView({ block: 'nearest' }); row.querySelector('[data-choose-primitive]').focus({ preventScroll: true }); }
});
controls = createFoundationControls({ foundation: id => state?.foundations.find(f => f.id === id), draft, resultFor, savedResult, modeFor, valueKey, escape, icon, previewCard, modeControls, updatePreview: () => {
  const f = state.foundations.find(f => f.id === route());
  if (!f || !['shape', 'elevation'].includes(f.id)) return;
  const warnings = state.warnings.map(w => `<div class="notice error-notice">${escape(w)}</div>`).join('');
  $('content').innerHTML = warnings + foundation(f); applySpecimens(f); canvas.refresh(route());
} });
motion = createMotionPreview({ draft, resultFor, modeFor, escape, previewCard, modeControls, renderAll: render, renderCanvas: () => {
  motion.stop();
  const f = state.foundations.find(f => f.id === 'motion');
  $('content').innerHTML = state.warnings.map(w => `<div class="notice error-notice">${escape(w)}</div>`).join('') + foundation(f);
  canvas.refresh(route());
} });
const canvas = createCanvas($('canvas-viewport'), $('canvas-world'), camera => {
  const select = $('canvas-zoom');
  select.querySelector('[data-custom]')?.remove();
  const value = String(camera.scale);
  if (![...select.options].some(o => o.value === value)) {
    const option = new Option(`${Math.round(camera.scale * 100)}%`, value);
    option.dataset.custom = 'true'; select.add(option);
  }
  select.value = value;
});
$('zoom-in').addEventListener('click', () => canvas.zoom(canvas.get().scale * 1.2));
$('zoom-out').addEventListener('click', () => canvas.zoom(canvas.get().scale / 1.2));
$('canvas-fit').addEventListener('click', () => canvas.fit());
$('canvas-zoom').addEventListener('change', e => canvas.zoom(Number(e.target.value)));
$('workspace-toggle').addEventListener('click', () => { const open = $('inspector').classList.toggle('is-open'); $('workspace-toggle').setAttribute('aria-expanded', String(open)); if (open) revealInteraction($('inspector'), 'step'); if (open && inspectorNeedsReset) { $('inspector').scrollTop = 0; inspectorNeedsReset = false; } });
window.addEventListener('hashchange', () => { if ($('primitive-picker').open) closeDialog($('primitive-picker'), { immediate: true }); controls.close(); query = ''; render(); if (!$('preparation-view').contains(document.activeElement)) $('main').focus({ preventScroll: true }); if (matchMedia('(max-width: 767px)').matches) $('navigation').open = false; });
const narrow = matchMedia('(max-width: 767px)');
$('navigation').open = !narrow.matches;
narrow.addEventListener('change', e => { $('navigation').open = !e.matches; });
async function poll() { await refresh(); setTimeout(poll, document.hidden ? 5000 : 1500); }
poll();
