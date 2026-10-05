import { Kbd } from '@/components/parts/Kbd';
import { Tooltip, TooltipBubble } from '@/components/parts/Tooltip';
import { IconButton } from '@/components/parts/IconButton';
import { Button } from '@/components/parts/Button';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';
import { TextControl } from '@/components/parts/TextControl';

const SIZES = ['sm', 'md'] as const;
const KEYS = ['K', 'Esc', 'Shift', 'Enter', '⌘', '↵'] as const;

const Keys = ({ keys, size = 'sm' }: { keys: string[]; size?: 'sm' | 'md' }) => (
  <span className="inline-flex items-center gap-xxs">
    {keys.map((k) => (
      <Kbd key={k} size={size} text={k} />
    ))}
  </span>
);

const MenuRow = ({ label, keys }: { label: string; keys: string[] }) => (
  <div role="menuitem" aria-keyshortcuts={keys.map((k) => (k === '⌘' ? 'Meta' : k)).join('+')} className="type-body-sm-medium flex items-center justify-between gap-xl rounded-control px-md py-sm text-text-secondary">
    {label}
    <Keys keys={keys} />
  </div>
);

export default defineDoc({
  id: '2.17',
  name: 'Kbd',
  level: 'parts',
  spec: 'parts/2.17-kbd.md',
  exports: ['Kbd'],
  summary: 'Shows one keyboard key in a shortcut or an instruction. One key per Kbd; combinations are built by placing Kbds in a row. Display only.',
  hero: () => (
    <div className="flex scale-150 items-center gap-3xl">
      <Kbd size="md" text="K" />
      <Keys size="md" keys={['⌘', 'K']} />
    </div>
  ),
  playground: {
    controls: [
      { name: 'text', figma: 'Text', control: { type: 'text' }, default: 'K' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'sm' },
    ],
    render: (a) => <Kbd {...a} />,
    code: (a) => `<Kbd${jsxProps(a, { size: 'sm' })} />`,
  },
  examples: [
    {
      title: 'Menu with shortcuts',
      caption: 'Shortcuts sit at the end of menu items, one Kbd per key.',
      render: () => (
        <div role="menu" className="flex w-[15rem] flex-col gap-xxs rounded-surface border border-border-subtle bg-surface-raised p-xs shadow-overlay">
          <MenuRow label="Copy" keys={['⌘', 'C']} />
          <MenuRow label="Paste" keys={['⌘', 'V']} />
          <MenuRow label="Select all" keys={['⌘', 'A']} />
        </div>
      ),
      code: `<MenuItem aria-keyshortcuts="Meta+C">
  Copy
  <span className="inline-flex gap-xxs"><Kbd text="⌘" /><Kbd text="C" /></span>
</MenuItem>`,
    },
    {
      title: 'Search field hint',
      caption: 'A Kbd inside a field tells users how to reach it from anywhere.',
      render: () => <TextControl aria-label="Search" aria-keyshortcuts="/" className="max-w-[20rem]" leadingIcon="general/search" placeholder="Search" shortcut="/" />,
      code: `<TextControl aria-label="Search" aria-keyshortcuts="/" leadingIcon="general/search" placeholder="Search" shortcut="/" />`,
    },
    {
      title: 'Tooltip with shortcut',
      caption: 'Tooltips teach the shortcut for the control they name.',
      render: () => (
        <div className="pt-4xl">
          <Tooltip open text="Bold" trailing={<Keys keys={['⌘', 'B']} />}>
            <IconButton emphasis="secondary" icon="editor/bold" label="Bold" aria-keyshortcuts="Meta+B" />
          </Tooltip>
        </div>
      ),
      code: `<Tooltip text="Bold" trailing={<><Kbd text="⌘" /><Kbd text="B" /></>}>
  <IconButton icon="editor/bold" label="Bold" aria-keyshortcuts="Meta+B" />
</Tooltip>`,
    },
    {
      title: 'Inline instruction',
      caption: 'Inline keys sit on the text line and match its size.',
      render: () => (
        <p className="type-body-md-regular text-text-secondary">
          Press <Kbd size="md" text="Enter" /> to send, or <Kbd size="md" text="Shift" /> + <Kbd size="md" text="Enter" /> for a new line.
        </p>
      ),
      code: `<p className="type-body-md-regular">
  Press <Kbd size="md" text="Enter" /> to send, or <Kbd size="md" text="Shift" /> + <Kbd size="md" text="Enter" /> for a new line.
</p>`,
    },
  ],
  whenToUse: {
    use: ['Showing keyboard shortcuts next to the action they trigger.', 'Keys in instructions and help content.'],
    dont: ['Code, values or file names — use code-styled text.', 'Clickable actions — use a Button.'],
  },
  matrices: [
    {
      title: 'Kbd',
      rows: 'Text',
      columns: 'Size',
      render: () => <Matrix rowProp="Text" rows={KEYS} colProp="Size" cols={SIZES} cell={(text, size) => <Kbd size={size} text={text} />} />,
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-center gap-3xl">
        <div className="scale-200 py-lg">
          <Kbd size="md" text="K" />
        </div>
        <div className="flex flex-col gap-lg">
          <span className="type-body-sm-regular flex items-center gap-sm text-text-secondary">
            <AxisLabel prop="Size" value="sm" /> Small text <Kbd size="sm" text="Esc" /> menus and tooltips
          </span>
          <span className="type-body-md-regular flex items-center gap-sm text-text-secondary">
            <AxisLabel prop="Size" value="md" /> Body text <Kbd size="md" text="Esc" /> help pages
          </span>
        </div>
        <div className="flex items-center gap-md">
          {['K', 'Esc', 'Shift', 'Enter'].map((k) => (
            <Kbd key={k} size="md" text={k} />
          ))}
          <span className="type-body-xs-medium px-md text-text-tertiary">·</span>
          <Keys size="md" keys={['⌘', 'K']} />
        </div>
      </div>
    ),
    parts: [
      { name: 'Key surface', description: 'Height kbd/height/{size}, min width = height so single characters are square; padding-x space/xs (sm) or space/sm (md). color/surface/sunken, inside border color/border/default, radius/xs.', tokens: ['kbd/height/sm', 'kbd/height/md', 'color/surface/sunken', 'color/border/default', 'radius/xs'] },
      { name: 'Text', description: 'Single line, centred. type/body/xs/medium (sm) or type/body/sm/medium (md), color/text/secondary.', tokens: ['type/body/xs/medium', 'type/body/sm/medium', 'color/text/secondary'] },
    ],
  },
  props: [
    { name: 'text', figma: 'Text', type: 'string', default: "'K'", description: 'One key: printed name or platform symbol. Symbols get a spoken text alternative (“Command”).' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'sm'", description: 'sm next to small text, menus, tooltips; md next to body text.' },
  ],
  tokens: ['color/surface/sunken', 'color/border/default', 'border/width/default', 'radius/xs', 'color/text/secondary', 'type/body/xs/medium', 'type/body/sm/medium', 'space/xs', 'space/sm', 'space/xxs', 'kbd/height/sm', 'kbd/height/md'],
  guidelines: [
    {
      title: 'One key per Kbd',
      body: 'Build a combination from one Kbd per key in a row, space/xxs apart. A whole shortcut in one Kbd (“⌘+K”) reads as one strange key and can’t wrap.',
      do: { caption: 'Three Kbds: “Ctrl” “Shift” “P”.', render: () => <Keys size="md" keys={['Ctrl', 'Shift', 'P']} /> },
      dont: { caption: 'One Kbd with “Ctrl+Shift+P”.', render: () => <Kbd size="md" text="Ctrl+Shift+P" /> },
    },
    {
      title: 'Match the platform',
      body: 'Show the shortcut for the user’s platform — the command symbol on macOS, “Ctrl” elsewhere — not both side by side. Use the same symbols everywhere in the product.',
      render: () => (
        <div className="flex flex-wrap gap-4xl">
          <div className="flex w-[13rem] flex-col gap-xs">
            <span className="type-body-xs-semibold text-text-tertiary">macOS</span>
            <MenuRow label="Copy" keys={['⌘', 'C']} />
          </div>
          <div className="flex w-[13rem] flex-col gap-xs">
            <span className="type-body-xs-semibold text-text-tertiary">Windows, Linux</span>
            <MenuRow label="Copy" keys={['Ctrl', 'C']} />
          </div>
        </div>
      ),
    },
    {
      title: 'Size follows the text',
      body: 'Use sm next to small text, in menus and tooltips; use md next to body text. A Kbd never makes the text line taller.',
      render: () => (
        <div className="flex flex-col gap-lg">
          <p className="type-body-sm-regular text-text-secondary">
            Press <Kbd text="Enter" /> to send.
          </p>
          <p className="type-body-md-regular text-text-secondary">
            Press <Kbd size="md" text="Enter" /> to send.
          </p>
        </div>
      ),
    },
    {
      title: 'Display only',
      body: 'A Kbd is never clickable. If the key also exists as an action on screen, use a Button. Don’t use a Kbd for code, values or file names; use code-styled text.',
      do: {
        caption: 'A Button “Save” with its shortcut in the Tooltip.',
        render: () => (
          <div className="flex flex-col items-center gap-xs">
            <TooltipBubble text="Save" trailing={<Keys keys={['⌘', 'S']} />} />
            <Button label="Save" aria-keyshortcuts="Meta+S" />
          </div>
        ),
      },
      dont: { caption: 'A Kbd “Save” used as a button.', render: () => <Kbd size="md" text="Save" className="cursor-pointer" /> },
    },
    {
      title: 'Content',
      body: 'Use the key’s printed name with its usual capitalisation: “Enter”, “Esc”, “Shift”, “Tab”, “K”. Use a symbol only when the platform prints it on the key (arrows, ⌘, ⌥, ⇧, ↵); keep the same choice across the product. Single letters are upper case.',
    },
  ],
  accessibility: [
    'Each key renders a native <kbd> element.',
    'Symbols have a text alternative read by screen readers (⌘ → “Command”, ↵ → “Enter”); the glyph itself is hidden.',
    'A shortcut shown next to a menu item or control is also exposed on the item itself (aria-keyshortcuts), not only drawn.',
    'Text on the key fill meets the text contrast threshold in every colour mode.',
  ],
});
