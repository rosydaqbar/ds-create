# Brand-Agnostic Design System Initiator

This package is a Figma construction specification **and initiator workflow** for generating, extending, auditing, or rebuilding a design system.

The initiator questionnaire is part of the system. It determines what the rest of the specification is allowed to build.

The system must never assume:
- that the user is starting from zero;
- that every Foundation is needed;
- that every Component is needed;
- that existing assets should be replaced;
- that one token naming convention should be forced onto an established system.

---

# How the package works

```text
Initiator questionnaire
        ↓
Confirmed initiator contract
        ↓
Existing-system inspection
        ↓
Keep / Audit / Improve / Refactor / Rebuild / Replace / Build / Skip
        ↓
Foundation generation
        ↓
Component generation
        ↓
Documentation + matrices + QA
```

---

# Package structure

```text
README.md

00-figma-file-architecture.md
01-documentation-system.md
02-token-and-naming-contract.md
03-initiator-questionnaire.md
04-generation-decision-logic.md

foundations/
  00-foundations.md
  01-color.md
  02-typography.md
  03-spacing.md
  04-sizing.md
  05-radius.md
  06-borders.md
  07-elevation-and-focus.md
  08-layout-grid-and-breakpoints.md
  09-motion.md
  10-iconography.md
  11-imagery.md
  12-brand-assets.md
  13-accessibility.md

components/
  00-components.md
  01-button.md
  02-button-group.md
  03-link.md
  04-checkbox.md
  05-radio.md
  06-switch.md
  07-field.md
  08-text-input.md
  09-textarea.md
  10-select.md
  11-combobox.md
  12-search-input.md
  13-verification-input.md
  14-file-upload.md
  15-menu-dropdown.md
  16-slider.md
  17-tabs.md
  18-segmented-control.md
  19-badge.md
  20-avatar.md
  21-tooltip.md
  22-divider.md
  23-breadcrumb.md
  24-pagination.md
  25-progress.md
  26-spinner.md
  27-skeleton.md
  28-alert.md
  29-toast.md
```

---

# Required execution order

## Phase 1 — Initiate

Read:

1. `03-initiator-questionnaire.md`
2. collect answers;
3. show the final confirmation summary;
4. wait for **Confirm and generate**.

## Phase 2 — Resolve

Read:

1. `04-generation-decision-logic.md`
2. inspect existing Figma/code/token sources;
3. map every relevant item to its action.

## Phase 3 — Establish system rules

Read:

1. `00-figma-file-architecture.md`
2. `01-documentation-system.md`
3. `02-token-and-naming-contract.md`

These files define how generated content is organized.

## Phase 4 — Foundations

Read:

1. `foundations/00-foundations.md`
2. only the individual Foundation files included by the confirmed initiator contract.

## Phase 5 — Components

Read:

1. `components/00-components.md`
2. only the individual Component files included by the confirmed initiator contract.

---

# One Markdown file per topic

The documentation unit remains intentionally simple:

- one Markdown file per Foundation topic;
- one Markdown file per Component family.

Individual component files contain their detailed anatomy, properties, states, sizing, token bindings, behavior, accessibility, matrices, QA, and prohibited constructions.

Do not fragment a single component into dozens of micro-specification files.

---

# Fixed vs resolved by initiator

## Fixed system rules

- Figma page/canvas grammar;
- documentation frame grammar;
- layer naming principles;
- component construction requirements;
- state and QA expectations;
- accessibility baseline.

## Resolved by the initiator

- what already exists;
- what is kept/audited/changed;
- what Foundations are built;
- what Components are built;
- brand inputs;
- product/platform context;
- required modes;
- token architecture;
- token naming ecosystem;
- output formats;
- density;
- radius direction;
- elevation direction;
- icon strategy;
- documentation depth.

---


# Documentation visual contract

The generated Figma file must use the finished documentation-page grammar defined in `01-documentation-system.md`.

This is not optional styling. It defines the required page widths, header structure, 80 px section gutters, Design note pattern, swatch anatomy, variable-table anatomy, editorial typography hierarchy, footer, and component documentation composition.

Do not substitute generic source boards, token dashboards, floating chips, or large utility panels.

# Critical rule

**The canonical architecture is a menu of supported system parts, not an instruction to blindly generate all of them.**

Only generate what the confirmed initiator contract permits.