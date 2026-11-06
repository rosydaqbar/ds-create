import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr } from '@/lib/types';
import { Icon, type IconName } from '@/icons';
import { Kbd } from '../parts/Kbd';
import { Tooltip } from '../parts/Tooltip';

/**
 * 4.1 Rich text editor — `.Main` private parts: `.Main/Rich text editor command` and
 * `.Main/Rich text editor scroll bar`. Internal to the editor and both toolbars (one command system);
 * the file name starts with `_`, so they are not exported from the library.
 *
 * The command is not an Icon button (2.2): a formatting command has a Selected state ("bold is on here")
 * and a colour-swatch form.
 */

export type RichTextCommandType =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'bullet-list'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'justify'
  | 'link'
  | 'image'
  | 'attachment'
  | 'code'
  | 'color'
  | 'generate'
  | 'more'
  | 'video';

export const richTextCommandTypes: readonly RichTextCommandType[] = [
  'bold',
  'italic',
  'underline',
  'bullet-list',
  'align-left',
  'align-center',
  'align-right',
  'justify',
  'link',
  'image',
  'attachment',
  'code',
  'color',
  'generate',
  'more',
  'video',
];

/** Name (accessible name and Tooltip), icon, shortcut, and whether the command toggles a format. */
export const richTextCommandMeta: Record<RichTextCommandType, { name: string; icon?: IconName; shortcut?: string[]; toggle: boolean }> = {
  bold: { name: 'Bold', icon: 'editor/bold', shortcut: ['⌘', 'B'], toggle: true },
  italic: { name: 'Italic', icon: 'editor/italic', shortcut: ['⌘', 'I'], toggle: true },
  underline: { name: 'Underline', icon: 'editor/underline', shortcut: ['⌘', 'U'], toggle: true },
  'bullet-list': { name: 'Bulleted list', icon: 'editor/bullet-list', shortcut: ['⌘', '⇧', '8'], toggle: true },
  'align-left': { name: 'Align left', icon: 'editor/align-left', shortcut: ['⌘', '⇧', 'L'], toggle: true },
  'align-center': { name: 'Align center', icon: 'editor/align-center', shortcut: ['⌘', '⇧', 'E'], toggle: true },
  'align-right': { name: 'Align right', icon: 'editor/align-right', shortcut: ['⌘', '⇧', 'R'], toggle: true },
  justify: { name: 'Justify', icon: 'editor/justify', shortcut: ['⌘', '⇧', 'J'], toggle: true },
  link: { name: 'Link', icon: 'general/link', shortcut: ['⌘', 'K'], toggle: true },
  image: { name: 'Image', icon: 'images/image', toggle: false },
  attachment: { name: 'Attach file', icon: 'editor/attachment', toggle: false },
  code: { name: 'Code block', icon: 'development/code', toggle: true },
  color: { name: 'Text colour', toggle: false },
  generate: { name: 'Write with AI', icon: 'editor/generate', toggle: false },
  more: { name: 'More formatting', icon: 'general/more-horizontal', toggle: false },
  video: { name: 'Video', icon: 'editor/video', toggle: false },
};

export interface RichTextCommandProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'type' | 'color'> {
  /** Figma `Type`. */
  type?: RichTextCommandType;
  /** Figma `Selected`: the format is on at the cursor. Announced as pressed. */
  selected?: boolean;
  /** `type="color"`: the current text colour shown in the swatch. */
  color?: string;
  /** Show the Tooltip with the name and shortcut (on by default). */
  showTooltip?: boolean;
  /** Documentation only: Figma `State=hover`. */
  forceState?: 'hover' | 'focus';
}

export function RichTextCommand({ type = 'bold', selected = false, color, showTooltip = true, forceState, className, ...rest }: RichTextCommandProps) {
  const meta = richTextCommandMeta[type];
  const button = (
    <button
      data-anatomy="command"
      type="button"
      aria-label={meta.name}
      aria-pressed={meta.toggle ? selected : undefined}
      data-toolbar-item=""
      onMouseDown={(e) => e.preventDefault() /* keep the editor's selection */}
      className={cn(
        'relative inline-flex size-(--size-control-xs) shrink-0 cursor-pointer items-center justify-center rounded-control outline-none',
        'transition-[background-color,color,box-shadow] duration-(--motion-duration-fast) ease-standard',
        selected ? 'bg-fill-neutral-subtle-selected text-icon-primary' : 'bg-fill-none text-icon-tertiary is-hover:bg-fill-neutral-subtle-hover is-hover:text-icon-secondary',
        'is-focus:shadow-focus-default',
        'is-disabled:cursor-not-allowed is-disabled:bg-fill-none is-disabled:text-icon-disabled',
        className,
      )}
      {...forceAttr(forceState)}
      {...rest}
    >
      {type === 'color' ? (
        <span
          aria-hidden
          className="size-(--size-icon-sm) rounded-full border-(length:--border-width-default) border-border-default"
          style={{ background: color ?? 'var(--color-text-primary)' }}
        />
      ) : (
        <Icon name={meta.icon!} size="md" />
      )}
    </button>
  );
  if (!showTooltip) return button;
  return (
    <Tooltip
      text={meta.name}
      trailing={
        meta.shortcut && (
          <span className="inline-flex items-center gap-xxs">
            {meta.shortcut.map((k) => (
              <Kbd key={k} size="sm" text={k} />
            ))}
          </span>
        )
      }
    >
      {button}
    </Tooltip>
  );
}

/* ---------- .Main/Rich text editor scroll bar ---------- */

/** No size token exists for the 4-wide thumb; the Figma part is fixed. */
const SCROLL_THUMB_WIDTH = 'w-[0.25rem]';

export function RichTextScrollBar({ thumb = { top: 0, size: 0.4, overflow: true }, className }: { thumb?: { top: number; size: number; overflow: boolean }; className?: string }) {
  if (!thumb.overflow) return null;
  return (
    <span aria-hidden className={cn('pointer-events-none absolute end-xs top-xs bottom-xs', SCROLL_THUMB_WIDTH, className)}>
      <span data-anatomy="scroll-bar" className="absolute inset-x-0 rounded-full bg-fill-neutral-track" style={{ top: `${thumb.top * 100}%`, height: `${thumb.size * 100}%` }} />
    </span>
  );
}
