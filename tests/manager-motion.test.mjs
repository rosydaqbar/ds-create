import test from 'node:test';
import assert from 'node:assert/strict';
import {easingCurve, milliseconds, motionPlan} from '../kit/manager/client/features/motion.mjs';

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

test('native TIMING seconds and EASING objects keep the same duration and curve in playback', async () => {
  const { previewTiming, validTiming, validEasing, nativeEasing } = await import('../kit/manager/shared/motion.mjs');
  const native = {type:'CUSTOM_CUBIC_BEZIER',easingFunctionCubicBezier:{x1:.2,y1:0,x2:0,y2:1}};
  assert.deepEqual(nativeEasing('cubic-bezier(0.2, 0, 0, 1)'), native);
  assert.equal(previewTiming('TIMING', .2), 200);
  assert.equal(previewTiming('FLOAT', 200), 200, 'frozen legacy timings remain milliseconds');
  assert.equal(previewTiming('TIMING', 0), 0);
  assert.equal(motionPlan(previewTiming('TIMING', .2), native, false, 20).duration, 200);
  assert.deepEqual(easingCurve(native), easingCurve('0.2, 0, 0, 1'));
  assert.equal(validTiming(500), true, 'validation has no preview-only 60 second limit');
  for (const value of [-.2, NaN, Infinity, '0.2']) assert.equal(validTiming(value), false);
  for (const value of [{type:'CUSTOM_CUBIC_BEZIER'}, {...native,easingFunctionCubicBezier:{x1:2,y1:0,x2:0,y2:1}}, {type:'CUSTOM_SPRING',easingFunctionSpring:{bounce:2}}, {type:'LINEAR',unexpected:true}, '0.2,0,0,1']) assert.equal(validEasing(value), false);
  const spring = {type:'CUSTOM_SPRING',easingFunctionSpring:{bounce:.4}};
  assert.equal(validEasing(spring), true);assert.deepEqual(nativeEasing(spring), spring);
  assert.equal(easingCurve(spring), null, 'unsupported browser spring preview never guesses another curve');
});

test('Builder preview renders native timing in ms and native curves using existing card markup', async () => {
  const oldMedia=globalThis.matchMedia,oldDocument=globalThis.document;
  globalThis.matchMedia=()=>({matches:false,addEventListener(){}});
  globalThis.document={addEventListener(){}};
  try {
    const {createMotionPreview}=await import('../kit/manager/client/features/motion.mjs');
    const f={modes:['Standard','Reduced'],variables:[
      {name:'motion/duration/base',type:'TIMING',values:{Standard:.2,Reduced:0}},
      {name:'motion/easing/standard',type:'EASING',values:{Standard:{type:'CUSTOM_CUBIC_BEZIER',easingFunctionCubicBezier:{x1:.2,y1:0,x2:0,y2:1}}}},
      {name:'motion/delay/tooltip',type:'TIMING',values:{Standard:.4}}
    ]},draft={settings:new Map()};let mode='Standard';
    const preview=createMotionPreview({draft,resultFor:(v,m)=>({value:v.values[m]??v.values.Standard}),modeFor:()=>mode,escape:String,previewCard:(head,body)=>head+body,modeControls:()=>'',renderAll(){},renderCanvas(){}});
    let html=preview.content(f);
    assert.match(html,/data-motion-ms="200"/);assert.match(html,/200ms/);assert.match(html,/400ms/);
    assert.doesNotMatch(html,/\[object Object\]|0\.2ms|200000ms/);
    assert.match(html,/cubic-bezier\(0.2, 0, 0, 1\)/);
    draft.settings.set('motion-duration:motion/duration/base:Standard',320);
    assert.match(preview.workspace(f),/value="320"/,'preview overrides are already milliseconds');
    mode='Reduced';assert.match(preview.content(f),/data-motion-ms="0"/);
  } finally {globalThis.matchMedia=oldMedia;globalThis.document=oldDocument;}
});
