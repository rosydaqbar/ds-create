import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Avatar } from '../parts/Avatar';
import { Tooltip } from '../parts/Tooltip';
import { AvatarGroupAddButton } from './_AvatarGroupParts';

/**
 * 3.4 Avatar group — several people at once.
 * Figma: `Avatar group` · Size (3 variants) · Count, Show count, Show add button.
 *        `Avatar label` · Size (3 variants) · Text, Supporting text, Show supporting text.
 * Private part `.Main/Avatar group add button` lives in `_AvatarGroupParts.tsx`.
 *
 * Avatars overlap through a negative inline margin of `avatar-group/overlap/{size}` (Figma's negative gap);
 * earlier avatars sit on top; every avatar has the ring. At most five avatars show, then the count.
 */

export type AvatarGroupSize = 'xs' | 'sm' | 'md';

/** One person in a group or label. Without `src` the Avatar shows the initials (or the placeholder icon). */
export interface AvatarPerson {
  name: string;
  src?: string;
  initials?: string;
}

/** Shows up to five avatars; the count takes over beyond that. */
const MAX_SHOWN = 5;

const overlap: Record<AvatarGroupSize, string> = {
  xs: '[&>*+*]:ms-(--avatar-group-overlap-xs)',
  sm: '[&>*+*]:ms-(--avatar-group-overlap-sm)',
  md: '[&>*+*]:ms-(--avatar-group-overlap-md)',
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

const personAvatar = (p: AvatarPerson) => ({
  type: p.src ? ('image' as const) : ('initials' as const),
  src: p.src,
  initials: p.initials ?? initialsOf(p.name),
});

/** Default people: placeholders for the Figma sample content. */
export const avatarGroupSamplePeople: AvatarPerson[] = [
  { name: 'Olivia Rhye' },
  { name: 'Phoenix Baker' },
  { name: 'Lana Steiner' },
  { name: 'Demi Wilkinson' },
  { name: 'Candice Wu' },
];

export interface AvatarGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Size`: avatar side, overlap and add button. */
  size?: AvatarGroupSize;
  /** The people (exposed nested Avatars in Figma). The first five show; the rest go into the count. */
  people?: AvatarPerson[];
  /** Figma `Count`. Defaults to "+{hidden people}" (or "+5" for the sample content). */
  count?: string;
  /** Figma `Show count`. */
  showCount?: boolean;
  /** Figma `Show add button`. */
  showAddButton?: boolean;
  /** Called by the add button ("Add people"). */
  onAddClick?: () => void;
  /** Accessible name and Tooltip of the add button. */
  addLabel?: string;
  /** Makes the count a button that opens the full list. */
  onCountClick?: () => void;
  /** Total number of people when `people` holds only the first few (drives the default count and the name). */
  total?: number;
}

export function AvatarGroup({
  size = 'sm',
  people = avatarGroupSamplePeople,
  count,
  showCount = true,
  showAddButton = true,
  onAddClick,
  addLabel = 'Add people',
  onCountClick,
  total: totalProp,
  className,
  ...rest
}: AvatarGroupProps) {
  const shown = people.slice(0, MAX_SHOWN);
  const sample = people === avatarGroupSamplePeople && totalProp == null;
  const total = totalProp ?? (sample ? people.length + 5 : people.length);
  const hidden = Math.max(0, total - shown.length);
  const countText = count ?? `+${hidden}`;
  const withCount = showCount && (count != null || hidden > 0);
  const hiddenNames = people.slice(MAX_SHOWN).map((p) => p.name);

  const named = shown.slice(0, 2).map((p) => p.name);
  const rest_ = total - named.length;
  const groupName = `${total} ${total === 1 ? 'person' : 'people'}: ${named.join(', ')}${rest_ > 0 ? ` and ${rest_} more` : ''}`;

  const countAvatar = <Avatar size={size} type="initials" initials={countText} showRing alt="" />;
  const countTooltip: ReactNode = hiddenNames.length > 0 ? hiddenNames.join(', ') : `${hidden} more`;

  return (
    <div role="group" aria-label={rest['aria-label'] ?? groupName} className={cn('inline-flex items-center gap-md', className)} {...rest}>
      <div className={cn('isolate flex items-center', overlap[size])}>
        {shown.map((p, i) => (
          <Avatar
            key={`${p.name}-${i}`}
            size={size}
            {...personAvatar(p)}
            alt={p.name}
            showRing
            style={{ zIndex: shown.length + 1 - i }}
          />
        ))}
        {withCount && (
          <span className="relative z-0 inline-flex">
            <Tooltip text={countTooltip}>
              {onCountClick ? (
                <button
                  type="button"
                  aria-label={`Show all ${total} people`}
                  onClick={onCountClick}
                  className="inline-flex cursor-pointer rounded-full outline-none is-focus:shadow-focus-default"
                >
                  {countAvatar}
                </button>
              ) : (
                <span className="inline-flex rounded-full">{countAvatar}</span>
              )}
            </Tooltip>
          </span>
        )}
      </div>
      {showAddButton && <AvatarGroupAddButton size={size} label={addLabel} onClick={onAddClick} />}
    </div>
  );
}

/* ---------- Avatar label ---------- */

export type AvatarLabelSize = 'sm' | 'md' | 'lg';

const labelGap: Record<AvatarLabelSize, string> = { sm: 'gap-md', md: 'gap-md', lg: 'gap-lg' };
const labelText: Record<AvatarLabelSize, string> = { sm: 'type-body-sm-semibold', md: 'type-body-sm-semibold', lg: 'type-body-md-semibold' };
const labelSupporting: Record<AvatarLabelSize, string> = { sm: 'type-body-sm-regular', md: 'type-body-sm-regular', lg: 'type-body-md-regular' };

export interface AvatarLabelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Figma `Size`: avatar sm / md / lg and the text styles. */
  size?: AvatarLabelSize;
  /** Figma `Text`: the person's name. */
  text?: ReactNode;
  /** Figma `Show supporting text` + `Supporting text`: email or role. Present = shown. */
  supportingText?: ReactNode;
  /** The person's avatar. Without `src` it shows `initials` (taken from `text` by default). */
  avatar?: { src?: string; initials?: string };
}

export function AvatarLabel({ size = 'md', text = 'Olivia Rhye', supportingText, avatar, className, ...rest }: AvatarLabelProps) {
  const name = typeof text === 'string' ? text : '';
  const initials = avatar?.initials ?? (name ? initialsOf(name) : undefined);
  return (
    <div className={cn('flex min-w-0 items-center', labelGap[size], className)} {...rest}>
      {/* The name is visible text, so the avatar is decorative here. */}
      <Avatar size={size} type={avatar?.src ? 'image' : initials ? 'initials' : 'icon'} src={avatar?.src} initials={initials} alt="" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={cn('truncate text-text-primary', labelText[size])}>{text}</span>
        {supportingText != null && supportingText !== '' && <span className={cn('truncate text-text-tertiary', labelSupporting[size])}>{supportingText}</span>}
      </div>
    </div>
  );
}
