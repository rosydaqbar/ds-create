import test from 'node:test';
import assert from 'node:assert/strict';
import { fontChoices, fontStack } from '../manager/fonts/catalog.mjs';

test('missing and placeholder fonts expose the three prepared choices', () => {
  const expected = ['Inter', 'Geist', 'Plus Jakarta Sans'];
  assert.deepEqual(fontChoices().prepared, expected);
  assert.deepEqual(fontChoices(['ui-sans-serif, system-ui', null, '']).prepared, expected);
  assert.equal(fontChoices().initial, 'Inter');
});

test('a supplied font stays selected and prepared alternatives do not duplicate it', () => {
  const custom = fontChoices(['Brand Sans', 'Brand Sans', 'Geist']);
  assert.equal(custom.initial, 'Brand Sans');
  assert.deepEqual(custom.system, ['Brand Sans', 'Geist']);
  assert.deepEqual(custom.prepared, ['Inter', 'Plus Jakarta Sans']);
  assert.equal(fontStack('Plus Jakarta Sans'), '"Plus Jakarta Sans", sans-serif');
  assert.equal(fontStack('Brand Sans, Arial, sans-serif'), 'Brand Sans, Arial, sans-serif');
});
