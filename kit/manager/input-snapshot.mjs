import { readdir, lstat, readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { selectedInputSlug } from './input-identity.mjs';
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
