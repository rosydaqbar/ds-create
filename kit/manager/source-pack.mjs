// Local data extraction only. Never evaluates a source, fetches a URL or changes an input.
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {snapshotInputs} from './input-snapshot.mjs';
import {localDirectory,saveSetup} from './setup-data.mjs';
import {tokenizationPreview} from './setup-options.mjs';

export const EXTRACTOR_VERSION='ds-create/source-pack@1';
export const digest=value=>createHash('sha256').update(value).digest('hex');
const decode=text=>text.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp|ndash|mdash|hellip|copy|reg);/gi,(_,entity)=>{
 const n=entity[0]==='#'?parseInt(entity.slice(entity[1]?.toLowerCase()==='x'?2:1),entity[1]?.toLowerCase()==='x'?16:10):null;
 return n!==null?(n>0&&n<=0x10ffff?String.fromCodePoint(n):'�'):({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',hellip:'…',copy:'©',reg:'®'})[entity.toLowerCase()];
});
const attr=(tag,name)=>decode(tag.match(new RegExp('\\b'+name+'\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))','i'))?.slice(1).find(v=>v!==undefined)||'');
const textTypes=new Set(['.md','.txt','.csv','.tsv','.yaml','.yml','.css','.xml']);
const imageTypes=new Set(['.svg','.png','.jpg','.jpeg','.webp','.gif','.avif','.heic','.pdf','.docx','.pptx','.xlsx']);
export function extractSource(bytes,extension){
 const source=bytes.toString('utf8');
 if(extension==='.html'||extension==='.htm'){
  const styles=[...source.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)];
  // Preserve every custom property, font declaration and appearance declaration, including inline styles.
  // Layout-only selectors/rules, script bodies, SVG geometry and embedded binary URLs stay on disk.
  const css=[];
  const styleBlocks=[...styles.map(m=>({text:m[1],offset:m.index+m[0].indexOf(m[1])})),...source.matchAll(/\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi)].map(m=>m.text!==undefined?m:{text:m[2],offset:m.index+m[0].indexOf(m[2])});
  for(const block of styleBlocks)for(const m of block.text.matchAll(/(--[\w-]+|(?:font(?:-[\w-]+)?|line-height|letter-spacing|color|background(?:-color)?|fill|stroke|opacity|box-shadow|border(?:-[\w-]+)?|transition(?:-[\w-]+)?|animation(?:-[\w-]+)?)|src)\s*:\s*([^;{}]+)[;}]?/gi)){
   css.push({offset:block.offset+m.index,property:m[1],value:decode(m[2]).replace(/url\(\s*["']?data:[\s\S]*$/i,'url([embedded asset])')});
  }
  const assets=[...source.matchAll(/<(?:img|image|link|svg)\b[^>]*>/gi)].map(m=>({offset:m.index,type:m[0].match(/^<(\w+)/)[1].toLowerCase(),src:attr(m[0],'src')||attr(m[0],'href')||attr(m[0],'xlink:href'),label:attr(m[0],'alt')||attr(m[0],'aria-label')||attr(m[0],'title')})).map(a=>({...a,src:a.src.startsWith('data:')?'[embedded asset]':a.src}));
  const metadata=[...source.matchAll(/<meta\b[^>]*>/gi)].map(m=>({offset:m.index,name:attr(m[0],'name')||attr(m[0],'property'),content:attr(m[0],'content')}));
  for(const m of source.matchAll(/<svg\b[^>]*>([\s\S]*?)<\/svg\s*>/gi)){const asset=assets.find(a=>a.offset===m.index);if(asset)asset.description=[...m[1].matchAll(/<(?:title|desc)\b[^>]*>([\s\S]*?)<\/(?:title|desc)\s*>/gi)].map(t=>decode(t[1].replace(/<[^>]*>/g,'')).trim()).join(' ');}
  // Offsets refer to UTF-16 positions in the original file, never to the transformed text.
  const hidden=[...source.matchAll(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>|<!--[\s\S]*?-->/gi)].map(m=>[m.index,m.index+m[0].length]);
  let h=0;const blocks=[];
  for(const m of source.matchAll(/[^<>]+(?=<|$)/g)){
   while(hidden[h]&&hidden[h][1]<=m.index)h++;
   if(hidden[h]&&m.index>=hidden[h][0]&&m.index<hidden[h][1])continue;
   // Only text nodes; attribute fragments are not visible text.
   if(m.index&&source[m.index-1]!=='>')continue;
   const text=decode(m[0]).trim();if(text)blocks.push({offset:m.index,text});
  }
  const warnings=[];
  if(source.includes('�'))warnings.push('Unrecognized text encoding: inspect original source.');
  if(/<(script|style|svg)\b/i.test(source.replace(/<(script|style|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'')))warnings.push('Unclosed HTML element: inspect original file for omitted content.');
  return {kind:'html',blocks,css,assets,metadata,warnings,requiresInspection:!!warnings.length,omitted:['Executable scripts','SVG path geometry','Layout-only CSS','Embedded asset bytes']};
 }
 if(extension==='.json'){
  try{
   const data=JSON.parse(source);
   if(Array.isArray(data?.variables)&&data?.collections&&typeof data.collections==='object')return {kind:'token-export',format:data.format||null,counts:{collections:Object.keys(data.collections).length,variables:data.variables.length,textStyles:data.textStyles?.length||0,effectStyles:data.effectStyles?.length||0},requiresInspection:true,note:'Structured token inventory: import losslessly through frozenSource; inspect relevant entries for role decisions. The full export remains in the source file.'};
   return {kind:'json',blocks:[{offset:0,text:source}],requiresInspection:false};
  }catch{return {kind:'unreadable',requiresInspection:true,note:'Invalid JSON. Read the original or request a valid export.'};}
 }
 if(textTypes.has(extension)&&!source.includes('\u0000')&&!source.includes('�'))return {kind:'text',blocks:[{offset:0,text:source}],requiresInspection:false};
 return {kind:imageTypes.has(extension)?'document-or-image':'unsupported',requiresInspection:true,note:'Use existing native file/image tools to inspect this source. If unreadable, return questions. No silent exclusion.'};
}
export function lockedFacts(request){
 const choices=request.interfaceDetails,platform=tokenizationPreview(choices?.devices||[]);
 return {projectName:request.projectName||null,modes:choices?.modes||null,platform:platform.web&&platform.app?'Web and App':platform.web?'Web':platform.app?'App':null,devices:choices?.devices||[],source:request.contextFile||null,fastMode:true};
}
export async function sourceBytes(request,key){
 const entry=request.inputSnapshot.find(e=>e.path===key);
 if(!entry)throw new Error('Source is outside this trusted snapshot.');
 const base=path.join(request.workspace,'workspace/input',request.inputSlug||request.slug);
 const bytes=await readFile(path.resolve(base,key));
 if(bytes.length!==entry.size||digest(bytes)!==entry.hash)throw new Error('Source changed while extracting. Prepare the current inputs.');
 return bytes;
}
export async function prepareSourcePack(request,jobDir){
 const started=Date.now();
 const before=await snapshotInputs(request.workspace,request.inputSlug||request.slug);
 if(before.hash!==request.inputHash)throw new Error('Context changed before source extraction.');
 const cache=await localDirectory(request.workspace,`workspace/output/${request.slug}/manager/preparation-cache/sources`),sources=[];
 let hits=0,misses=0;
 for(const entry of request.inputSnapshot){
  const extension=path.extname(entry.path).toLowerCase(),key=digest(JSON.stringify([EXTRACTOR_VERSION,extension,entry.hash]));
  let extraction;
  try{const stored=JSON.parse(await readFile(path.join(cache,key+'.json'),'utf8'));if(stored.key===key&&digest(JSON.stringify(stored.extraction))===stored.contentHash)extraction=stored.extraction;}catch(e){if(!['ENOENT',undefined].includes(e.code))throw e;}
  if(extraction)hits++;
  else{misses++;extraction=extractSource(await sourceBytes(request,entry.path),extension);await saveSetup(path.join(cache,key+'.json'),{key,extraction,contentHash:digest(JSON.stringify(extraction))});}
  const uploaded=entry.path.startsWith('uploads/'),active=!uploaded||request.activeFiles?.some(f=>f.path===entry.path);
  sources.push({...entry,active,archive:uploaded&&!active,extraction});
 }
 if((await snapshotInputs(request.workspace,request.inputSlug||request.slug)).hash!==request.inputHash)throw new Error('Context changed during extraction.');
 const pack={format:EXTRACTOR_VERSION,inputHash:request.inputHash,inputRevision:request.inputRevision,locked:lockedFacts(request),precedence:{latestContext:request.contextFile,activeUploads:request.activeFiles?.map(f=>f.path)||[],rule:'Standing knowledge and frozen definitions precede defaults. Latest context supersedes conflicting earlier context. Archived uploads are retained evidence, not current authority.'},sources};
 const file=path.join(jobDir,'source-pack.json');await saveSetup(file,pack);
 const metrics={format:'ds-create/preparation-metrics@1',sourceFiles:sources.length,sourceBytes:sources.reduce((n,s)=>n+s.size,0),packBytes:Buffer.byteLength(JSON.stringify(pack)),cacheHits:hits,extracted:misses,elapsedMs:Date.now()-started,created:new Date().toISOString()};
 await saveSetup(path.join(jobDir,'source-metrics.json'),metrics);
 return {file,pack,metrics};
}
