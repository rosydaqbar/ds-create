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
import { FeaturedIcon } from '../src/components/parts/FeaturedIcon';
import { TextField, TextareaField } from '../src/components/components/TextField';
import { ChoiceCard } from '../src/components/components/ChoiceField';
import { StepNavigation } from '../src/components/components/StepNavigation';
import { interfaceModes, interfacePlatforms } from '../../manager/shared/interface.mjs';
import { builderSettings } from '../../manager/shared/ui-settings.mjs';

function SettingRow({ label, id, htmlFor, required, optional, rowId, savedInterface, children }: {
  label: string; id?: string; htmlFor?: string; required?: boolean; optional?: boolean; rowId?: string; savedInterface?: boolean; children: ReactNode;
}) {
  return <div id={rowId} data-saved-interface={savedInterface ? '' : undefined} className="docs-home-section grid grid-cols-1 items-start gap-lg sm:grid-cols-3 sm:gap-3xl">
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
    <div id="setup-state" className="setup-status" data-tone="info" role="status" aria-live="polite" hidden>
      <Icon name="alerts/check-circle" size="md" data-tone-icon="success" />
      <Icon name="alerts/alert-triangle" size="md" data-tone-icon="warning" />
      <Icon name="alerts/x-circle" size="md" data-tone-icon="danger" />
      <Icon name="alerts/info-circle" size="md" data-tone-icon="info" />
      <p id="setup-state-text" className="m-0 type-body-sm-medium" />
    </div>
    <div id="setup-stats" className="setup-stats" role="group" aria-label="Design system progress" hidden>
      {[['foundations', 'Foundations'], ['parts', 'Parts'], ['sections', 'Sections'], ['layouts', 'Layouts']].map(([key, label]) =>
        <div key={key} className="setup-stat" data-stat={key}><span className="type-body-sm-medium text-text-secondary">{label}</span><strong className="type-heading-md-semibold text-text-primary" data-stat-value>0</strong><span className="type-body-sm-regular text-text-tertiary" data-stat-note /></div>)}
    </div>
    <div id="setup-saved" hidden>
      <section className="docs-reading-card setup-settings setup-saved-card" aria-label="Saved context">
        <SettingRow label="Project name">
          <p id="setup-saved-project" className="m-0 type-body-md-regular text-text-primary setup-saved-value" />
        </SettingRow>
        <SettingRow label="Context / Instruction">
          <p id="setup-saved-context" className="m-0 type-body-sm-regular text-text-secondary setup-saved-context" />
        </SettingRow>
        <SettingRow label="Appearance modes" savedInterface>
            <div className="flex flex-wrap gap-md">
              {interfaceModes.map(value => <Badge key={value} data-saved-mode={value} size="md" type="outline" leadingIcon={value === 'Light' ? 'weather/sun' : 'weather/moon'} label={value} hidden />)}
            </div>
        </SettingRow>
        <SettingRow label="Platforms" savedInterface>
            <div className="flex flex-wrap gap-md">
              {interfacePlatforms.map(value => <Badge key={value} data-saved-platform={value} size="md" type="outline" leadingIcon={value === 'Web' ? 'media/monitor' : 'media/smartphone'} label={value} hidden />)}
            </div>
        </SettingRow>
        <SettingRow label="Context files">
          <ul id="setup-saved-files" className="setup-saved-files" />
          <HelpText id="setup-saved-files-empty" hint="No files. The context above is the only source." hidden />
        </SettingRow>
        <SettingRow label="Saved in">
          <div className="grid gap-md">
            <div className="flex flex-wrap items-center gap-md"><code id="setup-storage" className="setup-saved-path" /><Badge id="setup-revision" size="sm" tone="neutral" label="Revision" /></div>
            <HelpText id="setup-revision-note" hint="Replacing a file with the same name keeps its earlier version. Saved answers stay available." />
          </div>
        </SettingRow>
      </section>
      <div className="setup-saved-actions"><Button id="setup-edit" emphasis="secondary" leadingIcon="general/edit" label="Edit context / add files" /></div>
    </div>
    <template id="setup-saved-file"><li className="setup-saved-file"><FeaturedIcon type="square" size="sm" tone="neutral" icon="files/file-text" /><span className="grid min-w-0"><span data-file-name className="type-body-sm-medium text-text-primary" /><span data-file-meta className="type-body-sm-regular text-text-tertiary" /></span></li></template>
    <details id="setup-resume" className="setup-resume docs-reading-card">
      <summary><Icon name="development/terminal" size="md" className="text-icon-tertiary" /><span className="type-body-sm-medium text-text-primary">Continue in another agent chat</span><Icon name="arrows/chevron-down" size="sm" className="setup-resume-chevron text-icon-tertiary" /></summary>
      <div className="setup-resume-body">
        <HelpText hint="Paste this command into a new agent chat to reopen this project with its saved context." />
        <p className="setup-resume-project"><span className="type-body-sm-medium text-text-secondary">Project</span><code id="setup-resume-project" /></p>
        <code id="setup-resume-command" className="setup-resume-command" />
        <Button id="setup-copy-resume" size="sm" emphasis="secondary" leadingIcon="general/copy" label="Copy resume command" />
      </div>
    </details>
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
      <Button id="setup-review" hidden label="Review" />
    </div>
  </dialog>
);


