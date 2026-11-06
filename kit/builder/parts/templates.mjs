// Premade templates for Parts, Components and Sections, one per page, in page order. Each holds a page's default structure and rules;
// a system changes them through its saved inputs, never by editing the template.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ItemError} from '../foundations/ops.mjs';
import * as button from './templates/2.1-button.js';
import * as iconButton from './templates/2.2-icon-button.js';
import * as link from './templates/2.3-link.js';
import * as badge from './templates/2.4-badge.js';
import * as tag from './templates/2.5-tag.js';
import * as avatar from './templates/2.6-avatar.js';
import * as checkbox from './templates/2.7-checkbox.js';
import * as radio from './templates/2.8-radio.js';
import * as toggle from './templates/2.9-switch.js';
import * as textControl from './templates/2.10-text-control.js';
import * as label from './templates/2.11-label.js';
import * as helpText from './templates/2.12-help-text.js';
import * as tooltip from './templates/2.13-tooltip.js';
import * as progress from './templates/2.14-progress.js';
import * as spinner from './templates/2.15-spinner.js';
import * as divider from './templates/2.16-divider.js';
import * as kbd from './templates/2.17-kbd.js';
import * as slider from './templates/2.18-slider.js';
import * as featuredIcon from './templates/2.19-featured-icon.js';
import * as buttonGroup from './templates/3.1-button-group.js';
import * as textField from './templates/3.2-text-field.js';
import * as choiceField from './templates/3.3-choice-field.js';
import * as avatarGroup from './templates/3.4-avatar-group.js';
import * as select from './templates/3.5-select.js';
import * as menu from './templates/3.6-menu.js';
import * as socialButton from './templates/3.7-social-button.js';
import * as badgeGroup from './templates/3.8-badge-group.js';
import * as richTextEditor from './templates/4.1-rich-text-editor.js';
import * as videoPlayer from './templates/4.2-video-player.js';

const order = page => page.split('.').map(Number);
export const partTemplates = [button, iconButton, link, badge, tag, avatar, checkbox, radio, toggle, textControl, label, helpText, tooltip, progress, spinner, divider, kbd, slider, featuredIcon, buttonGroup, textField, choiceField, avatarGroup, select, menu, socialButton, badgeGroup, richTextEditor, videoPlayer].sort((a, b) => { const [x, y] = [order(a.page), order(b.page)]; return x[0] - y[0] || x[1] - y[1]; });

export function templateFor(id) {
  const t = partTemplates.find(x => x.id === id);
  if (!t) throw new ItemError(`Unknown Part: ${id}.`);
  return t;
}

// The templates for ids in build order: Parts, then Components, then Sections; within a level, a template after
// every template it uses, then page order. No template uses a level above its own, so this keeps every dependency.
export function buildOrder(ids, templates = partTemplates) {
  const find = id => { const t = templates.find(x => x.id === id); if (!t) throw new ItemError(`Unknown Part: ${id}.`); return t; };
  const depth = (t, seen = []) => seen.includes(t.id) ? 0 : 1 + Math.max(0, ...t.uses.map(u => templates.find(x => x.id === u)).filter(Boolean).map(u => depth(u, [...seen, t.id])));
  const page = t => order(t.page);
  const rank = t => Math.max(0, levels.indexOf(t.level));
  return [...new Set(ids)].map(find).sort((a, b) => rank(a) - rank(b) || depth(a) - depth(b) || page(a)[0] - page(b)[0] || page(a)[1] - page(b)[1]);
}

const exportsNeeded = {id: 'string', page: 'string', name: 'string', set: 'string', level: 'string', spec: 'string', fields: 'array', defaults: 'object', uses: 'array', contract: 'function', compile: 'function'};
// A Component uses Parts only; a Section uses Parts and Components. Neither uses its own level or one above.
const levels = ['parts', 'components', 'sections'];
const reachesUp = (level, used) => levels.indexOf(used) > levels.indexOf(level) || (used === level && level !== 'parts');
export function checkTemplate(t, templates = partTemplates) {
  const problems = [];
  for (const [key, type] of Object.entries(exportsNeeded)) {
    const ok = type === 'array' ? Array.isArray(t[key]) : typeof t[key] === type && t[key] !== null;
    if (!ok) problems.push(`${t.id || '?'}: ${key} must be ${type === 'array' ? 'an array' : 'a ' + type}.`);
  }
  if (t.fields && t.defaults) for (const key of Object.keys(t.defaults)) if (!t.fields.includes(key)) problems.push(`${t.id}: default ${key} is not a field.`);
  if (!levels.includes(t.level)) problems.push(`${t.id}: unknown level ${t.level}.`);
  for (const u of t.uses || []) { const used = templates.find(x => x.id === u); if (used && reachesUp(t.level, used.level)) problems.push(`${t.id}: a ${t.level} template cannot use ${u} (${used.level}).`); }
  return problems;
}

const file = (t, ext) => new URL(`./templates/${t.page}-${t.id}.${ext}`, import.meta.url);
export const templateText = (t, ext) => readFileSync(file(t, ext), 'utf8');
export function templateHash() {
  const h = createHash('sha256');
  for (const t of partTemplates) for (const ext of ['js', 'md']) h.update(templateText(t, ext));
  return h.digest('hex');
}
