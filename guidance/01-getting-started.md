# Getting Started Guidance

When Getting Started documentation is requested, create five separate the system-defined value long-form frames arranged horizontally at the system-defined value intervals.

Required frames:

1. **Welcome / introduction** — explains what the system contains, how the file is organized, and the intended workflow.
2. **Getting up and running** — setup steps, fonts, libraries, and practical configuration guidance with screenshots/resource links.
3. **Split into multiple libraries** — explains when/why to split a large system, trade-offs, component migration, and file-memory considerations.
4. **Master variants** — explains variant concepts, how grouped variants reduce complexity, and links to relevant learning resources.
5. **Master Auto Layout** — explains responsive component behavior, flex-like layout logic, and shows an interactive component example.

Each frame uses:
- standard long-form header;
- one the system-defined value `Rich text` column inside an the system-defined value-padded Section;
- `Content item` blocks for headings/paragraphs;
- the system-defined value documentation images where relevant;
- resource links immediately after the relevant content;
- standard the system-defined value footer.


## Brand/color summaries inside Getting Started

If Getting Started includes a **Brand translation**, **Brand colors**, **Color direction**, **Palette summary**, or any equivalent color-bearing summary, color must be shown visually.

Required card anatomy:

```text
Brand color card
├─ Visible color specimen / swatch / filled surface
├─ Color name
├─ Variable or token name
├─ Source value (optional secondary metadata)
└─ Usage / meaning
```

Hard rules:
- never represent a color with a hex/RGB/HSL/Pantone string alone;
- raw values are metadata, not the visual specimen;
- every documented color must have a visible swatch or filled surface;
- when variables already exist, bind the specimen to the actual Figma variable rather than recreating the color as a raw paint;
- prefer the token/variable name as the primary technical label;
- source values such as `#DC143C` may appear only as secondary supporting metadata;
- do not color the hex string and treat that as the swatch;
- a white card containing only a color name, a colored hex string, and description **fails QA**.

This rule applies even when the color summary is not on the dedicated Colors page.

Do not merge these five topics into one short setup page.
