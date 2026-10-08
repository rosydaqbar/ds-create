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
  spec: 'specs/parts/2.13-tooltip.md',
  exports: ['Tooltip', 'TooltipBubble', 'HelpIcon'],
  summary:
    'Tooltips name or explain an element when people hover over it or focus it, like an icon-only button or a cut-off label. The help icon opens one beside a field label.',
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
      caption: 'Each icon-only button shows its name in a tooltip, so people know what it does before they click.',
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
      caption: 'Nice-to-know detail goes behind the help icon. What people need to fill in the field stays visible in the help text.',
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
      caption: 'When a label is cut off, a tooltip shows the full text.',
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
      caption: 'A tooltip is a good place to teach the keyboard shortcut for an action.',
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
    use: ['Name an icon-only control or identify an image.', 'Show the full text of a truncated label.', 'Add a short, nice-to-know detail on hover or focus.'],
    dont: ['For information people need to finish a task, keep it visible or use Help text (2.12).', 'For links, buttons or other interactive content, use a popover or a dialog.', 'Skip disabled elements that can’t be focused: keyboard users would never see the tooltip.'],
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
      { name: 'Content', target: 'content', description: 'The dark surface that holds the text. It wraps at a fixed maximum width and gets more padding when supporting text is shown.', tokens: ['color/surface/inverse', 'radius/surface', 'elevation/overlay', 'size/width/xxs'] },
      { name: 'Text', target: 'text', description: 'The short title. It’s centered on its own and aligns to the start when supporting text follows.', tokens: ['type/body/xs/semibold', 'color/text/inverse'] },
      { name: 'Supporting text', target: 'supporting-text', description: 'Optional detail just below the title. It wraps at the tooltip’s maximum width.', tokens: ['type/body/xs/medium', 'space/xs'] },
      { name: 'Arrow', target: 'arrow', description: 'A 16 × 6 point that aims at the trigger, in the same color as the surface. With a start or end placement, it sits in from the corner.', tokens: ['color/surface/inverse', 'space/lg'] },
      { name: 'Help icon', target: 'help-icon', description: 'A small help-circle icon with no extra padding around it. Its tooltip opens just outside, so nothing on the page shifts.', tokens: ['size/icon/sm', 'color/icon/tertiary', 'color/icon/tertiary/hover', 'focus/default'] },
      { name: 'Cursor', target: 'cursor', description: 'A pointer you can show in mockups to illustrate the hover state.' },
    ],
  },
  props: [
    { name: 'text', figma: 'Text', type: 'ReactNode', default: "'This is a tooltip'", description: 'A short phrase with no full stop. For an icon-only trigger, it matches the trigger’s name.' },
    { name: 'supportingText', figma: 'Show supporting text + Supporting text', type: 'ReactNode', description: 'One or two short sentences of detail. Shown when set.' },
    { name: 'placement', figma: 'Placement', type: "'none' | 'top' | 'top-start' | 'top-end' | 'bottom' | 'left' | 'right'", default: "'top'", description: 'The side of the trigger the tooltip opens on. It flips when it would leave the viewport. none follows the pointer.' },
    { name: 'trailing', type: 'ReactNode', description: 'Content after the text, such as a Kbd shortcut.' },
    { name: 'children', type: 'ReactElement', description: 'The trigger. It gets aria-describedby pointing at the tooltip.' },
    { name: 'open', type: 'boolean', description: 'Documentation only: keeps the tooltip open.' },
    { name: 'HelpIcon · label', type: 'string', default: "'More information'", description: 'The accessible name of the help trigger, for example “More information about Tax ID”.' },
    { name: 'HelpIcon · forceState', figma: 'State', type: "'hover' | 'focus'", description: 'Documentation only: shows the tooltip open without any interaction.' },
    { name: 'HelpIcon · showCursor', figma: 'Show cursor', type: 'boolean', default: 'false', description: 'Shows a pointer specimen. Use it only with forceState="hover".' },
  ],
  tokens: [
    'color/surface/inverse', 'color/text/inverse', 'elevation/overlay', 'radius/surface', 'type/body/xs/semibold', 'type/body/xs/medium',
    'space/md', 'space/lg', 'space/xs', 'size/width/xxs', 'motion/delay/tooltip', 'motion/duration/fast',
    'color/icon/tertiary', 'color/icon/tertiary/hover', 'focus/default', 'size/icon/sm',
  ],
  guidelines: [
    {
      title: 'When to use a tooltip',
      body: 'Use a tooltip to name an icon-only control, identify an image or show the full text of a cut-off label. Treat what it says as a bonus: the interface should still work without it.',
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
      body: 'Instructions people need to finish a task, like formats, rules and consequences, belong on the screen or in Help text (2.12). A tooltip stays hidden until someone hovers or focuses, and most never appear on touch screens.',
      do: {
        caption: 'Requirements in the help text, with the help icon explaining why.',
        render: () => (
          <DemoField className="w-[18rem] pt-4xl">
            <Label htmlFor="pw-tt-do" label="Password" showHelpIcon helpText="Strong passwords protect shared workspaces." helpPlacement="top-start" helpForceState="hover" />
            <TextControl id="pw-tt-do" inputType="password" />
            <HelpText hint="Use 8 or more characters with at least one number." />
          </DemoField>
        ),
      },
      dont: {
        caption: 'Requirements hidden inside the help tooltip.',
        render: () => (
          <DemoField className="w-[18rem] pt-4xl">
            <Label htmlFor="pw-tt-dont" label="Password" showHelpIcon helpText="8+ characters, one number" helpPlacement="top-start" helpForceState="hover" />
            <TextControl id="pw-tt-dont" inputType="password" />
          </DemoField>
        ),
      },
    },
    {
      title: 'Keep it short',
      body: 'Write the title as a short phrase. Add supporting text, one or two short sentences, only when the title alone isn’t enough. People read a tooltip in passing, not as a paragraph.',
      do: { caption: 'A short title with two short sentences.', render: () => <TooltipBubble text="Archive project" supportingText="Archived projects are read-only. You can restore them at any time." /> },
      dont: {
        caption: 'A paragraph and a list in one tooltip.',
        render: () => (
          <TooltipBubble
            text="About archiving"
            supportingText="When you archive a project, it becomes read-only for every member. Comments, files and tasks stay where they are, but nobody can change them. Integrations stop syncing. Owners can restore the project, export it, or delete it permanently from the archive page. • Read-only • Integrations paused • Restorable"
          />
        ),
      },
    },
    {
      title: 'Open on the side with room',
      body: 'Top is the default. If the tooltip would leave the screen, it flips to the opposite side and the arrow follows. Use a start or end placement when the trigger sits near the left or right edge. Save none for a tooltip that follows the pointer, for example over a chart.',
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
      title: 'How it opens and closes',
      body: 'A tooltip opens after a short delay on hover, and straight away on keyboard focus. It stays open while the pointer moves onto it, and closes when the pointer leaves, focus moves or someone presses Escape. On touch screens, only the help icon shows one: a tap opens it, and a second tap or a tap elsewhere closes it.',
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
      title: 'The help icon reuses the tooltip',
      body: 'The help icon doesn’t draw its own surface. It opens the same tooltip, so when you change the tooltip’s color, radius, padding or type, every help icon updates too.',
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
      body: 'Write the title in sentence case with no full stop, like “Copy link” or “Archive project”. For an icon-only control, it’s the control’s name. Use full sentences in supporting text. Don’t repeat the trigger’s visible label, and leave out links and buttons.',
      do: { caption: 'Names the icon-only action.', render: () => <TooltipBubble text="Copy link" /> },
      dont: { caption: 'Title case, a full stop and a repeated label.', render: () => <TooltipBubble text="Click Here To Copy The Link." /> },
    },
  ],
  accessibility: [
    'The tooltip has role="tooltip" and is linked to its trigger with aria-describedby. For an icon-only trigger, its text also matches the name screen readers announce for the trigger.',
    'The help icon is a focusable button with its own name (“More information about Tax ID”), and screen readers read its tooltip as the description.',
    'Tooltips open on keyboard focus as well as on hover. Escape closes them without moving focus.',
    'Text on the dark surface meets the text contrast threshold in every color mode.',
    'Putting essential content behind a hover-only trigger is an accessibility failure, not a style choice.',
  ],
});
