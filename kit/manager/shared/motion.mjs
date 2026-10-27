// Figma native motion values: TIMING is seconds; EASING is a MotionEasing object.
// Legacy recipe inputs and Builder preview controls use milliseconds/CSS strings.
const finite = x => typeof x === 'number' && Number.isFinite(x);
const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
const keys = (x, allowed) => object(x) && Object.keys(x).every(k => allowed.includes(k));
const presets = new Set(['EASE_IN', 'EASE_OUT', 'EASE_IN_AND_OUT', 'LINEAR',
  'EASE_IN_BACK', 'EASE_OUT_BACK', 'EASE_IN_AND_OUT_BACK', 'GENTLE', 'QUICK', 'BOUNCY', 'SLOW', 'HOLD']);
export const validTiming = value => finite(value) && value >= 0;
export function validEasing(value) {
  if (!object(value)) return false;
  if (presets.has(value.type)) return keys(value, ['type']);
  if (value.type === 'CUSTOM_CUBIC_BEZIER') {
    const p = value.easingFunctionCubicBezier;
    return keys(value, ['type', 'easingFunctionCubicBezier']) && keys(p, ['x1', 'y1', 'x2', 'y2']) &&
      ['x1', 'y1', 'x2', 'y2'].every(k => finite(p[k])) && p.x1 >= 0 && p.x1 <= 1 && p.x2 >= 0 && p.x2 <= 1;
  }
  if (value.type === 'CUSTOM_SPRING') {
    const p = value.easingFunctionSpring;
    return keys(value, ['type', 'easingFunctionSpring']) && keys(p, ['bounce']) && finite(p.bounce) && p.bounce >= 0 && p.bounce <= 1;
  }
  return false;
}
export function milliseconds(value) {
  if (typeof value === 'string' && !/^\s*\d+(?:\.\d+)?\s*(?:ms|s)?\s*$/.test(value)) return null;
  if (!['number', 'string'].includes(typeof value)) return null;
  const n = typeof value === 'number' ? value : parseFloat(value) * (value.trim().endsWith('s') && !value.trim().endsWith('ms') ? 1000 : 1);
  return Number.isFinite(n) && n >= 0 && n <= 60000 ? n : null;
}
export function previewTiming(type, value) {
  return type === 'TIMING' ? validTiming(value) ? milliseconds(value * 1000) : null : milliseconds(value);
}
export function easingCurve(value) {
  const keywords = { linear: [0, 0, 1, 1], ease: [.25, .1, .25, 1], 'ease-in': [.42, 0, 1, 1], 'ease-out': [0, 0, .58, 1], 'ease-in-out': [.42, 0, .58, 1] };
  if (object(value)) {
    if (!validEasing(value)) return null;
    if (value.type === 'CUSTOM_CUBIC_BEZIER') {
      const { x1, y1, x2, y2 } = value.easingFunctionCubicBezier;
      return easingCurve([x1, y1, x2, y2].join(','));
    }
    const css = { LINEAR: 'linear', EASE_IN: 'ease-in', EASE_OUT: 'ease-out', EASE_IN_AND_OUT: 'ease-in-out' }[value.type];
    // Springs/back/hold are preserved as native values, never replaced by a guessed curve.
    return css ? easingCurve(css) : null;
  }
  if (typeof value !== 'string') return null;
  const text = value.trim(), pieces = text.replace(/^cubic-bezier\((.*)\)$/, '$1').split(',');
  const points = keywords[text] || (pieces.length === 4 && pieces.every(p => p.trim() && Number.isFinite(Number(p))) ? pieces.map(Number) : null);
  if (!points || points[0] < 0 || points[0] > 1 || points[2] < 0 || points[2] > 1) return null;
  return { points, css: `cubic-bezier(${points.join(', ')})` };
}
export function nativeEasing(value) {
  if (validEasing(value)) return structuredClone(value);
  const curve = easingCurve(value);
  if (!curve) throw new Error('Invalid motion easing recipe. Use a CSS curve or native MotionEasing value.');
  const [x1, y1, x2, y2] = curve.points;
  return { type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1, y1, x2, y2 } };
}
