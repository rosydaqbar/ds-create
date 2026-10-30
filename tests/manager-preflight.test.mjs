import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluatePreflight, preflightOperation, requiredFonts} from '../kit/manager/server/publish.mjs';

test('source-derived preflight executes read-only and requires every exact font result',async()=>{
 assert.deepEqual(requiredFonts({textStyles:[{fontFamily:'Fixture Font'}]}),[{family:'Fixture Font',style:'Regular'}],'existing canonical default remains supported');
 const draft={textStyles:[{fontFamily:'Fixture Font',fontStyle:'Regular'},{fontFamily:'Fixture Font',fontStyle:'Medium'},{fontFamily:'Fixture Font',fontStyle:'Regular'}]};
 const operation=preflightOperation({figmaUrl:'https://www.figma.com/design/Selected/File',hash:'approved'},draft);
 const mock={listAvailableFontsAsync:async()=>[{fontName:{family:'Fixture Font',style:'Regular'}},{fontName:{family:'Fixture Font Pro',style:'Medium'}}],variables:{getLocalVariableCollectionsAsync:async()=>[{variableIds:['a','b']}]},getLocalTextStylesAsync:async()=>[],getLocalEffectStylesAsync:async()=>[]};
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const actual=await new AsyncFunction('figma',operation.code)(mock);
 assert.equal(operation.fileKey,'Selected');assert.deepEqual(actual.inventory,{collections:1,variables:2,textStyles:0,effectStyles:0});
 assert.deepEqual(evaluatePreflight(draft,actual).missing,[{family:'Fixture Font',style:'Medium'}],'similar family is not an approved substitution');
 const checked=evaluatePreflight(draft,actual);
 assert.equal(checked.passed,false,'a face Figma cannot load stops publication before writes');
 assert.deepEqual(actual.alternatives,[{family:'Fixture Font',similar:[{family:'Fixture Font Pro',styles:['Medium']}],recommended:[]}]);
 assert.deepEqual(checked.roles,[{role:'ui',family:'Fixture Font',styles:['Medium'],label:'UI and body text',options:[{family:'Fixture Font Pro',styles:['Medium'],note:'closest'}]}]);
 assert.equal(evaluatePreflight(draft,{...actual,fonts:actual.fonts.map(f=>({...f,available:true})),alternatives:[]}).passed,true);
 assert.throws(()=>evaluatePreflight(draft,{...actual,fonts:actual.fonts.slice(1)}),/every approved font/);
});
