// The session's risks (foundation contrast and text on a Part's gradient), and the two ways the user accepts them:
// Builder (source "builder") and chat (source "chat:<file under input/chat/>", the user's own words saved first).
import {lstat, readFile} from 'node:fs/promises';
import path from 'node:path';
import {foundationRisks, partRisks, readAccepted, removeAccepted, riskKey, splitRisks, writeAccepted, isRisk} from '../foundations/risks.mjs';
import {partStatus, readParts} from '../parts/files.mjs';
import {inputRel, projectSlug, workspaceOf} from './layout.mjs';
import {selectedInputSlug, PublishError} from './files.mjs';

const readJSON = async file => { try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } };

// Every risk found in the saved draft and Parts, split into open and accepted.
export async function risksOf(outputDir, draft) {
  draft ??= await readJSON(path.join(outputDir, 'foundations.json'));
  if (!draft?.variables) return {open: [], accepted: []};
  let parts = {};
  try { parts = await readParts(outputDir); } catch { /* unreadable Parts list no risks; the Parts step reports them */ }
  // An outdated Part is prepared again before it is used, so its saved risks are not current.
  const current = Object.fromEntries(Object.entries(parts).filter(([, p]) => { try { return partStatus(p, draft, parts) === 'ready'; } catch { return false; } }));
  // A file Builder cannot read counts as no acceptances, with the reason, so Builder still opens and Approve says why.
  let accepted = [], error = null;
  try { accepted = await readAccepted(outputDir); } catch (e) { error = `${e.message} Fix or delete output/accepted-risks.json, then accept the risks again.`; }
  return {...splitRisks([...foundationRisks(draft), ...partRisks(current)], accepted), ...(error ? {error} : {})};
}
export const openContrast = risks => risks.open.filter(r => r.kind === 'contrast');

// The chat file the user's agreement was saved in: a regular file under the session's input/chat/.
async function chatSource(outputDir, file) {
  if (typeof file !== 'string' || !file.trim()) throw new PublishError('Save the user\'s message in input/chat/ first, then pass it as the source.', 400);
  const workspace = workspaceOf(outputDir), setup = await readJSON(path.join(outputDir, 'manager/setup.json'));
  const chat = path.join(workspace, inputRel(workspace, selectedInputSlug(setup, projectSlug(outputDir))), 'chat');
  const full = path.resolve(workspace, file), rel = path.relative(chat, full);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new PublishError(`The source must be a file in ${path.relative(workspace, chat)}/.`, 400);
  let info;
  try { info = await lstat(full); } catch { throw new PublishError(`The source file ${path.relative(workspace, full)} does not exist. Save the user's message there first.`, 400); }
  if (!info.isFile() || info.isSymbolicLink()) throw new PublishError('The source must be a regular file.', 400);
  return 'chat:' + path.relative(workspace, full).split(path.sep).join('/');
}

// A selector names a risk by its identity; for Part risks text and paint are optional, so --where covers a slot.
const matches = (sel, r) => sel?.kind === r.kind && (r.kind === 'contrast'
  ? sel.foreground === r.foreground && sel.background === r.background && sel.mode === r.mode
  : sel.part === r.part && sel.where === r.where && (!sel.text || sel.text === r.text) && (!sel.paint || sel.paint === r.paint));

// all: every open risk, both kinds. risks: selectors. source: "builder", or the chat file path.
export async function acceptRisks(outputDir, {all = false, kind, risks = [], source}) {
  const from = source === 'builder' ? 'builder' : await chatSource(outputDir, source);
  if (!all && (!Array.isArray(risks) || !risks.length)) throw new PublishError('Name the risks to accept, or accept all of them.', 400);
  const found = await risksOf(outputDir);
  if (found.error) throw new PublishError(found.error, 409);
  const open = found.open.filter(r => !kind || r.kind === kind), chosen = all ? open : open.filter(r => risks.some(sel => matches(sel, r)));
  if (!all) for (const sel of risks) if (!open.some(r => matches(sel, r))) throw new PublishError(`No open risk matches ${sel?.kind === 'part-contrast' ? `${sel.part} ${sel.where}` : `${sel?.foreground} on ${sel?.background} (${sel?.mode})`}.`, 404);
  const added = await writeAccepted(outputDir, chosen, {source: from});
  return {accepted: added.length, risks: await risksOf(outputDir)};
}

// Restore the rule for one accepted risk.
export async function restoreRisk(outputDir, risk) {
  if (!isRisk(risk)) throw new PublishError('Send the risk to restore.', 400);
  const removed = await removeAccepted(outputDir, risk);
  if (!removed) throw new PublishError('That risk is not accepted.', 404);
  return {restored: riskKey(risk), risks: await risksOf(outputDir)};
}
