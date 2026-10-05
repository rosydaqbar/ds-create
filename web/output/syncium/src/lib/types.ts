/** Shared prop vocabulary (SYSTEM.md Part C §4.2). Figma `Size=md` → React `size="md"`. */
export type Size = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type Emphasis = 'primary' | 'secondary' | 'tertiary' | 'ghost';
export type Tone = 'neutral' | 'brand' | 'danger' | 'warning' | 'success' | 'info';
export type Status = 'none' | 'invalid' | 'warning' | 'success';
export type Placement = 'none' | 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
export type Orientation = 'horizontal' | 'vertical';

/**
 * Interaction states (Figma `State`). In code they come from the browser (:hover, :active,
 * :focus-visible, disabled). `forceState` pins one for documentation and visual tests only.
 */
export type ForcedState = 'hover' | 'pressed' | 'focus';
export interface ForceStateProps {
  /** Documentation only: render a pseudo-state statically. Never use in product code. */
  forceState?: ForcedState;
}
export const forceAttr = (s?: ForcedState) => (s ? { 'data-force': s } : {});
