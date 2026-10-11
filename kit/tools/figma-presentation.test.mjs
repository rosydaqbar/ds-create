import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const load = (file, name) => {
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8');
  const start = source.indexOf(`async function ${name}(`);
  const end = source.indexOf('\n}\n', start) + 2;
  return vm.runInNewContext(`${source.slice(start, end)}; ${name}`);
};
const docbuilder = load('./figma-docbuilder.js', 'docbuilder');
const fastkit = load('./figma-fastbuild.js', 'fastkit');

function fixture() {
  let next = 0;
  const nodes = new Map();
  const node = (type = 'FRAME') => {
    const n = {
      id: String(++next), type, children: [], width: 400, height: 100, boundVariables: {},
      appendChild(child) { assert.ok(child && !child.then, 'append receives a node, never an unresolved preview'); this.children.push(child); child.parent = this; },
      setBoundVariable(key, variable) { this.boundVariables[key] = { id: variable.id }; },
      resize(width, height) { this.width = width; this.height = height; },
      async setTextStyleIdAsync(id) { this.textStyleId = id; },
    };
    nodes.set(n.id, n);
    return n;
  };
  const color = (v) => ({ r: v, g: v, b: v });
  const roles = {
    'color/surface/base': [color(1), color(.06)],
    'color/surface/raised': [color(.98), color(.12)],
    'color/text/primary': [color(.06), color(.98)],
    'color/text/secondary': [color(.3), color(.7)],
    'color/border/subtle': [color(.85), color(.2)],
    'radius/modal': [24, 24], 'radius/surface': [12, 12],
  };
  const vars = Object.entries(roles).map(([name, [light, dark]], i) => ({ name, id: `v${i}`, variableCollectionId: 'brand', valuesByMode: { light, dark } }));
  const styles = ['type/body/sm/regular', 'type/label/sm/medium'].map((name, i) => ({ id: `s${i}`, name, fontName: { family: 'Inter', style: 'Regular' } }));
  const root = node('DOCUMENT'); root.getSharedPluginData = () => '';
  root.setSharedPluginData = () => assert.fail('explicit kit lookup must not write plugin data');
  return {
    node, vars, root,
    figma: {
      root, createAutoLayout: () => node(), createText: () => node('TEXT'),
      getNodeByIdAsync: async id => nodes.get(id), loadFontAsync: async () => {},
      getLocalTextStylesAsync: async () => styles,
      getLocalEffectStylesAsync: async () => [], getLocalPaintStylesAsync: async () => [], getLocalGridStylesAsync: async () => [],
      variables: {
        getLocalVariablesAsync: async () => vars,
        getLocalVariableCollectionsAsync: async () => [{ id: 'brand', defaultModeId: 'light', modes: [{ modeId: 'light', name: 'Light' }, { modeId: 'dark', name: 'Dark' }] }],
        setBoundVariableForPaint: (paint, field, variable) => ({ ...paint, boundVariables: { [field]: { id: variable.id } } }),
      },
    },
  };
}

test('preview preserves the stage append contract and binds both modes through existing brand roles', async () => {
  const f = fixture(); const before = JSON.stringify(f.vars);
  const D = await docbuilder(f.figma, { kit: {} });
  const content = await D.preview(f.root, 'Preview', 'HORIZONTAL');
  const panel = f.root.children[0];
  assert.equal(content.parent, panel);
  assert.equal(panel.children.length, 2);
  const specimen = f.node('INSTANCE'); content.appendChild(specimen);
  assert.equal(content.children[0], specimen);
  const role = (paint) => f.vars.find(v => v.id === paint.boundVariables.color.id).name;
  assert.equal(role(panel.fills[0]), 'color/surface/raised');
  assert.equal(role(content.fills[0]), 'color/surface/base');
  assert.equal(JSON.stringify(f.vars), before, 'rendering must not change palette values or modes');
  assert.equal(D.stage('Legacy stage').type, 'FRAME', 'legacy stage remains synchronous');
});

test('Fast catalog awaits preview creation and preserves stage:false and comparison inputs', async () => {
  const f = fixture(); const D = await fastkit(f.figma, await docbuilder(f.figma, { kit: {} }));
  const plain = f.node(); await D.visual(plain, { type: 'instances', items: [], stage: false });
  assert.equal(plain.children[0].name, 'Row');
  const preview = f.node(); await D.visual(preview, { type: 'instances', items: [] });
  assert.equal(preview.children[0].children[1].children[0].name, 'Row');
  const comparison = f.node(); await D.visual(comparison, { type: 'compare', columns: [{ items: [] }, { items: [] }] });
  assert.equal(comparison.children[0].children.length, 2);
  for (const col of comparison.children[0].children) assert.equal(col.children[0].children[1].children[0].name, 'Row');
});
