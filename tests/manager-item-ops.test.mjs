import test from 'node:test';
import assert from 'node:assert/strict';
import { applyOps, isWide, ItemError } from '../kit/manager/foundations/ops.mjs';
import { itemDraft, itemPlan, itemRules } from './fixtures/item-store.mjs';

const F = { target: 'foundations' };
const find = (draft, name) => draft.variables.find(v => v.name === name);
const run = (ops, extra = {}) => applyOps(itemDraft(), ops.map(op => ({ ...F, ...op })), { plan: itemPlan(), ...extra });

test('set on a primitive moves everything that aliases it', () => {
  const r = run([{ op: 'set', name: 'scale/radius/8', mode: 'Value', value: 12 }]);
  assert.deepEqual(find(r.draft, 'radius/control').values, { Value: { alias: 'scale/radius/8' } });
  assert.deepEqual(r.impact.primitives, ['scale/radius/8']);
  assert.deepEqual(r.impact.semantics.find(s => s.name === 'radius/control'), { name: 'radius/control', mode: 'Value', from: 8, to: 12 });
});

test('set changes one mode and leaves inputs untouched', () => {
  const draft = itemDraft(), before = structuredClone(draft);
  const r = applyOps(draft, [{ ...F, op: 'set', name: 'color/brand/primary', mode: 'Light', alias: 'palette/base/white' }], { plan: itemPlan() });
  assert.deepEqual(find(r.draft, 'color/brand/primary').values, { Light: { alias: 'palette/base/white' }, Dark: { alias: 'palette/brand/500' } });
  assert.deepEqual(draft, before);
});

test('literal on semantic aliases a primitive', () => {
  const ten = run([{ op: 'set', name: 'radius/control', mode: 'Value', value: 10 }]);
  assert.deepEqual(find(ten.draft, 'radius/control').values, { Value: { alias: 'scale/radius/10' } });
  const created = find(ten.draft, 'scale/radius/10');
  assert.equal(created.collection, 'Primitives');
  assert.equal(created.hiddenFromPublishing, true);
  assert.deepEqual(created.scopes, []);
  assert.deepEqual(created.values, { Value: 10 });
  assert.equal(created.codeSyntax.WEB, 'var(--scale-radius-10)');
  const eight = run([{ op: 'set', name: 'radius/sm', mode: 'Value', value: 8 }]);
  assert.deepEqual(find(eight.draft, 'radius/sm').values, { Value: { alias: 'scale/radius/8' } });
  assert.equal(eight.draft.variables.length, itemDraft().variables.length);
  const color = run([{ op: 'set', name: 'color/brand/primary', mode: 'Light', value: '#1A2B3C' }]);
  assert.deepEqual(find(color.draft, 'color/brand/primary').values.Light, { alias: 'palette/custom/1a2b3c' });
  assert.equal(find(color.draft, 'palette/custom/1a2b3c').values.Value, '#1a2b3c');
});

test('rename cascades', () => {
  const r = run([{ op: 'rename', from: 'color/shadow/ambient', to: 'color/shadow/soft' }, { op: 'rename', from: 'font/size/body-md', to: 'font/size/body' }]);
  assert.deepEqual(r.draft.effectStyles[0].effects[0].color, { alias: 'color/shadow/soft' });
  assert.equal(find(r.draft, 'color/shadow/soft').codeSyntax.WEB, 'var(--color-shadow-soft)');
  assert.ok(r.plan.domains.color.variables.includes('color/shadow/soft'));
  assert.ok(!r.plan.domains.color.variables.includes('color/shadow/ambient'));
  assert.equal(r.draft.textStyles[0].bound.fontSize, 'font/size/body');
});

