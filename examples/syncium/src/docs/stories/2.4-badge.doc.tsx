import { Badge, badgeCategoryTones, badgeSemanticTones, badgeTones, type BadgeSize, type BadgeType } from '@/components/parts/Badge';
import { Button } from '@/components/parts/Button';
import { Tag } from '@/components/parts/Tag';
import { Icon } from '@/icons';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md', 'lg'] as const;
const TYPES = ['pill', 'rounded', 'outline'] as const;
const ROWS = TYPES.flatMap((t) => SIZES.map((s) => `${t} · ${s}`));
const split = (row: string) => row.split(' · ') as [BadgeType, BadgeSize];

const statusRows = [
  { name: 'Payment service', tone: 'success', label: 'Active' },
  { name: 'Onboarding email', tone: 'neutral', label: 'Draft' },
  { name: 'Refund policy', tone: 'warning', label: 'Pending review' },
] as const;

const tableStatus = (grey = false) => (
  <div className={`flex w-full max-w-[24rem] flex-col rounded-surface border border-border-subtle bg-surface-base ${grey ? 'grayscale' : ''}`}>
    {statusRows.map((r, i) => (
      <div key={r.name} className={`flex items-center justify-between px-lg py-md ${i ? 'border-t border-border-subtle' : ''}`}>
        <span className="type-body-sm-medium text-text-primary">{r.name}</span>
        <Badge tone={r.tone} label={r.label} showDot />
      </div>
    ))}
  </div>
);

