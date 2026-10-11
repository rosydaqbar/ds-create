import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkEditorial} from './copy-guard.mjs';
const slug=`editorial-regression-${process.pid}`;
const root=new URL(`../../output/${slug}/`,import.meta.url);
fs.mkdirSync(new URL('copy/',root),{recursive:true});
test.after(()=>fs.rmSync(root,{recursive:true,force:true}));
const file=new URL('copy/77.1-arbitrary-subject.md',root);
const write=body=>fs.writeFileSync(file,`---\npage: 77.1 Arbitrary subject\n---\n${body}`);
test('prose without a plan is reviewed rather than silently skipped',()=>{
 write('# Summary\n[both] Creates visual harmony throughout the product.');
 assert.ok(checkEditorial(slug).some(e=>e.includes('abstract-guidance')));
});
test('legacy input remains supported without imposing a new visible outline',()=>{
 write('# Summary\n[both] This region groups pending records separately from confirmed records.\n# Decisions\n## Recovery\n[both] Keep failed records available until their owner resolves the missing source.');
 assert.deepEqual(checkEditorial(slug),[]);
 assert.ok(checkEditorial(slug,[],true).some(e=>e.includes('pre-draft editorial plan')));
});
