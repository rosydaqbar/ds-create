import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('shipped Builder CSS reveals native checked and mixed checkbox marks from SSR-escaped classes', async () => {
  const html = await readFile(new URL('../manager/index.html', import.meta.url), 'utf8');
  const css = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
  assert.ok(css, 'Builder must ship its compiled component CSS');
  assert.ok(html.includes('[.peer:checked~*_&amp;]:opacity-100'), 'fixture uses the actual SSR checkbox mark');
  // Without decoding &amp; before compilation, the checkbox fills but its mark stays invisible.
  assert.match(css, /\.peer:checked~\*[^}]+\{opacity:1\}/);
  assert.match(css, /\.peer:checked~\*[^}]+scale:var\(--tw-scale-x\)/);
  assert.match(css, /\.peer:indeterminate~\*[^}]+\{opacity:1\}/);
  assert.ok(!css.includes('&amp;'), 'HTML entities must never become CSS selector names');
});
