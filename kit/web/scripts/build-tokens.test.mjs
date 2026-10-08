import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

function generate(accepted, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'ds-token-modes-'));
  try {
    mkdirSync(join(dir, 'scripts'));
    mkdirSync(join(dir, 'tokens'));
    for (const f of ['build-tokens.mjs', 'chrome-fallbacks.mjs']) copyFileSync(fileURLToPath(new URL(`./${f}`, import.meta.url)), join(dir, 'scripts', f));
    const src = {
      file: { name: 'Mode regression fixture' },
      collections: [
        { name: 'Primitives', modes: ['Value'] },
        { name: 'Color', modes: ['Light', 'Dark'] },
        { name: 'Border', modes: ['M', 'S', 'L'] },
        { name: 'Motion', modes: ['Standard', 'Reduced'] },
      ],
      variables: [
        { name: 'palette/base/white', collection: 'Primitives', type: 'COLOR', values: { Value: '#ffffff' } },
        { name: 'palette/base/black', collection: 'Primitives', type: 'COLOR', values: { Value: '#000000' } },
        { name: 'color/text/primary', collection: 'Color', type: 'COLOR', values: { Light: { alias: 'palette/base/black' }, Dark: { alias: 'palette/base/white' } } },
        { name: 'border/width/default', collection: 'Border', type: 'FLOAT', values: { M: 1.5, S: 1, L: 2 } },
        { name: 'border/width/alias', collection: 'Border', type: 'FLOAT', values: { M: { alias: 'border/width/default' }, S: { alias: 'border/width/default' }, L: { alias: 'border/width/default' } } },
        { name: 'motion/duration/base', collection: 'Motion', type: 'FLOAT', values: { Standard: 200, Reduced: 0 } },
      ],
      textStyles: [], effectStyles: [], gridStyles: [], pages: [],
      ...extra,
    };
    writeFileSync(join(dir, 'tokens/figma-variables.json'), JSON.stringify(src));
    if (accepted) writeFileSync(join(dir, 'tokens/accepted.json'), JSON.stringify(accepted));
    execFileSync(process.execPath, [join(dir, 'scripts/build-tokens.mjs')], { stdio: 'pipe' });
    const generated = readFileSync(join(dir, 'src/tokens/tokens.gen.ts'), 'utf8');
    return {
      data: JSON.parse(generated.split('export const tokens: TokenData = ')[1].trim().slice(0, -1)),
      css: readFileSync(join(dir, 'src/styles/tokens.css'), 'utf8'),
      chrome: readFileSync(join(dir, 'src/styles/chrome.gen.css'), 'utf8'),
      dtcg: JSON.parse(readFileSync(join(dir, 'tokens/tokens.dtcg.json'), 'utf8')),
    };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test('custom modes preserve their own values through aliases; named color and motion modes still resolve', () => {
  const { data, css, dtcg } = generate();
  const token = name => data.variables.find(v => v.name === name);
  for (const name of ['border/width/default', 'border/width/alias']) {
    assert.deepEqual(Object.fromEntries(Object.entries(token(name).modes).map(([m, v]) => [m, v.value])), { M: '1.5px', S: '1px', L: '2px' });
  }
  assert.equal(token('color/text/primary').modes.Light.value, '#000000');
  assert.equal(token('color/text/primary').modes.Dark.value, '#ffffff');
  assert.equal(token('motion/duration/base').modes.Standard.value, '200ms');
  assert.equal(token('motion/duration/base').modes.Reduced.value, '0ms');
  assert.match(css, /--border-width-default: 1\.5px;/); // default CSS value is unchanged
  assert.deepEqual(dtcg.border.width.default.$extensions['ds-create.modes'], { M: '1.5px', S: '1px', L: '2px' });
});


test('unsupported modes are left out of the generated reference and kept as a note on the collection', () => {
  const { data, css, dtcg } = generate({ unsupportedModes: { Color: ['Dark'] } });
  const color = data.variables.find((v) => v.name === 'color/text/primary');
  assert.deepEqual(Object.keys(color.modes), ['Light']);
  const col = data.collections.find((c) => c.name === 'Color');
  assert.deepEqual(col.modes, ['Light']);
  assert.deepEqual(col.unsupportedModes, ['Dark']);
  assert.equal(dtcg.color.text.primary.$extensions['ds-create.modes'], undefined);
  assert.doesNotMatch(css.split('[data-theme="dark"] {')[1].split('\n}')[0], /--color-text-primary:/);
});

test('raw text styles keep their own size, line height, spacing, weight and a fallback family', () => {
  const { data, css } = generate(null, {
    textStyles: [
      { name: 'type/body/md/bold', fontFamily: 'Example Sans', fontStyle: 'Bold', fontSize: 16, lineHeight: 24, letterSpacing: 0.2 },
      { name: 'type/body/sm/regular', fontFamily: 'Example Sans', fontStyle: 'Regular', fontSize: 14, lineHeight: 20, letterSpacing: 0 },
      { name: 'type/code/sm/regular', fontFamily: 'Example Mono', fontStyle: 'Italic', fontSize: 12, lineHeight: 16, letterSpacing: 0 },
    ],
  });
  const util = (n) => css.split(`@utility ${n} {`)[1].split('}')[0];
  assert.match(util('type-body-md-bold'), /font-family: "Example Sans", system-ui/);
  assert.match(util('type-body-md-bold'), /font-size: 16px;[\s\S]*line-height: 24px;[\s\S]*letter-spacing: 0\.2px;[\s\S]*font-weight: 700;/);
  assert.match(util('type-code-sm-regular'), /ui-monospace[\s\S]*font-weight: 400;[\s\S]*font-style: italic;/);
  assert.match(css, /--font-family-ui: "Example Sans", system-ui/);
  assert.equal(data.textStyles[0].fontWeight, '700');
  assert.deepEqual(data.textStyles[0].bound, {});
});

test('site chrome names the file does not define get a site-only default in chrome.gen.css; defined names never do', () => {
  const { data, css, chrome } = generate(null, {
    textStyles: [{ name: 'type/body/md/regular', fontFamily: 'Example Sans', fontStyle: 'Regular', fontSize: 16, lineHeight: 24, letterSpacing: 0 }],
  });
  const light = chrome.split(':root,\n[data-theme="light"] {')[1].split('\n}')[0];
  const dark = chrome.split('[data-theme="dark"] {')[1].split('\n}')[0];
  // Defined by the fixture: no default.
  assert.doesNotMatch(chrome, /--color-text-primary: var\(--chrome-ink\)/);
  // Missing: a default in both color blocks, and a utility name.
  assert.match(light, /--color-text-tertiary: var\(--color-text-secondary\);/);
  assert.match(dark, /--color-border-subtle: color-mix\(/);
  assert.match(light, /--space-sm: calc\(/);
  assert.match(chrome, /--spacing-sm: var\(--space-sm\);/);
  assert.match(chrome, /@utility type-body-xs-semibold \{/);
  assert.doesNotMatch(chrome, /@utility type-body-md-regular /);
  // tokens.css (the brand's tokens, shipped in the package) never holds a fallback.
  assert.doesNotMatch(css, /chrome-ink|--color-text-tertiary/);
  // Never in the site data: token tables only show the Figma export.
  assert.equal(data.variables.some((v) => v.css === '--color-text-tertiary'), false);
});
