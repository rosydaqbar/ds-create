export const preparedFonts = [
  { family: 'Inter', file: 'inter.ttf' },
  { family: 'Geist', file: 'geist.ttf' },
  { family: 'Plus Jakarta Sans', file: 'plus-jakarta-sans.ttf' },
];

const generic = new Set(['system sans', 'system-ui', 'ui-sans-serif', 'sans-serif', '-apple-system', 'blinkmacsystemfont', 'ui-monospace', 'monospace', 'serif', 'ui-serif']);
export function fontChoices(provided = []) {
  const system = [...new Set(provided.filter(family => typeof family === 'string' && family.trim() &&
    !generic.has(family.split(',')[0].trim().replace(/^['"]|['"]$/g, '').toLowerCase())))];
  return { system, prepared: preparedFonts.map(f => f.family).filter(f => !system.includes(f)), initial: system[0] || preparedFonts[0].family };
}

export const fontStack = family => family.includes(',') ? family : `${JSON.stringify(family)}, sans-serif`;
