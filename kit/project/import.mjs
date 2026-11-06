import {cpSync, existsSync, lstatSync, readFileSync, readdirSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';

// Builder code that older sessions copied into output/<slug>/manager/. The engine now runs from the package.
const DROP_DIRS = new Set(['client', 'server', 'foundations', 'parts', 'shared', 'web', 'node_modules']);
const DROP_FILES = new Set(['runtime.json', 'package.json']);
const keepManager = src => {
  const rel = path.relative(src.root, src.path);
  if (!rel || rel.includes(path.sep)) return true;
  if (statSync(src.path).isDirectory()) return !DROP_DIRS.has(rel);
  return rel.endsWith('.json') && !DROP_FILES.has(rel);
};
const ACTIVE = new Set(['running', 'queued']);
const readJson = file => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return null; } };
// A job or setup copied while it was running has no owner in this project; its old pid may be alive or reused.
function blockImportedWork(manager) {
  const mark = {status: 'blocked', message: 'Imported while a run was in progress', finished: new Date().toISOString()};
  const jobs = path.join(manager, 'jobs');
  if (existsSync(jobs)) for (const id of readdirSync(jobs)) {
    const file = path.join(jobs, id, 'status.json'), status = readJson(file);
    if (status && ACTIVE.has(status.status)) writeFileSync(file, JSON.stringify({...status, ...mark}, null, 2) + '\n');
  }
  const file = path.join(manager, 'setup.json'), setup = readJson(file);
  if (setup && ACTIVE.has(setup.status)) writeFileSync(file, JSON.stringify({...setup, status: 'blocked', message: mark.message, readyInputHash: null, questions: []}, null, 2) + '\n');
}
const isEmpty = dir => !existsSync(dir) || readdirSync(dir).every(name => name === '.gitkeep');

// Copies one session of an old repo into the project. Throws with a plain message when it cannot.
export function importSession({project, oldRepo, slug}) {
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('The slug must be lowercase letters, digits and single dashes, like acme-design.');
  const old = path.resolve(oldRepo);
  const output = path.join(old, 'workspace/output', slug);
  // A session made in the web Builder has an output slug like session-<uuid>; its inputs sit under setup.json's inputSlug.
  let inputSlug = slug;
  try {
    const found = JSON.parse(readFileSync(path.join(output, 'manager/setup.json'), 'utf8')).inputSlug;
    if (typeof found === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(found)) inputSlug = found;
  } catch { /* no setup.json: the input folder has the session slug */ }
  const from = {input: path.join(old, 'workspace/input', inputSlug), output};
  if (!existsSync(from.output) && !existsSync(from.input)) throw new Error(`No session ${slug} in ${path.resolve(oldRepo)}/workspace.`);
  const to = {input: path.join(project, 'input'), output: path.join(project, 'output')};
  for (const k of ['input', 'output']) if (!isEmpty(to[k])) throw new Error(`${to[k]} is not empty. Import into a new project.`);
  const noLinks = p => !lstatSync(p).isSymbolicLink();
  if (existsSync(from.input)) cpSync(from.input, to.input, {recursive: true, filter: noLinks});
  if (existsSync(from.output)) {
    const manager = path.join(from.output, 'manager');
    cpSync(from.output, to.output, {recursive: true, filter: p => noLinks(p) && p !== manager && !p.startsWith(manager + path.sep)});
    if (existsSync(manager)) {
      cpSync(manager, path.join(to.output, 'manager'), {recursive: true, filter: p => noLinks(p) && keepManager({root: manager, path: p})});
      blockImportedWork(path.join(to.output, 'manager'));
    }
  }
  const file = path.join(project, 'ds-create.json');
  writeFileSync(file, JSON.stringify({...JSON.parse(readFileSync(file, 'utf8')), slug}, null, 2) + '\n');
}