/** Status controls share the same components as Context, rendered for Builder's static client. */
export const workerMarkup = renderToStaticMarkup(
  <div id="worker-shell">
  <section id="worker-connection" className="shrink-0 min-w-0 px-xl py-lg border-b-(length:--border-width-default) border-border-subtle bg-surface-base data-[connection=disconnected]:m-xl data-[connection=disconnected]:p-xl data-[connection=disconnected]:border-(length:--border-width-default) data-[connection=disconnected]:border-border-warning-subtle data-[connection=disconnected]:rounded-control data-[connection=disconnected]:bg-surface-raised data-[state=attention]:m-xl data-[state=attention]:p-xl data-[state=attention]:border-(length:--border-width-default) data-[state=attention]:border-border-warning-subtle data-[state=attention]:rounded-control data-[state=attention]:bg-surface-raised" aria-label="Agent status" tabIndex={-1} data-state="checking">
    {/* Same anatomy as the Appearance panel: title with status, one sentence, detail rows, full-width action. */}
    <div className="workspace-panel-header"><h2>Connection</h2><span id="worker-connection-label" role="status" aria-live="polite">
      <Badge id="worker-status-connected" size="sm" tone="success" showDot label="Connected" hidden />
      <Badge id="worker-status-disconnected" size="sm" tone="warning" showDot label="Not connected" hidden />
      <Badge id="worker-status-idle" size="sm" tone="neutral" showDot label="Idle" hidden />
      <Badge id="worker-status-delivered" size="sm" tone="info" showDot label="Request delivered" hidden />
      <Badge id="worker-status-unknown" size="sm" tone="neutral" showDot label="Checking…" />
    </span></div>
    <p id="worker-connection-detail" className="workspace-disclaimer">Checking whether Builder events can reach your agent.</p>
    <div id="worker-job" className="worker-job" data-active="false">
      <Icon name="time/history" size="md" className="text-icon-tertiary" />
      <strong id="worker-job-title" className="type-body-sm-semibold text-text-primary">No active job</strong>
      <span id="worker-job-text" className="type-body-sm-regular text-text-tertiary">Prepare and Publish requests from Builder show up here.</span>
    </div>
    <section id="worker-recovery" className="inspector-section" hidden><h3>Continue in a new chat</h3>
      <TextareaField id="worker-spawn-prompt" label="Continuation prompt" rows={builderSettings.continuationPromptRows} readOnly spellCheck={false} />
      <div className="mt-md flex flex-wrap items-center gap-md"><Button id="worker-copy-prompt" size="sm" leadingIcon="general/copy" label="Copy continuation prompt" /><span id="worker-copy-feedback" className="text-text-secondary" role="status" aria-live="polite" /></div>
    </section>
    <section id="change-requests" className="change-requests" aria-labelledby="change-requests-title" hidden>
      <h3 id="change-requests-title">Change requests</h3>
      <div id="change-request-list" className="change-request-list" />
      <div className="change-request-actions"><Button id="change-request-copy" size="sm" leadingIcon="general/copy" label="Copy prompt" /><span id="change-request-copied" className="type-body-sm-regular text-text-secondary" role="status" aria-live="polite" /></div>
      <p id="change-request-status" className="type-body-sm-regular text-text-danger" role="status" aria-live="polite" />
    </section>
    <template id="change-request-card"><article className="change-request">
      <div className="change-request-head"><Badge size="sm" tone="info" label="Change Request" /><IconButton data-change-remove="" size="sm" emphasis="tertiary" icon="general/x" label="Remove change request" /></div>
      <p className="change-request-path type-body-xs-medium text-text-tertiary" data-change-path />
      <strong className="change-request-item type-body-sm-semibold text-text-primary" data-change-item />
      <p className="change-request-details type-body-sm-regular text-text-secondary" data-change-details />
      <ul className="change-request-notes" data-change-notes />
      <div className="change-request-form" data-change-form hidden><textarea className="change-request-input" rows={3} maxLength={2000} aria-label="Note for this change" placeholder="What should change?" /><div className="flex flex-wrap gap-sm"><Button data-change-save="" size="sm" label="Save note" /><Button data-change-cancel="" size="sm" emphasis="tertiary" label="Cancel" /></div></div>
      <Button data-change-add-note="" size="sm" emphasis="secondary" leadingIcon="general/plus" label="Add Notes" />
    </article></template>
    <template id="change-request-note"><li className="change-request-note"><span className="type-body-sm-regular text-text-primary" data-note-text /><IconButton data-note-remove="" size="sm" emphasis="tertiary" icon="general/trash" label="Remove note" /></li></template>
    <div className="workspace-reset"><Button id="worker-recheck" emphasis="secondary" leadingIcon="general/refresh" className="w-full" label="Check again" /><small>Builder also checks on its own every few seconds.</small></div>
  </section>
  </div>
);
