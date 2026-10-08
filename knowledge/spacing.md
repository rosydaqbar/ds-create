# Spacing

## S1 · Everything on a 4 px base

Spacing picked by feel drifts: 5 here, 7 there, 15 on the next screen. A small base unit, with every space a multiple of it, removes those choices and makes the whole system feel even.

**An example**
- Base 4. The spaces are 4, 8, 12, 16, 20, 24, 32 and so on.
- Half a unit (2) is kept only for small optical fixes.
- The button in `buttons.md` (B1) sits on this grid:
  - its label frame has 4 (1×);
  - the button has 12 padding (3×);
  - so the text is 16 from the edge (4×).

**Why it works**
- **Fewer decisions.** With one base, a designer picks between a handful of steps instead of any number. Two people spacing the same card land on the same values, and designers and developers talk in the same numbers.
- **Fine enough for small parts.** 4 is small enough for the tight places inside controls: the gap between an icon and its label, padding in a tag, the frame around a button label. An 8 px base forces those to 8 or 0, and small components then look either loose or cramped.
- **Crisp on every screen.** Multiples of 4 stay whole pixels at the common screen densities: 1×, 1.5× (4 → 6), 2×, 3×, and 0.75× (4 → 3). Edges land on pixels instead of being smeared across two. A half unit (2) becomes 1.5 at 0.75×, which is one reason it's kept for fine fixes only.
- **One rhythm with type.** When line heights are multiples of 4 as well (16, 20, 24), text and spacing share one rhythm, and a stack of text and components lines up without nudging.

**What to look for**
- Every padding, gap and margin in a component is a multiple of the base, or a named half-step used for an optical fix.
- No odd values (5, 7, 15) unless they are a deliberate optical adjustment, named as one.

## S2 · Small steps close, large steps far apart

The scale grows by small steps at the small end and by big jumps at the large end.

**An example**
- At the small end, steps are 4 apart: 4, 8, 12, 16, 20, 24.
- At the large end they jump: 32, 40, 48, 64, 80, 96, 128.

**Why it works**
- The eye notices differences relative to size. 4 against 8 is a clear change, while 96 against 100 looks identical.
- Close small steps give fine control inside components. Larger jumps keep the big steps, used between page sections, clearly different from each other. A scale that grew by 4 all the way up would offer dozens of large values no one could tell apart.
- Naming the steps by size (`xs`, `sm`, `md`…) rather than by value lets the numbers change later without renaming anything.

**What to look for**
- Neighboring sections never differ by a step so small that the difference looks like a mistake.
- Inside a component, the steps chosen are distinguishable at a glance: a gap and the padding around it read as intentionally different or intentionally equal.

**Related specs:** `specs/foundations/1.3-space-and-layout.md` (§1 the default scale and its multiples of the base, §2 the base unit and the scale). The spec keeps the existing system's or product's own scale first, and doesn't assume every brand uses a base of 4.
**Source:** maintainer, 2026-10-09
