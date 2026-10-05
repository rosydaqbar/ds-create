import { RichTextEditor, RichTextFloatingToolbar, RichTextToolbar, type RichTextSize } from '@/components/sections/RichTextEditor';
import { RichTextCommand, RichTextScrollBar, richTextCommandTypes } from '@/components/sections/_RichTextParts';
import { TextareaField } from '@/components/components/TextField';
import { Avatar } from '@/components/parts/Avatar';
import { Button } from '@/components/parts/Button';
import { Label } from '@/components/parts/Label';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';
import { DemoCard } from './_demo';

const SIZES = ['sm', 'md'] as const;
const TYPES = ['default', 'floating-toolbar'] as const;
const COMMAND_COLS = ['rest · false', 'rest · true', 'hover · false', 'hover · true'] as const;
/** Editor width in the Figma set: 640. */
const EDITOR_W = 'w-[40rem] max-w-full';

const sample = `<h3>Release notes</h3>
<p>This update makes <strong>sharing faster</strong> and adds a new <a href="#">activity view</a> for every project.</p>
<ul><li>Share a link with one click</li><li>See who opened a document</li><li>Filter activity by person</li></ul>`;
const long = Array.from({ length: 8 }, (_, i) => `<p>Paragraph ${i + 1}. Content is top-aligned and scrolls inside the surface when it is longer than the current height.</p>`).join('');

const editor = (size: RichTextSize, type: (typeof TYPES)[number]) => (
  <div className={EDITOR_W}>
    <RichTextEditor size={size} type={type} defaultValue={sample} hint="Markdown shortcuts work too." label={`Editor ${size} ${type}`} />
  </div>
);

const highlight = () => (
  <div className="relative flex flex-col items-center gap-xs pt-xs">
    <RichTextFloatingToolbar type="simple" formats={{ bold: true }} />
    <p className="type-body-md-regular max-w-[26rem] text-text-secondary">
      Our goal this quarter is to <span className="bg-fill-brand-subtle font-semibold text-text-primary">reduce onboarding time by half</span> while keeping activation steady.
    </p>
  </div>
);

