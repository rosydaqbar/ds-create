import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { editorialFindings, validatePlan, GOALS, REVIEWS } from './editorial.mjs';
import { parseCopy, forSurface, fingerprints } from '../web/scripts/build-copy.mjs';

const parse = (body) => parseCopy(`---\npage: 1.1 Color\nfigma: 1:2\nweb: source.tsx\n---\n${body}`).copy;
const copy = parse('# Summary\n[both] A role identifies the purpose of a foreground independently from its palette value.\n# Guidelines\n## Pair selection\n[both] Measure the chosen foreground on the surface it actually touches before approving a combination.');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ds-editorial-'));
fs.writeFileSync(path.join(root, 'source.json'), '{"modes":["Dark"]}');
const plan = () => ({ version: 1, page: copy.page, kind: 'foundation', distinctions: ['Role versus value'], evidence: [{ id: 'mode', kind: 'verified', statement: 'Dark is supported', source: 'source.json', quote: '"Dark"' }], decisions: [{ id: 'pair', question: 'Which foreground belongs on this surface?' }], sections: [{ location: 'Summary', purpose: 'Define scope', goals: ['definition'], evidence: ['mode'] }, { location: 'Guidelines / Pair selection', purpose: 'Choose and test a pair', goals: GOALS.filter((g) => g !== 'definition'), evidence: ['mode'], decisions: ['pair'] }], notApplicable: {}, review: Object.fromEntries(REVIEWS.map((r) => [r, 'Reviewed actual information and references.'])) });
test.after(() => fs.rmSync(root, { recursive: true, force: true }));

test('coverage goals may share a topic without six visible headings', () => assert.deepEqual(validatePlan(plan(), copy, root), []));
test('unsupported behavior can be explicitly not applicable', () => {
  const p = plan(); p.sections[1].goals = p.sections[1].goals.filter((g) => g !== 'behavior'); p.notApplicable.behavior = 'Static reference; no interaction or mode change applies.';
  assert.deepEqual(validatePlan(p, copy, root), []);
});
test('missing coverage, reader decisions and review cannot pass', () => {
  const p = plan(); p.sections[1].goals = []; p.decisions = []; p.review = {};
  const errors = validatePlan(p, copy, root).join('\n');
  assert.match(errors, /coverage missing: specification/); assert.match(errors, /no reader decisions/); assert.match(errors, /editor review missing/);
});
test('a stale source, fabricated file and path escape fail grounding', () => {
  for (const replacement of [{ quote: '"Light"' }, { source: 'missing.ts' }, { source: '../outside.json' }]) {
    const p = plan(); Object.assign(p.evidence[0], replacement);
    assert.ok(validatePlan(p, copy, root).length);
  }
});
test('general advice and missing information cannot substantiate a specification', () => {
  for (const kind of ['guidance', 'missing']) {
    const p = plan(); p.evidence[0].kind = kind;
    assert.match(validatePlan(p, copy, root).join('\n'), /specifications need verified/);
  }
});
test('the plan must refer to actual content, not invented or unplanned topics', () => {
  const p = plan(); p.sections[1].location = 'Guidelines / Phantom';
  assert.match(validatePlan(p, copy, root).join('\n'), /no content/);
  assert.match(validatePlan(p, copy, root).join('\n'), /unplanned copy/);
});
test('unknown evidence and unknown goals are rejected', () => {
  const p = plan(); p.sections[1].evidence = ['invented']; p.sections[1].goals.push('marketing');
  const errors = validatePlan(p, copy, root).join('\n'); assert.match(errors, /unknown evidence/); assert.match(errors, /unknown coverage goal/);
});
test('detects repeated sentences across unrelated pages', () => {
  const other = { ...copy, id: '2.1' };
  assert.ok(editorialFindings([copy, other]).some((f) => f.code === 'repeated-sentence'));
});
test('detects the incumbent repeated introduction rather than banning the heading alone', () => {
  const repeated = parse('# Summary\n[both] Color carries the brand and tells people what’s happening. Components use semantic roles instead of raw palette values, so every screen works in Dark and the palette can change in one place.\n# Overview\n## How color works\n[both] Example color comes in two layers. Primitive palettes hold the raw values. Semantic roles say what each color is for, and they change with the mode. Components use only roles, so you can change a palette without touching a single component.');
  // Topic mechanics, not brand facts, are under test. Never reuse this prose as generated output.
  assert.ok(editorialFindings([repeated]).some((f) => f.code === 'adjacent-overlap'));
  assert.equal(editorialFindings([parse('# Overview\n## How color works\n[both] Select a foreground role for the actual surface, then measure its contrast before use.')]).length, 0);
});
test('alternative surfaces are separate while captions receive editorial review', () => {
  const alternative = parse('# Summary\n[figma] Select a foreground role for the actual surface, then measure its contrast before use.\n[web] Select a foreground role for the actual surface, then measure its contrast before use.\n# Examples\n## Pair\n[both caption] Compare foregrounds against this surface.');
  assert.deepEqual(editorialFindings([alternative]), []);
});
test('author instructions cannot masquerade as finished guidelines', () => {
  assert.ok(editorialFindings([parse('# Guidelines\n## Anatomy\n[both] Explain why buttons need clear affordance and show the required visual.')]).some((f) => f.code === 'author-instruction'));
});
test('legacy tagged copy, source comments and fingerprints remain compatible', () => {
  const legacy = parse('# Summary\n<!-- figma: 2:3 -->\n[both] A reusable role reference.\n# Guidelines\n<!-- web: replace -->\n## Selecting a pair\n<!-- web: Old title; Other title -->\n[figma] A design explanation.\n[web] A code explanation.\n[both do] Measure the actual pair.\n[both don\'t] Infer contrast from hue.');
  assert.equal(forSurface(legacy, 'web').sections[1].items[0].web, 'Old title; Other title');
  assert.equal(forSurface(legacy, 'figma').sections[1].items[0].lines[0].text, 'A design explanation.');
  assert.equal(fingerprints(legacy)[0][0], '2:3');
  assert.ok(parseCopy('---\npage: 1.1 Color\n---\n# Summary\n[unknown] Drop me').errors.length);
});

