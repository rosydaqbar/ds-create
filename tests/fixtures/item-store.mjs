// A small systemMode:new foundation draft for the item store tests: primitives, semantics in four collections,
// one text style and one effect style, with the plan that lists them per domain.
const web = name => ({ WEB: `var(--${name.replaceAll('/', '-')})` });
const primitive = (name, type, value) => ({ name, collection: 'Primitives', type, values: { Value: value }, scopes: [], hiddenFromPublishing: true, codeSyntax: web(name) });
const semantic = (name, collection, type, values, scopes, description) => ({ name, collection, type, values, description, scopes, codeSyntax: web(name) });
const both = alias => ({ Light: { alias }, Dark: { alias } });
const one = alias => ({ Value: { alias } });

export function itemDraft() {
  return {
    format: 'ds-create/foundations@1', revision: 1,
    collections: [{ name: 'Primitives', modes: ['Value'] }, { name: 'Color', modes: ['Light', 'Dark'] }, { name: 'Shape', modes: ['Value'] }, { name: 'Typography', modes: ['Value'] }],
    variables: [
      primitive('palette/base/white', 'COLOR', '#ffffff'),
      primitive('palette/brand/500', 'COLOR', '#c33734'),
      primitive('scale/radius/0', 'FLOAT', 0),
      primitive('scale/radius/4', 'FLOAT', 4),
      primitive('scale/radius/8', 'FLOAT', 8),
      primitive('scale/radius/9999', 'FLOAT', 9999),
      primitive('scale/font-size/16', 'FLOAT', 16),
      primitive('scale/font-family/sans', 'STRING', 'Inter'),
      semantic('color/surface/base', 'Color', 'COLOR', both('palette/base/white'), ['FRAME_FILL'], 'Default page and card surface.'),
      semantic('color/brand/primary', 'Color', 'COLOR', both('palette/brand/500'), ['ALL_FILLS'], 'Primary brand emphasis.'),
      semantic('color/shadow/ambient', 'Color', 'COLOR', both('palette/brand/500'), ['EFFECT_COLOR'], 'Soft ambient shadow color.'),
      semantic('radius/none', 'Shape', 'FLOAT', one('scale/radius/0'), ['CORNER_RADIUS'], 'Square corners.'),
      semantic('radius/sm', 'Shape', 'FLOAT', one('scale/radius/4'), ['CORNER_RADIUS'], 'Small controls.'),
      semantic('radius/control', 'Shape', 'FLOAT', one('scale/radius/8'), ['CORNER_RADIUS'], 'Buttons and inputs.'),
      semantic('radius/full', 'Shape', 'FLOAT', one('scale/radius/9999'), ['CORNER_RADIUS'], 'Pills and avatars.'),
      semantic('font/size/body-md', 'Typography', 'FLOAT', one('scale/font-size/16'), ['FONT_SIZE'], 'Body text size.'),
      semantic('font/family/ui', 'Typography', 'STRING', one('scale/font-family/sans'), ['FONT_FAMILY'], 'Interface typeface.'),
    ],
    textStyles: [{ name: 'type/body/md/regular', fontFamily: 'Inter', fontStyle: 'Regular', fontSize: 16, lineHeight: { unit: 'PIXELS', value: 24 }, bound: { fontSize: 'font/size/body-md', fontFamily: 'font/family/ui' } }],
    effectStyles: [{ name: 'elevation/control', effects: [{ type: 'DROP_SHADOW', offset: { x: 0, y: 1 }, radius: 2, spread: 0, color: { alias: 'color/shadow/ambient' } }] }],
    gridStyles: [],
  };
}

export function itemRules() {
  const d = itemDraft();
  return {
    format: 'ds-create/foundation-rules@1',
    discuss: { maxSemantics: 10, maxFamilies: 1, contract: true, colorRules: true },
    palettes: { brand: { anchors: { 50: '#FCF3F2', 500: '#C33734', 950: '#2E0D0C' }, steps: [50, 500, 950], rule: 'ramp' } },
    contract: [...d.variables, ...d.textStyles, ...d.effectStyles].map(x => x.name),
  };
}

export function itemPlan() {
  const excluded = { status: 'excluded', reason: 'Not part of this fixture.', source: 'chat/fixture.md' };
  return {
    format: 'ds-create/foundation-plan@1', inputHash: 'fixture-hash', inputRevision: 1, projectName: 'Fixture',
    product: { name: 'Fixture', description: 'Item store fixture', platform: 'Web' }, systemMode: 'new', naming: 'normalize',
    decisions: [{ key: 'Product', value: 'Fixture', decidedBy: 'user', source: 'chat/fixture.md' }],
    domains: {
      color: { status: 'included', variables: ['palette/base/white', 'palette/brand/500', 'color/surface/base', 'color/brand/primary', 'color/shadow/ambient'], styles: [] },
      typography: { status: 'included', variables: ['scale/font-size/16', 'scale/font-family/sans', 'font/size/body-md', 'font/family/ui'], styles: ['type/body/md/regular'] },
      space: { ...excluded },
      shape: { status: 'included', variables: ['scale/radius/0', 'scale/radius/4', 'scale/radius/8', 'scale/radius/9999', 'radius/none', 'radius/sm', 'radius/control', 'radius/full'], styles: [] },
      elevation: { status: 'included', variables: [], styles: ['elevation/control'] },
      motion: { ...excluded },
    },
  };
}

// A session output folder holding the fixture draft, plan, ledger and setup, as preparation leaves them.
export async function storeFixture({ plan = true, decisions = null, dir: into = null } = {}) {
  const { mkdtemp, mkdir, writeFile, rm, realpath } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const path = (await import('node:path')).default;
  const dir = into || await realpath(await mkdtemp(path.join(tmpdir(), 'ds-item-store-')));
  const json = value => JSON.stringify(value, null, 2) + '\n';
  await mkdir(path.join(dir, 'manager'), { recursive: true });
  await writeFile(path.join(dir, 'foundations.json'), json(itemDraft()));
  if (plan) await writeFile(path.join(dir, 'foundation-plan.json'), json(itemPlan()));
  await writeFile(path.join(dir, 'ds-create-ledger.json'), json({ system: 'Fixture', foundationReview: { status: 'approved', hash: 'x' }, flags: { guidelines: false } }));
  await writeFile(path.join(dir, 'manager/setup.json'), json({ projectName: 'Fixture', interfaceDetails: { modes: ['Light', 'Dark'] }, ...(decisions ? { jobId: 'job-1' } : {}) }));
  if (decisions) { await mkdir(path.join(dir, 'manager/setup-jobs/job-1'), { recursive: true }); await writeFile(path.join(dir, 'manager/setup-jobs/job-1/decisions.json'), json(decisions)); }
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}
