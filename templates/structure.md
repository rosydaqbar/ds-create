# Structure template

The structure every generated Figma page follows, whatever it documents: design-system pages, guidance, or any other documentation. It fixes only the levels, how they are arranged, spacing and names. Which frames a page has, which blocks a frame has, and what the items are always come from the spec of the thing being built.

```text
Page
└─ Frame × n        one per job, as many as the spec lists (one, two, ten…), side by side
   └─ Block × n     one per topic inside that job, as many as the spec lists
      └─ Items      the things the block shows
```

In this repo: SYSTEM.md Part A gives each page's frames; the page's own file (README §3) says what each frame holds.

## 1. Page

A page holds frames, and nothing else.

```text
x = 0
┌─────────┐        ┌─────────┐                ┌─────────┐
│ Frame 1 │ ← 160 →│ Frame 2 │ ← 160 → … ← 160 →│ Frame n │
│         │        │         │                │         │
└─────────┘        │         │                └─────────┘
                   └─────────┘
```

`n` is the number of frames the spec lists for that page. There is no fixed count: a page may have one frame or many, and two pages need not have the same number.

- **One frame per job.** Each frame does one job for its reader. What the jobs are comes from the spec.
- **Different job, different frame.** Content that serves another job goes in its own frame, never into another frame's blocks. When the spec adds something that fits no existing frame's job, it gets a new frame; it is not appended to an existing one.
- Frames sit in one row, left to right, in the order the spec gives, all at `y = 0`. `x` of a frame = `x` of the previous frame + its width + `doc/space/canvas` [160]. After any change, place them again so they never overlap.
- Nothing else sits on the page canvas: no loose text, instances or component sets outside a frame.

## 2. Frame

A frame is one of two kinds; the spec says which.

**Documented frame**: header, blocks, footer.

```text
┌──────────────────────────────────── Frame ────────────────────────────────────┐
│ ┌─ Header ──────────────────────────────────────────────────────────────────┐ │
│ │ [▣] {breadcrumb}                                         {system · ver}   │ │
│ │ {Title}                                                                   │ │
│ │ {Description}                                                             │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│   Block                                                                       │
│   {Block title} [badge]                                                       │
│   {Block description}                                                         │
│   ┌───────────────────────────────────────────────────────────────────────┐   │
│   │ items                                                                 │   │
│   └───────────────────────────────────────────────────────────────────────┘   │
│   ─────────────────────────────────────────────────────────────────────────── │
│   Block                                                                       │
│   …                                                                           │
│                                                                               │
│ ┌─ Footer ──────────────────────────────────────────────────────────────────┐ │
│ │ [▣] {system} — {description}                               {meta}        │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────────────────┘
```

```text
{frame name}                FRAME     V   1440   hug   0       0       fill doc/surface/base, clip off
├─ Doc/Header               INSTANCE  —   fill   hug
├─ Body                     FRAME     V   fill   hug   64      64
│  ├─ Block · {name}        FRAME     V   fill   hug   0       32
│  │  ├─ Doc/Block note     INSTANCE  —   720    hug                    Title, Badge (optional), Description (optional)
│  │  └─ Items              FRAME     V   fill   hug                    §4
│  ├─ Divider               LINE      —   fill   1                      fill doc/border/subtle
│  └─ Block · {name} …                                                  one Divider between every two blocks
└─ Doc/Footer               INSTANCE  —   fill   hug
```

**Bare frame**: only its items, no header, blocks or footer, at the fixed size the spec gives.

```text
{frame name}                FRAME     —   {spec W}   {spec H}   fill as the spec says
└─ Items                    the things the spec puts in it
```

Both kinds: nothing shrinks to fit; when items are wider or taller than a documented frame, the frame grows.

## 3. Block

One topic inside a frame's job: a block note, then its items. Blocks appear in the order the spec gives. A block with no items is not built.

## 4. Items

Items are the things a block shows, exactly as the spec describes them: for example components and their variants, instances, compositions of instances, tokens, styles, assets, specimens, diagrams, tables, images and text. Each item is built and placed as the spec says; the structure adds only the block note above them and the spacing.

## 5. Spacing

| Between | Token | Default |
| --- | --- | --- |
| frames on the page | `doc/space/canvas` | 160 |
| frame edge and body content; block and block | `doc/space/frame` | 64 |
| block note and its items | `doc/space/block` | 32 |

## 6. Names

| Layer | Name |
| --- | --- |
| Page | as the spec gives it |
| Frame | `{page name} · {frame name}` as the spec gives it; private building blocks: `.Main` |
| Block | `Block · {block title}` |
| Items | `Items` |

## 7. Structure components

Part of the template; they live on `9.1 Doc kit` and bind only to `doc/*` variables and the brand's text styles (`workflow/DOCFRAMES.md` §1).

```text
Doc/Header           COMPONENT  V  fill  hug   pad 64 64 0 64
└─ Card              FRAME  V  fill  hug   pad 40   gap 40   fill doc/surface/header, radius doc/radius/surface
   ├─ Top row        FRAME  H  fill  hug   gap 12   align center
   │  ├─ Mark        INSTANCE  doc/mark, 32
   │  ├─ Breadcrumb  TEXT  fill   type/body/sm/medium, doc/text/tertiary
   │  └─ System      TEXT  hug    type/body/sm/regular, doc/text/tertiary
   └─ Heading row    FRAME  H  fill  hug   gap 40   align bottom
      ├─ Heading     FRAME  V  720  hug   gap 12
      │  ├─ Title        TEXT  type/heading/xl/semibold, doc/text/primary
      │  └─ Description  TEXT  type/body/lg/regular, doc/text/secondary
      └─ Resources   FRAME  V  hug  hug   gap 8      optional

Doc/Footer           COMPONENT  V  fill  hug   pad 0 64 64 64   gap 24
├─ Divider           LINE  fill  1   doc/border/subtle
└─ Row               FRAME  H  fill  hug   gap 24   align center
   ├─ Mark           INSTANCE  doc/mark, 24
   ├─ Description    TEXT  fill   type/body/sm/regular, doc/text/secondary
   └─ Meta           TEXT  hug    type/body/sm/regular, doc/text/tertiary

Doc/Block note       COMPONENT  V  720  hug   gap 8
├─ Title row         FRAME  H  hug  hug   gap 8   align center
│  ├─ Title          TEXT  type/heading/md/semibold, doc/text/primary
│  └─ Doc/Badge      INSTANCE   optional
└─ Description       TEXT  fill   type/body/md/regular, doc/text/secondary   optional

Doc/Badge            COMPONENT  H  hug  hug   pad 2 8   radius doc/radius/badge, stroke doc/border/subtle 1
└─ Label             TEXT  type/body/xs/medium, doc/text/secondary
```
