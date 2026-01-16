import { html } from 'lit';

function checkboxMulti(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  return html`<p>checkbox multi: ${field.label}</p>`;
}

export default {
  'checkbox-multiple': checkboxMulti
}