import test from 'node:test';
import assert from 'node:assert/strict';
import { milliseconds, easingCurve, motionPlan } from '../manager/motion.mjs';

test('motion uses saved milliseconds or explicit time units and rejects invalid timing', () => {
  assert.equal(milliseconds(0), 0);
  assert.equal(milliseconds('200'), 200);
  assert.equal(milliseconds('200ms'), 200);
  assert.equal(milliseconds('0.3s'), 300);
  assert.equal(milliseconds('0.3 s'), 300);
  for (const invalid of ['', null, undefined, -1, Infinity, 'fast', '2oops', '70000ms']) assert.equal(milliseconds(invalid), null);
});

test('easing supports exported tuples, CSS curves and keywords while preserving overshoot', () => {
  assert.deepEqual(easingCurve('0.2, 0, 0, 1').points, [.2, 0, 0, 1]);
  assert.equal(easingCurve('cubic-bezier(0.4, 0, 1, 1)').css, 'cubic-bezier(0.4, 0, 1, 1)');
  assert.deepEqual(easingCurve('linear').points, [0, 0, 1, 1]);
  assert.equal(easingCurve('.2, -.5, .8, 1.5').points[3], 1.5);
  for (const invalid of ['2,0,0,1', '0,0,-1,1', '1,,1,1', 'NaN,0,0,1', 'random', undefined]) assert.equal(easingCurve(invalid), null);
});

test('playback follows selected duration/easing and reduces spatial movement without losing feedback', () => {
  const plan = motionPlan(900, '0.4,0,1,1', false, 340);
  assert.equal(plan.duration, 900);
  assert.equal(plan.easing, 'cubic-bezier(0.4, 0, 1, 1)');
  assert.equal(plan.keyframes[1].transform, 'translateX(340px)');
  const reduced = motionPlan(1800, 'linear', true, 340);
  assert.equal(reduced.duration, 120);
  assert.ok(reduced.keyframes.every(f => f.transform === 'translateX(0px)'));
  assert.equal(reduced.keyframes[1].opacity, 1);
  assert.equal(motionPlan(0, 'linear', true, 340).duration, 0);
  assert.equal(motionPlan(-1, 'linear', false, 340), null);
  assert.equal(motionPlan(200, 'broken', false, 340), null);
});
