# Base Components

Base Component pages are not generic component galleries. Each page is a **complete component-family canvas** containing:
- a page-level documentation header;
- a private/unpublished construction zone when the family has shared bases;
- every published component set in that family;
- the full variant matrix rather than a few examples;
- anatomy that preserves the actual nested construction;
- related examples or composed groups when they exist;
- every documentation, note, diagram, example, and guidance item required by that page's own specification.

Page order:

1. Avatars
2. Badges
3. Button groups
4. Buttons
5. Checkboxes
6. Dropdowns
7. Inputs
8. Progress indicators
9. Radio groups
10. Select
11. Sliders
12. Tags
13. Text editors
14. Toggles
15. Tooltips
16. Video players

# 1. Required page header

Every public component-family region starts with a large documentation header containing:

```text
Header
├─ Eyebrow: Base components → <Page>
├─ Page/family title
└─ Supporting description
```

The supporting description must explain:
- what the component is;
- when it is useful;
- any important behavior or content constraint visible in the source system.

Do not replace this with generic copy such as “Used in interfaces.”

If the page contains private construction components, create a separate private header:

```text
_Unpublished base components
These are internal building blocks used to maintain the published component families.

Resources
├─ component-authoring guidance
└─ relevant Figma component guidance
```

The generated documentation must use project-neutral resource labels and must not retain source branding or URLs.

# 2. Private vs public anatomy

Private helpers:
- keep the leading underscore;
- live in the left/private zone;
- are documented as construction dependencies;
- expose only properties required by published families;
- are never presented as user-facing product components.

Published families:
- live in their own public region;
- retain the real nested anatomy;
- use instances of private helpers rather than duplicating their internals.

# 3. Anatomy documentation is mandatory

Every component-family spec must document the actual nesting pattern, not only variant names.

Minimum anatomy documentation:

```text
Component
├─ root layout behavior
├─ primary child frame(s)
├─ optional slots
├─ text/content wrapper
├─ leading/trailing affordances
└─ private helper instances
```

For each important node record:
- Auto Layout direction;
- Hug / Fill / Fixed intent;
- padding relationship;
- gap relationship;
- which child expands;
- which child remains fixed;
- which child is optional;
- which helper/component instance is reused.

Do not flatten composed components into one frame merely because they look simple.

# 4. Matrix completeness

The canvas must show the full component-set matrix.

For every published set:
- preserve all variant axes;
- preserve booleans and instance-swap properties;
- show enough rows/columns to inspect every state and major composition;
- keep destructive/semantic families separated where they are separate component sets;
- keep icon-only families in the same set when that is how the family is structured.

Do not reduce a 200-variant or 600-variant set to 6 showcase cards.

# 5. Documentation density

Component documentation must contain, where relevant:

1. page/family definition;
2. private-base explanation;
3. anatomy;
4. size behavior;
5. variant/property model;
6. state behavior;
7. composition rules;
8. content rules;
9. optical/alignment rules;
10. semantic/destructive rules;
11. examples in use;
12. page-specific notes and documentation;
13. accessibility and interaction guidance where specified;
14. do/don't or misuse guidance where specified;
15. implementation/maintenance guidance where specified;
16. examples/diagrams where specified;
17. QA checks.

The page Markdown file is responsible for specifying these details.

# 6. Measurement rule

Observed dimensions are **reference baselines**, not universal brand limits.

Preserve:
- relative padding;
- relative gaps;
- hierarchy;
- sizing relationships;
- matrix organization.

Allow:
- wider content;
- longer labels;
- larger brand typography;
- extra modes/themes;
- content-driven height growth.

Do not hard-code a page to one absolute size if its content needs to grow.

# 7. Render the complete page specification

Documentation is mandatory, but its **shape is page-specific**.

Do not force all Base Component pages into one universal notes template. For each page:
- read the entire page Markdown file;
- preserve every anatomy rule, content rule, matrix requirement, state rule, example, documentation topic, and QA condition;
- generate those requirements as visible Figma content in the composition defined by the page;
- keep private-helper documentation next to private helpers;
- keep property/state explanations close to the matrices they explain;
- keep examples where the page specification places them;
- use dedicated reading-oriented documentation only when that page actually calls for it.

The generator must not shorten a detailed page spec into “overview + anatomy + accessibility.” That is a summary, not the specification.

# 8. Completion criteria

A Base Component page fails QA when:
- a published component family is missing;
- a private helper was incorrectly published;
- the master anatomy is simplified into a different structure;
- component properties are omitted;
- variant matrices are reduced to samples;
- page-level description is missing;
- page-specific documentation, examples, or notes required by the page spec are missing;
- anatomy is described only conceptually rather than layer-by-layer;
- generated components do not preserve the intended optical/layout relationships.
