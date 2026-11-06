import {lstat, mkdir, open, readFile, readdir, realpath, rename, unlink, writeFile} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import path from 'node:path';
import {existsSync, readFileSync} from 'node:fs';

const sha = data => createHash('sha256').update(data).digest('hex');
// Derived indexes and the generated decision transcription are not source inputs.
const generated = new Set(['sources.md', 'answers/01-init.md']);
const rootBookkeeping = new Set(['README.md', '.DS_Store']);
async function inputDirectory(workspace) {
  const base=await realpath(workspace);
  for(const rel of ['workspace','workspace/input']){
    try{const info=await lstat(path.join(base,rel));if(!info.isDirectory()||info.isSymbolicLink())throw new Error('Input storage must use real workspace directories.');}
    catch(e){if(e.code==='ENOENT')return null;throw e;}
  }
  return path.join(base,'workspace/input');
}
// Metadata only for the Builder list; file bytes are read once per source snapshot.
export async function listRootInputs(workspace) {
  const input=await inputDirectory(workspace);if(!input)return [];
  const files=[];
  for(const entry of await readdir(input,{withFileTypes:true})){
    if(rootBookkeeping.has(entry.name)||entry.isDirectory()||entry.isSymbolicLink())continue;
    const info=await lstat(path.join(input,entry.name));
    if(info.isSymbolicLink())throw new Error(`Root input ${entry.name} is a symlink. Provide a regular file.`);
    if(!info.isFile())throw new Error(`Root input ${entry.name} is not a regular file.`);
    files.push({name:entry.name,path:`../${entry.name}`,size:info.size});
  }
  return files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
}
export async function snapshotInputs(workspace, slug) {
  selectedInputSlug({inputSlug:slug});
  const input=await inputDirectory(workspace),files=[];
  if(!input)return {hash:sha('[]'),files};
  const root=path.join(input,slug);
  let selectedExists=true;
  try{const info=await lstat(root);if(!info.isDirectory()||info.isSymbolicLink())throw new Error('Input storage must use real workspace directories.');}
  catch(e){if(e.code==='ENOENT')selectedExists=false;else throw e;}
  async function walk(dir, prefix='') {
    for (const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))) {
      const name=prefix+entry.name, full=path.join(dir,entry.name);
      if(entry.isSymbolicLink())throw new Error(`Input ${name} is a symlink. Upload a regular copy through Context.`);
      if(generated.has(name))continue;
      if(entry.isDirectory())await walk(full,name+'/');
      else if(entry.isFile()){const bytes=await readFile(full);files.push({path:name,size:bytes.length,hash:sha(bytes)});}
      else throw new Error(`Input ${name} is not a regular file.`);
    }
  }
  try{
    if(selectedExists)await walk(root);
    for(const entry of await listRootInputs(workspace)){
      const bytes=await readFile(path.join(input,entry.name));
      files.push({path:entry.path,size:bytes.length,hash:sha(bytes)});
    }
  }catch(e){if(e.code==='ENOENT')throw new Error('Inputs changed while reading. Retry after files are saved.');throw e;}
  files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
  return {hash:sha(JSON.stringify(files)),files};
}
export async function inputFreshness(outputDir, setup) {
  if(!setup || setup.status!=='ready')return {fresh:!setup,message:setup?.message || 'Finish local preparation first.'};
  if(!setup.readyInputHash)return {fresh:false,message:'This draft predates input revision checks. Open Context and prepare it again.'};
  try{
    const current=await snapshotInputs(path.resolve(outputDir,'../../..'),selectedInputSlug(setup,path.basename(outputDir)));
    return {fresh:current.hash===setup.readyInputHash,hash:current.hash,message:current.hash===setup.readyInputHash?'':'Context files changed. Open Context and prepare the current inputs before publishing.'};
  }catch(e){return {fresh:false,message:e.message};}
}

