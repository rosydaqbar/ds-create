# Buttons

Buttons communicate actions users can take. This page is a complete action-component family, not a single button component.

# 1. Canvas regions

Keep these regions distinct:

```text
Buttons
├─ standard buttons
├─ destructive buttons
├─ utility buttons
├─ close buttons
├─ loading indicator helper
├─ social buttons
├─ social button groups
├─ mobile app-store badges
└─ documentation and documentation
```

Public headers:
- **Buttons** — actions users can take.
- **Social buttons** — authentication/social actions.
- **Mobile app store buttons** — app-related CTA assets.

# 2. Standard button component set

Published set: `Buttons/Button`

Observed matrix:
- 200 variants.

Properties:
- Size: `xs / sm / md / lg / xl`
- Hierarchy: `Primary / Secondary / Tertiary / Link color / Link gray`
- State: `Default / Hover / Focused / Disabled / Loading`
- Icon only: `False / True`
- Leading icon: Boolean
- Trailing icon: Boolean
- Leading icon swap: Instance swap
- Trailing icon swap: Instance swap
- Loading text: Boolean

## Standard button anatomy

Text button:

```text
Buttons/Button
layout: Horizontal
align: Center

├─ Leading icon                         optional instance
├─ Text padding
│  layout: Horizontal
│  ├─ left optical inset
│  ├─ Text
│  └─ right optical inset
└─ Trailing icon                        optional instance
```

The **Text padding wrapper is mandatory**. Do not replace it with a bare text layer.

Observed md baseline:
- root height around 40;
- root horizontal padding around 14;
- root vertical padding around 10;
- root item gap around 4;
- icons around 20;
- Text padding adds a small left/right optical inset around the label.

The optical wrapper exists because icon glyphs often include invisible live-area padding. The text wrapper compensates for that so buttons remain visually centered whether they have:
- no icon;
- leading icon;
- trailing icon;
- both icons.

Treat the observed measurements as proportional baselines. Preserve the optical relationship if brand typography/icon metrics require different dimensions.

## Size relationship

Observed control heights:
- xs ≈ 32
- sm ≈ 36
- md ≈ 40
- lg ≈ 44
- xl ≈ 48

Link hierarchies do not use the same filled-control height; their visible height follows line-height/content.

Icon-only variants:
- square;
- side length follows the corresponding control height;
- use the same hierarchy/state system as text buttons where available.

## Hierarchy model

Standard hierarchy:
1. Primary
2. Secondary
3. Tertiary
4. Link color
5. Link gray

Do not invent additional hierarchy levels merely to produce variety.

The visual system may use brand-specific color/effect tokens, but the hierarchy relationship stays intact:
- Primary has strongest action emphasis.
- Secondary supports primary actions.
- Tertiary reduces container emphasis further.
- Link color behaves like an action link using brand emphasis.
- Link gray is the quietest link treatment.

## State model

Every applicable hierarchy covers:
- Default
- Hover
- Focused
- Disabled
- Loading

Loading:
- uses the dedicated loading icon helper;
- preserves the button's action identity;
- may hide or modify visible label according to the Loading text property;
- does not create a separate component family.

Focused:
- uses the system focus-ring/effect model;
- remains visibly distinct from Hover.

# 3. Destructive buttons

Published set: `Buttons/Button destructive`

Observed:
- 175 variants.

Properties:
- Size: xs / sm / md / lg / xl
- Hierarchy: Primary / Secondary / Tertiary / Link
- State: Default / Hover / Focused / Disabled / Loading
- Icon only
- leading/trailing icon booleans and swaps
- Loading text boolean

Anatomy is the same structural pattern as the standard button:
- optional leading icon;
- mandatory Text padding wrapper;
- optional trailing icon.

Destructive styling changes semantic treatment, not anatomy.

Do not automatically use a destructive button for every negative or cancel-like action. Reserve the destructive family for actions whose consequence needs explicit visual warning.

# 4. Utility button

Published set: `Buttons/Button utility`

Properties:
- Size: xs / sm
- Hierarchy: Secondary / Tertiary
- State: Default / Hover / Focused / Disabled
- Icon swap

Anatomy:

```text
Button utility
└─ Icon instance
```

Observed behavior:
- square compact action;
- icon centered;
- no label;
- control padding provides the target frame.

