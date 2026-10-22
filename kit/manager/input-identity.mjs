const validSlug = value => typeof value === 'string' && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value) && new TextEncoder().encode(value).length <= 240;

export function projectInputSlug(name) {
  const normalized = name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-');
  const slug = Array.from(normalized).slice(0, 60).join('').replace(/^-+|-+$/g, '');
  if (!validSlug(slug)) throw new Error('Use at least one letter or number in the project name to name its input folder.');
  return slug;
}

// Web sessions have a named input tree and a separate stable output/session ID.
// Older sessions and chat-led systems keep their existing folder mapping.
export function selectedInputSlug(setup, sessionSlug) {
  const slug = setup?.inputSlug ?? sessionSlug;
  if (!validSlug(slug)) throw new Error('Invalid input folder identity.');
  return slug;
}
