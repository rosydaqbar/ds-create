/** Maintainer-only static render. Builder uses the real web components without a React runtime. */
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactNode } from 'react';
import { Icon } from '../src/icons';
import { Button } from '../src/components/parts/Button';
import { IconButton } from '../src/components/parts/IconButton';
import { Label } from '../src/components/parts/Label';
import { HelpText } from '../src/components/parts/HelpText';
import { Badge } from '../src/components/parts/Badge';
import { Divider } from '../src/components/parts/Divider';
import { TextField, TextareaField } from '../src/components/components/TextField';
import { ChoiceCard } from '../src/components/components/ChoiceField';
import { StepNavigation } from '../src/components/components/StepNavigation';
import { interfaceModes, interfacePlatforms } from '../../manager/setup-options.mjs';

function SettingRow({ label, id, htmlFor, required, optional, children }: {
  label: string; id?: string; htmlFor?: string; required?: boolean; optional?: boolean; children: ReactNode;
}) {
  return <div className="docs-home-section grid grid-cols-1 items-start gap-lg sm:grid-cols-3 sm:gap-3xl">
    <Label as={htmlFor ? 'label' : 'span'} id={id} htmlFor={htmlFor} showRequired={required}
      className={htmlFor ? 'sm:pt-md' : id === 'setup-modes-label' ? 'sm:pt-lg' : undefined}
      label={<>{label}{optional && <span className="setup-optional">Optional</span>}</>} />
    <div className="min-w-0 sm:col-span-2">{children}</div>
  </div>;
}

