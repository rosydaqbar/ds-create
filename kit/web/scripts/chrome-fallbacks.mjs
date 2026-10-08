/**
 * Site chrome fallbacks: the CSS names the docs site's own UI uses (navigation, tables, tabs, code
 * blocks, doc visuals), each with a default. `build-tokens.mjs` writes a default into tokens.css only
 * for the names this Figma file doesn't define, so a brand with its own naming (an existing file with
 * no `sm` space, no medium text styles, no icon roles) still gets a readable site, and a brand that
 * uses the template's names gets nothing from here.
 *
 * Defaults point at other names in this list (each falls back to a stronger or plainer role, never a
 * lighter one), and the chains end at the chrome roots in src/styles/chrome.css (`--chrome-ink`,
 * `--chrome-paper`, `--chrome-accent`, `--chrome-on-accent`). A build whose main roles have other
 * names points those roots at them; it never edits this file and never types a hex value.
 *
 * These are not design-system tokens: they never appear in token tables, code examples, exports or
 * the app previews (the site data comes from the Figma export only).
 *
 * Each entry: [css name, default value, Tailwind theme key (optional)]. Colors are written into the
 * Light and Dark blocks, so derived colors follow a `data-theme` subtree.
 */
const mix = (a, pct, b) => `color-mix(in oklab, ${a} ${pct}%, ${b})`;
const v = (n) => `var(${n})`;
const INK = v('--color-text-primary');
const PAPER = v('--color-surface-base');
const ACCENT = v('--color-fill-brand-solid');

