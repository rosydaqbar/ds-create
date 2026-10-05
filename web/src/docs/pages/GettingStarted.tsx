import { config } from '@/ds.config';
import { PageHeader } from '../ComponentPage';
import { Bullets, CodeBlock, InlineCode, P, Section } from '../blocks';

export default function GettingStarted() {
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Guidance › 01 Getting started" title="Getting started" description={`How to use ${config.name} in a web product: install the tokens, switch modes, use the components and keep code in sync with Figma.`} />
      <Section title="What is inside" description="The web version mirrors the Figma file page for page. Every component has the same properties as its Figma set, and every value comes from the same variables.">
        <Bullets
          items={[
            <>Foundations — colour, type, space, shape, elevation, motion, icons and brand assets as CSS variables and Tailwind utilities.</>,
            <>Parts, Components and Sections — React components whose props are the Figma properties (<InlineCode>Size=md</InlineCode> → <InlineCode>size="md"</InlineCode>).</>,
            <>This explorer — every page shows Overview, Component (all variants + playground), Anatomy (props and tokens), Guidelines and Code.</>,
          ]}
        />
      </Section>
      <Section title="1 · Add the styles" description="Tailwind v4 reads the theme from CSS. Import Tailwind, then the generated tokens, then the state variants.">
        <CodeBlock
          lang="css"
          code={`/* app.css */
@import "tailwindcss";
@import "./design-system/tokens.css";   /* generated: variables, theme, text styles */

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
@custom-variant is-hover { &:where([data-force="hover"]) { @slot; } @media (hover: hover) { &:where(:hover) { @slot; } } }
@custom-variant is-pressed (&:where(:active, [data-force="pressed"]));
@custom-variant is-focus (&:where(:focus-visible, [data-force="focus"]));
@custom-variant is-focus-within (&:where(:has(:focus-visible), [data-force="focus"]));
@custom-variant is-disabled (&:where(:disabled, [aria-disabled="true"], [data-disabled="true"]));`}
        />
        <P>
          Copy <InlineCode>src/styles/tokens.css</InlineCode>, <InlineCode>src/components</InlineCode>, <InlineCode>src/icons</InlineCode> and <InlineCode>src/lib</InlineCode> into the product, or publish them as a package.
        </P>
      </Section>
      <Section title="2 · Use tokens as Tailwind utilities" description="Every token name becomes a utility. The names are the Figma variable names with slashes as dashes.">
        <CodeBlock
          code={`<div className="rounded-surface bg-surface-raised p-xl shadow-raised">
  <h2 className="type-heading-sm-semibold text-text-primary">Storage</h2>
  <p className="type-body-sm-regular text-text-tertiary">1.2 TB of 2 TB used</p>
</div>`}
        />
        <P>Outside Tailwind, use the CSS variables directly: <InlineCode>var(--color-text-primary)</InlineCode>, <InlineCode>var(--space-md)</InlineCode>, <InlineCode>var(--radius-control)</InlineCode>.</P>
      </Section>
      <Section title="3 · Switch colour modes" description="Set data-theme on <html> — or on any element to theme just that subtree. Reduced motion follows the operating system, or data-motion=&quot;reduced&quot;.">
        <CodeBlock code={`document.documentElement.dataset.theme = 'dark'; // 'light' | 'dark'

<section data-theme="dark">…always dark…</section>`} />
      </Section>
      <Section title="4 · Use components" description="Props follow the Figma properties, so a design spec reads straight into code.">
        <CodeBlock
          code={`import { Button } from '@/components';

// Figma: Button · Size=lg, Emphasis=primary, Tone=brand, Show leading icon=true
<Button size="lg" leadingIcon="general/check" label="Save changes" />`}
        />
      </Section>
      <Section title="5 · Keep code in sync with Figma" description="Figma is the source of truth. When variables or styles change there, regenerate the code formats.">
        <Bullets
          items={[
            <>Run <InlineCode>web/scripts/figma-export.js</InlineCode> on the Figma file (as a <InlineCode>use_figma</InlineCode> script) and save the result as <InlineCode>tokens/figma-variables.json</InlineCode>.</>,
            <>Run <InlineCode>npm run tokens</InlineCode>: it writes <InlineCode>src/styles/tokens.css</InlineCode>, <InlineCode>src/tokens/tokens.gen.ts</InlineCode> and <InlineCode>tokens/tokens.dtcg.json</InlineCode>.</>,
            <>Components never hold raw values, so they update without edits.</>,
          ]}
        />
      </Section>
    </article>
  );
}
