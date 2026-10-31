import test from 'node:test';
import assert from 'node:assert/strict';
import { listItems, getItems } from '../kit/manager/foundations/query.mjs';
import { ItemError } from '../kit/manager/foundations/ops.mjs';
import { itemDraft } from './fixtures/item-store.mjs';

test('list filters by domain and query', () => {
  const shape = listItems(itemDraft(), { domain: 'shape' }).items.map(i => i.name).sort();
  assert.deepEqual(shape, ['radius/control', 'radius/full', 'radius/none', 'radius/sm', 'scale/radius/0', 'scale/radius/4', 'scale/radius/8', 'scale/radius/9999']);
  const brand = listItems(itemDraft(), { query: 'BRAND' }).items.map(i => i.name);
  assert.ok(brand.includes('color/brand/primary'));
  const primary = listItems(itemDraft(), { prefix: 'color/brand/' }).items[0];
  assert.deepEqual(primary.values, { Light: '#c33734', Dark: '#c33734' });
  assert.equal(listItems(itemDraft(), { kind: 'textStyle' }).items[0].name, 'type/body/md/regular');
});

test('list pages', () => {
  const page = listItems(itemDraft(), { limit: 2 });
  assert.equal(page.items.length, 2);
  assert.equal(page.next, 2);
  assert.equal(page.total, 19);
  assert.equal(listItems(itemDraft(), { limit: 2, cursor: 18 }).next, null);
});

test('get returns alias chain and usedBy', () => {
  const [ambient, control] = getItems(itemDraft(), ['color/shadow/ambient', 'radius/control']);
  assert.deepEqual(ambient.usedBy, [{ kind: 'effectStyle', name: 'elevation/control', via: 'effect color' }]);
  assert.deepEqual(control.aliasChain, { Value: ['radius/control', 'scale/radius/8'] });
  assert.deepEqual(control.resolved, { Value: 8 });
  const [primitive] = getItems(itemDraft(), ['scale/radius/8']);
  assert.deepEqual(primitive.usedBy, [{ kind: 'variable', name: 'radius/control', via: 'alias' }]);
});

test('get refuses unknown names', () => {
  assert.throws(() => getItems(itemDraft(), ['radius/nope']), e => e instanceof ItemError && e.message === 'Unknown item: radius/nope.');
});