export default defineDoc({
  id: '2.4',
  name: 'Badge',
  level: 'parts',
  spec: 'parts/2.4-badge.md',
  exports: ['Badge'],
  summary:
    'Badges label things with a status, count, category or bit of metadata. They’re compact and read-only, so they sit next to what they describe without competing with it.',
  hero: () => <Badge size="lg" type="pill" tone="success" label="Active" showDot />,
  playground: {
    controls: [
      { name: 'label', figma: 'Label', control: { type: 'text' }, default: 'Label' },
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'pill' },
      { name: 'tone', figma: 'Tone', control: { type: 'select', options: badgeTones }, default: 'neutral' },
      { name: 'iconOnly', figma: 'Icon only', control: { type: 'boolean' }, default: false },
      { name: 'showDot', figma: 'Show dot', control: { type: 'boolean' }, default: false },
      { name: 'flag', figma: 'Show flag + Flag', control: { type: 'text' }, default: '' },
      { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', control: { type: 'icon' }, default: undefined },
      { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', control: { type: 'icon' }, default: undefined },
      { name: 'showClose', figma: 'Show close', control: { type: 'boolean' }, default: false },
    ],
    render: (a) => <Badge {...(a as any)} flag={a.flag || undefined} />,
    code: (a) => `<Badge${jsxProps(a, { size: 'md', type: 'pill', tone: 'neutral', iconOnly: false, showDot: false, showClose: false })} />`,
  },
  examples: [
    {
      title: 'Table status column',
      caption: 'Each status pairs a color with a word, so it still reads without the color.',
      render: () => tableStatus(),
      code: `<Badge tone="success" label="Active" showDot />
<Badge tone="neutral" label="Draft" showDot />
<Badge tone="warning" label="Pending review" showDot />`,
    },
    {
      title: 'Navigation count',
      caption: 'Put a count at the end of the row it counts.',
      render: () => (
        <div className="flex w-full max-w-[16rem] flex-col gap-xxs rounded-surface border border-border-subtle bg-surface-base p-sm">
          {[
            { icon: 'communication/inbox', label: 'Inbox', count: '12', active: true },
            { icon: 'communication/send', label: 'Sent' },
            { icon: 'general/archive', label: 'Archive' },
          ].map((n) => (
            <div key={n.label} className={`flex items-center gap-md rounded-control px-md py-sm ${n.active ? 'bg-fill-neutral-subtle' : ''}`}>
              <Icon name={n.icon as any} size="md" className="text-icon-tertiary" />
              <span className="type-body-sm-semibold flex-1 text-text-primary">{n.label}</span>
              {n.count && <Badge size="sm" tone="brand" label={n.count} />}
            </div>
          ))}
        </div>
      ),
      code: `<a className="flex items-center gap-md">
  <Icon name="communication/inbox" />
  <span className="flex-1">Inbox</span>
  <Badge size="sm" tone="brand" label="12" />
</a>`,
    },
    {
      title: 'Card metadata',
      caption: 'Category colors tell groups apart, and the text names them.',
      render: () => (
        <div className="flex w-full max-w-[20rem] flex-col gap-md rounded-surface border border-border-subtle bg-surface-raised p-xl">
          <span className="type-body-md-semibold text-text-primary">Checkout redesign</span>
          <span className="type-body-sm-regular text-text-tertiary">Simplify the payment step for returning customers.</span>
          <div className="flex gap-sm">
            <Badge type="rounded" tone="indigo" label="Design" />
            <Badge type="rounded" tone="orange" label="Research" />
          </div>
        </div>
      ),
      code: `<Badge type="rounded" tone="indigo" label="Design" />
<Badge type="rounded" tone="orange" label="Research" />`,
    },
    {
      title: 'Feature label',
      caption: 'The badge describes the feature next to it. Clicking it does nothing.',
      render: () => (
        <div className="flex w-full max-w-[24rem] items-center justify-between rounded-surface border border-border-subtle bg-surface-base p-lg">
          <div className="flex flex-col gap-xxs">
            <span className="flex items-center gap-sm">
              <span className="type-body-sm-semibold text-text-primary">Smart replies</span>
              <Badge size="sm" type="outline" tone="brand" label="Beta" />
            </span>
            <span className="type-body-sm-regular text-text-tertiary">Suggest short answers to incoming messages.</span>
          </div>
        </div>
      ),
      code: `<span className="flex items-center gap-sm">
  <span className="type-body-sm-semibold">Smart replies</span>
  <Badge size="sm" type="outline" tone="brand" label="Beta" />
</span>`,
    },
  ],
  whenToUse: {
    use: ['To show a read-only status: active, draft, failed, pending.', 'To add a count, category or metadata next to the thing it describes.'],
    dont: ['For values people remove, count or select, use a Tag (2.5).', 'For actions, use a Button (2.1).', 'For a badge with an announcement message, use a Badge group (3.8).'],
  },
  matrices: [
    {
      title: 'Badge',
      rows: 'Type × Size',
      columns: 'Tone',
      render: () => <Matrix rowProp="Type · Size" rows={ROWS} colProp="Tone" cols={badgeTones} cell={(row, tone) => { const [type, size] = split(row); return <Badge type={type} size={size} tone={tone} label="Label" showDot />; }} />,
    },
    {
      title: 'Icon only=true',
      rows: 'Type × Size',
      columns: 'Tone',
      render: () => <Matrix rowProp="Type · Size" rows={ROWS} colProp="Tone" cols={badgeTones} cell={(row, tone) => { const [type, size] = split(row); return <Badge type={type} size={size} tone={tone} iconOnly leadingIcon="arrows/arrow-up" label="Trending up" />; }} />,
    },
    {
      title: 'Content options',
      rows: 'Type',
      columns: 'Content',
      render: () => (
        <Matrix
          rowProp="Type"
          rows={TYPES}
          colProp="Content"
          cols={['text', 'dot', 'flag', 'avatar', 'leading icon', 'trailing icon', 'close', 'icon only'] as const}
          cell={(type, c) => {
            const p = { type, tone: 'success' as const };
            switch (c) {
              case 'text': return <Badge {...p} label="Label" />;
              case 'dot': return <Badge {...p} label="Label" showDot />;
              case 'flag': return <Badge {...p} label="France" flag="fr" />;
              case 'avatar': return <Badge {...p} label="Olivia" avatar={{ initials: 'OR' }} />;
              case 'leading icon': return <Badge {...p} label="12%" leadingIcon="arrows/arrow-up" />;
              case 'trailing icon': return <Badge {...p} label="Label" trailingIcon="arrows/arrow-right" />;
              case 'close': return <Badge {...p} label="Label" showClose />;
              default: return <Badge {...p} iconOnly leadingIcon="arrows/arrow-up" label="Up" />;
            }
          }}
        />
      ),
    },
    {
      title: '.Main/Badge close',
      rows: 'Type × State',
      columns: 'Tone',
      render: () => (
        <Matrix
          rowProp="Type · State"
          rows={TYPES.flatMap((t) => (['rest', 'hover'] as const).map((s) => `${t} · ${s}`))}
          colProp="Tone"
          cols={badgeTones}
          cell={(row, tone) => {
            const [type, state] = row.split(' · ') as [BadgeType, 'rest' | 'hover'];
            return <Badge type={type} tone={tone} label="Label" showClose forceCloseState={state === 'hover' ? 'hover' : undefined} />;
          }}
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex scale-[2] flex-col items-center gap-lg">
        <Badge size="lg" tone="brand" label="Label" showDot showClose />
        <Badge size="lg" tone="brand" type="rounded" label="Label" leadingIcon="general/zap" trailingIcon="arrows/arrow-right" />
      </div>
    ),
    parts: [
      { name: 'Root', target: 'root', description: 'The container fits its content, with padding set by the size. The padding tightens next to a leading visual or close. Pills are fully rounded; the other types have small corners.', tokens: ['badge/padding-x/md', 'badge/padding-x-tight/md', 'space/xxs', 'space/xs', 'radius/full', 'radius/sm'] },
      { name: 'Leading visual', target: 'leading-visual', description: 'One optional visual before the label: a dot, a flag, an Avatar (2.6) or an icon. It grows a little at the large size.', tokens: ['size/indicator/xs', 'size/icon/xs'] },
      { name: 'Label', target: 'label', description: 'One line of text that never wraps. Medium and large badges use a larger text style. It hides when the badge is icon-only.', tokens: ['type/body/sm/medium'] },
      { name: 'Trailing icon', target: 'trailing-icon', description: 'An optional icon after the label. Use it or the close, not both.' },
      { name: 'Close', target: 'close', description: 'An optional x button that removes the badge. On hover it tints in the badge’s tone, and its corners follow the badge type.', tokens: ['space/xxs', 'size/icon/xs'] },
    ],
  },
  props: [
    { name: 'label', figma: 'Label', type: 'ReactNode', default: "'Label'", description: 'The visible text. When iconOnly is set, it becomes the accessible name.' },
    { name: 'size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the height (22 · 24 · 28), padding and label style.' },
    { name: 'type', figma: 'Type', type: "'pill' | 'rounded' | 'outline'", default: "'pill'", description: 'Pill is fully rounded and tinted. Rounded has small corners and is tinted. Outline uses a neutral surface, with color only on the dot or icon.' },
    { name: 'tone', figma: 'Tone', type: "'neutral' | 'brand' | 'danger' | 'warning' | 'success' | 'info' | 'slate' | 'sky' | 'blue' | 'indigo' | 'purple' | 'pink' | 'orange'", default: "'neutral'", description: 'Semantic tones carry meaning. Category tones only tell groups apart.' },
    { name: 'iconOnly', figma: 'Icon only', type: 'boolean', default: 'false', description: 'A square badge with one icon (circular for pills).' },
    { name: 'showDot', figma: 'Show dot', type: 'boolean', default: 'false', description: 'Adds a status dot before the label, in the tone’s icon color.' },
    { name: 'flag', figma: 'Show flag + Flag', type: 'string', description: 'ISO country code. Renders the matching Flag (1.8) asset.' },
    { name: 'avatar', figma: 'Show avatar', type: '{ src?: string; initials?: string }', description: 'Adds an Avatar (2.6) at the 2xs size before the label.' },
    { name: 'leadingIcon', figma: 'Show leading icon + Leading icon', type: 'IconName', description: 'The icon before the label, and the icon used when iconOnly is set.' },
    { name: 'trailingIcon', figma: 'Show trailing icon + Trailing icon', type: 'IconName', description: 'The icon after the label.' },
    { name: 'showClose', figma: 'Show close', type: 'boolean', default: 'false', description: 'Adds a close button for removable content, such as an applied filter.' },
    { name: 'onClose', type: '() => void', description: 'Called when the close button is pressed.' },
    { name: 'closeLabel', type: 'string', default: '"Remove {label}"', description: 'Accessible name of the close button.' },
  ],
  tokens: [
    'color/fill/neutral/subtle', 'color/border/subtle', 'color/text/secondary', 'color/icon/tertiary',
    'color/fill/brand/subtle', 'color/border/brand/subtle', 'color/text/brand', 'color/icon/brand',
    'color/fill/danger/subtle', 'color/border/danger/subtle', 'color/text/danger', 'color/icon/danger',
    'color/fill/warning/subtle', 'color/border/warning/subtle', 'color/text/warning', 'color/icon/warning',
    'color/fill/success/subtle', 'color/border/success/subtle', 'color/text/success', 'color/icon/success',
    'color/fill/info/subtle', 'color/border/info/subtle', 'color/text/info', 'color/icon/info',
    ...badgeCategoryTones.flatMap((f) => [`color/category/${f}/subtle`, `color/category/${f}/border`, `color/category/${f}/text`, `color/category/${f}/solid`]),
    'color/surface/base', 'color/border/default', 'color/fill/neutral/subtle/hover',
    'badge/padding-x/sm', 'badge/padding-x/md', 'badge/padding-x/lg', 'badge/padding-x-tight/sm', 'badge/padding-x-tight/md', 'badge/padding-x-tight/lg',
    'space/xxs', 'space/xs', 'size/indicator/xs', 'size/indicator/sm', 'size/icon/xs', 'size/icon/sm',
    'radius/full', 'radius/sm', 'radius/xs', 'border/width/default', 'type/body/xs/medium', 'type/body/sm/medium', 'focus/default',
  ],
  guidelines: [
    {
      title: 'Badge, tag, text or button',
      body: 'A badge labels something, and a tag holds a value people manage. Plain text is enough when nothing needs emphasis, and a button performs an action.',
      render: () => (
        <div className="grid w-full max-w-[30rem] grid-cols-[8rem_1fr] items-center gap-x-xl gap-y-lg">
          <span className="type-body-xs-semibold text-text-tertiary">Badge</span>
          <span><Badge tone="success" label="Active" showDot /></span>
          <span className="type-body-xs-semibold text-text-tertiary">Tag</span>
          <span><Tag type="removable" label="Owner: Me" /></span>
          <span className="type-body-xs-semibold text-text-tertiary">Text</span>
          <span className="type-body-sm-regular text-text-tertiary">Updated 2 hours ago</span>
          <span className="type-body-xs-semibold text-text-tertiary">Button</span>
          <span><Button size="sm" emphasis="secondary" leadingIcon="general/plus" label="Add filter" /></span>
        </div>
      ),
    },
    {
      title: 'Optional parts',
      body: 'A badge can start with a dot, flag, avatar or icon, and end with a trailing icon or a close. Each part has its own on/off property. Use one leading visual and one trailing element at a time.',
      render: () => (
        <div className="flex flex-wrap items-center gap-lg">
          <Badge tone="brand" label="Show dot" showDot />
          <Badge tone="brand" label="Show flag" flag="de" />
          <Badge tone="brand" label="Show avatar" avatar={{ initials: 'LS' }} />
          <Badge tone="brand" label="Show leading icon" leadingIcon="general/zap" />
          <Badge tone="brand" label="Show trailing icon" trailingIcon="arrows/arrow-right" />
          <Badge tone="brand" label="Show close" showClose />
        </div>
      ),
    },
    {
      title: 'Pick a type and size',
      body: 'Use pill for status and counts, rounded for categories and metadata, and outline when many badges sit together and color would get noisy.\n\nMatch the size to the text around it: sm in dense tables and navigation, md by default, lg in headers.',
      render: () => (
        <div className="flex flex-col items-center gap-lg">
          <div className="flex gap-md">{TYPES.map((t) => <Badge key={t} type={t} tone="info" label={t} showDot />)}</div>
          <div className="flex items-center gap-md">{SIZES.map((s) => <Badge key={s} size={s} tone="info" label={`Size ${s}`} />)}</div>
          <div className="flex gap-md">
            <Badge tone="success" label="12%" leadingIcon="arrows/arrow-up" />
            <Badge tone="success" iconOnly leadingIcon="arrows/arrow-up" label="Up" />
          </div>
        </div>
      ),
    },
    {
      title: 'Choose a tone by meaning',
      body: 'Semantic tones carry meaning: success is done, warning needs attention, danger is failed or blocked, info is neutral information, brand is new or featured, and neutral is inactive or default. Category tones carry no meaning, so use them only to tell groups apart.\n\nColor or a dot alone never carries a status. The label always names it, so the same column still reads in grayscale.',
      render: () => (
        <div className="flex w-full flex-col gap-lg">
          <div className="flex flex-wrap justify-center gap-sm">{badgeSemanticTones.map((t) => <Badge key={t} tone={t} label={t} showDot />)}</div>
          <div className="flex flex-wrap justify-center gap-sm">{badgeCategoryTones.map((t) => <Badge key={t} type="rounded" tone={t} label={t} />)}</div>
          <div className="flex flex-wrap justify-center gap-xl">
            {tableStatus()}
            {tableStatus(true)}
          </div>
        </div>
      ),
      do: { caption: '“Pending review” with a warning dot.', render: () => <Badge tone="warning" label="Pending review" showDot /> },
      dont: { caption: 'A colored dot with no label.', render: () => <span className="size-(--size-indicator-sm) rounded-full bg-icon-warning" /> },
    },
    {
      title: 'Keep labels short',
      body: 'Badges stay compact, with labels of one or two words. Labels don’t wrap or get cut off mid-word, so shorten the label instead. Counts above 99 show “99+”.',
      do: { caption: 'A short label.', render: () => <div className="flex gap-sm"><Badge tone="danger" label="Failed" showDot /><Badge tone="brand" size="sm" label="99+" /></div> },
      dont: { caption: 'A full sentence in a badge.', render: () => <Badge tone="danger" label="The payment could not be processed by the bank" showDot /> },
    },
    {
      title: 'Removable badges',
      body: 'A close button means the badge stands for something people can remove, like an applied filter. It isn’t a general action. The close has its own name for screen readers (“Remove Design”).\n\nWhen people manage many values, use a Tag (2.5).',
      render: () => (
        <div className="flex gap-sm">
          <Badge type="rounded" tone="indigo" label="Design" showClose />
          <Badge type="rounded" tone="orange" label="Research" showClose />
        </div>
      ),
      dont: { caption: 'A badge used as a button, like an “Upgrade” badge that opens checkout.', render: () => <Badge tone="brand" label="Upgrade" trailingIcon="arrows/arrow-right" /> },
    },
    {
      title: 'Change badges in one place',
      body: 'To change every badge at once, edit the tone tokens (color/fill/{tone}/subtle, color/text/{tone}, color/category/*) or the .Main/Badge close component. Avoid editing single variants, because they’ll drift out of sync.',
      dont: { caption: 'Category colors for status, or status colors for decoration.', render: () => <div className="flex gap-sm"><Badge type="rounded" tone="pink" label="Failed" /><Badge type="rounded" tone="danger" label="Marketing" /></div> },
    },
  ],
  accessibility: [
    'Label text meets text contrast against the badge fill in every tone and mode.',
    'Status never relies on color alone: the label names it.',
    'The badge itself isn’t focusable. Only its close button is, with the name “Remove {label}” and a visible focus ring.',
    'On touch screens, the close button gets an invisible tap area of at least size/touch-min.',
    'Icon-only badges use label as the name screen readers announce.',
  ],
});
