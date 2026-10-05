import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/cn';
import { presenceClass, usePresence } from '@/lib/motion';
import { useScrollThumb } from '@/lib/popup';
import { Select } from '../components/Select';
import { Divider } from '../parts/Divider';
import { HelpText } from '../parts/HelpText';
import { textControlSurface } from '../parts/TextControl';
import { RichTextCommand, RichTextScrollBar, type RichTextCommandType } from './_RichTextParts';

/**
 * 4.1 Rich text editor — formatted writing without markup.
 * Figma: `Rich text toolbar` · Type (2 variants) · Show selects.
 *        `Rich text floating toolbar` · Type (2 variants).
 *        `Rich text editor` · Size × Type (4 variants) · Show scroll bar, Show hint.
 * Private parts (`.Main`) live in `_RichTextParts.tsx`: the command and the scroll bar.
 *
 * The surface is a `contentEditable` region with the Text control's (2.10) fill, border, radius and focus.
 * Commands run through `document.execCommand`; a command's Selected state reads `queryCommandState` at the cursor.
 * Each toolbar is one tab stop: Left / Right, Home / End move between its controls. Alt+F10 in the surface moves
 * to the toolbar. Figma `Show scroll bar` comes from content taller than the surface.
 */

export type RichTextSize = 'sm' | 'md';
export type RichTextToolbarType = 'simple' | 'advanced';
export type RichTextFormats = Partial<Record<Exclude<RichTextCommandType, 'color'>, boolean>> & { textColor?: string; block?: string; textSize?: string };

/** Advanced toolbar selects (3.5 Select, Size=sm): paragraph style → block tag, text size → execCommand size. */
export const richTextParagraphStyles = [
  { value: 'p', label: 'Normal text' },
  { value: 'h3', label: 'Heading' },
  { value: 'h4', label: 'Subheading' },
  { value: 'blockquote', label: 'Quote' },
];
export const richTextSizes = [
  { value: '2', label: 'Small' },
  { value: '3', label: 'Medium' },
  { value: '5', label: 'Large' },
];
/** Select widths in the toolbar: no token; they hug the longest option. */
const STYLE_SELECT_WIDTH = 'w-[9.5rem]';
const SIZE_SELECT_WIDTH = 'w-[7.5rem]';
/** Input min height per Size (Figma 120 / 160): no size token exists. */
/** Space the floating toolbar needs above a selection before it flips below (toolbar height + gap). */
const FLIP_MARGIN = 64;
const MIN_HEIGHT: Record<RichTextSize, string> = { sm: 'min-h-[7.5rem]', md: 'min-h-[10rem]' };

/* ---------- toolbar ---------- */

type Slot = { kind: 'command'; type: RichTextCommandType } | { kind: 'divider' } | { kind: 'style' } | { kind: 'size' };

const c = (type: RichTextCommandType): Slot => ({ kind: 'command', type });
const d: Slot = { kind: 'divider' };

const toolbarSlots = (type: RichTextToolbarType, showSelects: boolean): Slot[] =>
  type === 'simple'
    ? [c('bold'), c('italic'), c('underline'), d, c('bullet-list'), c('align-left'), d, c('link'), c('image')]
    : [
        ...(showSelects ? [{ kind: 'style' } as Slot, { kind: 'size' } as Slot] : []),
        c('bold'),
        c('italic'),
        c('underline'),
        d,
        c('color'),
        d,
        c('bullet-list'),
        c('align-left'),
        c('align-center'),
        c('align-right'),
        d,
        c('link'),
        c('image'),
        d,
        c('generate'),
        c('more'),
      ];

const floatingSlots = (type: RichTextToolbarType): Slot[] =>
  type === 'simple'
    ? [c('bold'), c('italic'), c('underline'), d, c('link')]
    : [c('bold'), c('italic'), c('underline'), d, c('link'), d, c('color'), c('bullet-list'), d, c('generate')];

