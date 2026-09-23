# Avatars

Avatars represent people or profiles through images, initials, placeholders, presence/status, verification, and grouped-user patterns.

# 1. Page regions

```text
Private region
├─ _Avatar image
└─ _Avatar add button

Avatar-user assets / image-style region

Published region
├─ Avatar
├─ Status icon
├─ Avatar label group
├─ Avatar profile photo
└─ Avatar group

Long-form notes and documentation
```

The page includes:
- a private-base header;
- an avatar-user/image-resource header;
- an Avatars public header;
- a dedicated documentation/documentation frame.

# 2. Avatar

Published set: `Avatar`

Observed:
- 36 variants.

Properties:
- Status icon: Boolean
- Size: xs / sm / md / lg / xl / 2xl
- Border: False / True
- Placeholder icon: False / True
- Placeholder text: False / True

Anatomy:

```text
Avatar
├─ Avatar surface
│  ├─ image
│  ├─ placeholder icon                 conditional
│  └─ initials/text                    conditional
└─ Status icon                         optional overlay
```

The root remains square. Image, icon placeholder, and text placeholder are alternate content treatments inside the same avatar frame.

Status is an overlay; it must not push the avatar's intrinsic size.

# 3. Status icon

Published set: `Status icon`

Types:
- Offline
- Online
- Avatar
- Verified tick
- Count

Anatomy:

```text
Status icon
└─ Icon / visual
```

Status visuals scale with the avatar size they are paired with.

# 4. Avatar label group

Published set: `Avatar label group`

Properties:
- Supporting text: Boolean
- Size: sm / md / lg

Anatomy:

```text
Avatar label group
layout: Horizontal
gap: compact

├─ Avatar
└─ Text and supporting text
   layout: Vertical
   ├─ Text
   └─ Supporting text
```

Observed md baseline:
- avatar around 40;
- root gap around 8;
- primary and supporting text stack with no artificial spacer.

The text stack expands; avatar remains fixed.

# 5. Avatar profile photo

Published set: `Avatar profile photo`

Properties:
- Verified: Boolean
- Placeholder: False / True
- Text: False / True
- Size: sm / md / lg

Anatomy:

```text
Avatar profile photo
├─ Outer wrapper
│  └─ Avatar wrapper
│     └─ Avatar content
└─ Status / verified icon overlay
```

Large profile-photo treatment uses a nested wrapper so border/ring treatment can change without rebuilding the image content.

# 6. Avatar group

Published set: `Avatar group`

Properties:
- More users: Boolean
- Add more button: Boolean
- Size: xs / sm / md

Anatomy:

```text
Avatar group
layout: Horizontal
├─ Avatars
│  layout: Horizontal
│  gap: negative overlap
│  ├─ Avatar
│  ├─ Avatar
│  ├─ Avatar
│  └─ More-count avatar                optional
└─ _Avatar add button                  optional
```

Observed xs:
- individual avatars around 24;
- overlap uses a small negative gap;
- “+N” count is represented with the same avatar footprint;
- add button stays outside the overlapping avatar stack.

# 7. Private avatar image helper

Private set: `_Avatar image`

Types:
- Square
- Portrait

Anatomy:

```text
_Avatar image
├─ Image
└─ Text and supporting text
   ├─ Name
   └─ Source
```

This helper supports managing/replacing the shared avatar image source set.

# 8. Private add button

Private set: `_Avatar add button`

Properties:
- Size: xs / sm / md
- State: Default / Hover / Focus / Disabled

Anatomy:

```text
_Avatar add button
└─ Content
   └─ plus icon
```

Keep it as a reusable helper used by Avatar group.

# 9. Matrix requirements

Avatar:
- all six sizes;
- border false/true;
- image / placeholder icon / placeholder text treatments;
- status icon on/off.

Status icon:
- Offline / Online / Avatar / Verified tick / Count.

Avatar label group:
- sm / md / lg;
- supporting text on/off.

Avatar profile photo:
- sm / md / lg;
- placeholder/text combinations;
- verified on/off.

Avatar group:
- xs / sm / md;
- More users on/off;
- Add more button on/off.

Private helpers:
- both _Avatar image types;
- all add-button sizes and states.

Do not replace these matrices with a row of avatar examples.

# 10. Avatar documentation

This page requires a dedicated long-form frame.

Required topics:

## Avatar image usage
Explain the image-source strategy and licensing/source requirements in generic project terms. Do not retain source-specific providers unless the generated system actually uses them.

## Avatar image styles/assets
Explain how shared avatar images are stored so one source update can propagate to existing designs.

## How to change avatars
Document the workflow for replacing an avatar image source without detaching components.

Include an image/example showing avatar replacement.

## How to change placeholder images
Explain how placeholder/avatar-image fills are changed centrally.

## How to change colored backgrounds
Explain how placeholder color backgrounds are token/style-driven so the system can update them globally.

Include:
- placeholder example;
- fill/style update example.

The documentation must describe the generated library's actual mechanism.

# 11. QA

Fail QA when:
- status icons push layout instead of overlaying;
- grouped avatars use positive gaps instead of overlap;
- count avatar has a different footprint from peers;
- add button is duplicated rather than using the private helper;
- image/placeholder/initial states are separate unrelated components;
- avatar-management documentation is missing.

# 12. Visual documentation modules

The Avatar notes require real editor/component examples, not prose alone.

## 12.1 Shared avatar asset model

Create a visual showing:
- one shared avatar image source/helper;
- multiple Avatar / Avatar label / Avatar group instances consuming it.

Use connector arrows or dependency labels to make propagation obvious.

## 12.2 Changing an avatar source

Create an editor-style before/after sequence:
1. select the shared avatar image/helper;
2. replace the image/fill;
3. preserve mask/crop;
4. show all dependent avatar instances updated.

The sequence should use the generated Avatar components.

## 12.3 Editing avatar image fill

Show the actual image-fill editing workflow used by the generated library.

Do not use a screenshot from another system.

Annotate:
- image layer/helper;
- crop/fill mode;
- any shared style/asset relationship.

## 12.4 Changing placeholder imagery

Create a before/after example for placeholder/avatar fallback content.

Show:
- image avatar;
- placeholder icon/initial state;
- centralized replacement mechanism if placeholder imagery is shared.

## 12.5 Changing placeholder/background colors

Create a visual sequence:
- original placeholder background;
- semantic background token/style selected;
- replacement value;
- multiple placeholder instances updated.

The background treatment must use the active brand palette.

## 12.6 Source/licensing note

If externally sourced avatar photography is included, show a compact metadata/example block with:
- source;
- approved usage note;
- ownership/license field.

Do not claim rights the user did not provide.

## 12.7 Avatar visual QA

Fail QA when:
- avatar maintenance is described without editor examples;
- source replacement does not demonstrate propagation;
- placeholder/background changes are not shown using real generated tokens;
- the documentation uses unrelated stock screenshots.
