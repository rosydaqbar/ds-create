#!/usr/bin/env node
/**
 * Keeps the site's own pages independent of component defaults (workflow/WEB.md W4).
 *
 * W4 sets each component's defaults to its Figma set's default variant, which is often the smallest size or another
 * emphasis than the template's. A site page that leaves a variant prop out then changes with it: a build that moved
 * Button's default size shrank every button on the foundation pages, and 69 usages had to be pinned by hand.
 *
 *   node scripts/pin-props.mjs            list every usage in src/docs/ that relies on a variant default (exit 1 if any)
 *   node scripts/pin-props.mjs --write    write the current default into each of them
 *
 * A usage is an element imported from '@/components' that leaves out a variant prop (AXES) the component gives a
 * string default in its signature. Usages that spread props ({...rest}) are left alone. Run it on the template before
 * W4 changes a default; new usages written after W4 name their props.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
// Variant axes a Figma set can default differently. `type` only when it isn't the HTML button type.
const AXES = new Set(['size', 'emphasis', 'tone', 'type', 'orientation', 'placement', 'status', 'breakpoint', 'behavior']);
const HTML_TYPE = new Set(['button', 'submit', 'reset']);

const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const parse = (f) => ts.createSourceFile(f, fs.readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

/** Component name → { prop: default } for the variant axes, from `export function Name({ size = 'md', … })`. */
export function readDefaults(dir = path.join(SRC, 'components')) {
  const out = {};
  for (const f of walk(dir).filter((x) => x.endsWith('.tsx'))) {
    const sf = parse(f);
    sf.forEachChild((n) => {
      if (!ts.isFunctionDeclaration(n) || !n.name || !n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) return;
      const p = n.parameters[0];
      if (!p || !ts.isObjectBindingPattern(p.name)) return;
      const d = {};
      for (const el of p.name.elements) {
        const prop = (el.propertyName || el.name).getText(sf);
        if (!AXES.has(prop) || !el.initializer || !ts.isStringLiteral(el.initializer)) continue;
        if (prop === 'type' && HTML_TYPE.has(el.initializer.text)) continue;
        d[prop] = el.initializer.text;
      }
      if (Object.keys(d).length) out[n.name.text] = d;
    });
  }
  return out;
}

/** Usages in one file that leave out a defaulted axis: [{ at, tag, missing: { prop: value } }]. */
export function unpinned(file, defaults) {
  const sf = parse(file);
  const imported = new Set();
  for (const s of sf.statements) {
    if (!ts.isImportDeclaration(s) || !/^'@\/components(\/|')/.test(s.moduleSpecifier.getText(sf))) continue;
    const b = s.importClause?.namedBindings;
    if (b && ts.isNamedImports(b)) for (const e of b.elements) if (!e.isTypeOnly) imported.add(e.name.text);
  }
  const found = [];
  const visit = (n) => {
    if (ts.isJsxSelfClosingElement(n) || ts.isJsxOpeningElement(n)) {
      const tag = n.tagName.getText(sf);
      const d = imported.has(tag) && defaults[tag];
      const attrs = n.attributes.properties;
      if (d && !attrs.some((a) => ts.isJsxSpreadAttribute(a))) {
        const has = new Set(attrs.map((a) => a.name.getText(sf)));
        const missing = Object.fromEntries(Object.entries(d).filter(([k]) => !has.has(k)));
        if (Object.keys(missing).length) found.push({ at: n.tagName.end, line: sf.getLineAndCharacterOfPosition(n.pos).line + 1, tag, missing });
      }
    }
    n.forEachChild(visit);
  };
  visit(sf);
  return found;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const write = process.argv.includes('--write');
  const defaults = readDefaults();
  let total = 0;
  for (const f of walk(path.join(SRC, 'docs')).filter((x) => x.endsWith('.tsx'))) {
    const list = unpinned(f, defaults);
    if (!list.length) continue;
    total += list.length;
    const rel = path.relative(ROOT, f);
    if (!write) {
      for (const u of list) console.log(`${rel}:${u.line} <${u.tag}> relies on ${Object.entries(u.missing).map(([k, v]) => `${k}="${v}"`).join(' ')}`);
      continue;
    }
    let s = fs.readFileSync(f, 'utf8');
    for (const u of [...list].sort((a, b) => b.at - a.at)) s = s.slice(0, u.at) + Object.entries(u.missing).map(([k, v]) => ` ${k}="${v}"`).join('') + s.slice(u.at);
    fs.writeFileSync(f, s);
  }
  console.log(total ? `pin-props: ${total} usage(s) ${write ? 'pinned' : 'rely on a default (run with --write)'}` : 'pin-props: every usage in src/docs/ names its variant props');
  process.exit(total && !write ? 1 : 0);
}
