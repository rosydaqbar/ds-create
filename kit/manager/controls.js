import { openDialog, closeDialog } from './ui-motion.mjs';
import { rounded, radiusBase, deriveRadii, colorOpacity, shadowSeed, deriveShadows, shadowCSS, isShadow } from './foundation-controls.mjs';

export function createFoundationControls({ foundation, draft, resultFor, savedResult, modeFor, valueKey, escape, icon, previewCard, modeControls, updatePreview }) {
  const $ = id => document.getElementById(id);
  const label = name => name.split('/').slice(1).join(' ').replaceAll('-', ' ').replace(/^./, c => c.toUpperCase());
  const unit = (id, text, value, suffix, attrs = '', data = '') => `<span class="unit-input"><input id="${id}" aria-label="${escape(text)}" type="number" value="${rounded(value)}" ${attrs} ${data}/><span>${suffix}</span></span>`;
  const sourceRadii = f => f.variables.filter(v => v.name.startsWith('radius/')).map(v => ({ name: v.name, value: Number(savedResult(v, modeFor(f)).value) })).filter(v => Number.isFinite(v.value));
  const baseRem = f => draft.settings.get('radius-base-rem') ?? radiusBase(sourceRadii(f)) / 16;
  const radiusInput = (v, i) => {
    const value = Number(resultFor(v, modeFor(foundation('shape'))).value);
    const fixed = sourceRadii(foundation('shape')).find(r => r.name === v.name)?.value;
    return `<div class="derived-row"><div><label for="derived-radius-${i}">${escape(label(v.name))}</label><code>${escape(v.name)}</code><small data-radius-edited="${escape(v.name)}" ${draft.values.has(valueKey(v.name, modeFor(foundation('shape')))) ? '' : 'hidden'}>Preview value</small></div>${fixed === 0 || fixed >= 999 ? `<span class="fixed-radius">${fixed >= 999 ? 'Full' : '0rem'}</span>` : unit(`derived-radius-${i}`, `${label(v.name)} radius in rem`, value / 16, 'rem', 'min="0" max="32" step="0.0625"', `data-radius-step="${escape(v.name)}"`)}</div>`;
  };
  function radiusWorkspace(f) {
    if (!sourceRadii(f).length) return '<p class="workspace-help">No radius values were exported for this foundation.</p>';
    const presets = [[0, 'Square'], [.25, 'Subtle'], [.5, 'Rounded'], [1, 'Soft']];
    return `<section class="inspector-section"><h3>Presets</h3><div class="radius-presets" role="group" aria-label="Radius presets">${presets.map(([value, name]) => `<button type="button" data-radius-preset="${value}" aria-label="${name} radius" title="${name}: ${value}rem" aria-pressed="${baseRem(f) === value}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20V${5 + value * 9}Q5 5 ${5 + value * 9} 5H20"/></svg></button>`).join('')}</div></section><section class="inspector-section"><h3>Fine tune</h3><div class="seed-row"><label for="radius-base-rem">Radius</label>${unit('radius-base-rem', 'Base radius in rem', baseRem(f), 'rem', 'min="0" max="8" step="0.0625"')}</div></section><details class="inspector-section control-details" id="radius-derived" open><summary>Derived steps</summary><div>${f.variables.filter(v => v.name.startsWith('radius/')).map(radiusInput).join('')}</div></details>`;
  }
  function radiusContent(f) {
    const radii = f.variables.filter(v => v.name.startsWith('radius/'));
    const borders = f.variables.filter(v => !v.name.startsWith('radius/'));
    return `<section class="section"><div class="section-intro"><h2>Corner radius</h2><p>Use consistent corner shapes for controls, surfaces, and overlays.</p></div><div class="radius-grid">${radii.map(v => {
      const value = resultFor(v, modeFor(f));
      return previewCard(`<span>${escape(label(v.name))}</span><code>${Number(value.value) >= 999 ? 'Full' : `${rounded(Number(value.value))}px`}</code>`, `<div class="radius-specimen" data-radius="${Number(value.value)}"></div>`, { stageClass: 'radius-stage', caption: `<div class="specimen-caption"><code>${escape(v.name)}</code><small>${escape(value.alias || 'Preview value')}</small></div>` });
    }).join('')}</div></section>${borders.length ? `<section class="section"><div class="section-heading"><h2>Border widths</h2></div><dl class="border-values">${borders.map(v => `<div><dt><code>${escape(v.name)}</code></dt><dd>${escape(resultFor(v, modeFor(f)).value)}px</dd></div>`).join('')}</dl></section>` : ''}`;
  }
  function resolveColor(color) {
    if (!color?.alias) return color;
    const f = foundation('color');
    const token = f?.variables.find(v => v.name === color.alias);
    return token ? resultFor(token, modeFor(f)).value : null;
  }
  const ramp = () => foundation('elevation')?.styles.filter(s => !s.name.startsWith('focus/') && s.effects?.some(isShadow)) || [];
  const sourceSeed = () => shadowSeed(ramp().find(s => /\/(control|sm)$/.test(s.name)) || ramp()[0], resolveColor);
  const seed = () => draft.settings.get('shadow-seed') || sourceSeed();
  const overrideKey = name => `shadow-step:${name}`;
  function effectsFor(style) {
    if (!ramp().some(s => s.name === style.name)) return style.effects || [];
    if (draft.settings.has(overrideKey(style.name))) return draft.settings.get(overrideKey(style.name));
    return draft.settings.has('shadow-seed') && sourceSeed() ? deriveShadows(style.effects || [], sourceSeed(), seed(), resolveColor) : style.effects || [];
  }
  const cssFor = style => shadowCSS(effectsFor(style), resolveColor);
  function summary(style, compact = false) {
    const effects = effectsFor(style).filter(isShadow);
    if (!effects.length) return 'No shadow';
    return (compact ? effects.slice(0, 1) : effects).map(e => `${e.type === 'INNER_SHADOW' ? 'Inner · ' : ''}${[e.x || 0, e.y || 0, e.blur || 0, e.spread || 0].map(n => `${rounded(n)}px`).join(' ')} · ${e.color?.alias?.replace(/^color\//, '') || e.color} / ${Math.round((e.opacity ?? colorOpacity(resolveColor(e.color))) * 10) / 10}%`).join('; ') + (compact && effects.length > 1 ? ` · +${effects.length - 1} layer${effects.length > 2 ? 's' : ''}` : '');
  }
  function colorField(id, ref, opacity, data = '') {
    const f = foundation('color');
    const all = f?.variables.filter(v => v.name.startsWith('color/shadow/')) || [];
    const refs = [...new Set([ref, ...all.map(v => v.name)])].filter(v => typeof v === 'string');
    return `<div class="shadow-color-field"><span class="token-chip" data-shadow-chip="${id}" aria-hidden="true"></span><select id="${id}" aria-label="${id === 'shadow-seed-color' ? 'Seed color token' : `Layer ${Number(id.split('-')[1]) + 1} color token`}" ${data}>${refs.map(name => `<option value="${escape(name)}" ${name === ref ? 'selected' : ''}>${escape(name.replace(/^color\//, ''))}</option>`).join('')}</select>${unit(`${id}-opacity`, id === 'shadow-seed-color' ? 'Seed opacity in percent' : `Layer ${Number(id.split('-')[1]) + 1} opacity in percent`, Math.round(opacity * 10) / 10, '%', 'min="0" max="100" step="0.1"', `${data} data-opacity="true"`)}</div>`;
  }
  function shadowWorkspace(f) {
    const s = seed();
    if (!s) return '<p class="workspace-help">No shadow layers are available in this export.</p>';
    return `<section class="inspector-section"><h3>Seed</h3><label class="seed-color-label" for="shadow-seed-color">Color</label>${colorField('shadow-seed-color', s.color, s.opacity, 'data-shadow-seed="color"')}${[['blur', 'Blur', 0, 64], ['spread', 'Spread', -32, 32], ['x', 'Offset X', -32, 32], ['y', 'Offset Y', -32, 64]].map(([key, title, min, max]) => `<div class="shadow-seed-row"><label for="shadow-seed-${key}-range">${title}</label><input id="shadow-seed-${key}-range" aria-label="Seed ${title}" type="range" min="${Math.min(min, s[key])}" max="${Math.max(max, s[key])}" step="0.5" value="${s[key]}" data-shadow-seed="${key}"/>${unit(`shadow-seed-${key}`, `Seed ${title} in pixels`, s[key], 'px', `min="${key === 'blur' ? 0 : -512}" max="512" step="0.5"`, `data-shadow-seed="${key}"`)}</div>`).join('')}</section><details class="inspector-section control-details" id="shadow-ramp" open><summary>Ramp</summary><div class="shadow-ramp">${ramp().map((style, i) => `<div class="shadow-ramp-row"><div><strong>${escape(label(style.name))}</strong><small data-shadow-edited="${escape(style.name)}" ${draft.settings.has(overrideKey(style.name)) ? '' : 'hidden'}>Edited</small></div><span class="shadow-ramp-value" data-shadow-summary="${escape(style.name)}">${escape(summary(style, true))}</span><button id="shadow-gear-${i}" class="icon-button" aria-label="Edit ${escape(label(style.name))} shadow" aria-haspopup="dialog" aria-controls="shadow-editor" data-shadow-edit="${escape(style.name)}">${icon('gear')}</button><code class="shadow-ramp-path">${escape(style.name)}</code></div>`).join('')}</div></details>${modeControls(f)}`;
  }
  let editorName;
  let triggerId;
  const styleForEditor = () => ramp().find(s => s.name === editorName);
  function positionEditor() {
    const dialog = $('shadow-editor');
    const trigger = $(triggerId);
    if (!dialog.open || !trigger) return;
    const box = trigger.getBoundingClientRect();
    dialog.style.left = `${Math.max(12, Math.min(box.right - dialog.offsetWidth, innerWidth - dialog.offsetWidth - 12))}px`;
    dialog.style.top = `${Math.max(12, Math.min(box.bottom + 8, innerHeight - dialog.offsetHeight - 12))}px`;
  }
  function renderEditor() {
    const style = styleForEditor();
    if (!style) { if ($('shadow-editor').open) closeDialog($('shadow-editor')); return; }
    const active = document.activeElement?.id;
    const scroll = $('shadow-editor').scrollTop;
    $('shadow-editor-title').textContent = `${label(style.name)} shadow`;
    $('shadow-editor-path').textContent = style.name;
    const effects = effectsFor(style).filter(isShadow);
    $('shadow-editor-layers').innerHTML = effects.map((e, i) => `<section class="shadow-layer" data-shadow-layer="${i}" aria-labelledby="shadow-layer-title-${i}"><div class="shadow-layer-header"><h3 id="shadow-layer-title-${i}">Layer ${i + 1}</h3><div><button id="layer-${i}-up" class="icon-button" aria-label="Move layer ${i + 1} up" data-layer-action="up" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button><button id="layer-${i}-down" class="icon-button" aria-label="Move layer ${i + 1} down" data-layer-action="down" ${i === effects.length - 1 ? 'disabled' : ''}>${icon('down')}</button><button class="icon-button" aria-label="Remove layer ${i + 1}" data-layer-action="remove">${icon('trash')}</button></div></div><div class="layer-field"><span>Type</span><div class="mode-switch" role="group" aria-label="Layer ${i + 1} type">${[['DROP_SHADOW', 'Drop'], ['INNER_SHADOW', 'Inner']].map(([type, title]) => `<button id="layer-${i}-${type}" type="button" data-layer-type="${type}" aria-pressed="${e.type === type}">${title}</button>`).join('')}</div></div><div class="layer-field"><span>X / Y</span><div class="layer-pair">${unit(`layer-${i}-x`, `Layer ${i + 1} X`, e.x || 0, 'px', 'min="-512" max="512" step="0.5"', 'data-layer-value="x"')}${unit(`layer-${i}-y`, `Layer ${i + 1} Y`, e.y || 0, 'px', 'min="-512" max="512" step="0.5"', 'data-layer-value="y"')}</div></div><div class="layer-field"><span>Blur / Spread</span><div class="layer-pair">${unit(`layer-${i}-blur`, `Layer ${i + 1} blur`, e.blur || 0, 'px', 'min="0" max="512" step="0.5"', 'data-layer-value="blur"')}${unit(`layer-${i}-spread`, `Layer ${i + 1} spread`, e.spread || 0, 'px', 'min="-512" max="512" step="0.5"', 'data-layer-value="spread"')}</div></div><div class="layer-field layer-color"><span>Color</span>${colorField(`layer-${i}-color`, e.color?.alias || e.color, e.opacity ?? colorOpacity(resolveColor(e.color)), 'data-layer-value="color"')}</div></section>`).join('') || '<p class="workspace-help">No layers. Add a layer to create this shadow.</p>';
    $('shadow-reset-step').hidden = !draft.settings.has(overrideKey(style.name));
    syncChips();
    if (active && $(active)) $(active).focus({ preventScroll: true });
    $('shadow-editor').scrollTop = scroll;
    positionEditor();
  }
  function syncChips() {
    document.querySelectorAll('[data-shadow-chip]').forEach(chip => {
      const select = $(chip.dataset.shadowChip);
      const value = select?.value;
      const color = value?.startsWith('color/') ? resolveColor({ alias: value }) : value;
      chip.style.backgroundColor = CSS.supports('color', color) ? color : 'transparent';
    });
  }
  function syncInspector() {
    const f = foundation('shape');
    if (routeIsShape() && $('radius-base-rem')) {
      if (document.activeElement !== $('radius-base-rem')) $('radius-base-rem').value = rounded(baseRem(f));
      document.querySelectorAll('[data-radius-preset]').forEach(el => el.setAttribute('aria-pressed', String(Number(el.dataset.radiusPreset) === baseRem(f))));
      document.querySelectorAll('[data-radius-step]').forEach(el => { const token = f.variables.find(v => v.name === el.dataset.radiusStep); if (el !== document.activeElement) el.value = rounded(Number(resultFor(token, modeFor(f)).value) / 16); });
      document.querySelectorAll('[data-radius-edited]').forEach(el => { el.hidden = !draft.values.has(valueKey(el.dataset.radiusEdited, modeFor(f))); });
    }
    const s = seed();
    if (s) document.querySelectorAll('[data-shadow-seed]').forEach(el => {
      const key = el.hasAttribute('data-opacity') ? 'opacity' : el.dataset.shadowSeed;
      if (el.type === 'range') { el.min = Math.min(Number(el.min), s[key]); el.max = Math.max(Number(el.max), s[key]); }
      if (el !== document.activeElement) el.value = typeof s[key] === 'number' ? (key === 'opacity' ? Math.round(s[key] * 10) / 10 : rounded(s[key])) : s[key];
    });
    document.querySelectorAll('[data-shadow-summary]').forEach(el => { const style = ramp().find(s => s.name === el.dataset.shadowSummary); if (style) el.textContent = summary(style, true); });
    document.querySelectorAll('[data-shadow-edited]').forEach(el => { el.hidden = !draft.settings.has(overrideKey(el.dataset.shadowEdited)); });
    syncChips();
  }
  const routeIsShape = () => location.hash === '#shape';
  function update() { updatePreview(); syncInspector(); }
  function setBase(value) {
    const f = foundation('shape');
    draft.settings.set('radius-base-rem', value);
    for (const row of deriveRadii(sourceRadii(f), value)) {
      const original = sourceRadii(f).find(r => r.name === row.name).value;
      if (row.value === original) draft.values.delete(valueKey(row.name, modeFor(f)));
      else draft.values.set(valueKey(row.name, modeFor(f)), row.value);
    }
    update();
  }
  $('inspector').addEventListener('input', event => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
    if (target instanceof HTMLInputElement && (target.value === '' || !target.validity.valid)) return;
    if (target.id === 'radius-base-rem') setBase(Number(target.value));
    else if (target.dataset.radiusStep) {
      const f = foundation('shape');
      draft.values.set(valueKey(target.dataset.radiusStep, modeFor(f)), Number(target.value) * 16); update();
    } else if (target.dataset.shadowSeed) {
      const key = target.hasAttribute('data-opacity') ? 'opacity' : target.dataset.shadowSeed;
      if (key === 'blur' && Number(target.value) < 0) return;
      draft.settings.set('shadow-seed', { ...seed(), [key]: key === 'color' ? target.value : Number(target.value) }); update();
    }
  });
  $('inspector').addEventListener('click', event => {
    const preset = event.target.closest('[data-radius-preset]');
    if (preset) { setBase(Number(preset.dataset.radiusPreset)); $('announcer').textContent = `Radius ${preset.dataset.radiusPreset}rem`; }
    const trigger = event.target.closest('[data-shadow-edit]');
    if (trigger) { editorName = trigger.dataset.shadowEdit; triggerId = trigger.id; renderEditor(); openDialog($('shadow-editor')); positionEditor(); $('shadow-editor-close').focus(); }
  });
  function storeLayers(layers) { draft.settings.set(overrideKey(editorName), layers); update(); $('shadow-reset-step').hidden = false; }
  $('shadow-editor-layers').addEventListener('input', event => {
    const target = event.target;
    if (!target.dataset.layerValue || target instanceof HTMLInputElement && (!target.validity.valid || target.value === '')) return;
    const index = Number(target.closest('[data-shadow-layer]').dataset.shadowLayer);
    const layers = structuredClone(effectsFor(styleForEditor()).filter(isShadow));
    const key = target.hasAttribute('data-opacity') ? 'opacity' : target.dataset.layerValue;
    layers[index][key] = key === 'color' ? target.value.startsWith('color/') ? { alias: target.value } : target.value : Number(target.value);
    storeLayers(layers); syncChips();
  });
  $('shadow-editor-layers').addEventListener('click', event => {
    const button = event.target.closest('[data-layer-type], [data-layer-action]');
    if (!button || button.disabled) return;
    const index = Number(button.closest('[data-shadow-layer]').dataset.shadowLayer);
    const layers = structuredClone(effectsFor(styleForEditor()).filter(isShadow));
    if (button.dataset.layerType) layers[index].type = button.dataset.layerType;
    if (button.dataset.layerAction === 'remove') layers.splice(index, 1);
    if (button.dataset.layerAction === 'up' && index > 0) [layers[index - 1], layers[index]] = [layers[index], layers[index - 1]];
    if (button.dataset.layerAction === 'down' && index < layers.length - 1) [layers[index + 1], layers[index]] = [layers[index], layers[index + 1]];
    storeLayers(layers); renderEditor();
    if (button.dataset.layerAction === 'remove') $('shadow-add-layer').focus();
    if (button.dataset.layerAction === 'up') $(`layer-${index - 1}-x`)?.focus();
    if (button.dataset.layerAction === 'down') $(`layer-${index + 1}-x`)?.focus();
  });
  $('shadow-add-layer').addEventListener('click', () => {
    const s = seed();
    storeLayers([...structuredClone(effectsFor(styleForEditor()).filter(isShadow)), { type: 'DROP_SHADOW', x: s.x, y: s.y, blur: s.blur, spread: s.spread, color: s.color.startsWith('color/') ? { alias: s.color } : s.color, opacity: s.opacity }]); renderEditor();
  });
  $('shadow-reset-step').addEventListener('click', () => { draft.settings.delete(overrideKey(editorName)); update(); renderEditor(); $('shadow-add-layer').focus(); });
  $('shadow-editor-close').addEventListener('click', () => closeDialog($('shadow-editor')));
  $('shadow-editor').addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); closeDialog($('shadow-editor')); } });
  $('shadow-editor').addEventListener('close', () => { $(triggerId)?.focus({ preventScroll: true }); });
  $('shadow-editor').addEventListener('click', e => { if (e.target !== $('shadow-editor')) return; const box = e.target.getBoundingClientRect(); if (e.clientX < box.left || e.clientX > box.right || e.clientY < box.top || e.clientY > box.bottom) closeDialog(e.target); });
  window.addEventListener('resize', positionEditor);
  return { radiusWorkspace, radiusContent, shadowWorkspace, effectsFor, cssFor, summary, syncInspector, syncDialog: () => { if ($('shadow-editor').open) renderEditor(); }, close: () => { if ($('shadow-editor').open) closeDialog($('shadow-editor'), { immediate: true }); } };
}
