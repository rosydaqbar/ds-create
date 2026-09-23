# Initiator → Generation Decision Logic

This file connects `03-initiator-questionnaire.md` to the rest of the design-system specification.

The questionnaire is not optional pre-reading. Its confirmed answers form the **generation contract**.

Nothing should be created, replaced, renamed, or normalized until the contract has been resolved.

---

# 1. Resolve the initiator before generation

After the user selects **Confirm and generate**, normalize the answers into:

```text
Initiator Contract
├─ Product
├─ Brand
├─ Platforms
├─ Modes
├─ Existing system inventory
├─ Existing-item actions
├─ Build strategy
├─ Foundation scope
├─ Component scope
├─ Token architecture
├─ Token naming preset
├─ Token output formats
├─ Density
├─ Radius direction
├─ Elevation direction
├─ Icon strategy
└─ Documentation depth
```

This contract controls all subsequent files.

---

# 2. Existing-system action model

Every existing foundation or component receives exactly one action:

```text
Keep
Audit
Improve
Refactor
Rebuild
Replace
Skip
```

Every missing item receives:

```text
Build
Skip
```

## Keep

- do not recreate the asset;
- do not rename it;
- do not change its token bindings;
- document it only if documentation is in scope;
- use it as an input dependency for new work.

## Audit

- do not mutate first;
- compare the existing asset against the relevant specification file;
- report gaps by anatomy, properties, states, tokens, resizing, accessibility, documentation, and QA;
- wait for the selected build strategy to determine whether fixes are allowed.

## Improve

- preserve public API wherever possible;
- correct missing states, weak token bindings, accessibility gaps, or documentation;
- avoid unnecessary variant/property changes.

## Refactor

- preserve intended product behavior;
- internal anatomy, token bindings, Auto Layout, and private dependencies may change;
- public component properties may change only when necessary and must be documented.

## Rebuild

- replace the Figma master using the specification;
- migrate reusable existing decisions such as approved brand values;
- do not blindly reproduce structural mistakes.

## Replace

- existing item is intentionally superseded;
- create the new item according to the specification;
- move the superseded item to `99 — ARCHIVE` only after migration is confirmed.

## Build

- create the missing item from the relevant specification file.

## Skip

- do nothing;
- do not create placeholder pages or placeholder components.

---

# 3. Page generation logic

`00-figma-file-architecture.md` defines the canonical page order.

The initiator decides which pages are:

```text
RETAIN
CREATE
AUDIT
UPDATE
REBUILD
SKIP
```

Do not create every canonical page merely because it exists in the architecture document.

### Parent pages

Create or retain:

```text
❖ FOUNDATIONS
❖ COMPONENTS
```

when at least one child in that section is in scope.

Their index must reflect actual status:

```text
Color             KEEP
Typography        AUDIT
Spacing           BUILD
Motion            SKIP
```

---

# 4. Foundation generation logic

For every selected foundation:

1. open its Markdown specification;
2. inspect existing Figma variables/styles/assets when available;
3. apply the action selected in the initiator;
4. use brand answers to resolve brand-dependent values;
5. use platform answers to resolve platform-specific requirements;
6. use mode answers to create only required modes;
7. use the selected token naming preset for actual variable names;
8. create documentation only to the selected documentation depth;
9. run the QA defined by that foundation file.

Do not overwrite approved existing brand values when the action is Keep or Audit.

---

# 5. Component generation logic

For every selected component:

1. resolve its dependencies;
2. inspect an existing master if one exists;
3. apply Keep/Audit/Improve/Refactor/Rebuild/Replace/Build;
4. follow the component Markdown file for anatomy, properties, states, sizing, behavior, accessibility, matrices, and QA;
5. map logical token roles through the selected token naming preset;
6. use the selected density/radius/elevation/icon decisions;
7. preserve existing public component APIs when the selected action requires preservation.

A missing component is not automatically generated unless:

- the user explicitly selected it; or
- the Build Strategy is `Detect missing pieces and recommend what to build`, the user accepted it; or
- the Build Strategy is `Complete the entire system`.

---

# 6. Token naming integration

Component and foundation Markdown files use **logical token roles**.

Example logical roles:

```text
text.primary
surface.default
button.strong.surface.hover
space.component.control.inline.md
```

These are specification references, not a forced output syntax.

The selected preset in `03-initiator-questionnaire.md` determines the actual token name written into Figma/code.

Example logical role:

```text
button strong background hover
```

Possible outputs:

```text
Existing system       → inferred from current library
ADS-style             → color.background.brand.hovered or mapped component equivalent
Tailwind-style        → project-defined utility/theme token mapping
Material-style        → component/system token hierarchy
Ant-style             → camelCase alias/component token
Spectrum-style        → flat descriptive token
```

Never rename an established existing token merely to fit another preset when the user selected **Keep Existing Naming**.

---

# 7. Brand integration

The system is structurally brand-agnostic, but confirmed brand answers resolve:

```text
Brand palette
Neutral character
Typeface
Radius mapping
Elevation character
Icon family
Motion personality
Imagery rules
Brand assets
```

These values flow through Foundation tokens and styles.

Do not encode them as structural component differences unless the product requirement genuinely changes anatomy or behavior.

---

# 8. Product integration

Product answers determine:

- which components are necessary;
- whether density should be compact/comfortable/spacious;
- form complexity;
- data-density requirements;
- responsive constraints;
- touch vs pointer requirements;
- navigation assumptions;
- content length stress cases;
- platform-specific behavior.

Do not generate irrelevant components solely for completeness.

---

# 9. Documentation-depth integration

If the user selects only a subset of documentation topics, component documentation frames include only those sections.

Possible sections:

```text
Anatomy
Layer hierarchy
Auto Layout
Resizing
Component properties
Variants
States
Token bindings
Accessibility
Interaction
Responsive behavior
Content rules
Edge cases
Do / Don't
QA matrices
Developer notes
```

The component specification files remain complete; only the generated Figma documentation is scoped.

---

# 10. Confirmation summary becomes build manifest

The final confirmed questionnaire summary must be copied into:

`00 — START / Generation manifest`

The manifest records:

```text
Product
Brand
Platforms
Modes
Build strategy
Existing-system actions
Foundations in scope
Components in scope
Token architecture
Token naming
Output formats
Visual-system decisions
Documentation depth
```

This makes every generated decision traceable.

---

# 11. Generation order

Use this order after confirmation:

```text
1. Inspect existing system
2. Resolve Keep/Audit/Build actions
3. Resolve token naming preset
4. Resolve brand/platform modes
5. Build or update required Foundations
6. Validate Foundations
7. Build or update selected Components
8. Validate Components
9. Build documentation frames
10. Build matrices / QA specimens
11. Update parent-page indexes
12. Write generation manifest
13. Final QA
```

Do not begin component generation before required Foundations are valid.

---

# 12. No-answer rule

If an unanswered initiator question materially changes structure or implementation, ask for it.

If it changes only a cosmetic default and the user selected `Not sure`, use the package scaffold default and mark that choice in the generation manifest.

Never silently invent:

- an established brand palette;
- a typeface;
- an existing token convention;
- a required platform;
- a multi-brand architecture;
- components the user did not ask for.