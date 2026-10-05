import type { ReactNode } from 'react';
import { Divider } from '@/components/parts/Divider';
import { Button } from '@/components/parts/Button';
import { IconButton } from '@/components/parts/IconButton';
import { Label } from '@/components/parts/Label';
import { Icon, type IconName } from '@/icons';
import { defineDoc } from '../types';
import { AxisLabel, jsxProps, Matrix } from '../blocks';
import { TextControl } from '@/components/parts/TextControl';
import { DemoCard, DemoField } from './_demo';

const ORIENTATIONS = ['horizontal', 'vertical'] as const;
const EMPHASIS = ['primary', 'secondary', 'tertiary'] as const;

const MenuItem = ({ icon, children }: { icon: IconName; children: ReactNode }) => (
  <button
    type="button"
    role="menuitem"
    className="type-body-sm-medium flex w-full cursor-pointer items-center gap-md rounded-control px-md py-sm text-left text-text-secondary outline-none is-hover:bg-fill-neutral-subtle-hover is-focus:shadow-focus-default"
  >
    <Icon name={icon} size="sm" className="text-icon-tertiary" />
    {children}
  </button>
);

const Menu = ({ children }: { children: ReactNode }) => (
  <div role="menu" className="flex w-[14rem] flex-col gap-xs rounded-surface border border-border-subtle bg-surface-raised p-xs shadow-overlay">
    {children}
  </div>
);

const Toolbar = () => (
  <div className="flex h-(--size-control-md) items-center gap-xs rounded-control border border-border-subtle bg-surface-base px-xs">
    <IconButton size="sm" icon="editor/bold" label="Bold" />
    <IconButton size="sm" icon="editor/italic" label="Italic" />
    <IconButton size="sm" icon="editor/underline" label="Underline" />
    <div className="flex self-stretch py-sm">
      <Divider orientation="vertical" />
    </div>
    <IconButton size="sm" icon="editor/align-left" label="Align left" />
    <IconButton size="sm" icon="editor/align-center" label="Align centre" />
    <IconButton size="sm" icon="editor/align-right" label="Align right" />
    <div className="flex self-stretch py-sm">
      <Divider orientation="vertical" />
    </div>
    <IconButton size="sm" icon="general/link" label="Link" />
    <IconButton size="sm" icon="images/image" label="Image" />
  </div>
);

const Section = ({ title, rows }: { title: string; rows: [string, string][] }) => (
  <div className="flex flex-col gap-sm">
    <span className="type-body-sm-semibold text-text-primary">{title}</span>
    {rows.map(([k, v]) => (
      <div key={k} className="type-body-sm-regular flex justify-between gap-lg">
        <span className="text-text-tertiary">{k}</span>
        <span className="text-text-primary">{v}</span>
      </div>
    ))}
  </div>
);

