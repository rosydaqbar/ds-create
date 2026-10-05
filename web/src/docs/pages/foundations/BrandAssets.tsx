import { config } from '@/ds.config';
import { PageHeader } from '../../ComponentPage';
import { Bullets, CodeBlock, InlineCode, Section } from '../../blocks';

export default function BrandAssets() {
  return (
    <article className="flex flex-col gap-4xl">
      <PageHeader eyebrow="Foundations › 1.8 Brand assets" title="Brand assets" description="Logos and third-party marks are files in public/brand/, exported from the Figma page 1.8 Brand assets. Replace a file and every use updates." />
      <Section title="Logo">
        <div className="grid gap-xl md:grid-cols-2">
          <div data-theme="light" className="flex h-40 items-center justify-center rounded-surface border border-border-subtle bg-surface-base">
            <img src={config.logo.light} alt={`${config.name} logo`} className="h-10" />
          </div>
          <div data-theme="dark" className="flex h-40 items-center justify-center rounded-surface bg-surface-base">
            <img src={config.logo.dark} alt={`${config.name} logo`} className="h-10" />
          </div>
        </div>
        <CodeBlock code={`<img src="brand/lockup-light.svg" alt="${config.name}" className="h-8 dark:hidden" />
<img src="brand/lockup-dark.svg" alt="${config.name}" className="hidden h-8 dark:block" />`} />
      </Section>
      <Section title="Rules">
        <Bullets
          items={[
            <>Export each asset from Figma as SVG into <InlineCode>public/brand/</InlineCode> with the names in <InlineCode>ds.config.ts</InlineCode>.</>,
            'Use the light version on light surfaces and the dark version on dark surfaces; never recolour or stretch a logo.',
            'Third-party marks (social, payment, flags) keep their owners’ rules and need approval before release.',
            'Logos have an accessible name (the product name); decorative marks are hidden from assistive technology.',
          ]}
        />
      </Section>
    </article>
  );
}
