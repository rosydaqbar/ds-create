# Progress Indicators

Progress indicators communicate completion or remaining progress.

# 1. Public families

```text
Progress indicators
├─ Progress bar
└─ Progress circle
```

Headers:
- **Progress bars** — indicate percent completed for a task/process.
- **Progress circles** — circular completion/resource indicators, often paired with a percentage/label.

# 2. Progress bar

Published set: `Progress bar`

Observed:
- 55 variants.

Properties:
- Progress: 0% / 10% / 20% / 30% / 40% / 50% / 60% / 70% / 80% / 90% / 100%
- Label: False / Right / Bottom / Top floating / Bottom floating

Base anatomy:

```text
Progress bar
├─ Progress track
│  ├─ Background
│  └─ Progress fill
└─ Percentage / label                  placement variant
```

Right-label form:
- track consumes most horizontal width;
- label sits to the right with a compact gap.

Floating labels are positioned relative to the progress endpoint.

Progress geometry is value-driven; do not use 11 unrelated drawn bars.

# 3. Progress circle

Published set: `Progress circle`

Properties:
- Label: Boolean
- Size: xxs / xs / sm / md / lg
- Shape: Circle / Half circle

Anatomy:

```text
Progress circle
├─ Ring
│  ├─ Background
│  └─ Progress line
└─ Number and label
   ├─ Label                            optional
   └─ Number
```

The ring uses a shared background/progress stroke model.

Circle and Half-circle are shape variants of the same family.

# 4. Matrix requirements

Progress bar:
- all 11 progress increments;
- all label placements.

Progress circle:
- all 5 sizes;
- both shapes;
- label on/off.



## Mandatory notes/documentation region

The Figma page must visibly document:
- when to use a Progress bar versus Progress circle;
- determinate progress versus indeterminate/loading patterns;
- value-driven construction and label-placement behavior;
- why progress indicators must not represent network signal strength;
- percent/value labeling and when numeric progress should be exposed;
- motion/reduced-motion and screen-reader progress semantics in implementation;
- do/don't examples for fake precision, unrelated per-value shapes, and using progress as a status badge;
- which track/progress tokens and shared construction should be maintained centrally.

A variant matrix without these notes fails QA.


## Mandatory visible documentation region

The Figma page must visibly document:
- when to use Progress bar versus Progress circle;
- determinate progress versus indeterminate loading;
- value-driven construction and label placement;
- why progress indicators must not represent network signal strength;
- percent/value labeling and when numeric progress should be exposed;
- motion/reduced-motion and screen-reader progress semantics;
- do/don't examples for fake precision, unrelated per-value shapes, and progress used as a status badge;
- central maintenance through shared track/progress construction and semantic tokens.

A matrix alone fails documentation QA.

# 5. QA

Fail QA when:
- progress values are separate shapes with no common construction logic;
- label placement changes the progress geometry incorrectly;
- circle label/number are not optically centered;
- half-circle is rebuilt as an unrelated component.
