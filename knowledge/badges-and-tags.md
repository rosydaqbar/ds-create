# Badges and tags

Small labels on a page: badges that show a status, a count or a category, and tags that hold values people manage.

## BA1 · Status, count and category are three jobs

One small label shape tends to get used for three different things: where something stands, how many there are, and what kind it is. When the three look and behave alike, the reader can't tell which question a label answers.

**An example**
- One row in a task list carries three labels:
  - "Blocked": the status, in a semantic tone with a dot;
  - "12" next to "Comments": a count;
  - "Design": a category, in a category color.
- One system ships these as three components. Another keeps a single badge and separates the jobs by tone and use. Both work.

**Why it works**
- **Each job answers its own question:**
  - A status says where the item stands. It changes with the item, and it asks for attention when something is wrong.
  - A count says how many. It changes often, and means something only next to what it counts.
  - A category says what kind. It hardly ever changes, and its only work is to separate groups.
- **Mixing them blurs priority:**
  - a category drawn in a warning color reads as a problem;
  - a status drawn in a decorative color reads as a topic;
  - a number with nothing next to it is just a number.
- **The packaging is a choice; the separation is not.** Three components or one with tones, the system keeps working as long as each job keeps its own look and its own rules.

**What to look for**
- For every badge on a page, you can say which of the three jobs it does.
- Statuses use the semantic tones. Categories use the category colors. The two never stand in for each other.
- Every count sits next to the thing it counts.

**Related specs:** `specs/parts/2.4-badge.md` (tones and the Overview compositions), `specs/parts/2.5-tag.md` (count tags), `specs/foundations/1.1-color.md` (semantic and category colors).
**Source:** research, approved by the maintainer, 2026-10-09

## BA2 · The word carries the meaning

A status shown by color alone fails a large share of readers. It also fails on a poor screen, in grayscale and in print.

**An example**
- A status column shows "Active", "Pending review" and "Failed", each in its tone with a dot. With the page turned to grayscale, the words still say everything.
- Red-green color deficiency affects about 1 in 12 men and 1 in 250 women of European descent.
- The text-contrast thresholds of accessibility guidelines, applied to a badge:
  - label text needs 4.5:1 against its own tinted fill;
  - a dot or an icon that stands alone, with no word next to it, needs 3:1.

**Why it works**
- **Color is fast to scan, but not reliable to name.** Two colors can look different to the reader while which one means what still has to be learned, and seen. A word reads the same for everyone, including screen readers.
- **Color then does what it is good at.** It speeds up scanning for the people who see it, on top of a meaning that already works without it.
- **The word has to be readable, because it does the work.**
  - Badge text is small, so it never gets the lower large-text threshold.
  - A tinted fill lowers contrast compared with a white surface, so every tone needs checking, in every mode, not just the default.
  - Ratios aren't rounded: 4.49:1 is a fail.
- **A dot beside a word is only support.** An icon or a dot with no word next to it carries the meaning alone, so it has to stand out on its own.

**What to look for**
- In grayscale, every status on the page is still clear.
- The label contrast is checked for each tone, in light and dark.
- No status is a dot or a color on its own. An icon-only badge is rare and has a text alternative.

**Related specs:** `specs/parts/2.4-badge.md` (choosing a tone, accessibility), `specs/parts/2.5-tag.md` (accessibility), `specs/foundations/1.1-color.md` (contrast checks).
**Source:** research, approved by the maintainer, 2026-10-09

## BA3 · A badge stays secondary

Badges pull the eye. When every row carries several, none of them stands out and the page turns noisy.

**An example**
- In one first-click test with about a thousand people, a red "1" on an app icon roughly doubled the share of people who tapped that app first: about 80% against 38%.
- One badge per item. A single "Completed" status can be enough: anything without it is not complete yet.
- Size, from smallest to largest:
  - a small badge in a dense table or navigation;
  - the default next to body text;
  - a large badge in a page header.
- One size per group.

**Why it works**
- **Attention is what a badge spends.** Each one added makes the others weaker.
- **People remember a small set of statuses.** A larger set has to be looked up every time it's seen.
- **Passive labels get missed when they compete.** Information that must not be missed belongs in a message, not in a badge.
- **A badge qualifies the thing beside it.**
  - Larger than its neighbour, it becomes the headline.
  - Mixed sizes in one group read as different levels of importance that aren't there.

**What to look for**
- The number of different statuses on one screen is small, and each one is needed.
- No row carries more than one or two badges.
- Nothing critical is said only by a badge.
- A badge's height matches the component next to it, and a group uses one size.

**Related specs:** `specs/parts/2.4-badge.md` (type, tone and size; content), `specs/components/3.8-badge-group.md`.
**Source:** research, approved by the maintainer, 2026-10-09

## BA4 · Removing a value is its own control

A removable tag puts a value and an action in one small shape.
- If the whole tag removes, people delete things by accident.
- If the × is tiny and has no name, people using a keyboard, a screen reader or a finger struggle to remove anything.

**An example**
- **The control:** an applied filter reads "Owner: Me ×". The × is a separate button named "Remove Owner: Me". With the tag focused, Backspace or Delete removes it too.
- **Focus:** after the removal, focus moves to the neighbouring tag.
- **Target size:**
  - Accessibility guidelines ask for targets of at least 24 × 24 px, or enough clear space that a 24 px circle centred on a smaller target touches no other target.
  - A 16 px × passes only by keeping that space free.
  - Touch platforms ask for 44 to 48.

**Why it works**
- **The value is information; the × is an action.** Keeping them apart means a tap on the words never removes anything.
- **The name says which value goes.** In a row of ten tags, "Remove" or "×" alone doesn't say which one.
- **The keys match how people edit text.** Backspace removes the thing before the cursor, in a field full of tags as in a line of words.
- **Focus moving to a neighbour keeps the person's place,** instead of throwing them back to the top of the page.
- **A × is drawn small, so its hit area has to be larger than its drawing,** or protected by empty space around it. Passing on spacing is a minimum, not a goal.

**What to look for**
- Only the × removes. The label never does.
- Every × has a name that includes its value.
- Nothing else clickable sits right next to a small ×.
- On touch, the hit area meets the platform minimum.

**Related specs:** `specs/parts/2.5-tag.md` (removable vs selectable, sizes, accessibility), `specs/parts/2.4-badge.md` (removable badges).
**Source:** research, approved by the maintainer, 2026-10-09
