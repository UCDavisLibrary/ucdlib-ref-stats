import { html } from 'lit';

/**
 * @description Render function for Instruction Statistics Form
 * Just a test example
 * @param {FormEntryController} ctl 
 * @returns 
 */
function render(ctl) { 
  return html`
    <ref-stats-form-entry-field field="affiliation"></ref-stats-form-entry-field>
    <ref-stats-form-entry-field field="instructor-session-type"></ref-stats-form-entry-field>
    <ref-stats-form-entry-field field="department" multiple></ref-stats-form-entry-field>
    <ref-stats-form-entry-field field="florg" multiple></ref-stats-form-entry-field>
    <ref-stats-form-entry-field field="dei-focus"></ref-stats-form-entry-field>
    <ref-stats-form-entry-field field="participant-count" step='1' min='0'></ref-stats-form-entry-field>
  `;}


export default {
  name: 'instruction-statistics',
  render: render
}