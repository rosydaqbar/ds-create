import test from 'node:test';
import assert from 'node:assert/strict';
import { spacingScale } from '../manager/spacing.mjs';

test('spacing rem, pixel specimens and density share the same base unit', () => {
  const normal = spacingScale(0.25);
  assert.equal(normal.base.px, 4);
  assert.equal(normal.scale.length, 12);
  assert.deepEqual(normal.scale.at(-1), { multiple: 32, rem: 8, px: 128 });
  assert.deepEqual(normal.density.map(s => s.px), [4, 8, 16, 24, 32]);
  const doubled = spacingScale(0.5);
  assert.equal(doubled.scale.at(-1).px, 256);
  assert.equal(doubled.density.at(-1).px, 64);
});

test('invalid base values cannot produce invalid measure dimensions', () => {
  for (const value of [0, -1, NaN, Infinity, '0.25']) assert.throws(() => spacingScale(value), RangeError);
  assert.equal(spacingScale(0.0625).base.px, 1);
});
