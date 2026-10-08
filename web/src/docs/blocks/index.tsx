/**
 * Explorer building blocks. They mirror the Figma doc kit (9.1): stage, axis labels,
 * token badges, do/don't, tables. Doc pages compose these; components never import them.
 */
import { Fragment, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { tokens } from '@/tokens/tokens.gen';
import { Icon, iconNames } from '@/icons';
import type { ControlDef, PropDoc } from '../types';
import { Switch } from '@/components/parts/Switch';
import { Select } from '@/components/components/Select';
import { TextField } from '@/components/components/TextField';
import * as appLib from '@app';
import { config } from '@/ds.config';
import { supportedModes } from '../modes';

/** `Danger tone` → `danger-tone`; used for tab keys and heading ids. */
export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[’'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

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
/**
 * Light syntax colouring: comments, strings, JSX tags, attributes, keywords. Roles come from
 * the text colour tokens, so Light and Dark both keep AA contrast on the code surface.
 */
const TOKEN_RE =
  /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(<\/?[A-Za-z][\w.]*|\/?>)|(\b[a-zA-Z-]+(?==))|(\b(?:import|from|export|const|let|return|function|default|true|false|null|undefined|await|async|if|else)\b|@[a-z-]+)/g;
const tokenClass = ['text-text-tertiary', 'text-text-success', 'text-text-brand', 'text-text-warning', 'text-text-info'];
function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of code.matchAll(TOKEN_RE)) {
    const i = m.index ?? 0;
    if (i > last) out.push(code.slice(last, i));
    const group = m.slice(1).findIndex((g) => g !== undefined);
    out.push(
      <span key={i} className={tokenClass[group]}>
        {m[0]}
      </span>,
    );
    last = i + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, lang = 'tsx', className, label }: { code: string; lang?: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const text = code.trim();
  return (
    <div className={cn('group relative min-w-0 rounded-surface border border-border-subtle bg-surface-sunken', className)}>
      <div className="flex items-center justify-between border-b border-border-subtle px-lg py-xs">
        <span className="type-code-sm-regular text-text-tertiary">{lang}</span>
        <button
          type="button"
          aria-label={copied ? 'Copied' : `Copy ${label ?? lang} code`}
          className="type-body-xs-medium inline-flex min-h-6 cursor-pointer items-center gap-xs rounded-xs px-xs text-text-tertiary outline-none is-hover:text-text-primary is-focus:shadow-focus-default"
          onClick={() => {
            navigator.clipboard?.writeText(text).catch(() => {});
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          <Icon name={copied ? 'general/check' : 'general/copy'} size="xs" />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre
        tabIndex={0}
        role="region"
        aria-label={label ? `${label} code` : `${lang} code`}
        className="overflow-x-auto rounded-b-surface p-lg type-code-sm-regular text-text-primary outline-none focus-visible:shadow-focus-default"
      >
        <code>{lang === 'tailwind' ? text : highlight(text)}</code>
      </pre>
    </div>
  );
}
export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="type-code-sm-regular rounded-xs bg-surface-sunken px-xs py-xxs text-text-primary">{children}</code>;
}

/* ---------- stage ---------- */
/**
 * Makes a scroll container keyboard-reachable only while its content overflows
 * (a phone-width example, a wide specimen), so it never adds empty tab stops.
 */
export function useScrollRegion<T extends HTMLElement>(label: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const scrolls = getComputedStyle(el).overflowX !== 'visible' && el.scrollWidth > el.clientWidth + 1;
      if (scrolls) {
        el.tabIndex = 0;
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', `${label}, scrolls sideways`);
      } else {
        el.removeAttribute('tabindex');
        el.removeAttribute('role');
        el.removeAttribute('aria-label');
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const c of el.children) ro.observe(c);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [label]);
  return ref;
}

export function Stage({ children, className, padded = true, dark, label = 'Example' }: { children: ReactNode; className?: string; padded?: boolean; dark?: boolean; label?: string }) {
  const ref = useScrollRegion<HTMLDivElement>(label);
  return (
    <div
      ref={ref}
      data-theme={dark ? 'dark' : undefined}
      className={cn(
        // Wide examples scroll inside the stage instead of widening the page.
        'relative flex min-w-0 max-w-full flex-wrap items-center justify-center-safe gap-xl overflow-x-auto md:overflow-visible rounded-surface border border-border-subtle bg-surface-sunken outline-none focus-visible:shadow-focus-default',
        padded && 'p-2xl md:p-4xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ExampleBlock({ title, caption, code, children, full, app }: { title: string; caption?: string; code?: string; children: ReactNode; full?: boolean; app?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className={cn('flex min-w-0 flex-col gap-md', full && 'col-span-full')}>
      {app ? <AppStage className="min-h-40">{children}</AppStage> : <Stage className="min-h-40">{children}</Stage>}
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
    <div
      tabIndex={0}
      role="group"
      aria-label={`Variants: ${rowProp} by ${colProp}`}
      className={cn('relative min-w-0 max-w-full overflow-x-auto rounded-surface border border-dashed border-border-brand-subtle p-xl outline-none focus-visible:shadow-focus-default', className)}
    >
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

/**
 * App token names (workflow/APP.md §5): a Figma name as it appears in React Native, Swift and Kotlin. Members are
 * camelCase without the domain (`color/text/primary` → `textPrimary`); a member that would start with a
 * digit keeps its domain (`space/2xl` → `space2xl`). Same rules as app/scripts/build-rn-tokens.mjs.
 * Null for a name that has no app member.
 */
export function appTokenNames(name: string): { rn: string; swift: string; kotlin: string } | null {
  const camel = (parts: string[]) =>
    parts
      .join('-')
      .split(/[-/ ]+/)
      .filter(Boolean)
      .map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1)))
      .join('');
  const seg = name.split('/');
  const [dom, ...rest] = seg;
  const member = (parts: string[]) => {
    const m = camel(parts);
    return /^\d/.test(m) || !m ? camel([dom, ...parts]) : m;
  };
  if (tokens.effectStyles.some((e) => e.name === name)) {
    const m = camel(seg);
    return { rn: `theme.shadows.${m}`, swift: `DSTokens.Shadow.${m}`, kotlin: `DsShadows.${m}` };
  }
  if (tokens.textStyles.some((t) => t.name === name)) {
    const m = member(rest);
    return { rn: `theme.text('${m}')`, swift: `DSTokens.TextStyle.${m}`, kotlin: `DsTextStyles.${m}` };
  }
  const v = varByName.get(name);
  if (v?.collection === 'Components') {
    const m = camel(seg);
    return { rn: `theme.component.${m}`, swift: `DSTokens.Component.${m}`, kotlin: `DsComponent.${m}` };
  }
  if (v?.collection === 'Primitives') return null;
  if (dom === 'color') { const m = member(rest); return { rn: `theme.color.${m}`, swift: `DSTokens.Color.${m}`, kotlin: `DsTheme.colors.${m}` }; }
  if (dom === 'space') { const m = member(rest); return { rn: `dimensions.space.${m}`, swift: `DSTokens.Space.${m}`, kotlin: `DsSpace.${m}` }; }
  if (dom === 'size') { const m = member(rest); return { rn: m === 'touchMin' || m === 'touchMinAndroid' ? 'theme.touchTarget' : `dimensions.size.${m}`, swift: `DSTokens.Size.${m}`, kotlin: `DsSizes.${m}` }; }
  if (dom === 'radius') { const m = member(rest); return { rn: `dimensions.radius.${m}`, swift: `DSTokens.Radius.${m}`, kotlin: `DsRadius.${m}` }; }
  if (dom === 'border') { const m = member(rest.slice(1)); return { rn: `dimensions.borderWidth.${m}`, swift: `DSTokens.BorderWidth.${m}`, kotlin: `DsBorderWidth.${m}` }; }
  if (dom === 'font' && rest.length > 1) {
    const group = camel(['font', rest[0]]); // fontSize, fontLineHeight, fontWeight, fontFamily
    const m = member(rest.slice(1));
    const G = group[0].toUpperCase() + group.slice(1);
    return { rn: `dimensions.${group}.${m}`, swift: `DSTokens.${G}.${m}`, kotlin: `Ds${G}.${m}` };
  }
  if (dom === 'motion') { const m = member(rest); return { rn: `theme.motion.${m}`, swift: `DSTokens.Motion.${m}`, kotlin: `DsTheme.motion.${m}` }; }
  return null;
}

/** Code names wrap after `.` and `/` instead of overflowing narrow columns (`theme.color.<wbr>textPrimary`). */
export function breakable(text: string): ReactNode {
  const parts = text.split(/(?<=[./])/);
  return parts.map((p, i) => (i < parts.length - 1 ? [p, <wbr key={i} />] : p));
}

/** The code-name columns of a token table: CSS and Tailwind on a web product, React Native, Swift and Kotlin on an App product. */
export const tokenCodeColumns: readonly string[] = config.product === 'app' ? ['React Native', 'Swift', 'Kotlin'] : ['CSS', 'Tailwind'];

/** The code names of one token for `tokenCodeColumns`, in the same order. */
export function tokenCodeNames(r: { name: string; css?: string | null; tailwind?: string | null; className?: string }): string[] {
  if (config.product !== 'app') return [r.css ? `var(${r.css})` : r.className ? `.${r.className}` : '—', r.tailwind ?? r.className ?? '—'];
  const a = appTokenNames(r.name);
  return a ? [a.rn, a.swift, a.kotlin] : ['—', '—', '—'];
}

export function TokenTable({ names, modes = supportedModes }: { names: string[]; modes?: string[] }) {
  const rows = names.map((n) => varByName.get(n) ?? tokens.effectStyles.find((e) => e.name === n) ?? tokens.textStyles.find((t) => t.name === n) ?? { name: n });
  return (
    <div tabIndex={0} role="region" aria-label="Tokens" className="overflow-x-auto rounded-surface border border-border-subtle outline-none focus-visible:shadow-focus-default">
      <table className="w-full border-collapse text-left">
        <thead className="bg-surface-sunken">
          <tr className="type-body-xs-semibold text-text-tertiary">
            <th className="px-lg py-md">Token</th>
            {modes.map((m) => (
              <th key={m} className="px-lg py-md">
                {m}
              </th>
            ))}
            {tokenCodeColumns.map((c) => (
              <th key={c} className="px-lg py-md">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r: any) => (
            <tr key={r.name} className="border-t border-border-subtle align-top">
              <td className="px-lg py-md">
                <span className="whitespace-nowrap"><TokenBadge name={r.name} /></span>
                {r.description && <p className="type-body-xs-regular mt-xs max-w-80 text-text-tertiary">{r.description}</p>}
              </td>
              {modes.map((m) => {
                const md = r.modes?.[m] ?? (r.modes ? Object.values(r.modes)[0] : null);
                return (
                  <td key={m} className="px-lg py-md">
                    {md ? (
                      <span className="inline-flex items-center gap-sm">
                        {r.type === 'COLOR' && <Swatch name={r.name} mode={r.modes[m] ? m : Object.keys(r.modes)[0]} />}
                        <span className="type-code-sm-regular text-text-secondary">{breakable(String(md.alias ?? md.value))}</span>
                      </span>
                    ) : r.light ? (
                      <span className="type-code-sm-regular text-text-secondary">{m === modes[0] ? 'See 1.5 Elevation' : ''}</span>
                    ) : (
                      <span className="type-code-sm-regular text-text-tertiary">—</span>
                    )}
                  </td>
                );
              })}
              {tokenCodeNames(r).map((c, i) => (
                <td key={tokenCodeColumns[i]} className="px-lg py-md">
                  <span className={cn('type-code-sm-regular', i === 1 && productHasWeb ? 'text-text-brand' : 'text-text-secondary')}>{breakable(c)}</span>
                </td>
              ))}
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
    <div tabIndex={0} role="region" aria-label="Properties" className="overflow-x-auto rounded-surface border border-border-subtle outline-none focus-visible:shadow-focus-default">
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
          {props.filter((p) => !p.internal && !/^force[A-Z]?\w*State$/.test(p.name)).map((p, i) => (
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
/** The playground is built from the system's own controls, so the docs exercise them on every page. */
export function Playground({ controls, render, code }: { controls: ControlDef[]; render: (a: Record<string, any>) => ReactNode; code: (a: Record<string, any>) => string }) {
  const init = useMemo(() => Object.fromEntries(controls.map((c) => [c.name, c.default])), [controls]);
  const [args, setArgs] = useState<Record<string, any>>(init);
  const [dark, setDark] = useState(false);
  const set = (k: string, v: unknown) => setArgs((a) => ({ ...a, [k]: v }));
  const label = (c: ControlDef) => (
    <span className="flex items-baseline justify-between gap-sm">
      <span className="type-code-sm-medium text-text-primary">{c.name}</span>
      {c.figma && <span className="type-body-xs-regular text-text-tertiary">Figma: {c.figma}</span>}
    </span>
  );
  return (
    <div className="flex flex-col gap-lg">
      <div className="grid gap-lg lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-sm">
          <Stage dark={dark} className="min-h-72 bg-surface-base">
            {render(args)}
          </Stage>
          <label className="type-body-sm-medium flex cursor-pointer items-center gap-sm self-end text-text-secondary">
            <Switch size="sm" checked={dark} onCheckedChange={setDark} aria-label="Preview in Dark" /> Preview in Dark
          </label>
        </div>
        <fieldset className="flex min-w-0 flex-col gap-lg rounded-surface border border-border-subtle p-lg">
          <legend className="type-body-sm-semibold px-xs text-text-primary">Controls</legend>
          {controls.map((c) => {
            const id = `pg-${c.name}`;
            if (c.control.type === 'boolean')
              return (
                <label key={c.name} className="flex cursor-pointer items-center justify-between gap-md">
                  <span className="flex flex-col">
                    <span className="type-code-sm-medium text-text-primary">{c.name}</span>
                    {c.figma && <span className="type-body-xs-regular text-text-tertiary">Figma: {c.figma}</span>}
                  </span>
                  <Switch size="sm" checked={Boolean(args[c.name])} onCheckedChange={(v) => set(c.name, v)} aria-label={c.name} />
                </label>
              );
            if (c.control.type === 'select' || c.control.type === 'icon') {
              const ctl = c.control;
              const icon = ctl.type === 'icon';
              const options = ctl.type === 'icon' ? ['none', ...iconNames] : ctl.options.map(String);
              return (
                <div key={c.name} className="flex flex-col gap-xxs">
                  <span id={`${id}-l`}>{label(c)}</span>
                  <Select
                    size="sm"
                    type={icon ? 'search' : 'default'}
                    aria-labelledby={`${id}-l`}
                    options={options}
                    value={icon ? (args[c.name] ?? 'none') : String(args[c.name])}
                    onValueChange={(v) => set(c.name, icon ? (v === 'none' || v === null ? undefined : v) : v)}
                  />
                </div>
              );
            }
            return (
              <div key={c.name} className="flex flex-col gap-xxs">
                <span id={`${id}-l`}>{label(c)}</span>
                <TextField
                  size="sm"
                  aria-labelledby={`${id}-l`}
                  value={String(args[c.name] ?? '')}
                  inputMode={c.control.type === 'number' ? 'decimal' : undefined}
                  onValueChange={(v) => set(c.name, c.control.type === 'number' ? (v === '' || Number.isNaN(Number(v)) ? args[c.name] : Number(v)) : v)}
                />
              </div>
            );
          })}
        </fieldset>
      </div>
      <CodeBlock code={code(args)} label="Playground" />
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

/* ---------- app products (React Native on the web) ---------- */
export const productHasWeb = config.product !== 'app';
export const productHasApp = config.product !== 'web' && !('__missing' in appLib);

/** The site's color mode, so React Native previews follow the Light / Dark toggle. */
export function useDocsScheme(): 'light' | 'dark' {
  const read = () => (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  const [scheme, setScheme] = useState<'light' | 'dark'>(read);
  useLayoutEffect(() => {
    const mo = new MutationObserver(() => setScheme(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return scheme;
}

/**
 * React Native headers render as h1–h6 on the web (react-native-web). This sets the level the preview's
 * titles start at, one below the page heading right above them, so the page outline stays in order.
 * Without a React Native source (the fallback module) it renders the children as they are.
 */
function AppHeadings({ level, children }: { level: 2 | 3 | 4 | 5; children: ReactNode }) {
  const Provider = appLib.HeadingLevelProvider;
  return Provider ? <Provider level={level}>{children}</Provider> : <>{children}</>;
}

/**
 * A stage that renders React Native components inside the app theme (react-native-web).
 * `headingLevel`: where the preview's titles start. 3 under a section heading (h2), the default;
 * 2 for a hero right under the page title (h1).
 */
export function AppStage({ children, className, dark, label = 'App example', headingLevel = 3 }: { children: ReactNode; className?: string; dark?: boolean; label?: string; headingLevel?: 2 | 3 | 4 }) {
  const scheme = useDocsScheme();
  return (
    <Stage className={className} dark={dark} label={label}>
      <appLib.ThemeProvider colorScheme={dark ? 'dark' : scheme}>
        <AppHeadings level={headingLevel}>
          {/* React Native components hug with alignSelf: flex-start; this box keeps them centered on the stage. */}
          <div className="flex max-w-full flex-wrap items-center justify-center-safe gap-xl">{children}</div>
        </AppHeadings>
      </appLib.ThemeProvider>
    </Stage>
  );
}

/** The app theme for React Native content that sits outside an AppStage (variant grids, Home thumbnails). */
export function AppTheme({ children, headingLevel = 3 }: { children: ReactNode; headingLevel?: 2 | 3 | 4 | 5 }) {
  const scheme = useDocsScheme();
  return (
    <appLib.ThemeProvider colorScheme={scheme}>
      <AppHeadings level={headingLevel}>{children}</AppHeadings>
    </appLib.ThemeProvider>
  );
}

export type AppPlatform = 'reactNative' | 'swift' | 'kotlin';
export const APP_PLATFORMS: readonly { value: AppPlatform; label: string; lang: string }[] = [
  { value: 'reactNative', label: 'React Native', lang: 'tsx' },
  { value: 'swift', label: 'Swift', lang: 'swift' },
  { value: 'kotlin', label: 'Kotlin', lang: 'kotlin' },
];

/** Shown on an app product's page when the component has no app version yet. */
export function NoAppVersion() {
  return (
    <div role="note" className="flex flex-col gap-xs rounded-surface border border-dashed border-border-default p-2xl">
      <h2 className="type-body-md-semibold text-text-primary">No app version yet</h2>
      <P>This component has no app preview or app code yet. They’re added in page order.</P>
    </div>
  );
}

/** Segmented choice for platform previews and code (Web / App, or React / React Native / Swift / Kotlin). */
export function Segmented<T extends string>({ label, options, value, onChange }: { label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-xxs rounded-control border border-border-default bg-surface-base p-xxs">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cn(
            'type-body-sm-semibold min-h-8 cursor-pointer rounded-sm px-md outline-none transition-colors duration-(--motion-duration-fast) is-focus:shadow-focus-default',
            o.value === value ? 'bg-fill-brand-subtle text-site-brand-on-tint' : 'text-text-secondary is-hover:bg-fill-neutral-subtle-hover is-hover:text-text-primary',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
