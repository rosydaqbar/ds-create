import test from 'node:test';
import assert from 'node:assert/strict';
import {createDialogMotion, interactionPlan} from '../kit/manager/client/ui-motion.mjs';

function fixture({ reduced = false, duration = '150ms' } = {}) {
  const timers = new Map(); let id = 0;
  const motion = createDialogMotion({ reduced: () => reduced, readStyle: () => ({ getPropertyValue: () => duration }),
    schedule: (fn, ms) => { timers.set(++id, {fn, ms}); return id; }, unschedule: timer => timers.delete(timer) });
  const classes = new Set();
  const dialog = Object.assign(new EventTarget(), { open:false, offsetWidth:580, closes:0,
    classList:{add:(...v)=>v.forEach(x=>classes.add(x)),remove:(...v)=>v.forEach(x=>classes.delete(x))},
    showModal(){this.open=true;},close(){this.open=false;this.closes++;this.dispatchEvent(new Event('close'));} });
  return {motion,dialog,classes,timers,finish(){const pending=[...timers.values()];timers.clear();pending.forEach(x=>x.fn());}};
}

test('modal exit keeps native focus trap until completion, deduplicates close, and cleans up for reopening',async()=>{
  const f=fixture();f.motion.open(f.dialog);assert.equal(f.dialog.open,true);assert.equal(f.classes.has('is-open'),true);
  const closing=f.motion.close(f.dialog);assert.equal(f.dialog.open,true);assert.equal(f.classes.has('is-closing'),true);
  assert.equal(f.motion.close(f.dialog),closing);assert.equal(f.timers.size,1);assert.equal([...f.timers.values()][0].ms,150);
  f.finish();assert.equal(await closing,true);assert.equal(f.dialog.open,false);assert.equal(f.classes.has('is-closing'),false);
  f.motion.open(f.dialog);assert.equal(f.dialog.open,true);assert.equal(f.classes.has('is-open'),true);
});
test('reopening during exit cancels the stale timer and prevents a delayed close/focus restoration',async()=>{
  const f=fixture({duration:'0.15s'});f.motion.open(f.dialog);const old=f.motion.close(f.dialog);
  assert.equal([...f.timers.values()][0].ms,150);f.motion.open(f.dialog);assert.equal(await old,false);
  f.finish();assert.equal(f.dialog.open,true);assert.equal(f.dialog.closes,0);assert.equal(f.classes.has('is-closing'),false);
});
test('native cancel, native close and immediate route cleanup leave no stranded modal or timer',async()=>{
  const f=fixture();f.motion.open(f.dialog);const cancel=new Event('cancel',{cancelable:true});f.dialog.dispatchEvent(cancel);
  assert.equal(cancel.defaultPrevented,true);f.finish();assert.equal(f.dialog.open,false);
  f.motion.open(f.dialog);const closing=f.motion.close(f.dialog);f.dialog.close();assert.equal(await closing,true);assert.equal(f.timers.size,0);
  f.motion.open(f.dialog);assert.equal(await f.motion.close(f.dialog,{immediate:true}),true);assert.equal(f.dialog.open,false);
});
test('reduced motion closes immediately and state feedback retains only a short fade',async()=>{
  const f=fixture({reduced:true});f.motion.open(f.dialog);const done=f.motion.close(f.dialog);assert.equal(f.dialog.open,false);
  assert.equal(await done,true);assert.equal(f.timers.size,0);
  const plan=interactionPlan('step',true);assert.equal(plan.duration,80);assert.ok(plan.keyframes.every(k=>Object.keys(k).every(key=>key==='opacity')));
  assert.equal(interactionPlan('step',false).duration,200);
});

test('a queued native close event cannot hide a modal that was already reopened',async()=>{
  const f=fixture();
  f.dialog.close=function(){this.open=false;this.closes++;};
  f.motion.open(f.dialog);await f.motion.close(f.dialog,{immediate:true});
  f.motion.open(f.dialog);f.dialog.dispatchEvent(new Event('close'));
  assert.equal(f.dialog.open,true);assert.equal(f.classes.has('is-open'),true);
});
