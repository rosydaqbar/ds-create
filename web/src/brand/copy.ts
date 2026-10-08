/**
 * The brand's own sentences on the foundation and guidance pages: one slot per fact the Figma file
 * decides (why this typeface, the corner character, the logo's clear space). Every other sentence
 * on those pages is the spec's brand-agnostic guidance, and every value in them is computed from
 * the tokens.
 *
 * workflow/WEB.md W5 fills this file from the Figma Guidelines frames, answering the question above each
 * slot. Rules:
 * - Remove the `template(…)` wrapper from a slot once it holds the brand's answer. A slot whose
 *   template text already fits may keep it: remove the wrapper to confirm it.
 * - Keep computed values computed: a slot that receives values (`({ name, depth }) => …`) uses them
 *   instead of typing a name, a number or a color.
 * - Never leave a slot empty. An optional slot (marked "Optional") may be an empty object.
 * - Write in the voice of COPY-GUIDE.md.
 *
 * `npm run check:brand-copy` (part of `npm run build`) lists the slots still marked `template(…)`.
 * Once `brandCopy` in ds.config.ts is 'written', it fails on any of them, and on any empty slot.
 */

/** Marks a slot that still holds the template's generic text. Returns the value unchanged. */
const template = <T,>(value: T): T => value;

type Named = { name: string };
/** The shape of each slot: a sentence, a sentence built from computed values, or data. */
export interface BrandCopy {
  welcome: (v: Named & { platforms: string; modes: string }) => string;
  brandAtAGlance: string;
  paletteCharacter: string;
  paletteNotes: Record<string, string>;
  accessibilityTarget: string;
  typefaceIntro: string;
  typefaceWhy: (v: { family: string }) => string;
  weightCaption: (v: { family: string }) => string;
  density: string;
  cornerCharacter: (v: Named & { character: string }) => string;
  cornerWhy: (v: Named & { character: string }) => string;
  depthDirection: (v: Named & { depth: string }) => string;
  depthWhy: (v: Named & { depth: string }) => string;
  backdropBlurUse: string;
  motionPrinciple: (v: Named) => string;
  motionCharacter: { title: string; text: string };
  iconStyle: { kind: 'outline' | 'filled' | 'duotone'; stroke: number };
  logoMinSize: { mark: number; lockup: number };
  logoClearSpace: (v: { mark: number; lockup: number }) => string;
  logoResizing: (v: { mark: number; lockup: number }) => string;
  otherAssetKinds: { kind: string; count: string; use: string; status: string; tone: 'ok' | 'warn' | 'off' }[];
  socialMarkHeights: Record<string, number>;
  flagSource: string;
}

