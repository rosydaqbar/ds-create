# Knowledge

The reasoning behind the specs, from the maintainer's experience building design systems. The specs say what to build; this folder says why it works, with examples from real work.

**Rationale, not rules.** Nothing here is a guideline to follow. The numbers in an example belong to that example: they show the idea at work, and are never values to copy. What a build makes is decided by the specs (`specs/SYSTEM.md`, `workflow/`, the page files) and by the system's own inputs.

**Growing, not finished.** A principle is what is known so far, not a closed answer. Writing it down once doesn't make it complete. It keeps growing as more is learned:
- a new example from another system;
- a sharper reason;
- a case where it doesn't hold;
- new evidence that confirms it, narrows it or argues against it.

How a principle grows:
- Its id and its place stay the same, so everything that points to it still works.
- What was there is kept. An addition never quietly replaces the maintainer's words or numbers; a correction is made only when the maintainer agrees to it.
- When it outgrows one idea, the new part becomes its own principle, and the two mention each other.
- Its Source line lists every addition with its date.

This folder is agnostic: principles only, no brand, no product, no client file, and no named reference. What a system's user teaches about their own system goes to `input/{slug}/knowledge/` (`input/README.md` I7).

# 1. How it is used

- **To understand a spec.** When a spec rule looks arbitrary, the matching topic here explains the reasoning behind it, so the rule is applied with its intent rather than to the letter.
- **To write the "why" in the docs.** This is the main use. Before a page's copy is written, its topics here are read, and their reasoning becomes the page's own explanation: in the system's words, with its own values, as if a designer who knows the craft wrote it (`workflow/COPY.md` §1). The docs never name this folder, a principle id or a file, never cite it, and never copy its sentences or example numbers. `kit/tools/copy-guard.mjs` checks it.
- **For a judgment call where the specs are silent.** The reasoning helps choose. The choice is noted in the build notes as a judgment, with the topic it leaned on.
- **Never as an override.** A spec, the system's knowledge (`input/{slug}/knowledge/`) and frozen values all come first. When an example's numbers differ from a spec, that's expected, not a gap.
- **When it is read.** The index (§3) is part of the global set (`workflow/INITIATOR.md` Part B §0). A topic file is read when its pages are built, or when a judgment call needs it.
- **Who writes it.** Only the maintainer, or the agent when the maintainer asks. An entry can also come from researched evidence the maintainer approved, finding by finding; its Source line says so. A build never adds to it (`skills/ds-create/SKILL.md`, *No repo edits during a build*). A build lesson about tools or the Figma API goes to `workflow/GOTCHAS.md`. A lesson about design craft is offered to the maintainer for this folder.
- **Turning talk into entries.** The maintainer can just explain, in any language, or paste notes or code. The agent:
  - writes up the reasoning in the format of §2, not the technology behind it;
  - keeps the maintainer's numbers as the example;
  - marks anything it inferred;
  - leaves out the names of products, libraries and authors it came from.

# 2. Format

One file per topic (`buttons.md`, `motion.md`). Images go in `assets/`, named after the topic. Each principle has a stable id: the topic's letter and a number (`B1`, `M1`), never reused.

```markdown
# {Topic}

## {ID} · {the principle in a few words}

{The problem, in one or two sentences.}

![{what the image shows}](assets/{topic}-{name}.png)

**An example**
{one concrete case with its numbers, presented as an example}

**Why it works**
{the visual or human reasoning, in plain words}

**What to look for**
- {how you can tell, on a built page, whether the idea holds}

**When it doesn't hold** (optional, usually added as the principle grows)
- {a case where the reasoning stops applying, and why}

**Related specs:** {the spec files where this reasoning shows up}
**Source:** {who}, YYYY-MM-DD · {who}, YYYY-MM-DD (one entry per addition; who = maintainer, or research, approved by the maintainer)
```

# 3. Index

| Topic | File | Principles | Related specs |
| --- | --- | --- | --- |
| Badges and tags | `badges-and-tags.md` | BA1 Status, count and category are three jobs · BA2 The word carries the meaning · BA3 A badge stays secondary · BA4 Removing a value is its own control | `specs/parts/2.4-badge.md`, `specs/parts/2.5-tag.md`, `specs/components/3.8-badge-group.md` |
| Buttons | `buttons.md` | B1 Visually balanced padding | `specs/parts/2.1-button.md`, `specs/components/3.1-button-group.md`, `specs/components/3.7-social-button.md` |
| Color | `color.md` | C1 When the brand doesn't choose, think in OKLCH · C2 Lightness you can trust · C3 Mind the screen | `specs/foundations/1.1-color.md` |
| Motion | `motion.md` | M1 Time follows size · M2 Precise things don't bounce · M3 Leaving is faster than arriving · M4 Motion can be interrupted, and never cut short · M5 Feedback doesn't move its neighbors | `specs/foundations/1.6-motion.md` |
| Radius | `radius.md` | R1 Inside a rounded shape, the inner radius is smaller · R2 Radius grows with size · R3 Borders change the curve · R4 Radius sets the tone · R5 Round with intent | `specs/foundations/1.4-shape.md` |
| Spacing | `spacing.md` | S1 Everything on a 4 px base · S2 Small steps close, large steps far apart | `specs/foundations/1.3-space-and-layout.md` |