test('delete refuses while referenced', () => {
  assert.throws(() => run([{ op: 'delete', name: 'scale/radius/8' }]), e => e instanceof ItemError && e.message === 'scale/radius/8 is used by 1 item; pass replaceWith to delete it.');
  const r = run([{ op: 'delete', name: 'scale/radius/8', replaceWith: 'scale/radius/4' }]);
  assert.equal(find(r.draft, 'scale/radius/8'), undefined);
  assert.deepEqual(find(r.draft, 'radius/control').values, { Value: { alias: 'scale/radius/4' } });
  assert.ok(!r.plan.domains.shape.variables.includes('scale/radius/8'));
});

test('add rejects duplicates and unknown collections', () => {
  const item = structuredClone(find(itemDraft(), 'radius/sm'));
  assert.throws(() => run([{ op: 'add', kind: 'variable', item }]), { message: 'radius/sm already exists.' });
  assert.throws(() => run([{ op: 'add', kind: 'variable', item: { ...item, name: 'radius/xl', collection: 'Nope' } }]), { message: 'Collection Nope does not exist.' });
  const added = run([{ op: 'add', kind: 'variable', item: { ...item, name: 'radius/xl', codeSyntax: { WEB: 'var(--radius-xl)' } } }]);
  assert.ok(added.plan.domains.shape.variables.includes('radius/xl'));
});

test('structural errors refuse', () => {
  assert.throws(() => run([{ op: 'set', name: 'radius/sm', mode: 'Value', alias: 'palette/brand/500' }]), e => e instanceof ItemError && /incompatible alias/.test(e.message));
});

test('warnings come from validatePlan', () => {
  const r = run([{ op: 'rename', from: 'radius/sm', to: 'corner/small' }]);
  assert.ok(r.warnings.some(w => /corner\/small: name does not match its collection/.test(w)), r.warnings.join('\n'));
  assert.ok(!r.warnings.some(w => /decisions|product name/i.test(w)), 'source-only plan checks are dropped');
});

test('target other than foundations is refused', () => {
  assert.throws(() => applyOps(itemDraft(), [{ op: 'set', target: 'part:button', name: 'x', mode: 'Value', value: 1 }], { plan: itemPlan() }), { message: 'Only foundations can be changed in this version.' });
});

// Task 2: recipes, color rules and discussion limits.
const withRules = (ops, rules = itemRules(), draft = itemDraft()) => applyOps(draft, ops.map(op => ({ ...F, ...op })), { plan: itemPlan(), rules });
const impactOf = (semantics = 0, families = []) => ({ primitives: [], semantics: Array.from({ length: semantics }, (_, i) => ({ name: `color/x/${i}`, mode: 'Light', from: 1, to: 2 })), styles: [], families, rulesBroken: [] });
function withBrand300() {
  const draft = itemDraft();
  draft.variables.splice(2, 0, { ...structuredClone(find(draft, 'palette/brand/500')), name: 'palette/brand/300', values: { Value: '#e07a74' }, codeSyntax: { WEB: 'var(--palette-brand-300)' } });
  const rules = itemRules(); rules.palettes.brand.steps = [50, 300, 500, 950];
  return { draft, rules };
}

test('brand anchor change reports impact', () => {
  const r = withRules([{ op: 'apply', recipe: 'palette-ramp', family: 'brand', anchors: { 500: '#2563EB' } }]);
  assert.deepEqual(r.impact.families, ['palette/brand']);
  assert.ok(r.impact.semantics.some(s => s.name === 'color/brand/primary'));
  assert.equal(find(r.draft, 'palette/brand/500').values.Value.toLowerCase(), '#2563eb');
});

test('isWide thresholds', () => {
  const radius = withRules([{ op: 'set', name: 'radius/control', mode: 'Value', value: 10 }]);
  assert.equal(isWide(radius.impact, [{ ...F, op: 'set', name: 'radius/control' }], itemRules()), null);
  assert.match(isWide(impactOf(11), [], itemRules()), /11 semantic tokens/);
  assert.match(isWide(impactOf(0, ['palette/brand', 'palette/red']), [], itemRules()), /2 palette families/);
  assert.match(isWide(impactOf(0), [{ ...F, op: 'rename', from: 'radius/sm', to: 'radius/small' }], itemRules()), /contract/);
  assert.match(isWide({ ...impactOf(0), rulesBroken: ['palette/brand: step 300 set outside its OKLab ramp'] }, [], itemRules()), /color rule/);
});

