import { useId, useState, type ChangeEvent, type HTMLAttributes, type LabelHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { forceAttr, type ForcedState } from '@/lib/types';
import type { IconName } from '@/icons';
import { Avatar } from '../parts/Avatar';
import { Badge } from '../parts/Badge';
import { Checkbox } from '../parts/Checkbox';
import { FeaturedIcon } from '../parts/FeaturedIcon';
import { Label } from '../parts/Label';
import { Radio } from '../parts/Radio';
import { Switch } from '../parts/Switch';
import { PaymentMark } from './_PaymentMark';

/**
 * 3.3 Choice field — the labelled versions of the choice Parts.
 * Figma: `Choice field` · Type × Size × Checked × State (56 variants),
 *        `Choice card` · Type × Size × Selected × State × Breakpoint (144),
 *        `Choice group` · Type × Size × Breakpoint (24).
 * Built on 2.7 Checkbox, 2.8 Radio and 2.9 Switch; the whole row or card is a `<label>`, so it is one click target.
 */

/* ---------- Choice field ---------- */

export type ChoiceFieldType = 'checkbox' | 'radio' | 'switch';

const fieldText = { sm: 'type-body-sm-medium', md: 'type-body-md-medium' } as const;
const fieldSupporting = { sm: 'type-body-sm-regular', md: 'type-body-md-regular' } as const;
const fieldGap = { sm: 'gap-md', md: 'gap-lg' } as const;

export interface ChoiceFieldProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children' | 'onChange' | 'defaultChecked'> {
  /** Figma `Type`: which Part sits next to the text. */
  type?: ChoiceFieldType;
  /** Figma `Size`. Checkbox / Radio 16 or 20; Switch sm or md. */
  size?: 'sm' | 'md';
  /** Figma `Checked`. `'mixed'` only for `checkbox`. Omit (use `defaultChecked`) for uncontrolled. */
  checked?: boolean | 'mixed';
  defaultChecked?: boolean | 'mixed';
  onCheckedChange?: (checked: boolean) => void;
  /** Figma `Text`. */
  text?: ReactNode;
  /** Figma `Show supporting text` + `Supporting text`. Present = shown. */
  supportingText?: ReactNode;
  /** Figma `State=disabled`. */
  disabled?: boolean;
  /** Form name and value of the input. */
  name?: string;
  value?: string;
  required?: boolean;
  /** Documentation only: Figma `State=hover` or `State=focus` (shown on the control). */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
  /** Switch `Type` (exposed nested instance). */
  switchType?: 'default' | 'slim';
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ChoiceField({
  type = 'checkbox',
  size = 'md',
  checked,
  defaultChecked,
  onCheckedChange,
  text = 'Remember me',
  supportingText,
  disabled = false,
  name,
  value,
  required,
  forceState,
  switchType = 'default',
  onChange,
  className,
  ...rest
}: ChoiceFieldProps) {
  const id = useId();
  const supId = supportingText != null ? `${id}-sup` : undefined;
  const common = { size, disabled, name, value, required, forceState, onChange, onCheckedChange, 'aria-describedby': supId };
  const plain = (c: boolean | 'mixed' | undefined) => (c === 'mixed' ? undefined : c);
  return (
    <label
      data-disabled={disabled || undefined}
      className={cn('group/cf inline-flex items-start', disabled ? 'cursor-not-allowed' : 'cursor-pointer', fieldGap[size], className)}
      {...rest}
    >
      {/* Control wrapper: exactly one text line tall, so the control sits on the first line. */}
      <span className={cn('flex h-[1lh] shrink-0 items-center', fieldText[size])}>
        {type === 'checkbox' ? (
          <Checkbox {...common} checked={checked} defaultChecked={defaultChecked} />
        ) : type === 'radio' ? (
          <Radio {...common} checked={plain(checked)} defaultChecked={plain(defaultChecked)} />
        ) : (
          <Switch {...common} type={switchType} checked={plain(checked)} defaultChecked={plain(defaultChecked)} />
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={cn(fieldText[size], disabled ? 'text-text-disabled' : 'text-text-secondary')}>{text}</span>
        {supportingText != null && (
          <span id={supId} className={cn(fieldSupporting[size], disabled ? 'text-text-disabled' : 'text-text-tertiary')}>
            {supportingText}
          </span>
        )}
      </span>
    </label>
  );
}

/* ---------- Choice card ---------- */

export type ChoiceCardType = 'icon' | 'icon-card' | 'avatar' | 'payment' | 'radio' | 'checkbox';
export type ChoiceBreakpoint = 'mobile' | 'desktop';

const cardPad = {
  desktop: { sm: 'p-xl', md: 'p-2xl' },
  mobile: { sm: 'p-lg', md: 'p-xl' },
} as const;
const cardGap = {
  desktop: { sm: 'gap-md', md: 'gap-lg' },
  mobile: { sm: 'gap-md', md: 'gap-md' },
} as const;
const cardText = { sm: 'type-body-sm-medium', md: 'type-body-md-medium' } as const;
const cardSub = { sm: 'type-body-sm-regular', md: 'type-body-md-regular' } as const;

export interface ChoiceCardProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'children' | 'onChange'> {
  /** Figma `Type`: the leading visual and the selection control. */
  type?: ChoiceCardType;
  /** Figma `Size`. */
  size?: 'sm' | 'md';
  /** Figma `Selected`. Omit (use `defaultSelected`) for uncontrolled. */
  selected?: boolean;
  defaultSelected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  /** Figma `Breakpoint`: mobile is its own layout (Subtext moves under the title). */
  breakpoint?: ChoiceBreakpoint;
  /** Figma `Text`. */
  text?: ReactNode;
  /** Figma `Subtext`. */
  subtext?: ReactNode;
  /** Figma `Supporting text`. */
  supportingText?: ReactNode;
  /** Figma `Show badge`: the Badge label ("Popular"). */
  badge?: ReactNode;
  /** `icon` / `icon-card`: the Featured icon's glyph. */
  icon?: IconName;
  /** `avatar`: the person. */
  avatar?: { src?: string; initials?: string };
  /** `payment`: the card mark (1.8 Brand assets); a neutral mark by default. */
  paymentMark?: ReactNode;
  /** Input name (radio cards in one group share it) and value. */
  name?: string;
  value?: string;
  disabled?: boolean;
  /** Documentation only: Figma `State=hover` or `State=focus`. */
  forceState?: Extract<ForcedState, 'hover' | 'focus'>;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function ChoiceCard({
  type = 'icon',
  size = 'md',
  selected,
  defaultSelected,
  onSelectedChange,
  breakpoint = 'desktop',
  text = 'Basic plan',
  subtext = '$10/month',
  supportingText = 'Includes up to 10 users, 20 GB individual data and access to all features.',
  badge,
  icon = 'general/layers',
  avatar,
  paymentMark,
  name,
  value,
  disabled = false,
  forceState,
  onChange,
  className,
  ...rest
}: ChoiceCardProps) {
  const id = useId();
  const multi = type === 'checkbox';
  const mobile = breakpoint === 'mobile';
  const control = {
    size: 'sm' as const,
    parentFocus: true,
    name,
    value,
    disabled,
    'aria-describedby': supportingText != null ? `${id}-sup` : undefined,
    onChange,
    ...(forceState === 'hover' && { forceState: 'hover' as const }),
  };
  const input = multi ? (
    <Checkbox {...control} checked={selected} defaultChecked={defaultSelected} onCheckedChange={onSelectedChange} />
  ) : (
    <Radio {...control} checked={selected} defaultChecked={defaultSelected} onCheckedChange={onSelectedChange} />
  );
  /** Leading controls sit on the first text line. */
  const firstLine = (node: ReactNode) => <span className={cn('flex h-[1lh] shrink-0 items-center', cardText[size])}>{node}</span>;

  const title = (
    <span className={cn('flex gap-xs', mobile ? 'flex-col' : 'flex-wrap items-baseline')}>
      <span className="flex flex-wrap items-center gap-xs">
        <span className={cn(cardText[size], 'text-text-secondary group-has-[input:checked]/card:text-text-brand')}>{text}</span>
        {mobile && badge != null && <Badge size="sm" tone="brand" label={badge} />}
      </span>
      {subtext != null && <span className={cn(cardSub[size], 'text-text-tertiary')}>{subtext}</span>}
      {!mobile && badge != null && <Badge size="sm" tone="brand" label={badge} className="self-center" />}
    </span>
  );
  const content = (
    <span className="flex min-w-0 flex-1 flex-col gap-xxs">
      {title}
      {supportingText != null && (
        <span id={`${id}-sup`} className={cn(cardSub[size], 'text-text-tertiary')}>
          {supportingText}
        </span>
      )}
    </span>
  );
  const featured = <FeaturedIcon size={size === 'sm' ? 'sm' : 'md'} icon={icon} />;

  return (
    <label
      data-disabled={disabled || undefined}
      className={cn(
        'group/card relative flex w-full rounded-surface border-(length:--border-width-default) border-border-default bg-surface-base',
        'transition-[border-color,box-shadow] duration-(--motion-duration-fast) ease-standard',
        'is-hover:border-border-strong has-[input:focus-visible]:shadow-focus-default data-[force=focus]:shadow-focus-default',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        type === 'icon-card' ? 'flex-col' : 'items-start',
        cardPad[breakpoint][size],
        type === 'icon-card' ? 'gap-lg' : cardGap[breakpoint][size],
        className,
      )}
      {...forceAttr(forceState)}
      {...rest}
    >
      {/* Selection border: border/width/strong in brand, drawn inside so the card does not grow. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-(--border-width-default) hidden rounded-surface border-(length:--border-width-strong) border-border-brand group-has-[input:checked]/card:block"
      />
      {type === 'icon-card' ? (
        <>
          <span className="flex items-start justify-between gap-md">
            {featured}
            {input}
          </span>
          {content}
        </>
      ) : (
        <>
          {type === 'icon' && featured}
          {type === 'avatar' && <Avatar size="md" type={avatar?.src ? 'image' : avatar?.initials ? 'initials' : 'icon'} src={avatar?.src} initials={avatar?.initials} alt="" />}
          {type === 'payment' && (paymentMark ?? <PaymentMark size="md" />)}
          {(type === 'radio' || type === 'checkbox') && firstLine(input)}
          {content}
          {(type === 'icon' || type === 'avatar' || type === 'payment') && firstLine(input)}
        </>
      )}
    </label>
  );
}

/* ---------- Choice group ---------- */

export interface ChoiceGroupOption {
  value: string;
  text: ReactNode;
  subtext?: ReactNode;
  supportingText?: ReactNode;
  badge?: ReactNode;
  icon?: IconName;
  avatar?: { src?: string; initials?: string };
  paymentMark?: ReactNode;
  disabled?: boolean;
}

export interface ChoiceGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  /** Figma `Type` of every card. `checkbox` allows several selections; every other type one. */
  type?: ChoiceCardType;
  /** Figma `Size`. */
  size?: 'sm' | 'md';
  /** Figma `Breakpoint`. `icon-card` groups sit side by side on desktop and stack on mobile. */
  breakpoint?: ChoiceBreakpoint;
  /** Figma `Show label` + Label text: the question. Without it, pass `aria-label`. */
  label?: ReactNode;
  options: ChoiceGroupOption[];
  /** Selected value(s): a string for one-of groups, an array for `checkbox`. Omit for uncontrolled. */
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  /** Input name; generated when omitted. */
  name?: string;
  required?: boolean;
}

export function ChoiceGroup({
  type = 'icon',
  size = 'md',
  breakpoint = 'desktop',
  label,
  options,
  value,
  defaultValue,
  onValueChange,
  name,
  required,
  className,
  ...rest
}: ChoiceGroupProps) {
  const auto = useId();
  const groupName = name ?? `cg-${auto}`;
  const multi = type === 'checkbox';
  const [inner, setInner] = useState<string | string[]>(defaultValue ?? (multi ? [] : (options[0]?.value ?? '')));
  const current = value !== undefined ? value : inner;
  const isSelected = (v: string) => (Array.isArray(current) ? current.includes(v) : current === v);
  const set = (v: string, on: boolean) => {
    const next = multi ? (on ? [...(current as string[]), v] : (current as string[]).filter((x) => x !== v)) : v;
    if (!multi && !on) return;
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };
  const row = type === 'icon-card' && breakpoint === 'desktop';
  return (
    <div
      role={multi ? 'group' : 'radiogroup'}
      aria-labelledby={label != null ? `${groupName}-label` : undefined}
      aria-required={required || undefined}
      className={cn('flex w-full flex-col gap-lg', className)}
      {...rest}
    >
      {label != null && <Label as="span" id={`${groupName}-label`} size={size} label={label} showRequired={required} />}
      <div className={cn('gap-lg', row ? 'grid auto-cols-fr grid-flow-col' : 'flex flex-col')}>
        {options.map((o) => (
          <ChoiceCard
            key={o.value}
            type={type}
            size={size}
            breakpoint={breakpoint}
            name={groupName}
            value={o.value}
            selected={isSelected(o.value)}
            onSelectedChange={(on) => set(o.value, on)}
            text={o.text}
            subtext={o.subtext}
            supportingText={o.supportingText}
            badge={o.badge}
            icon={o.icon}
            avatar={o.avatar}
            paymentMark={o.paymentMark}
            disabled={o.disabled}
          />
        ))}
      </div>
    </div>
  );
}
