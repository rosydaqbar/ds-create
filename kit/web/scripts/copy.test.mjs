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
 const w=writer({'02':{sections:[{name:'Naming',web:'narrative',lines:[line('Names distinguish a role from its source value.'),line('The table uses exported names.','both','caption')],items:[{title:'Role grammar',web:'',lines:[line('Choose a role by its intended consumer.')]}]}]}});
 const P=({children})=>React.createElement('p',null,children);
 const H3=({children})=>React.createElement('h3',null,children);
 const blocks={P,H3,Bullets:()=>null,Caption:P,slugify:s=>s.toLowerCase().replaceAll(' ','-')};
 const js=ts.transpileModule(fs.readFileSync(new URL('../src/docs/FoundationCopy.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};
 new Function('exports','require',js)(exports,name=>({'react':React,'react/jsx-runtime':jsxRuntime,'./copy':w,'./blocks':blocks,'./DocPage':{AnchorHeading:H3,Topics:()=>null}})[name]);
 const html=renderToStaticMarkup(React.createElement(exports.ReadingTopic,{id:'02',title:'Naming'},React.createElement(React.Fragment,null,React.createElement(P,null,'Stale explanation.'),React.createElement(H3,null,'Previous reference'),React.createElement('table',null,React.createElement('tbody',null,React.createElement('tr',null,React.createElement('td',null,'Verified value')))))));
 assert.match(html,/Names distinguish a role/);assert.match(html,/The table uses exported names/);assert.match(html,/Choose a role by its intended consumer/);assert.match(html,/<table>/);assert.match(html,/Verified value/);assert.match(html,/id="previous-reference"/);assert.doesNotMatch(html,/Stale explanation/);
});

test('authored reading copy owns nested explanations, lists and captions while references stay live', () => {
 const P=({children})=>React.createElement('p',null,children);
 const H3=({children})=>React.createElement('h3',null,children);
 const Bullets=({items})=>React.createElement('ul',null,items.map((s,i)=>React.createElement('li',{key:i},s)));
 const Reference=()=>React.createElement('table',null,React.createElement('tbody',null,React.createElement('tr',null,React.createElement('td',null,'36px'))));
 const blocks={P,H3,Bullets,Caption:({children})=>React.createElement('small',null,children),slugify:s=>s.toLowerCase().replaceAll(' ','-')};
 const w=writer({'02':{sections:[{name:'Collections',web:'',lines:[],items:[{title:'Select by purpose',web:'Old topic',lines:[line('Choose the text role for the text’s purpose.'),line('Keep the corresponding state mapping.','both','item'),line('The table retains exported values.','both','caption'),line('Figma-only wording.','figma')]}]}]}});
 const js=ts.transpileModule(fs.readFileSync(new URL('../src/docs/FoundationCopy.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};new Function('exports','require',js)(exports,name=>({'react':React,'react/jsx-runtime':jsxRuntime,'./copy':w,'./blocks':blocks,'./DocPage':{AnchorHeading:H3,Topics:()=>null}})[name]);
 const fallback=React.createElement('div',{className:'layout'},React.createElement('div',null,React.createElement(P,null,'Stale nested claim.'),React.createElement(Bullets,{items:['Stale list.']}),React.createElement(blocks.Caption,null,'Stale caption.')),React.createElement(Reference));
 const render=(id)=>renderToStaticMarkup(React.createElement(exports.ReadingTopic,{id,title:'Old topic'},fallback));
 const html=render('02');
 assert.match(html,/Select by purpose/);assert.match(html,/id="old-topic"/);
 assert.match(html,/Choose the text role/);assert.match(html,/<li>Keep the corresponding state mapping/);
 assert.match(html,/<small>The table retains exported values/);assert.match(html,/<table>/);assert.match(html,/36px/);
 assert.doesNotMatch(html,/Stale|Figma-only/);
 const renamed=renderToStaticMarkup(React.createElement(exports.ReadingTopic,{id:'02',title:'New topic name',aliases:['Old topic']},fallback));
 assert.match(renamed,/Choose the text role/);assert.match(renamed,/36px/);assert.doesNotMatch(renamed,/Stale/);
 const legacy=render('missing');assert.match(legacy,/Stale nested claim/);assert.match(legacy,/Stale list/);assert.match(legacy,/Stale caption/);assert.match(legacy,/36px/);
});

function readingWriter(pages) {
 const P=({children})=>React.createElement('p',null,children);
 const H3=({children})=>React.createElement('h3',null,children);
 const blocks={P,H3,Bullets:({items})=>React.createElement('ul',null,items.map((s,i)=>React.createElement('li',{key:i},s))),Caption:P,slugify:s=>s.toLowerCase().replaceAll(' ','-')};
 const Topics=({items})=>React.createElement('article',null,items.map(g=>React.createElement('section',{'data-reading-topic':g.title,key:g.title},...(g.aliases??[]).map(id=>React.createElement('span',{id,key:id})),React.createElement('h3',{id:blocks.slugify(g.title)},g.title),React.createElement(P,null,g.body),g.render?.())));
 const js=ts.transpileModule(fs.readFileSync(new URL('../src/docs/FoundationCopy.tsx',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={};new Function('exports','require',js)(exports,name=>({'react':React,'react/jsx-runtime':jsxRuntime,'./copy':writer(pages),'./blocks':blocks,'./DocPage':{AnchorHeading:H3,Topics}})[name]);
 return {...exports,P,H3};
}

for(const category of ['guidance','foundation','future subject'])test(`${category}: explanation and live detail precede the next topic`,()=>{
 const items=[{title:'Choosing names',web:'Old grammar',lines:[line('A name identifies purpose.')]},{title:'State mappings',web:'',lines:[line('Only exported conditions have values.')]}];
 const r=readingWriter({'77':{sections:[{name:'Structure',web:'narrative',lines:[],items}]}});
 const fallback=React.createElement('div',null,React.createElement(r.ReadingDetail,{topic:'Old grammar'},React.createElement('output',null,'Actual role name')),React.createElement(r.ReadingDetail,{topic:'State mappings'},React.createElement('output',null,'Actual state value')));
 const html=renderToStaticMarkup(React.createElement(r.ReadingTopic,{id:'77',title:'Structure'},fallback));
 assert.match(html,/data-reading-topic="Choosing names"[^>]*>[\s\S]*Actual role name[\s\S]*?<\/section>\s*<section[^>]*data-reading-topic="State mappings"/);
 assert.ok(html.indexOf('Actual role name')<html.indexOf('Only exported conditions'));
 assert.match(html,/data-reading-topic="State mappings"[^>]*>[\s\S]*Actual state value/);
});

test('reference topics keep authored prose with specimens, and legacy content remains readable',()=>{
 const items=[{title:'Radius',web:'reference',lines:[line('These are the exported corner values.')]},{title:'Borders',web:'reference',lines:[line('Boundary width is separate.')]}];
 const r=readingWriter({'1.4':{sections:[{name:'Overview',web:'narrative',lines:[],items}]}});
 const fallback=React.createElement('div',null,React.createElement(r.P,null,'Stale explanation.'),React.createElement(r.ReadingDetail,{topic:'Radius'},React.createElement(r.H3,null,'Old heading'),React.createElement('output',null,'8px')),React.createElement(r.ReadingDetail,{topic:'Borders'},React.createElement('output',null,'1px')),React.createElement(r.ReadingDetail,{topic:'Additional reference'},React.createElement('output',null,'16px')));
 const html=renderToStaticMarkup(React.createElement(r.ReadingNarrative,{id:'1.4',fallback}));
 assert.ok(html.indexOf('exported corner')<html.indexOf('8px'));
 assert.ok(html.indexOf('8px')<html.indexOf('Boundary width'));
 assert.ok(html.indexOf('Boundary width')<html.indexOf('1px'));
 assert.match(html,/Additional reference/);assert.match(html,/16px/);assert.doesNotMatch(html,/Stale explanation/);
 const legacy=renderToStaticMarkup(React.createElement(r.ReadingNarrative,{id:'missing',fallback}));
 assert.match(legacy,/Stale explanation/);assert.match(legacy,/Old heading/);assert.match(legacy,/16px/);
});

test('a consolidated topic keeps each matched detail and semicolon alias',()=>{
 const r=readingWriter({'3.9':{sections:[{name:'Overview',web:'narrative',lines:[],items:[{title:'Combined decision',web:'First topic; Second topic',lines:[line('Two related choices are explained together.')]}]}]}});
 const fallback=React.createElement(React.Fragment,null,React.createElement(r.ReadingDetail,{topic:'First topic'},'Detail one'),React.createElement(r.ReadingDetail,{topic:'Second topic'},'Detail two'));
 const html=renderToStaticMarkup(React.createElement(r.ReadingNarrative,{id:'3.9',fallback}));
 assert.equal((html.match(/data-reading-topic=/g)||[]).length,1);
 assert.match(html,/Detail one/);assert.match(html,/Detail two/);
 assert.ok(html.indexOf('Detail one')<html.indexOf('Detail two'));
});

test('an explicit reference topic owns its detail ahead of a renamed introduction alias',()=>{
 const items=[{title:'Recognizing symbols',web:'Symbol library',lines:[line('Choose recognizable symbols.')]},{title:'Symbol library',web:'reference',lines:[line('Browse the registered symbols.')]}];
 const r=readingWriter({'1.9':{sections:[{name:'Overview',web:'narrative',lines:[],items}]}});
 const fallback=React.createElement(r.ReadingDetail,{topic:'Symbol library'},React.createElement(r.P,null,'Registered source data'));
 for(const [Component,props]of [[r.ReadingNarrative,{id:'1.9',fallback}],[r.ReadingTopic,{id:'1.9',title:'Overview',children:fallback}]]){
  const html=renderToStaticMarkup(React.createElement(Component,props));
  assert.equal((html.match(/data-reading-detail=/g)||[]).length,1);
  if(Component===r.ReadingNarrative)assert.equal((html.match(/id="symbol-library"/g)||[]).length,1);
  assert.ok(html.indexOf('Browse the registered symbols')<html.indexOf('Registered source data'));
 }
});
