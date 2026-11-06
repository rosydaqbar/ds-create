import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const TEMPLATE = new URL('./skill-template.md', import.meta.url);

// Writes (or replaces) the thin project skill.
export function writeSkill(projectRoot) {
  const file = path.join(projectRoot, '.claude/skills/ds-create/SKILL.md');
  mkdirSync(path.dirname(file), {recursive: true});
  writeFileSync(file, readFileSync(TEMPLATE, 'utf8'));
  return file;
}
