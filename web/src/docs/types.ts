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
  /** Previous heading IDs retained when related topics are consolidated. */
  aliases?: readonly string[];
  body: string;
  /** Optional visual for the topic. */
  render?: () => ReactNode;
  do?: { caption: string; render?: () => ReactNode };
  dont?: { caption: string; render?: () => ReactNode };
}

/** Code for the three app implementations (APP.md): React Native, SwiftUI and Jetpack Compose. */
export interface AppCode {
  reactNative: string;
  swift: string;
  kotlin: string;
}

export interface AppExample {
  title: string;
  caption?: string;
  /** Renders the React Native component (react-native-web on this site). */
  render: () => ReactNode;
  code: AppCode;
}

export interface AppVisual {
  render?: () => ReactNode;
  do?: () => ReactNode;
  dont?: () => ReactNode;
}

/**
 * The app version of a component page (products 'app' and 'both'). Previews render the real
 * React Native components; Swift and Kotlin share the same look (APP.md §6.4 parity).
 */
export interface AppDoc {
  hero: () => ReactNode;
  examples: AppExample[];
  /** Variant grids rendered with the React Native component. */
  matrices?: MatrixSpec[];
  /**
   * The Anatomy specimen in React Native. It uses the same `anatomy.parts`: tag each part with
   * `anatomy('label')` (or `anatomyPart` on Icon) so the numbered markers find it.
   */
  anatomy?: () => ReactNode;
  /**
   * React Native versions of the Guidelines visuals, by guideline title. In App preview the page
   * shows only these; a guideline without one shows its text alone.
   */
  visuals?: Record<string, AppVisual>;
  /** Platform behavior on iOS and Android (APP.md §6.2), shown on Guidelines under "In apps". */
  notes?: string[];
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
  /** The app version (products 'app' and 'both'). Missing = no app version yet. */
  app?: AppDoc;
}

export const defineDoc = (d: ComponentDoc) => d;

/** Shared shape for one guideline topic on foundation and guidance pages. */
export type Topic = Guideline;