// 1.8 Brand assets shows the logo files the user put in Context: the image files in this session's input folder and
// the shared files directly in workspace/input/ (listRootInputs, stored as ../name like the snapshot). Symlinks and dot
// files are skipped. An upload replaced by a newer one of the same name (setup.files lists the current ones) is an
// archive, not a logo. A key is the file name, or its path when two files share a name. The URL carries the file time
// so a replaced logo redraws. An unreadable root input hides the root files and sets error.
export const brandTypes = {svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp'};
const brandType = name => brandTypes[path.extname(name).slice(1).toLowerCase()] || null;
export async function listBrandFiles(workspace, setup, sessionSlug) {
  const input = await inputDirectory(workspace); if (!input) return { files: [], error: null };
  const root = path.join(input, selectedInputSlug(setup, sessionSlug)), found = [];
  const add = async (full, name, rel) => { const info = await lstat(full); found.push({ name, path: rel, size: info.size, mtimeMs: Math.trunc(info.mtimeMs), type: brandType(name) }); };
  let session = true;
  try { const info = await lstat(root); if (!info.isDirectory() || info.isSymbolicLink()) session = false; }
  catch (e) { if (e.code === 'ENOENT') session = false; else throw e; }
  const active = Array.isArray(setup?.files) ? new Set(setup.files.map(f => f?.path)) : null;
  async function walk(dir, prefix = '') {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const rel = prefix + entry.name;
      if (entry.name.startsWith('.') || entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), rel + '/');
      else if (entry.isFile() && brandType(entry.name) && (!active || !rel.startsWith('uploads/') || active.has(rel))) await add(path.join(dir, entry.name), entry.name, rel);
    }
  }
  if (session) await walk(root);
  let error = null;
  try { for (const entry of await listRootInputs(workspace)) if (brandType(entry.name)) await add(path.join(input, entry.name), entry.name, entry.path); }
  catch { error = 'Context files could not be read. Check the files and try again.'; found.splice(0, found.length, ...found.filter(f => !f.path.startsWith('../'))); }
  const names = found.map(f => f.name);
  const files = found.map(f => ({ ...f, key: names.indexOf(f.name) === names.lastIndexOf(f.name) ? f.name : f.path }))
    .sort((a, b) => a.key.localeCompare(b.key, 'en')).map(f => ({ ...f, url: `/api/brand-assets/${encodeURIComponent(f.key)}?v=${f.mtimeMs}` }));
  return { files, error };
}
// The bytes of one listed logo, or null. Only a key from the current list is served, and the file must still be a
// regular file with no symlink on its path: a session file inside the session folder, a root file directly in
// workspace/input/.
export async function readBrandFile(workspace, setup, sessionSlug, key) {
  const file = (await listBrandFiles(workspace, setup, sessionSlug)).files.find(f => f.key === key); if (!file || !brandType(file.name)) return null;
  const inputRoot = await realpath(await inputDirectory(workspace)), shared = file.path.startsWith('../');
  const base = shared ? inputRoot : await realpath(path.join(inputRoot, selectedInputSlug(setup, sessionSlug)));
  const full = path.join(base, shared ? file.name : file.path), real = await realpath(full).catch(() => null);
  if (real !== full || (shared ? path.dirname(real) !== inputRoot : !real.startsWith(base + path.sep)) || !(await lstat(real)).isFile()) return null;
  return { bytes: await readFile(real), type: file.type };
}

export class PublishError extends Error {
  constructor(message, status = 409) { super(message); this.status = status; }
}
export async function writeJSON(file, value) {
  const tmp = `${file}.${randomUUID()}.tmp`;
  await writeFile(tmp, JSON.stringify(value, null, 2) + '\n'); await rename(tmp, file);
}
// Every writable ancestor must be a real directory inside this workspace, never a symlink.
export async function localDirectory(workspace, relative) {
  let dir = await realpath(workspace);
  for (const part of relative.split('/')) {
    if (!part || part === '.' || part === '..') throw new PublishError('Invalid workspace directory.', 400);
    dir = path.join(dir, part);
    try { await mkdir(dir); } catch (e) { if (e.code !== 'EEXIST') throw e; }
    const s = await lstat(dir);
    if (s.isSymbolicLink() || !s.isDirectory()) throw new PublishError('Input storage must stay inside this workspace.', 412);
  }
  return dir;
}
// Actions on a job are short (a claim, a progress note, Stop), so a held lock is waited on for up to 2s; a lock
// still held after that is a live action, and the caller is told to retry.
export async function withJobLock(dir,kind,fn){
 const file=path.join(dir,kind+'-action.lock');let handle;
 for(let waited=0;!handle;waited+=25){
  try{handle=await open(file,'wx');}catch(error){
   if(error.code!=='EEXIST')throw error;
   if(waited>=2000)throw new PublishError(`Another ${kind==='prepare'?'preparation':'publish'} action is being saved. Retry after it finishes.`);
   await new Promise(r=>setTimeout(r,25));
  }
 }
 try{return await fn();}finally{await handle.close();await unlink(file);}
}
// Workspace mode: workspace/output/{slug} with manager/ inside. Project mode (ds-create.json at the folder's root):
// the project's output/, whose runtime state lives in output/manager/ and needs no copied code.
export async function sessionOutput(workspace,slug){
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug||''))throw new Error('Provide the saved Builder session id.');
 if(existsSync(path.join(workspace,'ds-create.json'))){
  // Not kit/paths.mjs: this file is also copied into workspace sessions, which do not carry that file.
  let own;try{own=JSON.parse(readFileSync(path.join(workspace,'ds-create.json'),'utf8')).slug;}catch{throw new Error('ds-create.json is not valid JSON.');}
  if(slug!==own)throw new Error(`This project is ${own}.`);
  const output=path.join(workspace,'output');
  if(await realpath(output)!==output)throw new Error('Session must stay inside this workspace.');
  return output;
 }
 const output=path.join(workspace,'workspace/output',slug);
 if(await realpath(output)!==output||await realpath(path.join(output,'manager'))!==path.join(output,'manager'))throw new Error('Session must stay inside this workspace.');
 return output;
}

const validSlug = value => typeof value === 'string' && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value) && new TextEncoder().encode(value).length <= 240;

export function projectInputSlug(name) {
  const normalized = name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-');
  const slug = Array.from(normalized).slice(0, 60).join('').replace(/^-+|-+$/g, '');
  if (!validSlug(slug)) throw new Error('Use at least one letter or number in the project name to name its input folder.');
  return slug;
}

// Web sessions have a named input tree and a separate stable output/session ID.
// Older sessions and chat-led systems keep their existing folder mapping.
export function selectedInputSlug(setup, sessionSlug) {
  const slug = setup?.inputSlug ?? sessionSlug;
  if (!validSlug(slug)) throw new Error('Invalid input folder identity.');
  return slug;
}
