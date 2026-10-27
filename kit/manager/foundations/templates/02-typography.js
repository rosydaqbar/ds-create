// Premade foundation template. Fill inputs; do not generate or edit rendering code per system.
import {compileDomain} from '../compiler.mjs';
export const id='typography';
export const name='02-typography';
export const title='Typography';
export const fields=['families','faces','display','code','rows','weights','extra'];
export const defaults={};
export function compile(inputs,context){
 if(!inputs||typeof inputs!=='object'||Array.isArray(inputs)||Object.keys(inputs).some(key=>!fields.includes(key)))throw new Error('Unsupported typography recipe/template input.');
 return compileDomain(id,{...structuredClone(defaults),...inputs},context);
}
