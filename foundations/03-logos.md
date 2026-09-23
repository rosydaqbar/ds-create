# Logos

The Logos page is an asset canvas with multiple horizontal zones.

# Canvas region order

```text
Product logo / logomark zone     2400 header
Partner/company logo zone         2400 header
Press/featured logo zone          2400 header
Long-form documentation           1600 frame
```

# Product identity

Provide standalone reusable components for:
- `Logomark`
- `Logo` / full lockup

Use the user's supplied assets. Do not invent a logo unless explicitly requested.

# Partner/company logos

Use one component set when the product needs a library of external/company logos.

Observed axes:
- Company
- Style: Default / Badge
- Dark mode: False / True
- optional logo-text visibility boolean

Keep light/dark pairs aligned vertically for comparison.

# Press/featured logos

Use a separate component set when press/media logo assets are needed.

Observed axis:
- Company/publication

# Logo documentation

Required outline:
- logo assets as reusable image/style resources;
- usage/licensing note appropriate to supplied assets;
- changing placeholder logos;
- proportional resizing;
- extending the logo library;
- important usage notes.

Brand-agnostic rule: preserve the layout and component model while using only assets supplied or approved by the user.

# Notes & Documentation — Logos

Only generate this long-form guidance when Logo/Brand assets are in scope.

## Centralized logo assets

Repeated logo assets should be centrally managed.

The goal is that replacing one approved asset updates all dependent mockups/components.

### Required visual documentation

Create a before/after workflow:

```text
Shared logo asset
      ↓
Avatar/card/header/logo-cloud instances
```

Then show the same dependent instances after replacing the source logo.

Use the generated system's own placeholder/brand assets.

## Replacing placeholder logos

Document the actual workflow used by the generated system:
1. locate shared logo source/component/fill;
2. replace the asset;
3. preserve mask/container treatment;
4. verify dependent instances.

### Required visual documentation

Create an editor-style workflow example showing:
- original placeholder;
- source asset selected;
- replacement applied;
- multiple dependent instances updated.

## Optical sizing

Logos with identical bounding-box dimensions rarely have identical perceived size.

Wide, circular, condensed, tall, and irregular marks need optical adjustment.

### Required visual documentation

This section must contain a sequence of visual examples:

1. **Not optically resized**
   - multiple differently shaped logos forced to one identical raw dimension.

2. **Optically resized**
   - same marks adjusted to similar perceived visual weight.

3. **Sizing-height guide**
   - annotate the different actual heights used.

4. **Optical alignment lines**
   - show top/bottom visual alignment guides across the logo set.

These visual examples are mandatory because the point cannot be communicated well with prose alone.

## Licensing and third-party marks

Do not copy source-specific licensing assurances.

Generated guidance should state:
- use owned/approved brand marks;
- track third-party source/licensing where applicable;
- third-party marks remain owned by their respective owners;
- their presence in a mockup does not imply endorsement.

No visual promotional/logo-pack module should be generated unless the user supplied such a library.

## Logos documentation QA

Fail QA when:
- logo management is explained without a replacement workflow visual;
- optical sizing is explained without before/after comparison;
- all marks are simply normalized to one raw pixel height;
- generated docs include third-party promotional/logo-pack material that the user did not provide.