export default defineDoc({
  id: '2.16',
  name: 'Divider',
  level: 'parts',
  spec: 'parts/2.16-divider.md',
  exports: ['Divider'],
  summary:
    'A thin line that separates groups on the same surface, horizontal between rows and sections or vertical between groups of controls. A horizontal divider can carry a short label to separate alternatives.',
  hero: () => (
    <div className="flex w-[30rem] max-w-full flex-col gap-3xl">
      <Divider />
      <Divider label="or" />
    </div>
  ),
  playground: {
    controls: [
      { name: 'orientation', figma: 'Orientation', control: { type: 'select', options: ORIENTATIONS }, default: 'horizontal' },
      { name: 'emphasis', figma: 'Emphasis', control: { type: 'select', options: EMPHASIS }, default: 'tertiary' },
      { name: 'label', figma: 'Show label + Label', control: { type: 'text' }, default: '' },
    ],
    render: (a) => (
      <div className="flex h-(--size-control-md) w-[20rem] items-center justify-center">
        <Divider {...a} label={a.orientation === 'horizontal' ? a.label : undefined} />
      </div>
    ),
    code: (a) => `<Divider${jsxProps(a, { orientation: 'horizontal', emphasis: 'tertiary' }, a.orientation === 'vertical' ? ['label'] : [])} />`,
  },
  examples: [
    {
      title: 'Menu groups',
      caption: 'Dividers separate groups of related items in a list.',
      render: () => (
        <Menu>
          <MenuItem icon="users/user">Profile</MenuItem>
          <MenuItem icon="general/settings">Settings</MenuItem>
          <Divider />
          <MenuItem icon="alerts/help-circle">Help</MenuItem>
          <MenuItem icon="development/terminal">Keyboard shortcuts</MenuItem>
          <Divider />
          <MenuItem icon="general/log-out">Log out</MenuItem>
        </Menu>
      ),
      code: `<Menu>
  <MenuItem>Profile</MenuItem>
  <MenuItem>Settings</MenuItem>
  <Divider />
  <MenuItem>Help</MenuItem>
  <MenuItem>Keyboard shortcuts</MenuItem>
  <Divider />
  <MenuItem>Log out</MenuItem>
</Menu>`,
    },
    {
      title: 'Editor toolbar',
      caption: 'Vertical dividers separate groups of controls in a toolbar.',
      render: () => <Toolbar />,
      code: `<div className="flex h-(--size-control-md) items-center gap-xs">
  <IconButton size="sm" icon="editor/bold" label="Bold" />
  <IconButton size="sm" icon="editor/italic" label="Italic" />
  <IconButton size="sm" icon="editor/underline" label="Underline" />
  <div className="flex self-stretch py-sm"><Divider orientation="vertical" /></div>
  <IconButton size="sm" icon="editor/align-left" label="Align left" />
  …
</div>`,
    },
    {
      title: 'Sign-in alternatives',
      caption: 'A labelled divider separates two ways of doing the same thing.',
      render: () => (
        <div className="flex w-full max-w-[22rem] flex-col gap-xl">
          <Button emphasis="secondary" fullWidth leadingIcon="maps/globe" label="Continue with Google" />
          <Divider label="or" />
          <DemoField>
            <Label htmlFor="si-email" label="Email" />
            <TextControl id="si-email" inputType="email" placeholder="name@example.com" />
          </DemoField>
          <Button fullWidth label="Continue with email" />
        </div>
      ),
      code: `<Button emphasis="secondary" fullWidth label="Continue with Google" />
<Divider label="or" />
<Label htmlFor="email" label="Email" />
<TextControl id="email" inputType="email" />
<Button fullWidth label="Continue with email" />`,
    },
    {
      title: 'Card sections',
      caption: 'Inside a card, a divider splits sections without nesting surfaces.',
      render: () => (
        <DemoCard className="w-full max-w-[22rem]">
          <Section title="Plan" rows={[['Tier', 'Team'], ['Seats', '12 of 15']]} />
          <Divider />
          <Section title="Billing" rows={[['Next invoice', '1 Nov 2026'], ['Method', 'Visa •• 4242']]} />
        </DemoCard>
      ),
      code: `<Card>
  <PlanDetails />
  <Divider />
  <BillingDetails />
</Card>`,
    },
  ],
  whenToUse: {
    use: ['Two groups share a surface and spacing alone doesn’t separate them: long menus, dense settings, toolbars.', 'Separating alternatives with a short label (“or”).'],
    dont: ['Between every field of a short form — use spacing.', 'Framing a whole region — give it a surface or a border instead.'],
  },
  matrices: [
    {
      title: 'Divider',
      rows: 'Emphasis',
      columns: 'Orientation',
      render: () => (
        <Matrix
          rowProp="Emphasis"
          rows={EMPHASIS}
          colProp="Orientation"
          cols={ORIENTATIONS}
          cell={(emphasis, orientation) =>
            orientation === 'horizontal' ? (
              <div className="w-[20rem]">
                <Divider emphasis={emphasis} />
              </div>
            ) : (
              <div className="flex h-(--size-control-md)">
                <Divider emphasis={emphasis} orientation="vertical" />
              </div>
            )
          }
        />
      ),
    },
    {
      title: 'Show label = true',
      render: () => (
        <div className="flex flex-col items-start gap-md rounded-surface border border-dashed border-border-brand-subtle p-xl">
          <AxisLabel prop="Orientation=horizontal · Emphasis=tertiary · Show label" value="true" />
          <div className="w-[20rem]">
            <Divider label="or" />
          </div>
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex w-full flex-col items-center gap-3xl">
        <div className="w-[24rem]">
          <Divider label="Label" />
        </div>
        <div className="flex w-[24rem] flex-col gap-lg">
          {EMPHASIS.map((e) => (
            <div key={e} className="flex items-center gap-lg">
              <span className="w-[6rem] shrink-0">
                <AxisLabel prop="Emphasis" value={e} />
              </span>
              <Divider emphasis={e} />
            </div>
          ))}
        </div>
      </div>
    ),
    parts: [
      { name: 'Start line', description: 'One stroke thick: border/width/default (strong for primary). Spans the whole Divider when there is no label; fills the height when vertical.', tokens: ['border/width/default', 'border/width/strong', 'color/border/subtle'] },
      { name: 'Label', description: 'Optional, horizontal only. type/body/sm/medium, color/text/tertiary, space/md from each line; never wraps.', tokens: ['type/body/sm/medium', 'color/text/tertiary', 'space/md'] },
      { name: 'End line', description: 'Shown only with the label; shares the remaining width equally with the Start line.' },
    ],
  },
  props: [
    { name: 'orientation', figma: 'Orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", description: 'Vertical fills the height of its row (self-stretch).' },
    { name: 'emphasis', figma: 'Emphasis', type: "'primary' | 'secondary' | 'tertiary'", default: "'tertiary'", description: 'Line weight: strong 2px, default 1px, subtle 1px.' },
    { name: 'label', figma: 'Show label + Label', type: 'ReactNode', description: 'Horizontal only; present = shown (“or”).' },
    { name: 'decorative', type: 'boolean', default: 'false', description: 'Hide from assistive technology instead of exposing role="separator".' },
  ],
  tokens: ['color/border/strong', 'color/border/default', 'color/border/subtle', 'border/width/strong', 'border/width/default', 'color/text/tertiary', 'type/body/sm/medium', 'space/md'],
  guidelines: [
    {
      title: 'Spacing first, then a Divider',
      body: 'Space and alignment separate most groups. Add a Divider only when groups sit on the same surface and spacing alone doesn’t make the break clear — long menus, dense settings, toolbars.',
      do: {
        caption: 'Grouped with spacing; one Divider before the danger zone.',
        render: () => (
          <div className="flex w-[16rem] flex-col gap-lg">
            <TextControl aria-label="Name" placeholder="Name" />
            <TextControl aria-label="Email" placeholder="Email" />
            <Divider />
            <Button tone="danger" emphasis="secondary" label="Delete account" />
          </div>
        ),
      },
      dont: {
        caption: 'A Divider between every field.',
        render: () => (
          <div className="flex w-[16rem] flex-col gap-md">
            <TextControl aria-label="Name" placeholder="Name" />
            <Divider />
            <TextControl aria-label="Email" placeholder="Email" />
            <Divider />
            <TextControl aria-label="Phone" placeholder="Phone" />
          </div>
        ),
      },
    },
    {
      title: 'Choosing the weight',
      body: 'Use tertiary by default. Move to secondary or primary only when a stronger break is needed, and keep one weight per surface.',
      do: {
        caption: 'One weight on the surface.',
        render: () => (
          <DemoCard className="w-[14rem] gap-md">
            <span className="type-body-sm-regular text-text-secondary">Section A</span>
            <Divider />
            <span className="type-body-sm-regular text-text-secondary">Section B</span>
            <Divider />
            <span className="type-body-sm-regular text-text-secondary">Section C</span>
          </DemoCard>
        ),
      },
      dont: {
        caption: 'Mixed weights on one surface.',
        render: () => (
          <DemoCard className="w-[14rem] gap-md">
            <span className="type-body-sm-regular text-text-secondary">Section A</span>
            <Divider emphasis="primary" />
            <span className="type-body-sm-regular text-text-secondary">Section B</span>
            <Divider emphasis="secondary" />
            <span className="type-body-sm-regular text-text-secondary">Section C</span>
          </DemoCard>
        ),
      },
    },
    {
      title: 'Horizontal and vertical',
      body: 'Horizontal dividers separate rows and sections. Vertical dividers separate groups of controls in a toolbar or inline metadata (“Updated 2 h ago | 3 comments”). A vertical Divider fills the height of its row; it is never taller than the controls next to it.',
      render: () => (
        <div className="flex flex-col items-center gap-xl">
          <Toolbar />
          <div className="type-body-sm-regular flex items-center gap-md text-text-tertiary">
            <span>Updated 2 h ago</span>
            <div className="flex h-(--font-line-height-body-sm)">
              <Divider orientation="vertical" />
            </div>
            <span>3 comments</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Labelled dividers',
      body: 'Use the label to separate alternatives (“or”) or to name a group in a long list. Keep it to one or two words.',
      do: { caption: '“or”.', render: () => <div className="w-[16rem]"><Divider label="or" /></div> },
      dont: { caption: 'A sentence as the label.', render: () => <div className="w-[16rem]"><Divider label="Or you can also sign in with email" /></div> },
    },
    {
      title: 'Dividers don’t frame regions',
      body: 'Don’t use dividers above and below a block to make it look like a card. If a region needs to stand apart, give it a surface or a border on its container.',
      do: {
        caption: 'The block on a raised surface.',
        render: () => (
          <DemoCard className="w-[14rem]">
            <span className="type-body-sm-semibold text-text-primary">Notifications</span>
            <span className="type-body-sm-regular text-text-tertiary">Email, weekly</span>
          </DemoCard>
        ),
      },
      dont: {
        caption: 'Boxed in by dividers.',
        render: () => (
          <div className="flex w-[14rem] flex-col gap-md">
            <Divider />
            <span className="type-body-sm-semibold text-text-primary">Notifications</span>
            <span className="type-body-sm-regular text-text-tertiary">Email, weekly</span>
            <Divider />
          </div>
        ),
      },
    },
    {
      title: 'Content',
      body: 'Labels are lower-case or sentence case, one or two words, and never wrap. Don’t put actions inside a Divider label; place a Button beside the content instead.',
    },
  ],
  accessibility: [
    'By default the Divider is role="separator" with aria-orientation, for groups users move between such as menu groups.',
    'Use `decorative` when it only adds visual structure; it is then hidden from assistive technology.',
    'A labelled Divider exposes its label as text, so “or” is announced; its lines are hidden.',
    'Lines are decorative unless they are the only boundary of a region; then the line meets the non-text contrast threshold.',
  ],
});
