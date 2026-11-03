// Regenerate after changing a web component or its docs sample:
// node kit/web/scripts/build-manager-items.mjs
// Builder's Part pages draw these white-label components with the system's tokens. Dependencies are
// maintainer-only; init-web serves the committed result (kit/manager/client/items/).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import { execFileSync } from 'node:child_process';
import { compile, optimize } from '@tailwindcss/node';
import { Scanner } from '@tailwindcss/oxide';
import { tokenModel } from './token-model.mjs';

const web = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(web, '../manager/client/items');
await mkdir(out, { recursive: true });

// The docs samples read the generated token data and page copy, as the site build does.
for (const script of ['build-tokens.mjs', 'build-copy.mjs']) execFileSync(process.execPath, [path.join(web, 'scripts', script)], { cwd: web, stdio: 'ignore' });
// The site's own Vite setup (aliases for the App previews), built as one browser module.
await build({
  root: web, configFile: path.join(web, 'vite.config.ts'), logLevel: 'error', mode: 'production',
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: out, emptyOutDir: false, copyPublicDir: false, minify: true,
    lib: { entry: path.join(web, 'scripts/manager-items.tsx'), formats: ['es'], fileName: () => 'items.js' },
    rolldownOptions: { output: { codeSplitting: false } },
  },
});

// Utilities only, scoped to the stage: Builder's own interface keeps its styles. The theme maps every
// utility to a token variable; the session's values come from stageCss at run time.
const tokens = JSON.parse(await readFile(path.join(web, 'tokens/figma-variables.json'), 'utf8'));
const m = tokenModel(tokens);
const styles = await readFile(path.join(web, 'src/styles/index.css'), 'utf8');
const variants = styles.slice(styles.indexOf('@custom-variant dark'), styles.indexOf('@layer base'));
const source = `@import "tailwindcss/theme.css" layer(theme);\n@theme {--color-*: initial; --radius-*: initial; --shadow-*: initial; --blur-*: initial;}\n@theme inline {${[...m.tw, ...m.chromeTw].join('\n')}}\n${variants}\n` +
  // The reset covers what the stage holds, never the stage itself: Builder sets the stage's own padding.
  '.ds-stage {box-sizing:border-box;}\n.ds-stage *, .ds-stage ::before, .ds-stage ::after {box-sizing:border-box;border:0 solid;margin:0;padding:0;}\n' +
  '.ds-stage :where(button,input,select,textarea) {font:inherit;color:inherit;background:transparent;}\n' +
  '.ds-stage :where(svg,img,video,canvas) {display:block;vertical-align:middle;}\n' +
  '.ds-stage {font-family:var(--font-family-ui);color:var(--color-text-primary);}\n' +
  '.ds-stage {@tailwind utilities;}';
const scanner = new Scanner({ sources: ['src/components', 'src/docs/stories', 'src/docs/blocks', 'src/icons', 'src/lib'].map(base => ({ base: path.join(web, base), pattern: '**/*', negated: false })) });
const candidates = scanner.scan();
const compiler = await compile(source, { base: web, onDependency() {} });
const css = optimize(compiler.build(candidates), { minify: true }).code;
await writeFile(path.join(out, 'items.css'), css);
console.log(`Builder items: ${candidates.length} candidates, ${Math.round(css.length / 1024)} KB CSS, bundle written to kit/manager/client/items/.`);
