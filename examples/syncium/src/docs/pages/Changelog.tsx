import { Link } from 'react-router';
import { Badge } from '@/components/parts/Badge';
import { DocPage, AnchorHeading } from '../DocPage';
import { P } from '../blocks';
import { releases, type ChangeItem } from '../changelog';
import { pageMeta, statusInfo } from '../meta';
import { componentDocs, slugOf, staticPages } from '../registry';

const kindBadge: Record<ChangeItem['kind'], { label: string; tone: 'success' | 'info' | 'brand' | 'warning' }> = {
  added: { label: 'Added', tone: 'success' },
  changed: { label: 'Changed', tone: 'info' },
  fixed: { label: 'Fixed', tone: 'brand' },
  tokens: { label: 'Tokens', tone: 'warning' },
};

function pageLink(id: string) {
  const d = componentDocs.find((x) => x.id === id);
  if (d) return { to: `/${d.level}/${slugOf(d.id, d.name)}`, name: `${d.id} ${d.name}` };
  const p = staticPages.find((x) => x.id === id);
  return p ? { to: `/${p.group}/${slugOf(p.id, p.name)}`, name: `${p.id} ${p.name}` } : null;
}

export default function Changelog() {
  return (
    <DocPage
      eyebrow="Guidance › 03 Changelog"
      title="Changelog"
      description="What changed in each release, and what it means for your designs and code. Versions follow semantic versioning, so breaking changes arrive only in a major version."
      tabs={[
        {
          label: 'Releases',
          render: () => (
            <div className="flex max-w-[64rem] flex-col gap-4xl">
              {releases.map((r) => (
                <section key={r.version} className="flex flex-col gap-lg">
                  <div className="flex flex-wrap items-baseline gap-md">
                    <AnchorHeading id={`v${r.version.replace('.', '-')}`}>{`Version ${r.version}`}</AnchorHeading>
                    <time dateTime={r.date} className="type-body-sm-regular text-text-tertiary">
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </time>
                  </div>
                  <P>{r.summary}</P>
                  <ul className="flex flex-col divide-y divide-border-subtle rounded-surface border border-border-subtle">
                    {r.items.map((it, i) => (
                      <li key={i} className="flex flex-col gap-sm p-lg sm:flex-row sm:items-start sm:gap-lg">
                        <span className="w-24 shrink-0">
                          <Badge size="sm" type="rounded" tone={kindBadge[it.kind].tone} label={kindBadge[it.kind].label} />
                        </span>
                        <div className="flex min-w-0 flex-col gap-xs">
                          <span className="type-body-md-regular text-text-primary">{it.text}</span>
                          {it.pages && (
                            <span className="flex flex-wrap gap-x-md gap-y-xxs">
                              {it.pages.map((id) => {
                                const l = pageLink(id);
                                return l ? (
                                  <Link key={id} to={l.to} className="type-body-sm-medium text-text-brand underline-offset-2 is-hover:underline">
                                    {l.name}
                                  </Link>
                                ) : null;
                              })}
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          ),
        },
        {
          label: 'Status',
          render: () => (
            <div className="flex max-w-[64rem] flex-col gap-4xl">
              <section className="flex flex-col gap-lg">
                <AnchorHeading>What the labels mean</AnchorHeading>
                <div className="grid gap-lg md:grid-cols-2">
                  {(['stable', 'beta'] as const).map((s) => (
                    <div key={s} className="flex flex-col gap-sm rounded-surface border border-border-subtle p-xl">
                      <Badge size="md" tone={statusInfo[s].tone} showDot label={statusInfo[s].label} />
                      <P>{statusInfo[s].description}</P>
                    </div>
                  ))}
                </div>
              </section>
              <section className="flex flex-col gap-lg">
                <AnchorHeading>Every component</AnchorHeading>
                <div tabIndex={0} role="region" aria-label="Component status" className="overflow-x-auto rounded-surface border border-border-subtle outline-none focus-visible:shadow-focus-default">
                  <table className="w-full border-collapse text-left">
                    <thead className="bg-surface-sunken">
                      <tr className="type-body-xs-semibold text-text-tertiary">
                        <th className="px-lg py-md">Component</th>
                        <th className="px-lg py-md">Status</th>
                        <th className="px-lg py-md">Since</th>
                      </tr>
                    </thead>
                    <tbody>
                      {componentDocs.map((d) => {
                        const m = pageMeta[d.id];
                        return (
                          <tr key={d.id} className="border-t border-border-subtle">
                            <td className="px-lg py-md">
                              <Link to={`/${d.level}/${slugOf(d.id, d.name)}`} className="type-body-sm-semibold text-text-primary is-hover:text-text-brand">
                                <span className="type-code-sm-regular mr-md text-text-tertiary">{d.id}</span>
                                {d.name}
                              </Link>
                            </td>
                            <td className="px-lg py-md">{m?.status && <Badge size="sm" tone={statusInfo[m.status].tone} showDot label={statusInfo[m.status].label} />}</td>
                            <td className="type-body-sm-regular px-lg py-md text-text-secondary">v{m?.since}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ),
        },
      ]}
    />
  );
}
