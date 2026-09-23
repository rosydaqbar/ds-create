# Icons

# Canvas layout

The icon library uses one wide header and a three-column categorized specimen layout.

Observed column geometry:

```text
left icon-library column
middle icon-library column
right icon-library column
long-form notes region
```

# Required category model

If the selected icon library supports them, organize icons into these categories rather than one undifferentiated grid:

- General
- Arrows
- Users
- Alerts & feedback
- Shapes
- Files
- Layout
- Development
- Finance & eCommerce
- Maps & travel
- Charts
- Communication
- Media & devices
- Security
- Editor
- Education
- Images
- Time
- Weather

Each icon specimen should show:
- the icon component;
- the icon name below/next to it;
- consistent optical sizing and spacing.

Use the user's selected icon library. Do not copy another product's icon assets by default.

# Icon documentation

Frame sizing follows the documentation-layout role and content. Required outline:
- why icons matter to UX;
- what an icon is;
- recognizability and comprehension;
- icons vs text labels;
- when space constraints justify icon-only actions;
- icons as complementary visual cues;
- when icons can replace text;
- avoiding arbitrary icon scaling;
- choosing one library deliberately;
- visual consistency;
- layer naming and construction best practices;
- avoiding fragile boolean construction when unnecessary;
- how to extend the icon library.

# Notes & Documentation — Icons

Keep icon guidance that directly helps the builder create, use, maintain, and export the active icon system.

## Icons improve scanability

Icons help users find familiar actions and categories quickly in information-dense UI.

### Required visual documentation

Show one navigation/list example **with meaningful icons** and the equivalent example **without icons**.

Keep:
- layout;
- labels;
- content.

Only the icon presence changes.

The comparison should demonstrate scanability rather than rely on a written claim.

## Familiar symbols

Common actions should favor familiar symbols where a strong convention already exists.

### Required visual documentation

Create a “familiar symbols” specimen showing a small set such as:
- home;
- search;
- menu;
- edit;
- favorite;
- share;
- settings;
- close.

If the selected icon library contains multiple styles, show only the actual style used by the system.

## Icons do not always replace text

Icon-only UI can be ambiguous.

### Required visual documentation

Create a three-part comparison:

1. **Icon only, unfamiliar action** — ambiguous.
2. **Icon + label** — clear.
3. **Icon-only familiar action** — acceptable when context/accessibility supports it.

Use the generated icon family and active typography.

## Compact/collapsed navigation

When space is constrained, icon-only navigation may be paired with:
- hover/expanded labels;
- tooltip;
- persistent active-state indication.

### Required visual documentation

Show:
- expanded navigation;
- collapsed navigation;
- collapsed item with label/tooltip revealed.

Do not imply icon-only navigation is universally preferable.

## Icons with text

Use icons as complementary cues when space allows.

### Required visual documentation

Show matched pairs:
- text-only control/item;
- icon + text version.

Use at least one familiar and one less-familiar action.

## Icon sizing

Do not scale a UI icon far beyond its intended optical size.

Use a surrounding featured-icon container when a larger visual emphasis is needed.

### Required visual documentation

Create:
1. an over-scaled icon example;
2. the same standard icon placed correctly inside a larger featured-icon container.

Annotate:
- icon frame size;
- container size;
- why the second preserves stroke/proportion quality.

## Icon-library consistency

Mixing families creates visible inconsistency.

### Required visual documentation

Create a comparison row of the same concept drawn in:
- the selected icon family;
- a deliberately mismatched family.

Annotate differences in:
- stroke weight;
- corner style;
- proportion;
- optical density.

Do not name or promote a third-party library unless it is actually selected by the user.

## Stable instance-swap overrides

Icon components should use deterministic internal layer names so swaps preserve intended overrides.

### Required visual documentation

Create two override examples:

1. change fill/stroke on Icon A, then swap to Icon B and show the override preserved;
2. show a broken/mismatched internal-layer naming example where the override is lost.

Use the actual icon components generated for the system.

## Icon anatomy

Document the internal construction of the selected icon family.

### Required visual documentation

Create an annotated icon anatomy diagram showing:
- component frame/live area;
- vector path/stroke;
- padding around the glyph;
- layer names.

This diagram should use an actual generated icon, not an arbitrary stock icon.

## SVG/export construction

Avoid vector construction that produces unnecessarily complex or broken exports.

### Required visual documentation

Create a side-by-side export-construction example:

- clean single/structured paths;
- problematic boolean-group-heavy construction.

Show:
- Figma layer anatomy;
- resulting SVG/path complexity at a conceptual level.

The point is maintainability/export quality, not merely appearance.

## Excluded from generated Icon notes

Do not include:
- promotion for any source icon library;
- asset-count claims;
- commercial links;
- screenshots advertising icon packs.

## Icons documentation QA

Fail QA when:
- guidance is prose-only;
- no with/without-icons comparison exists;
- no icon+text comparison exists;
- no scaling/featured-icon comparison exists;
- override stability is not demonstrated;
- icon anatomy is not shown;
- SVG/export guidance has no visual construction example.