/** @type {[string, string][]} name → default; the utility is `--color-*` of the same name. */
export const colors = [
  ['--color-text-primary', v('--chrome-ink')],
  ['--color-surface-base', v('--chrome-paper')],
  ['--color-fill-brand-solid', v('--chrome-accent')],
  ['--color-text-on-solid', v('--chrome-on-accent')],

  ['--color-text-secondary', mix(INK, 80, PAPER)],
  ['--color-text-tertiary', v('--color-text-secondary')],
  ['--color-text-placeholder', v('--color-text-tertiary')],
  ['--color-text-disabled', v('--color-text-tertiary')],
  ['--color-fill-danger-solid', mix('red', 75, INK)],
  ['--color-fill-success-solid', mix('green', 85, INK)],
  ['--color-fill-warning-solid', mix('orange', 85, INK)],
  ['--color-fill-info-solid', ACCENT],
  ['--color-text-brand', mix(ACCENT, 75, INK)],
  ['--color-text-brand-hover', v('--color-text-brand')],
  ['--color-text-danger', v('--color-fill-danger-solid')],
  ['--color-text-success', mix(v('--color-fill-success-solid'), 75, INK)],
  ['--color-text-warning', mix(v('--color-fill-warning-solid'), 55, INK)],
  ['--color-text-info', mix(v('--color-fill-info-solid'), 75, INK)],
  ['--color-text-inverse', PAPER],
  ['--color-text-primary-on-brand', v('--color-text-on-solid')],
  ['--color-text-secondary-on-brand', v('--color-text-primary-on-brand')],
  ['--color-text-tertiary-on-brand', v('--color-text-secondary-on-brand')],

  ['--color-icon-primary', INK],
  ['--color-icon-secondary', v('--color-text-secondary')],
  ['--color-icon-tertiary', v('--color-text-tertiary')],
  ['--color-icon-placeholder', v('--color-text-placeholder')],
  ['--color-icon-disabled', v('--color-text-disabled')],
  ['--color-icon-brand', v('--color-text-brand')],
  ['--color-icon-danger', v('--color-text-danger')],
  ['--color-icon-success', v('--color-text-success')],
  ['--color-icon-warning', v('--color-text-warning')],
  ['--color-icon-info', v('--color-text-info')],
  ['--color-icon-inverse', v('--color-text-inverse')],

  ['--color-surface-base-hover', mix(PAPER, 94, INK)],
  ['--color-surface-raised', PAPER],
  ['--color-surface-sunken', mix(PAPER, 95, INK)],
  ['--color-surface-overlay', v('--color-surface-raised')],
  ['--color-surface-inverse', INK],
  ['--color-surface-brand-solid', ACCENT],
  ['--color-overlay-scrim', 'rgb(0 0 0 / 0.5)'],

  ['--color-fill-brand-solid-hover', mix(ACCENT, 85, INK)],
  ['--color-fill-brand-subtle', mix(ACCENT, 12, PAPER)],
  ['--color-surface-brand-subtle', v('--color-fill-brand-subtle')],
  ['--color-fill-neutral-solid', mix(INK, 80, PAPER)],
  ['--color-fill-neutral-subtle', mix(PAPER, 94, INK)],
  ['--color-fill-neutral-subtle-hover', mix(PAPER, 90, INK)],
  ['--color-fill-neutral-track', mix(PAPER, 85, INK)],
  ['--color-fill-danger-subtle', mix(v('--color-text-danger'), 10, PAPER)],
  ['--color-fill-success-subtle', mix(v('--color-text-success'), 10, PAPER)],
  ['--color-fill-warning-subtle', mix(v('--color-text-warning'), 12, PAPER)],
  ['--color-fill-info-subtle', mix(v('--color-text-info'), 10, PAPER)],

  ['--color-border-default', mix(INK, 22, PAPER)],
  ['--color-border-subtle', mix(INK, 12, PAPER)],
  ['--color-border-strong', v('--color-text-secondary')],
  ['--color-border-brand', ACCENT],
  ['--color-border-brand-subtle', mix(ACCENT, 35, PAPER)],
  ['--color-border-focus', v('--color-border-brand')],
  ['--color-border-danger', v('--color-text-danger')],
  ['--color-border-danger-subtle', mix(v('--color-text-danger'), 35, PAPER)],
  ['--color-border-success-subtle', mix(v('--color-text-success'), 35, PAPER)],
  ['--color-border-warning-subtle', mix(v('--color-text-warning'), 35, PAPER)],
  ['--color-border-info-subtle', mix(v('--color-text-info'), 35, PAPER)],

  // Measurement overlays in doc visuals (padding, margins, touch targets).
  ['--color-category-pink-solid', mix('deeppink', 80, INK)],
  ['--color-category-pink-text', mix('deeppink', 55, INK)],
  ['--color-category-pink-border', mix('deeppink', 40, PAPER)],
  ['--color-category-pink-subtle', mix('deeppink', 12, PAPER)],

  // Swatch labels need true white and black.
  ['--palette-base-white', '#ffffff'],
  ['--palette-base-black', '#000000'],
];

