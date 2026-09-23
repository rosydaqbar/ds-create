# Colors — Complete Notes Coverage

**Relevance:** CORE.

## 1. Getting colors right

Color influences brand personality, emotional tone, hierarchy, first impression, usability, and accessibility. Treat the color system as functional infrastructure, not decoration.

## 2. Defining a color palette

A deliberate palette coordinates roles rather than allowing arbitrary picker choices.

Required role groups:
- neutral colors;
- brand/primary colors;
- accent/supporting colors;
- semantic feedback colors.

### Neutral colors
Used throughout text, borders, form controls, backgrounds, dividers, and structural UI.

### Brand colors
Used for interactive emphasis and recognizable brand expression.

### Accent colors
Support the primary palette and help with categories, badges, labels, charts, and secondary emphasis.

### Feedback/semantic colors
Cover error/destructive, warning/caution, success/positive, and other state feedback.

Exact hues/scales are brand-dependent; roles stay stable.

## 3. Choosing additional colors

Product UI needs enough tonal steps for states and surfaces.

Preserve:
- choose palettes with enough useful shades;
- additional colors should solve practical semantic/component needs;
- do not add colors only because they look interesting.

Third-party palette-generator links are not core documentation.

## 4. Define the color system before designing

Preserve:
- unrestricted color-picker use creates inconsistency;
- define primitives and semantic roles early;
- tokenized choices make developer handoff clearer;
- larger systems will eventually need states/shades;
- avoid one-off values accumulating.

## 5. Avoid excessive neutral choices

Too many nearly identical neutrals create decision fatigue.

Use a deliberate scale and establish repeated role patterns for text, borders, dividers, surfaces, and disabled states.

The exact count is not hard-coded.

## 6. Color accessibility

Design for low vision, older users, color-vision differences, and poor displays.

Preserve:
- test text and important controls on real backgrounds;
- accessibility is not optional polish;
- color cannot be the sole carrier of meaning.

## 7. Contrast targets

Use current WCAG guidance rather than frozen source wording.

Document targets for:
- normal text;
- large text;
- interactive controls;
- focus indicators;
- non-text essential graphics when applicable.

## 8. Testing contrast

Automated checks are useful, but test actual context combinations.

Include contrast QA in generated Foundation documentation.

## 9. Changing the palette through variables

Workflow:
1. edit primitive variables;
2. allow semantic aliases to cascade;
3. update palette families coherently;
4. avoid component-by-component recoloring.

## 10. Primitive collection as source of truth

Semantic roles reference primitives.

Avoid raw component colors when a token exists.

## 11. Change related palettes coherently

During rebranding, update complete families and then run component/state QA.

## 12. Shadow/effect color dependencies

Shadows combine color and opacity and may need special handling.

Preserve:
- centralize effect color/opacities;
- avoid hundreds of artificial alpha primitives;
- document manual fallback where tooling cannot express the desired alias.

## 13. Changing brand color

Remap brand primitives/aliases centrally. Do not manually switch every component.

## 14. Neutral palette and brand feel

Neutral hue/saturation strongly affects perceived warmth, coolness, cleanliness, and product character.

Treat neutral selection as a brand decision.

## 15. Updating neutral palette

Change neutral primitives centrally, preserve semantic aliases, optionally adjust hue/saturation, then rerun contrast/component QA.

## 16. Generated long-form documentation

When Colors are in scope, include:
- palette-role examples;
- semantic feedback examples;
- contrast examples;
- primitive → semantic alias diagram;
- rebrand/update workflow;
- neutral-palette comparison;
- accessibility QA.

Do not include source palette history or promotional links.
