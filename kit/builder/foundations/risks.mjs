// Quality checks that fail become risks. A risk is recorded and shown, and once the user accepts it the work goes
// on; structural errors (validateFoundations, validatePlan, formats) still block. Acceptances live in
// output/accepted-risks.json, written only by Builder's accept and restore actions and the accept-risks command.
import {mkdir, open, readFile, rename, stat, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {contrastReport} from './validate.mjs';

export const RISKS_FORMAT = 'ds-create/accepted-risks@1';
export const RISKS_FILE = 'accepted-risks.json';
export const risksFile = outputDir => path.join(outputDir, RISKS_FILE);

// Identity leaves the ratio out, so an acceptance holds while values change.
const identity = {contrast: ['foreground', 'background', 'mode'], 'part-contrast': ['part', 'where', 'text', 'paint']};
export const riskKey = r => [r.kind, ...(identity[r.kind] || []).map(k => r[k])].join('|');
export const isRisk = r => !!identity[r?.kind] && identity[r.kind].every(k => typeof r[k] === 'string' && r[k].length > 0);

// Foundation pairs below their minimum. A translucent pair with no opaque backing has no ratio but is still a risk.
export function foundationRisks(draft) {
  return contrastReport(draft).filter(r => !r.pass).map(r => ({kind: 'contrast', foreground: r.foreground, background: r.background, mode: r.mode, minimum: r.minimum, ratio: r.ratio ?? null, ...(r.reason ? {reason: r.reason} : {})}));
}

// The Part risks saved with each prepared Part (definition.risks), tagged with the Part's id.
export function partRisks(parts = {}) {
  return Object.entries(parts).flatMap(([id, p]) => (p?.risks || []).map(r => ({...r, kind: 'part-contrast', part: id})));
}

// Found risks split by whether an acceptance with the same identity exists. Acceptances for risks that are not
// found (the pair passes now) stay in the file and are not listed.
export function splitRisks(found, accepted = []) {
  const byKey = new Map(accepted.map(a => [riskKey(a), a])), open = [], ok = [];
  for (const r of found) { const a = byKey.get(riskKey(r)); if (a) ok.push({...r, acceptance: {acceptedBy: a.acceptedBy, source: a.source, at: a.at, ratioWhenAccepted: a.ratioWhenAccepted}}); else open.push(r); }
  return {open, accepted: ok};
}

// A missing file means nothing is accepted; a file in another format is refused rather than read as empty.
export async function readAccepted(outputDir) {
  let text;
  try { text = await readFile(risksFile(outputDir), 'utf8'); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  const data = JSON.parse(text);
  if (data?.format !== RISKS_FORMAT || !Array.isArray(data.risks)) throw new Error(`${RISKS_FILE} is not in the ${RISKS_FORMAT} format.`);
  return data.risks.filter(isRisk);
}

async function save(outputDir, risks) {
  await mkdir(outputDir, {recursive: true});
  const file = risksFile(outputDir), temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify({format: RISKS_FORMAT, risks}, null, 2) + '\n');
  await rename(temp, file);
}

// One writer at a time across processes (Builder, the CLI, the MCP server): a lock file next to the acceptances,
// taken over when it is older than 30 s, as the foundation store does.
async function locked(outputDir, fn) {
  await mkdir(outputDir, {recursive: true});
  const file = risksFile(outputDir) + '.lock', started = Date.now();
  let handle;
  while (!handle) {
    try { handle = await open(file, 'wx'); }
    catch (e) {
      if (e.code !== 'EEXIST') throw e;
      const info = await stat(file).catch(() => null);
      if (info && Date.now() - info.mtimeMs > 30000) { await unlink(file).catch(() => {}); continue; }
      if (Date.now() - started > 5000) throw new Error('Accepted risks are being saved by another process. Try again.');
      await new Promise(resolve => setTimeout(resolve, 25));
    }
  }
  try { return await fn(); } finally { await handle.close(); await unlink(file).catch(() => {}); }
}

const record = (r, source, at) => {
  const keep = Object.fromEntries((identity[r.kind] || []).map(k => [k, r[k]]));
  return {kind: r.kind, ...keep, minimum: r.minimum, ratioWhenAccepted: typeof r.ratio === 'number' ? Math.round(r.ratio * 100) / 100 : null, acceptedBy: 'user', source, at};
};

// Adds acceptances for these risks; one that is already accepted keeps its first record.
export async function writeAccepted(outputDir, risks, {source, now = new Date().toISOString()}) {
  if (typeof source !== 'string' || !/^(builder|chat:.+)$/.test(source)) throw new Error('An acceptance needs its source: builder, or chat:<file>.');
  return locked(outputDir, async () => {
    const current = await readAccepted(outputDir), keys = new Set(current.map(riskKey)), added = [];
    for (const r of risks) { if (!isRisk(r) || keys.has(riskKey(r))) continue; keys.add(riskKey(r)); added.push(record(r, source, now)); }
    if (added.length) await save(outputDir, [...current, ...added]);
    return added;
  });
}

// Restore the rule: the acceptance record goes, so the risk is open again.
export async function removeAccepted(outputDir, risk) {
  return locked(outputDir, async () => {
    const current = await readAccepted(outputDir), next = current.filter(a => riskKey(a) !== riskKey(risk));
    if (next.length !== current.length) await save(outputDir, next);
    return current.length - next.length;
  });
}

export const openRisksMessage = n => `Accept the ${n} risk${n === 1 ? '' : 's'} or change the values first.`;
// A risk in one line, for reports, the CLI and refusals.
export const describeRisk = r => r.kind === 'contrast'
  ? `${r.mode} ${r.foreground} on ${r.background}: ${typeof r.ratio === 'number' ? r.ratio.toFixed(2) : 'unresolved'} (needs ${r.minimum})`
  : `${r.part} ${r.where}: ${r.text} on ${r.paint}: ${typeof r.ratio === 'number' ? r.ratio.toFixed(2) : 'unresolved'} (needs ${r.minimum})`;

// The web step's copy: tokens/accepted.json acceptedRisks lists every accepted contrast pair ("fg on bg"), rewritten
// on each run so a restored rule fails check:contrast again. Other keys (the owner's unsupportedModes, contrast) stay.
// A pair passes there only when every mode it fails in is accepted: a pair still open in any mode is left out.
export async function writeWebAccepted(tokensDir, {accepted, open = []}) {
  const file = path.join(tokensDir, 'accepted.json');
  let current = null;
  try { current = JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const pair = r => `${r.foreground} on ${r.background}`, still = new Set(open.filter(r => r.kind === 'contrast').map(pair));
  const pairs = [...new Set(accepted.filter(r => r.kind === 'contrast').map(pair))].filter(p => !still.has(p)).sort();
  if (!current && !pairs.length) return null;
  const next = {...(current || {})};
  if (pairs.length) next.acceptedRisks = pairs; else delete next.acceptedRisks;
  await mkdir(tokensDir, {recursive: true});
  await writeFile(file, JSON.stringify(next, null, 2) + '\n');
  return pairs;
}
