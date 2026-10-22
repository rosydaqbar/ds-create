import { readdir, lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
const sha = data => createHash('sha256').update(data).digest('hex');
// Derived indexes and the generated decision transcription are not source inputs.
const generated = new Set(['sources.md', 'answers/01-init.md']);
export async function snapshotInputs(workspace, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Invalid system identity.');
  const root = path.join(workspace, 'workspace/input', slug), files = [];
  const base = await realpath(workspace);
  // Reject symlinked ancestors as well as symlinked source files.
  for (const rel of ['workspace', 'workspace/input', `workspace/input/${slug}`]) {
    try { const stat = await lstat(path.join(base,rel)); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Input storage must use real workspace directories.'); }
    catch(e){if(e.code==='ENOENT')return {hash:sha('[]'),files:[]};throw e;}
  }
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
  try{await walk(root);}catch(e){if(e.code==='ENOENT')throw new Error('Inputs changed while reading. Retry after files are saved.');throw e;}
  files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
  return {hash:sha(JSON.stringify(files)),files};
}
export async function inputFreshness(outputDir, setup) {
  if(!setup || setup.status!=='ready')return {fresh:!setup,message:setup?.message || 'Finish local preparation first.'};
  if(!setup.readyInputHash)return {fresh:false,message:'This draft predates input revision checks. Open Context and prepare it again.'};
  try{
    const current=await snapshotInputs(path.resolve(outputDir,'../../..'),path.basename(outputDir));
    return {fresh:current.hash===setup.readyInputHash,hash:current.hash,message:current.hash===setup.readyInputHash?'':'Context files changed. Open Context and prepare the current inputs before publishing.'};
  }catch(e){return {fresh:false,message:e.message};}
}
