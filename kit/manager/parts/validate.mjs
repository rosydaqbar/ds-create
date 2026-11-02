// Checks a compiled Part against the contract of its own inputs, so a structure the system changed is held
// to the same rules as the template's default. Every error is one sentence naming the item.
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export const setPrefix = set => set.toLowerCase().replace(/\s+/g, '-');

export function validatePart(part, template, {draft, parts = {}, inputs = {}} = {}) {
  const errors = [], c = template.contract(inputs);
  // Button-shaped Parts have one set at the top level; other Parts list every set, private ones included.
  const want = c.sets || [{name: template.set, properties: c.properties, variantCount: c.variantCount}];
  const have = part.sets || [{name: template.set, properties: part.properties, variantCount: part.variantCount}];
  for (const s of want) {
    const got = have.find(x => x.name === s.name);
    if (!got) { errors.push(`${s.name} is missing.`); continue; }
    const label = name => want.length > 1 ? `${s.name} property ${name}` : `Property ${name}`;
    for (const p of s.properties) {
      const found = (got.properties || []).find(x => x.name === p.name);
      if (!found) errors.push(`${label(p.name)} is missing.`);
      else if (!same(found, p)) errors.push(`${label(p.name)} does not match the spec.`);
    }
    if (got.variantCount !== s.variantCount) errors.push(`${s.name} has ${got.variantCount} variants; the spec has ${s.variantCount}.`);
  }
  const prefixes = [...new Set([template.set, ...want.map(s => s.name)].map(setPrefix))];
  const pattern = new RegExp(`^(${prefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})/[a-z0-9-]+(/[a-z0-9-]+)*$`);
  const variables = new Set([...(draft?.variables || []).map(v => v.name), ...(part.tokens || []).map(t => t.name), ...template.uses.flatMap(u => (parts[u]?.tokens || []).map(t => t.name))]);
  const known = new Set([...variables, ...(draft?.textStyles || []).map(t => t.name), ...(draft?.effectStyles || []).map(e => e.name)]);
  for (const t of part.tokens || []) {
    if (!pattern.test(t.name)) errors.push(`${t.name} does not follow ${prefixes[0]}/{role}/{variant}.`);
    for (const v of Object.values(t.values || {})) if (v?.alias && !variables.has(v.alias)) errors.push(`${t.name} aliases ${v.alias}, which does not exist.`);
  }
  for (const [tone, ems] of Object.entries(part.treatments || {})) for (const [em, states] of Object.entries(ems)) for (const [state, t] of Object.entries(states))
    for (const field of ['fill', 'text', 'icon']) if (!t?.[field]) errors.push(`${template.set} ${tone}/${em}/${state} has no ${field}.`);
  for (const r of c.rows || []) if (!part.map?.[r.set]?.[r.key]) errors.push(`${r.set} ${r.key} has no token map.`);
  for (const [area, sets] of [['map', part.map], ['measures', part.measures]]) for (const [set, rows] of Object.entries(sets || {})) for (const [key, slots] of Object.entries(rows || {})) for (const [slot, token] of Object.entries(slots || {}))
    if (typeof token === 'string' && !known.has(token)) errors.push(`${set} ${key} ${slot} uses ${token}, which does not exist.`);
  // Every instance names a Part the template uses (or a set on its own page) and a variant that set has.
  const setsOf = p => p ? p.sets || [{name: p.set, properties: p.properties}] : [];
  for (const r of c.instanceRows || []) if (!part.instances?.[r.set]?.[r.key]) errors.push(`${r.set} ${r.key} has no instances.`);
  for (const [set, rows] of Object.entries(part.instances || {})) for (const [key, slots] of Object.entries(rows || {})) for (const [slot, i] of Object.entries(slots || {})) {
    const where = `${set} ${key} ${slot}`, own = i.part === template.id, used = own ? part : parts[i.part];
    if (!own && !template.uses.includes(i.part)) { errors.push(`${where} uses ${i.part}, which ${template.name} does not list in uses.`); continue; }
    const target = setsOf(used).find(x => x.name === i.set), owner = own ? template.name : used?.name || i.part;
    if (!target) { errors.push(`${where} uses ${i.set || i.part}, which ${owner} does not have.`); continue; }
    for (const [prop, value] of Object.entries(i.variant || {})) {
      const p = target.properties.find(x => x.name === prop && x.type === 'variant');
      if (!p || !p.values.includes(value)) errors.push(`${where} uses ${i.set} ${prop}=${value}, which ${owner} does not have.`);
    }
  }
  const names = new Set((part.tokens || []).map(t => t.name));
  for (const n of c.tokens) if (!names.has(n)) errors.push(`Contract token ${n} is missing.`);
  return {valid: !errors.length, errors};
}
