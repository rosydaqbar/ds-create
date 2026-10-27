import test from 'node:test';
import assert from 'node:assert/strict';
import {publicationPresentation, publishTasks} from '../kit/manager/client/features/publish-progress.mjs';

const flow=(status,completed=[],stage='verification')=>({figma:{complete:false},listener:{connected:true},job:{id:'fixture',status,progress:{completed,stage},message:'Everything succeeded'}});
test('a partial result separates confirmed writes from incomplete styles and verification',()=>{
 const p=publicationPresentation(flow('blocked',['access','variables']));
 assert.equal(p.tone,'warning');assert.equal(p.complete,false);assert.equal(p.confirmed,2);
 assert.deepEqual(p.tasks.map(t=>t.state),['complete','complete','attention','attention']);
});
test('queued prose and a claimed finished verification never fabricate success',()=>{
 assert.equal(publicationPresentation(flow('queued',['access','variables','styles','verification'])).confirmed,0);
 const p=publicationPresentation(flow('failed',['access','variables','styles','verification']));
 assert.equal(p.complete,false);assert.equal(p.confirmed,3);assert.equal(p.tasks.at(-1).state,'attention');
});
test('only verified current output makes all task results green',()=>{
 const f=flow('succeeded');f.figma.complete=true;const p=publicationPresentation(f);
 assert.equal(p.complete,true);assert.equal(p.tone,'success');assert.ok(p.tasks.every(t=>t.state==='complete'));
 f.notice='Draft changed';const stale=publicationPresentation(f);assert.equal(stale.complete,false);assert.equal(stale.tone,'warning');
});
test('waiting, actual work, cancellation and failure have distinct semantics',()=>{
 assert.equal(publicationPresentation(flow('running',[],'styles')).tone,'active');
 assert.equal(publicationPresentation(flow('cancelled')).tone,'neutral');
 assert.equal(publicationPresentation(flow('blocked')).tone,'error');
 assert.equal(publishTasks(flow('outdated',['access','variables']).job).filter(t=>t.state==='complete').length,0);
});

test('task display waits for verified publication even after all phase updates',()=>{
 assert.deepEqual(publishTasks({status:'queued',message:'Everything done'}).map(t=>t.state),['pending','pending','pending','pending']);
 assert.deepEqual(publishTasks({status:'running',progress:{stage:'verification',completed:['access','variables','styles','verification']}}).map(t=>t.state),['complete','complete','complete','running']);
});
test('quiet progress and unacknowledged cancellation do not animate indefinitely',async()=>{
 const {publicationLiveness}=await import('../kit/manager/client/features/publish-progress.mjs');
 const at='2026-10-24T10:00:00Z',job={status:'running',started:at,updated:at,progress:{stage:'access',activity:[{time:at,message:'Reading fonts'}]}};
 assert.equal(publicationLiveness({job},Date.parse(at)+1000).animate,true);
 assert.equal(publicationLiveness({job},Date.parse(at)+91000).animate,false);
 assert.match(publicationLiveness({job},Date.parse(at)+91000).notice,/No progress/);
 const stopping=publicationLiveness({job:{...job,cancelRequested:true,cancelRequestedAt:at}},Date.parse(at)+61000);
 assert.equal(stopping.animate,false);assert.match(stopping.notice,/has not acknowledged cancellation/);
});