/** Divider wrapper: the same spacing around every divider (padding-x space/xs, height 20). */
function DividerWrapper() {
  return (
    <span aria-hidden data-anatomy="divider-wrapper" className="flex h-(--size-icon-md) shrink-0 items-center px-xs">
      <Divider orientation="vertical" decorative />
    </span>
  );
}

interface CommandBarProps {
  slots: Slot[];
  formats?: RichTextFormats;
  onCommand?: (type: RichTextCommandType) => void;
  onParagraphStyle?: (tag: string) => void;
  onTextSize?: (size: string) => void;
  /** Documentation only: render every command in its Figma `State=hover`. */
  forceState?: 'hover';
}

/** One tab stop with roving focus: Left / Right, Home / End. */
function useRoving() {
  const [cur, setCur] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const items = () => Array.from(ref.current?.querySelectorAll<HTMLElement>('[data-toolbar-item]') ?? []);
  return {
    ref,
    tab: (i: number) => (i === cur ? 0 : -1),
    onFocus: (e: FocusEvent<HTMLDivElement>) => {
      const i = items().indexOf(e.target as HTMLElement);
      if (i >= 0) setCur(i);
    },
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      const list = items();
      const i = list.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      const to = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? list.length - 1 : null;
      if (to == null) return;
      e.preventDefault();
      list[(to + list.length) % list.length].focus();
    },
  };
}

function CommandBar({ slots, formats = {}, onCommand, onParagraphStyle, onTextSize, forceState, roving }: CommandBarProps & { roving: ReturnType<typeof useRoving> }) {
  let n = -1;
  const commands: ReactNode[] = [];
  const selects: ReactNode[] = [];
  slots.forEach((s, k) => {
    if (s.kind === 'style' || s.kind === 'size') {
      const i = ++n;
      const style = s.kind === 'style';
      selects.push(
        <Select
          key={k}
          size="sm"
          options={style ? richTextParagraphStyles : richTextSizes}
          value={style ? formats.block ?? 'p' : formats.textSize ?? '3'}
          onValueChange={(v) => v && (style ? onParagraphStyle?.(v) : onTextSize?.(v))}
          aria-label={style ? 'Paragraph style' : 'Text size'}
          tabIndex={roving.tab(i)}
          data-toolbar-item=""
          onMouseDown={(e) => e.preventDefault()}
          className={style ? STYLE_SELECT_WIDTH : SIZE_SELECT_WIDTH}
        />,
      );
    } else if (s.kind === 'divider') {
      commands.push(<DividerWrapper key={k} />);
    } else {
      const i = ++n;
      commands.push(
        <RichTextCommand
          key={k}
          type={s.type}
          selected={s.type !== 'color' && !!formats[s.type]}
          color={s.type === 'color' ? formats.textColor : undefined}
          tabIndex={roving.tab(i)}
          forceState={forceState}
          onClick={() => onCommand?.(s.type)}
        />,
      );
    }
  });
  return (
    <>
      {selects.length > 0 && <div className="flex items-center gap-md">{selects}</div>}
      <div className="flex items-center gap-xxs">{commands}</div>
    </>
  );
}

export interface RichTextToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Type`: everyday commands, or with paragraph style and size selects, colour, media and AI commands. */
  type?: RichTextToolbarType;
  /** Figma `Show selects` (advanced only). */
  showSelects?: boolean;
  /** Formats on at the cursor: each command's Figma `Selected`; `textColor` fills the swatch; `block` and `textSize` set the selects. */
  formats?: RichTextFormats;
  /** Called with the command a person chose. */
  onCommand?: (type: RichTextCommandType) => void;
  onParagraphStyle?: (tag: string) => void;
  onTextSize?: (size: string) => void;
  /** Documentation only: every command in Figma `State=hover`. */
  forceState?: 'hover';
}

export function RichTextToolbar({
  type = 'advanced',
  showSelects = true,
  formats,
  onCommand,
  onParagraphStyle,
  onTextSize,
  forceState,
  className,
  ...rest
}: RichTextToolbarProps) {
  const roving = useRoving();
  return (
    <div
      data-anatomy="rich-text-toolbar"
      ref={roving.ref}
      role="toolbar"
      aria-label="Formatting"
      aria-orientation="horizontal"
      onFocus={roving.onFocus}
      onKeyDown={roving.onKeyDown}
      className={cn('flex flex-wrap items-center gap-md', className)}
      {...rest}
    >
      <CommandBar
        slots={toolbarSlots(type, showSelects)}
        formats={formats}
        onCommand={onCommand}
        onParagraphStyle={onParagraphStyle}
        onTextSize={onTextSize}
        forceState={forceState}
        roving={roving}
      />
    </div>
  );
}

export interface RichTextFloatingToolbarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Type`. */
  type?: RichTextToolbarType;
  formats?: RichTextFormats;
  onCommand?: (type: RichTextCommandType) => void;
}

