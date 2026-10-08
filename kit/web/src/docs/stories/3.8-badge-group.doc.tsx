import { BadgeGroup, badgeGroupTones, type BadgeGroupPlacement, type BadgeGroupSize, type BadgeGroupType } from '@/components/components/BadgeGroup';
import { Badge } from '@/components/parts/Badge';
import { Button } from '@/components/parts/Button';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['md', 'lg'] as const;
const PLACEMENTS = ['left', 'right'] as const;
const TYPES = ['pill', 'outline'] as const;
const STATES = ['rest', 'hover', 'focus'] as const;

/** Rows Type × Size × Placement × State; columns Tone (spec §6). */
const ROWS = TYPES.flatMap((t) => SIZES.flatMap((s) => PLACEMENTS.flatMap((p) => STATES.map((st) => `${t} · ${s} · ${p} · ${st}`))));

const heroGroup = () => <BadgeGroup size="lg" placement="left" type="pill" tone="brand" badgeLabel="New" message="Dark mode is here" href="#" onClick={(e) => e.preventDefault()} />;

const banner = () => (
  <div className="flex w-full items-start gap-lg rounded-surface border border-border-brand-subtle bg-fill-brand-subtle p-xl">
    <div className="flex flex-1 flex-col gap-xxs">
      <span className="type-body-sm-semibold text-text-primary">Scheduled maintenance on Sunday</span>
      <span className="type-body-sm-regular text-text-secondary">Sign-in will be unavailable from 02:00 to 03:00 UTC.</span>
    </div>
    <Button size="sm" emphasis="secondary" label="Details" />
  </div>
);

