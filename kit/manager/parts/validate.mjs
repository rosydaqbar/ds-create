// Checks a compiled Part against the contract of its own inputs, so a structure the system changed is held
// to the same rules as the template's default. Every error is one sentence naming the item.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const setPrefix = set => set.toLowerCase().replace(/\s+/g, '-');

export function validatePart(part, template, {draft, parts = {}, inputs = {}} = {}) {
  const errors = [], c = template.contract(inputs), prefix = setPrefix(template.set);
  for (const p of c.properties) {
    const found = (part.properties || []).find(x => x.name === p.name);
    if (!found) errors.push(`Property ${p.name} is missing.`);
    else if (!same(found, p)) errors.push(`Property ${p.name} does not match the spec.`);
  }
  if (part.variantCount !== c.variantCount) errors.push(`${template.set} has ${part.variantCount} variants; the spec has ${c.variantCount}.`);
  const pattern = new RegExp(`^${prefix}/[a-z0-9-]+(/[a-z0-9-]+)*$`);
  const known = new Set([...(draft?.variables || []).map(v => v.name), ...(part.tokens || []).map(t => t.name), ...template.uses.flatMap(u => (parts[u]?.tokens || []).map(t => t.name))]);
  for (const t of part.tokens || []) {
    if (!pattern.test(t.name)) errors.push(`${t.name} does not follow ${prefix}/{role}/{variant}.`);
    for (const v of Object.values(t.values || {})) if (v?.alias && !known.has(v.alias)) errors.push(`${t.name} aliases ${v.alias}, which does not exist.`);
  }
  for (const [tone, ems] of Object.entries(part.treatments || {})) for (const [em, states] of Object.entries(ems)) for (const [state, t] of Object.entries(states))
    for (const field of ['fill', 'text', 'icon']) if (!t?.[field]) errors.push(`${template.set} ${tone}/${em}/${state} has no ${field}.`);
  const names = new Set((part.tokens || []).map(t => t.name));
  for (const n of c.tokens) if (!names.has(n)) errors.push(`Contract token ${n} is missing.`);
  return {valid: !errors.length, errors};
}
