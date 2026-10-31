// Premade Part templates, one per page, in page order. Each holds a page's default structure and rules;
// a system changes them through its saved inputs, never by editing the template.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {ItemError} from '../foundations/ops.mjs';
import * as button from './templates/2.1-button.js';

const order = page => page.split('.').map(Number);
export const partTemplates = [button].sort((a, b) => { const [x, y] = [order(a.page), order(b.page)]; return x[0] - y[0] || x[1] - y[1]; });

export function templateFor(id) {
  const t = partTemplates.find(x => x.id === id);
  if (!t) throw new ItemError(`Unknown Part: ${id}.`);
  return t;
}

const exportsNeeded = {id: 'string', page: 'string', name: 'string', set: 'string', level: 'string', spec: 'string', fields: 'array', defaults: 'object', uses: 'array', contract: 'function', compile: 'function'};
export function checkTemplate(t) {
  const problems = [];
  for (const [key, type] of Object.entries(exportsNeeded)) {
    const ok = type === 'array' ? Array.isArray(t[key]) : typeof t[key] === type && t[key] !== null;
    if (!ok) problems.push(`${t.id || '?'}: ${key} must be ${type === 'array' ? 'an array' : 'a ' + type}.`);
  }
  if (t.fields && t.defaults) for (const key of Object.keys(t.defaults)) if (!t.fields.includes(key)) problems.push(`${t.id}: default ${key} is not a field.`);
  if (!['parts', 'components', 'sections'].includes(t.level)) problems.push(`${t.id}: unknown level ${t.level}.`);
  return problems;
}

const file = (t, ext) => new URL(`./templates/${t.page}-${t.id}.${ext}`, import.meta.url);
export const templateText = (t, ext) => readFileSync(file(t, ext), 'utf8');
export function templateHash() {
  const h = createHash('sha256');
  for (const t of partTemplates) for (const ext of ['js', 'md']) h.update(templateText(t, ext));
  return h.digest('hex');
}
