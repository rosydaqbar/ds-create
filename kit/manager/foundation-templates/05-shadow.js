// Premade foundation template. Fill inputs; do not generate or edit rendering code per system.
import {compileDomain} from '../foundation-compiler.mjs';
export const id='elevation';
export const name='05-shadow';
export const title='Shadow';
export const fields=['treatment','styles','extra'];
export const defaults={treatment:'layered'};
export function compile(inputs,context){
 if(!inputs||typeof inputs!=='object'||Array.isArray(inputs)||Object.keys(inputs).some(key=>!fields.includes(key)))throw new Error('Unsupported elevation recipe/template input.');
 return compileDomain(id,{...structuredClone(defaults),...inputs},context);
}
