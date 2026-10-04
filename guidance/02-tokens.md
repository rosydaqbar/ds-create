# 02 Tokens

The Tokens page explains the token architecture of this system: which collections exist and what they hold, how every token is named, how modes work, and the primitive palette underneath it all. It documents the collections that actually exist in this file, with their real names. The values themselves are documented on the foundation pages (`1.1`–`1.6`); this page explains the structure.

# Template frames

This page is built with `templates/structure.md`; the frames and what they hold are below.

```text
02 Tokens
├─ 02 Tokens · Collections        system goals, the collections, layers, scopes, adding to a collection
├─ 02 Tokens · Naming             the grammar, children, layers in names, code syntax, descriptions
├─ 02 Tokens · Modes              color modes, themes without modes, density, breakpoints, dark neutrals, motion
└─ 02 Tokens · Primitive palette  every primitive group as a table, neutral character, transparent shades
```

There is no `.Main` frame.

Every frame has `Doc/Header` (breadcrumb `Guidance › 02 Tokens`) and `Doc/Footer`. The first three are reading frames (`SYSTEM.md` Part B §7): a rich-text column at `doc/measure/reading`, each topic heading → body → visual → caption. `· Primitive palette` starts with the same reading column and then adds full-width variable tables (Part B §6).

Every topic keeps its visual. Visuals are built from this file's own variables, collections and components; diagrams are real frames with cards and connectors, not paragraph text arranged to look like a diagram.

# 02 Tokens · Collections

## 1. What the token system is for

Four goals:
- **Simplicity**: one name per concept, a small number of collections, the same structure in every build.
- **Accessibility**: color pairs are tested in every mode before components use them.
- **Aesthetics**: the brand's character lives in the primitives and roles, so every component carries it.
- **Scalability**: new modes, brands and components are added without renaming what exists.

## 2. The collections

Collections use plain domain names, in this order, and exist only when needed:

| Collection | Holds | Modes | Shown on |
| --- | --- | --- | --- |
| `Primitives` | raw values: `palette/*`, `scale/*` (hidden from pickers) | one | `02 Tokens · Primitive palette`, `1.1` Overview |
| `Color` | semantic color roles | `Light`, `Dark` (plus any extra color mode) | `1.1 Color · Tokens` |
| `Typography` | families, weights, sizes, line heights, letter spacing | one | `1.2 Typography · Tokens` |
| `Space` | the spacing scale | one, or density modes | `1.3 Space & layout · Tokens` |
| `Size` | control, icon, avatar, indicator, track, width, container, measure and touch sizes | one, or density modes | `1.3 Space & layout · Tokens` |
| `Shape` | radius roles and border widths | one | `1.4 Shape · Tokens` |
| `Motion` | durations, easings, delays (only when motion is in scope) | `Standard`, `Reduced` | `1.6 Motion · Tokens` |
| `Components` | component tokens (only when a component needs one) | follows `Color` for color tokens | each component's `· Anatomy` |
| `Documentation` | documentation measures and roles for the doc kit | one | `9.1 Doc kit` |

Rules:
- Never prefix a collection with a tier, product or feature name.
- A product concept is a group inside its domain collection, not a new collection. For example a signal-strength color set:

```text
Color
└─ color/signal/
   ├─ excellent
   ├─ good
   └─ poor
```

- An existing system that is kept, audited or improved keeps its collection names unless the user chose to normalize them.

**Visual: collection map.** One card per collection that exists in this file, in order: name, variable count, modes, and a sample of three variables with swatches or values. Only collections that exist are shown.

## 3. Three layers

```text
Primitives  →  Semantic (Color, Typography, Space, Size, Shape, Motion)  →  Components
```

- **Primitive variables** hold raw values (`palette/brand/600`, `scale/space/16`). They are hidden from pickers and never bound directly in components.
- **Semantic variables** alias primitives and say what a value is for (`color/fill/brand/solid`, `space/md`). Components bind these.
- **Component variables** exist only where a component needs a value no semantic role expresses, such as a button's horizontal padding per size (`button/padding-x/md`). They alias semantic variables.
- **Category variables** (`color/category/*`) are utility colors for badges, tags, avatars and charts. They carry no status meaning.

