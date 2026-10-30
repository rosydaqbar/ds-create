// Parts in Builder: an Overview section with Prepare Parts, and an interactive review page per Part
// rendered from the locally compiled draft (no Figma needed until Publish Parts).
// Playground choices are browser previews; token and style choices save to the draft as soon as they are made.
const statusLabels = { 'not-prepared': 'Not prepared', review: 'Review', outdated: 'Prepare again', synced: 'In Figma' };
const statusTone = { 'not-prepared': 'pending', review: 'review', outdated: 'error', synced: 'ready' };
const defaults = () => ({ size: 'md', emphasis: 'primary', tone: 'brand', state: 'rest', iconOnly: false, leading: false, trailing: false, loadingText: true, label: 'Button' });
// No selection shows the Part overview in the panel; a type card or variant cell selects one button.
const view = { selected: null, cards: {}, edits: { treatments: {}, sizes: {} } };
// Each type card (Tone × Emphasis) keeps its own settings; the panel controls the selected card.
const card = key => { if (!view.cards[key]) { const [tone, emphasis] = key.split('|'); view.cards[key] = { ...defaults(), tone, emphasis }; } return view.cards[key]; };
Object.defineProperty(view, 'selection', { get: () => card(view.selected || 'brand|primary') });

export function partStatus(part, badge) { return badge(statusTone[part.status] || 'pending', statusLabels[part.status] || part.status); }

export function overviewParts(parts = [], { escape, badge, icon }) {
  if (!parts.length) return '';
  const canPrepare = parts.some(p => p.canPrepare), reason = parts.find(p => p.reason)?.reason || '';
  return `<section class="section" aria-labelledby="parts-heading"><div class="section-heading"><h2 id="parts-heading">Parts</h2><small>${parts.filter(p => p.status === 'review' || p.status === 'synced').length} of ${parts.length} prepared</small></div>
    <p class="setup-note">Parts are the smallest interactive pieces, built from your foundations. Prepare them here, review every variant, then publish them to Figma.</p>
    <div class="foundation-list">${parts.map(p => `<a class="foundation-row" href="#part-${escape(p.id)}">${icon('overview')}<div><strong>${escape(p.page)} ${escape(p.name)}</strong><small>${escape(p.description)}</small></div><div class="row-meta">${p.variantCount ? `<span class="count">${p.variantCount} variants</span>` : ''}${partStatus(p, badge)}</div></a>`).join('')}</div>
    <div class="parts-actions"><button class="button button-primary" type="button" data-prepare-parts ${canPrepare ? '' : 'disabled'}>${parts.some(p => p.status === 'review') && !parts.some(p => p.status === 'not-prepared' || p.status === 'outdated') ? 'Prepare Parts again' : 'Prepare Parts'}</button>${canPrepare ? '' : `<small>${escape(reason)}</small>`}<span class="parts-feedback" role="status" aria-live="polite" data-parts-feedback></span></div>
  </section>`;
}

