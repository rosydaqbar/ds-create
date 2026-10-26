// Premade foundation template. Fill inputs; do not generate or edit rendering code per system.
import {compileDomain} from '../foundation-compiler.mjs';
export const id='motion';
export const name='06-motion';
export const title='Motion';
export const fields=['values','extra'];
export const defaults={};
export function compile(inputs,context){
 if(!inputs||typeof inputs!=='object'||Array.isArray(inputs)||Object.keys(inputs).some(key=>!fields.includes(key)))throw new Error('Unsupported motion recipe/template input.');
 return compileDomain(id,{...structuredClone(defaults),...inputs},context);
}
