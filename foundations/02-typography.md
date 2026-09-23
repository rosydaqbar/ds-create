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

# 2. Long-form typography documentation

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
