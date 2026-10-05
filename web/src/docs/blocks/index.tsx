/**
 * Explorer building blocks. They mirror the Figma doc kit (9.1): stage, axis labels,
 * token badges, do/don't, tables. Doc pages compose these; components never import them.
 */
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { tokens } from '@/tokens/tokens.gen';
import { Icon, iconNames } from '@/icons';
import type { ControlDef, PropDoc } from '../types';

/* ---------- text ---------- */
export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="type-heading-md-semibold text-text-primary scroll-mt-24">
      {children}
    </h2>
  );
}
export function H3({ children }: { children: ReactNode }) {
  return <h3 className="type-heading-xs-semibold text-text-primary">{children}</h3>;
}
export function P({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('type-body-md-regular text-text-secondary max-w-(--size-measure-reading)', className)}>{children}</p>;
}
export function Caption({ children }: { children: ReactNode }) {
  return <p className="type-body-sm-regular text-text-tertiary">{children}</p>;
}
export function Section({ title, description, children, id }: { title?: ReactNode; description?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section className="flex flex-col gap-lg">
      {title && <H2 id={id}>{title}</H2>}
      {description && <P>{description}</P>}
      {children}
    </section>
  );
}

/* ---------- code ---------- */
export function CodeBlock({ code, lang = 'tsx', className }: { code: string; lang?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={cn('group relative rounded-surface border border-border-subtle bg-surface-sunken', className)}>
      <div className="flex items-center justify-between border-b border-border-subtle px-lg py-xs">
        <span className="type-code-sm-regular text-text-tertiary">{lang}</span>
        <button
          type="button"
          className="type-body-xs-medium text-text-tertiary is-hover:text-text-primary cursor-pointer"
          onClick={() => {
            navigator.clipboard?.writeText(code).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-lg type-code-sm-regular text-text-primary">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="type-code-sm-regular rounded-xs bg-surface-sunken px-xs py-xxs text-text-primary">{children}</code>;
}

/* ---------- stage ---------- */
export function Stage({ children, className, padded = true, dark }: { children: ReactNode; className?: string; padded?: boolean; dark?: boolean }) {
  return (
    <div
      data-theme={dark ? 'dark' : undefined}
      className={cn(
        'flex flex-wrap items-center justify-center gap-xl rounded-surface border border-border-subtle bg-surface-sunken',
        padded && 'p-4xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ExampleBlock({ title, caption, code, children, full }: { title: string; caption?: string; code?: string; children: ReactNode; full?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn('flex flex-col gap-md', full && 'col-span-full')}>
      <Stage className="min-h-40">{children}</Stage>
      <div className="flex items-start justify-between gap-lg">
        <div className="flex flex-col gap-xxs">
          <span className="type-body-sm-semibold text-text-primary">{title}</span>
          {caption && <Caption>{caption}</Caption>}
        </div>
        {code && (
          <button type="button" onClick={() => setShow((s) => !s)} className="type-body-xs-medium shrink-0 cursor-pointer text-text-brand is-hover:text-text-brand-hover">
            {show ? 'Hide code' : 'Show code'}
          </button>
        )}
      </div>
      {show && code && <CodeBlock code={code} className="motion-enter" />}
    </div>
  );
}

/* ---------- matrix ---------- */
export function AxisLabel({ prop, value }: { prop: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-xs rounded-indicator bg-surface-sunken px-md py-xxs">
      <span className="type-code-sm-regular text-text-tertiary">{prop} =</span>
      <span className="type-body-xs-semibold text-text-primary">{value}</span>
    </span>
  );
}

/**
 * Variant grid: one column per value of `colProp`, one row per entry of `rows`.
 * `cell(row, col)` renders the real component instance.
 */
export function Matrix<R extends string, C extends string>({
  rowProp,
  rows,
  colProp,
  cols,
  cell,
  className,
  align = 'center',
}: {
  /** Vertical alignment of cells; use `start` for open popups of different heights. */
  align?: 'center' | 'start';
  rowProp: string;
  rows: readonly R[];
  colProp: string;
  cols: readonly C[];
  cell: (row: R, col: C) => ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0 max-w-full overflow-x-auto rounded-surface border border-dashed border-border-brand-subtle p-xl', className)}>
      <div className={cn('grid w-max gap-x-2xl gap-y-lg', align === 'start' ? 'items-start' : 'items-center')} style={{ gridTemplateColumns: `auto repeat(${cols.length}, auto)` }}>
        <span />
        {cols.map((c) => (
          <div key={c} className="justify-self-center">
            <AxisLabel prop={colProp} value={c} />
          </div>
        ))}
        {rows.map((r) => (
          <Fragment key={r}>
            <AxisLabel prop={rowProp} value={r} />
            {cols.map((c) => (
              <div key={c} className="flex justify-center">
                {cell(r, c)}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

/* ---------- tokens ---------- */
const varByName = new Map(tokens.variables.map((v) => [v.name, v]));
export function TokenBadge({ name }: { name: string }) {
  return <span className="type-code-sm-regular inline-flex items-center rounded-indicator border border-border-subtle bg-surface-raised px-md py-xxs text-text-primary">{name}</span>;
}
export function Swatch({ name, mode = 'Light', size = 20 }: { name: string; mode?: string; size?: number }) {
  const v = varByName.get(name);
  const value = v?.modes[mode]?.value ?? (v ? Object.values(v.modes)[0]?.value : undefined);
  return (
    <span
      className="inline-block shrink-0 rounded-xs border border-border-subtle"
      style={{ width: size, height: size, background: value?.startsWith('#') ? value : 'transparent', backgroundImage: value?.length === 9 ? 'conic-gradient(#ccc 25%, #fff 0 50%, #ccc 0 75%, #fff 0)' : undefined, backgroundSize: '8px 8px' }}
    >
      {value?.length === 9 && <span className="block h-full w-full rounded-xs" style={{ background: value }} />}
    </span>
  );
}

export function TokenTable({ names }: { names: string[] }) {
  const rows = names.map((n) => varByName.get(n) ?? tokens.effectStyles.find((e) => e.name === n) ?? tokens.textStyles.find((t) => t.name === n) ?? { name: n });
  return (
    <div className="overflow-x-auto rounded-surface border border-border-subtle">
      <table className="w-full border-collapse text-left">
        <thead className="bg-surface-sunken">
          <tr className="type-body-xs-semibold text-text-tertiary">
            <th className="px-lg py-md">Token</th>
            <th className="px-lg py-md">Light</th>
            <th className="px-lg py-md">Dark</th>
            <th className="px-lg py-md">CSS</th>
            <th className="px-lg py-md">Tailwind</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.name} className="border-t border-border-subtle align-top">
              <td className="px-lg py-md">
                <TokenBadge name={r.name} />
                {r.description && <p className="type-body-xs-regular mt-xs max-w-80 text-text-tertiary">{r.description}</p>}
              </td>
              {['Light', 'Dark'].map((m) => {
                const md = r.modes?.[m] ?? (r.modes ? Object.values(r.modes)[0] : null);
                return (
                  <td key={m} className="px-lg py-md">
                    {md ? (
                      <span className="inline-flex items-center gap-sm">
                        {r.type === 'COLOR' && <Swatch name={r.name} mode={r.modes[m] ? m : Object.keys(r.modes)[0]} />}
                        <span className="type-code-sm-regular text-text-secondary">{md.alias ?? md.value}</span>
                      </span>
                    ) : r.light ? (
                      <span className="type-code-sm-regular text-text-secondary">{m === 'Light' ? 'see Elevation' : ''}</span>
                    ) : (
                      <span className="type-code-sm-regular text-text-tertiary">—</span>
                    )}
                  </td>
                );
              })}
              <td className="px-lg py-md">
                <span className="type-code-sm-regular text-text-secondary">{r.css ? `var(${r.css})` : r.className ? `.${r.className}` : '—'}</span>
              </td>
              <td className="px-lg py-md">
                <span className="type-code-sm-regular text-text-brand">{r.tailwind ?? r.className ?? '—'}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- props ---------- */
export function PropsTable({ props }: { props: PropDoc[] }) {
  return (
    <div className="overflow-x-auto rounded-surface border border-border-subtle">
      <table className="w-full border-collapse text-left">
        <thead className="bg-surface-sunken">
          <tr className="type-body-xs-semibold text-text-tertiary">
            <th className="px-lg py-md">Prop</th>
            <th className="px-lg py-md">Figma property</th>
            <th className="px-lg py-md">Type</th>
            <th className="px-lg py-md">Default</th>
            <th className="px-lg py-md">Description</th>
          </tr>
        </thead>
        <tbody>
          {props.map((p, i) => (
            <tr key={`${i}-${p.name}`} className="border-t border-border-subtle align-top">
              <td className="px-lg py-md type-code-sm-medium text-text-primary">{p.name}</td>
              <td className="px-lg py-md type-body-sm-regular text-text-secondary">{p.figma ?? '—'}</td>
              <td className="px-lg py-md type-code-sm-regular text-text-brand">{p.type}</td>
              <td className="px-lg py-md type-code-sm-regular text-text-secondary">{p.default ?? '—'}</td>
              <td className="px-lg py-md type-body-sm-regular text-text-secondary">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- do / don't ---------- */
export function DoDont({ kind, caption, children }: { kind: 'do' | 'dont'; caption: string; children?: ReactNode }) {
  const ok = kind === 'do';
  return (
    <div className="flex flex-col gap-md">
      {children && <Stage className={cn('min-h-36 border-b-4', ok ? 'border-b-border-success' : 'border-b-border-danger')}>{children}</Stage>}
      <div className="flex items-start gap-sm">
        <Icon name={ok ? 'alerts/check-circle' : 'alerts/x-circle'} size="md" className={ok ? 'text-icon-success' : 'text-icon-danger'} />
        <div className="flex flex-col">
          <span className="type-body-sm-semibold text-text-primary">{ok ? 'Do' : 'Don’t'}</span>
          <span className="type-body-sm-regular text-text-secondary">{caption}</span>
        </div>
      </div>
    </div>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="flex max-w-(--size-measure-reading) flex-col gap-xs">
      {items.map((it, i) => (
        <li key={i} className="flex gap-md type-body-md-regular text-text-secondary">
          <span className="text-text-brand">•</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- playground ---------- */
export function Playground({ controls, render, code }: { controls: ControlDef[]; render: (a: Record<string, any>) => ReactNode; code: (a: Record<string, any>) => string }) {
  const init = useMemo(() => Object.fromEntries(controls.map((c) => [c.name, c.default])), [controls]);
  const [args, setArgs] = useState<Record<string, any>>(init);
  const [dark, setDark] = useState(false);
  const set = (k: string, v: unknown) => setArgs((a) => ({ ...a, [k]: v }));
  return (
    <div className="flex flex-col gap-lg">
      <div className="grid gap-lg lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-sm">
          <Stage dark={dark} className="min-h-72 bg-surface-base">
            {render(args)}
          </Stage>
          <label className="type-body-xs-medium flex cursor-pointer items-center gap-sm self-end text-text-tertiary">
            <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} /> Preview in Dark
          </label>
        </div>
        <div className="flex flex-col gap-md rounded-surface border border-border-subtle p-lg">
          <span className="type-body-sm-semibold text-text-primary">Controls</span>
          {controls.map((c) => (
            <label key={c.name} className="flex flex-col gap-xxs">
              <span className="flex items-baseline justify-between gap-sm">
                <span className="type-code-sm-medium text-text-primary">{c.name}</span>
                {c.figma && <span className="type-body-xs-regular text-text-tertiary">{c.figma}</span>}
              </span>
              {c.control.type === 'select' && (
                <select className="type-body-sm-regular h-(--size-control-sm) rounded-control border border-border-default bg-surface-base px-md text-text-primary" value={String(args[c.name])} onChange={(e) => set(c.name, e.target.value)}>
                  {c.control.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              )}
              {c.control.type === 'icon' && (
                <select className="type-body-sm-regular h-(--size-control-sm) rounded-control border border-border-default bg-surface-base px-md text-text-primary" value={String(args[c.name] ?? '')} onChange={(e) => set(c.name, e.target.value || undefined)}>
                  <option value="">none</option>
                  {iconNames.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              )}
              {c.control.type === 'boolean' && <input type="checkbox" className="self-start" checked={Boolean(args[c.name])} onChange={(e) => set(c.name, e.target.checked)} />}
              {c.control.type === 'text' && <input className="type-body-sm-regular h-(--size-control-sm) rounded-control border border-border-default bg-surface-base px-md text-text-primary" value={String(args[c.name] ?? '')} onChange={(e) => set(c.name, e.target.value)} />}
              {c.control.type === 'number' && (
                <input type="number" min={c.control.min} max={c.control.max} step={c.control.step} className="type-body-sm-regular h-(--size-control-sm) rounded-control border border-border-default bg-surface-base px-md text-text-primary" value={Number(args[c.name])} onChange={(e) => set(c.name, Number(e.target.value))} />
              )}
            </label>
          ))}
        </div>
      </div>
      <CodeBlock code={code(args)} />
    </div>
  );
}

/** JSX string helper for playground code: props(args, defaults) → ` size="lg" disabled`. */
export function jsxProps(args: Record<string, any>, defaults: Record<string, any> = {}, skip: string[] = []) {
  return Object.entries(args)
    .filter(([k, v]) => !skip.includes(k) && v !== undefined && v !== '' && v !== defaults[k])
    .map(([k, v]) => (v === true ? ` ${k}` : v === false ? ` ${k}={false}` : typeof v === 'number' ? ` ${k}={${v}}` : ` ${k}="${v}"`))
    .join('');
}
