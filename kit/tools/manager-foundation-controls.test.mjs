import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveRadii, radiusBase, colorOpacity, opaqueColor, shadowSeed, deriveShadows, shadowCSS } from '../manager/foundation-controls.mjs';

test('radius base scales actual semantic steps while fixed square and full anchors remain intact', () => {
  const rows = [{ name:'radius/none', value:0 }, { name:'radius/control', value:8 }, { name:'radius/surface', value:12 }, { name:'radius/full', value:9999 }];
  assert.equal(radiusBase(rows), 8);
  assert.deepEqual(deriveRadii(rows, .625).map(r => r.value), [0,10,15,9999]);
  assert.deepEqual(deriveRadii(rows, 0).map(r => r.value), [0,0,0,9999]);
  for (const v of [-1, NaN, Infinity, 9]) assert.throws(() => deriveRadii(rows, v), RangeError);
  assert.equal(rows[2].value, 12, 'source is never mutated');
});
test('opacity changes replace source alpha instead of multiplying it twice', () => {
  assert.equal(colorOpacity('#0008'), 8/15*100);
  assert.equal(colorOpacity('oklch(0 0 0 / 5%)'), 5);
  assert.equal(colorOpacity('rgba(0, 0, 0, 0.25)'), 25);
  assert.equal(opaqueColor('#0000001a'), '#000000');
  assert.equal(opaqueColor('oklch(0 0 0 / 5%)'), 'oklch(0 0 0 )');
  assert.equal(opaqueColor('rgba(0, 0, 0, 0.25)'), 'rgb(0, 0, 0)');
  assert.equal(colorOpacity('rgb(0, 0, 0)'), 100);
});
test('seed derives saved multi-layer elevation proportions and preserves semantic color bindings', () => {
  const resolve = c => c.alias ? ({'color/shadow/ambient':'oklch(0 0 0 / 5%)','color/shadow/key':'oklch(0 0 0 / 10%)'}[c.alias]) : c;
  const effects = [{type:'DROP_SHADOW',x:0,y:1,blur:2,spread:0,color:{alias:'color/shadow/ambient'}}, {type:'DROP_SHADOW',x:0,y:4,blur:6,spread:-2,color:{alias:'color/shadow/key'}}];
  const original = shadowSeed({effects}, resolve);
  const derived = deriveShadows(effects, original, {...original,y:2,blur:4,spread:1,opacity:10}, resolve);
  assert.deepEqual(derived.map(e=>[e.y,e.blur,e.spread,e.opacity]), [[2,4,1,10],[8,12,-1,20]]);
  assert.deepEqual(derived[1].color, {alias:'color/shadow/key'});
  assert.equal(effects[0].blur, 2);
  assert.match(shadowCSS(derived, resolve), /0px 8px 12px -1px/);
  assert.match(shadowCSS(derived, resolve), /20%, transparent/);
});
test('shadow CSS preserves layer order, inner shadows, signed spread, empty and invalid cases', () => {
  const effects = [{type:'INNER_SHADOW',x:-1,y:2,blur:3,spread:-4,color:'#11223380',opacity:50}];
  assert.match(shadowCSS(effects, c=>c), /^inset -1px 2px 3px -4px color-mix\(in srgb, #112233 50%, transparent\)$/);
  assert.equal(shadowCSS([], c=>c), 'none');
  assert.equal(shadowCSS([{...effects[0],blur:-1}],c=>c), 'none');
  assert.equal(shadowCSS([{...effects[0],x:NaN}],c=>c), 'none');
  assert.equal(shadowSeed({effects:[]}, c=>c), null);
});
