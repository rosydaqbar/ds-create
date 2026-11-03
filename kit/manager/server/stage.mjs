// What Builder needs to draw and build every Part except Button: the system's tokens as CSS for the drawing
// stage, and the tokens a builder control can choose, with their values for the picker chips.
import {paintCss, resolver} from '../parts/kit.mjs';
import {toTokenExport} from '../foundations/export.mjs';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

// The site's token rules: next to this server in a session's Builder copy (cli.mjs copies them), or in the repo.
const rules = ['../web/scripts/token-model.mjs', '../../web/scripts/token-model.mjs'].map(p => new URL(p, import.meta.url)).find(u => existsSync(fileURLToPath(u)));
const {stageCss} = await import(rules);

// The kind of a token decides which picker a slot opens and what a choice may replace.
export function kindOf(name, draft, parts = {}) {
  if (draft.textStyles.some(t => t.name === name)) return 'text';
  if (draft.effectStyles.some(e => e.name === name)) return 'effect';
  if ((draft.paintStyles || []).some(p => p.name === name)) return 'paint';
  const v = draft.variables.find(x => x.name === name) || Object.values(parts).flatMap(p => p.tokens || []).find(t => t.name === name);
  if (!v || v.collection === 'Primitives') return null;
  return v.type === 'COLOR' ? 'color' : 'number';
}

// Picker choices: foundation roles only (primitives stay hidden), each with the value the chip shows.
export function stageOptions(draft) {
  const r = resolver(draft);
  const shadow = e => e.effects.map(x => `${x.offset?.x ?? x.x ?? 0}px ${x.offset?.y ?? x.y ?? 0}px ${x.radius ?? x.blur ?? 0}px ${x.spread ?? 0}px ${x.color?.alias ? r.color(x.color.alias) : 'transparent'}`).join(', ');
  const roles = draft.variables.filter(v => v.collection !== 'Primitives');
  return {
    color: roles.filter(v => v.type === 'COLOR').map(v => ({name: v.name, value: r.color(v.name)})),
    number: roles.filter(v => v.type === 'FLOAT').map(v => ({name: v.name, value: r.value(v.name)})),
    text: draft.textStyles.map(t => ({name: t.name, value: {fontFamily: t.fontFamily, fontSize: t.fontSize, lineHeight: t.lineHeight?.value ?? t.lineHeight ?? null, fontStyle: t.fontStyle}})),
    effect: draft.effectStyles.map(e => ({name: e.name, value: shadow(e)})),
    // A gradient chip shows its stops resolved to colors, so it draws outside the stage's CSS variables too.
    paint: (draft.paintStyles || []).map(g => ({name: g.name, value: paintCss(draft, g.name, r)})),
  };
}

// The system's tokens under .ds-stage, from the same local export the site builds from.
export function stageStyles(draft, parts) {
  return stageCss(toTokenExport(draft, parts), '.ds-stage', {dark: draft.collections.some(c => c.modes.includes('Dark'))});
}
