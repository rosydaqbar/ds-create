# Variables Guidance

Create all five required Variables documentation sections using the reading-oriented documentation composition from the documentation system.

## 1. Introduction to variables

Must cover:
- what variables are;
- why they are useful;
- modes and dark mode;
- how to open/edit variables;
- updating values globally.

## 2. Variables system overview

Must explain the system goals:
- simplicity;
- accessibility;
- aesthetics;
- scalability.

## 3. Variable naming

Must explain one consistent naming structure and how names communicate hierarchy, purpose, and modifiers.

The actual naming syntax is resolved from the initiator preset; the page explains the selected convention rather than forcing one preset.

## 4. Types of variables

Must cover, as separate sections:
- primitive variables;
- alias/semantic variables;
- component variables;
- utility variables.

Each section should include explanatory text and visual examples.

## 5. Additional notes

Must cover:
- whether variables are mandatory;
- using component variants for themes when appropriate;
- relationship between variables and styles;
- supported properties;
- extended collections;
- modes for sizing and spacing;
- breakpoints;
- solid vs transparent dark-mode shades;
- accessibility/contrast implications;
- how to add/use transparent shades.

Use the reading-oriented documentation composition and do not compress, merge, or summarize these sections into a single FAQ card.

# Notes & Documentation — Variables

Only guidance that directly helps the agnostic builder decide, construct, maintain, or evolve the variable architecture belongs here.

## Decide whether variables are actually needed

Variables add scalability, theming, shared semantics, and closer design-development alignment, but they also add setup and maintenance cost.

Before creating a variable architecture, evaluate:
- whether the product already has variables/tokens;
- whether multiple visual modes are required;
- whether multiple brands or white-label themes exist;
- whether engineering already consumes design tokens;
- whether the team is prepared to maintain aliases and modes;
- whether a simpler style-based system is already working well.

Do not introduce variables only because the feature exists.

If the existing system uses styles successfully and the initiator action is Keep/Audit, preserve that architecture.

### Required visual documentation

Create a decision-flow diagram:

```text
Existing system?
├─ Yes → inspect current token/style architecture
│        ├─ valid → preserve
│        └─ weak/incomplete → improve according to selected action
└─ No
   ├─ multi-mode / multi-brand / code-token requirement → variables recommended
   └─ small/simple single-theme system → styles or lighter token layer may be enough
```

The diagram should be a real documentation frame using cards/connectors, not paragraph text pretending to be a diagram.

## Variables and styles are complementary

Variables store reusable values and aliases.

Styles can package multiple visual properties into a consumable design asset.

A mature system may use:
- primitive variables as the source of truth;
- semantic variables as usage roles;
- text/effect/color styles as consumable bundles that reference those variables where supported.

Do not treat “variables vs styles” as a forced either/or migration.

### Required visual documentation

Create a three-stage relationship diagram:

```text
Primitive variables
        ↓
Semantic variables
        ↓
Styles / Components
```

Also include a side-by-side specimen:
- one element driven by a direct primitive;
- the same element driven through a semantic/style relationship;
- annotation explaining why the second approach scales better.

## Dark mode without variable modes

A product can represent dark mode through separate component/layout variants.

That approach is valid, especially for smaller systems, but it has tradeoffs:
- variant count increases;
- component maintenance grows;
- global theme changes become harder;
- every component must remain synchronized.

Variable modes usually scale better when the entire product needs Light/Dark behavior.

The initiator must not silently force one approach.

### Required visual documentation

Create a side-by-side comparison:

**Variant-based theming**
```text
Component / Light
Component / Dark
```

versus:

**Mode-based theming**
```text
One component
└─ semantic tokens
   ├─ Light mode
   └─ Dark mode
```

Use an actual component/footer/card example so the difference is visible.

## Density modes: use only when they solve a real need

Compact/comfortable/spacious modes should not be created by blindly scaling every spacing token.