**Visual: one value through the layers.** `palette/brand/600` → `color/fill/brand/solid` → `button/primary/brand/fill` → a `Button` instance, each step a card with its swatch and name. A second row shows `scale/space/16` → `space/xl` → a card's padding.

## 4. Scopes

Each variable is limited to the properties it belongs to, so pickers only offer sensible choices:

| Variables | Offered for |
| --- | --- |
| `color/text/*` | text fills |
| `color/icon/*` | icon fills and strokes |
| `color/border/*` | strokes |
| `color/surface/*`, `color/fill/*`, `color/overlay/*`, `color/category/*` | frame and shape fills |
| `color/shadow/*` | effect colors |
| `space/*` | gaps and padding |
| `size/*` | width and height |
| `radius/*` | corner radius |
| `border/width/*` | stroke width |
| `font/*` | the matching text property |
| `Primitives`, `motion/*` | not offered in pickers |

**Visual: scoped picker.** A recreated fill picker on a text layer offering only `color/text/*`, next to a stroke picker offering only `color/border/*`.

## 5. Adding to a collection

Add a variable to the domain collection it belongs to, with a name that follows the grammar (`· Naming`) and a description of its UI purpose. Add a new mode only for a real need (`· Modes`). Add a collection only when a new domain appears; never create a feature-specific collection.

**Visual: where it goes.** Three new needs (a chart color, a sidebar width, a dialog radius) each with an arrow to its collection and its final name (`color/category/teal/solid`, `size/width/xs`, `radius/modal`).

# 02 Tokens · Naming

## 1. The grammar

Every token name has the same shape:

```text
{domain}/{group}/{role}[/{emphasis}][/{state}]
```

Each segment narrows the one before it:

```text
color / fill / brand / solid / hover
  │      │      │       │       └ state
  │      │      │       └ emphasis
  │      │      └ role
  │      └ group
  └ domain
```

Patterns by domain:

| Domain | Pattern | Examples |
| --- | --- | --- |
| Primitives | `palette/{family}/{step}`, `scale/{dimension}/{value}` | `palette/neutral/900`, `scale/radius/8` |
| Color | `color/{group}/{role}[/{emphasis}][/{state}]` | `color/text/secondary/hover`, `color/border/danger/subtle` |
| Typography | `font/{property}/{role}` | `font/family/ui`, `font/size/body-md` |
| Text styles | `type/{role}/{size}/{weight}` | `type/body/md/regular` |
| Space | `space/{step}`, `space/optical` | `space/md` |
| Size | `size/{group}/{step}`, `size/touch-min` | `size/control/md` |
| Shape | `radius/{role}`, `border/width/{role}` | `radius/control`, `border/width/focus` |
| Effect styles | `elevation/{level}`, `focus/{tone}`, `blur/backdrop/{step}` | `elevation/overlay`, `focus/danger` |
| Grid styles | `grid/{breakpoint}` | `grid/desktop` |
| Motion | `motion/{duration, easing, delay}/{role}` | `motion/duration/base` |
| Components | `{component}[/{part}][/{emphasis}][/{tone}]/{property}[/{state}]` | `button/padding-x/md`, `button/primary/brand/fill/hover` |
| Documentation | `doc/{group}/{role}` | `doc/space/block` |

**Visual: name anatomy.** `color/fill/brand/solid/hover` split into its segments, each with a callout, next to the swatch and a button in its hover state.

## 2. Roles and children

A state or variant of a role is a **child** of that role. In every variable table, children appear under their parent with tree connectors, so families read at a glance:

```text
color/text/brand
├── hover
└── pressed
```

The rest value of a role is the parent itself; there is no `/rest` or `/default` segment.

**Visual: a family in the table.** The `color/text/brand` and `color/fill/brand/solid` rows from `1.1 Color · Tokens`, with the parent badge, vertical connector, elbows and indented children called out.

## 3. Names describe purpose, not values

- One name per concept; never two names for the same role.
- Semantic names say what a token is for (`color/text/placeholder`), never what it looks like (`gray-500`) or where it is used once (`login-title`).
- Names never contain product, brand or feature names.
- Sizes are named by step (`xs` to `2xl`), not by value, so values can change without renaming.

**Visual: good and bad names.** `Doc/Do-dont` pairs: `color/text/secondary` vs `gray-text-2`; `space/md` vs `space-8px`; `radius/control` vs `button-radius-login`.

