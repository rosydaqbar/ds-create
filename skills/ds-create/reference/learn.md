# `/ds-create learn`

Keeps a rule the user teaches about their system, applies it to what is already built, and makes every later build follow it. Runs when the user calls it, and whenever the user states a lasting rule in chat (`SKILL.md`, *Routing*).

**Load:** the global set (`SKILL.md` §1), `input/README.md` (I3, I7, §4), the files in `input/{slug}/knowledge/`, and the ledger. Then the page file and copy file of each page the rule touches.

# 1. Is it knowledge?

| The user says | It is | Goes to |
| --- | --- | --- |
| a lasting rule for this system: how something looks, behaves, reads or is named, a brand constraint | system knowledge | `input/{slug}/knowledge/` and `chat/` |
| a one-off change ("make this frame wider", "fix this typo") | a request | `chat/` only, then do it |
| design reasoning for every system, from the maintainer's experience | design knowledge (rationale, not rules) | `knowledge/{topic}.md` at the repo root, only when the maintainer asks, never during a build (`knowledge/README.md`) |
| a rule about ds-create itself (its process or tools) | a repo change | the repo, only when the maintainer asks (`input/README.md` I3) |

When it is unclear whether the user means "always" or "this once", ask in one line.

# 2. Record it (same turn)

1. **Chat.** The user's words, verbatim, in `chat/YYYY-MM-DD.md` (I3).
2. **Find its home.** The page it is about (`input/{slug}/knowledge/{id}-{name}.md`, with the id and name of the page in the build sequence), or `input/{slug}/knowledge/system.md` when it holds across the system.
3. **Check what it touches.** List every page and the docs site that the rule affects: the page itself, the pages that instance it (`specs/parts/00-parts.md` §3, the *Composition* section of each page file), and the Layouts and Screens that use it.
4. **Check for conflicts.**
   - With an earlier entry: the new rule replaces it (`Replaces K{m}`, and the old one gets `Replaced by K{n}`).
   - With a hard requirement (a contrast minimum, a target size, a gate, a frozen value): say what it breaks, with the fact, and ask. Apply it only after the user confirms, and record the confirmation on the entry and, for an audit check, as an approved exception (`workflow/INITIATOR.md` Part B, *Gates*).
5. **Write the entry** in the format of `input/README.md` §4, with the next free `K` number, `Status: pending`. Update the *Knowledge* table in `sources.md`.

# 3. Apply it

For each built page it touches, in build-sequence order:

1. **Figma.** Change the components, examples and doc frames so they follow the rule. Changing an existing value of a frozen system needs the user's explicit OK, which the rule itself is when it names that value.
2. **Copy.** When the page's text should say it (a guideline, a do and don't, a usage note), change the line in the page's copy file and apply it to Figma (`workflow/COPY.md` §6).
3. **Docs site.** When the site exists, update the page's data and copy, and the component code when the rule changes behavior or a default. Run `npm run build`.
4. **Checks.** None here: the audit and the copy check run on call through `qa` (`workflow/INITIATOR.md` Part B, *QA on call*).
5. **Status.** `applied YYYY-MM-DD: {what changed, where}`. The ledger entry of each page lists the knowledge file under `loaded`.

A page that isn't built yet keeps `pending`; its build step applies the rule.

When `learn` runs in the middle of a build, record the rule, apply it to the pages already done, and carry on. The page being built follows it from now on.

# 4. Report

```text
Learned      K{n} · {rule} ({file})
Applied to   {pages, with links} · docs site {updated | not built}
Pending      {pages not built yet, which follow it when built}
Replaced     {K{m}, or none}
Checks       not run (on call: /ds-create qa)
```
