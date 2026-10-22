export const rounded = value => Math.round(value * 10000) / 10000;
export function radiusBase(rows) {
  return rows.find(v => ['radius/control', 'radius/lg'].includes(v.name) && v.value > 0)?.value || rows.find(v => v.value > 0 && v.value < 999)?.value || 8;
}
export function deriveRadii(rows, rem) {
  if (!Number.isFinite(rem) || rem < 0 || rem > 8) throw new RangeError('Radius must be between 0 and 8rem.');
  const base = radiusBase(rows);
  return rows.map(row => ({ ...row, value: row.value === 0 || row.value >= 999 ? row.value : rounded(row.value / base * rem * 16) }));
}
export function colorOpacity(color) {
  if (typeof color !== 'string') return 100;
  if (/^#[\da-f]{8}$/i.test(color)) return parseInt(color.slice(7), 16) / 255 * 100;
  if (/^#[\da-f]{4}$/i.test(color)) return parseInt(color[4], 16) / 15 * 100;
  const alpha = color.match(/\/\s*([\d.]+%?)\s*\)$/)?.[1] || (color.split(',').length === 4 ? color.match(/^rgba?\([^)]*,\s*([\d.]+)\s*\)$/i)?.[1] : null);
  return alpha ? Number.parseFloat(alpha) * (alpha.endsWith('%') ? 1 : 100) : 100;
}
export function opaqueColor(color) {
  if (/^#[\da-f]{8}$/i.test(color)) return color.slice(0, 7);
  if (/^#[\da-f]{4}$/i.test(color)) return color.slice(0, 4);
  if (color.includes('/')) return color.replace(/\/[^)]+\)$/, ')');
  if (/^rgba?\(/i.test(color) && color.split(',').length === 4) return color.replace(/,\s*[^,]+\)$/, ')').replace(/^rgba/i, 'rgb');
  return color;
}
export const isShadow = effect => ['DROP_SHADOW', 'INNER_SHADOW'].includes(effect.type);
export function shadowSeed(style, resolve) {
  const e = style?.effects?.find(isShadow);
  if (!e) return null;
  if (typeof (e.color?.alias || e.color) !== 'string' || typeof resolve(e.color) !== 'string') return null;
  return { x: e.x || 0, y: e.y || 0, blur: e.blur || 0, spread: e.spread || 0, color: e.color?.alias || e.color, opacity: colorOpacity(resolve(e.color)) };
}
export function deriveShadows(effects, original, seed, resolve) {
  return effects.filter(isShadow).map(e => ({ ...structuredClone(e),
    ...Object.fromEntries(['x', 'y', 'blur', 'spread'].map(key => [key, rounded(original[key] ? (e[key] || 0) * seed[key] / original[key] : (e[key] || 0) + seed[key])])),
    color: seed.color === original.color ? structuredClone(e.color) : seed.color.startsWith('color/') ? { alias: seed.color } : seed.color,
    opacity: Math.min(100, Math.max(0, colorOpacity(resolve(e.color)) * seed.opacity / (original.opacity || 100))),
  }));
}
export function shadowCSS(effects, resolve) {
  return effects.filter(isShadow).map(e => {
    const dimensions = [e.x ?? 0, e.y ?? 0, e.blur ?? 0, e.spread ?? 0];
    const color = resolve(e.color);
    if (!dimensions.every(Number.isFinite) || dimensions[2] < 0 || typeof color !== 'string' || !color) return '';
    const ink = Number.isFinite(e.opacity) ? `color-mix(in srgb, ${opaqueColor(color)} ${Math.min(100, Math.max(0, e.opacity))}%, transparent)` : color;
    return `${e.type === 'INNER_SHADOW' ? 'inset ' : ''}${dimensions.map(n => `${n}px`).join(' ')} ${ink}`;
  }).filter(Boolean).join(', ') || 'none';
}
