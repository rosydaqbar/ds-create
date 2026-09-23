# Toggles

Toggles (switches) represent two mutually exclusive states such as on/off and are especially useful for settings.

# 1. Page regions

```text
Private
└─ _Toggle base

Published
└─ Toggle
```

# 2. Toggle base

Private set: `_Toggle base`

Observed:
- 32 variants.

Properties:
- Type: Default / Slim
- Pressed: False / True
- Size: sm / md
- State: Default / Hover / Focus / Disabled

Representative anatomy:

```text
_Toggle base
layout: Horizontal
padding: track inset

└─ Button / thumb
```

Observed md default-style baseline:
- track around 44 × 24;
- inset around 2;
- thumb around 20.

Pressed controls thumb position/on-state. State controls interaction treatment.

Do not use two different track components for on/off.

# 3. Published Toggle

Published set: `Toggle`

Observed:
- 64 variants.

Properties:
- Supporting text: Boolean
- Type: Default / Slim
- Pressed: False / True
- Size: sm / md
- Text: False / True
- State: Default / Hover / Focus / Disabled

Anatomy without text:

```text
Toggle
└─ _Toggle base
```

Anatomy with text:

```text
Toggle
layout: Horizontal or configured label relationship

├─ _Toggle base
└─ Text and supporting text
   ├─ Text
   └─ Supporting text                  optional
```

The private base owns switch mechanics; the public Toggle owns labeling.

# 4. Type relationship

Default:
- standard track/thumb proportions.

Slim:
- more compact/thinner track treatment;
- still reuses the same state/property model.

Type is visual construction, not a different semantic control.

# 5. Matrix requirements

Show:
- both sizes;
- Default/Slim;
- Pressed false/true;
- all states;
- Text false/true;
- supporting text variations.


# Documentation

The Figma page must visibly document:
- when to use Toggle for an immediate binary setting versus Checkbox for form submission;
- private track/thumb base → labeled public Toggle anatomy;
- Pressed, Hover, Focus, and Disabled behavior;
- Default versus Slim construction;
- label and supporting-text placement;
- keyboard/focus behavior and accessible state naming;
- do/don't examples for ambiguous labels, toggles used for multi-choice tasks, and duplicated switch mechanics in the public component;
- central maintenance through the private base and semantic state tokens.

A matrix alone fails documentation QA.

# 6. QA

Fail QA when:
- Pressed is represented as a separate component;
- public Toggle duplicates the track instead of instancing _Toggle base;
- Focus is omitted;
- Slim uses an unrelated property/state vocabulary;
- label/supporting text changes the switch mechanics.
