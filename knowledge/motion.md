# Motion

The example used through this file: one motion set with three speeds. Each speed has an enter, which is a spring, and a quicker exit.

| Speed | Enter | Bounce | Exit | Used for |
| --- | --- | --- | --- | --- |
| Fast | 80 ms | none | 60 ms | hover, fades, tooltips, focus rings |
| Moderate | 160 ms | none | 120 ms | dropdowns, tabs, short travel, panels that must land exactly |
| Slow | 240 ms | slight (0.12) | 160 ms | dialogs, drawers, large surfaces |

These are one system's numbers, shown as an example. The reasoning below is what carries over.

## M1 · Time follows size

The bigger the thing that moves, and the further it travels, the more time it gets.

**An example**
- A hover, a tooltip or a focus ring gets 80 ms.
- A dropdown or a tab change gets 160 ms.
- A dialog or a drawer gets 240 ms.

**Why it works**
- **Small changes are feedback.** They answer the pointer, so they have to feel attached to it. A hover that takes noticeably long feels like the interface is lagging behind the hand.
- **Large surfaces change the whole scene.** A dialog covers the page, and a drawer slides across it. The eye needs a moment to follow where it came from. Too fast, and it reads as a jump cut rather than a movement.
- **Medium things sit in between.** A dropdown is bigger than a hover state but smaller than a dialog, and its time sits between theirs.
- **Size decides, not the component's name.** Drawers appear in both the moderate and the slow group of the example. A short side panel that must land exactly behaves like a dropdown. A full-height drawer behaves like a dialog. *(Interpretation.)*

**What to look for**
- Rank everything that moves on a page from smallest to largest. Their times should rank the same way.
- Nothing small feels slow, and nothing large appears in a flash.

## M2 · Precise things don't bounce

A little bounce gives weight to large surfaces. Things that must land in an exact place get none.

**An example**
- The moderate speed has no bounce: dropdowns, tabs, and panels that must land exactly.
- The slow speed has a slight one (0.12): dialogs, drawers, large surfaces.
- The fast speed has none: fades and hover states don't travel, so there is nothing to bounce.

**Why it works**
- A dropdown sits against its trigger, and a tab indicator sits under its tab. An overshoot puts them past their place for a moment and then pulls them back. That reads as wobble or misalignment, and they open many times a day.
- A large surface arriving with a slight settle feels like a real object with weight coming to rest. The bounce is small enough to feel natural rather than playful.

**What to look for**
- Anything anchored to another element (a menu, an indicator, a popover) lands without overshoot.
- Any bounce is reserved for big surfaces, and you would only notice it if it were missing.

## M3 · Leaving is faster than arriving

Exits are shorter than enters, and they never bounce.

**An example**
- Each exit is about two-thirds to three-quarters of its enter: 60 after 80, 120 after 160, 160 after 240.
- The exit is a plain, even movement, not the enter's spring.

**Why it works**
- When something arrives, the person needs to see what appeared and where, and that takes attention.
- When something leaves, the person has usually decided it should go: they closed it, picked an option, or clicked away. Their attention has already moved on. A slow exit stands between them and what they want next.
- A bounce on the way out looks like the element resisting being dismissed.

**What to look for**
- Closing a menu or dialog feels quicker than opening it.
- Nothing overshoots on its way out.

## M4 · Motion can be interrupted, and never cut short

**An example**
- Enters use springs.
- When content is removed after its exit, it is removed only once the exit has finished, plus a short buffer (100 ms).

**Why it works**
- People change their minds mid-movement: the pointer leaves before a hover has finished, or a menu is closed while it is still opening. A spring carries its current speed into the new direction, so the change feels continuous instead of restarting from zero. *(Background reasoning: the example names springs, but doesn't explain them.)*
- If content disappears before its exit has played, the exit looks cut off. Removing it only after the exit, with a small margin, lets the exit finish every time, even on a slow device.

**What to look for**
- Moving the pointer quickly in and out of something never makes it jump.
- No exit ends in a sudden disappearance.

## M5 · Feedback doesn't move its neighbors

Hover feedback changes the element itself, never the layout around it.

**An example**
- When a label gets bolder on hover, the change happens without reflowing the text around it.

**Why it works**
- Bolder text is wider. Without care, a hover pushes the next items sideways, and the layout shivers as the pointer moves along a row.
- Feedback should say "this one" without disturbing anything else.

**What to look for**
- Moving the pointer along a menu, tabs or a list leaves everything else perfectly still.

**Related specs:** `foundations/1.6-motion.md`. The spec sets the system's own durations and easings, pairs them by purpose and makes exits faster than enters. This file explains the reasoning behind those choices with a different set of numbers.
**Source:** maintainer, 2026-10-09