Use for compact tool actions, not as a substitute for a normal labeled button.

# 5. Close button

Published set: `Buttons/Button close X`

Properties:
- Size: sm / md / lg
- Dark background: False / True
- State: Default / Hover / Focused

Anatomy:

```text
Button close X
└─ x-close icon
```

Observed lg baseline:
- square control;
- icon centered inside equal padding.

Dark-background is a visual-context variant, not a separate button purpose.

# 6. Loading helper

Published/helper set: `Buttons/Button loading icon`

Properties:
- Size: sm / md

Anatomy:

```text
Loading icon
├─ Background ring
└─ Active line/ring segment
```

Keep it reusable so loading-state changes propagate across standard and destructive buttons.

# 7. Social button

Published set: `Buttons/Social button`

Observed:
- 216 variants.

Properties:
- Size: md / lg
- Social/provider: six provider slots in the observed matrix
- Supporting text: True / False
- Theme: Brand / Gray / Color
- State: Default / Hover / Focused

Anatomy:

```text
Social button
layout: Horizontal
├─ Social icon
└─ Text
```

Observed lg baseline:
- icon around 20;
- root vertical padding around 10;
- horizontal padding around 16;
- gap around 10.

Provider artwork must remain swappable and visually centered.

# 8. Social button group

Published set: `Buttons/Social button group`

Properties:
- Size: md / lg
- Style: Buttons / Icons
- Theme: Brand / Color / Gray

Buttons style anatomy:

```text
Social button group
layout: Vertical
gap: compact
├─ Social button
├─ Social button
├─ Social button
└─ ...
```

The group is a composition of Social button instances. Do not detach and recreate provider rows.

# 9. Mobile app-store badges

Published set: `Mobile app store badge`

Properties:
- Size: md / lg
- Store: multiple approved store variants
- Style: Brand / Outline

These assets preserve their official lockup proportions. Do not rebuild the marks with substitute text or icons.

# 10. Matrix presentation

The Buttons public matrix must show:
- all 5 sizes;
- each hierarchy;
- Default / Hover / Focused / Disabled / Loading;
- icon compositions;
- icon-only variants;
- destructive family in its own matrix;
- utility/close helpers adjacent to the standard family;
- social family and social groups in a separate region;
- app-store badges in a separate region.

Do not collapse the standard 200-variant matrix into a demo row.

# 11. Button documentation

This page includes a dedicated documentation frame. It is required.

The documentation should preserve these topics and illustrative examples:

## Buttons should look actionable
Explain why buttons need sufficient affordance and how container, border, depth, contrast, and interaction states help communicate action.

Illustrate:
- a clearly actionable button treatment;
- a treatment that becomes too visually flat/ambiguous.

## Button hierarchy
Explain why multiple action levels are needed and how Primary / Secondary / Tertiary / Link treatments create clear priority.

Include:
- hierarchy example;
- comparison showing a UI without meaningful action hierarchy.

## Destructive actions
Explain:
- not every negative/cancel action requires a strong destructive treatment;
- a lower-emphasis secondary action is often sufficient;
- use the destructive variant when the destructive action itself is the primary consequential action.

Include modal examples:
- overly aggressive destructive treatment;
- neutral/secondary alternative;
- genuinely destructive primary action.

## Optically balancing buttons
This section is mandatory because it directly explains the button anatomy.

Document:
- icon libraries use consistent outer frames/live areas;
- glyphs contain internal optical padding;
- using raw icon-frame dimensions next to text can make the button look unbalanced;
- the label is wrapped in a small horizontal Auto Layout **Text padding** frame;
- the button's outer horizontal padding is compensated correspondingly;
- this keeps label-only and icon+label buttons visually centered.

Include visual explanations for:
- icon frame/live area;
- imbalance caused by icon padding;
- accumulated button padding;
- corrected text-padding wrapper;
- final balanced buttons.

## Skeuomorphic/effect treatment
Explain the optional visual treatment used by the active brand/system:
- subtle depth can be implemented through effect tokens;
- it must remain accessible;
- effects should be centralized so they can be removed or changed globally.

Include:
- button examples with depth/effects;
- effect-stack breakdown;
- how to remove/flatten the effect treatment through tokens.

The documentation must describe the active generated system, not another product or source library.

# 12. Button QA

