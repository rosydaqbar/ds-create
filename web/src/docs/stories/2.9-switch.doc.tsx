import { type ReactNode } from 'react';
import { Switch } from '@/components/parts/Switch';
import { Icon } from '@/icons';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';

const SIZES = ['sm', 'md'] as const;
const TYPES = ['default', 'slim'] as const;
const STATES = ['rest', 'hover', 'focus', 'disabled'] as const;
const ROWS = TYPES.flatMap((t) => SIZES.flatMap((s) => (['false', 'true'] as const).map((c) => `${t} · ${s} · ${c}`)));

const SettingRow = ({ title, sub, children }: { title: string; sub: string; children: ReactNode }) => (
  <label className="flex cursor-pointer items-center justify-between gap-xl py-md">
    <span className="flex flex-col gap-xxs">
      <span className="type-body-md-medium text-text-primary">{title}</span>
      <span className="type-body-sm-regular text-text-tertiary">{sub}</span>
    </span>
    {children}
  </label>
);

export default defineDoc({
  id: '2.9',
  name: 'Switch',
  level: 'parts',
  spec: 'parts/2.9-switch.md',
  exports: ['Switch'],
  summary: 'On/off control for settings that apply immediately. Two sizes, default and slim constructions, on and off, four states. The thumb moves; the track never changes component.',
  hero: () => <Switch size="md" type="default" defaultChecked aria-label="Example switch" />,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: SIZES }, default: 'md' },
      { name: 'type', figma: 'Type', control: { type: 'select', options: TYPES }, default: 'default' },
      { name: 'checked', figma: 'Checked', control: { type: 'boolean' }, default: true },
      { name: 'disabled', figma: 'State=disabled', control: { type: 'boolean' }, default: false },
    ],
    render: (a) => <Switch {...(a as any)} aria-label="Example" />,
    code: (a) => `<Switch${jsxProps(a, { size: 'md', type: 'default', disabled: false })} onCheckedChange={setChecked} aria-label="Email notifications" />`,
  },
  examples: [
    {
      title: 'Settings list',
      caption: 'Each row changes one setting immediately.',
      render: () => (
        <div className="flex w-full max-w-[28rem] flex-col divide-y divide-border-subtle">
          <SettingRow title="Email notifications" sub="Replies and mentions."><Switch defaultChecked /></SettingRow>
          <SettingRow title="Push notifications" sub="On this device only."><Switch /></SettingRow>
          <SettingRow title="Weekly digest" sub="A summary every Monday."><Switch defaultChecked /></SettingRow>
        </div>
      ),
      code: `<label className="flex items-center justify-between">
  <span>Email notifications</span>
  <Switch defaultChecked onCheckedChange={(on) => save({ email: on })} />
</label>`,
    },
    {
      title: 'Table column',
      caption: 'Small switches fit dense rows.',
      render: () => (
        <div className="w-full max-w-[26rem] overflow-hidden rounded-surface border border-border-subtle bg-surface-base">
          <div className="type-body-xs-semibold flex justify-between border-b border-border-subtle bg-surface-sunken px-lg py-sm text-text-tertiary">
            <span>Integration</span>
            <span>Enabled</span>
          </div>
          {[
            { n: 'Calendar sync', i: 'time/calendar', on: true },
            { n: 'Cloud storage', i: 'general/cloud', on: false },
            { n: 'Webhooks', i: 'general/plug', on: true },
          ].map((r) => (
            <div key={r.n} className="flex items-center justify-between border-b border-border-subtle px-lg py-md last:border-b-0">
              <span className="flex items-center gap-md">
                <Icon name={r.i as any} className="text-icon-tertiary" />
                <span className="type-body-sm-medium text-text-primary">{r.n}</span>
              </span>
              <Switch size="sm" defaultChecked={r.on} aria-label={`${r.n} enabled`} />
            </div>
          ))}
        </div>
      ),
      code: `<Switch size="sm" defaultChecked aria-label="Calendar sync enabled" />`,
    },
    {
      title: 'Slim in a card header',
      caption: 'Slim switches suit compact headers and toolbars.',
      render: () => (
        <div className="flex w-full max-w-[22rem] flex-col gap-md rounded-surface border border-border-subtle bg-surface-raised p-xl">
          <label className="flex cursor-pointer items-center justify-between">
            <span className="type-body-md-semibold text-text-primary">Auto-renew</span>
            <Switch type="slim" defaultChecked />
          </label>
          <span className="type-body-sm-regular text-text-tertiary">Your plan renews on 1 March for another year.</span>
        </div>
      ),
      code: `<label className="flex items-center justify-between">
  <span>Auto-renew</span>
  <Switch type="slim" defaultChecked />
</label>`,
    },
  ],
  whenToUse: {
    use: ['Immediate binary settings: on/off, enabled/disabled.'],
    dont: ['A choice submitted with a form, or one of many — use Checkbox (2.7).', 'More than two options — use Radio (2.8).'],
  },
  matrices: [
    {
      title: 'Switch',
      rows: 'Type × Size × Checked',
      columns: 'State',
      render: () => (
        <Matrix
          rowProp="Type · Size · Checked"
          rows={ROWS}
          colProp="State"
          cols={STATES}
          cell={(row, state) => {
            const [t, s, c] = row.split(' · ') as [(typeof TYPES)[number], (typeof SIZES)[number], string];
            return <Switch type={t} size={s} checked={c === 'true'} forceState={state === 'hover' || state === 'focus' ? state : undefined} disabled={state === 'disabled'} aria-label={row} />;
          }}
        />
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex scale-[2] items-center gap-2xl">
        <Switch checked aria-label="Default" />
        <Switch type="slim" checked aria-label="Slim" />
      </div>
    ),
    parts: [
      { name: 'Root (track)', description: 'Default: switch/width/{size} × switch/height/{size}, padding switch/inset, radius/full, track tokens. Slim: switch/slim-width/{size} × thumb height, no fill. A native checkbox with role="switch" covers it.', tokens: ['switch/width/md', 'switch/height/md', 'switch/inset', 'switch/slim-width/md', 'radius/full'] },
      { name: 'Track (slim)', description: 'A centred rail, height switch/slim-track/{size}, radius/full, track tokens.', tokens: ['switch/slim-track/md'] },
      { name: 'Thumb', description: '.Main/Switch thumb: switch/thumb/{size}, switch/thumb/fill, elevation/raised. Slim adds border/width/default in color/border/default (on: color/fill/brand/solid). Moves from start to end when checked.', tokens: ['switch/thumb/md', 'switch/thumb/fill', 'elevation/raised'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'Width, height and thumb.' },
    { name: 'type', figma: 'Type', type: "'default' | 'slim'", default: "'default'", description: 'Thumb inside a full track, or over a thin rail.' },
    { name: 'checked', figma: 'Checked', type: 'boolean', description: 'Controlled value. Omit and use defaultChecked for uncontrolled.' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'New value; apply it immediately.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Native disabled input.' },
    { name: 'name, aria-label …', type: 'InputHTMLAttributes', description: 'Native input attributes.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'Documentation only: pins a pseudo-state.' },
  ],
  tokens: [
    'color/fill/neutral/track', 'switch/track/off-hover', 'color/fill/brand/solid', 'color/fill/brand/solid/hover', 'color/fill/neutral/subtle/disabled',
    'switch/thumb/fill', 'color/border/default', 'color/border/disabled', 'elevation/raised',
    'switch/width/sm', 'switch/width/md', 'switch/height/sm', 'switch/height/md', 'switch/inset', 'switch/thumb/sm', 'switch/thumb/md',
    'switch/slim-width/sm', 'switch/slim-width/md', 'switch/slim-track/sm', 'switch/slim-track/md',
    'radius/full', 'border/width/default', 'size/touch-min', 'focus/default',
  ],
  guidelines: [
    {
      title: 'Switch or Checkbox',
      body: 'Switch when the change applies immediately; Checkbox when it waits for a submit or sits among other choices.',
      do: { caption: 'Settings page: saves immediately.', render: () => <SettingRow title="Email notifications" sub="Saved automatically."><Switch defaultChecked /></SettingRow> },
      dont: {
        caption: 'A switch in a form that needs a submit button.',
        render: () => (
          <div className="flex flex-col gap-md">
            <label className="flex items-center gap-md"><Switch size="sm" /><span className="type-body-sm-regular text-text-primary">Send me product news</span></label>
            <span className="type-body-sm-semibold self-start rounded-control bg-fill-brand-solid px-lg py-xs text-text-on-solid">Create account</span>
          </div>
        ),
      },
    },
    {
      title: 'Anatomy: thumb part → Switch → Choice field',
      body: 'The Part owns the mechanics; the field owns the label. .Main/Switch thumb sits inside Switch, which 3.3 Choice field labels.',
      render: () => (
        <div className="flex items-center gap-xl">
          <span className="size-(--switch-thumb-md) rounded-full bg-switch-thumb-fill shadow-raised" />
          <Icon name="arrows/arrow-right" className="text-icon-tertiary" />
          <Switch checked aria-label="Switch" />
          <Icon name="arrows/arrow-right" className="text-icon-tertiary" />
          <label className="flex items-center gap-md"><Switch defaultChecked /><span className="type-body-md-medium text-text-primary">Email notifications</span></label>
        </div>
      ),
    },
    {
      title: 'On, off and states',
      body: 'On is the thumb at the end and the brand track; off is the thumb at the start and the neutral track. Hover, focus and disabled exist for both.',
      render: () => (
        <div className="flex flex-col gap-md">
          {[false, true].map((c) => (
            <div key={String(c)} className="flex items-center gap-xl">
              {STATES.map((s) => <Switch key={s} checked={c} forceState={s === 'hover' || s === 'focus' ? s : undefined} disabled={s === 'disabled'} aria-label={s} />)}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Default vs slim',
      body: 'Default for settings lists and forms. Slim for compact headers and toolbars where a full track feels heavy. Never mix the two in one list.',
      do: { caption: 'One construction per list.', render: () => <div className="flex flex-col gap-md"><Switch defaultChecked aria-label="A" /><Switch aria-label="B" /></div> },
      dont: { caption: 'Default and slim mixed in one list.', render: () => <div className="flex flex-col gap-md"><Switch defaultChecked aria-label="A" /><Switch type="slim" aria-label="B" /></div> },
    },
    {
      title: 'Labels',
      body: 'Labels describe the setting, not the action: “Email notifications”, not “Turn on email notifications”. In settings rows the label sits on the left and the switch on the right. Avoid labels that are ambiguous when on (“Disable sync” on = ?).',
      do: { caption: '“Sync” — on means syncing.', render: () => <label className="flex items-center gap-md"><span className="type-body-sm-regular text-text-primary">Sync</span><Switch defaultChecked /></label> },
      dont: { caption: '“Disable sync” — on means off.', render: () => <label className="flex items-center gap-md"><span className="type-body-sm-regular text-text-primary">Disable sync</span><Switch defaultChecked /></label> },
    },
    {
      title: 'Maintenance',
      body: 'Change .Main/Switch thumb for the thumb and the tokens in the token map for colours to update every switch, including those inside 3.3 Choice field. color/fill/neutral/track has no hover child, so the off-hover track is the component token switch/track/off-hover.',
    },
  ],
  accessibility: [
    'A native checkbox with role="switch": announced as a switch with “on” or “off”; Space toggles it.',
    'Focus ring (focus/default) around the track (around the root for slim) is always visible.',
    'On/off is shown by thumb position, not colour alone; the off track meets non-text contrast (3:1).',
    'The switch reaches size/touch-min on touch platforms through an invisible hit area; in settings rows the whole row is the target.',
  ],
});
