# Typography

# Canvas region order

```text
Private type-scale helper
→ Typography overview
→ Long-form typography documentation
```

Use the horizontal documentation-canvas grammar. Region sizes are content-driven.

# 1. Typography overview

Header contains:
- Foundation breadcrumb;
- `Typography` H1;
- short description;
- optional resources.

Content begins with a typeface specimen:
- active family name;
- large character sample;
- alphabet;
- numerals;
- punctuation specimen.

## Type scale

Show every typography role in the active system.

Recommended presentation columns:

| Role | Font family | Size | Line height | Tracking | Weight(s) |
| --- | --- | --- | --- | --- | --- |

If the system uses roles such as these, preserve them:

```text
Display 2xl
Display xl
Display lg
Display md
Display sm
Display xs
Text xl
Text lg
Text md
Text sm
Text xs
```

These are role examples, not mandatory numeric values.

Brand-agnostic rule:
- never import a reference type scale as the generated brand scale;
- resolve family, size, line height, tracking, and weights from the existing brand/system first;
- when missing, derive a coherent scale from the initiator answers and product density;
- preserve the documentation presentation regardless of the chosen values.

The specimen must visibly show each supported weight for each role.

# 2. Typography documentation

Required outline:
- Good typography
- What display text means
- Base text role
- Line-height principles
- Letter-spacing principles
- Choosing typefaces
- Minimum useful weight coverage
- Keeping font choices simple
- Discovering new typefaces
- Why fewer families are usually better
- Changing text styles
- Managing typography through variables
- Opening the variables editor
- Editing the typography collection
- Typography-variable notes
- Font-resource recommendations

Use constrained rich text and relevant specimen images.

Do not hard-code reference font sizes or reading widths into generated output.

# Notes & Documentation — Typography

Keep only typography guidance that helps the builder create or maintain the active typography system. Do not include a giant font-shopping catalog in generated documentation.

## Establish a clear typographic hierarchy

Typography must establish:
- display/hero hierarchy where needed;
- heading hierarchy;
- body hierarchy;
- label/control hierarchy;
- supporting/muted hierarchy.

The hierarchy should be understandable from the specimen itself, not only from token names.

### Required visual documentation

Create a complete type-scale specimen using the active typeface.

For every generated style/role show:
- style name;
- sample text;
- size;
- line height;
- weight;
- tracking/letter spacing where relevant.

Display and body roles should be visually separated into clear groups.

## Display text vs body/UI text

Display styles are intended for large headings and high-emphasis text.

Body/UI styles are intended for:
- paragraphs;
- form labels;
- navigation;
- buttons;
- menus;
- supporting content.

Do not use oversized display styling simply to create hierarchy in dense UI.

### Required visual documentation

Show the same content in:
- a suitable display treatment;
- an unsuitable display treatment used as body copy;
- a correct body/UI treatment.

Annotate why the incorrect example fails.

## Base font size

Choose a deliberate base UI/body size based on:
- target device;
- viewing distance;
- brand typeface legibility;
- localization needs;
- accessibility requirements;
- mobile input behavior.

A common starting point is around 16px, but the builder must not treat that as a universal constant.

### Required visual documentation

Create a base-size comparison specimen using the active typeface:
- smaller candidate;
- selected base size;
- larger candidate.

Show at least one paragraph and one compact UI label/control.

## Line height

Line height must be tuned by role.

Body copy generally requires more proportional line height than large display text.

### Required visual documentation

Create a three-column or stacked comparison:
- too tight;
- selected;
- too loose.

Use the same paragraph content and active typeface.

Annotate:
- font size;
- line height;
- approximate ratio.

## Letter spacing / tracking

Large display text may require tighter tracking, while smaller UI/body text often stays near the typeface default.

### Required visual documentation

Show one large heading in:
- default tracking;
- selected tracking;
- overly tight tracking.

Use measurement labels so the rationale is visible.

## Typeface suitability and weight coverage

When the brand already defines a typeface, audit whether it supports:
- required scripts/languages;
- required weights;
- numerals and punctuation needed by the product;
- readable small-size UI use;
- display use if the system needs it.

Do not invent weights the font does not have.

If a semantic weight is unavailable, map it deliberately to the nearest supported weight.

### Required visual documentation

Create a weight-coverage specimen using the active family.

Show:
- all actual available weights used by the system;
- the semantic roles mapped to each weight.

If a fallback weight mapping is required, annotate it.

## Keep type-family count intentional

One strong family is often enough.

Only introduce another family when it has a clear purpose such as:
- display/editorial contrast;
- code/monospace content;
- language/script requirement.

### Required visual documentation

If multiple families are actually selected, show:
- Family A role;
- Family B role;
- one composed screen demonstrating the relationship.

If the system uses one family only, do not manufacture a second-family example.

## Central typography maintenance

Typography changes should propagate from the system source.

Document the actual generated architecture:
- typography primitives/variables if used;
- text styles;
- semantic role names;
- component bindings.

### Required visual documentation

Generate three workflow visuals using the generated system itself:

1. **Text style overview**
   - show the main style groups.

2. **Typography variable collection**
   - only if typography variables are part of the selected architecture.

3. **Edit-and-propagate example**
   - change one source value and show how dependent styles/components update.

Do not use generic screenshots with unrelated token names.

## Excluded from generated Typography notes

Do not include:
- long catalogs of free fonts;
- long catalogs of paid fonts;
- pricing;
- marketplace screenshots;
- type-discovery website screenshots;
- recommendations unrelated to the selected brand.

Those were audited, but they are not relevant to maintaining the generated design system.

## Typography documentation QA

Fail QA when:
- the documentation is text-only;
- no active type-scale specimen exists;
- line-height guidance has no visual comparison;
- tracking guidance has no visual comparison where display text exists;
- available weight coverage is undocumented;
- update workflow does not use the generated system's real style/token names.
