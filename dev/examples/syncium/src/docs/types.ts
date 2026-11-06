import type { ReactNode } from 'react';

/**
 * One documentation module per component page (`src/docs/stories/{id}-{slug}.doc.tsx`).
 * The explorer renders the same four frames as the Figma page — Overview, Component,
 * Anatomy, Guidelines — plus a Code tab with copy-ready usage.
 */

export type Control =
  | { type: 'select'; options: readonly string[] }
  | { type: 'boolean' }
  | { type: 'text' }
  | { type: 'number'; min?: number; max?: number; step?: number }
  | { type: 'icon' };

export interface ControlDef {
  /** Prop name in code, e.g. `emphasis`. */
  name: string;
  /** Matching Figma property, e.g. `Emphasis`. */
  figma?: string;
  control: Control;
  default: unknown;
}

export interface Example {
  title: string;
  caption?: string;
  render: () => ReactNode;
  /** JSX shown under the example; keep it copy-ready. */
  code: string;
  /** Lay the example out on a darker stage or full width. */
  stage?: 'default' | 'full';
}

export interface PropDoc {
  name: string;
  /** Documentation-only props (e.g. `forceState`) are hidden from the public props table. */
  internal?: boolean;
  type: string;
  default?: string;
  description: string;
  /** Figma property this prop implements, e.g. `Size`, `Show leading icon`. */
  figma?: string;
}

export interface MatrixSpec {
  title: string;
  /**
   * Private parts that carry an ARIA child role (option, menuitem) are wrapped in this
   * parent role so the specimen grid stays valid for assistive technology.
   */
  specimenRole?: 'listbox' | 'menu';
  /** Row and column axis names shown above the grid, e.g. `Emphasis × Size` and `State`. */
  rows?: string;
  columns?: string;
  render: () => ReactNode;
}

export interface Guideline {
  title: string;
  body: string;
  /** Optional visual for the topic. */
  render?: () => ReactNode;
  do?: { caption: string; render?: () => ReactNode };
  dont?: { caption: string; render?: () => ReactNode };
}

export interface ComponentDoc {
  /** Page ID from the spec tree, e.g. `2.1`. */
  id: string;
  name: string;
  level: 'parts' | 'components' | 'sections' | 'layouts' | 'screens';
  /** Family header description (from the spec). */
  summary: string;
  /** Path of the spec in ds-create, e.g. `parts/2.1-button.md`. */
  spec: string;
  /** Exports to import, e.g. `['Button']`. */
  exports: string[];
  /** Hero instance at the top of Overview. */
  hero: () => ReactNode;
  playground?: {
    controls: ControlDef[];
    render: (args: Record<string, any>) => ReactNode;
    /** JSX for the current args. */
    code: (args: Record<string, any>) => string;
  };
  /** Overview compositions ("examples in use"). */
  examples: Example[];
  whenToUse?: { use: string[]; dont: string[] };
  /** Component frame: full variant matrices. */
  matrices: MatrixSpec[];
  /** `.Main` private parts (not exported), shown after the matrices like the Figma `.Main` frame. */
  privateParts?: MatrixSpec[];
  anatomy: {
    render?: () => ReactNode;
    /**
     * `target` is the `data-anatomy` value on the element this part describes. The explorer
     * places the numbered marker on that element inside the rendered specimen.
     */
    parts: { name: string; description: string; tokens?: string[]; target?: string }[];
  };
  props: PropDoc[];
  /** Tokens the component binds (names from the token contract). */
  tokens: string[];
  guidelines: Guideline[];
  accessibility?: string[];
}

export const defineDoc = (d: ComponentDoc) => d;

/** Shared shape for one guideline topic on foundation and guidance pages. */
export type Topic = Guideline;