A useful density mode changes only the values that genuinely need to change.

For example:
- table row height may compress;
- input/control height may compress;
- large page-section spacing might remain unchanged;
- typography may remain identical;
- touch targets may impose minimums on some platforms.

Do not generate density modes simply because the system supports modes.

### Required visual documentation

Show one component family in:
- Compact;
- Default;
- Spacious.

Annotate which tokens change and which do not.

Do not show three globally scaled screenshots with every spacing value multiplied.

## Breakpoints are not just variable modes

Responsive layouts often change structure rather than only numbers.

Examples:
- horizontal → vertical layout;
- navigation pattern changes;
- controls wrap;
- some spacing values remain stable;
- some type sizes change while others do not;
- whole elements may appear/disappear or move.

A “Mobile / Tablet / Desktop” variable mode must not imply that responsiveness is solved by token switching alone.

### Required visual documentation

Show a responsive component/page example with:
- desktop composition;
- tablet composition;
- mobile composition;
- annotations separating **token changes** from **structural layout changes**.

## Dark-mode neutral strategy: solid vs transparent

The builder may use:
- solid dark-mode neutrals;
- transparent light overlays on dark surfaces;
- a hybrid strategy.

### Solid neutral advantages
- predictable resulting color;
- easier contrast testing;
- explicit hue/saturation control;
- fewer stacking artifacts.

### Transparent-neutral advantages
- can adapt across different dark surfaces;
- can support multiple themes with fewer raw values.

### Transparent-neutral risks
- actual resulting color depends on background;
- contrast changes by context;
- layered surfaces/borders can accumulate opacity;
- complex tables/menus/cards may reveal blending artifacts.

Preserve an existing strategy when valid. For greenfield systems, choose intentionally and document the reason.

### Required visual documentation

Include all of these visual modules:

1. **Solid dark-mode palette**
   - same semantic roles rendered with solid primitives.

2. **Transparent dark-mode palette**
   - same semantic roles rendered with alpha neutrals over a dark surface.

3. **Side-by-side solid vs transparent**
   - identical card/list component rendered using both strategies.

4. **Contrast comparison**
   - show the same alpha foreground on at least two dark surfaces and annotate the resulting contrast difference.

5. **Layering issue comparison**
   - stacked border/surface example using alpha values;
   - equivalent solid-color version with no accumulation artifact.

6. **Multi-theme transparent example**
   - only if multiple themes/brands are in scope.

## Saturation and neutral character

Solid neutral palettes allow deliberate control over hue/saturation.

A neutral system may be:
- warm;
- cool;
- slightly brand-tinted;
- highly desaturated.

The choice affects perceived product character.

Do not force a purely grayscale palette when the brand calls for tinted neutrals.

### Required visual documentation

Create a side-by-side neutral comparison using the same UI:
- desaturated neutral;
- cool/tinted neutral;
- warm/tinted neutral.

The UI content stays identical so only the neutral character changes.

## Implementing an alternate dark-mode strategy

If the user wants a transparent-neutral experiment, document the actual generated workflow:

1. open the primitive variable collection;
2. create an alpha neutral scale;
3. create an experimental mode;
4. map semantic dark-mode roles to alpha values;
5. inspect real components/screens;
6. test contrast on every relevant surface;
7. remove or retain the mode after evaluation.

### Required visual documentation

Generate workflow screenshots/diagrams corresponding to:
- variable collection opened;
- alpha neutral scale added;
- new mode added;
- semantic mappings changed.

Do not rely on source screenshots. Build documentation using the generated system's own variables and names.

## Variables documentation QA

Fail QA when:
- documentation is prose-only with no diagrams/examples;
- density is described without a density specimen;
- breakpoint guidance is described without a structural responsive example;
- solid/transparent dark-mode tradeoffs have no visual comparison;
- workflow images use placeholder or unrelated variable names;
- diagrams show a token architecture different from the one selected by the initiator.
