import { AvatarGroup, AvatarLabel, type AvatarGroupSize, type AvatarLabelSize, type AvatarPerson } from '@/components/components/AvatarGroup';
import { AvatarGroupAddButton } from '@/components/components/_AvatarGroupParts';
import { Avatar } from '@/components/parts/Avatar';
import { Badge } from '@/components/parts/Badge';
import { Button } from '@/components/parts/Button';
import { Divider } from '@/components/parts/Divider';
import { defineDoc } from '../types';
import { jsxProps, Matrix } from '../blocks';
import { DemoCard } from './_demo';

const GROUP_SIZES = ['xs', 'sm', 'md'] as const;
const LABEL_SIZES = ['sm', 'md', 'lg'] as const;
const ADD_STATES = ['rest', 'hover', 'focus', 'disabled'] as const;

/** The template has no photos: every avatar shows initials (pass `src` for photos). */
const team: AvatarPerson[] = [
  { name: 'Olivia Rhye' },
  { name: 'Phoenix Baker' },
  { name: 'Lana Steiner' },
  { name: 'Demi Wilkinson' },
  { name: 'Candice Wu' },
  { name: 'Natali Craig' },
  { name: 'Drew Cano' },
  { name: 'Orlando Diggs' },
  { name: 'Andi Lane' },
  { name: 'Kate Morrison' },
  { name: 'Koray Okumus' },
  { name: 'Ava Wright' },
];
const people = (n: number) => team.slice(0, n);
const emails = ['olivia@example.com', 'phoenix@example.com', 'lana@example.com', 'demi@example.com'];

const teamList = (size: AvatarLabelSize = 'md', withEmail = true) => (
  <div className="flex w-[20rem] flex-col gap-md">
    {team.slice(0, 4).map((p, i) => (
      <div key={p.name} className="flex flex-col gap-md">
        {i > 0 && <Divider />}
        <AvatarLabel size={size} text={p.name} supportingText={withEmail ? emails[i] : 'Product designer'} avatar={{ src: p.src }} />
      </div>
    ))}
  </div>
);