export function RichTextFloatingToolbar({ type = 'simple', formats, onCommand, className, ...rest }: RichTextFloatingToolbarProps) {
  const roving = useRoving();
  return (
    <div
      data-anatomy="rich-text-toolbar"
      ref={roving.ref}
      role="toolbar"
      aria-label="Formatting"
      onFocus={roving.onFocus}
      onKeyDown={roving.onKeyDown}
      onMouseDown={(e) => e.preventDefault()}
      className={cn(
        'inline-flex w-max items-center gap-xxs rounded-surface border-(length:--border-width-default) border-border-subtle bg-surface-raised p-xs shadow-overlay',
        className,
      )}
      {...rest}
    >
      <CommandBar slots={floatingSlots(type)} formats={formats} onCommand={onCommand} roving={roving} />
    </div>
  );
}

/* ---------- editor ---------- */

const contentSize: Record<RichTextSize, string> = {
  sm: 'px-xl py-lg type-body-sm-regular',
  md: 'px-2xl py-xl type-body-md-regular',
};
/** Content model: heading, paragraph, list, link, quote, code block. Blocks are spaced by space/md. */
const contentStyles = cn(
  'text-text-primary outline-none [&>*+*]:mt-md',
  '[&_h3]:type-heading-xs-semibold [&_h4]:type-body-md-semibold',
  '[&_ul]:list-disc [&_ul]:ps-xl [&_ol]:list-decimal [&_ol]:ps-xl',
  '[&_a]:text-text-brand [&_a]:underline',
  '[&_blockquote]:border-s-(length:--border-width-strong) [&_blockquote]:border-border-default [&_blockquote]:ps-lg [&_blockquote]:text-text-secondary',
  '[&_pre]:whitespace-pre-wrap [&_pre]:rounded-control [&_pre]:bg-surface-sunken [&_pre]:p-md [&_pre]:type-code-sm-regular',
  '[&_img]:max-w-full [&_img]:rounded-control',
);

const blockTags = ['h3', 'h4', 'blockquote', 'pre', 'p'];
const sizeNames: Record<string, string> = { 'x-small': '1', small: '2', medium: '3', large: '4', 'x-large': '5', 'xx-large': '6' };

/** Formats on at the current selection. */
function readFormats(editor: HTMLElement): RichTextFormats {
  const sel = document.getSelection();
  const node = sel?.anchorNode ?? null;
  const el = node ? (node.nodeType === 1 ? (node as HTMLElement) : node.parentElement) : null;
  const inside = !!el && editor.contains(el);
  const q = (cmd: string) => {
    try {
      return inside && document.queryCommandState(cmd);
    } catch {
      return false;
    }
  };
  const block = inside ? blockTags.find((t) => el!.closest(t) && editor.contains(el!.closest(t))) : undefined;
  let textSize: string | undefined;
  if (inside) {
    const fs = el!.closest<HTMLElement>('[style*="font-size"], font[size]');
    textSize = fs && editor.contains(fs) ? (fs.getAttribute('size') ?? sizeNames[fs.style.fontSize] ?? '3') : '3';
  }
  return {
    bold: q('bold'),
    italic: q('italic'),
    underline: q('underline'),
    'bullet-list': q('insertUnorderedList'),
    'align-left': q('justifyLeft'),
    'align-center': q('justifyCenter'),
    'align-right': q('justifyRight'),
    justify: q('justifyFull'),
    link: inside && !!el!.closest('a'),
    code: block === 'pre',
    textColor: inside ? getComputedStyle(el!).color : undefined,
    block: block === 'pre' ? 'p' : block ?? 'p',
    textSize,
  };
}