## 4. Code syntax

Code uses the same segments joined with hyphens. For web: `var(--color-fill-brand-solid-hover)`. Every semantic variable carries its web code syntax, so developers copy it from the inspect panel. Other formats (Tailwind theme, JSON, design-token JSON, iOS, Android) are exports of the same names.

**Visual: one token, every format.** `color/text/primary` shown as the Figma name, the CSS variable, a JSON entry and a Tailwind class, side by side.

## 5. Descriptions

Every semantic variable has a description stating its concrete UI purpose, for example "Secondary text such as labels and section headings." The same text appears in the Usage column of every variable table and in the variable's tooltip in pickers. A description that only repeats the name is not a description.

**Visual: description in use.** A picker hover showing a variable's description, and the same text in the Usage column of its table.

# 02 Tokens · Modes

## 1. Color modes

The `Color` collection has one mode per color mode: `Light` and `Dark`, plus any extra mode the product needs (for example a high-contrast mode). Every role has a value in every mode, so a component never needs a dark variant.

**Visual: mode table.** Five roles (`color/text/primary`, `color/surface/base`, `color/border/subtle`, `color/fill/brand/solid`, `color/fill/danger/subtle`) with `Light` and `Dark` alias chips, next to a card in both modes.

## 2. Themes without variable modes

Dark mode can also be built as separate component variants (`Card` light and dark). This works for small systems, but variant count grows, every component must be kept in sync by hand, and switching the whole product becomes hard. Variable modes scale better when the whole product needs light and dark. The choice is made deliberately with the user, never silently.

**Visual: variants vs modes.** A footer or card shown both ways: *variant theming*, two components (`Theme=light`, `Theme=dark`) maintained separately; *mode theming*, one component bound to semantic roles, with the frame switched between `Light` and `Dark`.

## 3. Density modes

Compact, comfortable and spacious modes are added to `Space` and `Size` only when the product really needs them, and they change only what genuinely needs to change:
- control heights (`size/control/*`) and component paddings;
- table and list row heights.

Type, radius, icon sizes and page-section spacing stay the same. Touch targets never go below `size/touch-min`. Never create density modes by multiplying every spacing token.

**Visual: one family in three densities.** A table row, a button and a text field in `Compact`, `Comfortable` and `Spacious`, with callouts on what changed (row height, control height, padding) and what did not (type, radius, icons).

## 4. Breakpoints are not just modes

Responsive layouts change structure, not only numbers: a row becomes a column, navigation changes pattern, controls wrap, elements move, appear or disappear. Some spacing stays the same across breakpoints; some type sizes change and others do not. A `Mobile / Tablet / Desktop` mode does not make a layout responsive on its own. Breakpoints are grid styles (`grid/*`) and layout decisions; tokens change only where a value really differs.

**Visual: responsive example.** One product section at desktop, tablet and mobile, with callouts separating **token changes** (a heading size, a container margin) from **structural changes** (columns stacking, navigation collapsing into a menu).

## 5. Dark neutrals: solid or transparent

Dark-mode neutrals can be solid colors, transparent white over a dark surface, or a mix.

Solid neutrals:
- give a predictable result;
- are easier to test for contrast;
- allow deliberate hue and saturation;
- avoid stacking artifacts.

Transparent neutrals:
- adapt to different dark surfaces;
- can serve several themes with fewer values;
- but their result depends on the surface below, contrast changes with context, and stacked borders and surfaces add up their opacity, which shows in tables, menus and cards.

Keep an existing strategy when it works. For a new system, solid is the default; choose transparent deliberately and write down why.

**Visuals, all required:**
1. **Solid dark palette**: the semantic roles rendered with solid primitives.
2. **Transparent dark palette**: the same roles rendered with `palette/alpha-white/*` over a dark surface.
3. **Side by side**: the same card and list built with each strategy.
4. **Contrast comparison**: the same alpha text color on two different dark surfaces, with the two ratios.
5. **Layering issue**: stacked borders and surfaces using alpha values, showing the build-up, next to the solid version with no build-up.
6. **Multi-theme example**: only when several themes or brands are in scope.

## 6. Trying an alternate dark strategy