/** @type {[string, string, string?][]} name → default, Tailwind theme key. Written once, in the Light block (`:root`). */
export const values = [
  ['--font-family-ui', 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', '--font-ui'],
  ['--font-family-mono', 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'],
  ['--font-weight-regular', '400'],
  ['--font-weight-medium', '500'],
  ['--font-weight-semibold', '600', '--font-weight-semibold'],
  ['--font-weight-bold', '700'],
  ['--font-size-body-md', '16px', '--text-body-md'],

  ['--space-xxs', '2px', '--spacing-xxs'],
  ['--space-xs', '4px', '--spacing-xs'],
  ['--space-md', '8px', '--spacing-md'],
  ['--space-sm', 'calc((var(--space-xs) + var(--space-md)) / 2)', '--spacing-sm'],
  ['--space-lg', '12px', '--spacing-lg'],
  ['--space-xl', '16px', '--spacing-xl'],
  ['--space-2xl', '20px', '--spacing-2xl'],
  ['--space-3xl', '24px', '--spacing-3xl'],
  ['--space-4xl', '32px', '--spacing-4xl'],
  ['--space-5xl', '40px', '--spacing-5xl'],
  ['--space-6xl', '48px', '--spacing-6xl'],

  ['--radius-none', '0px', '--radius-none'],
  ['--radius-xs', '4px', '--radius-xs'],
  ['--radius-sm', '6px', '--radius-sm'],
  ['--radius-control', '8px', '--radius-control'],
  ['--radius-full', '9999px', '--radius-full'],
  ['--radius-indicator', 'var(--radius-full)', '--radius-indicator'],
  ['--radius-surface', '12px', '--radius-surface'],
  ['--radius-modal', 'var(--radius-surface)', '--radius-modal'],

  ['--size-icon-xs', '12px'],
  ['--size-icon-sm', '16px'],
  ['--size-icon-md', '20px'],
  ['--size-icon-lg', '24px'],
  ['--size-icon-xl', '32px'],
  ['--size-control-xs', '32px'],
  ['--size-control-sm', '36px'],
  ['--size-control-md', '40px'],
  ['--size-control-lg', '44px'],
  ['--size-control-xl', '48px'],
  ['--size-avatar-xs', '24px'],
  ['--size-indicator-xs', '6px'],
  ['--size-indicator-sm', '8px'],
  ['--size-indicator-md', '10px'],
  ['--size-indicator-lg', '12px'],
  ['--size-track-md', '6px'],
  ['--size-track-lg', '8px'],
  ['--size-measure-reading', '640px'],
  ['--size-touch-min', '44px'],
  ['--border-width-default', '1px'],
  ['--border-width-strong', '2px'],
  ['--border-width-focus', '2px'],
  ['--button-gap-md', 'var(--space-sm)'],
  ['--button-padding-x-md', 'var(--space-lg)'],

  ['--motion-duration-fast', '120ms'],
  ['--motion-duration-base', '200ms'],
  ['--motion-duration-slow', '300ms'],
  ['--motion-duration-loop', '900ms'],
  ['--motion-easing-standard', 'cubic-bezier(0.2, 0, 0, 1)', '--ease-standard'],
  ['--motion-easing-enter', 'cubic-bezier(0, 0, 0.2, 1)', '--ease-enter'],
  ['--motion-easing-exit', 'cubic-bezier(0.4, 0, 1, 1)', '--ease-exit'],
];

/** Effect styles the chrome uses: [css name, default, Tailwind shadow key]. Written into both blocks. */
export const effects = [
  ['--elevation-raised', '0 1px 3px rgb(0 0 0 / 0.12)', '--shadow-raised'],
  ['--elevation-overlay', '0 12px 16px -4px rgb(0 0 0 / 0.14)', '--shadow-overlay'],
  ['--elevation-modal', '0 20px 24px -4px rgb(0 0 0 / 0.16)', '--shadow-modal'],
  ['--focus-default', `0 0 0 2px ${PAPER}, 0 0 0 4px var(--color-border-focus)`, '--shadow-focus-default'],
];

/**
 * Text styles the chrome uses: class → [size px, line height px, weight, mono]. A missing style gets
 * a utility that reads the brand's size variable of the same name when it has one.
 */
export const textStyles = {
  'type-display-md-semibold': [40, 48, 600],
  'type-display-sm-semibold': [32, 40, 600],
  'type-heading-lg-semibold': [24, 32, 600],
  'type-heading-md-semibold': [20, 28, 600],
  'type-heading-sm-semibold': [18, 26, 600],
  'type-heading-xs-semibold': [16, 24, 600],
  'type-body-lg-regular': [18, 28, 400],
  'type-body-lg-semibold': [18, 28, 600],
  'type-body-md-regular': [16, 24, 400],
  'type-body-md-medium': [16, 24, 500],
  'type-body-md-semibold': [16, 24, 600],
  'type-body-sm-regular': [14, 20, 400],
  'type-body-sm-medium': [14, 20, 500],
  'type-body-sm-semibold': [14, 20, 600],
  'type-body-xs-regular': [12, 16, 400],
  'type-body-xs-medium': [12, 16, 500],
  'type-body-xs-semibold': [12, 16, 600],
  'type-code-md-regular': [14, 20, 400, true],
  'type-code-md-medium': [14, 20, 500, true],
  'type-code-sm-regular': [12, 16, 400, true],
  'type-code-sm-medium': [12, 16, 500, true],
};