export const brandCopy: BrandCopy = {
  /* ---------- 01 Getting started ---------- */

  /**
   * What product does this system serve, and on which platforms? One or two sentences, from the
   * Figma "01 Getting started · Overview" Welcome topic.
   */
  welcome: template(
    ({ name, platforms, modes }: { name: string; platforms: string; modes: string }) =>
      `${name} is the shared library of tokens, components and guidance for designing and building ${platforms} in ${modes}.`,
  ),

  /**
   * Where do the brand colors come from, and what are the corner and depth character? From the
   * Figma "The brand at a glance" topic.
   */
  brandAtAGlance: template(
    'The brand color becomes the brand ramp, and the neutrals carry text, borders and surfaces. The corner scale and the elevation styles give every component the same shape and depth.',
  ),

  /* ---------- 02 Tokens ---------- */

  /** What character do the neutral and brand ramps have? One sentence, from the Figma "02 Tokens" primitive palette topic. */
  paletteCharacter: template('The neutral ramp carries text, borders and surfaces, and the brand ramp carries actions and selection.'),

  /* ---------- 1.1 Color ---------- */

  /**
   * Optional. Does any palette family have a job the Guidelines frame names? One line per family,
   * e.g. `{ pink: 'Charts and measurement overlays.' }`. Families without a note get a computed one.
   */
  paletteNotes: template({}),

  /**
   * What accessibility target does the product set? WCAG AA is the ds-create default; name the
   * product's own target when the Figma Guidelines frame sets one.
   */
  accessibilityTarget: template(
    'This system targets WCAG AA: 4.5:1 for body text, and 3:1 for large text and UI parts such as control borders and icons. Test real semantic pairs in every mode rather than primitives on their own, because a step that passes on one surface can fail on another.',
  ),

  /* ---------- 1.2 Typography ---------- */

  /**
   * What is the typeface's character? Follows the computed sentence that names the families.
   * Keep the second sentence, and add one on the character when the Guidelines frame gives it.
   */
  typefaceIntro: template('Every text style is built from these families, so changing a family variable restyles every screen at once.'),

  /** Why was this typeface chosen (license, script coverage, character)? From the Figma Guidelines frame. */
  typefaceWhy: template(
    ({ family }: { family: string }) =>
      `${family} sets every interface role. Before you commit to a typeface, check that it covers the scripts and languages you need, every weight the scale uses, tabular figures for tables and readable text at small sizes.`,
  ),

  /**
   * Does the font lack a weight the scale uses? Name the mapping (for example "semibold maps to bold,
   * the font has no 600"). Caption under the weight specimen.
   */
  weightCaption: template(({ family }: { family: string }) => `Each weight is set in ${family} and labeled with the roles that use it.`),

  /* ---------- 1.3 Space & layout ---------- */

  /**
   * How dense is the system (roomy, balanced or compact), and why? Follows the computed sentence on
   * what the page covers.
   */
  density: template('The same steps work for roomy pages and dense data views, so density comes from which steps you pick.'),

  /* ---------- 1.4 Shape ---------- */

  /**
   * What corner character does the system have, and why? First sentence of the Overview. `character`
   * is computed from radius/control: sharp, soft or round.
   */
  cornerCharacter: template(({ name, character }: { name: string; character: string }) => `${name} uses ${character} corners, applied to every role at once.`),

  /** Why does this corner character suit the product? The middle sentence of the "Corner character" guideline. */
  cornerWhy: template(({ name, character }: { name: string; character: string }) => `${name} uses ${character} corners.`),

  /* ---------- 1.5 Elevation ---------- */

  /**
   * Which depth direction does the system take? Second sentence of "How depth works". `depth` is
   * computed from the elevation styles (flat surfaces, layered shadows or a tactile edge).
   */
  depthDirection: template(({ name, depth }: { name: string; depth: string }) => `${name} uses ${depth}.`),

  /** Why does this depth direction suit the product? Second sentence of the "Depth is a choice" guideline. */
  depthWhy: template(({ name, depth }: { name: string; depth: string }) => `${name} uses ${depth}.`),

  /** Which components use backdrop blur, and over what? Shown only when the file has blur styles. */
  backdropBlurUse: template(
    'Translucent panels over photos and video blur what’s behind them, so the controls on top stay readable. Use them for overlays and floating panels over media, and pick a stronger blur over busier content.',
  ),

  /* ---------- 1.6 Motion ---------- */

  /** What character does the motion have? The opening of the Principles section. */
  motionPrinciple: template(
    ({ name }: { name: string }) =>
      `Motion in the ${name} is calm and quick. It explains change rather than decorating: where something came from, where it went, what responded. Every transition also has a reduced version, so nobody needs movement to understand the screen.`,
  ),

  /** The motion character as a principle card: rewrite it when the brand's motion is livelier (longer values, overshoot curves). */
  motionCharacter: template({
    title: 'Quick and calm',
    text: 'Durations are short and curves are gentle. The result is ready the moment someone acts, so the transition never makes them wait.',
  }),

  /* ---------- 1.7 Iconography ---------- */

  /**
   * How does the icon library draw? `kind` outline, filled or duotone, and the stroke in px on a
   * 24 box. The defaults match the template registry (src/icons: outline icons, stroke 2).
   */
  iconStyle: template({ kind: 'outline', stroke: 2 }),

  /* ---------- 1.8 Brand assets ---------- */

  /** How small may the logo go? Minimum sizes in px, from the logo rules in the Figma Guidelines frame. */
  logoMinSize: template({ mark: 16, lockup: 24 }),

  /** What clear space and minimum size does the logo need? The Overview paragraph. */
  logoClearSpace: template(
    ({ mark, lockup }: { mark: number; lockup: number }) =>
      `Leave empty space around the logo equal to the mark’s height on every side, so nothing crowds it. Keep the mark at ${mark} pixels or larger and the lockup at least ${lockup} pixels high. Any smaller and its details stop reading.`,
  ),

  /** The same rules as a guideline: resizing, clear space and minimum size. */
  logoResizing: template(
    ({ mark, lockup }: { mark: number; lockup: number }) =>
      `Always resize proportionally: set the height and let the width follow. Leave clear space equal to the mark’s height on every side. Keep the mark at ${mark} pixels or more and the lockup at least ${lockup} pixels high. When a mark’s owner publishes their own rules, follow those.`,
  ),

  /**
   * Which other asset kinds are in scope, and what is their status? Logo, social marks and flags are
   * computed; list the rest from the Figma 1.8 Brand assets page.
   */
  otherAssetKinds: template([
    { kind: 'Partner, payment and app-store marks, file types', count: '—', use: 'Added when the product needs them', status: 'Not in scope yet', tone: 'off' },
  ]),

  /** Optional. Hand-tuned heights (px) for social marks, when the Guidelines frame sets them; they win over the computed optical sizes. */
  socialMarkHeights: template({}),

  /** Where did the flag set come from, and under what license? */
  flagSource: template('Supplied with the build · record the source'),
};
