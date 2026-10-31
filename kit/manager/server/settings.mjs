// Session settings kept in the ledger's flags, next to flags.guidelines. Figma is part of the pipeline unless turned off.
import path from 'node:path';
import {readFile} from 'node:fs/promises';
import {writeJSON} from './files.mjs';

async function ledger(outputDir) {
  try { return JSON.parse(await readFile(path.join(outputDir, 'ds-create-ledger.json'), 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return null; throw e; }
}
export async function readFigmaSetting(outputDir) { return (await ledger(outputDir))?.flags?.figma !== false; }
export async function writeFigmaSetting(outputDir, figma) {
  const current = await ledger(outputDir) || {};
  await writeJSON(path.join(outputDir, 'ds-create-ledger.json'), {...current, flags: {...current.flags, figma: !!figma}});
  return !!figma;
}