const px = n => `${Number(n) || 0}px`;
import { openDialog, closeDialog } from '../ui-motion.mjs';
// Plain words for people; the property values stay exact in the Properties table and Figma.
const words = { xs: 'Extra small', sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra large', rest: 'Normal', hover: 'Hover', pressed: 'Pressed', focus: 'Focused', disabled: 'Disabled', loading: 'Loading', primary: 'Primary', secondary: 'Secondary', tertiary: 'Tertiary', brand: 'Brand', danger: 'Danger', body: 'Body', heading: 'Heading', display: 'Display', regular: 'Regular', medium: 'Medium', bold: 'Bold' };
const say = v => words[v] || v;
const valueOf = (d, kind, name) => name ? d.preview.options[kind].find(o => o.name === name)?.value ?? null : null;
const tokensFor = (d, tone, em, state) => ({ ...d.treatments[tone][em][state], ...(view.edits.treatments[`${tone}|${em}|${state}`] || {}) });
const sizeTokens = (d, size) => { const s = d.sizes.find(x => x.size === size), e = view.edits.sizes[size] || {}; return { ...s, ...e, padding: { ...s.padding, ...(e.padding || {}) } }; };
const treatmentFor = (d, tone, em, state) => { const t = tokensFor(d, tone, em, state); return { fill: valueOf(d, 'fill', t.fill), border: valueOf(d, 'border', t.border), text: valueOf(d, 'text', t.text), icon: valueOf(d, 'icon', t.icon), shadow: valueOf(d, 'effect', t.effect) }; };
const sizeFor = (d, size) => { const t = sizeTokens(d, size), base = d.preview.sizes.find(x => x.size === size);
  return { ...base, height: valueOf(d, 'height', t.height), padding: Object.fromEntries(Object.entries(t.padding).map(([k, v]) => [k, valueOf(d, 'space', v)])), gap: valueOf(d, 'space', t.gap), radius: valueOf(d, 'radius', t.radius), label: valueOf(d, 'label', t.label) }; };
const glyphs = { plus: '<path d="M12 5v14M5 12h14"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', spinner: '<path d="M20 12a8 8 0 1 1-8-8"/>' };
const glyph = (name, size, color, escape) => `<svg viewBox="0 0 24 24" width="${Number(size) || 20}" height="${Number(size) || 20}" aria-hidden="true" style="stroke:${escape(color)};fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex:none">${glyphs[name]}</svg>`;

function buttonCell(size, t, o, escape) {
  const label = size.label || {}, loading = o.state === 'loading', iconOnly = o.iconOnly;
  const pad = size.padding || {}, style = [`height:${px(size.height)}`, iconOnly ? `width:${px(size.height)}` : `padding:${px(pad.top)} ${px(pad.right)} ${px(pad.bottom)} ${px(pad.left)}`, `gap:${px(size.gap)}`, `border-radius:${px(size.radius)}`,
    `background:${t.fill || 'transparent'}`, `color:${t.text}`, `border:${px(size.borderWidth)} solid ${t.border || 'transparent'}`,
    t.shadow ? `box-shadow:${t.shadow}` : '', `font-family:'${String(label.fontFamily || '').replace(/'/g, '')}', system-ui, sans-serif`, `font-size:${px(label.fontSize)}`, `line-height:${px(label.lineHeight)}`, `font-weight:${Number(label.weight) || 400}`, `letter-spacing:${px(label.letterSpacing)}`].filter(Boolean).join(';');
  const text = `<span style="padding:0 ${px(size.inset)}">${escape(o.label ?? 'Button')}</span>`;
  const content = iconOnly ? glyph(loading ? 'spinner' : 'plus', size.icon, t.icon, escape)
    : loading ? glyph('spinner', size.icon, t.icon, escape) + (o.loadingText === false ? '' : text)
    : (o.leading ? glyph('plus', size.icon, t.icon, escape) : '') + text + (o.trailing ? glyph('arrow', size.icon, t.icon, escape) : '');
  return `<span class="part-button" style="${escape(style)}">${content}</span>`;
}

function emptyPart(part, { escape, badge, documentFrame }) {
  return documentFrame(`${part.page} ${part.name}`, part.description, `<div class="empty-state"><h2>${part.status === 'outdated' ? 'Your foundations changed' : 'Not prepared yet'}</h2><p>${part.status === 'outdated' ? 'Prepare this Part again so it uses the current foundations.' : 'Prepare Parts to build every variant from your published foundations.'}</p><button class="button button-primary" type="button" data-prepare-parts ${part.canPrepare ? '' : 'disabled'}>Prepare Parts</button>${part.canPrepare ? '' : `<small>${escape(part.reason || '')}</small>`}<span class="parts-feedback" role="status" aria-live="polite" data-parts-feedback></span></div>`, partStatus(part, badge));
}

export function partPage(part, helpers) {
  const { escape, badge, documentFrame, previewCard } = helpers;
  if (!part) return documentFrame('Part not found', 'Choose a Part from the navigation.', '<div class="empty-state"><a class="button" href="#overview">Go to Overview</a></div>');
  if (!part.draft) return emptyPart(part, helpers);
  const d = part.draft, p = d.preview, states = d.properties.find(x => x.name === 'State').values, sel = view.selection;
  const cell = (tone, em, size, s, iconOnly) => {
    const chosen = !!view.selected && sel.tone === tone && sel.emphasis === em && sel.size === size && sel.state === s && sel.iconOnly === iconOnly;
    return `<button type="button" class="part-cell${chosen ? ' is-selected' : ''}" role="cell" data-part-cell="${escape([tone, em, size, s, iconOnly].join('|'))}" aria-label="${escape(`${tone} ${em} ${size} ${s}${iconOnly ? ' icon only' : ''}`)}" aria-pressed="${chosen}">${buttonCell(sizeFor(d, size), treatmentFor(d, tone, em, s), { iconOnly, state: s }, escape)}</button>`;
  };
  const block = (tone, iconOnly) => `<div class="part-matrix" role="table" aria-label="${escape(tone)} ${iconOnly ? 'icon-only ' : ''}buttons"><div class="part-matrix-row part-matrix-head" role="row"><span role="columnheader"></span>${states.map(s => `<span role="columnheader">${escape(say(s))}</span>`).join('')}</div>
    ${Object.keys(p.treatments[tone]).map(em => p.sizes.map(size => `<div class="part-matrix-row" role="row"><span role="rowheader">${escape(say(em))} · ${escape(say(size.size))}</span>${states.map(s => cell(tone, em, size.size, s, iconOnly)).join('')}</div>`).join('')).join('')}</div>`;
  const body = `
    <section class="section" aria-labelledby="part-types"><div class="section-intro"><h2 id="part-types">Button types</h2><p>Primary is for the main action on a screen, Secondary for supporting actions, Tertiary for quiet ones. Click a card to change its size, state, icons and label in the panel.</p></div>
      ${['brand', 'danger'].map(tone => `<h3 class="part-subheading">${tone === 'brand' ? 'Brand · everyday actions' : 'Danger · destructive actions'}</h3><div class="part-type-grid">${Object.keys(p.treatments[tone]).map(em => {
        const key = `${tone}|${em}`, c = card(key), chosen = view.selected === key;
        return previewCard(`<span>${escape(em[0].toUpperCase() + em.slice(1))}</span>`, buttonCell(sizeFor(d, c.size), treatmentFor(d, tone, em, c.state), c, escape),
          { interactive: true, className: `part-type-card ${chosen ? 'is-selected' : ''}`, stageClass: 'part-type-stage', attributes: `data-part-type="${escape(key)}" aria-pressed="${chosen}" aria-label="Select ${escape(tone)} ${escape(em)} button"`,
            caption: `<span class="specimen-caption">${escape(`${say(c.size)} · ${say(c.state)}${c.iconOnly ? ' · Icon only' : ''}`)}</span>` });
      }).join('')}</div>`).join('')}</section>
    <section class="section" aria-labelledby="part-decisions"><div class="section-heading"><h2 id="part-decisions">Choices we made for you</h2><small>Version ${d.revision} · ${d.variantCount} button variations</small></div>
      <ul class="part-decisions">${d.decisions.map(x => `<li><strong>${escape(x.key)}:</strong> ${escape(x.value)}<small>${escape(x.reason || '')}</small></li>`).join('')}${d.notes.length ? `<li><strong>Some hover colors stay the same.</strong><small>Your colors have no separate hover shade for ${escape([...new Set(d.notes.map(n => n.split(' → ')[0].split('/').slice(1, 3).join(' ')))].join(', '))}, so those buttons keep their normal color when hovered.</small></li>` : ''}</ul></section>
    ${['brand', 'danger'].map(tone => `<section class="section" aria-labelledby="part-${tone}"><div class="section-heading"><h2 id="part-${tone}">${tone === 'brand' ? 'All brand buttons' : 'All danger buttons'}</h2></div>${block(tone, false)}<h3 class="part-subheading">Icon only</h3>${block(tone, true)}</section>`).join('')}`;
  // The page card wraps everything; selecting it (no button chosen) shows the Part overview in the panel.
  return documentFrame(`${part.page} ${part.name}`, part.description, body, partStatus(part, badge))
    .replace('<article class="docs-reading-card"', `<article tabindex="0" data-part-wrapper aria-label="${escape(part.name)} page" class="docs-reading-card part-page${view.selected ? '' : ' is-selected'}"`);
}

// The right-hand panel: the same Preview workspace pattern as the foundations.
export function partInspector(part, { escape }) {
  const overview = part?.draft && !view.selected;
  const head = overview ? `<div class="workspace-panel-header"><h2>${escape(part.name)}</h2><span class="label-beta">Overview</span></div><p class="workspace-disclaimer">Every choice is kept as soon as you make it.</p>` : `<div class="workspace-panel-header"><h2>${escape(part?.draft ? `${view.selection.emphasis[0].toUpperCase() + view.selection.emphasis.slice(1)} ${view.selection.tone} button` : part?.name || 'Part')}</h2><span class="label-beta">Preview</span></div><p class="workspace-disclaimer">Every choice is kept as soon as you make it.</p>`;
  if (!part?.draft) return head + `<section class="inspector-section"><p class="workspace-help">${escape(part?.status === 'outdated' ? 'Prepare this Part again to use the current foundations.' : 'Prepare Parts to review and adjust this Part.')}</p></section>`;
  const d = part.draft, p = d.preview, sel = view.selection, prop = name => d.properties.find(x => x.name === name).values;
  const select = (key, label, values) => `<label class="workspace-field" for="part-${key}"><span>${escape(label)}</span><select id="part-${key}" data-part-control="${key}">${values.map(v => `<option value="${escape(v)}" ${sel[key] === v ? 'selected' : ''}>${escape(say(v))}</option>`).join('')}</select></label>`;
  const toggle = (key, label, disabled = false) => `<label class="part-toggle" for="part-${key}"><input id="part-${key}" type="checkbox" data-part-control="${key}" ${sel[key] ? 'checked' : ''} ${disabled ? 'disabled' : ''}/><span>${escape(label)}</span></label>`;
  const t = tokensFor(d, sel.tone, sel.emphasis, sel.state), z = sizeTokens(d, sel.size), key = `${sel.tone}|${sel.emphasis}|${sel.state}`;
  // Every control is a token binding like the foundation color rows: a chip button that opens a token picker.
  const chip = (kind, value) => kind === 'fill' || kind === 'border' || kind === 'text' || kind === 'icon' ? `<span class="token-chip" style="background:${escape(value || 'transparent')}" aria-hidden="true"></span>`
    : kind === 'effect' ? `<span class="token-chip part-chip-effect" style="box-shadow:${escape(value || 'none')}" aria-hidden="true"></span>` : `<span class="token-chip part-chip-text" aria-hidden="true">${kind === 'label' ? 'Aa' : '↔'}</span>`;
  const short = (kind, name) => name ? name.replace(/^color\//, '').replace(/^type\//, '') : 'None';
  const shownValue = (kind, value) => value === null || value === undefined ? '' : kind === 'label' ? `${value.fontSize}px` : typeof value === 'number' ? `${value}px` : kind === 'effect' ? '' : String(value);
  const binding = (id, label, kind, name, attrs, optional = false) => { const value = valueOf(d, kind, name);
    return `<div class="token-control part-binding"><label for="${id}"><span>${escape(label)}</span>${shownValue(kind, value) ? `<small class="custom-value-label">${escape(shownValue(kind, value))}</small>` : ''}</label><button id="${id}" type="button" class="token-input token-binding" data-part-pick="${kind}" data-label="${escape(label)}" data-current="${escape(name || '')}" ${optional ? 'data-optional="true"' : ''} ${attrs} aria-haspopup="dialog" aria-label="Choose a token for ${escape(label)}" title="${escape(name || 'None')}">${chip(kind, value)}<span>${escape(short(kind, name))}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>`; };
  const color = (field, label, kind, optional) => binding(`part-${field}`, label, kind, t[field], `data-part-token="${escape(key)}" data-field="${field}"`, optional);
  const measure = (field, label, kind, value, side) => binding(`part-${field}${side ? '-' + side : ''}`, label, kind, value, `data-part-size="${escape(sel.size)}" data-field="${field}"${side ? ` data-side="${side}"` : ''}`);
  // Inner spacing reads like the button itself: each side sits where it applies, around a small label.
  const side = s => { const name = z.padding[s], value = valueOf(d, 'space', name);
    return `<button id="part-padding-${s}" type="button" class="part-side part-side-${s}" data-part-pick="space" data-label="Spacing ${s}" data-current="${escape(name)}" data-part-size="${escape(sel.size)}" data-field="padding" data-side="${s}" aria-haspopup="dialog" aria-label="Spacing ${s}: ${escape(name)}" title="${escape(name)}"><span>${escape(name.replace(/^space\//, ''))}</span><small>${escape(value ?? 0)}px</small></button>`; };
  // Shared across every size: one corner token, and a text style + weight whose size step still follows the button size.
  const label = z.label.match(/^type\/([^/]+)\/[^/]+\/([^/]+)$/) || [], family = label[1], weight = label[2];
  const families = [...new Set(p.options.label.map(o => o.name.split('/')[1]))], weights = p.options.label.filter(o => o.name.split('/')[1] === family).map(o => o.name.split('/')[3]);
  const segment = (key, values, current, enabled = values) => `<div class="mode-switch" role="group" aria-label="${escape(key)}">${values.map(v => `<button type="button" data-part-text="${escape(key)}" data-value="${escape(v)}" aria-pressed="${v === current}" ${enabled.includes(v) ? '' : 'disabled'}>${escape(say(v))}</button>`).join('')}</div>`;
  const allWeights = [...new Set(p.options.label.map(o => o.name.split('/')[3]))];
  const global = `<section class="inspector-section"><h3>Global Appearance</h3><p class="workspace-help">Applies to every size and type.</p>
      ${binding('part-radius-all', 'Corners', 'radius', z.radius, 'data-part-global="radius"')}
      <div class="part-text-control"><span>Text style</span>${segment('family', families, family)}</div>
      <div class="part-text-control"><span>Weight</span>${segment('weight', allWeights, weight, weights)}</div>
      <p class="workspace-help">Text size follows each button size. Pick a button to set it.</p></section>`;
  // Text size for the selected button size: the steps its text style offers, shown as pixel sizes.
  const stepOrder = ['xs', 'sm', 'md', 'lg', 'xl'], step = z.label.split('/')[2];
  const sizesHere = stepOrder.map(st => p.options.label.find(o => o.name === `type/${family}/${st}/${weight}`) || p.options.label.find(o => o.name.split('/')[1] === family && o.name.split('/')[2] === st)).filter(Boolean);
  const textSize = `<div class="part-text-control"><span>Text size</span><div class="mode-switch" role="group" aria-label="Text size">${sizesHere.map(o => `<button type="button" data-part-text="step" data-value="${escape(o.name)}" aria-pressed="${o.name.split('/')[2] === step}" title="${escape(o.name)}">${escape(o.value.fontSize)}px</button>`).join('')}</div></div>`;
  const spacing = `<div class="part-spacing-control"><span class="part-spacing-title">Inner spacing</span><div class="part-spacing">${side('top')}${side('left')}<span class="part-spacing-label" aria-hidden="true">Label</span>${side('right')}${side('bottom')}</div></div>`;
  const body = head + `
    <section class="inspector-section"><h3>Properties</h3>${select('size', 'Size', prop('Size'))}${select('emphasis', 'Emphasis', prop('Emphasis'))}${select('tone', 'Tone', prop('Tone'))}${select('state', 'State', prop('State'))}
      ${toggle('iconOnly', 'Icon only, no label')}${toggle('leading', 'Icon before the label', sel.iconOnly)}${toggle('trailing', 'Icon after the label', sel.iconOnly)}${toggle('loadingText', 'Keep the label while loading', sel.state !== 'loading' || sel.iconOnly)}
      <label class="workspace-field" for="part-label"><span>Label</span><input id="part-label" type="text" maxlength="40" value="${escape(sel.label)}" data-part-control="label" ${sel.iconOnly ? 'disabled' : ''}/></label></section>
    <section class="inspector-section"><h3>Colors</h3><p class="workspace-help">For ${escape(`${say(sel.emphasis)} ${say(sel.tone).toLowerCase()} buttons, ${say(sel.state).toLowerCase()}`)}. Each state has its own colors.</p>
      ${color('fill', 'Background', 'fill')}${color('border', 'Outline', 'border', true)}${color('text', 'Text color', 'text')}${color('icon', 'Icon color', 'icon')}${color('effect', 'Shadow', 'effect', true)}</section>
    <section class="inspector-section"><h3>Size</h3><p class="workspace-help">For every ${escape(say(sel.size).toLowerCase())} button.</p>
      ${measure('height', 'Height', 'height', z.height)}${textSize}
      ${spacing}
      ${measure('gap', 'Icon gap', 'space', z.gap)}</section>`;
  const reset = `<div class="workspace-reset"><button type="button" class="button" data-part-reset>Reset</button><small>Puts every color and size back to the choices we made for you.</small><p class="workspace-help part-save-status" data-part-save-status role="status"></p></div>`;
  const types = Object.keys(p.treatments).length * Object.keys(p.treatments.brand).length, statesCount = prop('State').length;
  if (overview) return head + `
    <section class="inspector-section"><h3>Summary</h3><dl><div class="property"><dt>Status</dt><dd>${escape(statusLabels[part.status] || part.status)}</dd></div><div class="property"><dt>Button types</dt><dd>${types}</dd></div><div class="property"><dt>Sizes</dt><dd>${d.sizes.length}</dd></div><div class="property"><dt>States</dt><dd>${statesCount}</dd></div><div class="property"><dt>Variations</dt><dd>${d.variantCount}</dd></div><div class="property"><dt>Version</dt><dd>${d.revision}</dd></div></dl>
      <p class="workspace-help">Click a button type or a variation on the page to change its colors and size.</p></section>
    ${global}${reset}`;
  return body + reset;
}

// One picker for every Part binding, built like the foundation primitive picker.
function pickerDialog() {
  let dialog = document.getElementById('part-token-picker');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'part-token-picker'; dialog.className = 'primitive-picker'; dialog.setAttribute('aria-labelledby', 'part-token-picker-title');
  dialog.innerHTML = `<div class="primitive-picker-header"><h2 id="part-token-picker-title">Choose token</h2><button type="button" class="icon-button" data-part-picker-close aria-label="Close token picker"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
    <p data-part-picker-role></p><label class="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" data-part-picker-search aria-label="Search tokens" placeholder="Search tokens..."/></label>
    <div class="primitive-picker-options" role="listbox" aria-label="Tokens" data-part-picker-options></div><div class="primitive-picker-count" role="status" data-part-picker-count></div>`;
  document.body.append(dialog);
  return dialog;
}

export function setupParts({ getState, refresh, render }) {
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let target = null;
  const currentPart = () => (getState()?.parts || []).find(p => location.hash === '#part-' + p.id);
  function renderOptions() {
    const dialog = pickerDialog(), d = currentPart()?.draft; if (!d || !target) return;
    const term = dialog.querySelector('[data-part-picker-search]').value.trim().toLowerCase(), all = d.preview.options[target.kind];
    const matches = all.filter(o => o.name.toLowerCase().includes(term)), colorKind = ['fill', 'border', 'text', 'icon'].includes(target.kind);
    const chipFor = o => colorKind ? `<span class="token-chip" style="background:${esc(o.value)}" aria-hidden="true"></span>` : target.kind === 'effect' ? `<span class="token-chip part-chip-effect" style="box-shadow:${esc(o.value)}" aria-hidden="true"></span>` : `<span class="token-chip part-chip-text" aria-hidden="true">${target.kind === 'label' ? 'Aa' : '↔'}</span>`;
    const detail = o => target.kind === 'label' ? `${o.value?.fontSize}px` : typeof o.value === 'number' ? `${o.value}px` : colorKind ? o.value : '';
    const check = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
    dialog.querySelector('[data-part-picker-options]').innerHTML = (target.optional ? `<button type="button" role="option" aria-selected="${!target.current}" data-part-option=""><span class="token-chip" aria-hidden="true"></span><span>None</span>${!target.current ? check : ''}</button>` : '')
      + matches.map(o => `<button type="button" role="option" aria-selected="${o.name === target.current}" data-part-option="${esc(o.name)}">${chipFor(o)}<span>${esc(o.name)}</span><small class="part-option-value">${esc(detail(o))}</small>${o.name === target.current ? check : ''}</button>`).join('')
      || '<p class="primitive-empty">No tokens match. Try another name.</p>';
    dialog.querySelector('[data-part-picker-count]').textContent = `${matches.length} of ${all.length} tokens`;
  }
  function openPicker(trigger) {
    const dialog = pickerDialog();
    target = { kind: trigger.dataset.partPick, current: trigger.dataset.current, optional: trigger.dataset.optional === 'true', triggerId: trigger.id, apply: { ...trigger.dataset } };
    dialog.querySelector('[data-part-picker-role]').textContent = trigger.dataset.label;
    dialog.querySelector('[data-part-picker-search]').value = '';
    renderOptions(); openDialog(dialog);
    const box = trigger.getBoundingClientRect();
    dialog.style.left = `${Math.max(12, Math.min(box.right - dialog.offsetWidth, innerWidth - dialog.offsetWidth - 12))}px`;
    dialog.style.top = `${Math.max(12, Math.min(box.bottom + 8, innerHeight - dialog.offsetHeight - 12))}px`;
    dialog.querySelector('[data-part-picker-search]').focus();
    dialog.querySelector('[data-part-option][aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }
  // Choices save on their own; quick picks queue up and the newest save carries every pending edit.
  let saving = Promise.resolve(), latest = 0, resetPending = false;
  function persist({ reset = false } = {}) {
    const mine = ++latest; resetPending ||= reset;
    saving = saving.then(async () => {
      if (mine !== latest) return;
      const state = getState(), part = currentPart(), status = () => document.querySelector('[data-part-save-status]');
      try {
        const response = await fetch('/api/parts-update', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DS-Create-Token': state?.csrfToken || '' }, body: JSON.stringify({ id: part?.id, overrides: view.edits, ...(resetPending ? { reset: true } : {}) }), signal: AbortSignal.timeout(30000) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'This choice could not be kept. Try it again.');
        resetPending = false; if (mine === latest) { view.edits = { treatments: {}, sizes: {} }; await refresh(); }
      } catch (error) { if (status()) status().textContent = error.message; }
    });
  }
  // Switch the text style family or weight for every size, keeping each size's own step (sm, md, ...).
  const steps = ['xs', 'sm', 'md', 'lg', 'xl'];
  function setText(key, value) {
    const d = currentPart().draft, names = d.preview.options.label.map(o => o.name);
    if (key === 'step') { (view.edits.sizes[view.selection.size] ||= {}).label = value; render(); persist(); return; }
    for (const z of d.sizes) {
      const [, , step, weight] = sizeTokens(d, z.size).label.split('/'), family = sizeTokens(d, z.size).label.split('/')[1];
      const want = key === 'family' ? { family: value, weight } : { family, weight: value };
      const inFamily = names.filter(n => n.split('/')[1] === want.family), stepsHere = [...new Set(inFamily.map(n => n.split('/')[2]))];
      const near = stepsHere.slice().sort((x, y) => Math.abs(steps.indexOf(x) - steps.indexOf(step)) - Math.abs(steps.indexOf(y) - steps.indexOf(step)))[0];
      const pick = [want.weight, 'medium'].map(w => `type/${want.family}/${near}/${w}`).find(n => inFamily.includes(n)) || inFamily.find(n => n.split('/')[2] === near);
      if (pick) (view.edits.sizes[z.size] ||= {}).label = pick;
    }
    render(); persist();
  }
  function choose(name) {
    const a = target.apply;
    if (a.partGlobal) for (const z of currentPart().draft.sizes) (view.edits.sizes[z.size] ||= {})[a.partGlobal] = name;
    else if (a.partToken) (view.edits.treatments[a.partToken] ||= {})[a.field] = name || null;
    else if (a.partSize) { const z = (view.edits.sizes[a.partSize] ||= {}); if (a.side) (z.padding ||= {})[a.side] = name; else z[a.field] = name; }
    const id = target.triggerId; closeDialog(pickerDialog()); render(); document.getElementById(id)?.focus({ preventScroll: true }); persist();
  }
  document.addEventListener('input', e => { if (e.target.matches('[data-part-picker-search]')) renderOptions(); });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-part-wrapper]')) { e.preventDefault(); view.selected = null; render(); document.querySelector('[data-part-wrapper]')?.focus({ preventScroll: true }); }
  });
  document.addEventListener('keydown', e => {
    const dialog = document.getElementById('part-token-picker'); if (!dialog?.open || !dialog.contains(e.target)) return;
    if (e.key === 'Escape') { e.preventDefault(); closeDialog(dialog); return; }
    const options = [...dialog.querySelectorAll('[data-part-option]')], i = options.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); options[(i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length]?.focus(); }
  });
  document.addEventListener('click', async e => {
    const pick = e.target.closest('[data-part-pick]');
    if (pick) { openPicker(pick); return; }
    const option = e.target.closest('[data-part-option]');
    if (option && target) { choose(option.dataset.partOption); return; }
    const dialog = document.getElementById('part-token-picker');
    if (e.target.closest('[data-part-picker-close]') || dialog?.open && e.target === dialog) { const box = dialog.getBoundingClientRect(); if (e.target !== dialog || e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) closeDialog(dialog); return; }
    const cell = e.target.closest('[data-part-cell]');
    if (cell) { const [tone, emphasis, size, state, iconOnly] = cell.dataset.partCell.split('|'); view.selected = `${tone}|${emphasis}`; Object.assign(view.selection, { size, state, iconOnly: iconOnly === 'true' }); render(); return; }
    const type = e.target.closest('[data-part-type]');
    if (type) { view.selected = type.dataset.partType; render(); return; }
    // Clicking the page itself, away from any button or control, goes back to the overview.
    // The page card is the wrapper around everything: clicking it away from a button selects it and shows the overview.
    // The canvas captures the pointer for panning, so its clicks report the viewport; look up what sits under the cursor.
    const at = location.hash.startsWith('#part-') ? document.elementFromPoint(e.clientX, e.clientY) : null;
    if (view.selected && at?.closest('[data-part-wrapper]') && !at.closest('button, a, input, select, label, summary')) { view.selected = null; render(); return; }
    const text = e.target.closest('[data-part-text]');
    if (text && !text.disabled) { setText(text.dataset.partText, text.dataset.value); return; }
    if (e.target.closest('[data-part-reset]')) {
      view.cards = {}; view.selected = 'brand|primary'; view.edits = { treatments: {}, sizes: {} };
      const part = currentPart(), saved = part?.draft?.overrides || {};
      if (Object.values(saved.treatments || {}).some(t => Object.keys(t).length) || Object.values(saved.sizes || {}).some(z => Object.keys(z).length)) { render(); persist({ reset: true }); } else render();
      return;
    }
    const button = e.target.closest('[data-prepare-parts]');
    if (!button || button.disabled) return;
    const state = getState(), feedback = () => document.querySelector('[data-parts-feedback]');
    button.disabled = true; button.textContent = 'Preparing…';
    try {
      const response = await fetch('/api/parts-prepare', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-DS-Create-Token': state?.csrfToken || '' }, body: JSON.stringify({ ids: (state?.parts || []).map(p => p.id) }), signal: AbortSignal.timeout(30000) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Parts could not be prepared.');
      await refresh();
      if (feedback()) feedback().textContent = `Prepared: ${result.prepared.join(', ')}. Review the variants, then publish.`;
    } catch (error) { button.disabled = false; button.textContent = 'Prepare Parts'; if (feedback()) feedback().textContent = error.message; }
  });
  const update = e => {
    const control = e.target.closest('[data-part-control]');
    if (control) { const key = control.dataset.partControl, value = control.type === 'checkbox' ? control.checked : control.value;
      if (key === 'tone' || key === 'emphasis') { const [tone, emphasis] = view.selected.split('|'); view.selected = key === 'tone' ? `${value}|${emphasis}` : `${tone}|${value}`; } else view.selection[key] = value; render(); }
  };
  document.addEventListener('change', e => { if (e.target.type !== 'text' && !e.target.matches('[data-part-picker-search]')) update(e); });
  document.addEventListener('input', e => { if (e.target.type === 'text') update(e); });
}
