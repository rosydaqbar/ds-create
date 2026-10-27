// Premade foundation template. Fill inputs; do not generate or edit rendering code per system.
import {compileDomain} from '../compiler.mjs';
export const id='shape';
export const name='04-radius';
export const title='Radius';
export const fields=['preset','values','extra'];
export const defaults={};
export function compile(inputs,context){
 if(!inputs||typeof inputs!=='object'||Array.isArray(inputs)||Object.keys(inputs).some(key=>!fields.includes(key)))throw new Error('Unsupported shape recipe/template input.');
 return compileDomain(id,{...structuredClone(defaults),...inputs},context);
}