export default defineDoc({
  id: '3.4',
  name: 'Avatar group',
  level: 'components',
  spec: 'specs/components/3.4-avatar-group.md',
  exports: ['AvatarGroup', 'AvatarLabel'],
  summary:
    'Avatar groups show who’s involved at a glance, without listing every name. An avatar label pairs one avatar with a name and a supporting line, wherever a person is named.',
  hero: () => <AvatarGroup size="sm" people={people(5)} count="+5" />,
  playground: {
    controls: [
      { name: 'size', figma: 'Size', control: { type: 'select', options: GROUP_SIZES }, default: 'sm' },
      { name: 'count', figma: 'Count', control: { type: 'text' }, default: '+5' },
      { name: 'showCount', figma: 'Show count', control: { type: 'boolean' }, default: true },
      { name: 'showAddButton', figma: 'Show add button', control: { type: 'boolean' }, default: true },
    ],
    render: (a) => <AvatarGroup {...a} people={people(5)} />,
    code: (a) => `<AvatarGroup${jsxProps(a, { size: 'sm', count: '', showCount: true, showAddButton: true })} people={people} onAddClick={invite} />`,
  },
  examples: [
    {
      title: 'Project card header',
      caption: 'A small group shows who works on the project, and the count keeps the header compact.',
      render: () => (
        <DemoCard className="w-[22rem]">
          <div className="flex items-start justify-between gap-lg">
            <div className="flex flex-col gap-xxs">
              <span className="type-body-md-semibold text-text-primary">Website relaunch</span>
              <span className="type-body-sm-regular text-text-tertiary">Updated 2 hours ago</span>
            </div>
            <Badge tone="success" label="Active" />
          </div>
          <AvatarGroup size="xs" people={people(8)} showAddButton={false} />
        </DemoCard>
      ),
      code: `<div className="flex items-start justify-between">
  <h3>Website relaunch</h3>
  <Badge tone="success" label="Active" />
</div>
<AvatarGroup size="xs" people={members} showAddButton={false} />`,
    },
    {
      title: 'Document share bar',
      caption: 'The group shows who already has access, and the add button and Share let people invite more.',
      render: () => (
        <div className="flex items-center gap-lg">
          <AvatarGroup size="sm" people={people(10)} />
          <Button label="Share" />
        </div>
      ),
      code: `<div className="flex items-center gap-lg">
  <AvatarGroup size="sm" people={collaborators} onAddClick={openInvite} />
  <Button label="Share" />
</div>`,
    },
    {
      title: 'Team list',
      caption: 'When people need to see exactly who’s on the team, list them with avatar labels.',
      render: () => teamList(),
      code: `{members.map((m, i) => (
  <Fragment key={m.id}>
    {i > 0 && <Divider />}
    <AvatarLabel size="md" text={m.name} supportingText={m.email} avatar={{ src: m.photo }} />
  </Fragment>
))}`,
    },
  ],
  whenToUse: {
    use: [
      'Showing who’s on a project, document or call, when how many matters more than who.',
      'Avatar labels wherever a person is named, like lists, menus, table cells and headers.',
    ],
    dont: [
      'For one person on their own, use an Avatar (2.6).',
      'When every person needs to be identified, list them with avatar labels.',
      'For picking people, use a Select (3.5) with avatars, or a Multi-select.',
    ],
  },
  matrices: [
    {
      title: 'Avatar group',
      rows: 'Configuration',
      columns: 'Size',
      render: () => (
        <Matrix
          rowProp="Config"
          rows={['default', 'Show count=false', 'Show add button=false'] as const}
          colProp="Size"
          cols={GROUP_SIZES}
          cell={(row, size: AvatarGroupSize) => (
            <AvatarGroup size={size} people={people(5)} count="+5" showCount={row !== 'Show count=false'} showAddButton={row !== 'Show add button=false'} />
          )}
        />
      ),
    },
    {
      title: 'Avatar label',
      rows: 'Show supporting text',
      columns: 'Size',
      render: () => (
        <Matrix
          rowProp="Show supporting text"
          rows={['true', 'false'] as const}
          colProp="Size"
          cols={LABEL_SIZES}
          cell={(row, size) => (
            <div className="w-[15rem]">
              <AvatarLabel size={size} text="Olivia Rhye" supportingText={row === 'true' ? 'olivia@example.com' : undefined} />
            </div>
          )}
        />
      ),
    },
  ],
  privateParts: [
    {
      title: '.Main/Avatar group add button',
      rows: 'Size',
      columns: 'State',
      render: () => (
        <div className="flex min-w-0 flex-col gap-md">
          <p className="type-body-sm-regular text-text-secondary">The add button at the end of an avatar group. Changes here apply to every group.</p>
          <Matrix
            rowProp="Size"
            rows={GROUP_SIZES}
            colProp="State"
            cols={ADD_STATES}
            cell={(size, state) => (
              <AvatarGroupAddButton
                size={size}
                showTooltip={false}
                disabled={state === 'disabled'}
                forceState={state === 'hover' || state === 'focus' ? state : undefined}
              />
            )}
          />
        </div>
      ),
    },
  ],
  anatomy: {
    render: () => (
      <div className="flex flex-col items-center gap-3xl">
        <div className="scale-150">
          <AvatarGroup size="md" people={people(5)} count="+5" />
        </div>
        <div className="w-[18rem]">
          <AvatarLabel size="lg" text="Olivia Rhye" supportingText="olivia@example.com" />
        </div>
      </div>
    ),
    parts: [
      { name: 'Avatar group', target: 'avatar-group', description: 'Holds the stack and the add button side by side, with a normal gap between them. It takes only the space it needs.', tokens: ['space/md'] },
      { name: 'Avatars', target: 'avatars', description: 'The overlapping stack. Each size has its own overlap, and earlier avatars sit on top, so the first person is fully visible.', tokens: ['avatar-group/overlap/xs', 'avatar-group/overlap/sm', 'avatar-group/overlap/md'] },
      { name: 'Avatar', target: 'avatar', description: 'An Avatar (2.6) at the group’s size, with its ring on. The ring keeps the circles separate on any background.', tokens: ['size/avatar/sm', 'color/surface/base', 'border/width/strong'] },
      { name: 'Count', target: 'count', description: 'An initials Avatar (2.6) that shows the count (“+5”), with the same size and ring as its neighbors. Hovering it shows the hidden names in a tooltip.' },
      { name: 'Add button', target: 'add-button', description: 'A dashed circle the size of the avatars, placed after the stack with a normal gap. It never overlaps an avatar.', tokens: ['color/border/default', 'color/icon/tertiary'] },
      { name: 'Avatar label', target: 'avatar-label', description: 'An avatar next to a stack of text. The avatar keeps its size, while the text fills the rest and truncates. Large labels get a bigger gap.', tokens: ['space/md', 'space/lg'] },
      { name: 'Text / supporting text', target: 'text-stack', description: 'The name in semibold, with a lighter supporting line right below it and no extra space between them.', tokens: ['type/body/sm/semibold', 'type/body/sm/regular', 'color/text/primary', 'color/text/tertiary'] },
    ],
  },
  props: [
    { name: 'size', figma: 'Size', type: "'xs' | 'sm' | 'md'", default: "'sm'", description: 'AvatarGroup: the avatar size, overlap and add button size.' },
    { name: 'people', type: 'AvatarPerson[]', description: 'AvatarGroup: the people ({ name, src?, initials? }), exposed as nested Avatars in Figma. The first five are shown.' },
    { name: 'count', figma: 'Count', type: 'string', default: '"+{hidden}"', description: 'AvatarGroup: the count text. Defaults to the number of people beyond five.' },
    { name: 'showCount', figma: 'Show count', type: 'boolean', default: 'true', description: 'AvatarGroup: shows the +N count.' },
    { name: 'showAddButton', figma: 'Show add button', type: 'boolean', default: 'true', description: 'AvatarGroup: shows the add button after the stack.' },
    { name: 'onAddClick / addLabel', type: '() => void · string', default: "— · 'Add people'", description: 'AvatarGroup: the add button’s action, plus its accessible name and tooltip text.' },
    { name: 'onCountClick', type: '() => void', description: 'AvatarGroup: turns the count into a button that opens the full list.' },
    { name: 'total', type: 'number', description: 'AvatarGroup: the real number of people, when people holds only the first few.' },
    { name: 'AvatarLabel · size', figma: 'Size', type: "'sm' | 'md' | 'lg'", default: "'md'", description: 'AvatarLabel: the avatar size (32 / 40 / 48) and text styles.' },
    { name: 'AvatarLabel · text', figma: 'Text', type: 'ReactNode', default: "'Olivia Rhye'", description: 'AvatarLabel: the person’s name. Long names truncate.' },
    { name: 'AvatarLabel · supportingText', figma: 'Show supporting text + Supporting text', type: 'ReactNode', description: 'AvatarLabel: an email or role. It shows whenever it’s set.' },
    { name: 'AvatarLabel · avatar', type: '{ src?, initials? }', description: 'AvatarLabel: the photo, or initials (taken from the name by default).' },
  ],
  tokens: [
    'avatar-group/overlap/xs', 'avatar-group/overlap/sm', 'avatar-group/overlap/md',
    'size/avatar/xs', 'size/avatar/sm', 'size/avatar/md', 'size/avatar/lg',
    'color/surface/base', 'border/width/strong', 'space/md', 'space/lg',
    'color/text/primary', 'color/text/tertiary', 'type/body/sm/semibold', 'type/body/sm/regular', 'type/body/md/semibold', 'type/body/md/regular',
    'color/border/default', 'color/border/strong', 'color/border/disabled', 'color/fill/none', 'color/fill/neutral/subtle/hover',
    'color/icon/tertiary', 'color/icon/secondary', 'color/icon/disabled', 'border/width/default', 'focus/default',
  ],
  guidelines: [
    {
      title: 'Group or list',
      body: 'Use a group when how many people matters more than who they are. When people need to be identified, list their names.',
      render: () => (
        <div className="flex flex-wrap items-center justify-center gap-4xl">
          <AvatarGroup size="md" people={people(5)} showCount={false} showAddButton={false} />
          {teamList('sm')}
        </div>
      ),
    },
    {
      title: 'Overlap',
      body: 'The stack overlaps avatars with a negative gap instead of placing each one by hand, so adding or removing a person keeps it even. The ring keeps each circle distinct.',
      do: { caption: 'Even overlap, with the ring on.', render: () => <AvatarGroup size="md" people={people(4)} showCount={false} showAddButton={false} /> },
      dont: {
        caption: 'Gaps between avatars make them read as a list, not a group.',
        render: () => (
          <div className="flex gap-md">
            {people(4).map((p) => (
              <Avatar key={p.name} size="md" type="initials" initials={p.name.split(' ').map((w) => w[0]).join('')} alt={p.name} />
            ))}
          </div>
        ),
      },
    },
    {
      title: 'Use a count for the rest',
      body: 'Show up to five avatars, then a count for everyone else. The count takes the same space as an avatar, so the group stays compact.',
      render: () => (
        <div className="flex flex-col items-start gap-xl">
          <AvatarGroup size="sm" people={people(3)} showAddButton={false} />
          <AvatarGroup size="sm" people={people(5)} showAddButton={false} />
          <AvatarGroup size="sm" people={people(12)} showAddButton={false} />
        </div>
      ),
    },
    {
      title: 'Keep the add button separate',
      body: 'Place the add button after the stack with a normal gap, so it never overlaps an avatar and reads as an action, not a person.',
      do: { caption: 'The add button sits after the stack, with a gap.', render: () => <AvatarGroup size="md" people={people(5)} /> },
      dont: {
        caption: 'The add button overlaps the stack.',
        render: () => (
          <div className="flex items-center [&>*+*]:ms-(--avatar-group-overlap-md)">
            <AvatarGroup size="md" people={people(4)} showCount={false} showAddButton={false} />
            <AvatarGroupAddButton size="md" showTooltip={false} />
          </div>
        ),
      },
    },
    {
      title: 'Avatar label content',
      body: 'Show the person’s name, and use the supporting line for the most useful second fact: an email in admin lists, a role on team pages. Long names truncate, and the avatar never shrinks.',
      render: () => (
        <div className="flex w-[14rem] flex-col gap-lg">
          <AvatarLabel text="Olivia Rhye" supportingText="olivia@example.com" />
          <AvatarLabel text="Phoenix Baker" supportingText="Engineering manager" />
          <AvatarLabel text="Alexandra Montgomery-Fitzgerald" supportingText="alexandra.montgomery@example.com" />
        </div>
      ),
    },
    {
      title: 'Use one size per stack',
      body: 'Every avatar in a group uses the group’s size, so the stack reads as one unit.',
      do: { caption: 'One size for the whole stack.', render: () => <AvatarGroup size="sm" people={people(5)} showAddButton={false} /> },
      dont: {
        caption: 'Mixed sizes in one stack.',
        render: () => (
          <div className="flex items-center [&>*+*]:ms-(--avatar-group-overlap-sm)">
            <Avatar size="md" type="initials" initials="OR" showRing alt="Olivia Rhye" />
            <Avatar size="xs" type="initials" initials="PB" showRing alt="Phoenix Baker" />
            <Avatar size="lg" type="initials" initials="LS" showRing alt="Lana Steiner" />
            <Avatar size="sm" type="initials" initials="DW" showRing alt="Demi Wilkinson" />
          </div>
        ),
      },
    },
    {
      title: 'Truncate long names',
      body: 'Long names truncate to fit the space, and the avatar keeps its size.',
      do: {
        caption: 'The name truncates with an ellipsis.',
        render: () => (
          <div className="w-[11rem]">
            <AvatarLabel text="Alexandra Montgomery-Fitzgerald" supportingText="Product design" />
          </div>
        ),
      },
      dont: {
        caption: 'The avatar shrinks to fit the name.',
        render: () => (
          <div className="flex w-[11rem] items-center gap-md">
            <Avatar size="2xs" type="initials" alt="" />
            <span className="type-body-sm-semibold text-text-primary">Alexandra Montgomery-Fitzgerald</span>
          </div>
        ),
      },
    },
    {
      title: 'Maintenance',
      body: 'Change avatar images, placeholders and colors on the Avatar page (2.6), and the change reaches every group and label. Overlap and spacing live here, in the avatar-group/overlap/* tokens and the add button part.',
    },
  ],
  accessibility: [
    'Screen readers announce the group with its total, for example “10 people: Olivia Rhye, Phoenix Baker and 8 more”.',
    'Hovering the count shows a Tooltip (2.13) with the hidden names. With onCountClick, the count becomes a button that opens the full list.',
    'The add button is a button named “Add people”, with a tooltip that shows the same text.',
    'In an avatar label, the name is visible text, so the avatar is decorative and hidden from assistive technology.',
  ],
});
