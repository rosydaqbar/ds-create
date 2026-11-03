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
    for (const f of ['build-tokens.mjs', 'token-model.mjs', 'chrome-fallbacks.mjs']) copyFileSync(fileURLToPath(new URL(`./${f}`, import.meta.url)), join(dir, 'scripts', f));
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
      generated,
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

test('a single-mode component color that aliases a Light/Dark role gets its own Dark declaration', () => {
  const { css } = generate(null, {
    collections: [
      { name: 'Primitives', modes: ['Value'] },
      { name: 'Color', modes: ['Light', 'Dark'] },
      { name: 'Components', modes: ['Value'] },
    ],
    variables: [
      { name: 'palette/base/white', collection: 'Primitives', type: 'COLOR', values: { Value: '#ffffff' } },
      { name: 'palette/base/black', collection: 'Primitives', type: 'COLOR', values: { Value: '#000000' } },
      { name: 'color/text/primary', collection: 'Color', type: 'COLOR', values: { Light: { alias: 'palette/base/black' }, Dark: { alias: 'palette/base/white' } } },
      { name: 'switch/thumb/fill', collection: 'Components', type: 'COLOR', values: { Value: { alias: 'color/text/primary' } } },
      { name: 'switch/track/fixed', collection: 'Components', type: 'COLOR', values: { Value: { alias: 'palette/base/black' } } },
    ],
  });
  const dark = css.split('[data-theme="dark"] {')[1].split('\n}')[0];
  assert.match(dark, /--switch-thumb-fill: var\(--palette-base-white\);/);
  // An alias straight to a primitive has no Dark value to follow.
  assert.doesNotMatch(dark, /--switch-track-fixed/);
});

test('native Figma motion serializes seconds and easing objects without losing aliases or Reduced mode', () => {
  const curve={type:'CUSTOM_CUBIC_BEZIER',easingFunctionCubicBezier:{x1:.2,y1:0,x2:0,y2:1}};
  const {data,css,dtcg}=generate(null,{variables:[
    {name:'scale/duration/base',collection:'Primitives',type:'TIMING',values:{Value:.2}},
    {name:'scale/duration/zero',collection:'Primitives',type:'TIMING',values:{Value:0}},
    {name:'scale/easing/standard',collection:'Primitives',type:'EASING',values:{Value:curve}},
    {name:'motion/duration/base',collection:'Motion',type:'TIMING',values:{Standard:{alias:'scale/duration/base'},Reduced:{alias:'scale/duration/zero'}}},
    {name:'motion/delay/tooltip',collection:'Motion',type:'TIMING',values:{Standard:.4,Reduced:.4}},
    {name:'motion/easing/standard',collection:'Motion',type:'EASING',values:{Standard:{alias:'scale/easing/standard'},Reduced:{alias:'scale/easing/standard'}}}
  ]});
  assert.match(css,/--scale-duration-base: 0\.2s;/);assert.match(css,/--motion-delay-tooltip: 0\.4s;/);
  assert.match(css,/--scale-easing-standard: cubic-bezier\(0.2, 0, 0, 1\);/);
  assert.doesNotMatch(css,/\[object Object\]|cubic-bezier\(cubic-bezier/);
  assert.deepEqual(dtcg.scale.duration.base.$value,{value:.2,unit:'s'});
  assert.equal(dtcg.scale.easing.standard.$type,'cubicBezier');assert.deepEqual(dtcg.scale.easing.standard.$value,[.2,0,0,1]);
  const token=data.variables.find(v=>v.name==='motion/duration/base');
  assert.equal(token.modes.Standard.value,'0.2s');assert.equal(token.modes.Reduced.value,'0s');
  assert.equal(token.modes.Standard.alias,'scale/duration/base');
});

test('the token data from local files type-checks: raw easing values and effects with visible and blendMode', () => {
  const curve = { type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1: 0.2, y1: 0, x2: 0, y2: 1 } };
  const { data, generated } = generate(null, {
    file: 'foundations.json',
    variables: [{ name: 'scale/easing/standard', collection: 'Primitives', type: 'EASING', description: '', values: { Value: curve } }],
    // The shape kit/manager's local token export writes (foundations/export.mjs).
    effectStyles: [{ name: 'elevation/control', effects: [{ type: 'DROP_SHADOW', visible: true, blendMode: 'NORMAL', x: 0, y: 1, blur: 2, spread: 0, color: { r: 0, g: 0, b: 0, a: 0.1 } }] }],
  });
  assert.equal(data.variables[0].modes.Value.alias, null);
  const dir = mkdtempSync(join(tmpdir(), 'ds-token-types-'));
  try {
    writeFileSync(join(dir, 'tokens.gen.ts'), generated);
    copyFileSync(fileURLToPath(new URL('../src/tokens/types.ts', import.meta.url)), join(dir, 'types.ts'));
    const tsc = fileURLToPath(new URL('../node_modules/typescript/bin/tsc', import.meta.url));
    execFileSync(process.execPath, [tsc, '--noEmit', '--strict', '--target', 'es2022', '--moduleResolution', 'bundler', '--module', 'esnext', join(dir, 'tokens.gen.ts')], { stdio: 'pipe' });
  } catch (e) { assert.fail(String(e.stdout || e.message)); }
  finally { rmSync(dir, { recursive: true, force: true }); }
});