for (const kind of ['section', 'layout', 'screen', 'content policy', 'new subject never seen before']) {
  test(`coverage does not restrict documentation category: ${kind}`, () => {
    const p = plan(); p.kind = kind;
    assert.deepEqual(validatePlan(p, copy, root), []);
  });
}
test('captions and accessibility items cannot bypass the same quality standard', () => {
  for (const role of ['caption', 'item', 'do', "don't"]) {
    const weak = parse(`# Examples\n## Diagram\n[both ${role}] Explain why the parts provide an intuitive experience.\n# Accessibility\n[both ${role}] Explain why the parts provide an intuitive experience.`);
    assert.ok(editorialFindings([weak]).some(f => f.code === 'author-instruction'));
  }
});

test('shared API explanations may repeat only at the same factual reference location', () => {
 const reference=parse('# Properties\n## disabled\n[both] The disabled state prevents activation and removes the control from the tab sequence.');
 const other={...reference,id:'2.2'};
 assert.deepEqual(editorialFindings([reference,other]),[]);
 const unrelated=parse('# Guidelines\n## disabled\n[both] The disabled state prevents activation and removes the control from the tab sequence.');
 unrelated.id='2.3';
 assert.ok(editorialFindings([reference,unrelated]).some(f=>f.code==='repeated-sentence'));
});

test('review provenance is caught on both surfaces and in supporting copy', () => {
  const notes = parse('# Summary\n[figma] The user’s correction excludes green surfaces.\n[web] This build does not establish accessibility conformance.\n# Examples\n## Decision\n[both caption] Neither scenario establishes a shipped product screen.\n# Accessibility\n[both item] These code paths are not a completed screen-reader certification.');
  const findings = editorialFindings([notes]).filter(f => f.code === 'review-provenance');
  assert.equal(findings.length, 6);
  assert.deepEqual(new Set(findings.map(f => f.surface)), new Set(['figma', 'web']));
});

test('direct limitations, technical requirements and contributor procedures remain valid', () => {
  const useful = parse('# Summary\n[both] Color supports Dark.\n# Guidelines\n## Keyboard selection\n[both] Arrow keys select the adjacent radio; the focus ring and checked dot can appear together.\n## Validation\n[both] Supply validation rules in the application and associate the correction message with its control.\n# For developers\n## Rebuild after a source change\n[web] Export the approved values and rebuild the package before adopting the update.\n# Properties\n## aria-describedby\n[web] Identifies the supporting message; it does not supply the control’s accessible name.');
  assert.deepEqual(editorialFindings([useful]), []);
  assert.deepEqual(editorialFindings([parse('# Guidelines\n## Grouping\n[both] This example establishes a relationship between a label and its associated control.\n# Properties\n## onComplete\n[web] A complete value is not a completed transaction; use the response status to confirm acceptance.')]), []);
  assert.deepEqual(editorialFindings([parse('# Guidelines\n## Correcting a value\n[both] Preserve the user’s correction while the field validates so an error response does not erase the new entry.')]), []);
});