export interface RichTextEditorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'> {
  /** Figma `Size`: padding, min height, content style and the gap to the toolbar. */
  size?: RichTextSize;
  /** Figma `Type`: fixed toolbar above the surface, or the floating toolbar on selection. */
  type?: 'default' | 'floating-toolbar';
  /** Rich text toolbar `Type` used by `type="default"` (advanced in the Figma set). */
  toolbarType?: RichTextToolbarType;
  /** Rich text toolbar `Show selects`. */
  showSelects?: boolean;
  /** Rich text floating toolbar `Type` used by `type="floating-toolbar"`. */
  floatingToolbarType?: RichTextToolbarType;
  /** Figma `Show hint` + Help text: shown below the surface, never inside it. */
  hint?: ReactNode;
  /** Initial content (HTML). The editor is uncontrolled; read changes with `onValueChange`. */
  defaultValue?: string;
  onValueChange?: (html: string) => void;
  /** Placeholder: what to write ("Write a description…"). */
  placeholder?: string;
  /** Fixed surface height (CSS length). Content scrolls inside it; people can still resize. Without it the surface grows with the content. */
  height?: string;
  /** Accessible name of the surface when no Label points at it (`aria-labelledby`). */
  label?: string;
  /** Commands without built-in behaviour (attachment, video, generate, more) and every command after it ran. */
  onCommand?: (type: RichTextCommandType) => void;
}