When the user wants to test transparent neutrals:
1. open the `Primitives` collection;
2. add an alpha neutral scale (`palette/alpha-white/*`);
3. add an experimental color mode (for example `Dark alpha`);
4. map the dark semantic roles in that mode to the alpha values;
5. check real components and screens in the new mode;
6. test contrast on every surface;
7. keep or remove the mode after review.

**Visual: workflow.** Recreated views of each step with this file's real names: the collection open, the alpha scale added, the new mode column, and the changed role mappings.

## 7. Motion modes

The `Motion` collection has `Standard` and `Reduced`. `Reduced` replaces movement with instant changes or short fades for people who turn on reduced motion. See `1.6 Motion`.

**Visual: one transition, two modes.** A menu opening in `Standard` (`base · enter`) and in `Reduced` (fade only), as before/during/after frames.

## 8. Modes and accessibility

Every mode is tested on its own: a pair that passes in `Light` can fail in `Dark`. Alpha colors are tested on every surface they sit on.

**Visual: per-mode contrast.** Three text/surface pairs with their ratios in `Light` and `Dark`, one of them passing in one mode and failing in the other, with the fix shown.

# 02 Tokens · Primitive palette

## 1. What primitives are

Primitives are the raw values of the system. They are hidden from pickers, never bound in components, and changed only when the brand changes. Every semantic token points at one of them.

## 2. Primitive tables

After the reading column, one full-width table per primitive group. Columns: **Name** (`Doc/Token badge`), **Value** (`Doc/Alias chip` with swatch or number), **Used by** (the semantic roles that alias it, as small token badges). The Used-by column shows at a glance which primitives matter and which are unused.

Groups in this order:
1. `palette/base/*`: white, black, transparent.
2. `palette/brand/*`.
3. `palette/neutral/*`.
4. The feedback hue families (`palette/red/*`, `palette/amber/*`, `palette/green/*`, `palette/blue/*` by default).
5. Supporting hue families.
6. `palette/alpha-black/*` and `palette/alpha-white/*`.
7. `scale/space/*`, `scale/size/*`, `scale/radius/*`, `scale/border-width/*`.
8. `scale/font-size/*`, `scale/line-height/*`, `scale/font-weight/*`.

Each family is a parent row with its steps as children, drawn with `Doc/Tree connector`. Color families also show a strip of all steps in the parent row. The full palette rows with contrast annotations live on `1.1 Color · Overview`; this table is the complete reference.

## 3. Neutral character

Solid neutrals let you choose their hue and saturation on purpose. A neutral family can be warm, cool, slightly brand-tinted or very desaturated, and that choice changes how the whole product feels. Do not force pure gray when the brand calls for tinted neutrals.

**Visual: same UI, three neutrals.** One composition (a card with heading, text, divider, input and button) in desaturated, cool-tinted and warm-tinted neutrals, content unchanged, with the selected neutral marked.

## 4. Transparent shades

The alpha scales (`palette/alpha-black/*`, `palette/alpha-white/*`) hold black and white at fixed opacities: 5, 10, 20, 30, 40, 50, 60, 70, 80 and 90. Use them for the scrim (`color/overlay/scrim`), shadow colors (`color/shadow/*`), and hover tints on images or media. To add a shade, add a step to the scale and alias it from a semantic role; never type an opacity on a layer.

**Visual: alpha in use.** The alpha-black scale on a light surface and the alpha-white scale on a dark surface, then three uses: a dialog scrim, a shadow color and a hover tint over an image, each labelled with its role and primitive.

## 5. Changing primitives

Change a primitive only to change the brand. After any change, review the roles that alias it (the Used-by column), check real components, and run the contrast tests on `1.1 Color` again.

**Visual: change impact.** `palette/brand/600` edited, its Used-by roles highlighted, and three components that use those roles shown before and after.

# QA

- All four frames exist with their exact names, in order.
- Only collections that exist in this file are shown, with their real names, variable counts and modes.
- Every topic has its visual, built from this file's own variables; diagrams are real frames with cards and connectors.
- Density is shown with a three-density specimen; breakpoints with a structural responsive example; solid vs transparent dark neutrals with all required visuals.
- The primitive tables list every primitive with its value and the roles that use it.
- No visual uses names other than this system's real token names.
