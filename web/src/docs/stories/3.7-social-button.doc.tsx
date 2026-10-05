import { TextField } from '@/components/components/TextField';
import { SocialButton, SocialButtonGroup, socialButtonTypes, type SocialButtonSize, type SocialButtonType } from '@/components/components/SocialButton';
import { socialProviderName, socialProviders, type SocialProvider } from '@/components/assets/SocialMark';
import { Badge } from '@/components/parts/Badge';
import { Button } from '@/components/parts/Button';
import { Divider } from '@/components/parts/Divider';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['md', 'lg'] as const;
const STATES = ['rest', 'hover', 'focus'] as const;
const ICON_ONLY = ['false', 'true'] as const;

/** Columns State → Icon only; rows Provider → Size (spec §6). */
const COLS = STATES.flatMap((s) => ICON_ONLY.map((i) => `${s} · ${i}`));
const ROWS = socialProviders.flatMap((p) => SIZES.map((s) => `${p} · ${s}`));

const variant = (type: SocialButtonType, row: string, col: string) => {
  const [provider, size] = row.split(' · ') as [SocialProvider, SocialButtonSize];
  const [state, iconOnly] = col.split(' · ') as [(typeof STATES)[number], (typeof ICON_ONLY)[number]];
  return <SocialButton provider={provider} size={size} type={type} iconOnly={iconOnly === 'true'} forceState={state === 'rest' ? undefined : state} />;
};

const signInCard = () => (
  <div className="flex w-full max-w-[25rem] flex-col gap-2xl rounded-surface border border-border-subtle bg-surface-raised p-3xl shadow-raised">
    <div className="flex flex-col gap-xs">
      <h3 className="type-heading-sm-semibold text-text-primary">Sign in to your account</h3>
      <p className="type-body-sm-regular text-text-tertiary">Welcome back. Use your email or another account.</p>
    </div>
    <div className="flex flex-col gap-xl">
      <TextField label="Email" inputType="email" autoComplete="email" placeholder="you@example.com" />
      <TextField type="password" label="Password" placeholder="••••••••" />
    </div>
    <Button size="lg" fullWidth label="Sign in" />
    <Divider label="or" />
    <SocialButtonGroup size="lg" />
  </div>
);

