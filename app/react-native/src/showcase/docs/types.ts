import type { ComponentType } from 'react';
import type { IconName } from '../../icons';

/**
 * One doc object per component page (`src/showcase/docs/{name}.doc.ts`). The generic
 * ComponentScreen renders it with the web explorer's tabs: Overview, Component, Anatomy,
 * Guidelines and Code (APP.md §7). Doc objects are data: specimens are lists of props for
 * `component`, so the same object can drive the screen, tests and snapshot runs.
 */

export type Level = 'foundations' | 'parts' | 'components' | 'sections';
export type Status = 'Stable' | 'Beta' | 'Deprecated';

export type Control =
  | { type: 'select'; options: readonly string[] }
  | { type: 'boolean' }
  | { type: 'text' }
  | { type: 'icon'; options: readonly IconName[] };

export interface ControlDef {
  /** Prop name in code, e.g. `emphasis`. */
  name: string;
  /** Matching Figma property, e.g. `Emphasis`. */
  figma?: string;
  control: Control;
  default: unknown;
}

/** Real instances laid out on a stage. */
export interface Specimen<P> {
  items: P[];
  /** `row` wraps from the start, `end` aligns to the end (dialog footers), `column` stacks. */
  layout?: 'row' | 'end' | 'column';
}

export interface Example<P> extends Specimen<P> {
  title: string;
  /** One sentence on why this example is right (COPY-GUIDE). */
  caption: string;
  /** Copy-ready React Native code for this example. */
  code: string;
}

export interface MatrixAxis {
  /** Figma property name, e.g. `Size`, `State`. */
  name: string;
  values: readonly string[];
}

export interface MatrixSpec<P> {
  /** Figma-style title, e.g. `Tone=brand · Emphasis=primary`. */
  title: string;
  rows: MatrixAxis;
  columns: MatrixAxis;
  cell: (row: string, column: string) => P;
}

export interface Guideline<P> {
  title: string;
  /** Why it matters, then what to do. Paragraphs separated by a blank line. */
  body: string;
  specimen?: Specimen<P>;
  do?: { caption: string; specimen?: Specimen<P> };
  /** `text` renders plain text instead of instances (e.g. a label that doesn't look clickable). */
  dont?: { caption: string; specimen?: Specimen<P>; text?: string };
}

export interface PropDoc {
  name: string;
  figma?: string;
  type: string;
  default?: string;
  description: string;
  /** Documentation-only props (e.g. `previewState`) are listed apart from the public props. */
  internal?: boolean;
}

export interface AnatomyPart {
  name: string;
  description: string;
  tokens?: string[];
}

export interface ComponentDoc<P extends object> {
  /** Page ID from the spec tree, e.g. `2.1`. */
  id: string;
  name: string;
  level: Exclude<Level, 'foundations'>;
  /** Spec path in ds-create, e.g. `parts/2.1-button.md`. */
  spec: string;
  exports: string[];
  /** APP.md A6. A component can be Stable on the web and Beta here; this is the app status. */
  status: Status;
  /** Release the component arrived in. */
  since: string;
  /** Last change (ISO date), for "Recently updated" on the home screen. */
  updated?: string;
  summary: string;
  component: ComponentType<P>;
  hero: P;
  examples: Example<P>[];
  whenToUse: { use: string[]; dont: string[] };
  /** How this platform differs from Figma and the web (APP.md §6.2). Shown on Overview. */
  platformNotes: string[];
  matrices: MatrixSpec<P>[];
  playground: {
    controls: ControlDef[];
    /** Props the playground always passes (e.g. a press handler). */
    base?: Partial<P>;
    code: (args: Record<string, unknown>) => string;
  };
  anatomy: { specimen: Specimen<P>; parts: AnatomyPart[] };
  props: PropDoc[];
  /** Tokens the component binds, as Figma names. */
  tokens: string[];
  guidelines: Guideline<P>[];
  accessibility: string[];
}

export const defineDoc = <P extends object>(doc: ComponentDoc<P>): ComponentDoc<P> => doc;

/** JSX attributes for the props that differ from their defaults, e.g. ` size="lg" iconOnly`. */
export function jsxProps(args: Record<string, unknown>, defaults: Record<string, unknown> = {}): string {
  return Object.entries(args)
    .filter(([key, value]) => value !== undefined && value !== '' && value !== defaults[key])
    .map(([key, value]) => {
      if (value === true) return ` ${key}`;
      if (typeof value === 'string') return ` ${key}="${value}"`;
      return ` ${key}={${JSON.stringify(value)}}`;
    })
    .join('');
}
