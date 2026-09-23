# ↳ Typography


> **Initiator gate:** Execute this specification only when this Foundation is in scope. If it already exists, apply the confirmed action (`Keep`, `Audit`, `Improve`, `Refactor`, `Rebuild`, or `Replace`) before changing anything. Actual token names must follow the naming system selected in the initiator; token names shown here are logical roles.

## Variable collection

`Foundation / Typography`

Required variables:

```text
font.family.body
font.family.display
font.family.mono

font.weight.regular
font.weight.medium
font.weight.semibold
font.weight.bold

font.size.12
font.size.14
font.size.16
font.size.18
font.size.20
font.size.24
font.size.30
font.size.36
font.size.48
font.size.60

line-height.16
line-height.20
line-height.24
line-height.28
line-height.30
line-height.32
line-height.40
line-height.44
line-height.56
line-height.72
```

Typeface values are brand-configured.

## Required text styles

```text
Display / XL
Display / LG
Display / MD
Heading / LG
Heading / MD
Heading / SM
Body / LG / Regular
Body / LG / Medium
Body / MD / Regular
Body / MD / Medium
Body / MD / Semibold
Body / SM / Regular
Body / SM / Medium
Body / SM / Semibold
Label / MD
Label / SM
Code / MD
```

### Scaffold defaults

| Style | Size | Line height | Weight |
|---|---:|---:|---|
| Display / XL | 60 | 72 | Semibold |
| Display / LG | 48 | 56 | Semibold |
| Display / MD | 36 | 44 | Semibold |
| Heading / LG | 30 | 40 | Semibold |
| Heading / MD | 24 | 32 | Semibold |
| Heading / SM | 20 | 30 | Semibold |
| Body / LG | 18 | 28 | Regular |
| Body / MD | 16 | 24 | Regular |
| Body / SM | 14 | 20 | Regular |
| Label / MD | 14 | 20 | Medium |
| Label / SM | 12 | 16 | Medium |
| Code / MD | 14 | 20 | Regular |

Brands may replace the scale, but component mappings use style roles rather than raw sizes.

## Text behavior rules

- body and supporting text wrap;
- interactive labels are single-line unless the component explicitly permits wrapping;
- tab labels are single-line;
- button labels are single-line;
- form labels may wrap to two lines;
- validation messages wrap freely;
- truncation is documented per component and never assumed.

## Source-zone layout

Show:
1. typeface roles;
2. weight set;
3. type scale;
4. paragraph examples;
5. truncation and wrapping specimens;
6. numeric alignment specimen;
7. monospace specimen.

## QA

- available font styles match declared weights;
- no missing font;
- 200% text specimens remain legible;
- line-height does not clip diacritics;
- mixed Latin/numeric specimen aligns correctly;
- fallback font behavior is documented.