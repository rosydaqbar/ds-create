import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

// Exercise the real merge implementation with copy data, without mounting browser components.
function writer(pages) {
  const src = fs.readFileSync(new URL('../src/docs/copy.ts', import.meta.url), 'utf8')
    .replace("import data from './copy.gen.json';", `const data = ${JSON.stringify({ pages })};`);
  const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {}; new Function('exports', 'require', js)(exports, () => React); return exports;
}
const line = (text, surface = 'both', role = '') => ({ text, surface, role });
const section = (web, items) => ({ name: 'Guidelines', web, lines: [], items });
const item = (title, web = '') => ({ title, web, lines: [line('The revised decision is specific to this control.')] });
const copy = (sections) => ({ '2.1': { id: '2.1', page: '2.1 Action', sections } });
const visual = () => null;
const doc = () => ({ id: '2.1', summary: 'Legacy summary', guidelines: [{ title: 'Old decision', body: 'Legacy explanation', render: visual }, { title: 'Other decision', body: 'Another explanation' }], examples: [{ title: 'Example', code: '<Action />', render: visual }], anatomy: { parts: [{ name: 'Root', description: 'Container', tokens: ['size/control/md'] }] }, props: [{ name: 'disabled', type: 'boolean' }], app: { examples: [], notes: ['Platform note'], visuals: { 'Old decision': { render: visual } } } });

test('no copy file preserves the original object', () => {
  const d = doc(); assert.equal(writer({}).withCopy(d), d);
});
test('legacy merge retains unmatched topics, visuals, API, anatomy and code', () => {
  const d = doc(), out = writer(copy([section('', [item('Old decision')])])).withCopy(d);
  assert.equal(out.guidelines.length, 2); assert.equal(out.guidelines[0].render, visual);
  assert.equal(out.props, d.props); assert.equal(out.anatomy, d.anatomy); assert.equal(out.examples, d.examples);
});
test('replacement order consolidates old prose and keeps renamed visuals/deep links', () => {
  const d = doc(), out = writer(copy([section('replace', [item('Choosing a treatment', 'Old decision; Other decision')])])).withCopy(d);
  assert.deepEqual(out.guidelines.map((g) => g.title), ['Choosing a treatment']);
  assert.equal(out.guidelines[0].render, visual);
  assert.deepEqual(out.guidelines[0].aliases, ['old-decision', 'other-decision']);
  assert.equal(out.app.visuals['Choosing a treatment'].render, visual);
  assert.equal(out.props, d.props); assert.equal(out.examples[0].code, '<Action />');
});
test('Figma-only text does not leak into the site and paragraphs retain their boundaries', () => {
  const it = item('Old decision'); it.lines = [line('Private design wording.', 'figma'), line('First explanation.', 'web'), line('Second decision.')];
  const out = writer(copy([section('replace', [it])])).withCopy(doc());
  assert.equal(out.guidelines[0].body, 'First explanation.\n\nSecond decision.');
});
test('optional foundation summary has a legacy fallback', () => {
  const w = writer({ '1.1': { sections: [{ name: 'Summary', lines: [line('Authored scope.')], items: [] }] } });
  assert.equal(w.copySummary('1.1', 'Fallback'), 'Authored scope.');
  assert.equal(w.copySummary('1.2', 'Fallback'), 'Fallback');
});

test('reading topics work outside foundations and preserve previous topic names', () => {
 const w=writer({'01':{sections:[{name:'For developers',items:[{title:'Adopting an exported artifact',web:'Keeping in sync with Figma',lines:[line('Export, rebuild and review the source.')] }]}]}});
 assert.equal(w.readingTopic('01','Keeping in sync with Figma').title,'Adopting an exported artifact');
 assert.equal(w.readingTopic('unknown','Topic'),undefined);
});
test('property writing changes explanations without changing API specifications', () => {
 const d=doc();d.props[0].default='false';
 const w=writer(copy([{name:'Properties',items:[{title:'disabled',web:'',lines:[line('Unavailable actions do not activate.')]}]}]));
 const out=w.withCopy(d);
 assert.deepEqual(out.props[0],{name:'disabled',type:'boolean',default:'false',description:'Unavailable actions do not activate.'});
});

test('consolidation preserves every matched web and app visual without changing code', () => {
 const calls=[], d=doc();
 const view=(name)=>()=>{calls.push(name);return name};
 d.guidelines=[{title:'Old decision',body:'Old',render:view('web one')},{title:'Other decision',body:'Old two',aliases:['historical-anchor'],render:view('web two'),do:{caption:'Old caption',render:view('web do')}}];
 d.app.visuals={'Old decision':{render:view('app one'),do:view('app do one')},'Other decision':{render:view('app two'),do:view('app do two')}};
 const topic=item('Combined decision','Old decision; Other decision');topic.lines.push(line('Revised comparison.','both','do'));
 const out=writer(copy([section('replace',[topic])])).withCopy(d);
 out.guidelines[0].render();out.guidelines[0].do.render();out.app.visuals['Combined decision'].render();out.app.visuals['Combined decision'].do();
 assert.deepEqual(calls,['web one','web two','web do','app one','app two','app do one','app do two']);
 assert.equal(out.guidelines[0].do.caption,'Revised comparison.');
 assert.ok(out.guidelines[0].aliases.includes('historical-anchor'));
 assert.equal(out.examples,d.examples);assert.equal(out.app.examples[0]?.code,d.app.examples[0]?.code);
});
for (const level of ['parts','components','sections','layouts','screens']) {
 test(`the existing merge has no subject or category gate: ${level}`, () => {
  const d=doc();d.level=level;
  const out=writer(copy([section('replace',[item('A subject-specific decision','Old decision')])])).withCopy(d);
  assert.equal(out.level,level);assert.equal(out.guidelines.length,1);assert.equal(out.guidelines[0].render,visual);
 });
}

test('authored reading sections replace prose in fragments while retaining live references and old anchors', () => {
 const w=writer({'02':{sections:[{name:'Naming',web:'narrative',lines:[],items:[{title:'Role grammar',web:'',lines:[line('Choose a role by its intended consumer.')]}]}]}});
 const P=({children})=>React.createElement('p',null,children);
 const H3=({children})=>React.createElement('h3',null,children);
 const blocks={P,H3,Bullets:()=>null,Caption:P,slugify:s=>s.toLowerCase().replaceAll(' ','-')};
 const js=ts.transpileModule(fs.readFileSync(new URL('../src/docs/FoundationCopy.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 new Function('exports','require',js)(exports,name=>({'react':React,'react/jsx-runtime':jsxRuntime,'./copy':w,'./blocks':blocks,'./DocPage':{AnchorHeading:H3,Topics:()=>null}})[name]);
 const html=renderToStaticMarkup(React.createElement(exports.ReadingTopic,{id:'02',title:'Naming'},React.createElement(React.Fragment,null,React.createElement(P,null,'Stale explanation.'),React.createElement(H3,null,'Previous reference'),React.createElement('table',null,React.createElement('tbody',null,React.createElement('tr',null,React.createElement('td',null,'Verified value')))))));
 assert.match(html,/Choose a role by its intended consumer/);assert.match(html,/<table>/);assert.match(html,/Verified value/);assert.match(html,/id="previous-reference"/);assert.doesNotMatch(html,/Stale explanation/);
});
