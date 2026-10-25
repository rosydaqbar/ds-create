/** Maintainer-only static render. Builder uses the real web components without a React runtime. */
import { renderToStaticMarkup } from 'react-dom/server';
import { Button } from '../src/components/parts/Button';
import { IconButton } from '../src/components/parts/IconButton';
import { Label } from '../src/components/parts/Label';
import { HelpText } from '../src/components/parts/HelpText';
import { TextField, TextareaField } from '../src/components/components/TextField';
import { ChoiceField } from '../src/components/components/ChoiceField';
import { interfaceModes, interfaceDevices } from '../../manager/setup-options.mjs';

function Choices({ id, label, choices }: { id: string; label: string; choices: string[] }) {
  return <div className="setup-field">
    <Label as="span" id={`${id}-label`} label={label} />
    <div id={id} className="grid grid-cols-2 gap-xl" role="group" aria-labelledby={`${id}-label`}>
      {choices.map(value => <ChoiceField key={value} size="sm" type="checkbox" text={value} value={value} name={id} />)}
    </div>
  </div>;
}

export const markup = renderToStaticMarkup(
  <dialog id="setup-dialog" className="publish-dialog setup-dialog" aria-labelledby="setup-title" aria-describedby="setup-description">
    <div className="publish-header"><h2 id="setup-title" className="type-heading-md-semibold">Set up your design system</h2><IconButton id="setup-close" label="Close setup" /></div>
    <nav id="setup-stepper" aria-label="Setup steps"><ol className="init-steps">
      <li id="setup-step-1" className="step building"><Button emphasis="tertiary" fullWidth data-setup-goto="1" aria-current="step" label={<span className="whitespace-normal text-start">1. General</span>} /><small id="setup-step-state-1">Current step</small></li>
      <li id="setup-step-2" className="step"><Button emphasis="tertiary" fullWidth data-setup-goto="2" label={<span className="whitespace-normal text-start">2. Interface details</span>} /><small id="setup-step-state-2">Not started</small></li>
    </ol></nav>
    <p id="setup-description" className="publish-intro">Describe your product and the design system you need. Add any briefs, brand guidelines, or existing tokens.</p>
    <p id="setup-simulation" className="notice" hidden>Simulation · no real agent or Figma calls.</p>
    <p id="setup-step-label" className="sr-only" role="status" tabIndex={-1}>Step 1 of 2 · General</p>
    <form id="setup-initial">
      <section id="setup-general" className="setup-fields" aria-label="General">
        <TextField id="setup-project-name" name="projectName" label="Project name" required maxLength={100} autoComplete="off" placeholder="e.g. Acme Design System" hint="Names your design system and its input folder on first save." />
        <TextareaField id="setup-context" label="Context / Instruction" rows={4} maxLength={20000} placeholder="What is your product, who uses it, and what should its interface feel like? Include any colors, fonts, or constraints you already have." />
        <div className="setup-field">
          <Label as="span" id="setup-files-label" label={<>Context files <span className="setup-optional">Optional</span></>} />
          <div id="setup-drop" className="setup-drop">
            <input id="setup-files" className="sr-only" tabIndex={-1} type="file" multiple aria-labelledby="setup-files-label" aria-describedby="setup-files-help" />
            <Button id="setup-add-files" emphasis="secondary" label="Choose files" /><p>or drop them here</p>
            <HelpText id="setup-files-help" hint={<>Briefs, guidelines, images, or token exports.<br />Up to 10 files · 25 MB each · 50 MB total.</>} />
          </div><ul id="setup-file-list" className="setup-files" />
        </div>
      </section>
      <section id="setup-interface" className="setup-fields" aria-label="Interface details" hidden>
        <Choices id="setup-modes" label="Appearance modes" choices={interfaceModes} />
        <Choices id="setup-devices" label="Devices / platforms" choices={interfaceDevices} />
        <div className="setup-field"><Label as="span" label="Tokenization" /><HelpText hint={<><strong>Web docs:</strong> Tailwind only for now.</>} /><HelpText hint={<><strong>App docs:</strong> Token references will be available for React Native, Swift, and Kotlin.</>} /></div>
      </section>
      <p id="setup-agent-note" className="setup-note" hidden>Your background worker prepares foundations from this saved context.</p>
    </form>
    <p id="setup-state" className="setup-note" role="status" aria-live="polite" hidden />
    <div id="setup-saved" hidden><details className="setup-context-details"><summary>Saved context and files</summary><p>Project name: <strong id="setup-saved-project" /></p><p id="setup-saved-context" /><p id="setup-saved-interface" hidden /><ul id="setup-saved-files" className="setup-files" /></details><p id="setup-storage" className="setup-note" /><p id="setup-revision-note" className="setup-note" /><Button id="setup-edit" emphasis="secondary" label="Edit context / add files" /></div>
    <details id="setup-resume" className="setup-resume setup-context-details"><summary>Continue in another agent chat?</summary><div className="setup-resume-body"><p className="setup-resume-project"><span>Project name</span><code id="setup-resume-project" /></p><p className="setup-resume-help">Paste this command into a new agent chat to reopen this project with its saved context.</p><code id="setup-resume-command" /><Button id="setup-copy-resume" emphasis="secondary" label="Copy resume command" /></div></details>
    <p id="setup-error" className="setup-error" role="alert" hidden />
    <template id="setup-remove-file"><IconButton data-remove-file="" label="Remove file" /></template>
    <div className="publish-footer setup-footer">
      <Button id="setup-explore" emphasis="tertiary" label="Explore Builder" />
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