Fail QA when:
- the Text padding wrapper is missing;
- icons are placed directly against a bare text layer;
- icon-only buttons use unrelated dimensions;
- loading becomes a separate unrelated button component;
- destructive buttons use different anatomy from standard buttons;
- social groups duplicate rather than instance Social button;
- the full hierarchy/state matrix is absent;
- documentation omits optical balancing;
- the active visual effect model cannot be changed centrally through tokens.

# 13. Visual documentation modules

The Button long-form documentation is not complete without the visual comparisons that explain the design decisions.

## 13.1 Buttons should look actionable

Create two versions of the same action context.

**Example A — clear affordance**
- selected Button component treatment;
- visible hierarchy/state;
- obvious click target.

**Example B — too visually ambiguous**
- remove enough container/border/depth cues that the control starts to resemble static text.

Keep:
- label;
- placement;
- surrounding content

the same.

The comparison should demonstrate affordance rather than merely label one “good” and one “bad.”

## 13.2 Button hierarchy

Create a realistic action group showing:
- Primary;
- Secondary;
- Tertiary;
- Link/quiet treatment where the system uses it.

Then create a second version where all actions have equal emphasis.

The content and number of actions remain identical.

Annotate:
- which action should be noticed first;
- why equal-emphasis actions increase scanning/decision effort.

## 13.3 Destructive-action comparisons

Use a modal/dialog scenario.

Create three documentation examples:

1. **Overly aggressive**
   - a secondary/cancel-like action uses destructive styling unnecessarily.

2. **Neutral alternative**
   - use Secondary/Tertiary treatment where the action is not itself destructive.

3. **True destructive primary action**
   - deletion/removal/irreversible action uses the destructive family appropriately.

The examples should use actual Button and Modal/dialog primitives available to the generated system. If a Modal component is outside current scope, build a documentation-only composition from generic surface/text/button instances rather than introducing a new published component.

## 13.4 Icon live area / anatomy

Create an annotated diagram showing:
- icon component frame;
- visible glyph bounds;
- invisible live-area space;
- label baseline;
- resulting perceived gap when a raw icon frame sits beside text.

This diagram must use the generated icon family.

## 13.5 Button icon-padding problem

Create a Button using:
- leading icon;
- bare text;
- mathematically equal outer padding.

Annotate why it looks optically unbalanced.

Show measurement guides for:
- outer padding;
- icon frame;
- visible glyph;
- gap to text.

## 13.6 Padding accumulation

Create a diagram that breaks down the total perceived left/right spacing in an icon + label Button.

Show:
- root padding;
- icon live area;
- explicit item gap;
- label bounds.

The point is to show why simply using the same numeric outer padding on both sides can feel wrong.

## 13.7 Corrected Text-padding anatomy

Create the corrected Button construction:

```text
Button
├─ Leading icon
├─ Text padding
│  ├─ optical inset
│  ├─ Text
│  └─ optical inset
└─ Trailing icon
```

Show:
- Label only;
- Leading icon + label;
- Label + trailing icon;
- Leading + trailing icons.

Place them side by side and verify their labels appear optically centered.

This is a core anatomy explanation, not optional decoration.

## 13.8 Optional depth/effect treatment

Only include this module when the generated system uses non-flat elevation/depth.

Show:
- flat Button;
- selected depth treatment;
- effect-stack annotation.

Do not show a tactile/skeuomorphic style when the brand direction selected Flat.

## 13.9 Effect-stack anatomy

When effects are used, create a zoomed visual showing:
- border/stroke;
- outer shadow;
- inner highlight/inset effect where applicable;
- focus effect where applicable;
- effect token/style names.

## 13.10 Removing/changing effects globally

Create a before/after editor workflow:
- shared effect token/style selected;
- effect disabled/changed;
- multiple Button hierarchies updating.

The example must demonstrate centralized maintenance.

## 13.11 Button visual QA

Fail QA when:
- long-form Button documentation is prose-only;
- actionable vs ambiguous comparison is missing;
- hierarchy comparison is missing;
- destructive-action comparison is missing;
- icon live-area diagram is missing;
- incorrect-padding and corrected-padding examples are missing;
- Text-padding wrapper is not shown visually;
- effect examples are generated even when the selected visual direction is flat;
- visuals use different anatomy from the published Button master.
