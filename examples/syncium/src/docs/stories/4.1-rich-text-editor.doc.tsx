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
/** Hero: sits right under the page title (h1), so its content starts without an h3 — heading levels never skip. The field label names it. */
const heroSample = sample.replace(/^<h3>[^<]*<\/h3>\n/, '');
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
    'The rich text editor is for writing that benefits from formatting, like comments, descriptions and release notes. Its toolbar sits above the text, or a floating toolbar appears next to selected text.',
  hero: () => (
    <div className={EDITOR_W}>
      <RichTextEditor size="md" defaultValue={heroSample} hint="Markdown shortcuts work too." label="Release notes" />
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
      caption: 'A small editor with the simple toolbar keeps comments light, and the submit button stays visible outside it.',
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
      caption: 'The floating toolbar appears above the selected phrase, so it never covers what you’re formatting.',
      render: highlight,
      code: `<RichTextEditor type="floating-toolbar" floatingToolbarType="simple" defaultValue={html} />`,
    },
    {
      title: 'Task description',
      caption: 'In a narrow side panel, drop the fixed toolbar and let people select text to format it.',
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
    use: ['Comments, descriptions, messages and notes where formatting helps the reader.', 'Longer content that people organize with headings and lists.'],
    dont: ['For plain text, which is all most fields need, use a Textarea field (3.2).', 'For code or markup, use a code editor.', 'For a single line, use a Text field (3.2).'],
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
          <p className="type-body-sm-regular text-text-secondary">Every command used in both toolbars. Selected means the format is on at the cursor, and it can combine with hover.</p>
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
          <p className="type-body-sm-regular text-text-secondary">A 4-pixel-wide thumb with no rail, set in a little from the surface edge. It appears when the content is taller than the surface.</p>
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
        {/* The sample plus more paragraphs in a fixed height, so the input scrolls and shows its scroll bar. */}
        <RichTextEditor defaultValue={sample + long} height="12rem" hint="Markdown shortcuts work too." label="Anatomy editor" />
      </div>
    ),
    parts: [
      { name: 'Rich text toolbar', target: 'rich-text-toolbar', description: 'Holds the formatting commands, with the paragraph style and size selects first. Commands are grouped in order: text style, color, paragraph, insert, then AI and more.', tokens: ['space/md', 'space/xxs'] },
      { name: 'Command', target: 'command', description: 'A square, icon-only formatting button. It gets a light fill on hover and a selected fill when its format is on at the cursor.', tokens: ['size/control/xs', 'radius/control', 'size/icon/md', 'color/fill/neutral/subtle/selected', 'color/fill/neutral/subtle/hover', 'color/icon/tertiary', 'color/icon/primary'] },
      { name: 'Divider wrapper', target: 'divider-wrapper', description: 'Holds a vertical Divider (2.16) with padding on both sides, so every divider in the toolbar gets the same spacing.', tokens: ['space/xs', 'size/icon/md'] },
      { name: 'Input', target: 'input', description: 'The writing area. It uses the same fill, border, corner radius and focus ring as a text control (2.10). The md size has more padding and a taller minimum height than sm.', tokens: ['color/surface/base', 'color/border/default', 'color/border/brand', 'radius/control', 'focus/default'] },
      { name: 'Rich text content', target: 'rich-text-content', description: 'The text itself, starting at the top. Headings, paragraphs, lists and links use the system’s text styles, and selected text gets a light brand highlight.', tokens: ['type/heading/xs/semibold', 'type/body/md/regular', 'color/text/primary', 'color/text/brand', 'color/fill/brand/subtle'] },
      { name: 'Resize handle', target: 'resize-handle', description: 'Sits in the bottom trailing corner of the input. Drag it to resize the surface.', tokens: ['color/icon/tertiary'] },
      { name: 'Scroll bar', target: 'scroll-bar', description: 'A thin scroll thumb that appears when the content is longer than the surface.', tokens: ['color/fill/neutral/track', 'radius/full'] },
      { name: 'Help text', target: 'help-text', description: 'Help text (2.12) for hints and limits. It sits below the surface, never inside it.', tokens: ['space/sm', 'color/text/tertiary'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'RichTextEditor: sets the padding, minimum height, content text style and gap to the toolbar.' },
    { name: 'type', figma: 'Type', type: "'default' | 'floating-toolbar'", default: "'default'", description: 'RichTextEditor: a fixed toolbar above the surface, or a floating toolbar that appears on selection.' },
    { name: 'toolbarType', figma: 'Rich text toolbar · Type', type: "'simple' | 'advanced'", default: "'advanced'", description: 'RichTextEditor: which commands the fixed toolbar holds.' },
    { name: 'showSelects', figma: 'Rich text toolbar · Show selects', type: 'boolean', default: 'true', description: 'Shows the paragraph style and size selects. Advanced toolbar only.' },
    { name: 'floatingToolbarType', figma: 'Rich text floating toolbar · Type', type: "'simple' | 'advanced'", default: "'simple'", description: 'RichTextEditor: which commands the floating toolbar holds.' },
    { name: 'hint', figma: 'Show hint + Hint', type: 'ReactNode', description: 'Help text below the surface. Shown when set.' },
    { name: 'defaultValue / onValueChange', type: 'string (HTML)', description: 'The initial HTML content, and a callback for every change. The editor is uncontrolled.' },
    { name: 'placeholder', type: 'string', default: "'Write something…'", description: 'Tells people what to write, for example “Write a description…”.' },
    { name: 'height', figma: 'Show scroll bar (derived)', type: 'string', description: 'A fixed surface height. Content scrolls inside it and the scroll bar appears. Without it, the surface grows with the content.' },
    { name: 'label / aria-labelledby', type: 'string', description: 'The surface’s accessible name: the id of a Label (2.11), or a name string.' },
    { name: 'onCommand', type: '(type) => void', description: 'Called after every command. Attachment, video, generate and more have no built-in behavior, so handle them here.' },
    { name: 'Toolbars · type', figma: 'Type', type: "'simple' | 'advanced'", default: "'advanced' · 'simple'", description: 'RichTextToolbar / RichTextFloatingToolbar: which commands they hold.' },
    { name: 'Toolbars · formats', figma: 'Command · Selected', type: 'RichTextFormats', description: 'Toolbars: the formats that are on at the cursor ({ bold: true, textColor, block, textSize }).' },
    { name: 'Toolbars · onCommand / onParagraphStyle / onTextSize', type: 'callbacks', description: 'Toolbars: called with the chosen command, paragraph style (block tag) or text size.' },
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
      body: 'Formatting tools add weight to a form. Use the editor when headings, lists or links make the text easier to read, and a plain textarea everywhere else.',
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
      body: 'Start with the simple toolbar. Switch to the advanced one only where people format long content, like documents or announcements.',
      render: () => (
        <div className="flex flex-col items-start gap-xl">
          <RichTextToolbar type="simple" />
          <RichTextToolbar type="advanced" />
        </div>
      ),
    },
    {
      title: 'Command states',
      body: 'Selected shows which formats are on at the cursor, so it’s a different signal from hover. A command can be selected and hovered at the same time.',
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
      body: 'The floating toolbar offers the same commands right next to the selection. It appears above the selected text, or below it near the top of the screen, so it never covers what’s selected.',
      render: highlight,
    },
    {
      title: 'Scrolling and resizing',
      body: 'Text starts at the top of the surface. Long text scrolls inside it with a scroll bar, and people can drag the resize handle to make the surface taller.',
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
      body: 'Offer a small set of formatting options, and only ones the final output can show. Use the placeholder to say what to write (“Write a description…”) and the hint for limits (“Up to 2,000 characters”).',
    },
    {
      title: 'Use the command part',
      body: 'Build every toolbar control from the shared command part, so states and sizes match in both toolbars.',
      do: { caption: 'Command parts, with hover and selected states.', render: () => <RichTextFloatingToolbar formats={{ italic: true }} /> },
      dont: {
        caption: 'Hand-drawn icons with no states.',
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
      body: 'Place each divider in a divider wrapper so the spacing around every divider is the same.',
      do: { caption: 'Wrapped dividers with even spacing.', render: () => <RichTextToolbar type="simple" /> },
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
      body: 'Offer the commands people need for the task, and leave the rest out. A comment box rarely needs paragraph styles or AI tools.',
      do: { caption: 'A comment box with the simple toolbar.', render: () => <RichTextToolbar type="simple" /> },
      dont: { caption: 'Every formatting option in a comment box.', render: () => <RichTextToolbar type="advanced" /> },
    },
    {
      title: 'Essential actions stay visible',
      body: 'Keep essential actions like submit and attach in view, not only in the floating toolbar. Make every floating command reachable by a keyboard shortcut or a fixed control too.',
      dont: { caption: 'Attach is only reachable after selecting text.', render: () => <RichTextFloatingToolbar type="advanced" /> },
    },
    {
      title: 'Maintenance',
      body: 'Change a command in the shared command part and both toolbars update. The surface follows the text control tokens, and the selects follow Select (3.5).',
    },
  ],
  accessibility: [
    'Each toolbar is a single tab stop (role="toolbar"). Inside it, Left / Right, Home and End move between commands and selects. Alt+F10 in the surface jumps to the toolbar.',
    'Every command has a name screen readers announce, and a Tooltip (2.13) shows that name with its shortcut (Kbd 2.17), like “Bold ⌘B”.',
    'Screen readers announce whether a command is on, through its pressed state (aria-pressed).',
    'Keyboard users can apply the floating toolbar’s formatting with shortcuts too: ⌘B, ⌘I, ⌘U, ⌘K and ⌘⇧8 / L / E / R / J.',
    'The surface is a multi-line textbox. It takes its name from a Label (2.11) through aria-labelledby, or from label, and the hint is read as its description.',
    'Markdown shortcuts work at the start of a line: “- ” or “* ” starts a list, “# ” a heading and “> ” a quote.',
  ],
});
