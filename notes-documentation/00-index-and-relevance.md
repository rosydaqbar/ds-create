# Notes and Documentation — Complete Coverage + Relevance Map

This directory is the complete paraphrased audit of every long-form Notes/Documentation frame found in the reference file.

Nothing in the audited Notes/Documentation set is silently dropped. Every topic is recorded here first, then classified for a brand-agnostic design-system builder.

## Relevance levels

- **CORE** — include when the related Foundation/Base Component is generated.
- **CONDITIONAL** — include when that capability exists in the user's system or scope.
- **OPTIONAL EXTENSION** — useful design-system guidance, but outside the current Foundation + Base Component core.
- **ARCHIVE ONLY** — preserve in the audit for coverage, but do not generate into the agnostic system by default.
- **SOURCE-SPECIFIC / REMOVE** — the underlying topic is recorded, but source branding, marketing, pricing, licensing claims, URLs, and release-history claims are not carried into generated docs.

## Complete audited set

| # | Notes page | Relevance | Generator behavior |
|---|---|---|---|
| 1 | Variables | CORE | Generate system-variable guidance, modes guidance, tradeoffs, and dark-mode strategy. |
| 2 | Colors | CORE | Generate palette, accessibility, variable-maintenance, brand/neutral guidance. |
| 3 | Typography | CORE + CONDITIONAL resources | Generate typography principles and system-maintenance guidance; font recommendation catalog is optional. |
| 4 | Logos | CONDITIONAL | Generate when Logos/Brand assets are in scope. |
| 5 | Icons | CORE | Generate icon UX, library consistency, naming, overrides, export guidance. |
| 6 | Effect styles | CORE | Generate effect/focus/elevation guidance. |
| 7 | Spacing, radius & grids | CORE | Generate spacing-system, grid, optical-exception, line-length guidance. |
| 8 | Avatars | CONDITIONAL | Generate when Avatar family is in scope. |
| 9 | Buttons | CORE | Generate when Buttons are in scope. |
| 10 | Portfolio mockups | ARCHIVE ONLY | Shared presentation asset guidance, not design-system construction guidance. |
| 11 | Empty states | OPTIONAL EXTENSION | Application-component/UX guidance; include only if application components are later added. |
| 12 | Tables | OPTIONAL EXTENSION | Application-component guidance; include only if table/data-display scope is later added. |

## Material that must never be copied into generated agnostic documentation

Remove or rewrite:
- source product/library names;
- source marketing claims;
- source website/community links;
- source version history;
- “new feature/beta” claims that may age;
- source-specific counts of assets;
- source-specific license assurances;
- exact commercial font prices;
- endorsements of specific paid products;
- promotional calls to share/download/buy.

Preserve the underlying lesson instead.

## How to use these files

1. Audit file retains every observed topic in paraphrased form.
2. Related Foundation/Base Component spec points to the relevant audit file.
3. Generator includes all CORE topics for the selected scope.
4. CONDITIONAL topics are resolved from initiator answers.
5. OPTIONAL EXTENSION topics are not injected into Foundation/Base Component output unless that extension is explicitly selected.
6. ARCHIVE ONLY topics stay documented here for completeness but do not influence core generation.
