export const spacingSteps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 24, 32];
export const densitySteps = [1, 2, 4, 6, 8];
const number = value => Number(value.toFixed(4));

export function spacingScale(baseRem) {
  if (!Number.isFinite(baseRem) || baseRem <= 0) throw new RangeError('Spacing must be a positive rem value.');
  const step = multiple => ({ multiple, rem: number(baseRem * multiple), px: number(baseRem * 16 * multiple) });
  return { base: step(1), scale: spacingSteps.map(step), density: densitySteps.map(step) };
}
