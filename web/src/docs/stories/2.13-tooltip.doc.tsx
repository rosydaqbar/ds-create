import type { ReactNode } from 'react';
import { HelpIcon, Tooltip, TooltipBubble, tooltipPlacements, type TooltipPlacement } from '@/components/parts/Tooltip';
import { IconButton } from '@/components/parts/IconButton';
import { Label } from '@/components/parts/Label';
import { HelpText } from '@/components/parts/HelpText';
import { Kbd } from '@/components/parts/Kbd';
import { cn } from '@/lib/cn';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';
import { TextControl } from '@/components/parts/TextControl';
import { DemoField } from './_demo';

const PLACEMENTS = tooltipPlacements;
const HELP_STATES = ['rest', 'hover', 'focus'] as const;
const SUPPORTING = 'Tooltips are used to describe or identify an element. In most scenarios, tooltips help the user understand meaning, function or alt-text.';

/** Reserve room around a trigger so an open tooltip never overlaps its neighbours. */
const cellBox: Record<TooltipPlacement, string> = {
  none: 'w-[9rem] h-[7rem]',
  top: 'w-[9rem] h-[7rem]',
  bottom: 'w-[9rem] h-[7rem]',
  'top-start': 'w-[15rem] h-[7rem]',
  'top-end': 'w-[15rem] h-[7rem]',
  left: 'w-[19rem] h-[7rem]',
  right: 'w-[19rem] h-[7rem]',
};
const Cell = ({ placement, children }: { placement: TooltipPlacement; children: ReactNode }) => (
  <div className={cn('flex items-center justify-center', cellBox[placement])}>{children}</div>
);

