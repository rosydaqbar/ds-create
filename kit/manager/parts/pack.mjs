// Generated views of the saved Parts: a JS module and a readable note per Part, plus a manifest of hashes.
// The JSON part file is authoritative; these are rebuilt from it on every save.
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {partTemplates, templateHash, templateText} from './templates.mjs';
import {draftHash} from './files.mjs';

const sha = text => createHash('sha256').update(text).digest('hex');
const table = rows => rows.map(r => '| ' + r.map(x => String(x ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ')).join(' | ') + ' |').join('\n');
const alias = t => Object.entries(t.values).map(([m, v]) => `${m}: ${v?.alias || JSON.stringify(v)}`).join('; ');
const PACKAGE = '{"type":"module","private":true}\n';

export function createPartPack({parts, draft, projectName}) {
  const files = [['parts/package.json', PACKAGE]], entries = [];
  for (const t of partTemplates) {
    const part = parts[t.id];
    if (!part) continue;
    const base = `parts/${t.page}-${t.id}`;
    const js = '// Generated from the saved part. Do not edit.\nexport const part = ' + JSON.stringify(part, null, 2) + ';\nexport default part;\n';
    const inputs = Object.keys(part.inputs || {}).length ? '```json\n' + JSON.stringify(part.inputs, null, 2) + '\n```' : 'Template defaults; this system has not changed them.';
    const decisions = (part.decisions || []).map(d => `- **${d.key}:** ${d.value} (decided by ${d.decidedBy}). ${d.reason}`).join('\n') || 'None.';
    const summary = table([['Token', 'Value'], ['---', '---'], ...part.tokens.slice(0, 12).map(x => [x.name, alias(x)])]) + `\n\nComplete definitions: ${t.page}-${t.id}.js (${part.tokens.length} tokens, ${part.variantCount} variants).`;
    const slots = {project: projectName, revision: part.revision, foundationsHash: part.foundationsHash, inputs, decisions, summary, references: `- Page spec: \`${t.spec}\`` + (t.uses.length ? `\n- Uses: ${t.uses.join(', ')}` : '')};
    const md = templateText(t, 'md').replace(/\{\{(\w+)\}\}/g, (_, k) => String(slots[k] ?? ''));
    files.push([base + '.js', js], [base + '.md', md]);
    entries.push({id: t.id, page: t.page, template: `${t.page}-${t.id}`, revision: part.revision, files: {js: {file: base + '.js', sha256: sha(js)}, md: {file: base + '.md', sha256: sha(md)}}, counts: {tokens: part.tokens.length, variants: part.variantCount}});
  }
  const manifest = {format: 'ds-create/part-pack@1', foundationsHash: draftHash(draft), templateHash: templateHash(), entries};
  files.push(['parts/manifest.json', JSON.stringify(manifest, null, 2) + '\n']);
  return {manifest, files};
}

export async function verifyPartPack(outputDir, parts) {
  const stale = () => new Error('Part pack is stale; prepare Parts again.');
  let manifest;
  try { manifest = JSON.parse(await readFile(path.join(outputDir, 'parts/manifest.json'), 'utf8')); } catch { throw stale(); }
  const ids = Object.keys(parts).sort();
  if (manifest.format !== 'ds-create/part-pack@1' || manifest.templateHash !== templateHash() || JSON.stringify(manifest.entries.map(e => e.id).sort()) !== JSON.stringify(ids)) throw stale();
  for (const e of manifest.entries) {
    if (e.revision !== parts[e.id].revision) throw stale();
    for (const f of Object.values(e.files)) { let text; try { text = await readFile(path.join(outputDir, f.file), 'utf8'); } catch { throw stale(); } if (sha(text) !== f.sha256) throw stale(); }
  }
}
