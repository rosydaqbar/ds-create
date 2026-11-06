import {existsSync, readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const PROJECT_FILE = 'ds-create.json';
export const ENGINE_ROOT = fileURLToPath(new URL('../', import.meta.url));
const NO_PROJECT = 'No ds-create project here. Run npx ds-create new <name>.';

function readProject(root) {
  const file = path.join(root, PROJECT_FILE);
  let config;
  try { config = JSON.parse(readFileSync(file, 'utf8')); } catch { throw new Error(`${file} is not valid JSON.`); }
  if (!config || typeof config.slug !== 'string' || !config.slug) throw new Error(`${file} has no slug.`);
  return config;
}

function findProjectRoot(cwd) {
  for (let dir = path.resolve(cwd); ; dir = path.dirname(dir)) {
    if (existsSync(path.join(dir, PROJECT_FILE))) return dir;
    if (path.dirname(dir) === dir) return null;
  }
}

// Which layout this run uses, and where input and output live. Reads only; creates nothing.
// Project mode: one folder with ds-create.json, input/ and output/ at its root.
// Workspace mode: workspace/input/{slug} and workspace/output/{slug} under `root`.
export function resolveProject({cwd = process.cwd(), project, workspace, engineRoot = ENGINE_ROOT} = {}) {
  let root = project ? path.resolve(cwd, project) : findProjectRoot(cwd);
  if (project && !existsSync(path.join(root, PROJECT_FILE))) throw new Error(NO_PROJECT);
  if (root) {
    const {slug} = readProject(root);
    const same = requested => { if (requested !== undefined && requested !== slug) throw new Error(`This project is ${slug}.`); };
    return {mode: 'project', root, slug, inputDir: requested => (same(requested), path.join(root, 'input')), outputDir: requested => (same(requested), path.join(root, 'output'))};
  }
  const base = workspace ? path.resolve(cwd, workspace) : existsSync(path.join(engineRoot, 'workspace')) ? path.resolve(engineRoot) : null;
  if (!base) throw new Error(NO_PROJECT);
  const pick = (kind, slug) => { if (!slug) throw new Error('Provide the session slug.'); return path.join(base, 'workspace', kind, slug); };
  return {mode: 'workspace', root: base, slug: undefined, inputDir: slug => pick('input', slug), outputDir: slug => pick('output', slug)};
}
