import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readDefaults, unpinned } from './pin-props.mjs';

function fixture(page) {
  const dir = mkdtempSync(join(tmpdir(), 'ds-pin-props-'));
  mkdirSync(join(dir, 'components'));
  writeFileSync(join(dir, 'components', 'Chip.tsx'), `export function Chip({ size = 'md', tone: t = 'neutral', type = 'button', label = 'Label' }: Props) { return null; }\n`);
  writeFileSync(join(dir, 'page.tsx'), page);
  return dir;
}

test('variant defaults are read from the signature, aliased names included; content and HTML type defaults are not', () => {
  const dir = fixture('');
  try {
    assert.deepEqual(readDefaults(join(dir, 'components')), { Chip: { size: 'md', tone: 'neutral' } });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('only imported components that leave out a defaulted axis are listed; spreads are left alone', () => {
  const dir = fixture(`import { Chip } from '@/components';
export const A = () => (<>
  <Chip label="a" />
  <Chip size="sm" tone="brand" />
  <Chip {...rest} />
  <Chip size="lg">x</Chip>
</>);
`);
  try {
    const found = unpinned(join(dir, 'page.tsx'), readDefaults(join(dir, 'components')));
    assert.deepEqual(found.map((u) => u.missing), [{ size: 'md', tone: 'neutral' }, { tone: 'neutral' }]);
    const other = fixture(`function Chip() { return null; }\nexport const B = () => <Chip />;\n`);
    try { assert.deepEqual(unpinned(join(other, 'page.tsx'), { Chip: { size: 'md' } }), []); } finally { rmSync(other, { recursive: true, force: true }); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