test('limits come from rules', () => {
  const rules = itemRules(); rules.discuss.maxSemantics = 20; rules.discuss.contract = false;
  assert.equal(isWide(impactOf(11), [], rules), null);
  assert.equal(isWide(impactOf(0), [{ ...F, op: 'rename', from: 'radius/sm', to: 'radius/small' }], rules), null);
});

test('rules op merges and is wide', () => {
  const ops = [{ op: 'set', kind: 'rules', fields: { discuss: { maxSemantics: 20 } } }];
  const r = withRules(ops);
  assert.equal(r.rules.discuss.maxSemantics, 20);
  assert.equal(r.rules.discuss.maxFamilies, 1);
  assert.match(isWide(r.impact, ops.map(op => ({ ...F, ...op })), r.rules), /rules/);
});

test('single non-anchor step breaks the ramp', () => {
  const { draft, rules } = withBrand300();
  const r = withRules([{ op: 'set', name: 'palette/brand/300', mode: 'Value', value: '#ff0000' }], rules, draft);
  assert.deepEqual(r.impact.rulesBroken, ['palette/brand: step 300 set outside its OKLab ramp']);
  assert.equal(r.rules.palettes.brand.rule, 'custom');
});

test('anchor step set regenerates', () => {
  const { draft, rules } = withBrand300();
  const r = withRules([{ op: 'set', name: 'palette/brand/500', mode: 'Value', value: '#2563EB' }], rules, draft);
  assert.deepEqual(r.impact.rulesBroken, []);
  assert.notEqual(find(r.draft, 'palette/brand/300').values.Value, '#e07a74', 'the step between anchors is regenerated');
  assert.equal(r.rules.palettes.brand.anchors[500], '#2563EB');
  assert.equal(r.rules.palettes.brand.rule, 'ramp');
});

test('radius-base 0.75rem doubles nothing it shouldn\'t', () => {
  const r = withRules([{ op: 'apply', recipe: 'radius-base', rem: 0.75 }]);
  assert.deepEqual(find(r.draft, 'radius/none').values, { Value: { alias: 'scale/radius/0' } });
  assert.deepEqual(find(r.draft, 'radius/full').values, { Value: { alias: 'scale/radius/9999' } });
  assert.deepEqual(find(r.draft, 'radius/control').values, { Value: { alias: 'scale/radius/12' } });
  assert.equal(find(r.draft, 'scale/radius/12').values.Value, 12);
});

test('type-scale 125 scales text styles and size tokens', () => {
  const r = withRules([{ op: 'apply', recipe: 'type-scale', percent: 125 }]);
  assert.deepEqual(find(r.draft, 'font/size/body-md').values, { Value: { alias: 'scale/font-size/20' } });
  assert.equal(r.draft.textStyles[0].fontSize, 20);
  assert.deepEqual(r.draft.textStyles[0].lineHeight, { unit: 'PIXELS', value: 30 });
});

test('type-family role ui only touches its styles', () => {
  const draft = itemDraft();
  draft.textStyles.push({ name: 'type/code/md/regular', fontFamily: 'JetBrains Mono', fontStyle: 'Regular', fontSize: 14, lineHeight: { unit: 'PIXELS', value: 20 } });
  const r = withRules([{ op: 'apply', recipe: 'type-family', family: 'Geist', role: 'ui' }], itemRules(), draft);
  // The role's token points at a primitive named after the new family; the old primitive keeps its value.
  assert.deepEqual(find(r.draft, 'font/family/ui').values, { Value: { alias: 'scale/font-family/geist' } });
  assert.equal(find(r.draft, 'scale/font-family/geist').values.Value, 'Geist');
  assert.equal(r.draft.textStyles[0].fontFamily, 'Geist');
  assert.equal(r.draft.textStyles[1].fontFamily, 'JetBrains Mono');
});

