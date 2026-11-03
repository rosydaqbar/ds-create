// What each docs-site component still has to change to match its Part file (workflow/WEB.md W4). The site starts
// as kit/web's brand-agnostic copy, so a system that dropped a tone or a size, or a token the site never reads, only
// shows up here. Every finding is one sentence naming the change; pages without one are left out.
import {templateFor} from './templates.mjs';

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const or = items => items.length < 2 ? items.join('') : items.slice(0, -1).join(', ') + ' or ' + items.at(-1);
const setsOf = (part, c = part) => c.sets || [{name: part.set || part.name, properties: c.properties || []}];
const order = page => page.split('.').map(Number);

// A component file names its page in its first doc comment ("2.4 Badge — …").
const pageOf = text => text.match(/\b([2-9]\.\d+) [A-Z]/)?.[1] || null;
// A value counts as present when the source spells it as a string, or as a bare number for numeric values.
const spelled = (text, v) => new RegExp(/^\d+$/.test(v) ? `(?<![\\w.])${v}(?![\\w.])` : `['"\`]${esc(v)}['"\`]`, 'i').test(text);

export function checkSite(parts, sources) {
  const files = {}, anyToken = new Set(Object.values(parts).flatMap(p => (p.tokens || []).map(t => t.name.replaceAll('/', '-'))));
  for (const s of sources) { const page = pageOf(s.text); if (page) (files[page] ||= []).push(s.text); }
  const pages = [];
  for (const part of Object.values(parts).sort((a, b) => { const [x, y] = [order(a.page), order(b.page)]; return x[0] - y[0] || x[1] - y[1]; })) {
    const text = (files[part.page] || []).join('\n'), findings = [];
    if (!text) { pages.push({id: part.id, page: part.page, name: part.name, findings: [`No site component names ${part.page} ${part.name}. Copy it from kit/web.`]}); continue; }
    const template = templateFor(part.id), defaults = template ? setsOf(part, template.contract({})) : [];
    // Sets of one page share its source, so a property is reported once, under the first set that has it.
    const seen = new Set();
    for (const set of setsOf(part)) {
      const label = name => `${set.name} ${name}`;
      for (const p of set.properties || []) {
        if (p.type !== 'variant' || p.values.every(v => v === 'true' || v === 'false')) continue;
        const was = defaults.find(s => s.name === set.name)?.properties.find(x => x.name === p.name)?.values || [];
        // The site starts from the template's defaults, so only values the system dropped or added can differ; states
        // and numbers the site writes without quotes are never checked.
        const dropped = was.filter(v => !p.values.includes(v) && spelled(text, v)), missing = p.values.filter(v => !was.includes(v) && !spelled(text, v));
        const add = (kind, values, sentence) => { const key = `${p.name}|${kind}|${values}`; if (values.length && !seen.has(key)) { seen.add(key); findings.push(`${label(p.name)}: ${sentence}`); } };
        add('dropped', dropped, `this system has no ${or(dropped)}, but the site still has ${dropped.length > 1 ? 'them' : 'it'}. Remove ${dropped.length > 1 ? 'them' : 'it'} from the component and its docs.`);
        add('missing', missing, `the site has no ${or(missing)}. Add ${missing.length > 1 ? 'them' : 'it'} to the component.`);
      }
    }
    // A token is used by its CSS variable, a Tailwind utility built from it, or a template literal on its stem
    // (`var(--spinner-thickness-${size})`).
    const css = (part.tokens || []).map(t => t.name.replaceAll('/', '-'));
    const used = name => new RegExp(`(?<![a-z0-9-])(?:--|[a-z]+-)?${esc(name)}(?![a-z0-9-])`).test(text) || text.includes(`--${name.split('-').slice(0, -1).join('-')}-\${`);
    const unused = (part.tokens || []).filter((t, i) => !used(css[i])).map(t => t.name);
    if (unused.length) findings.push(`Tokens the site does not use: ${unused.join(', ')}. Use them in the component.`);
    // Variables in this Part's token families that no part file defines, and the component does not set itself,
    // point at a token the system no longer has.
    const families = [...new Set(css.map(n => n.split('-')[0]))];
    const extra = families.length ? [...new Set([...text.matchAll(new RegExp(`--((?:${families.map(esc).join('|')})-[a-z0-9-]*[a-z0-9])`, 'g'))].map(m => m[1]))]
      .filter(n => !anyToken.has(n) && !css.some(c => c.startsWith(n + '-')) && !new RegExp(`--${esc(n)}\\s*:`).test(text)) : [];
    for (const n of extra) findings.push(`The site uses --${n}, which is not a token in this Part file.`);
    if (findings.length) pages.push({id: part.id, page: part.page, name: part.name, findings});
  }
  return pages;
}
