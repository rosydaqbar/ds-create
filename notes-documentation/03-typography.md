# Typography — Complete Notes Coverage

**Relevance:** CORE principles + CONDITIONAL resource catalog.

## 1. Good typography

Typography is foundational to readability, usability, hierarchy, attention, and perceived product quality. Poor typography harms UX even when users cannot articulate why.

## 2. Display versus text styles

Display styles are for large headings. Text/body styles serve body copy, labels, menus, lists, and UI.

Do not use display styles for long reading passages merely for prominence.

## 3. Base font size

Establish a deliberate base size for product UI.

Around 16px is a common starting point, not an immutable rule. Evaluate legibility on real devices and at realistic viewing distance.

## 4. Line height

Line height depends on typeface and size.

Preserve:
- body copy usually needs proportionally more line height;
- display text generally tightens as size grows;
- test visually rather than applying one ratio universally.

## 5. Letter spacing for display text

Preserve:
- large display text may benefit from tighter tracking;
- subtle adjustment is preferable to aggressive tracking;
- design/code representations of tracking may differ.

## 6. Choosing the right typeface

Choose for:
- product context;
- brand;
- screen legibility;
- character clarity;
- language/glyph coverage;
- licensing.

Do not chase novelty over usability.

## 7. Weight coverage

Verify that the actual brand font supports the weights required by the semantic typography system.

Do not invent unavailable weights. Define a fallback mapping where necessary.

## 8. Keep type selection simple

One strong family is often enough. Introduce a second only for a clear brand/content reason.

## 9. Discovering/evaluating typefaces

Preserve the evaluation approach:
- inspect strong digital products as references;
- test realistic UI content;
- verify licensing;
- compare free and paid options based on product need.

Do not embed source endorsements.

## 10. Fewer fonts are best

Default to one family; use two only when justified. Use weight/style range before adding another family.

## 11. Changing typography centrally

Workflow:
1. edit typography variables/tokens or source styles;
2. update family, weights, sizes, line heights, tracking;
3. ensure text styles reference correct tokens where supported;
4. cascade to components;
5. verify overflow and geometry.

## 12. Variables versus text styles

Typography variables can be a source of truth while text styles remain useful consumable bundles.

Preserve existing valid style-only systems if the user chooses to keep them.

Do not carry dated performance/beta claims as permanent rules.

## 13. Free typeface examples

The audited notes include several widely used free UI families.

Builder adaptation:
- do not hard-wire them;
- if no brand typeface exists, recommend current options only after checking license/availability;
- prioritize screen legibility and weight coverage.

## 14. Commercial typeface examples

The audited notes include a long catalog of commercial UI families.

Builder adaptation:
- do not reproduce price lists;
- do not recommend paid fonts by default;
- research current licensing when typography discovery is explicitly requested.

## 15. Typeface discovery resources

The audited notes cover:
- curated typography/editorial references;
- examples of fonts in real products;
- free font directories;
- subscription libraries;
- marketplaces.

These are optional resources, not core generated system documentation.

## 16. Typography QA

Generated docs should demonstrate:
- body and display usage;
- base text specimen;
- line-height comparisons;
- display tracking;
- weight coverage;
- long paragraph readability;
- localization/long-word stress;
- fallback behavior;
- 200% text when accessibility scope requires it.
