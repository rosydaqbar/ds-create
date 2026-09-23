# Variables Guidance

Create five separate long-form documentation frames using the long-form frame role from the documentation system.

## 1. Introduction to variables

Must cover:
- what variables are;
- why they are useful;
- modes and dark mode;
- how to open/edit variables;
- updating values globally.

## 2. Variables system overview

Must explain the system goals:
- simplicity;
- accessibility;
- aesthetics;
- scalability.

## 3. Variable naming

Must explain one consistent naming structure and how names communicate hierarchy, purpose, and modifiers.

The actual naming syntax is resolved from the initiator preset; the page explains the selected convention rather than forcing one preset.

## 4. Types of variables

Must cover, as separate sections:
- primitive variables;
- alias/semantic variables;
- component variables;
- utility variables.

Each section should include explanatory text and visual examples.

## 5. Additional notes

Must cover:
- whether variables are mandatory;
- using component variants for themes when appropriate;
- relationship between variables and styles;
- supported properties;
- extended collections;
- modes for sizing and spacing;
- breakpoints;
- solid vs transparent dark-mode shades;
- accessibility/contrast implications;
- how to add/use transparent shades.

Use the long-form documentation layout and do not compress these into a single FAQ card.

## Mandatory visible notes/documentation

The Variables page must include visible long-form documentation on the Figma canvas in addition to token collections/tables.

It must explain the actual generated variable architecture:
- primitive → semantic/alias → component/utility relationship;
- naming convention used by this system;
- active collections and modes;
- how designers should choose variables in product UI;
- when primitive values may or may not be used directly;
- how themes, sizing, spacing, transparency, and accessibility are handled;
- concrete examples using the generated variables.

Do not treat the variable table or collection list as sufficient documentation.

A Variables page without visible explanatory notes fails QA.