export default defineDoc({
  id: '3.7',
  name: 'Social button',
  level: 'components',
  spec: 'components/3.7-social-button.md',
  exports: ['SocialButton', 'SocialButtonGroup', 'SocialMark'],
  summary:
    'Sign in or sign up with a third-party account. Three treatments: the provider’s solid colours, a neutral button with the colour mark, or a neutral button with a single-colour mark. The mark keeps its official proportions.',
  hero: () => <SocialButton size="lg" type="color" provider={socialProviders[0]} />,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'lg' },
      { name: 'provider', figma: 'Provider', control: { type: 'select', options: socialProviders }, default: socialProviders[0] },
      { name: 'type', figma: 'Type', control: { type: 'select', options: socialButtonTypes }, default: 'color' },
      { name: 'iconOnly', figma: 'Icon only', control: { type: 'boolean' }, default: false },
      { name: 'verb', figma: 'Label (content rule)', control: { type: 'select', options: ['Sign in', 'Sign up', 'Continue'] }, default: 'Sign in' },
    ],
    render: (a) => <SocialButton {...(a as any)} />,
    code: (a) => `<SocialButton${jsxProps(a, { size: 'lg', type: 'color', iconOnly: false, verb: 'Sign in' })} />`,
  },
  examples: [
    {
      title: 'Sign-in card',
      caption: 'Social buttons sit under the form, after an “or” divider, at the same size as the main action.',
      render: signInCard,
      code: `<form className="flex flex-col gap-2xl">
  <TextField label="Email" inputType="email" autoComplete="email" />
  <TextField label="Password" type="password" />
  <Button size="lg" fullWidth label="Sign in" type="submit" />
  <Divider label="or" />
  <SocialButtonGroup size="lg" providers={['google', 'apple', 'github']} />
</form>`,
    },
    {
      title: 'Compact sign-up',
      caption: 'An icon-only row for well-known providers when space is tight.',
      render: () => (
        <div className="flex flex-col items-center gap-lg">
          <span className="type-body-sm-medium text-text-tertiary">Sign up with</span>
          <SocialButtonGroup iconOnly verb="Sign up" />
        </div>
      ),
      code: `<span className="type-body-sm-medium text-text-tertiary">Sign up with</span>
<SocialButtonGroup iconOnly verb="Sign up" providers={['google', 'apple', 'github', 'facebook']} />`,
    },
    {
      title: 'Account settings · connected accounts',
      caption: 'Mono buttons keep linked accounts calm next to their status.',
      render: () => (
        <div className="flex w-full max-w-[28rem] flex-col rounded-surface border border-border-subtle bg-surface-base">
          {(['google', 'github', 'gitlab'] as const).map((p, i) => (
            <div key={p} className={`flex items-center justify-between gap-lg px-xl py-lg ${i ? 'border-t border-border-subtle' : ''}`}>
              <SocialButton size="md" type="mono" provider={p} verb="Continue" />
              {p !== 'gitlab' ? <Badge tone="success" label="Connected" showDot /> : <Badge tone="neutral" label="Not connected" />}
            </div>
          ))}
        </div>
      ),
      code: `<div className="flex items-center justify-between">
  <SocialButton size="md" type="mono" provider="google" verb="Continue" />
  <Badge tone="success" label="Connected" showDot />
</div>`,
    },
  ],
  whenToUse: {
    use: ['Signing in or signing up with a third-party account.', 'Linking a third-party account in account settings.'],
    dont: [
      'Any other action, such as sharing or following — use a Button (2.1).',
      'App downloads — use the app-store badges from 1.8 Brand assets.',
      'A provider that is unavailable — remove its button; Social buttons have no disabled state.',
    ],
  },
  matrices: [
    ...socialButtonTypes.map((type) => ({
      title: `Social button · Type=${type}`,
      rows: 'Provider → Size',
      columns: 'State → Icon only',
      render: () => <Matrix rowProp="Provider · Size" rows={ROWS} colProp="State · Icon only" cols={COLS} cell={(r, c) => variant(type, r, c)} />,
    })),
    {
      title: 'Social button group',
      rows: 'Type → Size',
      columns: 'Icon only',
      render: () => (
        <Matrix
          rowProp="Type · Size"
          rows={socialButtonTypes.flatMap((t) => SIZES.map((s) => `${t} · ${s}`))}
          colProp="Icon only"
          cols={ICON_ONLY}
          cell={(row, iconOnly) => {
            const [type, size] = row.split(' · ') as [SocialButtonType, SocialButtonSize];
            return (
              <div className={iconOnly === 'true' ? '' : 'w-[22.5rem]'}>
                <SocialButtonGroup type={type} size={size} iconOnly={iconOnly === 'true'} />
              </div>
            );
          }}
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-center gap-2xl">
        <div className="flex items-center gap-xl">
          <SocialButton />
          <SocialButton iconOnly />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-xl">
          {socialButtonTypes.map((t) => (
            <div key={t} className="flex flex-col items-center gap-sm">
              <SocialButton type={t} provider="github" />
              <span className="type-code-sm-regular text-text-tertiary">Type={t}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    parts: [
      { name: 'Button', description: 'Button (2.1), Emphasis=secondary, same Size and Icon only. Height size/control/{size}; padding-x button/padding-x/{size}; gap button/gap/{size}. Fill width in layouts.', tokens: ['size/control/lg', 'button/padding-x/lg', 'button/gap/lg', 'radius/control'] },
      { name: 'Leading icon · Social mark', description: 'The provider’s mark from 1.8, centred, official proportions. size/icon/md at md, size/icon/lg at lg.', tokens: ['size/icon/md', 'size/icon/lg'] },
      { name: 'Text padding', description: 'Button’s optical wrapper: space/optical on both sides of the label, so Social buttons and Buttons line up.', tokens: ['space/optical'] },
      { name: 'Label', description: '“Sign in with {Provider}”, hidden when Icon only=true (then it is the accessible name). type/body/sm/semibold at md, type/body/md/semibold at lg.', tokens: ['type/body/sm/semibold', 'type/body/md/semibold'] },
      { name: 'Type=solid', description: 'Provider fill and label colour from social-button/{provider}/*; the same in every colour mode.', tokens: ['social-button/google/fill', 'social-button/google/fill/hover', 'social-button/google/fg'] },
      { name: 'Type=color · mono', description: 'Secondary Button surface; full-colour mark, or a single-colour mark in color/icon/secondary (color/icon/primary on hover).', tokens: ['color/surface/base', 'color/border/default', 'color/icon/secondary', 'color/icon/primary'] },
      { name: 'Social button group', description: 'Vertical stack of Fill-width buttons, or a horizontal row of icon-only buttons; gap space/lg; one Size and Type for all.', tokens: ['space/lg'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'md' | 'lg'", default: "'lg'", description: 'The Button’s md or lg: height, padding, label style and mark size.' },
    { name: 'provider', figma: 'Provider', type: `${socialProviders.map((p) => `'${p}'`).join(' | ')}`, default: `'${socialProviders[0]}'`, description: 'The third-party account; sets the mark, the name in the label and the solid colours.' },
    { name: 'type', figma: 'Type', type: "'solid' | 'color' | 'mono'", default: "'color'", description: 'Provider’s solid colours, neutral with the colour mark, or neutral with a single-colour mark.' },
    { name: 'iconOnly', figma: 'Icon only', type: 'boolean', default: 'false', description: 'Square button at the control height; the label becomes the accessible name.' },
    { name: 'verb', type: "'Sign in' | 'Sign up' | 'Continue'", default: "'Sign in'", description: 'Label: “{verb} with {Provider}”, following the content rule of the screen.' },
    { name: 'label', type: 'string', description: 'Overrides the whole label and the icon-only accessible name.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Fill the container (Fill width in layouts); content stays centred.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'Documentation only: pins a Figma State.' },
    { name: 'SocialButtonGroup · size / iconOnly / type', figma: 'Size · Icon only · Type', type: '—', default: "'lg' · false · 'color'", description: 'Applied to every button of the group.' },
    { name: 'SocialButtonGroup · providers', type: 'SocialProvider[]', default: 'first 3 (text), first 4 (icon only)', description: 'The buttons in the group, in order (exposed nested instances in Figma).' },
    { name: 'SocialButtonGroup · onProviderClick', type: '(provider) => void', description: 'Called with the provider whose button was pressed.' },
  ],
  tokens: [
    ...socialProviders.flatMap((p) => [`social-button/${p}/fill`, `social-button/${p}/fill/hover`, `social-button/${p}/fg`]),
    'color/surface/base', 'color/surface/base/hover', 'color/border/default', 'color/text/secondary', 'color/text/primary',
    'color/icon/secondary', 'color/icon/primary',
    'size/control/md', 'size/control/lg', 'button/padding-x/md', 'button/padding-x/lg', 'button/gap/md', 'button/gap/lg', 'space/optical',
    'size/icon/md', 'size/icon/lg', 'type/body/sm/semibold', 'type/body/md/semibold', 'radius/control', 'elevation/control',
    'space/lg', 'focus/default',
  ],
  guidelines: [
    {
      title: 'When to use',
      body: 'Social buttons are for signing in with another account, nothing else. Put them next to the normal form action, not instead of it.',
      render: signInCard,
    },
    {
      title: 'Three treatments',
      body: 'Pick one treatment per screen; follow each provider’s own brand rules. Solid uses the provider’s colours, color keeps a neutral button with the colour mark, mono is the quietest.',
      render: () => (
        <div className="flex flex-wrap justify-center gap-xl">
          {socialButtonTypes.map((t) => (
            <SocialButton key={t} type={t} provider="facebook" />
          ))}
        </div>
      ),
    },
    {
      title: 'Text or icon only',
      body: 'Use text buttons when there is room; icon-only rows only for well-known providers, with accessible names.',
      render: () => (
        <div className="flex flex-wrap items-start justify-center gap-4xl">
          <div className="w-[22.5rem]">
            <SocialButtonGroup />
          </div>
          <SocialButtonGroup iconOnly />
        </div>
      ),
    },
    {
      title: 'Alignment with other buttons',
      body: 'A Social button is a Button: the same height, padding and Text padding wrapper. A primary “Sign in” Button and a Social button of the same size share the height and the label position in one column.',
      render: () => (
        <div className="flex w-[22.5rem] flex-col gap-lg">
          <Button size="lg" fullWidth label="Sign in" />
          <SocialButton size="lg" fullWidth />
        </div>
      ),
    },
    {
      title: 'Content',
      body: '“Sign in with {Provider}” on sign-in screens, “Sign up with {Provider}” on sign-up, “Continue with {Provider}” when the same screen does both. Use the provider’s name exactly as they write it — GitHub, GitLab, X.',
      render: () => (
        <div className="flex w-[22.5rem] flex-col gap-lg">
          <SocialButton fullWidth verb="Sign in" provider="github" />
          <SocialButton fullWidth verb="Sign up" provider="github" />
          <SocialButton fullWidth verb="Continue" provider="github" />
        </div>
      ),
    },
    {
      title: 'Use the provider’s mark',
      body: 'Marks come from 1.8 Brand assets and keep their official proportions; they are never redrawn, recoloured (except the mono version) or rebuilt from text.',
      do: { caption: 'The provider’s mark from 1.8.', render: () => <SocialButton provider="google" /> },
      dont: { caption: 'A generic icon standing in for the mark.', render: () => <Button size="lg" emphasis="secondary" leadingIcon="maps/globe" label={`Sign in with ${socialProviderName.google}`} /> },
    },
    {
      title: 'One treatment per group',
      body: 'Every button in a group has the group’s Size and Type.',
      do: { caption: 'One treatment for the whole group.', render: () => <SocialButtonGroup iconOnly type="color" providers={['google', 'apple', 'github']} /> },
      dont: {
        caption: 'Solid and mono mixed in one row.',
        render: () => (
          <div className="flex gap-lg">
            <SocialButton iconOnly type="solid" provider="google" />
            <SocialButton iconOnly type="mono" provider="apple" />
            <SocialButton iconOnly type="color" provider="github" />
          </div>
        ),
      },
    },
    {
      title: 'Equal widths',
      body: 'Text Social buttons in a column fill the same width, with the content centred.',
      do: {
        caption: 'Fill width: every provider button is the same width.',
        render: () => (
          <div className="w-[20rem]">
            <SocialButtonGroup size="md" />
          </div>
        ),
      },
      dont: {
        caption: 'Widths follow the label length.',
        render: () => (
          <div className="flex flex-col items-start gap-lg">
            {(['google', 'apple', 'github'] as const).map((p) => (
              <SocialButton key={p} size="md" provider={p} />
            ))}
          </div>
        ),
      },
    },
    {
      title: 'Only for accounts',
      body: 'Don’t use a social button for actions other than signing in or linking an account.',
      dont: { caption: 'A Social button used to share a page.', render: () => <SocialButton provider="facebook" label="Share on Facebook" /> },
    },
    {
      title: 'Maintenance',
      body: 'Button shape, sizes and focus come from Button (2.1); marks come from 1.8 Brand assets (SocialMark); provider colours live in the social-button/* tokens. Change those, never a single Social button.',
    },
  ],
  accessibility: [
    'Icon-only buttons are named “Sign in with {Provider}” (or the verb you pass); the name is the full label, not just the provider.',
    'Inside a text button the mark is decorative (aria-hidden); the label names the action.',
    'Focus rings follow the Button: focus/default on every Type, solid included.',
    'Social button groups are a labelled group (“Sign in with another account”).',
    'Solid fills hold the providers’ official colours; their label colour is the provider’s own foreground and meets text contrast.',
  ],
});
