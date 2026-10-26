// Premade foundation template. Fill inputs; do not generate or edit rendering code per system.
import {compileDomain} from '../foundation-compiler.mjs';
export const id='space';
export const name='03-spacing';
export const title='Spacing';
export const fields=['base','values','sizes','grids','extra'];
export const defaults={base:4};
export function compile(inputs,context){
 if(!inputs||typeof inputs!=='object'||Array.isArray(inputs)||Object.keys(inputs).some(key=>!fields.includes(key)))throw new Error('Unsupported space recipe/template input.');
 return compileDomain(id,{...structuredClone(defaults),...inputs},context);
}
