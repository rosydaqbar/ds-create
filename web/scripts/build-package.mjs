/**
 * Builds the installable package in package/:
 *   dist/index.js      React components (ESM; react, react-dom and the small runtime deps stay external)
 *   types/             TypeScript declarations
 *   styles.css         Tailwind v4 entry: tokens, theme mapping, state variants, text/motion utilities, @source
 *   theme.css          the generated token theme (imported by styles.css)
 *   tokens.css         plain CSS variables only, for projects without Tailwind
 *   tokens.json        DTCG tokens
 * Run: npm run build:package   (then `npm pack ./package` to get an installable tarball)
 */
import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'package');
const app = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const cfg = fs.readFileSync(path.join(root, 'src/ds.config.ts'), 'utf8');
const pick = (k) => cfg.match(new RegExp(`${k}:\\s*'([^']+)'`))?.[1];
const name = pick('packageName');
const version = `${pick('version')}.0`.split('.').slice(0, 3).join('.');
const displayName = pick('name');
if (!name) throw new Error('ds.config.ts needs packageName');

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const runtimeDeps = ['class-variance-authority', 'clsx', 'lucide-react', 'simple-icons'];
const external = [/^react($|\/)/, /^react-dom($|\/)/, ...runtimeDeps.map((d) => new RegExp(`^${d}($|/)`))];

// 1. JavaScript
await build({
  root,
  configFile: false,
  logLevel: 'warn',
  plugins: [react()],
  resolve: { alias: { '@': path.join(root, 'src') } },
  build: {
    outDir: path.join(out, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    assetsInlineLimit: 100_000,
    lib: { entry: path.join(root, 'src/components/index.ts'), formats: ['es'], fileName: () => 'index.js' },
    rollupOptions: { external },
  },
});

// 2. Types: emit declarations, then turn the `@/…` alias into relative paths.
const tsconfig = path.join(out, 'tsconfig.types.json');
fs.writeFileSync(
  tsconfig,
  JSON.stringify({
    extends: path.join(root, 'tsconfig.json'),
    compilerOptions: { noEmit: false, declaration: true, emitDeclarationOnly: true, outDir: path.join(out, 'types'), rootDir: path.join(root, 'src'), types: ['vite/client'] },
    include: [path.join(root, 'src/components'), path.join(root, 'src/icons'), path.join(root, 'src/lib'), path.join(root, 'src/vite-env.d.ts')].filter((p) => fs.existsSync(p)),
  }),
);
execSync(`npx tsc -p "${tsconfig}"`, { cwd: root, stdio: 'inherit' });
fs.rmSync(tsconfig);
const typesDir = path.join(out, 'types');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
for (const f of walk(typesDir).filter((f) => f.endsWith('.d.ts'))) {
  const src = fs.readFileSync(f, 'utf8').replace(/(['"])@\/([^'"]+)\1/g, (_, q, p) => {
    let rel = path.relative(path.dirname(f), path.join(typesDir, p)).split(path.sep).join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return `${q}${rel}${q}`;
  });
  fs.writeFileSync(f, src);
}

// 3. CSS
const tokensCss = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
fs.writeFileSync(path.join(out, 'theme.css'), tokensCss);
// Plain variables: every top-level rule that is not a Tailwind at-rule (@theme, @utility).
const plain = [];
let depth = 0;
let buf = '';
let keep = false;
for (const line of tokensCss.split('\n')) {
  if (depth === 0) {
    const t = line.trim();
    if (!t || t.startsWith('/*') || t.startsWith('*') || t.startsWith('//')) continue;
    if (!buf) keep = !/^@(theme|utility|custom-variant|import|source)\b/.test(t);
  }
  buf += line + '\n';
  depth += (line.match(/{/g) ?? []).length - (line.match(/}/g) ?? []).length;
  if (depth === 0 && line.includes('}') && buf.trim()) {
    if (keep) plain.push(buf.trimEnd());
    buf = '';
  }
}
fs.writeFileSync(path.join(out, 'tokens.css'), `/* ${displayName} tokens as plain CSS variables. Light on :root, Dark on [data-theme="dark"]. */\n${plain.join('\n\n')}\n`);
const indexCss = fs.readFileSync(path.join(root, 'src/styles/index.css'), 'utf8');
const rest = indexCss
  .split('\n')
  .filter((l) => !/^@import\s+["'](tailwindcss|\.\/tokens\.css)["'];/.test(l.trim()))
  .join('\n');
fs.writeFileSync(
  path.join(out, 'styles.css'),
  `/*
 * ${displayName} for Tailwind CSS v4. Import after Tailwind:
 *   @import "tailwindcss";
 *   @import "${name}/styles.css";
 */
@import "./theme.css";
/* Generate the utilities the components use. */
@source "./dist";
${rest}`,
);
fs.copyFileSync(path.join(root, 'tokens/tokens.dtcg.json'), path.join(out, 'tokens.json'));

// 4. package.json + README
const deps = Object.fromEntries(runtimeDeps.map((d) => [d, app.dependencies[d]]));
fs.writeFileSync(
  path.join(out, 'package.json'),
  JSON.stringify(
    {
      name,
      version,
      description: `${displayName}: tokens, Tailwind styles and React components generated from the Figma file.`,
      type: 'module',
      main: './dist/index.js',
      module: './dist/index.js',
      types: './types/components/index.d.ts',
      exports: {
        '.': { types: './types/components/index.d.ts', import: './dist/index.js' },
        './styles.css': './styles.css',
        './theme.css': './theme.css',
        './tokens.css': './tokens.css',
        './tokens.json': './tokens.json',
      },
      files: ['dist', 'types', 'styles.css', 'theme.css', 'tokens.css', 'tokens.json', 'README.md'],
      sideEffects: ['*.css'],
      peerDependencies: { react: '>=19', 'react-dom': '>=19', tailwindcss: '>=4' },
      peerDependenciesMeta: { tailwindcss: { optional: true } },
      dependencies: deps,
    },
    null,
    2,
  ) + '\n',
);
fs.writeFileSync(
  path.join(out, 'README.md'),
  `# ${name}

${displayName}. Props match the Figma component properties.

\`\`\`sh
npm install ${name}
\`\`\`

\`\`\`css
/* app.css */
@import "tailwindcss";
@import "${name}/styles.css";
\`\`\`

\`\`\`tsx
import { Button } from '${name}';

<Button size="lg" leadingIcon="general/check" label="Save changes" />
\`\`\`

Dark mode: \`data-theme="dark"\` on \`<html>\` or any element. Reduced motion follows the OS or \`data-motion="reduced"\`.
Without Tailwind, import \`${name}/tokens.css\` for the CSS variables. DTCG tokens: \`${name}/tokens.json\`.
`,
);
const size = (f) => `${(fs.statSync(path.join(out, f)).size / 1024).toFixed(0)} kB`;
console.log(`package: ${name}@${version} → package/ (dist/index.js ${size('dist/index.js')}, styles.css, tokens.css ${size('tokens.css')}, tokens.json)`);
