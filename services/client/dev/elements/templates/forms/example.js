import { html } from 'lit';

/**
 * @description Example custom render function for a form.
 * Will be used instead of the default render function for the form with name "example".
 * @param {FormEntryController} ctl 
 * @returns 
 */
function render(ctl) { 
  return html`
    <form @submit=${ctl._onSubmit.bind(ctl)}>
      <ref-stats-form-entry-field field="foo"></ref-stats-form-entry-field>
      <ref-stats-form-entry-field field="bar"></ref-stats-form-entry-field>
      <ref-stats-form-entry-field field="baz"></ref-stats-form-entry-field>
      ${ ctl.renderActionButtons() }
    </form>
  `;}

export default {
  name: 'example',
  render: render
}