export const markup = renderToStaticMarkup(
  <dialog id="setup-dialog" className="publish-dialog setup-dialog" aria-labelledby="setup-title" aria-describedby="setup-description">
    <div className="publish-header docs-page-header"><h2 id="setup-title" className="type-heading-md-semibold">Set up your design system</h2><IconButton id="setup-close" label="Close setup" /></div>
    <StepNavigation id="setup-stepper" steps={['General', 'Interface details']} />
    <p id="setup-description" className="publish-intro">Describe your product and the design system you need. Add any briefs, brand guidelines, or existing tokens.</p>
    <p id="setup-simulation" className="notice" hidden>Simulation · no real agent or Figma calls.</p>
    <p id="setup-step-label" className="sr-only" role="status" tabIndex={-1}>Step 1 of 2 · General</p>
    <form id="setup-initial">
      <section id="setup-general" className="docs-reading-card setup-settings" aria-label="General">
        <SettingRow label="Project name" htmlFor="setup-project-name" required>
          <TextField id="setup-project-name" name="projectName" required maxLength={100} autoComplete="off" placeholder="e.g. Acme Design System" hint="Names your design system and its input folder on first save." />
        </SettingRow>
        <SettingRow label="Context / Instruction" htmlFor="setup-context">
          <TextareaField id="setup-context" rows={4} maxLength={20000} placeholder="What is your product, who uses it, and what should its interface feel like? Include any colors, fonts, or constraints you already have." />
        </SettingRow>
        <SettingRow label="Context files" id="setup-files-label" optional>
          <div id="setup-drop" className="setup-drop">
            <input id="setup-files" className="sr-only" tabIndex={-1} type="file" multiple aria-labelledby="setup-files-label" aria-describedby="setup-files-help" />
            <Button id="setup-add-files" emphasis="secondary" label="Choose files" /><p>or drop them here</p>
            <HelpText id="setup-files-help" hint={<>Briefs, guidelines, images, or token exports.<br />Up to 10 files · 25 MB each · 50 MB total.</>} />
          </div><ul id="setup-file-list" className="setup-files" />
        </SettingRow>
      </section>
      <section id="setup-interface" className="docs-reading-card setup-settings" aria-label="Interface details" hidden>
        <SettingRow label="Appearance modes" id="setup-modes-label">
          <div id="setup-modes" className="grid grid-cols-2 gap-md" role="group" aria-labelledby="setup-modes-label">
            {interfaceModes.map(value => <ChoiceCard key={value} size="sm" breakpoint="mobile" type="checkbox" name="setup-modes" value={value}
              text={<span className="flex items-center gap-md"><Icon name={value === 'Light' ? 'weather/sun' : 'weather/moon'} size="sm" />{value}</span>}
              subtext={null} supportingText={null} />)}
          </div>
        </SettingRow>
        <SettingRow label="Platforms" id="setup-devices-label">
          <div className="grid gap-md"><div id="setup-devices" className="grid grid-cols-2 gap-md" role="group" aria-labelledby="setup-devices-label">
            {interfacePlatforms.map(value => <ChoiceCard key={value} size="sm" breakpoint="mobile" type="checkbox" name="setup-devices" value={value}
              text={<span className="flex items-center gap-md"><Icon name={value === 'Web' ? 'media/monitor' : 'media/smartphone'} size="sm" />{value}</span>}
              subtext={null} supportingText={null} />)}
          </div><HelpText hint="Choose one or both. Add device details in your context." /></div>
        </SettingRow>
        <SettingRow label="Tokenization" id="setup-tokenization-label">
          <div className="grid gap-xl" role="group" aria-labelledby="setup-tokenization-label">
            <div id="setup-tokenization-empty" className="flex items-start gap-md">
              <Icon name="development/code" size="md" className="text-icon-tertiary" />
              <HelpText hint="Choose Web, App, or both to see token formats." />
            </div>
            <div id="setup-tokenization-web" className="grid gap-md" hidden>
              <div className="flex items-center gap-md type-body-sm-medium text-text-secondary"><Icon name="media/monitor" size="sm" />Web docs</div>
              <div className="flex flex-wrap gap-md"><Badge size="md" type="outline" label="Tailwind" /></div>
            </div>
            <Divider id="setup-tokenization-divider" decorative hidden />
            <div id="setup-tokenization-app" className="grid gap-md" hidden>
              <div className="flex items-center gap-md type-body-sm-medium text-text-secondary"><Icon name="media/smartphone" size="sm" />App docs</div>
              <div className="flex flex-wrap gap-md">{['React Native', 'Swift', 'Kotlin'].map(format => <Badge key={format} size="md" type="outline" label={format} />)}</div>
            </div>
            <div id="setup-tokenization-context" className="flex items-start gap-md" hidden>
              <Icon name="alerts/info-circle" size="md" className="text-icon-tertiary" />
              <HelpText hint="Token formats for these platforms follow your project context." />
            </div>
            <span id="setup-tokenization-status" className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
          </div>
        </SettingRow>
      </section>
      <p id="setup-agent-note" className="setup-note" hidden>Your background worker prepares foundations from this saved context.</p>
    </form>
    <p id="setup-state" className="setup-note" role="status" aria-live="polite" hidden />
    <div id="setup-saved" hidden><details className="setup-context-details"><summary>Saved context and files</summary><p>Project name: <strong id="setup-saved-project" /></p><p id="setup-saved-context" /><p id="setup-saved-interface" hidden /><ul id="setup-saved-files" className="setup-files" /></details><p id="setup-storage" className="setup-note" /><p id="setup-revision-note" className="setup-note" /><Button id="setup-edit" emphasis="secondary" label="Edit context / add files" /></div>
    <details id="setup-resume" className="setup-resume setup-context-details"><summary>Continue in another agent chat?</summary><div className="setup-resume-body"><p className="setup-resume-project"><span>Project name</span><code id="setup-resume-project" /></p><p className="setup-resume-help">Paste this command into a new agent chat to reopen this project with its saved context.</p><code id="setup-resume-command" /><Button id="setup-copy-resume" emphasis="secondary" label="Copy resume command" /></div></details>
    <p id="setup-error" className="setup-error" role="alert" hidden />
    <template id="setup-remove-file"><IconButton data-remove-file="" label="Remove file" /></template>
    <div className="publish-footer setup-footer">
      <Button id="setup-explore" size="sm" emphasis="tertiary" label="Explore Builder" />
      <Button id="setup-edit-cancel" emphasis="secondary" hidden label="Cancel edit" />
      <Button id="setup-stop" emphasis="secondary" hidden label="Cancel preparation" />
      <Button id="setup-retry" hidden label="Retry preparation" />
      <Button id="setup-back" emphasis="secondary" hidden label="Back" />
      <Button id="setup-next" label="Next" />
      <Button id="setup-submit" hidden type="submit" form="setup-initial" label="Prepare foundations" />
      <Button id="setup-review" hidden label="Review foundations" />
    </div>
  </dialog>
);
