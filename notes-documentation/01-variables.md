# Variables — Complete Notes Coverage

**Relevance:** CORE, with historical/platform-specific material rewritten or excluded from generated output.

## 1. Do we need variables?

Variables add scalability, theming, and closer design-development alignment, but also add setup and maintenance overhead.

Preserve these decision factors:
- variables make more sense for larger teams and mature token workflows;
- they are valuable when multiple modes/themes are a real requirement;
- simple products or small teams may prefer a lighter approach;
- adopting a token system merely because the feature exists is not a sufficient reason;
- inspect whether an existing variable/token architecture already exists before creating one.

The initiator must ask whether variables already exist, whether multiple modes are needed, whether code is already tokenized, whether brand overrides are required, and whether existing styles should be retained.

## 2. Dark mode without variable modes

Dark mode can also be represented through separate component/layout variants.

Preserve the tradeoff:
- variant-based dark mode is valid;
- it increases variant count and maintenance cost;
- variable modes usually scale better when dark mode is pervasive.

If the user declines variable modes but needs dark mode, allow the component-variant approach and document the maintenance tradeoff.

## 3. Variables versus styles

Variables and styles are not treated as mutually exclusive.

Preserve:
- variables store reusable single values;
- styles can package multiple visual properties;
- color/effect/text styles may reference variables;
- primitive variables can remain the source of truth while styles remain useful consumable assets.

Do not delete styles merely because variables exist.

## 4. Tooling capability and unsupported properties

The original material discusses feature maturity and unsupported properties.

Preserve only the durable rule:
- inspect current Figma support before assuming a property can be token-bound;
- when a property cannot be bound cleanly, document the fallback;
- do not create absurd numbers of primitives solely to work around a tooling limitation.

Do not preserve dated beta/release claims.

## 5. Extended collections / brand overrides

Preserve the concept of brand-specific overrides:
- if multiple brands/white-label themes are selected, establish override strategy during initiation;
- separate brand-level aliases from shared semantic/component structure;
- preserve component anatomy across brands where possible.

## 6. Modes for spacing and sizing

Do not create compact/comfortable/spacious modes simply by shifting every spacing value.

Preserve:
- density modes should solve a real product requirement;
- mechanically scaling every spacing token can produce cramped or overly loose layouts;
- one universal scale shift rarely captures component-specific needs;
- only create density modes when explicitly useful;
- document which values actually change.

## 7. Breakpoints as variable modes

Responsive behavior is often structural, not merely numeric.

Preserve:
- some spacing values stay the same across breakpoints while others change;
- typography changes selectively;
- components may change orientation/composition;
- modes do not replace real responsive layout decisions.

Do not create breakpoint modes that imply every token changes together.

## 8. Solid versus transparent neutral shades in dark mode

Preserve both approaches.

### Solid palette advantages
- direct hue/saturation control;
- stable/predictable contrast;
- fewer overlap/layering artifacts;
- easier reasoning when surfaces stack.

### Transparent-shade advantages
- easier recoloring across different surfaces;
- one alpha scale can adapt to multiple themes.

### Transparent-shade risks
- result depends on background;
- contrast varies;
- stacked borders/text/surfaces can blend unexpectedly;
- complex tables and overlays are harder to manage.

The builder should preserve an existing valid strategy or choose intentionally for greenfield systems.

## 9. Saturation control

Neutral-palette character is a brand decision.

Do not force one desaturated neutral. Support warm, cool, or flat neutrals while keeping semantic roles independent from primitive choice.

## 10. Accessibility and contrast stability

Alpha-based foregrounds can produce different contrast on different surfaces.

Test actual foreground/background combinations in every mode.

## 11. Layering issues with transparency

Overlapping borders, menus, modals, table rows, and stacked surfaces can reveal alpha-compositing artifacts.

Avoid Figma-only hacks that do not map cleanly to implementation.

## 12. Optional transparent-shade workflow

Preserve the workflow:
1. open/manage variables;
2. use the primitive collection;
3. add an alpha neutral ramp;
4. create a test mode;
5. map semantic roles;
6. test real designs;
7. remove the experimental mode if it is not useful.

Derive values from the active palette and contrast targets rather than copying one fixed ramp.

## 13. Resource guidance

Generated docs may link to current official Figma variable documentation.

Do not carry promotional/source-specific resources.
