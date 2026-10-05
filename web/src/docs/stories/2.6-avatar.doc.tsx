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
  return <Avatar size={size} type="image" src={IMAGE} alt="Organisation" showRing={row === 'image + ring'} indicator={indicator} count={indicator === 'count' ? 3 : undefined} />;
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
    'One person or organisation. Seven sizes, image, initials or icon placeholder, an optional ring for overlapping and an optional indicator overlay. The root is always square with a full radius.',
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
      caption: 'Initials fill in when there is no photo; the footprint stays the same.',
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
      caption: 'Presence indicators overlay the avatar without pushing layout.',
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
      caption: 'Profile photo is the large, ringed avatar for profile pages.',
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
      caption: 'The icon placeholder means “nobody yet”.',
      render: () => (
        <div className="flex w-full max-w-[22rem] flex-col rounded-surface border border-border-subtle bg-surface-base">
          {[
            { task: 'Update pricing page', who: 'Lana Steiner', i: 'LS' },
            { task: 'Audit colour tokens', who: undefined, i: undefined },
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
    use: ['Identify people and organisations: authors, assignees, members, accounts.', 'Show presence, verification or unread counts on an identity.'],
    dont: ['Decoration, or things that aren’t identities — use a Featured icon (2.19).', 'Groups of avatars or avatar + name + email — use Avatar group (3.4).'],
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
              <ProfilePhoto size={size} src={IMAGE} alt="Organisation" />
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
        <Avatar size="2xl" type="initials" initials="OR" alt="Olivia Rhye" showRing indicator="online" />
        <Avatar size="2xl" type="image" src={IMAGE} alt="Organisation" indicator="verified" />
        <ProfilePhoto size="md" type="initials" initials="OR" alt="Olivia Rhye" showVerified />
      </div>
    ),
    parts: [
      { name: 'Root', description: 'Fixed square size/avatar/{size}, radius/full, clip off so the indicator can sit on the edge.', tokens: ['size/avatar/md', 'radius/full'] },
      { name: 'Surface', description: 'Full radius, clip on. Placeholder fill avatar/placeholder/fill; an inner contrast border (color/border/subtle) keeps photos and placeholders visible on same-coloured surfaces.', tokens: ['avatar/placeholder/fill', 'color/border/subtle'] },
      { name: 'Image / Initials / Placeholder icon', description: 'Alternate treatments inside the same frame. Image is cropped to the circle (cover). Initials: type/body/xs → heading/xs semibold in avatar/placeholder/text. Icon: users/user in avatar/placeholder/icon.', tokens: ['avatar/placeholder/text', 'avatar/placeholder/icon'] },
      { name: 'Ring', description: 'Show ring: an inside stroke in color/surface/base — border/width/strong up to lg, 3 above. Separates overlapping avatars.', tokens: ['color/surface/base', 'border/width/strong'] },
      { name: 'Indicator', description: '.Main/Avatar indicator, absolute bottom-right, never changes the size. Online color/icon/success, offline color/icon/disabled, verified color/icon/brand, count color/fill/danger/solid; each ringed in color/surface/base.', tokens: ['size/indicator/md', 'color/icon/success', 'color/icon/brand', 'color/fill/danger/solid'] },
      { name: 'Profile photo wrappers', description: 'Outer wrapper: padding profile-photo/ring/{size}, color/surface/base, elevation/raised. Avatar wrapper: full radius, clip, inner contrast border. Verified mark bottom-right.', tokens: ['profile-photo/size/md', 'profile-photo/ring/md', 'elevation/raised'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'", default: "'md'", description: 'Side 16 → 64, initials style, icon and indicator size.' },
    { name: 'type', figma: 'Type', type: "'image' | 'initials' | 'icon'", default: "'image'", description: 'Content treatment. image falls back to initials (or icon) without a src or when it fails to load.' },
    { name: 'src', figma: 'Image', type: 'string', description: 'Photo URL.' },
    { name: 'initials', figma: 'Initials', type: 'string', description: 'One or two letters.' },
    { name: 'alt', type: 'string', description: 'Accessible name (the person). Pass "" when the name is visible next to the avatar.' },
    { name: 'showRing', figma: 'Show ring', type: 'boolean', default: 'false', description: 'Ring in the surface colour.' },
    { name: 'indicator', figma: 'Show indicator + nested Type', type: "'offline' | 'online' | 'verified' | 'company' | 'count'", description: 'Overlay mark; added to the accessible name (“Olivia Rhye, online”).' },
    { name: 'count', type: 'number', description: 'indicator="count": number; above 99 shows 99+.' },
    { name: 'companySrc, companyName', type: 'string', description: 'indicator="company": the organisation’s logo and name.' },
    { name: 'ProfilePhoto size', figma: 'Profile photo › Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'Outer side 72 · 96 · 160.' },
    { name: 'ProfilePhoto type / src / initials', figma: 'Profile photo › Type, Image, Initials', type: '—', description: 'As on Avatar.' },
    { name: 'ProfilePhoto showVerified', figma: 'Profile photo › Show verified', type: 'boolean', default: 'false', description: 'Verified mark bottom-right.' },
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
      title: 'Avatar image usage',
      body: 'Avatar photos are the people’s own pictures, supplied by the product at runtime; design files use approved demo images only, with their source and licence recorded next to them. This template ships no photography, so the product mark stands in for the image type. Never claim rights that were not provided.',
      render: () => (
        <div className="flex items-center gap-xl">
          <Avatar size="xl" src={IMAGE} alt="Organisation" />
          <div className="type-body-xs-regular flex flex-col gap-xxs text-text-tertiary">
            <span><span className="text-text-secondary">Name</span> · Product mark</span>
            <span><span className="text-text-secondary">Source</span> · public/brand/mark.svg</span>
            <span><span className="text-text-secondary">Licence</span> · owned by the product</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Shared avatar images',
      body: 'In code, one image URL feeds every Avatar and Profile photo that shows the same person, so changing the source once updates every place it appears — the equivalent of the shared .Main/Avatar image components in Figma.',
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
      title: 'How to change an avatar',
      body: 'Change the `src` the avatar receives (or swap Image on the instance in Figma) — never detach or redraw the avatar. The crop stays cover-centred, so any image fills the circle without stretching.',
      do: { caption: 'Swap the source; the crop stays centred.', render: () => <div className="flex gap-md"><Avatar size="lg" type="initials" initials="OR" alt="" /><Icon name="arrows/arrow-right" className="self-center text-icon-tertiary" /><Avatar size="lg" src={IMAGE} alt="" /></div> },
      dont: { caption: 'Stretch or squash an image; crop it.', render: () => <span className="inline-flex h-(--size-avatar-lg) w-[5.5rem] overflow-hidden rounded-full border border-border-subtle"><img src={IMAGE} alt="" className="size-full object-fill" /></span> },
    },
    {
      title: 'How to change placeholder imagery',
      body: 'The placeholder icon is one icon (users/user) inside the component, and initials are a text property — change them in one place and every placeholder follows.',
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
      title: 'How to change placeholder colours',
      body: 'Placeholder fill, initials and icon are the component tokens avatar/placeholder/fill, /text and /icon. Point the alias somewhere else and every placeholder in the system updates.',
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
      title: 'Choosing a size and a type',
      body: '2xs/xs inside tags, badges and dense tables; sm/md in lists, comments and top bars; lg–2xl in cards and headers; Profile photo on profile pages. Image when a photo exists, initials when a name exists, icon when nobody is assigned or the identity is unknown.',
      render: () => <div className="flex items-end gap-lg">{SIZES.map((s) => <Avatar key={s} size={s} type="initials" initials="OR" alt="" />)}</div>,
      do: { caption: 'Initials when there is no photo.', render: () => <Avatar size="lg" type="initials" initials="OR" alt="" /> },
      dont: { caption: 'A stock face as a fallback: it shows someone who isn’t the person.' },
    },
    {
      title: 'Indicators',
      body: 'Online and offline show presence; verified marks a confirmed identity; company marks the organisation a person belongs to; count shows unread items. Indicators always sit bottom-right, overlay the edge and never change the avatar size. Pair presence with text in product (“Online”).',
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
      do: { caption: 'The indicator overlays; rows stay aligned.', render: () => <div className="flex items-center gap-sm"><Avatar size="md" type="initials" initials="OR" alt="" indicator="online" /><span className="type-body-sm-medium text-text-primary">Olivia Rhye · Online</span></div> },
      dont: {
        caption: 'An indicator that pushes the avatar out of alignment.',
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
    'Avatars that identify someone take the person’s name as `alt`; decorative repeats (the same person next to their name) use `alt=""`.',
    'Indicators have a text equivalent: the accessible name becomes “Olivia Rhye, online”.',
    'Initials meet text contrast on the placeholder fill.',
    'Avatar is not interactive. When it triggers a menu, the wrapping button owns focus: focus/default with radius/full.',
  ],
});
