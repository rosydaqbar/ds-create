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

# 4. Long-form effects documentation

Required outline:
- skeuomorphic-style components when relevant;
- removing skeuomorphic effects;
- focus styles;
- applying focus styles in Figma;
- updating shadow/effect variables.

Do not copy reference shadow values, blur radii, or fixed card dimensions unless they already exist in the user's system.

## Mandatory visible notes/documentation

The long-form effects documentation must be generated visibly in Figma.

Shadow/focus/blur specimen cards alone are not sufficient.

The notes must explain:
- the active elevation model;
- when shadows are appropriate;
- focus-ring behavior and accessibility;
- combined focus + shadow treatment;
- backdrop-blur constraints;
- how to remove or change depth globally;
- which styles/tokens are maintained centrally;
- do/don't examples for decorative overuse and low-contrast translucent surfaces.

An Effect Styles page without visible notes fails QA.
