# Inputs

# Canvas region order

```text
Private `_Mega input field base`
Input field + textarea matrices (wide zone)
Verification code inputs
```

| Component set | Variant / property axes |
| --- | --- |
| `_Mega input field base` | Size: sm / md / lg; State: Placeholder / Focused / Filled / Disabled / Error |
| `Input field` | Size: sm / md / lg; Type: Default / Leading dropdown / Trailing dropdown / Leading text / Payment input / Tags inner / Tags outer / Trailing button / Password / Date and time / Number counter horizontal / Number counter vertical / OTP / File upload; Destructive: False / True; State: Placeholder / Filled / Focused / Disabled; label, hint, help, required, leading icon, time-selector booleans; icon swap |
| `Textarea input field` | Size: sm / md; Type: Default / Tags inner / Tags outer; Destructive: False / True; State: Placeholder / Default / Focused / Disabled; label, hint, required, help, resize-handle booleans |
| `Verification code input field` | Size: sm / md / lg; Digits: 4 / 6; label and hint booleans |

Header content must explain:
- inputs are for user-entered data;
- mobile text sizing should avoid browser zoom issues;
- long verification codes should be visually grouped.
