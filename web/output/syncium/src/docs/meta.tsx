import { Badge } from '@/components/parts/Badge';

/**
 * Page metadata the explorer needs but the Figma file does not hold: maturity status,
 * the release a page arrived in, search aliases and the Figma page node.
 *
 * Status (shown in every page header and on the home page):
 * - stable — matches Figma, passes the automated accessibility checks and keyboard review; the API will not change without a major version.
 * - beta — complete and usable, but complex interaction that still needs testing with real screen readers and products; props may change in a minor version.
 */
export type Status = 'stable' | 'beta' | 'deprecated';

export interface PageMeta {
  status?: Status;
  since: string;
  /** Other names people search for. */
  aliases?: string[];
  /** Figma page node id. */
  figmaNode: string;
}

export const statusInfo: Record<Status, { label: string; tone: 'success' | 'warning' | 'danger'; description: string }> = {
  stable: { label: 'Stable', tone: 'success', description: 'Ready for production. It matches Figma and passes the accessibility checks. Breaking changes come only in a major version.' },
  beta: { label: 'Beta', tone: 'warning', description: 'You can use it in production, but its more complex interactions are still being tested with screen readers and in real products. Props may change in a minor version.' },
  deprecated: { label: 'Deprecated', tone: 'danger', description: 'Scheduled for removal. Switch to the suggested replacement.' },
};

export function StatusPill({ status }: { status: Status }) {
  const s = statusInfo[status];
  return <Badge size="md" type="pill" tone={s.tone} showDot label={s.label} title={s.description} />;
}

export const pageMeta: Record<string, PageMeta> = {
  '01': { since: '1.0', figmaNode: '6:234', aliases: ['setup', 'install', 'start', 'onboarding'] },
  '02': { since: '1.0', figmaNode: '6:235', aliases: ['variables', 'design tokens', 'css variables', 'theme', 'dtcg'] },
  '03': { since: '1.1', figmaNode: '0:1', aliases: ['release notes', 'what changed', 'history', 'versions'] },
  '1.1': { since: '1.0', figmaNode: '6:237', aliases: ['colour', 'palette', 'contrast', 'dark mode'] },
  '1.2': { since: '1.0', figmaNode: '6:238', aliases: ['type', 'font', 'text styles', 'headings'] },
  '1.3': { since: '1.0', figmaNode: '6:239', aliases: ['spacing', 'padding', 'gap', 'grid', 'layout', 'breakpoints'] },
  '1.4': { since: '1.0', figmaNode: '6:240', aliases: ['radius', 'corners', 'border', 'rounded'] },
  '1.5': { since: '1.0', figmaNode: '6:241', aliases: ['shadow', 'depth', 'focus ring', 'z-index'] },
  '1.6': { since: '1.0', figmaNode: '6:242', aliases: ['animation', 'transition', 'easing', 'duration', 'reduced motion'] },
  '1.7': { since: '1.0', figmaNode: '6:243', aliases: ['icons', 'icon set', 'symbols'] },
  '1.8': { since: '1.0', figmaNode: '6:244', aliases: ['logo', 'brand', 'flags', 'social logos'] },
  '2.1': { status: 'stable', since: '1.0', figmaNode: '6:246', aliases: ['cta', 'action', 'submit'] },
  '2.2': { status: 'stable', since: '1.0', figmaNode: '6:247', aliases: ['icon only button', 'toolbar button'] },
  '2.3': { status: 'stable', since: '1.0', figmaNode: '6:248', aliases: ['anchor', 'hyperlink', 'text link'] },
  '2.4': { status: 'stable', since: '1.0', figmaNode: '6:249', aliases: ['lozenge', 'pill', 'status', 'label', 'chip', 'count'] },
  '2.5': { status: 'stable', since: '1.0', figmaNode: '6:250', aliases: ['chip', 'token', 'filter chip', 'removable'] },
  '2.6': { status: 'stable', since: '1.0', figmaNode: '6:251', aliases: ['profile picture', 'user image', 'initials'] },
  '2.7': { status: 'stable', since: '1.0', figmaNode: '6:252', aliases: ['tick box', 'check box', 'multiple choice'] },
  '2.8': { status: 'stable', since: '1.0', figmaNode: '6:253', aliases: ['radio button', 'option button', 'single choice'] },
  '2.9': { status: 'stable', since: '1.0', figmaNode: '6:254', aliases: ['toggle', 'on off', 'switch toggle'] },
  '2.10': { status: 'stable', since: '1.0', figmaNode: '6:255', aliases: ['input', 'text input', 'textbox', 'field box'] },
  '2.11': { status: 'stable', since: '1.0', figmaNode: '6:256', aliases: ['field label', 'form label', 'required'] },
  '2.12': { status: 'stable', since: '1.0', figmaNode: '6:257', aliases: ['hint', 'helper text', 'error message', 'validation'] },
  '2.13': { status: 'stable', since: '1.0', figmaNode: '6:258', aliases: ['hint', 'popover', 'title', 'help'] },
  '2.14': { status: 'stable', since: '1.0', figmaNode: '6:259', aliases: ['progress bar', 'loading bar', 'meter', 'progress ring'] },
  '2.15': { status: 'stable', since: '1.0', figmaNode: '6:260', aliases: ['loader', 'loading', 'spinner', 'busy'] },
  '2.16': { status: 'stable', since: '1.0', figmaNode: '6:261', aliases: ['separator', 'rule', 'hr', 'line'] },
  '2.17': { status: 'stable', since: '1.0', figmaNode: '6:262', aliases: ['keyboard', 'shortcut', 'hotkey', 'key'] },
  '2.18': { status: 'stable', since: '1.0', figmaNode: '6:263', aliases: ['range', 'range slider', 'scrubber'] },
  '2.19': { status: 'stable', since: '1.0', figmaNode: '6:264', aliases: ['icon container', 'feature icon', 'illustration'] },
  '3.1': { status: 'stable', since: '1.0', figmaNode: '6:266', aliases: ['segmented control', 'toggle group', 'button bar'] },
  '3.2': { status: 'stable', since: '1.0', figmaNode: '6:267', aliases: ['input', 'form field', 'textarea', 'number input', 'stepper', 'tags input'] },
  '3.3': { status: 'stable', since: '1.0', figmaNode: '6:268', aliases: ['checkbox group', 'radio group', 'option card', 'fieldset'] },
  '3.4': { status: 'stable', since: '1.0', figmaNode: '6:269', aliases: ['avatar stack', 'facepile', 'people'] },
  '3.5': { status: 'beta', since: '1.0', figmaNode: '6:270', aliases: ['dropdown', 'combobox', 'picker', 'multi select', 'listbox'] },
  '3.6': { status: 'beta', since: '1.0', figmaNode: '6:271', aliases: ['dropdown menu', 'context menu', 'action menu', 'overflow menu', 'popover menu'] },
  '3.7': { status: 'stable', since: '1.0', figmaNode: '6:272', aliases: ['sign in', 'login', 'oauth', 'google', 'apple', 'facebook'] },
  '3.8': { status: 'stable', since: '1.0', figmaNode: '6:273', aliases: ['announcement', 'new badge', 'promo'] },
  '4.1': { status: 'beta', since: '1.0', figmaNode: '6:275', aliases: ['wysiwyg', 'text editor', 'comment box', 'composer'] },
  '4.2': { status: 'beta', since: '1.0', figmaNode: '6:276', aliases: ['video', 'media player', 'player controls'] },
};
