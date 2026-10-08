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
  spec: 'specs/parts/2.9-switch.md',
  exports: ['Switch'],
  summary: 'Switches turn a single setting on or off, and the change applies straight away. Use them in settings lists, table rows and compact headers.',
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
      caption: 'Each row controls one setting, and the change saves as soon as people flip it.',
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
      caption: 'Small switches fit dense table rows without making them taller.',
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
      caption: 'The slim switch keeps compact headers and toolbars light.',
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
    use: ['Turning a setting on or off when the change applies straight away.'],
    dont: ['For a choice submitted with a form, or one of many, use a Checkbox (2.7).', 'For more than two options, use a Radio (2.8).'],
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
      { name: 'Root (track)', target: 'track', description: 'The pill-shaped track the thumb slides along. In the slim type it has no fill and is as tall as the thumb. A native checkbox with role="switch" sits on top.', tokens: ['switch/width/md', 'switch/height/md', 'switch/inset', 'switch/slim-width/md', 'radius/full'] },
      { name: 'Track (slim)', target: 'rail', description: 'In the slim type, a thin rounded rail centered behind the thumb.', tokens: ['switch/slim-track/md'] },
      { name: 'Thumb', target: 'thumb', description: 'The round handle that slides from the start to the end when the switch turns on. In the slim type it has a border, which takes the brand color when on.', tokens: ['switch/thumb/md', 'switch/thumb/fill', 'elevation/raised'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'sm' | 'md'", default: "'md'", description: 'Sets the track width, height and thumb size.' },
    { name: 'type', figma: 'Type', type: "'default' | 'slim'", default: "'default'", description: 'Default puts the thumb inside a full track. Slim puts it over a thin rail.' },
    { name: 'checked', figma: 'Checked', type: 'boolean', description: 'The controlled value. Leave it out and use defaultChecked for an uncontrolled switch.' },
    { name: 'onCheckedChange', type: '(checked: boolean) => void', description: 'Called with the new value. Apply it straight away.' },
    { name: 'disabled', figma: 'State=disabled', type: 'boolean', default: 'false', description: 'Disables the native input.' },
    { name: 'name, aria-label …', type: 'InputHTMLAttributes', description: 'Passed to the native input.' },
    { name: 'forceState', type: "'hover' | 'focus'", description: 'For documentation only. Pins the hover or focus look.' },
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
      title: 'Switch or checkbox',
      body: 'Use a switch when the change applies straight away. Use a checkbox when it waits for a submit, or sits among other choices.',
      do: { caption: 'A settings row that saves straight away.', render: () => <SettingRow title="Email notifications" sub="Saved automatically."><Switch defaultChecked /></SettingRow> },
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
      title: 'From thumb to labeled field',
      body: 'The switch handles the on and off mechanics, and a Choice field (3.3) adds the label. The thumb is its own small part inside the switch.',
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
      title: 'On, off and other states',
      body: 'When on, the thumb sits at the end of a brand-colored track. When off, it sits at the start of a neutral track. Both have hover, focus and disabled states.',
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
      title: 'Default or slim',
      body: 'Use the default switch in settings lists and forms. Use slim in compact headers and toolbars, where a full track feels heavy. Keep one type within a list so the rows line up.',
      do: { caption: 'One type throughout the list.', render: () => <div className="flex flex-col gap-md"><Switch defaultChecked aria-label="A" /><Switch aria-label="B" /></div> },
      dont: { caption: 'Default and slim mixed in one list.', render: () => <div className="flex flex-col gap-md"><Switch defaultChecked aria-label="A" /><Switch type="slim" aria-label="B" /></div> },
    },
    {
      title: 'Name the setting, not the action',
      body: 'Write labels that name the setting, like “Email notifications” rather than “Turn on email notifications”. In settings rows, put the label on the left and the switch on the right.\n\nAvoid negative labels. “Disable sync” switched on is hard to read at a glance.',
      do: { caption: '“Sync”: on means it’s syncing.', render: () => <label className="flex items-center gap-md"><span className="type-body-sm-regular text-text-primary">Sync</span><Switch defaultChecked /></label> },
      dont: { caption: '“Disable sync”: on means sync is off.', render: () => <label className="flex items-center gap-md"><span className="type-body-sm-regular text-text-primary">Disable sync</span><Switch defaultChecked /></label> },
    },
    {
      title: 'Maintenance',
      body: 'To update every switch, including those inside a Choice field (3.3), edit .Main/Switch thumb for the thumb and the token map for colors. The off track’s color (color/fill/neutral/track) has no hover variant, so its hover uses the component token switch/track/off-hover.',
    },
  ],
  accessibility: [
    'It’s a native checkbox with role="switch", so screen readers announce it as a switch that’s “on” or “off”. Space toggles it.',
    'The focus ring (focus/default) is always visible around the track, or around the whole control for slim.',
    'The thumb’s position shows on or off, so the state doesn’t rely on color alone. The off track meets 3:1 non-text contrast.',
    'On touch screens, an invisible hit area brings the switch up to size/touch-min. In settings rows, the whole row is the target.',
  ],
});
