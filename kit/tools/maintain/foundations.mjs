#!/usr/bin/env node
// Maintainer-time generation. Runtime workers load the small, versioned result, not the handbooks.
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {createHash} from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
export const contractSources=['specs/SYSTEM.md',...['1.1-color','1.2-typography','1.3-space-and-layout','1.4-shape','1.5-elevation','1.6-motion'].map(n=>'specs/foundations/'+n+'.md')];
export async function generateDefaults(root){
 const source=Object.fromEntries(await Promise.all(contractSources.map(async f=>[f,await readFile(path.join(root,f),'utf8')])));
 const hashes=Object.fromEntries(Object.entries(source).map(([k,v])=>[k,digest(v)]));
 const color=source[contractSources[1]].split('## · Tokens')[1].split('### 8. Category')[0];
 const colors=[];let parent;
 for(const line of color.split('\n')){
  const cells=line.split('|').slice(1,-1).map(c=>c.trim());
  if(cells.length!==4||!cells[0].includes('`')||!cells[1].startsWith('`')||!cells[2].startsWith('`'))continue;
  let name=cells[0].match(/`([^`]+)`/)?.[1];if(!name)continue;
  if(/[└├]/.test(cells[0]))name=parent+'/'+name;else parent=name;
  if(!name?.startsWith('color/'))continue;
  colors.push({name,Light:cells[1].replaceAll('`',''),Dark:cells[2].replaceAll('`',''),description:cells[3]});
 }
 const typography=[];
 for(const line of source[contractSources[2]].split('\n')){
  const m=line.match(/^\| `type\/(\w+)\/(\w+)` \| (\d+) \| (\d+) \| ([^|]+) \| ([^|]+) \|/);
  if(m)typography.push({role:m[1],size:m[2],fontSize:Number(m[3]),lineHeight:Number(m[4]),letterSpacing:parseFloat(m[5].trim().replace('−','-')),weights:m[6].trim().split(', ')});
 }
 const space={};
 for(const line of source[contractSources[3]].split('\n')){const m=line.match(/^\| `(space\/[^`]+)` \| (\d+) \|/);if(m)space[m[1]]=Number(m[2]);}
 const shape={};
 for(const line of source[contractSources[4]].split('## · Tokens')[1].split('## · Guidelines')[0].split('\n')){const m=line.match(/^\| `([^`]+)` \| `(\d+)` \| ([^|]+) \|/);if(m)shape[m[1]]={value:Number(m[2]),description:m[3].trim()};}
 const motion={};
 for(const line of source[contractSources[6]].split('## · Tokens')[1].split('## · Guidelines')[0].split('\n')){
  const m=line.match(/^\| `(motion\/[^`]+)` \| ([^|]+) \| ([^|]+) \| ([^|]+) \|/);if(!m)continue;
  const standard=m[1].includes('/easing/')?'cubic-bezier('+m[2].trim()+')':Number(m[2]);
  motion[m[1]]={Standard:standard,Reduced:m[3].trim()==='same'?standard:Number(m[3]),description:m[4].trim()};
 }
 if(!colors.length||!typography.length||!Object.keys(space).length||!Object.keys(shape).length||Object.keys(motion).length!==12)throw new Error('Foundation spec tables changed: update the maintainer compiler before generating defaults.');
 return {format:'ds-create/foundation-defaults@1',sources:hashes,colors,typography,space,shape,motion};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=fileURLToPath(new URL('../../../',import.meta.url)),defaults=await generateDefaults(root);
 await writeFile(new URL('../../manager/foundations/defaults.json',import.meta.url),JSON.stringify(defaults,null,2)+'\n');
 console.log('Foundation defaults generated from '+Object.keys(defaults.sources).length+' authoritative contracts.');
}