export default defineDoc({
  id: '3.8',
  name: 'Badge group',
  level: 'components',
  spec: 'specs/components/3.8-badge-group.md',
  exports: ['BadgeGroup'],
  summary: 'Badge groups announce something in one line, like a new feature or a release, and link to the details. The badge and message work together as one link.',
  hero: heroGroup,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'placement', figma: 'Placement', control: { type: 'select', options: PLACEMENTS }, default: 'left' },
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'pill' },
      { name: 'tone', figma: 'Tone', control: { type: 'select', options: badgeGroupTones }, default: 'brand' },
      { name: 'badgeLabel', figma: 'Badge label', control: { type: 'text' }, default: 'New feature' },
      { name: 'message', figma: 'Message', control: { type: 'text' }, default: 'We’ve just released a new update' },
      { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', control: { type: 'icon' }, default: 'arrows/arrow-right' },
    ],
    render: (a) => <BadgeGroup {...(a as any)} trailingIcon={a.trailingIcon ?? null} />,
    code: (a) =>
      `<BadgeGroup${jsxProps({ ...a, trailingIcon: a.trailingIcon ?? undefined }, { size: 'md', placement: 'left', type: 'pill', tone: 'brand', trailingIcon: 'arrows/arrow-right' })}${a.trailingIcon ? '' : ' trailingIcon={null}'} href="/changelog" />`,
  },
  examples: [
    {
      title: 'Page hero announcement',
      caption: 'Place it above a page title to announce what’s new and link to the details.',
      render: () => (
        <div className="flex flex-col items-center gap-xl text-center">
          <BadgeGroup size="md" badgeLabel="New" message="Dark mode is here" href="#" onClick={(e) => e.preventDefault()} />
          <h2 className="type-display-sm-semibold text-text-primary">Plan, track and ship together</h2>
          <Button size="lg" label="Get started" />
        </div>
      ),
      code: `<BadgeGroup size="md" badgeLabel="New" message="Dark mode is here" href="/changelog/dark-mode" />
<h1 className="type-display-sm-semibold">Plan, track and ship together</h1>
<Button size="lg" label="Get started" />`,
    },
    {
      title: 'Release notes header',
      caption: 'Use the success tone once a release has shipped.',
      render: () => (
        <div className="flex flex-col items-start gap-lg">
          <BadgeGroup tone="success" badgeLabel="v2.4" message="See what’s changed" href="#" onClick={(e) => e.preventDefault()} />
          <h3 className="type-heading-md-semibold text-text-primary">Release 2.4 · Faster exports</h3>
        </div>
      ),
      code: `<BadgeGroup tone="success" badgeLabel="v2.4" message="See what’s changed" href="/releases/2-4" />
<h2 className="type-heading-md-semibold">Release 2.4 · Faster exports</h2>`,
    },
    {
      title: 'Beta notice in settings',
      caption: 'The outline type stays calm on a busy surface. Here the badge qualifies the message, so it goes on the right.',
      render: () => (
        <div className="flex w-full max-w-[28rem] flex-col gap-md rounded-surface border border-border-subtle bg-surface-raised p-xl">
          <span className="type-body-md-semibold text-text-primary">Smart replies</span>
          <BadgeGroup type="outline" tone="warning" badgeLabel="Beta" message="This feature may change" placement="right" href="#" onClick={(e) => e.preventDefault()} />
        </div>
      ),
      code: `<BadgeGroup type="outline" tone="warning" placement="right" badgeLabel="Beta" message="This feature may change" href="/docs/smart-replies" />`,
    },
  ],
  whenToUse: {
    use: ['A short label (“New”, “Beta”, “v2.4”) with a one-line message that links somewhere.', 'Announcements and update notices above a page or section title.'],
    dont: ['For a label on its own, use a Badge (2.4).', 'For a message with a title, body or actions, use a banner or alert.', 'For a message that needs two lines, use a banner. Keep to one badge group per title.'],
  },
  matrices: [
    {
      title: 'Badge group',
      rows: 'Type × Size × Placement × State',
      columns: 'Tone',
      render: () => (
        <Matrix
          rowProp="Type · Size · Placement · State"
          rows={ROWS}
          colProp="Tone"
          cols={badgeGroupTones}
          cell={(row, tone) => {
            const [type, size, placement, state] = row.split(' · ') as [BadgeGroupType, BadgeGroupSize, BadgeGroupPlacement, (typeof STATES)[number]];
            return <BadgeGroup type={type} size={size} placement={placement} tone={tone} badgeLabel="New" message="Dark mode is here" forceState={state === 'rest' ? undefined : state} tabIndex={-1} />;
          }}
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-center gap-2xl">
        <div className="scale-125">
          <BadgeGroup size="lg" badgeLabel="New" message="Dark mode is here" tabIndex={-1} />
        </div>
        <div className="flex flex-wrap justify-center gap-xl">
          <BadgeGroup size="lg" placement="left" badgeLabel="New" message="Placement=left" tabIndex={-1} />
          <BadgeGroup size="lg" placement="right" badgeLabel="New" message="Placement=right" tabIndex={-1} />
        </div>
      </div>
    ),
    parts: [
      { name: 'Root', target: 'root', description: 'The clickable container: one link, or a button when there’s no link. It sizes to its content. Pill groups have fully rounded ends; outline groups have slightly rounded corners.', tokens: ['badge-group/padding-badge/md', 'badge-group/padding-message/md', 'space/xs', 'space/md', 'border/width/default'] },
      { name: 'Badge', target: 'badge', description: 'A real Badge (2.4), one size smaller than the group and in the same tone. It takes the opposite type: outline on a pill group, pill on an outline group.' },
      { name: 'Content', target: 'content', description: 'Holds the message and the trailing icon side by side.', tokens: ['space/xs'] },
      { name: 'Message', target: 'message', description: 'One short sentence on a single line, with no full stop.', tokens: ['type/body/sm/medium'] },
      { name: 'Trailing icon', target: 'trailing-icon', description: 'An optional icon after the message. It’s an arrow by default.', tokens: ['size/icon/sm'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'md' | 'lg'", default: "'md'", description: 'Sets the height and the inner Badge size (sm or md).' },
    { name: 'placement', figma: 'Placement', type: "'left' | 'right'", default: "'left'", description: 'Puts the badge before (left) or after (right) the message.' },
    { name: 'type', figma: 'Type', type: "'pill' | 'outline'", default: "'pill'", description: 'pill is tinted; outline is a neutral surface with a border. The inner Badge takes the opposite type.' },
    { name: 'tone', figma: 'Tone', type: "'neutral' | 'brand' | 'danger' | 'warning' | 'success'", default: "'brand'", description: 'Colors the container and the badge.' },
    { name: 'badgeLabel', figma: 'Badge label', type: 'string', default: "'New feature'", description: 'The inner Badge’s label, one or two words.' },
    { name: 'message', figma: 'Message', type: 'ReactNode', default: "'We’ve just released a new update'", description: 'One short sentence that fits on a single line.' },
    { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', type: 'IconName | null', default: "'arrows/arrow-right'", description: 'The icon after the message. Pass null to hide it.' },
    { name: 'href', type: 'string', description: 'The link target. With it, the group renders as one <a>; without it, as a <button>.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'Documentation only: pins a Figma State.' },
  ],
  tokens: [
    'color/fill/brand/subtle', 'color/fill/brand/subtle/hover', 'color/border/brand/subtle', 'color/text/brand', 'color/icon/brand',
    'color/fill/neutral/subtle', 'color/fill/neutral/subtle/hover', 'color/border/subtle', 'color/text/secondary', 'color/icon/tertiary',
    'color/fill/danger/subtle', 'color/fill/danger/subtle/hover', 'color/border/danger/subtle', 'color/text/danger', 'color/icon/danger',
    'color/fill/warning/subtle', 'color/fill/warning/subtle/hover', 'color/border/warning/subtle', 'color/text/warning', 'color/icon/warning',
    'color/fill/success/subtle', 'color/fill/success/subtle/hover', 'color/border/success/subtle', 'color/text/success', 'color/icon/success',
    'color/surface/base', 'color/surface/base/hover', 'color/border/default',
    'badge-group/padding-badge/md', 'badge-group/padding-badge/lg', 'badge-group/padding-message/md', 'badge-group/padding-message/lg',
    'space/xs', 'space/md', 'border/width/default', 'radius/full', 'radius/sm', 'size/icon/sm', 'type/body/sm/medium',
    'focus/default', 'focus/danger',
  ],
  guidelines: [
    {
      title: 'Badge group, Badge or banner',
      body: 'Use a badge to label something, and a badge group to announce something in one line and link to it. When you need to explain more or ask people to act, use a banner.',
      render: () => (
        <div className="flex w-full max-w-[36rem] flex-col items-start gap-2xl">
          <span className="flex items-center gap-sm">
            <span className="type-body-sm-semibold text-text-primary">Smart replies</span>
            <Badge size="sm" type="outline" tone="brand" label="Beta" />
          </span>
          <div className="flex flex-col items-start gap-md">
            <BadgeGroup badgeLabel="New" message="Dark mode is here" tabIndex={-1} />
            <span className="type-heading-md-semibold text-text-primary">Your workspace</span>
          </div>
          {banner()}
        </div>
      ),
    },
    {
      title: 'The badge inside',
      body: 'A badge group uses the real Badge, so a change in 2.4 Badge carries through to every badge group.',
      render: () => (
        <div className="flex items-center gap-xl">
          <BadgeGroup size="lg" badgeLabel="New" message="Dark mode is here" tabIndex={-1} />
          <span className="type-body-xs-medium text-text-tertiary">←</span>
          <Badge size="md" type="outline" tone="brand" label="New" />
        </div>
      ),
    },
    {
      title: 'Placement and type',
      body: 'Put the badge on the left by default. Move it to the right when the message is the main point and the badge only qualifies it, as in “This feature may change · Beta”.\n\nUse pill for announcements on plain pages. On busy or tinted backgrounds, use outline, where a tinted container would add noise.',
      render: () => (
        <div className="grid w-full gap-xl md:grid-cols-2">
          <div className="flex flex-col items-start gap-lg rounded-surface bg-surface-base p-xl">
            <BadgeGroup badgeLabel="New" message="Dark mode is here" tabIndex={-1} />
            <BadgeGroup badgeLabel="Beta" message="This feature may change" placement="right" tone="warning" tabIndex={-1} />
          </div>
          <div className="flex flex-col items-start gap-lg rounded-surface bg-fill-brand-subtle p-xl">
            <BadgeGroup type="outline" badgeLabel="New" message="Dark mode is here" tabIndex={-1} />
            <BadgeGroup type="outline" badgeLabel="Beta" message="This feature may change" placement="right" tone="warning" tabIndex={-1} />
          </div>
        </div>
      ),
    },
    {
      title: 'Pick a tone by meaning',
      body: 'Use brand for new features, success for finished releases, warning for beta or changing features, danger for incidents and neutral for general notices. Let the badge label and message carry the meaning, so it still reads without color.',
      render: () => (
        <div className="flex flex-col items-start gap-md">
          <BadgeGroup tone="brand" badgeLabel="New" message="Dark mode is here" tabIndex={-1} />
          <BadgeGroup tone="success" badgeLabel="v2.4" message="See what’s changed" tabIndex={-1} />
          <BadgeGroup tone="warning" badgeLabel="Beta" message="This feature may change" tabIndex={-1} />
          <BadgeGroup tone="danger" badgeLabel="Incident" message="Exports are delayed" tabIndex={-1} />
          <BadgeGroup tone="neutral" badgeLabel="Update" message="New pricing from 1 May" tabIndex={-1} />
        </div>
      ),
    },
    {
      title: 'One announcement per title',
      body: 'Use one badge group above a title, with a message of about eight words at most, so it reads at a glance.',
      do: {
        caption: '“New · Dark mode is here →” above a page title.',
        render: () => (
          <div className="flex flex-col items-start gap-md">
            <BadgeGroup badgeLabel="New" message="Dark mode is here" tabIndex={-1} />
            <span className="type-heading-sm-semibold text-text-primary">Your workspace</span>
          </div>
        ),
      },
      dont: {
        caption: 'Two badge groups stacked above the same title.',
        render: () => (
          <div className="flex flex-col items-start gap-md">
            <BadgeGroup badgeLabel="New" message="Dark mode is here" tabIndex={-1} />
            <BadgeGroup tone="success" badgeLabel="v2.4" message="See what’s changed" tabIndex={-1} />
            <span className="type-heading-sm-semibold text-text-primary">Your workspace</span>
          </div>
        ),
      },
    },
    {
      title: 'Keep it to one line',
      body: 'If the message needs two lines, use a banner instead. Build the badge from the Badge part rather than drawing it by hand, so it stays in sync.',
      do: { caption: 'A short message on one line.', render: () => <BadgeGroup badgeLabel="New" message="Faster exports" tabIndex={-1} /> },
      dont: {
        caption: 'A hand-drawn badge with a message that wraps.',
        render: () => (
          <span className="inline-flex max-w-[16rem] items-center gap-md rounded-surface border border-border-brand-subtle bg-fill-brand-subtle py-xs pl-xs pr-lg">
            <span className="type-body-xs-medium shrink-0 rounded-full bg-surface-base px-sm text-text-brand">New</span>
            <span className="type-body-sm-medium text-text-brand">We’ve rebuilt exports so large reports download in seconds</span>
          </span>
        ),
      },
    },
    {
      title: 'Content',
      body: 'Keep the badge to one or two words, like “New”, “Beta” or “v2.4”. Make the message say what happened or what’s new, not “Click here”, in one short sentence without a full stop. Show the trailing arrow whenever the group links somewhere.',
    },
    {
      title: 'Maintenance',
      body: 'Change the badge’s look in 2.4 Badge and the container through the tone tokens. Avoid editing single variants, or they’ll drift from the rest.',
    },
  ],
  accessibility: [
    'The group is one link (or button) with one accessible name, made of the badge label and the message: “New: Dark mode is here”.',
    'Hover and focus apply to the whole group. The inner badge has no states of its own.',
    'The focus ring wraps the whole group, never only the badge. Danger groups use the danger ring (focus/danger).',
    'Message text meets text contrast against the container in every tone, in Light and Dark.',
  ],
});
