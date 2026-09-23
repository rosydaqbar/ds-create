# Documentation System

Every child page contains one primary documentation board named:

`Doc / <Page name>`

## Board geometry

```text
Width: 1600
Height: Hug content
Layout: Vertical Auto Layout
Background: documentation.surface
Clip content: False
```

## Board layer tree

```text
Doc / <Page name>
├─ Header
│  ├─ Eyebrow
│  └─ Meta
├─ Hero
│  ├─ Breadcrumb
│  ├─ Title
│  └─ Description
├─ Content
│  ├─ Section / Overview
│  ├─ Section / Anatomy or Model
│  ├─ Section / Properties or Tokens
│  ├─ Section / Variants or Scale
│  ├─ Section / States or Modes
│  ├─ Section / Behavior
│  ├─ Section / Examples
│  ├─ Section / Accessibility
│  └─ Section / QA
└─ Footer
```

## Header

```text
Height: 88
Padding-inline: 80
Alignment: center
Bottom border: 1 px documentation.border
```

`Eyebrow`:
- one line;
- small text style;
- format: `DESIGN SYSTEM / <SECTION>`.

`Meta`:
- optional version or status;
- right aligned;
- no brand-specific marketing text.

## Hero

```text
Padding: 80 top / 80 inline / 72 bottom
Gap: 24
Background: documentation.hero.surface
```

Text column:
- maximum width `760`;
- left aligned.

Title:
- documentation display style;
- one or two lines maximum.

Description:
- body large;
- maximum `4` lines at 760 px;
- concise statement of what the page defines.

## Content frame

```text
Padding-inline: 80
Padding-block: 88
Gap between sections: 96
```

## Section anatomy

Every documentation section is:

```text
Section / <Name>
├─ Section header
│  ├─ Heading
│  ├─ Description
│  └─ Optional tag
└─ Section body
```

Section header width:
- text max width `720`.

Section body:
- max width `1440`;
- full width when showing matrices or tables.

## Text widths

Use three intentional content widths only:

| Width | Use |
|---|---|
| 720 | prose, guidance, accessibility notes |
| 1040 | anatomy diagrams, compact examples |
| 1440 | token tables, component matrices, QA grids |

Do not create arbitrary text widths.

## Documentation spacing

| Relationship | Gap |
|---|---:|
| heading → description | 8 |
| section header → body | 32 |
| paragraph → paragraph | 16 |
| body block → body block | 32 |
| subsection → subsection | 48 |
| major section → major section | 96 |

Values are bound to documentation spacing variables.

## Token table

Foundation token tables use:

```text
Table
├─ Header row
│  ├─ Name
│  ├─ Value / Alias
│  ├─ Light
│  ├─ Dark
│  └─ Usage
└─ Data rows...
```

Required column behavior:
- Name: fixed `260`;
- Value/Alias: fixed `240`;
- Light: fixed `200`;
- Dark: fixed `200`;
- Usage: fill remaining width.

Nested semantic tokens visually indent by `24 px` per level.

## Component-property table

```text
Property | Type | Default | Allowed values | Figma implementation
```

Do not document a component property without documenting its Figma type.

## Anatomy diagrams

Anatomy diagrams use real component instances.

Annotation rules:
- annotation line: 1 px;
- label offset: 12 px from terminal;
- do not cover the component;
- one label names one layer;
- measurements use exact token name and resolved value, e.g. `space.3 · 12`.

## Matrices inside documentation

Documentation may repeat a small matrix for explanation, but the exhaustive matrix lives in `20 — Matrices`.

A documentation matrix should normally contain no more than 12 specimens.

## Do / Don't

Two equal-width examples:

```text
Guidance pair
├─ Do
│  ├─ Example
│  └─ Explanation
└─ Don't
   ├─ Example
   └─ Explanation
```

The explanation states the rule. Avoid vague copy such as “looks better”.

## Footer

```text
Height: 160 minimum
Padding: 80
Top border: 1 px
```

Contains:
- page name;
- section name;
- optional last-reviewed metadata;
- no promotional material.


# Initiator integration

The full specification in this file defines every documentation pattern the system supports.

The generated Figma documentation must respect the **Documentation Depth** selected in `03-initiator-questionnaire.md`.

For example, if the user selects:

```text
Anatomy
Layer hierarchy
Component properties
States
Token bindings
Accessibility
QA matrices
```

then the generated documentation page includes those sections and may omit:
- Do / Don't;
- developer notes;
- responsive behavior;
- content rules;

unless another selected requirement depends on them.

The Markdown specification files themselves remain complete. Only generated Figma documentation is scoped.

## Existing documentation

When the existing-system action is:

- **Keep** — retain current documentation unless the user explicitly requests documentation updates.
- **Audit** — compare current documentation against the selected documentation depth.
- **Improve** — fill missing selected sections while preserving valid structure.
- **Refactor/Rebuild** — use this documentation grammar for the rebuilt documentation.