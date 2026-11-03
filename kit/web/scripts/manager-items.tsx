/**
 * Maintainer-only browser bundle for Builder's Part pages (node kit/web/scripts/build-manager-items.mjs).
 * Builder draws each Part with these white-label components and the system's own tokens; its controls build
 * the Part (colors, corners, spacing, type), they never check states like the docs site does.
 */
import { createRoot, type Root } from 'react-dom/client';
import type { ComponentType, ReactNode } from 'react';
import * as components from '../src/components';
import { componentDocs } from '../src/docs/registry';
import { groupOptions } from '../src/docs/stories/3.3-choice-field.doc';

const roots = new Map<Element, Root>();
// A set's name in the part file is its component's name: "Text field" → TextField.
const exportName = (set: string) => set === 'Multi-select' ? 'MultiSelect' : set.replace(/[^A-Za-z0-9 ]/g, '').split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const docOf = (page: string) => componentDocs.find((d) => d.id === page);
// Sets that hold content of their own draw with the docs sample content, as the docs matrices do.
const samples: Record<string, (props: Record<string, unknown>) => Record<string, unknown>> = {
  'Choice group': (p) => { const options = groupOptions((p.type as never) || 'icon'); return { options, 'aria-label': 'Choice group', defaultValue: p.type === 'checkbox' ? [options[0].value] : options[0].value }; },
};

/** The page's props as the part file names them (Figma properties), with the docs' sample defaults. */
export function controls(page: string) {
  return (docOf(page)?.playground?.controls || []).map((c) => ({ name: c.name, figma: c.figma ?? null, type: c.control.type, options: c.control.type === 'select' ? [...c.control.options] : null, default: c.default ?? null }));
}

/** Whether a set has a component to draw. */
export function has(page: string, set: string) {
  return !!docOf(page) && exportName(set) in components;
}

/** Draws one set of a page into an element. The page's main set uses the docs sample content. */
export function render(el: Element, { page, set, props = {} }: { page: string; set: string; props?: Record<string, unknown> }) {
  const doc = docOf(page), name = exportName(set);
  let node: ReactNode;
  if (doc?.playground && doc.exports?.[0] === name) {
    const sample = Object.fromEntries(doc.playground.controls.map((c) => [c.name, c.default]));
    node = doc.playground.render({ ...sample, ...props });
  } else {
    const C = (components as Record<string, ComponentType<Record<string, unknown>>>)[name];
    if (!C) throw new Error(`${set} has no component to draw.`);
    node = <C {...(samples[set]?.(props) || {})} {...props} />;
  }
  let root = roots.get(el);
  if (!root) { root = createRoot(el); roots.set(el, root); }
  root.render(node);
}

/** Releases drawings whose element left the page (Builder re-renders its page as HTML). */
export function sweep() {
  for (const [el, root] of roots) if (!el.isConnected) { root.unmount(); roots.delete(el); }
}
