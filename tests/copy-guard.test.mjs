import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {checkEditorial} from '../kit/tools/content/guard.mjs';

const slug=`editorial-regression-${process.pid}`;
const root=new URL(`../workspace/output/${slug}/`,import.meta.url);
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
test('the existing guard rejects review notes without requiring a new plan or category',()=>{
 write('# Supporting guidance\n## Compatibility\n[web caption] This specimen does not establish native parity.');
 assert.ok(checkEditorial(slug).some(e=>e.includes('review-provenance')));
 write('# Supporting guidance\n## Compatibility\n[web caption] Use the supported web properties and supply application validation rules.');
 assert.deepEqual(checkEditorial(slug),[]);
});