test('stageCss scopes a system\'s variables, dark values and text styles under one selector, as plain CSS', async () => {
  const { stageCss } = await import('./token-model.mjs');
  const css = stageCss({
    file: 'foundations.json', collections: [{ name: 'Primitives', modes: ['Value'] }, { name: 'Color', modes: ['Light', 'Dark'] }],
    variables: [
      { name: 'palette/base/white', collection: 'Primitives', type: 'COLOR', values: { Value: '#ffffff' } },
      { name: 'palette/base/black', collection: 'Primitives', type: 'COLOR', values: { Value: '#000000' } },
      { name: 'color/text/primary', collection: 'Color', type: 'COLOR', values: { Light: { alias: 'palette/base/black' }, Dark: { alias: 'palette/base/white' } } },
    ],
    textStyles: [{ name: 'type/body/md/regular', fontFamily: 'Example Sans', fontStyle: 'Regular', fontSize: 16, lineHeight: 24, letterSpacing: 0 }],
    effectStyles: [], gridStyles: [],
  }, '.ds-stage');
  assert.match(css, /^\.ds-stage \{\n  --palette-base-white: #ffffff;/);
  assert.match(css, /--color-text-primary: var\(--palette-base-black\);/);
  assert.match(css, /\.ds-stage\[data-theme="dark"\], \[data-theme="dark"\] \.ds-stage \{\n  --color-text-primary: var\(--palette-base-white\);/);
  assert.match(css, /\.ds-stage \.type-body-md-regular \{\n  font-family: "Example Sans", system-ui/);
  // Names the system lacks still get the site defaults, so a sample Part never draws with an empty value.
  assert.match(css, /\.ds-stage \{[^}]*--color-text-tertiary:/);
  assert.doesNotMatch(css, /@theme|@utility|:root/);
  // A system without Dark leaves the dark block out, so its drawings keep their Light values.
  assert.doesNotMatch(stageCss({ file: 'x', collections: [], variables: [], textStyles: [], effectStyles: [], gridStyles: [] }, '.ds-stage', { dark: false }), /data-theme/);
});

const gradientFixture = {
  variables: [
    { name: 'palette/base/white', collection: 'Primitives', type: 'COLOR', values: { Value: '#ffffff' } },
    { name: 'palette/base/black', collection: 'Primitives', type: 'COLOR', values: { Value: '#000000' } },
    { name: 'palette/brand/500', collection: 'Primitives', type: 'COLOR', values: { Value: '#c33734' } },
    { name: 'palette/brand/700', collection: 'Primitives', type: 'COLOR', values: { Value: '#7a1f1d' } },
    { name: 'color/text/primary', collection: 'Color', type: 'COLOR', values: { Light: { alias: 'palette/base/black' }, Dark: { alias: 'palette/base/white' } } },
  ],
  paintStyles: [
    { name: 'color/gradient/brand', description: '', paints: [{ type: 'GRADIENT_LINEAR', angle: 180, stops: [{ position: 0, color: { alias: 'palette/brand/500' } }, { position: 1, color: { alias: 'palette/brand/700' } }] }] },
    { name: 'color/gradient/text-fade', description: '', paints: [{ type: 'GRADIENT_LINEAR', angle: 90, stops: [{ position: 0, color: { alias: 'color/text/primary' } }, { position: 0.5, color: { r: 1, g: 0, b: 0, a: 0.5 } }, { position: 1, color: { r: 0, g: 0, b: 0, a: 1 } }] }] },
  ],
};

test('gradientCss writes angle, var() stops, trailing-zero-free percentages and literal colors', async () => {
  const { gradientCss } = await import('./token-model.mjs');
  assert.equal(gradientCss(gradientFixture.paintStyles[0].paints[0]), 'linear-gradient(180deg, var(--palette-brand-500) 0%, var(--palette-brand-700) 100%)');
  assert.equal(gradientCss(gradientFixture.paintStyles[1].paints[0]), 'linear-gradient(90deg, var(--color-text-primary) 0%, rgba(255, 0, 0, 0.5) 50%, #000000 100%)');
  assert.equal(gradientCss({ angle: 45, stops: [{ position: 0.125, color: { alias: 'a/b.c' } }, { position: 1, color: { alias: 'x' } }] }, (c) => c.alias), 'linear-gradient(45deg, a/b.c 12.5%, x 100%)');
});

test('a gradient is declared in the light and dark blocks, resolves per mode, and stays out of the Tailwind theme', () => {
  const { data, css } = generate(null, gradientFixture);
  const light = css.split('\n').filter((l) => /--color-gradient-/.test(l));
  assert.ok(css.includes('--color-gradient-brand: linear-gradient(180deg, var(--palette-brand-500) 0%, var(--palette-brand-700) 100%);'));
  assert.ok(css.includes('--color-gradient-text-fade: linear-gradient(90deg, var(--palette-base-black) 0%, rgba(255, 0, 0, 0.5) 50%, #000000 100%);'));
  assert.ok(css.includes('--color-gradient-text-fade: linear-gradient(90deg, var(--palette-base-white) 0%'), 'dark value follows the aliased semantic');
  assert.equal(light.filter((l) => l.includes('--color-gradient-brand:')).length, 2, 'declared in both the light and the dark block');
  // The `@theme inline` block carries the --color-* mappings; the plain `@theme` block is only the resets.
  const theme = css.match(/@theme inline \{[\s\S]*?\n\}/)?.[0] ?? '';
  assert.match(theme, /--color-text-primary: var\(--color-text-primary\);/, 'the inline block is the one that maps colors');
  assert.doesNotMatch(theme, /gradient/);
  assert.doesNotMatch(css.match(/@theme \{[\s\S]*?\n\}/)?.[0] ?? '', /gradient/);
  const g = data.paintStyles.find((s) => s.name === 'color/gradient/text-fade');
  assert.equal(g.css, '--color-gradient-text-fade');
  assert.equal(g.tailwind, 'bg-(image:--color-gradient-text-fade)');
  assert.match(g.light, /var\(--palette-base-black\) 0%/);
  assert.match(g.dark, /var\(--palette-base-white\) 0%/);
  assert.equal(data.paintStyles.length, 2);
});

test('stageCss holds a gradient in the light block and redeclares an aliased one in the dark block', async () => {
  const { stageCss } = await import('./token-model.mjs');
  const css = stageCss({ file: 'x', collections: [{ name: 'Primitives', modes: ['Value'] }, { name: 'Color', modes: ['Light', 'Dark'] }], textStyles: [], effectStyles: [], gridStyles: [], ...gradientFixture }, '.ds-stage');
  const [light, dark] = css.split('.ds-stage[data-theme="dark"]');
  assert.match(light, /--color-gradient-brand: linear-gradient\(180deg, var\(--palette-brand-500\) 0%, var\(--palette-brand-700\) 100%\);/);
  assert.match(dark, /--color-gradient-text-fade: linear-gradient\(90deg, var\(--palette-base-white\) 0%/);
  assert.doesNotMatch(css, /@theme/);
});