export default defineDoc({
  id: '4.1',
  name: 'Rich text editor',
  level: 'sections',
  spec: 'sections/4.1-rich-text-editor.md',
  exports: ['RichTextEditor', 'RichTextToolbar', 'RichTextFloatingToolbar'],
  summary:
    'A writing surface with a toolbar, for text that benefits from formatting. Text starts at the top, the surface can be resized and scrolls when content is long, and the hint sits below the surface. The Rich text toolbar holds the formatting commands (simple, or advanced with paragraph style and size selects, colour, media and AI); the Rich text floating toolbar shows the same commands next to selected text.',
  hero: () => (
    <div className={EDITOR_W}>
      <RichTextEditor size="md" defaultValue={sample} hint="Markdown shortcuts work too." label="Release notes" />
    </div>
  ),
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'default' },
      { name: 'toolbarType', figma: 'Rich text toolbar · Type', control: { type: 'select', options: ['simple', 'advanced'] }, default: 'advanced' },
      { name: 'showSelects', figma: 'Rich text toolbar · Show selects', control: { type: 'boolean' }, default: true },
      { name: 'floatingToolbarType', figma: 'Rich text floating toolbar · Type', control: { type: 'select', options: ['simple', 'advanced'] }, default: 'simple' },
      { name: 'hint', figma: 'Show hint + Hint', control: { type: 'text' }, default: 'Markdown shortcuts work too.' },
      { name: 'longContent', figma: 'Show scroll bar (from long content)', control: { type: 'boolean' }, default: false },
    ],
    render: ({ longContent, ...a }) => (
      <div className={EDITOR_W}>
        <RichTextEditor key={`${a.type}-${longContent}`} {...a} defaultValue={longContent ? long : sample} height={longContent ? '12rem' : undefined} label="Playground editor" />
      </div>
    ),
    code: ({ longContent, ...a }) =>
      `<RichTextEditor${jsxProps(a, { size: 'md', type: 'default', toolbarType: 'advanced', showSelects: true, floatingToolbarType: 'simple' })}${longContent ? ' height="12rem"' : ''}
  defaultValue={html}
  onValueChange={setHtml}
/>`,
  },
  examples: [
    {
      title: 'Comment box',
      caption: 'A small editor with the simple toolbar; the submit action stays a visible Button.',
      render: () => (
        <DemoCard className="w-[34rem] max-w-full">
          <div className="flex gap-md">
            <Avatar size="sm" type="initials" initials="OR" alt="Olivia Rhye" />
            <div className="flex min-w-0 flex-1 flex-col gap-md">
              <RichTextEditor size="sm" toolbarType="simple" placeholder="Add a comment…" label="Comment" />
              <div className="flex justify-end">
                <Button size="sm" label="Comment" />
              </div>
            </div>
          </div>
        </DemoCard>
      ),
      code: `<Avatar size="sm" src={me.photo} alt="" />
<RichTextEditor size="sm" toolbarType="simple" placeholder="Add a comment…" label="Comment" onValueChange={setDraft} />
<Button size="sm" label="Comment" onClick={submit} />`,
    },
    {
      title: 'Text highlight',
      caption: 'The floating toolbar sits above the selected phrase and never covers it.',
      render: highlight,
      code: `<RichTextEditor type="floating-toolbar" floatingToolbarType="simple" defaultValue={html} />`,
    },
    {
      title: 'Task description',
      caption: 'In a narrow side panel the fixed toolbar is removed; select text to format it.',
      render: () => (
        <div className="flex w-[22rem] flex-col gap-lg rounded-surface border-(length:--border-width-default) border-border-subtle bg-surface-raised p-xl">
          <span className="type-heading-xs-semibold text-text-primary">Update onboarding emails</span>
          <div className="flex flex-col gap-sm">
            <Label as="span" id="task-desc-label" size="md" label="Description" />
            <RichTextEditor
              size="sm"
              type="floating-toolbar"
              aria-labelledby="task-desc-label"
              defaultValue="<p>Rewrite the <strong>welcome email</strong> and the day-3 follow-up. Keep both under 120 words.</p>"
              placeholder="Write a description…"
            />
          </div>
        </div>
      ),
      code: `<Label as="span" id="desc-label" label="Description" />
<RichTextEditor size="sm" type="floating-toolbar" aria-labelledby="desc-label" placeholder="Write a description…" />`,
    },
  ],
  whenToUse: {
    use: ['Comments, descriptions, messages and notes where formatting helps the reader.', 'Long content people structure with headings and lists.'],
    dont: ['Plain text is enough — most fields are: use a Textarea field (3.2).', 'Code or markup — use a code editor.', 'A single line — use a Text field (3.2).'],
  },
  matrices: [
    {
      title: 'Rich text toolbar',
      rows: 'Type',
      render: () => (
        <Matrix
          rowProp="Type"
          rows={['simple', 'advanced', 'advanced · Show selects=false'] as const}
          colProp="Toolbar"
          cols={['instance'] as const}
          cell={(row) => <RichTextToolbar type={row === 'simple' ? 'simple' : 'advanced'} showSelects={row === 'advanced'} formats={{ bold: true, 'align-left': true }} />}
        />
      ),
    },
    {
      title: 'Rich text floating toolbar',
      rows: 'Type',
      render: () => (
        <Matrix
          rowProp="Type"
          rows={['simple', 'advanced'] as const}
          colProp="Toolbar"
          cols={['instance'] as const}
          cell={(type) => <RichTextFloatingToolbar type={type} formats={{ bold: true }} />}
        />
      ),
    },
    {
      title: 'Rich text editor',
      rows: 'Size',
      columns: 'Type',
      render: () => (
        <div className="flex min-w-0 flex-col gap-xl">
          <Matrix rowProp="Size" rows={SIZES} colProp="Type" cols={TYPES} className="[&_.grid]:items-start" cell={(size, type) => editor(size, type)} />
          <div className="flex flex-col gap-sm">
            <span className="type-body-sm-semibold text-text-primary">Show scroll bar=true</span>
            <div className={EDITOR_W}>
              <RichTextEditor size="md" defaultValue={long} height="12rem" hint="Up to 2,000 characters." label="Long content" />
            </div>
          </div>
        </div>
      ),
    },
  ],
  privateParts: [
    {
      title: '.Main/Rich text editor command',
      rows: 'Type',
      columns: 'State → Selected',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">Every command in both toolbars. Selected means the format is on at the cursor; it combines with hover.</p>
          <Matrix
            rowProp="Type"
            rows={richTextCommandTypes}
            colProp="State · Selected"
            cols={COMMAND_COLS}
            cell={(type, col) => {
              const [state, selected] = col.split(' · ');
              return <RichTextCommand type={type} selected={selected === 'true'} forceState={state === 'hover' ? 'hover' : undefined} showTooltip={false} />;
            }}
          />
        </div>
      ),
    },
    {
      title: '.Main/Rich text editor scroll bar',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">A 4-wide thumb with no rail, inset space/xs from the surface edge; it appears when the content is taller than the surface.</p>
          <div className="relative h-40 w-24 rounded-control border-(length:--border-width-default) border-border-default bg-surface-base">
            <RichTextScrollBar thumb={{ top: 0.2, size: 0.4, overflow: true }} />
          </div>
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className={EDITOR_W}>
        <RichTextEditor defaultValue={sample} hint="Markdown shortcuts work too." label="Anatomy editor" />
      </div>
    ),
    parts: [
      { name: 'Rich text toolbar', description: 'Selects (Select 3.5, sm: paragraph style, size) → commands, gap space/md; commands gap space/xxs. Group order: text style → colour → paragraph → insert → AI and more.', tokens: ['space/md', 'space/xxs'] },
      { name: 'Command', description: '.Main/Rich text editor command: 32 × 32, radius/control, icon size/icon/md. Selected = fill/neutral/subtle/selected; hover = fill/neutral/subtle/hover.', tokens: ['size/control/xs', 'radius/control', 'size/icon/md', 'color/fill/neutral/subtle/selected', 'color/fill/neutral/subtle/hover', 'color/icon/tertiary', 'color/icon/primary'] },
      { name: 'Divider wrapper', description: 'Padding-x space/xs, height 20, holding a vertical Divider (2.16) so every divider has the same spacing.', tokens: ['space/xs', 'size/icon/md'] },
      { name: 'Input', description: 'The Text control’s fill, border, radius and focus (2.10); min height 120 (sm) / 160 (md); padding space/lg × space/xl (sm), space/xl × space/2xl (md). Gap to the toolbar space/md (sm) / space/lg (md).', tokens: ['color/surface/base', 'color/border/default', 'color/border/brand', 'radius/control', 'focus/default'] },
      { name: 'Rich text content', description: 'Top-aligned, blocks spaced space/md: heading type/heading/xs/semibold; paragraphs and lists type/body/{sm|md}/regular; links color/text/brand; selection color/fill/brand/subtle.', tokens: ['type/heading/xs/semibold', 'type/body/md/regular', 'color/text/primary', 'color/text/brand', 'color/fill/brand/subtle'] },
      { name: 'Resize handle', description: 'Bottom trailing corner of the input, its own layer; drag to resize.', tokens: ['color/icon/tertiary'] },
      { name: 'Scroll bar', description: '.Main/Rich text editor scroll bar: 4-wide thumb, inset space/xs, when content is long.', tokens: ['color/fill/neutral/track', 'radius/full'] },
      { name: 'Help text', description: 'Help text (2.12) below the surface, gap space/sm; never inside it.', tokens: ['space/sm', 'color/text/tertiary'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'RichTextEditor: padding, min height, content style, gap to the toolbar.' },
    { name: 'type', figma: 'Type', type: "'default' | 'floating-toolbar'", default: "'default'", description: 'RichTextEditor: fixed toolbar above the surface, or the floating toolbar on selection.' },
    { name: 'toolbarType', figma: 'Rich text toolbar · Type', type: "'simple' | 'advanced'", default: "'advanced'", description: 'RichTextEditor: the fixed toolbar’s Type.' },
    { name: 'showSelects', figma: 'Rich text toolbar · Show selects', type: 'boolean', default: 'true', description: 'Paragraph style and size selects (advanced only).' },
    { name: 'floatingToolbarType', figma: 'Rich text floating toolbar · Type', type: "'simple' | 'advanced'", default: "'simple'", description: 'RichTextEditor: the floating toolbar’s Type.' },
    { name: 'hint', figma: 'Show hint + Hint', type: 'ReactNode', description: 'Help text below the surface. Present = shown.' },
    { name: 'defaultValue / onValueChange', type: 'string (HTML)', description: 'Initial content and every change. The editor is uncontrolled.' },
    { name: 'placeholder', type: 'string', default: "'Write something…'", description: 'What to write (“Write a description…”).' },
    { name: 'height', figma: 'Show scroll bar (derived)', type: 'string', description: 'Fixed surface height: content scrolls inside it and the scroll bar appears. Without it the surface grows with the content.' },
    { name: 'label / aria-labelledby', type: 'string', description: 'Accessible name of the surface: a Label (2.11) id, or a name.' },
    { name: 'onCommand', type: '(type) => void', description: 'Called after every command; attachment, video, generate and more have no built-in behaviour.' },
    { name: 'Toolbars · type', figma: 'Type', type: "'simple' | 'advanced'", default: "'advanced' · 'simple'", description: 'RichTextToolbar / RichTextFloatingToolbar: which commands they hold.' },
    { name: 'Toolbars · formats', figma: 'Command · Selected', type: 'RichTextFormats', description: 'Toolbars: formats on at the cursor ({ bold: true, textColor, block, textSize }).' },
    { name: 'Toolbars · onCommand / onParagraphStyle / onTextSize', type: 'callbacks', description: 'Toolbars: the chosen command, paragraph style (block tag) and size.' },
  ],
  tokens: [
    'color/fill/none', 'color/fill/neutral/subtle/hover', 'color/fill/neutral/subtle/selected', 'color/icon/tertiary', 'color/icon/secondary', 'color/icon/primary',
    'radius/control', 'size/control/xs', 'size/icon/md', 'space/xxs', 'space/xs', 'space/sm', 'space/md', 'space/lg', 'space/xl', 'space/2xl',
    'color/surface/base', 'color/border/default', 'color/border/strong', 'color/border/brand', 'focus/default',
    'color/text/primary', 'color/text/brand', 'color/text/placeholder', 'color/fill/brand/subtle', 'type/heading/xs/semibold', 'type/body/sm/regular', 'type/body/md/regular',
    'color/surface/raised', 'color/border/subtle', 'radius/surface', 'elevation/overlay', 'color/fill/neutral/track',
  ],
  guidelines: [
    {
      title: 'Editor or textarea',
      body: 'Choose the editor only when formatting helps the reader.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-3xl">
          <div className="w-[20rem]">
            <TextareaField label="Feedback" placeholder="What could be better?" hint="Plain text is enough here." />
          </div>
          <div className="w-[26rem]">
            <RichTextEditor size="sm" toolbarType="simple" placeholder="Write the announcement…" hint="Headings and lists help readers scan." label="Announcement" />
          </div>
        </div>
      ),
    },
    {
      title: 'Simple or advanced',
      body: 'Start simple; add advanced commands only where people format long content.',
      render: () => (
        <div className="flex flex-col items-start gap-xl">
          <RichTextToolbar type="simple" />
          <RichTextToolbar type="advanced" />
        </div>
      ),
    },
    {
      title: 'Command states',
      body: 'Selected shows the format at the cursor; it is not hover.',
      render: () => (
        <div className="flex items-end gap-2xl">
          {(
            [
              ['rest', false, undefined],
              ['hover', false, 'hover'],
              ['selected', true, undefined],
              ['selected + hover', true, 'hover'],
            ] as const
          ).map(([name, sel, force]) => (
            <div key={name} className="flex flex-col items-center gap-sm">
              <RichTextCommand type="bold" selected={sel} forceState={force} showTooltip={false} />
              <span className="type-body-xs-regular text-text-tertiary">{name}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Floating toolbar',
      body: 'The same commands, next to the selection. It never covers the selected text: above it, or below near the top of the viewport.',
      render: highlight,
    },
    {
      title: 'Content, scroll and resize',
      body: 'Content is top-aligned. A long text scrolls inside the surface with the scroll bar; drag the resize handle to make the surface taller.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-xl">
          <div className="w-[20rem]">
            <RichTextEditor size="sm" type="floating-toolbar" defaultValue="<p>A short note.</p>" label="Short" />
          </div>
          <div className="w-[20rem]">
            <RichTextEditor size="sm" type="floating-toolbar" defaultValue={long} height="10rem" label="Long" />
          </div>
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Keep the number of formatting options small; offer what the output can render. Placeholder text describes what to write (“Write a description…”); hints carry limits (“Up to 2,000 characters”).',
    },
    {
      title: 'Use the command part',
      body: 'Every toolbar control is .Main/Rich text editor command, so states and sizes match in both toolbars.',
      do: { caption: 'Command parts with their states.', render: () => <RichTextFloatingToolbar formats={{ italic: true }} /> },
      dont: {
        caption: 'Hand-drawn toolbar icons without states.',
        render: () => (
          <div className="flex items-center gap-lg text-icon-tertiary">
            <span className="type-body-md-semibold">B</span>
            <span className="type-body-md-regular italic">I</span>
            <span className="type-body-md-regular underline">U</span>
          </div>
        ),
      },
    },
    {
      title: 'Keep dividers in wrappers',
      body: 'Dividers sit in Divider wrappers so the spacing around every divider is the same.',
      do: { caption: 'Divider wrappers: even spacing.', render: () => <RichTextToolbar type="simple" /> },
      dont: {
        caption: 'Loose lines with uneven gaps.',
        render: () => (
          <div className="flex items-center">
            <RichTextCommand type="bold" showTooltip={false} />
            <RichTextCommand type="italic" showTooltip={false} />
            <span className="mx-xxs h-(--size-icon-lg) border-s-(length:--border-width-default) border-border-subtle" />
            <RichTextCommand type="bullet-list" showTooltip={false} />
            <span className="ms-xl me-xs h-(--size-icon-sm) border-s-(length:--border-width-default) border-border-subtle" />
            <RichTextCommand type="link" showTooltip={false} />
          </div>
        ),
      },
    },
    {
      title: 'A focused set of commands',
      body: 'Offer the commands people need for the task.',
      do: { caption: 'A comment box with the simple toolbar.', render: () => <RichTextToolbar type="simple" /> },
      dont: { caption: 'Every formatting option in a comment box.', render: () => <RichTextToolbar type="advanced" /> },
    },
    {
      title: 'Essential actions stay visible',
      body: 'Don’t hide essential actions (submit, attach) only in the floating toolbar; every floating command is also reachable by keyboard shortcut or a fixed control.',
      dont: { caption: 'Attach only reachable after selecting text.', render: () => <RichTextFloatingToolbar type="advanced" /> },
    },
    {
      title: 'Maintenance',
      body: 'Commands change in .Main/Rich text editor command and update both toolbars; the surface follows the Text control tokens; the selects follow Select (3.5).',
    },
  ],
  accessibility: [
    'Each toolbar is one tab stop (role="toolbar"); Left / Right, Home and End move between its commands and selects. Alt+F10 in the surface moves to the toolbar.',
    'Every command has an accessible name and shows a Tooltip (2.13) with its name and shortcut (Kbd 2.17): “Bold ⌘B”.',
    'Selected commands announce their pressed state (aria-pressed).',
    'Formatting in the floating toolbar is also reachable from the keyboard: ⌘B, ⌘I, ⌘U, ⌘K and ⌘⇧8 / L / E / R / J.',
    'The surface is a multi-line textbox with a name: a Label (2.11) through aria-labelledby, or `label`; the hint is its description.',
    'Markdown shortcuts at the start of a line: “- ” or “* ” starts a list, “# ” a heading, “> ” a quote.',
  ],
});
