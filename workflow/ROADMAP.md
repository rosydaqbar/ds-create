# Roadmap

What ds-create plans to add or change next. Items move into the specs (and, when a system has a web implementation, into `kit/web/` and `workflow/WEB.md`) only when they are written to the same depth as existing pages. Nothing here is built by Initiate or Extend until its spec exists.

# 1. Coverage

## New levels and guidance

| Item | Why | Lands in |
| --- | --- | --- |
| Patterns: forms and validation, empty states, errors, loading, notifications, confirmation | Product teams need product-level guidance, not only components. Mature public systems lead with it. | a new `patterns/` level with a folder file and page template |
| Content guidance: voice and tone, writing labels, error messages, numbers and dates | Copy is part of every component; today it lives only in component Guidelines topics | `specs/guidance/03-content.md` |
| Accessibility guidance page | One place for the system-wide rules now spread over page specs | `specs/guidance/04-accessibility.md` |

## Components most systems ship that ds-create doesn't have yet

| Level | Components |
| --- | --- |
| Parts | Skeleton, Card / Tile |
| Components | Tabs, Breadcrumbs, Pagination, Accordion, Popover, Banner / Inline message, Toast |
| Sections | Dialog / Modal, Data table, Side navigation, Date picker, Empty state |

Each needs its page spec under the existing level, following `workflow/EXTEND.md` §4.

# 2. Planned renames (next major version)

Renames break instances in product files and props in code, so they wait for a major version and are listed here first.

| Where | Now | Planned | Why |
| --- | --- | --- | --- |
| 3.2 Text field, `.Main/Text field addon` `Type` | `stepper-vertical` | `stepper-split` | Since the target-size fix the − and + sit side by side, not stacked. |
| 3.2 Text field `Type` | `counter-vertical` | `counter-split` | Same reason; it uses `stepper-split`. |

# 3. Tooling

| Item | Status |
| --- | --- |
| Fast mode (`workflow/FAST.md`) | Built and run end to end on a new system (Figma: tokens, 19 Parts, 30 doc pages). Streamlined from that round (2026-10-15): library kit, set registry, packed cache kept between rounds, batch page calls, ledger tool, build flags, hash export and scope script for the site (`workflow/FAST.md` §10–§11). From the second round (2026-10-19): the token base refreshed before the docs data (F0), the cache, first batches and site preparation run while the docs-data agents write, 02 Tokens in a batch of its own, `K.arc` and strokes outside layout in the library kit, `pin-props` for the site. Next: story skeletons for the docs site from the manifests (the site's W4 is now the largest open cost); a declarative set builder from page specs (the library phase is still hand-written per set); a token generator from brand anchors for init. |
| `kit/tools/figma-audit.js` checks per page and per file | In use (QA gate). Next: check variant counts against each page spec's matrix, and doc frames bound to `doc/*`. |
| Binding documentation frames to `doc/*` spacing | Generated files leave many doc-frame paddings raw (the audit reports them as warnings). Fix in the Doc kit build step. |
