# Text Editors

Text editors are rich-text/WYSIWYG controls used when users need formatting without writing markup.

# 1. Page regions

```text
Private
├─ _Text editor icon
├─ Text highlight helper/composition
└─ supporting private controls

Published
├─ Text editor toolbar
├─ Text editor tooltip
└─ Text editor

Examples
└─ composed editor usage
```

The page includes:
- a public Text editors header;
- a private-base header;
- an Examples in use header.

# 2. Text-editor icon

Private set: `_Text editor icon`

Observed:
- 48 variants.

Properties:
- Type:
  - Bold
  - Italic
  - Underline
  - Dot points
  - Left align
  - Center align
  - Right align
  - Justify
  - Link
  - Insert image
  - Attach file
  - Insert code
  - Color picker
  - Generate
  - More options
  - Insert video
- State: Default / Hover / Current

Anatomy:

```text
_Text editor icon
layout: Horizontal
centered
└─ icon / color swatch
```

The Current state represents an active formatting command and is distinct from Hover.

# 3. Toolbar

Published set: `Text editor toolbar`

Properties:
- Dropdowns: Boolean
- Type: Simple / Advanced

Advanced anatomy:

```text
Text editor toolbar
layout: Horizontal

├─ Select menus                         optional group
│  ├─ Select (style)
│  └─ Select (size/format)
└─ Content
   layout: Horizontal
   gap: compact
   ├─ _Text editor icon                 Bold
   ├─ _Text editor icon                 Italic
   ├─ _Text editor icon                 Underline
   ├─ Divider wrapper
   ├─ _Text editor icon                 Color picker
   ├─ Divider wrapper
   ├─ alignment/list icons
   ├─ Divider wrapper
   ├─ link/image icons
   ├─ Divider wrapper
   └─ generate/more icons
```

Observed icon control baseline:
- square around 32;
- internal icon around 20;
- dividers are placed in dedicated wrappers so divider rhythm stays consistent.

Do not use arbitrary line layers between controls.

# 4. Text-editor tooltip

Published set: `Text editor tooltip`

Types:
- Simple
- Advanced

It is a floating compact toolbar composed from the same private icon controls.

Anatomy:

```text
Text editor tooltip
layout: Horizontal
├─ _Text editor icon
├─ _Text editor icon
├─ divider
├─ ...
└─ _Text editor icon
```

Do not create a second icon-state system for the tooltip.

# 5. Text editor

Published set: `Text editor`

Observed:
- 4 variants.

Properties:
- Scroll bar: Boolean
- Hint text: Boolean
- Type: Default / Floating toolbar
- Size: sm / md

Default anatomy:

```text
Text editor
layout: Vertical
gap: editor spacing

├─ Text editor toolbar
└─ Input and hint text
   layout: Vertical
   ├─ Input
   │  layout: Vertical
   │  ├─ Rich text content
   │  ├─ Resize handle
   │  └─ Scroll bar                     optional
   └─ Hint text                         optional
```

Representative md:
- wide editor surface;
- generous text-area padding;
- scroll bar is a reusable helper;
- hint text sits below the editing surface, not inside it.

Floating-toolbar type moves formatting controls into a contextual floating surface without changing the content model.

# 6. Text highlight

Standalone helper/composition: `Text highlight`

Anatomy:

```text
Text highlight
├─ Highlight region
└─ Text editor tooltip
```

Use for demonstrating contextual formatting after text selection.

# 7. Examples in use

The page must include at least one composed editor example showing:
- toolbar attached to an editor;
- rich text content;
- scrolling/resizing behavior;
- contextual/floating toolbar where appropriate.

The example is documentation/composition, not a new component family.

# 8. Matrix requirements

_Text editor icon:
- all Type commands;
- Default / Hover / Current.

Toolbar:
- Simple / Advanced;
- dropdowns on/off.

Text editor:
- sm/md;
- Default/Floating toolbar;
- scroll bar/hint variations.


## Mandatory visible documentation region

The Figma page must visibly document:
- when to use Text editor rather than a simple textarea;
- editor → toolbar → private command-icon anatomy;
- Simple versus Advanced toolbar behavior;
- Default/Hover/Current formatting-command states;
- floating/contextual toolbar and Text highlight behavior;
- content, scrolling, resizing, hint, and rich-text constraints;
- keyboard navigation, focus, accessible command names, and selected/current-state communication;
- do/don't examples for hand-built toolbar icons, excessive formatting options, and hiding essential actions in floating UI;
- central maintenance through the command icon set, toolbar, tooltip, and editor tokens;
- at least one composed example in use.

The notes and example must be visible on the Figma canvas.

# 9. QA

Fail QA when:
- toolbar icons are hand-built instead of using _Text editor icon;
- Current state is omitted;
- dividers are inconsistently placed;
- tooltip creates a different icon-control system;
- resize/scroll/hint layers are flattened into the rich-text content;
- example-in-use composition is missing.
