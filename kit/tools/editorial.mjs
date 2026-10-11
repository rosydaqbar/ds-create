// Editorial checks for the existing copy/manifest pipeline. This is not a prose generator.
import fs from 'node:fs';
import path from 'node:path';

export const GOALS = ['definition', 'structure', 'specification', 'application', 'behavior', 'accessibility'];
export const REVIEWS = ['specificity', 'redundancy', 'information', 'accuracy', 'practicality', 'writing', 'depth'];
const normalized = (s) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const words = (s) => new Set(normalized(s).split(' ').filter((w) => w.length > 3));
const overlap = (a, b) => {
  const x = words(a), y = words(b);
  return [...x].filter((w) => y.has(w)).length / Math.max(1, Math.min(x.size, y.size));
};
// Narrow signals of an author's investigation reaching published copy. These
// deliberately leave direct limitations and contributor procedures to context.
const REVIEW_PROVENANCE = [
  /\bthe user[’']s correction (?:excludes|requires|overrides|supersedes)\b/i,
  /\b(?:this|the) (?:source inspection|build|specimen|page|cover|deck)\b[^.!?]*(?:does not (?:establish|prove)|is not (?:evidence|proof))|\bsupplied (?:source|deck)\b[^.!?]*does not (?:establish|prove)/i,
  /\b(?:neither|this|that) (?:scenario|example)\b[^.!?]*\b(?:establishes?|proves?)\b[^.!?]*\b(?:shipped|implemented|product screen)\b/i,
  /\bnot a completed [^.!?]*certification\b|\bdoes not establish (?:full conformance|accessibility conformance|native parity)\b|\bno [^.!?]{0,35}(?:behavior|behaviour) is established\b/i,
];

/** All reader-visible writing is in scope, including examples and accessibility lists. */
export function prose(copy, surface) {
  return copy.sections.flatMap((s) => [s, ...s.items].flatMap((t) =>
    t.lines.filter((l) => l.surface === 'both' || l.surface === surface)
      .map((l) => ({ text: l.text, role: l.role, location: `${s.name}${t === s ? '' : ' / ' + t.title}` }))));
}

/** Heuristics are review signals, not proof of semantic quality. Never ban a heading on its own. */
export function editorialFindings(copies) {
  const findings = [];
  for (const surface of ['figma', 'web']) {
    const seen = new Map();
    for (const copy of copies) {
      const paragraphs = prose(copy, surface);
      paragraphs.forEach((p, i) => {
        const sentences = p.text.split(/(?<=[.!?])\s+/);
        for (const sentence of sentences) {
          const n = normalized(sentence);
          if (n.split(' ').length < 12) continue;
          const prior = seen.get(n);
          // Shared APIs can truthfully have the same property description. This is
          // not permission to reuse introductions or unrelated reference entries.
          const sharedReference = prior && prior.page !== copy.id && prior.location === p.location && /^(Properties|Anatomy) \/ /.test(p.location);
          if (prior && !sharedReference) findings.push({ code: 'repeated-sentence', surface, page: copy.id, location: p.location, message: `Repeats ${prior.page} / ${prior.location}: ${sentence}` });
          else if (!prior) seen.set(n, { page: copy.id, location: p.location });
        }
        const previous = paragraphs[i - 1];
        if (previous && words(p.text).size >= 12 && words(previous.text).size >= 12 && (overlap(p.text, previous.text) >= 0.8 || (previous.location === 'Summary' && /\/ How .+ works$/.test(p.location) && overlap(p.text, previous.text) >= 0.35))) {
          findings.push({ code: 'adjacent-overlap', surface, page: copy.id, location: p.location, message: `Review overlap with ${previous.location}; merge it or add a different decision.` });
        }
        if (/\b(?:carries the brand|sets (?:the |the visual |a consistent )?rhythm|creates visual harmony|delivers a seamless experience|enhances overall usability|closer means related)\b/i.test(p.text)) {
          findings.push({ code: 'abstract-guidance', surface, page: copy.id, location: p.location, message: 'Replace the abstract benefit or slogan with a concrete relationship or decision.' });
        }
        if (/^(?:Explain (?:why|how)|Create an? (?:annotated |button|diagram|example)|This section is mandatory|Modules? §|Only when the brand uses)|\bVisual:|\bModules? §/i.test(p.text)) {
          findings.push({ code: 'author-instruction', surface, page: copy.id, location: p.location, message: 'Authoring instructions reached the documentation; write the actual guidance.' });
        }
        // Flag explicit author/review provenance, not technical language or a
        // useful limitation (e.g. supported modes or application responsibilities).
        // Maintenance placement still needs audience-aware editorial review.
        if (REVIEW_PROVENANCE.some((pattern) => pattern.test(p.text))) {
          findings.push({ code: 'review-provenance', surface, page: copy.id, location: p.location, message: 'Review evidence and author history belong in the internal plan/report. State the reader-relevant rule or limitation directly.' });
        }
      });
    }
  }
  return findings;
}

/** Validate the author's pre-draft plan against real copy locations and source excerpts.
 * Six goals are internal coverage, never required headings. Missing facts remain review gaps.
 */
export function validatePlan(plan, copy, root) {
  const errors = [];
  const error = (s) => errors.push(`${copy.id}: ${s}`);
  if (plan.version !== 1 || plan.page !== copy.page) error('editorial plan version/page does not match the copy');
  if (typeof plan.kind !== 'string' || !plan.kind.trim()) error('plan needs a subject description');
  if (!plan.distinctions?.length || plan.distinctions.some((s) => typeof s !== 'string' || !s.trim())) error('identify the subject-specific relationships before drafting');
  const facts = new Map();
  for (const e of plan.evidence || []) {
    if (!e.id || facts.has(e.id)) { error('evidence IDs must be unique and nonempty'); continue; }
    facts.set(e.id, e);
    if (!['verified', 'rule', 'guidance', 'missing'].includes(e.kind)) error(`${e.id}: invalid evidence kind`);
    if (!e.statement?.trim()) error(`${e.id}: evidence needs a statement or missing-information question`);
    if (['verified', 'rule'].includes(e.kind)) {
      const file = path.resolve(root, e.source || '');
      const relative = path.relative(root, file);
      if (relative.startsWith('..' + path.sep) || path.isAbsolute(relative) || !e.source || !fs.existsSync(file) || !fs.statSync(file).isFile()) error(`${e.id}: source must be an existing project file`);
      else if (!e.quote?.trim() || !fs.readFileSync(file, 'utf8').includes(e.quote)) error(`${e.id}: source excerpt is missing or stale`);
    }
  }
  const decisions = new Set();
  for (const d of plan.decisions || []) {
    if (!d.id || decisions.has(d.id) || !d.question?.trim()) error('reader decisions need unique IDs and concrete questions');
    decisions.add(d.id);
  }
  if (!decisions.size) error('plan has no reader decisions');
  const locations = new Map(copy.sections.flatMap((s) => [[s.name, s], ...s.items.map((t) => [`${s.name} / ${t.title}`, t])]));
  const used = new Set(), covered = new Set();
  for (const s of plan.sections || []) {
    const target = locations.get(s.location);
    if (!target || (!target.lines.length && !target.items?.length)) error(`planned location has no content: ${s.location}`);
    if (used.has(s.location)) error(`duplicate plan location: ${s.location}`);
    used.add(s.location);
    if (!s.purpose?.trim()) error(`${s.location}: needs a distinct information purpose`);
    for (const g of s.goals || []) { if (!GOALS.includes(g)) error(`unknown coverage goal: ${g}`); else covered.add(g); }
    for (const id of s.evidence || []) {
      if (!facts.has(id)) error(`${s.location}: unknown evidence ${id}`);
      else if (facts.get(id).kind === 'missing') error(`${s.location}: missing information cannot substantiate a claim`);
    }
    for (const id of s.decisions || []) if (!decisions.has(id)) error(`${s.location}: unknown reader decision ${id}`);
    if (s.goals?.includes('specification') && !(s.evidence || []).some((id) => ['verified', 'rule'].includes(facts.get(id)?.kind))) error(`${s.location}: specifications need verified facts or established rules`);
  }
  for (const [location, target] of locations) if (target.lines.length && !used.has(location)) error(`unplanned copy location: ${location}`);
  for (const g of GOALS) if (!covered.has(g) && !plan.notApplicable?.[g]?.trim()) error(`coverage missing: ${g}; document it or explain why it does not apply`);
  for (const g of Object.keys(plan.notApplicable || {})) if (!GOALS.includes(g) || covered.has(g)) error(`invalid not-applicable goal: ${g}`);
  for (const key of REVIEWS) if (!plan.review?.[key]?.trim()) error(`editor review missing: ${key}`);
  return errors;
}
