import { Avatar, ProfilePhoto, type AvatarIndicator, type AvatarSize } from '@/components/parts/Avatar';
import { Button } from '@/components/parts/Button';
import { config } from '@/ds.config';
import { Icon } from '@/icons';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const TYPES = ['image', 'initials', 'icon'] as const;
const INDICATORS = ['offline', 'online', 'verified', 'company', 'count'] as const;
/**
 * The template ships no photography. The product mark stands in for `.Main/Avatar image`
 * (an organisation avatar); a build replaces it with its own approved images.
 */
const IMAGE = config.logo.mark;

const AVATAR_ROWS = ['image', 'initials', 'icon', 'image + ring', ...INDICATORS.map((i) => `image + ${i}`)] as const;

const avatarCell = (row: (typeof AVATAR_ROWS)[number], size: AvatarSize) => {
  if (row === 'initials') return <Avatar size={size} type="initials" initials="OR" alt="Olivia Rhye" />;
  if (row === 'icon') return <Avatar size={size} type="icon" alt="Unassigned" />;
  const indicator = row.startsWith('image + ') && row !== 'image + ring' ? (row.slice(8) as AvatarIndicator) : undefined;
  return <Avatar size={size} type="image" src={IMAGE} alt="Organization" showRing={row === 'image + ring'} indicator={indicator} count={indicator === 'count' ? 3 : undefined} />;
};

const comment = (who: { name: string; initials?: string; src?: string }, time: string, text: string) => (
  <div className="flex gap-md">
    <Avatar size="md" type={who.src ? 'image' : 'initials'} src={who.src} initials={who.initials} alt="" />
    <div className="flex flex-col gap-xxs">
      <span className="flex items-baseline gap-sm">
        <span className="type-body-sm-semibold text-text-primary">{who.name}</span>
        <span className="type-body-xs-regular text-text-tertiary">{time}</span>
      </span>
      <span className="type-body-sm-regular text-text-secondary">{text}</span>
    </div>
  </div>
);

