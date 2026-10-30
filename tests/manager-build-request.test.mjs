import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { buildStatus, requestBuild, waitForPreparation } from '../kit/manager/server/setup.mjs';

test('Publish queues one ds-create build that reaches the waiting agent once', async t => {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'ds-build-'))); t.after(() => rm(root, { recursive: true, force: true }));
  const output = path.join(root, 'workspace/output/session-1');
  await mkdir(path.join(output, 'manager'), { recursive: true });
  assert.equal((await buildStatus(output)).status, 'none');
  const queued = await requestBuild(output);
  assert.equal((await buildStatus(output)).status, 'waiting');
  const event = await waitForPreparation({ workspace: root, session: 'session-1', timeoutMs: 2000 });
  assert.equal(event.event, 'build-request');
  assert.equal(event.event_id, queued.attempt);
  assert.equal((await buildStatus(output)).status, 'delivered', 'Builder shows the build as sent');
  const next = await waitForPreparation({ workspace: root, session: 'session-1', timeoutMs: 400, afterEvent: queued.attempt });
  assert.equal(next.event, 'wait-expired', 'the same build is not delivered twice');
  const again = await requestBuild(output);
  assert.notEqual(again.attempt, queued.attempt);
  assert.equal((await waitForPreparation({ workspace: root, session: 'session-1', timeoutMs: 2000 })).event_id, again.attempt, 'Publish again sends a new build');
});
