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
