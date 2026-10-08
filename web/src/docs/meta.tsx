import { tokens } from '@/tokens/tokens.gen';

/**
 * Page metadata the explorer needs but the Figma file does not hold: maturity status,
 * the release a page arrived in and search aliases. Figma page nodes come from the export
 * (`tokens.pages`), matched by the page id at the start of the Figma page name ("2.1 Button").
 *
 * Status (shown in every page header and on the home page):
 * - stable — documented API is stable; accessibility and platform limitations remain in each component’s notes.
 * - beta — available for evaluation; interactions need testing in the target product and props may change.
 */
export type Status = 'stable' | 'beta' | 'deprecated';

export interface PageMeta {
  status?: Status;
  since: string;
  /** Other names people search for. */
  aliases?: string[];
}

export const statusInfo: Record<Status, { label: string; tone: 'success' | 'warning' | 'danger'; description: string }> = {
  stable: { label: 'Stable', tone: 'success', description: 'The documented API is stable. Review the component’s accessibility notes and platform guidance before release.' },
  beta: { label: 'Beta', tone: 'warning', description: 'The component is available for evaluation. Its interactions still need testing with screen readers and in the target product; props may change.' },
  deprecated: { label: 'Deprecated', tone: 'danger', description: 'Scheduled for removal. Switch to the suggested replacement.' },
};

/**
 * Site chrome, not a design-system component: App products have no web Badge to show here, and a
 * brand's status roles can miss AA on their own tints. The text uses the site's on-tint roles
 * (src/styles/chrome.css), pulled toward the primary text color so it passes on each tint.
 */
const pillTone: Record<'success' | 'warning' | 'danger', { box: string; dot: string }> = {
  success: { box: 'bg-fill-success-subtle text-site-success-on-tint', dot: 'bg-icon-success' },
  warning: { box: 'bg-fill-warning-subtle text-site-warning-on-tint', dot: 'bg-icon-warning' },
  danger: { box: 'bg-fill-danger-subtle text-site-danger-on-tint', dot: 'bg-icon-danger' },
};

export function StatusPill({ status }: { status: Status }) {
  const s = statusInfo[status];
  const t = pillTone[s.tone];
  return (
    <span title={s.description} className={`type-body-xs-semibold inline-flex shrink-0 items-center gap-xs rounded-full px-md py-xxs ${t.box}`}>
      <span aria-hidden className={`size-(--size-indicator-xs) rounded-full ${t.dot}`} />
      {s.label}
    </span>
  );
}

export const pageMeta: Record<string, PageMeta> = {
  '01': { since: '1.0', aliases: ['setup', 'install', 'start', 'onboarding'] },
  '02': { since: '1.0', aliases: ['variables', 'design tokens', 'css variables', 'theme', 'dtcg'] },
  '03': { since: '1.1', aliases: ['release notes', 'what changed', 'history', 'versions'] },
  '1.1': { since: '1.0', aliases: ['colour', 'palette', 'contrast', 'dark mode'] },
  '1.2': { since: '1.0', aliases: ['type', 'font', 'text styles', 'headings'] },
  '1.3': { since: '1.0', aliases: ['spacing', 'padding', 'gap', 'grid', 'layout', 'breakpoints'] },
  '1.4': { since: '1.0', aliases: ['radius', 'corners', 'border', 'rounded'] },
  '1.5': { since: '1.0', aliases: ['shadow', 'depth', 'focus ring', 'z-index'] },
  '1.6': { since: '1.0', aliases: ['animation', 'transition', 'easing', 'duration', 'reduced motion'] },
  '1.7': { since: '1.0', aliases: ['icons', 'icon set', 'symbols'] },
  '1.8': { since: '1.0', aliases: ['logo', 'brand', 'flags', 'social logos'] },
  '2.1': { status: 'stable', since: '1.0', aliases: ['cta', 'action', 'submit'] },
  '2.2': { status: 'stable', since: '1.0', aliases: ['icon only button', 'toolbar button'] },
  '2.3': { status: 'stable', since: '1.0', aliases: ['anchor', 'hyperlink', 'text link'] },
  '2.4': { status: 'stable', since: '1.0', aliases: ['lozenge', 'pill', 'status', 'label', 'chip', 'count'] },
  '2.5': { status: 'stable', since: '1.0', aliases: ['chip', 'token', 'filter chip', 'removable'] },
  '2.6': { status: 'stable', since: '1.0', aliases: ['profile picture', 'user image', 'initials'] },
  '2.7': { status: 'stable', since: '1.0', aliases: ['tick box', 'check box', 'multiple choice'] },
  '2.8': { status: 'stable', since: '1.0', aliases: ['radio button', 'option button', 'single choice'] },
  '2.9': { status: 'stable', since: '1.0', aliases: ['toggle', 'on off', 'switch toggle'] },
  '2.10': { status: 'stable', since: '1.0', aliases: ['input', 'text input', 'textbox', 'field box'] },
  '2.11': { status: 'stable', since: '1.0', aliases: ['field label', 'form label', 'required'] },
  '2.12': { status: 'stable', since: '1.0', aliases: ['hint', 'helper text', 'error message', 'validation'] },
  '2.13': { status: 'stable', since: '1.0', aliases: ['hint', 'popover', 'title', 'help'] },
  '2.14': { status: 'stable', since: '1.0', aliases: ['progress bar', 'loading bar', 'meter', 'progress ring'] },
  '2.15': { status: 'stable', since: '1.0', aliases: ['loader', 'loading', 'spinner', 'busy'] },
  '2.16': { status: 'stable', since: '1.0', aliases: ['separator', 'rule', 'hr', 'line'] },
  '2.17': { status: 'stable', since: '1.0', aliases: ['keyboard', 'shortcut', 'hotkey', 'key'] },
  '2.18': { status: 'stable', since: '1.0', aliases: ['range', 'range slider', 'scrubber'] },
  '2.19': { status: 'stable', since: '1.0', aliases: ['icon container', 'feature icon', 'illustration'] },
  '3.1': { status: 'stable', since: '1.0', aliases: ['segmented control', 'toggle group', 'button bar'] },
  '3.2': { status: 'stable', since: '1.0', aliases: ['input', 'form field', 'textarea', 'number input', 'stepper', 'tags input'] },
  '3.3': { status: 'stable', since: '1.0', aliases: ['checkbox group', 'radio group', 'option card', 'fieldset'] },
  '3.4': { status: 'stable', since: '1.0', aliases: ['avatar stack', 'facepile', 'people'] },
  '3.5': { status: 'beta', since: '1.0', aliases: ['dropdown', 'combobox', 'picker', 'multi select', 'listbox'] },
  '3.6': { status: 'beta', since: '1.0', aliases: ['dropdown menu', 'context menu', 'action menu', 'overflow menu', 'popover menu'] },
  '3.7': { status: 'stable', since: '1.0', aliases: ['sign in', 'login', 'oauth', 'google', 'apple', 'facebook'] },
  '3.8': { status: 'stable', since: '1.0', aliases: ['announcement', 'new badge', 'promo'] },
  '4.1': { status: 'beta', since: '1.0', aliases: ['wysiwyg', 'text editor', 'comment box', 'composer'] },
  '4.2': { status: 'beta', since: '1.0', aliases: ['video', 'media player', 'player controls'] },
};

/** Figma node of the page whose name starts with this id ("2.1 Button" → 2.1); undefined when the export has none. */
export function figmaNodeFor(id: string): string | undefined {
  return tokens.pages?.find((p) => p.name === id || p.name.startsWith(`${id} `))?.id;
}
