import test from 'node:test';
import assert from 'node:assert/strict';
import {compileDomain, domainNames} from '../kit/manager/foundations/compiler.mjs';
import {compileButton, previewButton} from '../kit/manager/server/parts.mjs';

const recipes={color:{palettes:{brand:{anchors:{50:'#fdf2f2',600:'#c33734',950:'#2e0d0c'},purpose:'Product actions'},neutral:{anchors:{50:'#f7f7f6',950:'#0a0b09'},purpose:'Text and surfaces'},red:{anchors:{50:'#fef2f2',600:'#b91c1c',950:'#450a0a'},purpose:'Danger'}},tones:{danger:'red'}},
 typography:{families:{ui:'Fixture Sans'},faces:{ui:{regular:'Regular',medium:'Medium',bold:'Bold'}}},space:{base:4},shape:{},elevation:{treatment:'layered'},motion:{}};
function foundations(){
 const draft={collections:[],variables:[],textStyles:[],effectStyles:[],gridStyles:[]},dependencies=[];
 for(const id of domainNames){const part=compileDomain(id,recipes[id],{platform:['Web'],modes:['Light'],dependencies:draft.variables});for(const k of Object.keys(draft))for(const x of part[k]||[])if(!draft[k].some(y=>y.name===x.name))draft[k].push(x);}
 return draft;
}
test('Button compiles from the published foundations: full matrix, component tokens and reviewable decisions',()=>{
 const draft=foundations(),part=compileButton(draft,{domains:{elevation:{inputs:{treatment:'layered'}}}});
 assert.equal(part.variantCount,360);assert.equal(part.set,'Button');
 assert.deepEqual(part.tokens.map(t=>t.name).filter(n=>n.startsWith('button/padding-left/')),['xs','sm','md','lg','xl'].map(s=>'button/padding-left/'+s));
 assert.ok(part.tokens.every(t=>t.collection==='Components'&&/^space\//.test(t.values.Value.alias)),'component tokens point at spacing tokens, never raw values');
 assert.deepEqual(part.primitives,[]);
 const custom=compileButton(draft,{},{sizes:{md:{padding:{left:'space/2xl'}}},treatments:{'brand|primary|rest':{fill:'color/fill/danger/solid'}}});
 assert.equal(custom.sizes.find(z=>z.size==='md').padding.left,'space/2xl');assert.equal(custom.treatments.brand.primary.rest.fill,'color/fill/danger/solid');assert.equal(custom.treatments.brand.primary.hover.fill,'color/fill/brand/solid/hover','other states keep their own colors');
 assert.equal(part.decisions.find(d=>d.key==='Button text weight').style,'type/body/{sm,md}/medium','no semibold face, so the closest weight is a visible decision');
 assert.equal(part.treatments.brand.primary.focus.effect,'focus/default/control');assert.equal(part.treatments.brand.tertiary.rest.effect,null);
 assert.equal(part.treatments.danger.secondary.disabled.text,'color/text/disabled');
 const preview=previewButton(part,draft);assert.equal(preview.sizes.find(s=>s.size==='md').padding.left,16);assert.ok(preview.options.space.some(o=>o.name==='space/xl'));assert.equal(preview.sizes.find(s=>s.size==='md').height,40);
 assert.match(preview.treatments.brand.primary.rest.fill,/^#c33734$/i);
});
test('Button refuses foundations that lack a role it needs',()=>{
 const draft=foundations();draft.variables=draft.variables.filter(v=>v.name!=='color/fill/brand/solid');
 assert.throws(()=>compileButton(draft,{}),/missing roles the Button needs: color\/fill\/brand\/solid/);
});
