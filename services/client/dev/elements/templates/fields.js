import { html } from 'lit';
import {ifDefined} from 'lit/directives/if-defined.js';

function checkboxMulti(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this.noFieldContainer ? '' : 'field-container'}>
      <label>${field.label}</label>
      <div class='checkbox'>
        ${ctl.fieldPicklistItems.map( item => html`
          <div class='checkbox-item'>
            <div>
              <input 
                type="checkbox"
                name=${field.name}
                id=${ctl.idGen.get(`field-${field.name}-item-${item.value}`)}
                .checked=${(ctl.payload?.[field.name] || []).includes(item.value)}
                @input=${() => ctl.togglePayloadArrayItem(field.name, item.value)}>
              <label for=${ctl.idGen.get(`field-${field.name}-item-${item.value}`)}>
                ${item.label}
              </label>
            </div>
            <div class='field-description' ?hidden=${!item.description}>${item.description}</div>
          </div>
          `)}
      </div>
    </cork-field-container>
  `;
}

function radio(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this.noFieldContainer ? '' : 'field-container'}>
      <label>${field.label}</label>
      <div class='radio'>
        ${ctl.fieldPicklistItems.map( item => html`
          <div class='radio-item'>
            <div>
              <input 
                type="radio" 
                name=${field.name}
                id=${ctl.idGen.get(`field-${field.name}-item-${item.value}`)}
                .checked=${(ctl.payload?.[field.name] || []).includes(item.value)}
                @input=${() => ctl.setPayloadField(field.name, item.value)}>
              <label for=${ctl.idGen.get(`field-${field.name}-item-${item.value}`)}>
                ${item.label}
              </label>
            </div>
            <div class='field-description' ?hidden=${!item.description}>${item.description}</div>
          </div>
          `)}
      </div>
    </cork-field-container>
  `;
}

function select(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  const onChange = (e) => {
    if ( this.multiple ) {
      ctl.setPayloadField(field.name, e.detail.map( o => o.value ));
    } else {
      ctl.setPayloadField(field.name, e.detail?.value);
    }
  };
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this.noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${field.label}</label>
      <ucd-theme-slim-select @change=${onChange}>
        <select
          id=${ctl.idGen.get(`field-${field.name}`)}
          ?multiple=${this.multiple}>
          ${ctl.fieldPicklistItems.map( item => html`
            <option 
              value=${item.value}
              ?selected=${this.multiple ? (ctl.payload?.[field.name] || []).includes(item.value) : ctl.payload?.[field.name] === item.value}>
              ${item.label}
            </option>
          `)}
        </select>
      </ucd-theme-slim-select>
    </cork-field-container>
  `;
}

function checkbox(ctl){
  const field = ctl.fields.find( f => this.field === f.name );
  return html`
    <div class='checkbox-single ${this.noFieldContainer ? '' : 'field-container'}'>
      <cork-field-container schema=${ctl.form?.name} path=${field.name} class='checkbox'>
        <input 
          type="checkbox"
          name=${field.name}
          id=${ctl.idGen.get(`field-${field.name}`)}
          .checked=${!!ctl.payload?.[field.name]}
          @input=${() => ctl.setPayloadField(field.name, !ctl.payload?.[field.name])}>
        <label for=${ctl.idGen.get(`field-${field.name}`)}>
          ${field.label}
        </label>
      </cork-field-container>
      <div class='field-description' ?hidden=${!field.description}>${field.description}</div>
    </div>
  `;
}

function number(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this.noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${field.label}</label>
      <input 
        type="number"
        id=${ctl.idGen.get(`field-${field.name}`)}
        .value=${ctl.payload?.[field.name] !== undefined || null ? ctl.payload?.[field.name] : ''}
        min=${ifDefined(this.min)}
        max=${ifDefined(this.max)}
        step=${ifDefined(this.step)}
        placeholder=${ifDefined(this.placeholder)}
        @input=${(e) => ctl.setPayloadField(field.name, e.target.value ? Number(e.target.value) : null)}>
      <div class='field-description' ?hidden=${!field.description}>${field.description}</div>
    </cork-field-container>
  `;
}

function text(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this.noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${field.label}</label>
      <input 
        type="text"
        id=${ctl.idGen.get(`field-${field.name}`)}
        .value=${ctl.payload?.[field.name] || ''}
        placeholder=${ifDefined(this.placeholder)}
        @input=${(e) => ctl.setPayloadField(field.name, e.target.value)}>
      <div class='field-description' ?hidden=${!field.description}>${field.description}</div>
    </cork-field-container>
  `;
}

function textarea(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this.noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${field.label}</label>
      <textarea 
        id=${ctl.idGen.get(`field-${field.name}`)}
        .value=${ctl.payload?.[field.name] || ''}
        placeholder=${ifDefined(this.placeholder)}
        rows=${ifDefined(this.rows)}
        @input=${(e) => ctl.setPayloadField(field.name, e.target.value)}>
      </textarea>
      <div class='field-description' ?hidden=${!field.description}>${field.description}</div>
    </cork-field-container>
  `;
}

export default {
  'checkbox-multiple': checkboxMulti,
  'radio': radio,
  'select': select,
  'checkbox-single': checkbox,
  'number': number,
  'text': text,
  'textarea': textarea
}