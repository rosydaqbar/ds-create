import {randomUUID} from 'node:crypto';
import {mkdir,writeFile,rename,realpath,lstat} from 'node:fs/promises';
import path from 'node:path';
import {PublishError} from './figma-jobs.mjs';
import {readJSON} from './state.mjs';
import {snapshotInputs} from './input-snapshot.mjs';
import {checkPreparation} from './foundation-proof.mjs';
export const uploadLimits = { files: 10, fileBytes: 25 * 1024 * 1024, totalBytes: 50 * 1024 * 1024, context: 20000, projectName: 100 };
export const activeSetup = record => ['queued', 'running'].includes(record?.status);
export async function saveSetup(file, value) {
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2) + '\n'); await rename(tmp, file);
}
// Every writable ancestor must be a real directory inside this workspace, never a symlink.
export async function localDirectory(workspace, relative) {
  let dir = await realpath(workspace);
  for (const part of relative.split('/')) {
    if (!part || part === '.' || part === '..') throw new PublishError('Invalid workspace directory.', 400);
    dir = path.join(dir, part);
    try { await mkdir(dir); } catch (e) { if (e.code !== 'EEXIST') throw e; }
    const s = await lstat(dir);
    if (s.isSymbolicLink() || !s.isDirectory()) throw new PublishError('Input storage must stay inside this workspace.', 412);
  }
  return dir;
}
export function setupQuestions(value) {
  if (!Array.isArray(value) || !value.length || value.length > 12) return null;
  const ids = new Set();
  for (const q of value) {
    if (!q || typeof q.id !== 'string' || !/^[a-z0-9_-]{1,64}$/.test(q.id) || ids.has(q.id) || typeof q.prompt !== 'string' || !q.prompt.trim() || q.prompt.length > 2000 ||
      !Array.isArray(q.options) || q.options.length > 8 || q.options.some(o => typeof o !== 'string' || !o.trim() || o.length > 300)) return null;
    ids.add(q.id);
  }
  return value.map(({id,prompt,options}) => ({id,prompt,options}));
}
export async function draftReady(outputDir, workspace) {
  const setup=await readJSON(path.join(outputDir,'manager/setup.json'));
  return (await checkPreparation(outputDir,workspace,setup)).valid;
}
export async function inputDigest(workspace, slug) { return (await snapshotInputs(workspace,slug)).hash; }
