import { iconLibrary, libraryIcons } from './icons/catalog.mjs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { validateFoundations } from './foundation-validation.mjs';
import { compareFoundations } from './foundation-compare.mjs';
import { selectedInputSlug } from './input-identity.mjs';
import { inputFreshness, snapshotInputs } from './input-snapshot.mjs';
import { checkWebDraft } from './foundation-proof.mjs';
import { observedSetup } from './setup-observation.mjs';

export const foundations = [
  { id: 'color', name: 'Color', page: '1.1', description: 'Color roles establish contrast, content hierarchy, and feedback across interface states.', prefixes: ['palette/', 'color/'] },
  { id: 'typography', name: 'Typography', page: '1.2', description: 'A shared type scale gives headings, body text, and interface labels distinct levels of emphasis.', prefixes: ['font/'], styles: 'textStyles' },
  { id: 'space', name: 'Spacing', page: '1.3', description: 'Consistent gaps and padding group related content and give layouts a clear rhythm.', prefixes: ['space/', 'size/'], styles: 'gridStyles' },
  { id: 'shape', name: 'Shape', page: '1.4', description: 'Corner radii and borders define the edges of controls and surfaces.', prefixes: ['radius/', 'border/'] },
  { id: 'elevation', name: 'Elevation', page: '1.5', description: 'Shadows distinguish raised surfaces, while focus treatments identify the active control.', prefixes: [], styles: 'effectStyles' },
  { id: 'motion', name: 'Motion', page: '1.6', description: 'Duration and easing guide how elements enter, leave, and respond to interaction.', prefixes: ['motion/'] },
  { id: 'iconography', name: 'Iconography', page: '1.7', description: 'A consistent icon style helps people recognize actions and information.', prefixes: [] },
  { id: 'brand-assets', name: 'Brand assets', page: '1.8', description: 'Logos and brand assets keep the visual identity consistent across touchpoints.', prefixes: [], later: true },
];

export async function readJSON(file, warnings = []) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (e) {
    if (e.code !== 'ENOENT') warnings.push(`Cannot read ${path.basename(file)}. Waiting for a valid saved file.`);
    return null;
  }
}

export function publishStatus(ledger) {
  const sequence = ledger?.sequence;
  if (!Array.isArray(sequence) || sequence.some(e => !e || typeof e !== 'object')) return { status: 'unavailable', eligible: false };
  const build = sequence.filter(e => Number(e.step) >= 5 && Number(e.step) <= 25);
  if (build.some(e => !Number.isInteger(Number(e.step)) || !['todo', 'skip', 'building', 'qa', 'done', 'error'].includes(e.status))) return { status: 'unavailable', eligible: false };
  const executed = build.some(e => ['building', 'qa', 'done', 'error'].includes(e.status));
  if (!executed) return { status: 'not-run', eligible: false };
  if (build.some(e => e.status === 'error')) return { status: 'failed', eligible: false };
  if (build.some(e => ['building', 'qa'].includes(e.status))) return { status: 'building', eligible: false };
  const initDone = [1, 2, 3, 4].every(n => {
    const entries = sequence.filter(e => Number(e.step) === n);
    return entries.length > 0 && entries.every(e => e.status === 'done');
  });
  if (!initDone || build.some(e => !['done', 'skip'].includes(e.status))) return { status: 'incomplete', eligible: false };
  return { status: 'ready', eligible: true };
}

export async function getPublishStatus(outputDir) {
  const ledger = await readJSON(path.join(outputDir, 'ds-create-ledger.json'));
  const setup = await observedSetup(outputDir);
  if (!(await inputFreshness(outputDir,setup)).fresh) return { status: 'incomplete', eligible: false };
  const result = publishStatus(ledger);
  if (result.eligible) {
    const source = await loadSource(outputDir, ledger);
    if (source.info.kind === 'local' && source.info.review !== 'synced') return { status: 'incomplete', eligible: false };
  }
  return result;
}

function validPayload(data) {
  return Array.isArray(data?.variables) && Array.isArray(data.collections) &&
    ['textStyles', 'effectStyles', 'gridStyles'].every(k => data[k] === undefined || Array.isArray(data[k])) &&
    data.collections.every(c => typeof c?.name === 'string' && Array.isArray(c.modes) && c.modes.every(m => typeof m === 'string')) &&
    ['textStyles', 'effectStyles', 'gridStyles'].every(k => (data[k] || []).every(s => typeof s?.name === 'string')) &&
    data.variables.every(v => typeof v?.name === 'string' && typeof v.collection === 'string' && v.values && typeof v.values === 'object' && !Array.isArray(v.values));
}

