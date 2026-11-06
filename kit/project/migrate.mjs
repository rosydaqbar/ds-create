import {readFileSync, writeFileSync} from 'node:fs';
import path from 'node:path';

export const SCHEMA_VERSION = 1;
// MIGRATIONS[n] turns a schemaVersion n config into n + 1. None exist yet.
export const MIGRATIONS = {};

// Brings ds-create.json up to the engine's schemaVersion. Changes nothing when it throws.
export function migrateProject(projectRoot, {engineVersion = SCHEMA_VERSION, migrations = MIGRATIONS} = {}) {
  const file = path.join(projectRoot, 'ds-create.json');
  let config = JSON.parse(readFileSync(file, 'utf8'));
  const from = config.schemaVersion;
  if (from !== undefined && (!Number.isInteger(from) || from < 0)) throw new Error(`schemaVersion ${JSON.stringify(from)} in ${file} is not valid.`);
  const start = from === undefined ? 1 : from;
  if (start > engineVersion) throw new Error(`This project is at schemaVersion ${start} and needs a newer engine (this one is ${engineVersion}).`);
  for (let v = start; v < engineVersion; v++) if (!migrations[v]) throw new Error(`No migration from schemaVersion ${v} to ${v + 1}. Nothing was changed.`);
  config = {...config, schemaVersion: start};
  for (let v = start; v < engineVersion; v++) config = {...migrations[v](config), schemaVersion: v + 1};
  const changed = from !== engineVersion;
  if (changed) writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
  return {from, to: engineVersion, changed};
}