export function RichTextEditor({
  size = 'md',
  type = 'default',
  toolbarType = 'advanced',
  showSelects = true,
  floatingToolbarType = 'simple',
  hint,
  defaultValue = '',
  onValueChange,
  placeholder = 'Write something…',
  height,
  label,
  onCommand,
  onKeyDown: onKeyDownProp,
  className,
  id: idProp,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedByProp,
  ...rest
}: RichTextEditorProps) {
  const auto = useId().replace(/:/g, '');
  const id = idProp ?? `rte-${auto}`;
  const hintId = `${id}-hint`;
  const editor = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const colorInput = useRef<HTMLInputElement>(null);
  const toolbar = useRef<HTMLDivElement>(null);
  const saved = useRef<Range | null>(null);
  const [initial] = useState(defaultValue);
  const [formats, setFormats] = useState<RichTextFormats>({});
  const [empty, setEmpty] = useState(!defaultValue);
  const [floating, setFloating] = useState<{ left: number; top: number; below: boolean } | null>(null);
  const thumb = useScrollThumb(scroller);
  const floatingMode = type === 'floating-toolbar';
  // 1.6 Motion: the floating toolbar enters at base · enter and leaves at fast · exit,
  // keeping its last position while it fades out.
  const floatPresence = usePresence(!!floating);
  const lastFloating = useRef(floating);
  if (floating) lastFloating.current = floating;

  const sync = useCallback(() => {
    const ed = editor.current;
    if (!ed) return;
    setFormats(readFormats(ed));
    setEmpty(!ed.textContent?.trim() && !ed.querySelector('img, ul, ol, pre, blockquote'));
  }, []);

  // New blocks are paragraphs, as in the content model.
  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'p');
  }, []);

  // Track the selection: Selected states, the saved range for toolbar commands, and the floating toolbar.
  useEffect(() => {
    const onSel = () => {
      const ed = editor.current;
      const sel = document.getSelection();
      if (!ed || !sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!ed.contains(range.commonAncestorContainer)) {
        if (document.activeElement && !box.current?.parentElement?.contains(document.activeElement)) setFloating(null);
        return;
      }
      saved.current = range.cloneRange();
      setFormats(readFormats(ed));
      if (floatingMode) {
        if (range.collapsed || !sel.toString().trim()) return setFloating(null);
        const r = range.getBoundingClientRect();
        const b = box.current!.getBoundingClientRect();
        // Above the selection; below it near the top of the viewport. Never over the selected text.
        const below = r.top < FLIP_MARGIN;
        setFloating({ left: r.left + r.width / 2 - b.left, top: (below ? r.bottom : r.top) - b.top, below });
      }
    };
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, [floatingMode]);

  const restore = () => {
    const ed = editor.current;
    if (!ed) return;
    ed.focus({ preventScroll: true });
    const sel = document.getSelection();
    if (saved.current && sel) {
      sel.removeAllRanges();
      sel.addRange(saved.current);
    }
  };

  const changed = () => {
    sync();
    onValueChange?.(editor.current?.innerHTML ?? '');
  };

  const exec = (cmd: string, value?: string) => {
    restore();
    document.execCommand('styleWithCSS', false, cmd === 'foreColor' || cmd === 'fontSize' ? 'true' : 'false');
    document.execCommand(cmd, false, value);
    changed();
  };

  const run = (t: RichTextCommandType) => {
    switch (t) {
      case 'bold':
        exec('bold');
        break;
      case 'italic':
        exec('italic');
        break;
      case 'underline':
        exec('underline');
        break;
      case 'bullet-list':
        exec('insertUnorderedList');
        break;
      case 'align-left':
        exec('justifyLeft');
        break;
      case 'align-center':
        exec('justifyCenter');
        break;
      case 'align-right':
        exec('justifyRight');
        break;
      case 'justify':
        exec('justifyFull');
        break;
      case 'code':
        exec('formatBlock', formats.code ? 'p' : 'pre');
        break;
      case 'link': {
        if (formats.link) exec('unlink');
        else {
          const url = window.prompt('Link address', 'https://');
          if (url) exec('createLink', url);
          else restore();
        }
        break;
      }
      case 'image': {
        const url = window.prompt('Image address', 'https://');
        if (url) exec('insertImage', url);
        else restore();
        break;
      }
      case 'color':
        colorInput.current?.click();
        break;
      default:
        restore();
    }
    onCommand?.(t);
  };

  /** Markdown shortcuts at the start of a block: "- " or "* " → list, "# " → heading, "> " → quote. */
  const markdownShortcut = () => {
    const sel = document.getSelection();
    const node = sel?.anchorNode;
    if (!sel || !sel.isCollapsed || !node || node.nodeType !== 3) return false;
    const before = (node.textContent ?? '').slice(0, sel.anchorOffset);
    const action = ({ '-': ['insertUnorderedList'], '*': ['insertUnorderedList'], '#': ['formatBlock', 'h3'], '>': ['formatBlock', 'blockquote'] } as Record<string, string[]>)[before];
    const block = node.parentElement?.closest('p, div, h3, h4, li, blockquote');
    if (!action || !block || !editor.current?.contains(block) || !(block.textContent ?? '').startsWith(before)) return false;
    const r = document.createRange();
    r.setStart(node, 0);
    r.setEnd(node, sel.anchorOffset);
    r.deleteContents();
    saved.current = null;
    document.execCommand(action[0], false, action[1]);
    changed();
    return true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDownProp?.(e);
    if (e.defaultPrevented) return;
    const mod = e.metaKey || e.ctrlKey;
    if (e.altKey && e.key === 'F10') {
      e.preventDefault();
      const bar = floatingMode ? box.current?.parentElement?.querySelector<HTMLElement>('[role="toolbar"] [data-toolbar-item]') : toolbar.current?.querySelector<HTMLElement>('[data-toolbar-item][tabindex="0"]');
      bar?.focus();
      return;
    }
    if (e.key === ' ' && !mod && markdownShortcut()) {
      e.preventDefault();
      return;
    }
    if (!mod) return;
    const k = e.key.toLowerCase();
    const map: Record<string, RichTextCommandType> = e.shiftKey
      ? { '8': 'bullet-list', '*': 'bullet-list', l: 'align-left', e: 'align-center', r: 'align-right', j: 'justify' }
      : { k: 'link' };
    const t = map[k];
    if (t) {
      e.preventDefault();
      run(t);
    }
  };

  const describedBy = [describedByProp, hint != null ? hintId : undefined].filter(Boolean).join(' ') || undefined;
  const boxStyle: CSSProperties | undefined = height ? { height } : undefined;

  return (
    <div className={cn('flex w-full min-w-0 flex-col', size === 'sm' ? 'gap-md' : 'gap-lg', className)} {...rest}>
      {!floatingMode && (
        <div ref={toolbar}>
          <RichTextToolbar
            type={toolbarType}
            showSelects={showSelects}
            formats={formats}
            onCommand={run}
            onParagraphStyle={(tag) => exec('formatBlock', tag)}
            onTextSize={(s) => exec('fontSize', s)}
            aria-controls={id}
          />
        </div>
      )}
      <div className="relative flex flex-col gap-sm">
        <div
          data-anatomy="input"
          ref={box}
          style={boxStyle}
          className={cn(
            textControlSurface(),
            'flex-col overflow-hidden resize-y [&::-webkit-resizer]:bg-transparent',
            MIN_HEIGHT[size],
          )}
        >
          <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {empty && (
              <span aria-hidden className={cn('pointer-events-none absolute inset-x-0 top-0 text-text-placeholder', contentSize[size])}>
                {placeholder}
              </span>
            )}
            <div
              data-anatomy="rich-text-content"
              ref={editor}
              id={id}
              role="textbox"
              aria-multiline="true"
              aria-label={labelledBy ? undefined : label ?? 'Rich text'}
              aria-labelledby={labelledBy}
              aria-describedby={describedBy}
              contentEditable
              // Explicit tab stop (contenteditable is already one); lets tools see the scroll area is reachable.
              tabIndex={0}
              suppressContentEditableWarning
              data-text-control-field=""
              className={cn('relative min-h-full', contentSize[size], contentStyles)}
              dangerouslySetInnerHTML={{ __html: initial }}
              onInput={changed}
              onKeyDown={onKeyDown}
              onKeyUp={sync}
              onMouseUp={sync}
              onFocus={sync}
            />
          </div>
          <RichTextScrollBar thumb={thumb} />
          {/* Resize handle: decorative grip over the native resizer, bottom trailing corner. */}
          <svg
            aria-hidden
            data-anatomy="resize-handle"
            viewBox="0 0 12 12"
            className="pointer-events-none absolute bottom-sm right-sm size-(--size-icon-xs) stroke-current text-icon-tertiary"
            fill="none"
            strokeWidth={1.25}
            strokeLinecap="round"
          >
            <path d="M11 3 3 11M11 7.5 7.5 11" />
          </svg>
        </div>
        {floatingMode && floatPresence.mounted && lastFloating.current && (
          <div
            data-side={lastFloating.current.below ? 'below' : 'above'}
            inert={floatPresence.closing || undefined}
            className={cn('absolute z-50', presenceClass(floatPresence.closing))}
            style={{ left: lastFloating.current.left, top: lastFloating.current.top, transform: `translate(-50%, ${lastFloating.current.below ? 'var(--space-xs)' : 'calc(-100% - var(--space-xs))'})` }}
          >
            <RichTextFloatingToolbar type={floatingToolbarType} formats={formats} onCommand={run} aria-controls={id} />
          </div>
        )}
        {hint != null && <HelpText id={hintId} size={size} hint={hint} />}
      </div>
      <input
        ref={colorInput}
        type="color"
        tabIndex={-1}
        aria-hidden
        className="sr-only"
        onChange={(e) => exec('foreColor', e.target.value)}
      />
    </div>
  );
}
