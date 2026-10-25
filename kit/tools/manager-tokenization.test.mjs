import test from 'node:test';
import assert from 'node:assert/strict';
import { tokenizationPreview } from '../manager/setup-options.mjs';
import { renderTokenizationPreview } from '../manager/setup.mjs';

test('tokenization follows each explicit Web/App platform and keeps Tablet/Other context-dependent', () => {
  for (const device of ['Responsive web', 'Desktop web', 'Mobile web'])
    assert.deepEqual(tokenizationPreview([device]), {product:'web', web:true, app:false, needsContext:false});
  for (const device of ['iOS', 'Android', 'Desktop app'])
    assert.deepEqual(tokenizationPreview([device]), {product:'app', web:false, app:true, needsContext:false});
  for (const device of ['Tablet', 'Other'])
    assert.deepEqual(tokenizationPreview([device]), {product:null, web:false, app:false, needsContext:true});
  assert.equal(tokenizationPreview(['Android', 'Mobile web']).product, 'both');
  assert.equal(tokenizationPreview(['Responsive web', 'Responsive web']).product, 'web');
  assert.deepEqual(tokenizationPreview([]), {product:null, web:false, app:false, needsContext:false});
});

test('live view clears stale formats through Web → App → mixed → empty → ambiguous selections', () => {
  const nodes = Object.fromEntries(['web','app','divider','empty','context','status'].map(id =>
    [`#setup-tokenization-${id}`, {hidden:false, textContent:''}]));
  const root = {querySelector: selector => {
    assert.ok(nodes[selector], `Unknown view node ${selector}`);
    return nodes[selector];
  }};
  const visible = () => Object.entries(nodes).filter(([key, node]) => !key.endsWith('status') && !node.hidden)
    .map(([key]) => key.replace('#setup-tokenization-', ''));
  renderTokenizationPreview(root, ['Responsive web']);
  assert.deepEqual(visible(), ['web']);
  assert.equal(nodes['#setup-tokenization-status'].textContent, 'Token formats: Tailwind.');
  renderTokenizationPreview(root, ['iOS']);
  assert.deepEqual(visible(), ['app']);
  assert.equal(nodes['#setup-tokenization-status'].textContent, 'Token formats: React Native, Swift, Kotlin.');
  renderTokenizationPreview(root, ['Android','Desktop web']);
  assert.deepEqual(visible(), ['web','app','divider']);
  renderTokenizationPreview(root, []);
  assert.deepEqual(visible(), ['empty']);
  renderTokenizationPreview(root, ['Tablet']);
  assert.deepEqual(visible(), ['context']);
  renderTokenizationPreview(root, ['Tablet','Mobile web']);
  assert.deepEqual(visible(), ['web','context']);
  assert.match(nodes['#setup-tokenization-status'].textContent, /Additional formats follow/);
});