// The saved draft wins even when invalid: never mask a broken revision with an older Figma export.
async function loadSource(outputDir, ledger, warnings = []) {
  let bytes;
  try { bytes = await readFile(path.join(outputDir, 'foundations.json')); }
  catch (e) { if (e.code !== 'ENOENT') { warnings.push('Cannot read foundations.json. Save the local draft again.'); bytes = Buffer.alloc(0); } }
  if (bytes === undefined && ledger?.foundationReview) {
    warnings.push('Local foundation draft is missing. Ask the agent to restore foundations.json.');
    return { data: null, info: { kind: 'local', file: 'foundations.json', revision: null, hash: null, review: 'invalid' } };
  }
  if (bytes !== undefined) {
    let data;
    try { data = JSON.parse(bytes.toString('utf8')); } catch { /* reported below */ }
    const hash = createHash('sha256').update(bytes).digest('hex');
    const valid = data?.format === 'ds-create/foundations@1' && Number.isInteger(data.revision) && data.revision > 0 && validPayload(data) && validateFoundations(data).valid &&
      data.variables.length + (data.textStyles?.length || 0) + (data.effectStyles?.length || 0) > 0;
    if (!valid) warnings.push('Local foundation draft is invalid. Ask the agent to save foundations.json again.');
    const setup=await observedSetup(outputDir);
    const fresh=await inputFreshness(outputDir,setup);
    const proof=valid&&setup?await checkWebDraft(outputDir,path.resolve(outputDir,'../../..'),setup):{valid:true};
    if(!fresh.fresh)warnings.push(fresh.message);
    if(!proof.valid)warnings.push('Foundation plan no longer matches the current draft or inputs. Prepare again through Context.');
    const approval = ledger?.foundationReview;
    let approved = valid && fresh.fresh && proof.valid && approval?.status === 'approved' && approval.hash === hash && approval.approvedBy === 'user' &&
      typeof approval.approvalSource === 'string' && approval.approvalSource.trim().length > 0 && Number.isFinite(Date.parse(approval.approvedAt));
    const builderRequest = typeof approval?.approvalSource === 'string' ? approval.approvalSource.match(/(?:^|\/)manager\/jobs\/([0-9a-f-]{36})\/request\.json$/) : null;
    if (approved && builderRequest) {
      const request = await readJSON(path.join(outputDir, 'manager/jobs', builderRequest[1], 'request.json'));
      const fileKey = value => { const url = figmaLink(value); return url ? new URL(url).pathname.match(/^\/(?:design|file)\/([A-Za-z0-9_-]+)(?:\/|$)/)?.[1] : null; };
      const target = ledger?.figma?.url || ledger?.figmaUrl || ledger?.scope?.figmaUrl || ledger?.scope?.figma;
      let currentInputHash;try{currentInputHash=(await snapshotInputs(path.resolve(outputDir,'../../..'),selectedInputSlug(setup,path.basename(outputDir)))).hash;}catch{/* unreadable inputs invalidate approval */}
      approved = request?.hash === hash && (request.inputSlug || path.basename(outputDir))===selectedInputSlug(setup,path.basename(outputDir)) && request.inputHash===currentInputHash && typeof currentInputHash==='string' && !!fileKey(target) && fileKey(request.figmaUrl) === fileKey(target);
    }
    const tokenStep = Array.isArray(ledger?.sequence) ? ledger.sequence.find(e => Number(e?.step) === 4) : null;
    const audit = tokenStep?.audit || ledger?.tokens?.audit;
    let synced = false;
    if (approved && approval.figmaHash === hash && tokenStep?.status === 'done' && audit?.fail === 0) {
      const confirmed = await readJSON(path.join(outputDir, 'figma/figma-variables.json'));
      synced = confirmed?.format === 'ds-create/figma-variables@1' && validPayload(confirmed) && compareFoundations(data,confirmed).match;
      if(!synced)warnings.push('Confirmed Figma output differs from the approved draft. Inspect the foundation diff before continuing.');
      if (synced && builderRequest) {
        const report = await readJSON(path.join(outputDir, 'figma/audit-file.json'));
        synced = report?.mode === 'file' && report.sourceHash === hash && report.result?.fail === 0;
      }
    }
    return { data: valid ? data : null, info: { kind: 'local', file: 'foundations.json', revision: data?.revision || null, hash,
      review: !valid ? 'invalid' : synced ? 'synced' : approved ? 'approved' : 'pending' } };
  }
  const data = await readJSON(path.join(outputDir, 'figma/figma-variables.json'), warnings);
  const valid = data?.format === 'ds-create/figma-variables@1' && validPayload(data);
  if (data && !valid) warnings.push('Token export has an unsupported format. Save the Figma export again.');
  return { data: valid ? data : null, info: { kind: data ? 'figma' : 'none', file: data ? 'figma/figma-variables.json' : null, review: 'not-required' } };
}

