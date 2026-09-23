# Video Players

Video player components provide realistic video-preview and playback-control mockups.

# 1. Page regions

```text
Private controls
├─ _Video action button
├─ _Video action tooltip
├─ _Video volume slider handle
├─ _Video volume slider
├─ _Video actions bar
├─ _Video overlay action
└─ _Video timestamp indicator

Published
└─ Video player 16:9
```

# 2. Action button

Private set: `_Video action button`

Observed:
- 36 variants.

Properties:
- Type:
  - Play
  - Pause
  - Fast backward
  - Fast forward
  - Skip backward
  - Skip forward
  - Volume none
  - Volume min
  - Volume max
  - Video minus
  - Video plus
  - AirPlay
  - Minimize 01
  - Maximize 01
  - Maximize 02
  - Minimize 02
  - Playback speed
  - Subtitles/CC
- State: Default / Hover

Anatomy:

```text
_Video action button
layout: centered square
├─ action icon / speed content
└─ _Video action tooltip               hover/documentation state
```

All toolbar actions reuse this control.

# 3. Action tooltip

Private set: `_Video action tooltip`

Properties:
- Badge: False / True

Anatomy:

```text
_Video action tooltip
└─ Content
   ├─ Text
   └─ shortcut Badge                    optional
```

Use the Badge to show keyboard shortcuts such as Space.

# 4. Volume slider

Private set: `_Video volume slider`

Properties:
- State: Default / Hover

Anatomy:

```text
_Video volume slider
layout: Horizontal
├─ _Video action button                 volume icon
└─ _Video volume slider handle
```

Volume-handle set:

`_Video volume slider handle`

Properties:
- Volume: 0% / 25% / 50% / 75% / 100%

Anatomy:

```text
Volume slider handle
├─ Progress line
└─ Control handle
```

# 5. Actions bar

Private set: `_Video actions bar`

Properties:
- Timestamp indicator: Boolean
- Playing: False / True
- Size: sm / md / lg

Representative lg anatomy:

```text
_Video actions bar
layout: Vertical
padding-top creates overlay fade/control zone

└─ Content
   layout: Horizontal
   ├─ _Video action button              play/pause
   ├─ _Video volume slider
   ├─ Video progress                    Fill
   │  ├─ Timestamp start
   │  ├─ Progress slider                Fill
   │  │  ├─ Buffering progress
   │  │  └─ Progress line
   │  └─ Timestamp end
   ├─ _Video action button              playback speed
   ├─ _Video action button              AirPlay
   └─ _Video action button              maximize/minimize
```

Progress region is the flexible child; action controls remain fixed.

# 6. Overlay action

Private set: `_Video overlay action`

Properties:
- Paused: False / True
- State: Default / Hover

Anatomy:

```text
_Video overlay action
└─ central Button
   └─ play/pause icon
```

It overlays the video preview rather than affecting aspect-ratio layout.

# 7. Timestamp indicator

Standalone private component: `_Video timestamp indicator`

Anatomy:

```text
Timestamp indicator
├─ Video preview wrapper
│  └─ Video preview 16:9
├─ Timestamp indicator
│  ├─ current time
│  ├─ divider
│  └─ total time
└─ indicator line / cursor
```

Used as a hover/scrub preview specimen.

# 8. Published player

Published set: `Video player 16:9`

Observed:
- 6 variants.

Properties:
- Overlay action: Boolean
- Actions bar: Boolean
- Size: sm / md / lg
- Playing: False / True

Anatomy:

```text
Video player 16:9
aspect-ratio container

├─ media/video preview
├─ _Video overlay action                optional
└─ _Video actions bar                   optional
```

The 16:9 media frame is the base. Controls overlay the media rather than adding vertical layout height.

# 9. Matrix requirements

Show:
- all player sizes;
- Playing false/true;
- overlay/action-bar combinations;
- all action-button types/states;
- volume percentages;
- actions-bar sizes/states.


# Documentation

The Figma page must visibly document:
- when video/media playback is appropriate;
- 16:9 media frame → overlay action → actions bar anatomy;
- reusable action button, volume slider, timeline, tooltip, and timestamp helpers;
- Playing, overlay, controls, size, caption, volume, and progress behavior;
- why controls overlay media instead of changing the 16:9 layout height;
- keyboard controls, caption availability, focus, accessible labels, and reduced-motion/autoplay considerations;
- do/don't examples for intrusive autoplay, controls outside the media frame, and individually redrawn action buttons;
- central maintenance through private media-control helpers and alpha/semantic tokens.

A player matrix alone fails documentation QA.

# 10. QA

Fail QA when:
- action buttons are individually drawn inside the actions bar;
- volume/progress controls do not reuse helpers;
- the action bar pushes video outside the 16:9 frame;
- playing state creates separate player anatomy;
- overlay controls are not true overlays.