export default defineDoc({
  id: '2.6',
  name: 'Avatar',
  level: 'parts',
  spec: 'parts/2.6-avatar.md',
  exports: ['Avatar', 'ProfilePhoto'],
  summary:
    'Avatars show who someone is, as a photo, initials or a placeholder icon. Add a ring when avatars overlap, or an indicator for presence, verification or unread counts.',
  hero: () => <Avatar size="2xl" type="initials" initials="OR" alt="Olivia Rhye" indicator="online" />,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'initials' },
      { name: 'src', figma: 'Image', control: { type: 'text' }, default: '' },
      { name: 'initials', figma: 'Initials', control: { type: 'text' }, default: 'OR' },
      { name: 'alt', figma: '— (accessible name)', control: { type: 'text' }, default: 'Olivia Rhye' },
      { name: 'showRing', figma: 'Show ring', control: { type: 'boolean' }, default: false },
      { name: 'indicator', figma: 'Show indicator + Indicator type', control: { type: 'select', options: ['none', ...INDICATORS] }, default: 'none' },
    ],
    render: (a) => <Avatar {...(a as any)} src={a.src || undefined} indicator={a.indicator === 'none' ? undefined : a.indicator} count={a.indicator === 'count' ? 3 : undefined} />,
    code: (a) =>
      `<Avatar${jsxProps({ ...a, indicator: a.indicator === 'none' ? undefined : a.indicator }, { size: 'md', type: 'image', showRing: false })}${a.indicator === 'count' ? ' count={3}' : ''} />`,
  },
  examples: [
    {
      title: 'Comment thread',
      caption: 'When there’s no photo, initials fill in at exactly the same size.',
      render: () => (
        <div className="flex w-full max-w-[26rem] flex-col gap-xl">
          {comment({ name: 'Design team', src: IMAGE }, '2 h ago', 'Uploaded the revised brief.')}
          {comment({ name: 'Olivia Rhye', initials: 'OR' }, '1 h ago', 'Looks good — one note on the timeline.')}
        </div>
      ),
      code: `<Avatar size="md" src={author.photo} alt="" />
<Avatar size="md" type="initials" initials="OR" alt="" />`,
    },
    {
      title: 'Account menu trigger',
      caption: 'The presence indicator sits on top of the avatar, so the layout doesn’t move.',
      render: () => (
        <div className="flex w-full max-w-[26rem] items-center justify-end gap-md border-b border-border-subtle pb-md">
          <Icon name="general/bell" size="md" className="text-icon-tertiary" />
          <button type="button" aria-label="Account menu" className="cursor-pointer rounded-full outline-none is-focus:shadow-focus-default">
            <Avatar size="sm" type="initials" initials="OR" alt="" indicator="online" />
          </button>
        </div>
      ),
      code: `<button type="button" aria-label="Account menu" className="rounded-full is-focus:shadow-focus-default">
  <Avatar size="sm" type="initials" initials="OR" alt="" indicator="online" />
</button>`,
    },
    {
      title: 'Profile header',
      caption: 'Use the profile photo, a large avatar with a ring, at the top of profile pages.',
      stage: 'full',
      render: () => (
        <div className="flex w-full max-w-[40rem] flex-col overflow-hidden rounded-surface border border-border-subtle bg-surface-raised">
          <div className="h-[7rem] bg-fill-brand-subtle" />
          <div className="flex items-end justify-between gap-lg px-xl pb-xl">
            <div className="-mt-[3rem] flex items-end gap-lg">
              <ProfilePhoto size="md" type="initials" initials="OR" alt="Olivia Rhye" showVerified />
              <div className="flex flex-col pb-xs">
                <span className="type-heading-xs-semibold text-text-primary">Olivia Rhye</span>
                <span className="type-body-sm-regular text-text-tertiary">Product designer</span>
              </div>
            </div>
            <Button emphasis="secondary" size="sm" label="Edit profile" />
          </div>
        </div>
      ),
      code: `<ProfilePhoto size="md" src={user.photo} initials="OR" alt="Olivia Rhye" showVerified />
<Button emphasis="secondary" size="sm" label="Edit profile" />`,
    },
    {
      title: 'Assignee field',
      caption: 'Use the placeholder icon when nobody is assigned yet.',
      render: () => (
        <div className="flex w-full max-w-[22rem] flex-col rounded-surface border border-border-subtle bg-surface-base">
          {[
            { task: 'Update pricing page', who: 'Lana Steiner', i: 'LS' },
            { task: 'Audit color tokens', who: undefined, i: undefined },
          ].map((r, k) => (
            <div key={r.task} className={`flex items-center justify-between px-lg py-md ${k ? 'border-t border-border-subtle' : ''}`}>
              <span className="type-body-sm-medium text-text-primary">{r.task}</span>
              <span className="flex items-center gap-sm">
                <Avatar size="xs" type={r.i ? 'initials' : 'icon'} initials={r.i} alt="" />
                <span className="type-body-sm-regular text-text-secondary">{r.who ?? 'Unassigned'}</span>
              </span>
            </div>
          ))}
        </div>
      ),
      code: `<Avatar size="xs" type="initials" initials="LS" alt="" /> Lana Steiner
<Avatar size="xs" type="icon" alt="" /> Unassigned`,
    },
  ],
  whenToUse: {
    use: ['To identify people and organizations: authors, assignees, members, accounts.', 'To show someone’s presence, verification or unread count.'],
    dont: ['For decoration, or for things that aren’t people or organizations, use a Featured icon (2.19).', 'For a group of avatars, or an avatar with a name and email, use an Avatar group (3.4).'],
  },
  matrices: [
    {
      title: 'Avatar',
      rows: 'Type (+ ring, + indicator)',
      columns: 'Size',
      render: () => <Matrix rowProp="Type" rows={AVATAR_ROWS} colProp="Size" cols={SIZES} cell={(row, size) => avatarCell(row, size)} />,
    },
    {
      title: 'Profile photo',
      rows: 'Type (+ verified)',
      columns: 'Size',
      render: () => (
        <Matrix
          rowProp="Type"
          rows={['image', 'initials', 'icon', 'initials + verified'] as const}
          colProp="Size"
          cols={['sm', 'md', 'lg'] as const}
          cell={(row, size) =>
            row === 'image' ? (
              <ProfilePhoto size={size} src={IMAGE} alt="Organization" />
            ) : (
              <ProfilePhoto size={size} type={row === 'icon' ? 'icon' : 'initials'} initials="OR" alt="Olivia Rhye" showVerified={row.endsWith('verified')} />
            )
          }
        />
      ),
    },
    {
      title: '.Main/Avatar indicator',
      rows: 'Type',
      columns: 'Size',
      render: () => (
        <Matrix rowProp="Type" rows={INDICATORS} colProp="Size" cols={SIZES} cell={(t, size) => <Avatar size={size} type="initials" initials="OR" alt="Olivia Rhye" indicator={t} count={t === 'count' ? 3 : undefined} />} />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex items-end gap-4xl">
        <Avatar size="2xl" type="initials" initials="OR" alt="Olivia Rhye" indicator="online" />
        <Avatar size="2xl" type="image" src={IMAGE} alt="Organization" showRing indicator="verified" />
        <ProfilePhoto size="md" type="initials" initials="OR" alt="Olivia Rhye" showVerified />
      </div>
    ),
    parts: [
      { name: 'Root', target: 'root', description: 'A fixed, fully rounded square set by the size. It doesn’t clip, so the indicator can sit on its edge.', tokens: ['size/avatar/md', 'radius/full'] },
      { name: 'Surface', target: 'surface', description: 'The circle that holds and clips the content. A thin inner border keeps photos and placeholders visible on surfaces of the same color.', tokens: ['avatar/placeholder/fill', 'color/border/subtle'] },
      { name: 'Image / Initials / Placeholder icon', target: 'content', description: 'A photo, initials or a placeholder icon, all in the same frame. Photos are cropped to fill the circle. Initials grow with the size, and initials and icon use the placeholder colors.', tokens: ['avatar/placeholder/text', 'avatar/placeholder/icon'] },
      { name: 'Ring', target: 'ring', description: 'An optional outline in the surface color that separates overlapping avatars. It gets thicker above the lg size.', tokens: ['color/surface/base', 'border/width/strong'] },
      { name: 'Indicator', target: 'indicator', description: 'An optional mark in the bottom-right corner that never changes the avatar’s size. Each type has its own color and a ring in the surface color.', tokens: ['size/indicator/md', 'color/icon/success', 'color/icon/brand', 'color/fill/danger/solid'] },
      { name: 'Profile photo wrappers', target: 'outer-wrapper', description: 'The profile photo wraps the avatar in a raised outer frame, with an optional verified mark in the bottom-right corner.', tokens: ['profile-photo/size/md', 'profile-photo/ring/md', 'elevation/raised'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'", default: "'md'", description: 'Sets the side (16 → 64), the initials style, and the icon and indicator size.' },
    { name: 'type', figma: 'Type', type: "'image' | 'initials' | 'icon'", default: "'image'", description: 'What the avatar shows. image falls back to initials (or the icon) when there’s no src or the image fails to load.' },
    { name: 'src', figma: 'Image', type: 'string', description: 'The photo URL.' },
    { name: 'initials', figma: 'Initials', type: 'string', description: 'One or two letters.' },
    { name: 'alt', type: 'string', description: 'The accessible name, usually the person’s name. Pass "" when the name is already visible next to the avatar.' },
    { name: 'showRing', figma: 'Show ring', type: 'boolean', default: 'false', description: 'Adds a ring in the surface color.' },
    { name: 'indicator', figma: 'Show indicator + nested Type', type: "'offline' | 'online' | 'verified' | 'company' | 'count'", description: 'An overlay mark. It’s added to the accessible name (“Olivia Rhye, online”).' },
    { name: 'count', type: 'number', description: 'The number for indicator="count". Above 99 it shows 99+.' },
    { name: 'companySrc, companyName', type: 'string', description: 'For indicator="company": the organization’s logo and name.' },
    { name: 'ProfilePhoto size', figma: 'Profile photo › Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Sets the outer side: 72 · 96 · 160.' },
    { name: 'ProfilePhoto type / src / initials', figma: 'Profile photo › Type, Image, Initials', type: '—', description: 'Same as on Avatar.' },
    { name: 'ProfilePhoto showVerified', figma: 'Profile photo › Show verified', type: 'boolean', default: 'false', description: 'Shows a verified mark in the bottom-right corner.' },
  ],
  tokens: [
    'size/avatar/2xs', 'size/avatar/xs', 'size/avatar/sm', 'size/avatar/md', 'size/avatar/lg', 'size/avatar/xl', 'size/avatar/2xl',
    'avatar/placeholder/fill', 'avatar/placeholder/text', 'avatar/placeholder/icon',
    'color/border/subtle', 'color/surface/base', 'color/icon/success', 'color/icon/disabled', 'color/icon/brand', 'color/fill/danger/solid', 'color/text/on-solid',
    'size/indicator/xs', 'size/indicator/sm', 'size/indicator/md', 'size/indicator/lg', 'border/width/strong', 'radius/full', 'radius/xs',
    'profile-photo/size/sm', 'profile-photo/size/md', 'profile-photo/size/lg', 'profile-photo/ring/sm', 'profile-photo/ring/md', 'profile-photo/ring/lg', 'elevation/raised',
  ],
  guidelines: [
    {
      title: 'Use approved images',
      body: 'In the product, avatars show people’s own photos. Design files use approved demo images only, with the source and license noted next to each one.\n\nThis template ships no photography, so the product mark stands in for the image type. Don’t claim rights to images you weren’t given.',
      render: () => (
        <div className="flex items-center gap-xl">
          <Avatar size="xl" src={IMAGE} alt="Organization" />
          <div className="type-body-xs-regular flex flex-col gap-xxs text-text-tertiary">
            <span><span className="text-text-secondary">Name</span> · Product mark</span>
            <span><span className="text-text-secondary">Source</span> · public/brand/mark.svg</span>
            <span><span className="text-text-secondary">License</span> · owned by the product</span>
          </div>
        </div>
      ),
    },
    {
      title: 'One image source per person',
      body: 'In code, one image URL feeds every avatar and profile photo of the same person. Change the source once and it updates everywhere, the same way the shared .Main/Avatar image components work in Figma.',
      render: () => (
        <div className="flex items-center gap-xl">
          <span className="type-code-sm-regular rounded-xs bg-surface-sunken px-md py-xs text-text-secondary">src = user.photo</span>
          <Icon name="arrows/arrow-right" className="text-icon-tertiary" />
          <div className="flex items-center gap-lg">
            <Avatar size="xs" src={IMAGE} alt="" />
            <Avatar size="md" src={IMAGE} alt="" />
            <ProfilePhoto size="sm" src={IMAGE} alt="" />
          </div>
        </div>
      ),
    },
    {
      title: 'Change an avatar by its source',
      body: 'Change the image source the avatar gets in code, or swap Image on the instance in Figma. Avoid detaching or redrawing the avatar. The crop stays centered, so any image fills the circle without stretching.',
      do: { caption: 'Swap the source, and the crop stays centered.', render: () => <div className="flex gap-md"><Avatar size="lg" type="initials" initials="OR" alt="" /><Icon name="arrows/arrow-right" className="self-center text-icon-tertiary" /><Avatar size="lg" src={IMAGE} alt="" /></div> },
      dont: { caption: 'Stretch or squash an image. Crop it instead.', render: () => <span className="inline-flex h-(--size-avatar-lg) w-[5.5rem] overflow-hidden rounded-full border border-border-subtle"><img src={IMAGE} alt="" className="size-full object-fill" /></span> },
    },
    {
      title: 'Change placeholders in one place',
      body: 'The placeholder icon (users/user) lives inside the component, and initials are a text property. Change either once and every placeholder follows.',
      render: () => (
        <div className="flex items-center gap-lg">
          <Avatar size="lg" src={IMAGE} alt="" />
          <Avatar size="lg" type="icon" alt="" />
          <Avatar size="lg" type="initials" initials="OR" alt="" />
          <Avatar size="lg" type="initials" initials="LS" alt="" />
        </div>
      ),
    },
    {
      title: 'Change placeholder colors with tokens',
      body: 'The placeholder fill, initials and icon use the component tokens avatar/placeholder/fill, /text and /icon. Point those aliases at other colors and every placeholder in the system updates.',
      render: () => (
        <div className="flex flex-wrap items-center gap-xl">
          <div className="flex gap-sm">
            <Avatar size="md" type="initials" initials="OR" alt="" />
            <Avatar size="md" type="icon" alt="" />
          </div>
          <span className="type-code-sm-regular rounded-xs bg-surface-sunken px-md py-xs text-text-secondary">avatar/placeholder/fill → color/fill/brand/subtle</span>
          <div
            className="flex gap-sm"
            style={{ ['--avatar-placeholder-fill' as string]: 'var(--color-fill-brand-subtle)', ['--avatar-placeholder-text' as string]: 'var(--color-text-brand)', ['--avatar-placeholder-icon' as string]: 'var(--color-icon-brand)' }}
          >
            <Avatar size="md" type="initials" initials="OR" alt="" />
            <Avatar size="md" type="icon" alt="" />
          </div>
        </div>
      ),
    },
    {
      title: 'Choose a size and type',
      body: 'Use 2xs or xs inside tags, badges and dense tables, sm or md in lists, comments and top bars, and lg to 2xl in cards and headers. Profile pages use the profile photo.\n\nShow a photo when you have one, and initials when you have a name. Use the icon when nobody is assigned or you don’t know who it is.',
      render: () => <div className="flex items-end gap-lg">{SIZES.map((s) => <Avatar key={s} size={s} type="initials" initials="OR" alt="" />)}</div>,
      do: { caption: 'Initials when there’s no photo.', render: () => <Avatar size="lg" type="initials" initials="OR" alt="" /> },
      dont: { caption: 'A stock face as a fallback. It shows someone who isn’t the person.' },
    },
    {
      title: 'Show status with indicators',
      body: 'Online and offline show presence, verified marks a confirmed identity, company shows the organization someone belongs to, and count shows unread items.\n\nIndicators sit over the bottom-right edge and never change the avatar’s size. In the product, pair presence with text, like “Online”.',
      render: () => (
        <div className="flex items-center gap-xl">
          {INDICATORS.map((i) => (
            <div key={i} className="flex flex-col items-center gap-sm">
              <Avatar size="lg" type="initials" initials="OR" alt="Olivia Rhye" indicator={i} count={i === 'count' ? 3 : undefined} />
              <span className="type-body-xs-regular text-text-tertiary">{i}</span>
            </div>
          ))}
        </div>
      ),
      do: { caption: 'The indicator sits on top, so rows stay aligned.', render: () => <div className="flex items-center gap-sm"><Avatar size="md" type="initials" initials="OR" alt="" indicator="online" /><span className="type-body-sm-medium text-text-primary">Olivia Rhye · Online</span></div> },
      dont: {
        caption: 'An indicator that pushes the avatar out of line.',
        render: () => (
          <div className="flex items-center gap-sm">
            <Avatar size="md" type="initials" initials="OR" alt="" />
            <span className="size-(--size-indicator-md) self-end rounded-full bg-icon-success" />
            <span className="type-body-sm-medium text-text-primary">Olivia Rhye</span>
          </div>
        ),
      },
    },
  ],
  accessibility: [
    'An avatar that identifies someone uses their name as alt. When the name already appears next to it, use alt="" so screen readers don’t repeat it.',
    'Indicators have a text equivalent: the name screen readers announce becomes “Olivia Rhye, online”.',
    'Initials meet text contrast on the placeholder fill.',
    'The avatar itself isn’t interactive. When it opens a menu, the button around it takes focus and shows the focus/default ring, fully rounded (radius/full).',
  ],
});
