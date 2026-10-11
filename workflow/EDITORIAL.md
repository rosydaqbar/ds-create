# Guideline planning and editing

These editorial standards apply to every documentation subject: guidance, foundations, Parts, Components, Sections, Layouts, Screens, implementation references and subjects added later. Category, complexity, platform, engine and the presence of a saved plan never exempt content from review. This is the planning step of the existing agent writer, before `workflow/COPY.md` drafting and either drawing engine. There is no separate model endpoint or second writer. Preserve the copy-file grammar, frame/tab contracts, computed references, set snapshots and platform integrations.

## Examine, establish evidence, decide, organize

1. Identify the subject and its distinguishing relationships. Determine what the subject owns, what it depends on, what it changes, and what readers must decide. Use the available information to identify its distinguishing relationships. Do not start by choosing a reusable essay outline.
2. Read the current system inputs and standing rules, the subject spec, its knowledge topics, relevant token export, set snapshots and implementation. Record source paths and exact excerpts for technical facts and established rules. Label general guidance and illustrative scenarios as such. Record unknowns separately; a spec requirement is not proof of implemented behavior. When sources conflict, identify the conflict and the source used before drafting.
3. Write the decisions the reader needs to make: which treatment, which role, which composition, which constraints, what changes with state, and what to verify. Only applicable questions belong in the plan.
4. Group those decisions and related reference material into a reading sequence. Each location needs a different information purpose. Cover definition, structure, specification, application, relevant behavior/adaptation, and accessibility/validation. A goal may be covered by prose and an existing reference together; a genuinely irrelevant goal has an explicit reason. Missing facts are gaps, not a reason to fabricate coverage.
5. Save the plan before prose. Then draft the existing copy file and manifest/story. Use subject-specific topics; do not turn coverage goal names into mandatory headings. Keep outer frame names and tabs unchanged. The default manifest is editable data, not a required prose outline.

## Plan format

Path: `output/{slug}/plans/{id}-{name}.json`, matching the copy filename. References below are schematic; replace them with real files and excerpts, never copy example facts.

```json
{
  "version": 1,
  "page": "2.1 Button",
  "kind": "component",
  "distinctions": ["Action emphasis and consequence are separate decisions"],
  "evidence": [
    {"id": "control", "kind": "verified", "statement": "The implemented treatments", "source": "output/{slug}/web/src/components/parts/Button.tsx", "quote": "exact excerpt from that file"},
    {"id": "recommendation", "kind": "guidance", "statement": "Illustrative decision advice, not a new implementation rule"},
    {"id": "gap", "kind": "missing", "statement": "Which screen-reader combinations have been tested?"}
  ],
  "decisions": [{"id": "priority", "question": "Which nearby action needs the strongest emphasis?"}],
  "sections": [
    {"location": "Summary", "purpose": "Establish the control's scope", "goals": ["definition"], "evidence": ["control"], "decisions": []},
    {"location": "Guidelines / Choosing emphasis", "purpose": "Compare treatments in a decision scenario", "goals": ["application"], "evidence": ["control", "recommendation"], "decisions": ["priority"]}
  ],
  "notApplicable": {},
  "review": {
    "specificity": "Record what makes the draft subject-specific.",
    "redundancy": "Record what was merged/removed after comparing adjacent sections.",
    "information": "Explain the new information each section contributes.",
    "accuracy": "Record source checks and unresolved gaps.",
    "practicality": "Record decisions clarified by examples.",
    "writing": "Record the prose edit, including instruction leaks and slogans removed.",
    "depth": "Explain why the reference and narrative depth fit this subject."
  }
}
```

The example is incomplete on purpose: the validator will require the remaining applicable goals and actual evidence. Use `kind: rule` with a source/excerpt for an established project rule. Only verified/rule evidence substantiates a specification. A source excerpt is traceability, not automatic proof that a paraphrase is true; the writer must compare its claims with the source. Plans are internal and never rendered into product docs.

## Draft by information type

- Use connected prose for relationships, rationale and decisions. A short overview does not replace the complete guideline. Paragraph depth follows complexity and evidence; there is no page-wide word quota.
- Group related specifications in the appropriate reference tables or specimens. Explain how to choose them once. Separate naming/implementation reference when it answers a different question.
- Use examples that discriminate between choices. Mark hypothetical product scenarios as examples; do not imply that a roadmap workflow or untested interaction exists.
- Use diagrams for actual anatomy, alias chains or state relationships. Preserve existing component/token-driven visuals instead of drawing unsupported structures.
- Use lists for parallel alternatives or procedures and paired do/don't examples for a meaningful contrast. Neither is obligatory.
- Keep standards, implementation claims and test evidence distinct. “Should expose a name” is a requirement; an attribute in code is implementation evidence; passing a token contrast check is not WCAG conformance.

## Edit before returning output

Compare the introduction with the next section, adjacent paragraphs, and prose with its tables/lists. Merge duplicate mechanisms; use the recovered space for a different decision or remove it. Renaming “How … works” while keeping a repeated explanation fails this review.

Review accuracy, completeness, specificity, usefulness, clarity, naturalness, organization and appropriate depth. Check subject-name substitution, information value, factual support and reader decisions. A complete document explains the relevant objectives; irrelevant objectives are excluded with a reason. It does not need a heading, example, diagram or paragraph for each objective. Remove marketing benefits, mini-slogans, copied author instructions, duplicated assignments and invented behaviors. Do not force definition → purpose → benefit → example into every paragraph. Do not vary precise terminology just to sound different.

Run `node kit/tools/copy-guard.mjs --slug {slug} --pages {ids} --editorial`, then the existing parser/packer and build. Revise failures and recheck the whole document. The guard checks plan coverage/locations, source excerpts, repeated sentences, nearby lexical overlap and some abstract phrasing. These checks cannot determine all semantic repetition, justify a claim, or replace editorial review. Investigate overlap findings rather than gaming word choices.

For a writer change, evaluate the full existing documentation inventory, not a named example list. Review both surfaces and all prose-bearing slots, including summaries, example captions, anatomy, properties, code explanations, guidance, shared renderer text and references. Retain accurate material that already meets the standard; revise weak content in place. Test varied foundations and controls plus subjects absent from the teaching examples, composite regions, implementation guidance and future category names. Do not fabricate unbuilt product features to cover a category. Use source-backed test fixtures for categories not implemented in the current project and clearly label those fixtures. Archive before/after output and run the real parser, packer and renderer. Test legacy input as well as revised copy; missing metadata must not bypass quality checks or require identical visible headings.

The examples in writing instructions teach progression, specificity, decisions, responsibility and source accuracy. They are not a preferred subject list, an outline or sentence patterns to repeat. Never import their names or values as project specifications.
