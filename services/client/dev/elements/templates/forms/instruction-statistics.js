import { html } from 'lit';

/**
 * @description Render function for Instruction Statistics Form
 * Just a test example
 * @param {FormEntryController} ctl 
 * @returns 
 */
function render(ctl) { 
  return html`
    <p> i am the instruction stats form: ${ctl.hostIsForm ? 'TRUE' : 'FALSE'} ${this.tagName}</p>
    <ref-stats-form-entry-field field="affiliation"></ref-stats-form-entry-field>
  `;}


export default {
  name: 'instruction-statistics',
  render: render
}