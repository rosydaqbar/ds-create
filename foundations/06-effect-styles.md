# Effect Styles

# Canvas region order

```text
Shadows / core effects
→ Focus rings / combined effects
→ Backdrop blurs
→ Long-form documentation
```

Use the horizontal documentation-canvas grammar. Each region grows according to the number and complexity of effect styles.

# 1. Shadows

Show the project shadow/elevation styles as visual cards with:
- semantic/style name;
- resolved effect preview;
- effect-layer details where useful.

Use a private `_Shadow card` helper when useful.

The specimen card dimensions come from documentation specimen tokens.

# 2. Focus rings

Document separate groups for:
- single-layer focus rings;
- focus ring + shadow combinations;
- focus ring + shadow + subtle skeuomorphic treatment when the active system uses it.

Explain why combined styles are necessary when multiple effects must be applied together.

Use `_Focus ring card` helper specimens.

# 3. Backdrop blurs

Show blur scales as specimen cards.

Include light/dark or other active-mode examples where relevant.

Use `_Blur card` helper specimens.

# 4. Effects documentation

Required outline:
- skeuomorphic-style components when relevant;
- removing skeuomorphic effects;
- focus styles;
- applying focus styles in Figma;
- updating shadow/effect variables.

Do not copy reference shadow values, blur radii, or fixed card dimensions unless they already exist in the user's system.

# Notes & Documentation — Effect Styles

Keep only guidance that helps create and maintain the generated effect/focus system.

## Subtle depth is optional

The system may use:
- flat surfaces;
- subtle elevation;
- stronger layered elevation;
- a restrained tactile/skeuomorphic treatment.

The initiator's selected visual direction determines which effect recipes are generated.

Do not apply depth merely because the reference uses it.

### Required visual documentation

If non-flat elevation is selected, create a component comparison using generated Buttons/Cards:

- flat treatment;
- selected elevated treatment.

The same component/content must be used in both examples.

If flat is selected, show only the flat system and an optional “effect layer disabled” explanation where useful.

## Effect-stack anatomy

When elevation/depth is used, document its construction.

### Required visual documentation

Create an annotated effect-stack diagram showing:
- outer shadow layers;
- inner highlight/inset effect where used;
- stroke/border contribution;
- token/style names;
- mode-dependent color aliases.

Show the actual generated effect recipe, not generic shadow values.

## Removing/changing the effect treatment

The effect system must be centrally changeable.

### Required visual documentation

Create a before/after workflow:
- component using the selected effect;
- shared effect token/style edited or disabled;
- same component updated across multiple instances.

The visual should prove that effect treatment is centralized.

## Focus rings

Focus is not Hover.

The system must define visible focus treatment for keyboard/non-pointer navigation.

### Required visual documentation

Create a focus-ring specimen grid across:
- light surface;
- dark surface if supported;
- brand/tinted surface where relevant.

Use actual interactive components:
- Button;
- Input;
- Checkbox/Toggle or another control.

Annotate:
- focus token/style;
- ring thickness/offset concept;
- contrast relationship.

## Editing focus-ring variables/styles

If focus color/thickness is tokenized, create a workflow visual showing:
- focus source token/style;
- edit;
- propagation across multiple components.

If the tooling cannot token-bind one part of the effect, document the fallback explicitly.

## Shadow/effect color dependencies

Create a visual showing how palette changes affect effect colors.

Use:
- one elevated component;
- one focus state.

Show:
- original color tokens;
- updated palette;
- effect result after remapping.

## Effect Styles visual QA

Fail QA when:
- the notes are prose-only;
- selected elevation has no component example;
- effect-stack anatomy is not shown;
- focus is documented without actual focused controls;
- centralized effect editing is claimed but no propagation example is shown.
