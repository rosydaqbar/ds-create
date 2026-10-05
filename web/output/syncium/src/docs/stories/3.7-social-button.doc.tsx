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
    'Social buttons let people sign in or sign up with an account they already have, like Google or GitHub. Pick the treatment that suits the screen; the provider’s mark always keeps its official proportions.',
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
      caption: 'Place social buttons below the form, after an “or” divider, at the same size as the main action.',
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
      caption: 'When space is tight, an icon-only row works for providers people recognize on sight.',
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
      caption: 'Mono buttons keep a list of linked accounts quiet, so each status stands out.',
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
      'For any other action, such as sharing or following, use a Button (2.1).',
      'For app downloads, use the app store badges from 1.8 Brand assets.',
      'If a provider is unavailable, remove its button. Social buttons have no disabled state.',
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
              <SocialButton type={t} provider="github" data-anatomy={`type-${t}`} />
              <span className="type-code-sm-regular text-text-tertiary">Type={t}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-sm">
          <SocialButtonGroup iconOnly />
          <span className="type-code-sm-regular text-text-tertiary">Social button group · Icon only</span>
        </div>
      </div>
    ),
    parts: [
      { name: 'Button', target: 'button', description: 'A secondary Button (2.1) underneath, so it shares the Button’s sizes and icon-only form. In layouts it usually fills the width.', tokens: ['size/control/lg', 'button/padding-x/lg', 'button/gap/lg', 'radius/control'] },
      { name: 'Leading icon · Social mark', target: 'leading-icon', description: 'The provider’s mark from 1.8 Brand assets, centered and at its official proportions. It grows with the button size.', tokens: ['size/icon/md', 'size/icon/lg'] },
      { name: 'Text padding', target: 'text-padding', description: 'A little optical padding on both sides of the label, the same as in a Button, so social buttons and buttons line up.', tokens: ['space/optical'] },
      { name: 'Label', target: 'label', description: '“Sign in with {Provider}”. On icon-only buttons it’s hidden, but screen readers still announce it. The larger size uses a larger text style.', tokens: ['type/body/sm/semibold', 'type/body/md/semibold'] },
      { name: 'Type=solid', target: 'type-solid', description: 'The provider’s own fill and label colors, the same in Light and Dark.', tokens: ['social-button/google/fill', 'social-button/google/fill/hover', 'social-button/google/fg'] },
      { name: 'Type=color · mono', target: 'type-color', description: 'The neutral secondary button surface, with the full-color mark or a single-color mark that gets stronger on hover.', tokens: ['color/surface/base', 'color/border/default', 'color/icon/secondary', 'color/icon/primary'] },
      { name: 'Social button group', target: 'social-button-group', description: 'A stack of full-width buttons, or a row of icon-only ones. Every button in the group shares one size and type.', tokens: ['space/lg'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'md' | 'lg'", default: "'lg'", description: 'Matches the Button’s md or lg: height, padding, label style and mark size.' },
    { name: 'provider', figma: 'Provider', type: `${socialProviders.map((p) => `'${p}'`).join(' | ')}`, default: `'${socialProviders[0]}'`, description: 'The third-party account. Sets the mark, the name in the label and the solid colors.' },
    { name: 'type', figma: 'Type', type: "'solid' | 'color' | 'mono'", default: "'color'", description: 'solid uses the provider’s colors, color is neutral with the full-color mark, and mono is neutral with a single-color mark.' },
    { name: 'iconOnly', figma: 'Icon only', type: 'boolean', default: 'false', description: 'A square button at the control height. The label becomes the accessible name.' },
    { name: 'verb', type: "'Sign in' | 'Sign up' | 'Continue'", default: "'Sign in'", description: 'Builds the label “{verb} with {Provider}”. Pick the verb that fits the screen.' },
    { name: 'label', type: 'string', description: 'Replaces the whole label, and the accessible name when icon-only.' },
    { name: 'fullWidth', type: 'boolean', default: 'false', description: 'Fills the container (Fill width in layouts). The content stays centered.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'Documentation only: pins a Figma State.' },
    { name: 'SocialButtonGroup · size / iconOnly / type', figma: 'Size · Icon only · Type', type: '—', default: "'lg' · false · 'color'", description: 'Applied to every button in the group.' },
    { name: 'SocialButtonGroup · providers', type: 'SocialProvider[]', default: 'first 3 (text), first 4 (icon only)', description: 'The buttons in the group, in order. In Figma, these are exposed nested instances.' },
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
      title: 'Use them for sign-in',
      body: 'Use social buttons only for signing in with another account. Place them alongside the regular form, not instead of it, so people without those accounts can still sign in.',
      render: signInCard,
    },
    {
      title: 'Three treatments',
      body: 'Solid uses the provider’s own colors, color puts the full-color mark on a neutral button, and mono is the quietest. Pick one per screen and follow each provider’s brand rules.',
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
      body: 'Use text buttons when there’s room. Save icon-only rows for providers people recognize on sight, and give each button a name screen readers can announce.',
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
      title: 'Line up with other buttons',
      body: 'A social button is built on the Button, with the same height, padding and label spacing. Stack a primary “Sign in” button and a social button of the same size, and their heights and labels line up.',
      render: () => (
        <div className="flex w-[22.5rem] flex-col gap-lg">
          <Button size="lg" fullWidth label="Sign in" />
          <SocialButton size="lg" fullWidth />
        </div>
      ),
    },
    {
      title: 'Content',
      body: 'Use “Sign in with {Provider}” on sign-in screens, “Sign up with {Provider}” on sign-up screens, and “Continue with {Provider}” when one screen does both. Write the provider’s name exactly as they do: GitHub, GitLab, X.',
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
      body: 'Take marks from 1.8 Brand assets and keep their official proportions. Don’t redraw them, recolor them (apart from the mono version) or rebuild them from text, because providers’ brand rules don’t allow it.',
      do: { caption: 'The provider’s mark from 1.8 Brand assets.', render: () => <SocialButton provider="google" /> },
      dont: { caption: 'A generic icon standing in for the mark.', render: () => <Button size="lg" emphasis="secondary" leadingIcon="maps/globe" label={`Sign in with ${socialProviderName.google}`} /> },
    },
    {
      title: 'One treatment per group',
      body: 'Give every button in a group the same size and treatment, so no provider looks more important than the others.',
      do: { caption: 'One treatment for the whole group.', render: () => <SocialButtonGroup iconOnly type="color" providers={['google', 'apple', 'github']} /> },
      dont: {
        caption: 'Solid, mono and color mixed in one row.',
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
      body: 'In a column, make text buttons the same width, with their content centered.',
      do: {
        caption: 'Every provider button is the same width.',
        render: () => (
          <div className="w-[20rem]">
            <SocialButtonGroup size="md" />
          </div>
        ),
      },
      dont: {
        caption: 'Widths that follow the label length.',
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
      body: 'Keep social buttons for signing in and linking accounts. For sharing or following, use a Button (2.1).',
      dont: { caption: 'A social button used to share a page.', render: () => <SocialButton provider="facebook" label="Share on Facebook" /> },
    },
    {
      title: 'Maintenance',
      body: 'The shape, sizes and focus ring come from the Button (2.1), the marks from 1.8 Brand assets (SocialMark), and the provider colors from the social-button/* tokens. Make changes there rather than on a single social button, so they all stay in sync.',
    },
  ],
  accessibility: [
    'Screen readers announce icon-only buttons by their full label, like “Sign in with Google”, not just the provider name. The verb follows the one you pass.',
    'In a text button the mark is decorative (aria-hidden), and the label names the action.',
    'The focus ring is the Button’s (focus/default), on every type including solid.',
    'A social button group is announced as one labeled group, “Sign in with another account”.',
    'Solid buttons use each provider’s official colors, and their labels meet the 4.5:1 text contrast. GitLab gets there with GitLab charcoal text. Facebook is a documented exception at 4.23:1, because Facebook’s brand rules set its blue and white.',
  ],
});
