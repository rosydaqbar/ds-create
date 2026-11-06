# No Hardcoded

# Motion is a Must

At the start of every task, including continuations, check both rules before planning or editing.

This rule applies throughout this project, across every UI surface, feature, state, and future change, not only the current task. For UI and visual work, search the actual design system, shared components, variants, tokens, styles, and equivalent surfaces first. Use actual existing visual components and their variants for their intended semantic roles, including status, labels, actions, inputs, icons, feedback, and disclosures. Reuse the matching tokens directly for typography, colors, spacing, borders, radii, dimensions, responsive behavior, states, and interactions. Text or hand-styled markup is not a substitute for an applicable shared visual component. Do not hard-code visual values, duplicate component styling, or add local overrides to approximate an existing design-system component. When an affected surface has hardcoded values or locally recreated components, correct them at the shared source where appropriate. When no suitable source exists, record the search and gap, then add the smallest reusable design-system extension. If the correct match is unclear, ask before changing the visual direction. Record requirements, decisions, and observable checks in the existing working record, and verify the rendered result; disclose when rendering cannot be verified.

No hardcoded values are allowed in feature implementations across this project. Search for an existing shared source of truth first; if none exists, record the gap and define the value once in the smallest reusable project-owned source of truth. Reuse that source across code, configuration, data, UI, tokens, styles, and motion; do not duplicate values in consumers. This rule applies to every task and continuation in this project.

Read applicable skills and all references they require before work. Project inputs and outputs remain under the ignored workspace directories. Preserve existing changes.

For UI and visual work, motion is required: identify and reuse the design system’s existing motion tokens, transitions, and interaction patterns for the affected experience. Make motion purposeful and appropriate to the interaction, and honor reduced-motion preferences. If a suitable motion pattern is missing, record the gap and add the smallest reusable design-system extension. Include motion and reduced-motion behavior in the observable checks, and verify them in the rendered experience when available.
