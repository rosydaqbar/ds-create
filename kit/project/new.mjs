import {existsSync, mkdirSync, readdirSync, writeFileSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {SCHEMA_VERSION} from './migrate.mjs';
import {writeSkill} from './skill.mjs';

export const slugify = name => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const write = (file, data) => writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

// Creates the project folder. Throws with a plain message when it cannot.
export function newProject({name, engine, cwd = process.cwd(), install = true}) {
  if (!name) throw new Error('Usage: ds-create new <name> --engine <spec> [--no-install]');
  if (!engine) throw new Error('--engine is required until ds-create is published. Example: --engine file:/path/to/ds-create-0.1.6.tgz');
  const slug = slugify(name);
  if (!slug) throw new Error(`"${name}" has no letters or digits to make a slug from.`);
  const root = path.resolve(cwd, name);
  if (existsSync(root) && readdirSync(root).length) throw new Error(`${root} is not empty.`);
  mkdirSync(path.join(root, 'input'), {recursive: true});
  mkdirSync(path.join(root, 'output'), {recursive: true});
  write(path.join(root, 'package.json'), {name: slug, private: true, type: 'module', devDependencies: {'ds-create': engine}});
  write(path.join(root, 'ds-create.json'), {name, slug, schemaVersion: SCHEMA_VERSION, figma: {url: null}});
  write(path.join(root, '.mcp.json'), {mcpServers: {'ds-create': {command: 'npx', args: ['ds-create', 'mcp']}}});
  writeSkill(root);
  if (install) {
    const r = spawnSync('npm', ['install'], {cwd: root, stdio: 'inherit'});
    if (r.status !== 0) throw new Error('npm install failed. Fix the --engine value, then run npm install in the project folder.');
  }
  return {root, slug};
}