test('shadow-seed writes draft-shaped effects', () => {
  const r = withRules([{ op: 'apply', recipe: 'shadow-seed', seed: { x: 0, y: 2, blur: 4, spread: 0, color: 'color/shadow/ambient', opacity: 100 } }]);
  const [effect] = r.draft.effectStyles[0].effects;
  assert.deepEqual(effect.offset, { x: 0, y: 2 });
  assert.equal(effect.radius, 4);
  assert.deepEqual(effect.color, { alias: 'color/shadow/ambient' });
  for (const key of ['x', 'y', 'blur']) assert.equal(key in effect, false, key);
});

test('palette-ramp updates existing steps only', () => {
  const r = withRules([{ op: 'apply', recipe: 'palette-ramp', family: 'brand', anchors: { 500: '#2563EB' } }]);
  assert.equal(r.draft.variables.length, itemDraft().variables.length);
  assert.equal(find(r.draft, 'palette/brand/50'), undefined);
});

test('unknown recipe is refused', () => {
  assert.throws(() => withRules([{ op: 'apply', recipe: 'bogus' }]), { message: 'Unknown recipe: bogus.' });
});

test('callers cannot skip the ramp rule', () => {
  const { draft, rules } = withBrand300();
  const r = withRules([{ op: 'set', name: 'palette/brand/300', mode: 'Value', value: '#ff0000', fromRamp: true }], rules, draft);
  assert.deepEqual(r.impact.rulesBroken, ['palette/brand: step 300 set outside its OKLab ramp']);
});

// Final review fixes.
test('regenerating a ramp family always needs discussion', () => {
  const ops = [{ op: 'apply', recipe: 'palette-ramp', family: 'brand', anchors: { 500: '#2563EB' } }];
  const r = withRules(ops);
  assert.match(isWide(r.impact, ops.map(op => ({ ...F, ...op })), r.rules), /palette\/brand ramp/);
});

test('missing contract names come back as warnings', () => {
  const r = withRules([{ op: 'rename', from: 'color/brand/primary', to: 'color/brand/main' }]);
  assert.ok(r.warnings.includes('Contract item color/brand/primary is missing.'), r.warnings.join('\n'));
});

test('type-scale works from a recorded baseline', () => {
  const first = withRules([{ op: 'apply', recipe: 'type-scale', percent: 125 }]);
  const second = applyOps(first.draft, [{ ...F, op: 'apply', recipe: 'type-scale', percent: 130 }], { plan: first.plan, rules: first.rules });
  assert.equal(second.draft.textStyles[0].fontSize, 21);
  const back = applyOps(second.draft, [{ ...F, op: 'apply', recipe: 'type-scale', percent: 100 }], { plan: second.plan, rules: second.rules });
  assert.equal(back.draft.textStyles[0].fontSize, 16);
  assert.deepEqual(find(back.draft, 'font/size/body-md').values, { Value: { alias: 'scale/font-size/16' } });
  assert.equal(back.rules.baselines.type.percent, 100);
});

test('primitives the store created are removed once unused', () => {
  const first = withRules([{ op: 'apply', recipe: 'radius-base', rem: 0.75 }]);
  assert.ok(find(first.draft, 'scale/radius/12'));
  const second = applyOps(first.draft, [{ ...F, op: 'apply', recipe: 'radius-base', rem: 0.8 }], { plan: first.plan, rules: first.rules });
  assert.equal(find(second.draft, 'scale/radius/12'), undefined);
  assert.ok(!second.plan.domains.shape.variables.includes('scale/radius/12'));
  assert.ok(find(second.draft, 'scale/radius/8'), 'primitives from preparation stay');
});