export default defineDoc({
  id: '2.13',
  name: 'Tooltip',
  level: 'parts',
  spec: 'parts/2.13-tooltip.md',
  exports: ['Tooltip', 'TooltipBubble', 'HelpIcon'],
  summary:
    'Describes or identifies an element on hover or focus. A dark surface with a short text, optional supporting text and an arrow on the side of the trigger. Placement only changes where the arrow sits. Help icon is a help-circle icon that opens a Tooltip on hover and focus, used beside field labels.',
  hero: () => (
    <div className="pt-[9rem]">
      <Tooltip open text="This is a tooltip" supportingText="Tooltips are used to describe or identify an element.">
        <IconButton emphasis="secondary" icon="alerts/help-circle" label="Help" />
      </Tooltip>
    </div>
  ),
  playground: {
    controls: [
      { name: 'text', figma: 'Text', control: { type: 'text' }, default: 'This is a tooltip' },
      { name: 'placement', figma: 'Placement', control: { type: 'select', options: PLACEMENTS }, default: 'top' },
      { name: 'supportingText', figma: 'Show supporting text + Supporting text', control: { type: 'text' }, default: '' },
      { name: 'open', figma: '— (hover or focus the trigger)', control: { type: 'boolean' }, default: true },
    ],
    render: (a) => (
      <div className="p-[8rem]">
        <Tooltip text={a.text} placement={a.placement} supportingText={a.supportingText || undefined} open={a.open || undefined}>
          <IconButton emphasis="secondary" icon="general/link" label="Insert link" />
        </Tooltip>
      </div>
    ),
    code: (a) => `<Tooltip${jsxProps(a, { placement: 'top', open: false }, ['open'])}>
  <IconButton icon="general/link" label="Insert link" />
</Tooltip>`,
  },
  examples: [
    {
      title: 'Toolbar',
      caption: 'Icon-only controls get their name from a Tooltip.',
      render: () => (
        <div className="flex gap-xs pt-4xl">
          <Tooltip text="Bold">
            <IconButton icon="editor/bold" label="Bold" />
          </Tooltip>
          <Tooltip text="Italic">
            <IconButton icon="editor/italic" label="Italic" />
          </Tooltip>
          <Tooltip text="Insert link" open>
            <IconButton icon="general/link" label="Insert link" forceState="hover" />
          </Tooltip>
          <Tooltip text="Insert image">
            <IconButton icon="images/image" label="Insert image" />
          </Tooltip>
        </div>
      ),
      code: `<Tooltip text="Bold"><IconButton icon="editor/bold" label="Bold" /></Tooltip>
<Tooltip text="Italic"><IconButton icon="editor/italic" label="Italic" /></Tooltip>
<Tooltip text="Insert link"><IconButton icon="general/link" label="Insert link" /></Tooltip>
<Tooltip text="Insert image"><IconButton icon="images/image" label="Insert image" /></Tooltip>`,
    },
    {
      title: 'Field help',
      caption: 'Short, non-essential detail sits behind a help icon; what users need to fill the field stays in Help text.',
      render: () => (
        <DemoField className="max-w-[20rem] pt-4xl">
          <Label htmlFor="tax" label="Tax ID" showHelpIcon helpText="We need this for invoices in some countries." helpPlacement="top-start" helpForceState="focus" />
          <TextControl id="tax" aria-describedby="tax-hint" />
          <HelpText id="tax-hint" hint="Use the format shown on your registration." />
        </DemoField>
      ),
      code: `<Label htmlFor="tax-id" label="Tax ID" showHelpIcon helpText="We need this for invoices in some countries." />
<TextControl id="tax-id" aria-describedby="tax-id-hint" />
<HelpText id="tax-id-hint" hint="Use the format shown on your registration." />`,
    },
    {
      title: 'Truncated name',
      caption: 'A Tooltip can reveal the full text of a truncated label.',
      render: () => (
        <div className="w-full max-w-[22rem] overflow-visible rounded-surface border border-border-subtle bg-surface-base pt-0">
          <div className="type-body-xs-semibold border-b border-border-subtle px-lg py-md text-text-tertiary">File name</div>
          <div className="flex px-lg pb-md pt-[3.5rem]">
            <Tooltip text="Quarterly marketing report – final version.pdf" placement="top-start" open>
              <span tabIndex={0} className="type-body-sm-medium block max-w-[14rem] truncate rounded-xs text-text-primary outline-none is-focus:shadow-focus-default">
                Quarterly marketing report – final version.pdf
              </span>
            </Tooltip>
          </div>
        </div>
      ),
      code: `<Tooltip text="Quarterly marketing report – final version.pdf" placement="top-start">
  <span tabIndex={0} className="block max-w-[14rem] truncate">Quarterly marketing report – final version.pdf</span>
</Tooltip>`,
    },
    {
      title: 'Shortcut hint',
      caption: 'Tooltips can teach a keyboard shortcut.',
      render: () => (
        <div className="pt-4xl">
          <Tooltip
            open
            text="Search"
            trailing={
              <span className="inline-flex gap-xxs">
                <Kbd text="⌘" />
                <Kbd text="K" />
              </span>
            }
          >
            <IconButton emphasis="secondary" icon="general/search" label="Search" />
          </Tooltip>
        </div>
      ),
      code: `<Tooltip text="Search" trailing={<><Kbd text="⌘" /><Kbd text="K" /></>}>
  <IconButton icon="general/search" label="Search" />
</Tooltip>`,
    },
  ],
  whenToUse: {
    use: ['Name an icon-only control or identify an image.', 'Show the full text of a truncated label.', 'Add short, non-essential detail on hover or focus.'],
    dont: ['Information users need to complete a task — keep it visible or in Help text (2.12).', 'Links, buttons or other interactive content — use a popover or a dialog.', 'Disabled elements that can’t be focused.'],
  },
  matrices: [
    {
      title: 'Tooltip',
      rows: 'Show supporting text',
      columns: 'Placement',
      render: () => (
        <Matrix
          rowProp="Show supporting text"
          rows={['false', 'true'] as const}
          colProp="Placement"
          cols={PLACEMENTS}
          cell={(sup, placement) => <TooltipBubble placement={placement} supportingText={sup === 'true' ? SUPPORTING : undefined} />}
        />
      ),
    },
    {
      title: 'Help icon',
      rows: 'State',
      columns: 'Placement',
      render: () => (
        <Matrix
          rowProp="State"
          rows={HELP_STATES}
          colProp="Placement"
          cols={PLACEMENTS}
          cell={(state, placement) => (
            <Cell placement={placement}>
              <HelpIcon placement={placement} forceState={state === 'rest' ? undefined : state} />
            </Cell>
          )}
        />
      ),
    },
    {
      title: 'Help icon · extras',
      render: () => (
        <div className="flex flex-wrap gap-4xl rounded-surface border border-dashed border-border-brand-subtle p-xl">
          <div className="flex flex-col items-start gap-md">
            <AxisLabel prop="State=hover · Show supporting text" value="true" />
            <div className="flex h-[12rem] w-[22rem] items-end justify-center pb-xl">
              <HelpIcon forceState="hover" supportingText="Tooltips are used to describe or identify an element." />
            </div>
          </div>
          <div className="flex flex-col items-start gap-md">
            <AxisLabel prop="State=hover · Show cursor" value="true" />
            <div className="flex h-[12rem] w-[12rem] items-end justify-center pb-xl">
              <HelpIcon forceState="hover" showCursor />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '.Main/Tooltip arrow',
      columns: 'Placement (edge of the Tooltip)',
      render: () => (
        <Matrix
          rowProp="Arrow"
          rows={['shape'] as const}
          colProp="Placement"
          cols={['top', 'bottom', 'left', 'right'] as const}
          cell={(_, edge) => <TooltipBubble text="Arrow" placement={({ top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const)[edge]} />}
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-center gap-3xl">
        <div className="flex flex-wrap items-end justify-center gap-4xl">
          <TooltipBubble placement="top" text="This is a tooltip" supportingText="Tooltips are used to describe or identify an element." />
          <div className="flex h-[8rem] w-[10rem] items-end justify-center pb-xl">
            <span className="relative inline-flex outline-1 outline-offset-2 outline-dashed outline-border-brand">
              <HelpIcon forceState="hover" showCursor />
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-xl">
          <TooltipBubble text="Text only" />
          <TooltipBubble text="With supporting text" supportingText="Supporting text is one or two short sentences." />
        </div>
      </div>
    ),
    parts: [
      { name: 'Content', description: 'Vertical stack, padding space/md × space/lg (space/lg all round with supporting text), max width size/width/xxs, radius/surface, color/surface/inverse, elevation/overlay.', tokens: ['color/surface/inverse', 'radius/surface', 'elevation/overlay', 'size/width/xxs'] },
      { name: 'Text', description: 'type/body/xs/semibold, color/text/inverse. Centred when alone; start-aligned with supporting text.', tokens: ['type/body/xs/semibold', 'color/text/inverse'] },
      { name: 'Supporting text', description: 'Optional, type/body/xs/medium, color/text/inverse, space/xs under the text; wraps at the max width.', tokens: ['type/body/xs/medium', 'space/xs'] },
      { name: 'Arrow', description: '.Main/Tooltip arrow, 16 × 6, a sibling of the Content with the same fill. Inset space/lg for -start / -end.', tokens: ['color/surface/inverse', 'space/lg'] },
      { name: 'Help icon', description: 'help-circle at size/icon/sm; bounds are the icon only. The Tooltip sits space/xs outside, so opening it moves nothing.', tokens: ['size/icon/sm', 'color/icon/tertiary', 'color/icon/tertiary/hover', 'focus/default'] },
      { name: 'Cursor', description: 'Pointer specimen for mockups (Show cursor), hover only.' },
    ],
  },
  props: [
    { name: 'text', figma: 'Text', type: 'ReactNode', default: "'This is a tooltip'", description: 'A short phrase without a full stop. For icon-only triggers it matches their name.' },
    { name: 'supportingText', figma: 'Show supporting text + Supporting text', type: 'ReactNode', description: 'One or two short sentences; present = shown.' },
    { name: 'placement', figma: 'Placement', type: "'none' | 'top' | 'top-start' | 'top-end' | 'bottom' | 'left' | 'right'", default: "'top'", description: 'Side of the trigger. Flips when it would leave the viewport; `none` follows the pointer.' },
    { name: 'trailing', type: 'ReactNode', description: 'Content after the text, such as a Kbd shortcut.' },
    { name: 'children', type: 'ReactElement', description: 'Tooltip: the trigger. It gets aria-describedby pointing at the tooltip.' },
    { name: 'open', type: 'boolean', description: 'Documentation only: keep the tooltip open.' },
    { name: 'HelpIcon · label', type: 'string', default: "'More information'", description: 'Accessible name of the help trigger, e.g. “More information about Tax ID”.' },
    { name: 'HelpIcon · forceState', figma: 'State', type: "'hover' | 'focus'", description: 'Documentation only: shows the open tooltip statically.' },
    { name: 'HelpIcon · showCursor', figma: 'Show cursor', type: 'boolean', default: 'false', description: 'Pointer specimen; only with forceState="hover".' },
  ],
  tokens: [
    'color/surface/inverse', 'color/text/inverse', 'elevation/overlay', 'radius/surface', 'type/body/xs/semibold', 'type/body/xs/medium',
    'space/md', 'space/lg', 'space/xs', 'size/width/xxs', 'motion/delay/tooltip', 'motion/duration/fast',
    'color/icon/tertiary', 'color/icon/tertiary/hover', 'focus/default', 'size/icon/sm',
  ],
  guidelines: [
    {
      title: 'When a Tooltip is right',
      body: 'Use a Tooltip to name an icon-only control, to identify an image, or to show the full text of a truncated label. Its content is a bonus: the interface must work without it.',
      render: () => (
        <div className="flex flex-wrap items-end gap-x-[6rem] gap-y-4xl pt-4xl">
          <div className="flex gap-xs">
            <IconButton icon="editor/bold" label="Bold" />
            <Tooltip text="Insert link" open>
              <IconButton icon="general/link" label="Insert link" forceState="hover" />
            </Tooltip>
            <IconButton icon="images/image" label="Insert image" />
          </div>
          <Tooltip text="Quarterly marketing report – final version.pdf" placement="top-start" open>
            <span tabIndex={0} className="type-body-sm-medium block max-w-[12rem] truncate text-text-primary">
              Quarterly marketing report – final version.pdf
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: 'Keep essential information visible',
      body: 'Instructions users need to complete a task — formats, rules, consequences — belong in the interface or in Help text (2.12). A Tooltip is hidden until hovered or focused and doesn’t exist on touch screens.',
      do: {
        caption: 'Requirements in Help text; the help icon explains why.',
        render: () => (
          <DemoField className="w-[18rem] pt-4xl">
            <Label htmlFor="pw-tt-do" label="Password" showHelpIcon helpText="Strong passwords protect shared workspaces." helpPlacement="top-start" helpForceState="hover" />
            <TextControl id="pw-tt-do" inputType="password" />
            <HelpText hint="Use 8 or more characters with at least one number." />
          </DemoField>
        ),
      },
      dont: {
        caption: 'Requirements only inside the help tooltip.',
        render: () => (
          <DemoField className="w-[18rem] pt-4xl">
            <Label htmlFor="pw-tt-dont" label="Password" showHelpIcon helpText="8+ characters, one number" helpPlacement="top-start" helpForceState="hover" />
            <TextControl id="pw-tt-dont" inputType="password" />
          </DemoField>
        ),
      },
    },
    {
      title: 'Short title, optional supporting text',
      body: 'The Text is a short phrase. Supporting text is one or two short sentences that add detail; turn it on only when the Text alone is not enough. A tooltip is read in passing, never as a paragraph.',
      do: { caption: 'A short title with two short sentences.', render: () => <TooltipBubble text="Archive project" supportingText="Archived projects are read-only. You can restore them at any time." /> },
      dont: {
        caption: 'A paragraph and a list.',
        render: () => (
          <TooltipBubble
            text="About archiving"
            supportingText="When you archive a project, it becomes read-only for every member. Comments, files and tasks stay where they are, but nobody can change them. Integrations stop syncing. Owners can restore the project, export it, or delete it permanently from the archive page. • Read-only • Integrations paused • Restorable"
          />
        ),
      },
    },
    {
      title: 'Placement and collisions',
      body: 'Pick the side of the trigger with room to show the Tooltip; top is the default. In the product the Tooltip flips to the opposite side when it would leave the viewport, and the arrow follows. Use -start / -end when the trigger is near the left or right edge of the screen. Use none only when the Tooltip follows the pointer, for example over a chart.',
      render: () => (
        <div className="flex flex-wrap justify-center">
          {PLACEMENTS.filter((p) => p !== 'none').map((p) => (
            <Cell key={p} placement={p}>
              <Tooltip text={p} placement={p} open>
                <IconButton emphasis="secondary" icon="general/link" label={`Placement ${p}`} size="sm" />
              </Tooltip>
            </Cell>
          ))}
        </div>
      ),
    },
    {
      title: 'Hover, focus, keyboard and touch',
      body: 'A Tooltip opens on hover after a short delay (motion/delay/tooltip) and on keyboard focus immediately; it closes when the pointer leaves or focus moves, and on Escape. It stays open while the pointer moves onto it. On touch, Help icon opens on tap and closes on a second tap or a tap elsewhere; other Tooltips don’t appear on touch. Disabled elements that can’t be focused never get a Tooltip.',
      render: () => (
        <div className="flex flex-wrap items-end justify-center gap-xl">
          {([
            ['rest', undefined],
            ['hover', 'hover'],
            ['keyboard focus', 'focus'],
          ] as const).map(([cap, st]) => (
            <div key={cap} className="flex w-[11rem] flex-col items-center gap-md">
              <div className="flex h-[6rem] items-end">
                <HelpIcon forceState={st} showCursor={st === 'hover'} text="Tap to open" />
              </div>
              <span className="type-body-xs-medium text-text-tertiary">{cap}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'One family, many triggers',
      body: 'Help icon uses the same Tooltip; it doesn’t draw its own surface. Change the Tooltip once — colour, radius, padding, type — and every help icon in every field updates.',
      render: () => (
        <div className="flex flex-wrap items-end justify-center gap-4xl">
          <TooltipBubble text="Tooltip" />
          <span className="type-body-sm-medium pb-md text-text-tertiary">→</span>
          <div className="pt-4xl">
            <Label label="Tax ID" showHelpIcon helpText="Tooltip" helpForceState="hover" />
          </div>
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Text is a short phrase without a full stop (“Copy link”, “Archive project”); for an icon-only control, it is the control’s name. Supporting text uses full sentences with full stops. Don’t repeat the trigger’s visible label. No links, buttons or other interactive content. Sentence case.',
      do: { caption: 'Names the icon-only action.', render: () => <TooltipBubble text="Copy link" /> },
      dont: { caption: 'Title case, full stop, repeats a visible label.', render: () => <TooltipBubble text="Click Here To Copy The Link." /> },
    },
  ],
  accessibility: [
    'The tooltip has role="tooltip" and is linked to its trigger with aria-describedby; for an icon-only trigger its text also matches the trigger’s accessible name.',
    'Help icon is a focusable button with an accessible name (“More information about Tax ID”); its Tooltip is its description.',
    'Tooltips appear on keyboard focus, not only on hover, and close on Escape without moving focus.',
    'Text on the inverse surface meets the text contrast threshold in every colour mode.',
    'Hover-only triggers with essential content are an accessibility failure, not a style choice.',
  ],
});
