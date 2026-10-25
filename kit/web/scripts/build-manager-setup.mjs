// Regenerate after changing setup composition or shared web components:
// node kit/web/scripts/build-manager-setup.mjs
// Dependencies are maintainer-only; init-web serves the committed static result.
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { compile, optimize } from '@tailwindcss/node';
import { colors, values, effects, textStyles } from './chrome-fallbacks.mjs';

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manager = path.resolve(web, '../manager');
const temp = await mkdtemp(path.join(web, '.manager-setup-'));
try {
  await build({
    root: web, configFile: false, plugins: [react()], logLevel: 'error',
    resolve: { alias: { '@': path.join(web, 'src') } },
    build: { ssr: path.join(web, 'scripts/manager-setup.tsx'), outDir: temp, copyPublicDir: false,
      rolldownOptions: { output: { entryFileNames: 'render.mjs' } } },
  });
  const { markup } = await import(pathToFileURL(path.join(temp, 'render.mjs')));
  // React SSR escapes attributes; Tailwind needs the DOM-decoded class names.
  const entities = { '&amp;': '&', '&quot;': '"', '&#x27;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>' };
  const classes = [...new Set([...markup.matchAll(/class="([^"]+)"/g)].flatMap(m =>
    m[1].replace(/&(?:amp|quot|#x27|#39|lt|gt);/g, entity => entities[entity]).split(/\s+/)))];
  const tokens = JSON.parse(await readFile(path.join(web, 'tokens/figma-variables.json'), 'utf8'));
  const byName = new Map(tokens.variables.map(v => [v.name, v]));
  const cssName = name => '--' + name.replaceAll('/', '-').replaceAll('.', '_');
  const known = new Set([...colors, ...values, ...effects].map(([name]) => name));
  const metrics = new Map();
  function metric(name, stack = new Set()) {
    if (known.has(cssName(name)) && !/^(button|checkbox|text-control)\//.test(name)) return;
    if (metrics.has(name)) return;
    if (stack.has(name)) throw new Error(`Token alias loop: ${name}`);
    const token = byName.get(name);
    if (!token) throw new Error(`Missing shared token: ${name}`);
    const raw = token.values.Light ?? token.values.Standard ?? token.values.Value ?? Object.values(token.values)[0];
    let value = raw;
    if (raw?.alias) { metric(raw.alias, new Set([...stack, name])); value = `var(${cssName(raw.alias)})`; }
    else if (typeof raw === 'number') value = `${raw}${/weight\//.test(name) ? '' : 'px'}`;
    metrics.set(name, value);
  }
  for (const v of tokens.variables) if (/^(button|checkbox|text-control)\//.test(v.name)) metric(v.name);
  // Exact control elevation from the web template, with semantic colour binding.
  const elevation = tokens.effectStyles.find(e => e.name === 'elevation/control');
  const shadow = elevation.effects.map(e => {
    const color = e.color.alias ? (metric(e.color.alias), `var(${cssName(e.color.alias)})`) : e.color;
    return `${e.x}px ${e.y}px ${e.blur}px ${e.spread}px ${color}`;
  }).join(', ');
  const theme = [
    ...colors.map(([name]) => `${name}: var(${name});`),
    ...[...values, ...effects].filter(v => v[2]).map(([name, , key]) => `${key}: var(${name});`),
    '--shadow-control: var(--elevation-control);',
  ].join('\n');
  const typography = Object.entries(textStyles).map(([name, [size, line, weight, mono]]) =>
    `@utility ${name} {font-family:var(--font-family-${mono ? 'mono' : 'ui'});font-size:${size}px;line-height:${line}px;font-weight:${weight};}`
  ).join('\n');
  const styles = await readFile(path.join(web, 'src/styles/index.css'), 'utf8');
  const variants = styles.slice(styles.indexOf('@custom-variant dark'), styles.indexOf('@layer base'));
  const source = `@import "tailwindcss/theme.css" layer(theme);\n@theme inline {${theme}}\n${typography}\n${variants}\n` +
    '#setup-dialog :where(button,input,textarea) {border-style:solid;border-width:0;padding:0;font:inherit;}\n' +
    [...new Set([...markup.matchAll(/stroke-width="([\d.]+)"/g)].map(m => m[1]))].map(width => `#setup-dialog svg[stroke-width="${width}"] {stroke-width:${width};}`).join('\n') +
    '#setup-dialog {@tailwind utilities;}';
  const compiler = await compile(source, { base: web, onDependency() {} });
  const utilities = compiler.build(classes);
  const names = new Map(tokens.variables.map(v => [cssName(v.name), v.name]));
  for (const [, ref] of utilities.matchAll(/var\((--[\w-]+)\)/g)) if (!known.has(ref) && names.has(ref)) metric(names.get(ref));
  const declarations = `#setup-dialog {${[...metrics].map(([name, value]) => `${cssName(name)}:${value};`).join('')}--elevation-control:${shadow};}\n`;
  const css = optimize(declarations + utilities, { minify: true }).code;
  const file = path.join(manager, 'index.html');
  let html = await readFile(file, 'utf8');
  html = html.replace(/\s*<!-- BEGIN WEB SETUP STYLES -->[\s\S]*?<!-- END WEB SETUP STYLES -->/, '');
  html = html.replace('</head>', `<!-- BEGIN WEB SETUP STYLES -->\n<style>${css}</style>\n<!-- END WEB SETUP STYLES -->\n</head>`);
  html = html.replace(/<dialog id="setup-dialog"[\s\S]*?<\/dialog>/, markup);
  await writeFile(file, html);
  console.log(`Setup: actual web components, ${classes.length} utility classes; static output written.`);
} finally { await rm(temp, { recursive: true, force: true }); }
