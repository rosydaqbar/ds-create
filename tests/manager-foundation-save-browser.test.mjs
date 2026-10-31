import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '../kit/web/node_modules/playwright/index.mjs';
import { createManagerServer } from '../kit/manager/server/index.mjs';
import { createItemStore } from '../kit/manager/foundations/store.mjs';
import { colors, effects, values } from '../kit/web/scripts/chrome-fallbacks.mjs';
import { storeFixture } from './fixtures/item-store.mjs';

// Builder controls save through the same store as the MCP tools, and an agent's save shows up in the open page.
// Runs on a temporary session; the user's live Builder is never touched.
const chrome = process.env.DS_CREATE_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
async function builder(t) {
  const root = await realpath(await mkdtemp(path.join(tmpdir(), 'ds-save-browser-'))), output = path.join(root, 'workspace/output/fixture');
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(output, 'manager'), { recursive: true });
  await cp(fileURLToPath(new URL('../kit/manager', import.meta.url)), path.join(output, 'manager'), { recursive: true });
  await cp(fileURLToPath(new URL('../kit/web/src/styles/docs-presentation.css', import.meta.url)), path.join(output, 'manager/docs-presentation.css'));
  await writeFile(path.join(output, 'manager/chrome.css'), ':root{' + [...colors, ...values, ...effects].map(([k, v]) => k + ':' + v + ';').join('') + '}');
  await storeFixture({ dir: output });
  // A finished draft without a pending setup record, so Builder shows the foundations instead of the setup flow.
  await rm(path.join(output, 'manager/setup.json'));
  const { server } = createManagerServer({ outputDir: output, workspace: root });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  return { output, url: 'http://127.0.0.1:' + server.address().port };
}

test('Builder controls save new revisions, undo restores, and agent saves appear',
  { skip: !existsSync(chrome) && !existsSync(chromium.executablePath()) ? 'No Chromium executable is available' : false }, async t => {
    const { output, url } = await builder(t);
    const browser = await chromium.launch({ executablePath: existsSync(chrome) ? chrome : chromium.executablePath(), headless: true });
    t.after(() => browser.close());
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto(url + '/#shape');
    const control = page.locator('[data-select-item="radius/control"] code').first();
    await control.waitFor();
    assert.equal(await control.textContent(), '8px');
    // No agent is connected here, so Builder opens the Agent tab; the controls live under Appearance.
    await page.click('#tab-appearance');
    await page.fill('#radius-base-rem', '0.75');
    await page.locator('#foundation-save-status', { hasText: 'Saved · revision 2' }).waitFor({ timeout: 8000 });
    assert.equal(JSON.parse(await readFile(path.join(output, 'foundations.json'), 'utf8')).revision, 2);
    await page.reload();
    await control.waitFor();
    assert.equal(await control.textContent(), '12px');
    await page.click('#tab-appearance');
    await page.click('#undo-change');
    await page.locator('#foundation-save-status', { hasText: 'revision 3' }).waitFor({ timeout: 8000 });
    await page.locator('[data-select-item="radius/control"] code', { hasText: '8px' }).waitFor({ timeout: 8000 });
    await createItemStore({ outputDir: output }).change({ expectedRevision: 3, ops: [{ target: 'foundations', op: 'set', name: 'scale/radius/8', mode: 'Value', value: 6 }], reason: 'Agent edit', author: 'mcp' });
    await page.locator('#foundation-save-status', { hasText: 'Revision 4 · saved by agent' }).waitFor({ timeout: 8000 });
    await page.locator('[data-select-item="radius/control"] code', { hasText: '6px' }).waitFor({ timeout: 8000 });
    assert.equal(await page.locator('text=Controller edits are previews').count(), 0);
    assert.deepEqual(errors, []);
  });