export function figmaLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password && ['figma.com', 'www.figma.com'].includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

export function resolveValue(variable, mode, byName, seen = new Set()) {
  if (seen.has(variable.name)) return { value: null, error: 'Circular alias' };
  const next = new Set(seen).add(variable.name);
  const values = variable.values || {};
  // A single-mode collection (usually Primitives) can be used by any semantic mode.
  const selected = Object.hasOwn(values, mode) ? values[mode] : Object.keys(values).length === 1 ? Object.values(values)[0] : undefined;
  if (selected === undefined) return { value: null, error: `No value for ${mode}` };
  if (selected && typeof selected === 'object' && Object.hasOwn(selected, 'alias')) {
    const target = byName.get(selected.alias);
    if (!target) return { value: null, alias: selected.alias, error: 'Unresolved alias' };
    return { ...resolveValue(target, mode, byName, next), alias: selected.alias };
  }
  return { value: selected };
}

export async function getState(outputDir, { preparing = false } = {}) {
  const warnings = [];
  const [ledger, progress] = await Promise.all([
    readJSON(path.join(outputDir, 'ds-create-ledger.json'), warnings),
    readJSON(path.join(outputDir, 'manager/progress.json'), warnings),
  ]);
  const { data: savedData, info: source } = await loadSource(outputDir, ledger, warnings);
  const setup = await observedSetup(outputDir);
  const fresh=await inputFreshness(outputDir,setup);
  const settingUp = !!setup && (setup.status !== 'ready'||!fresh.fresh) && !preparing;
  const plan=await readJSON(path.join(outputDir,'foundation-plan.json'));
  const exported = settingUp ? null : savedData;
  const local = source.kind === 'local';
  const variables = exported?.variables || [];
  const byName = new Map(variables.map(v => [v.name, v]));
  const sequence = Array.isArray(ledger?.sequence) ? ledger.sequence.filter(e => e && typeof e === 'object') : [];
  const initSteps = sequence.filter(e => Number(e.step) >= 1 && Number(e.step) <= 4);
  const initDone = [1, 2, 3, 4].every(n => {
    const entries = initSteps.filter(e => Number(e.step) === n);
    return entries.length > 0 && entries.every(e => e.status === 'done');
  }) && (!local || source.review === 'synced') && fresh.fresh;
  const skippedRequired = initSteps.some(e => e.status === 'skip');
  const tokenStep = initSteps.find(e => Number(e.step) === 4);
  const working = tokenStep && ['building', 'qa'].includes(tokenStep.status);
  const collections = exported?.collections || [];
  const items = foundations.map(f => {
    const mapping=plan?.domains?.[f.id];
    const rows = variables.filter(v => mapping?.status==='included'?mapping.variables?.includes(v.name):f.prefixes.some(prefix => v.name.startsWith(prefix)) || v.collection.toLowerCase() === f.name.toLowerCase());
    const styles = f.styles ? (exported?.[f.styles] || []).filter(s=>mapping?.status==='included'?mapping.styles?.includes(s.name):true) : [];
    const explicit = progress?.foundations?.[f.id];
    const hasData = rows.length + styles.length > 0;
    let status = 'pending';
    let message = f.later ? 'Available after /ds-create build.' : 'Waiting for init to generate this foundation.';
    if (local && hasData) { status = 'ready'; message = source.review === 'synced' ? 'Saved foundations generated in Figma.' : 'Local draft available for review. Figma generation is a separate step.'; }
    else if (local && !exported && !f.later) { status = 'error'; message = 'Local foundation draft is unreadable. Ask the agent to save it again.'; }
    else if (tokenStep?.status === 'done' && hasData) { status = 'ready'; message = 'Saved foundation values are available to inspect.'; }
    else if (working && !f.later) { status = 'generating'; message = 'Init is creating variables and styles in Figma.'; }
    else if (tokenStep?.status === 'done' && !f.later && !exported) { status = 'error'; message = 'Foundation export is missing or unreadable. Save it again to show the results.'; }
    else if (tokenStep?.status === 'done' && !hasData && !f.later) message = 'No values were exported for this foundation.';
    if (explicit && (!local || ['error', 'skipped'].includes(explicit.status)) && ['pending', 'generating', 'ready', 'error', 'skipped'].includes(explicit.status)) {
      status = explicit.status;
      message = explicit.message || message;
      if (status === 'ready' && !hasData) { status = 'error'; message = 'Marked ready, but no exported values or styles are available.'; }
    }
    if(mapping?.status==='excluded'){status='skipped';message=mapping.reason;}
    if (settingUp && !f.later) { status = ['queued','running'].includes(setup.status)&&!(setup.runner==='mcp'&&setup.status==='queued') ? 'generating' : 'pending'; message = setup.message || 'Add context to prepare this foundation.'; }
    const library=!settingUp && f.id==='iconography' && (plan?.systemMode||ledger?.scope?.systemMode)==='new'?iconLibrary:null;
    if(f.id==='iconography'){
      status=library?'ready':'pending';
      message=library?'Lucide library reference. Figma icon components are created during the library build.':'Settle whether this is a new system. Existing icon libraries are preserved.';
    }
    const rawModes = [...new Set(rows.flatMap(v => Object.keys(v.values)))];
    const modes = rawModes.length > 1 ? rawModes.filter(m => m !== 'Value') : rawModes;
    if (!modes.length && f.id === 'elevation' && styles.length) modes.push(...(collections.find(c => c.name === 'Color')?.modes || []));
    return { ...f, status, message, count: library?libraryIcons.length:rows.length + styles.length, modes, ...(library?{library}:{}),
      variables: rows.map(v => ({ ...v, resolved: Object.fromEntries(Object.keys(v.values).map(mode => [mode, resolveValue(v, mode, byName)])) })), styles };
  });
  const audit = tokenStep?.audit || ledger?.tokens?.audit;
  const failed = items.some(f => f.status === 'error') || warnings.length > 0 || tokenStep?.status === 'error' || Number(audit?.fail) > 0;
  const running = items.some(f => f.status === 'generating');
  let status = failed ? 'error' : initDone && !running ? 'ready' : skippedRequired ? 'incomplete' : local && exported && source.review === 'pending' ? 'review' : local && exported && !working ? 'approved' : sequence.length ? 'generating' : 'pending';
  if (settingUp) status = ['queued','running'].includes(setup.status)&&!(setup.runner==='mcp'&&setup.status==='queued') ? 'generating' : ['failed','blocked','interrupted','cancelled'].includes(setup.status) ? 'incomplete' : 'pending';
  if (initSteps.some(e => e.status === 'error')) status = 'error';
  const files = ['ds-create-ledger.json', 'foundations.json', 'figma/figma-variables.json', 'manager/progress.json'];
  const modified = await Promise.all(files.map(async f => { try { return (await stat(path.join(outputDir, f))).mtimeMs; } catch { return 0; } }));
  const scope = ledger?.scope || {};
  const figmaUrl = figmaLink(ledger?.figma?.url || ledger?.figmaUrl || scope.figmaUrl || scope.figma);
  return {
    system: setup?.projectName || (typeof ledger?.system === 'string' ? ledger.system : scope.name || (setup ? 'Your design system' : path.basename(outputDir))),
    setup: setup ? { status: fresh.fresh?setup.status:setup.status==='ready'?'outdated':setup.status, message: fresh.fresh?setup.message || '':fresh.message } : null,
    slug: path.basename(outputDir), inputSlug:selectedInputSlug(setup,path.basename(outputDir)), product: scope.productType || scope.product || scope.platform || 'Not settled yet',
    figmaUrl, preview: ledger?.preview === true, status, initDone, warnings, source,
    updated: Math.max(...modified) ? new Date(Math.max(...modified)).toISOString() : null,
    steps: [1, 2, 3, 4].map(n => {
      const e = initSteps.find(e => Number(e.step) === n);
      return { step: n, name: ['Read inputs', 'Verify Figma', 'Confirm foundations', 'Generate Figma foundations'][n - 1], required: true, status: e?.status || 'todo', note: e?.note || '' };
    }),
    summary: { variables: variables.length, collections: collections.length, textStyles: exported?.textStyles?.length || 0,
      effectStyles: exported?.effectStyles?.length || 0, ready: items.filter(f => f.status === 'ready').length,
      audit: audit?.fail === 0 ? 'Passed' : audit?.fail > 0 ? `${audit.fail} findings` : 'Not checked yet' },
    collections: collections.map(c => ({ ...c, count: variables.filter(v => v.collection === c.name).length })),
    foundations: items,
  };
}
