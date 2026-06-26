import { html } from 'lit';
import {ifDefined} from 'lit/directives/if-defined.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

/**
 * @description Renders a ref-stats-picklist-item-quick-add element when allowQuickAdd is enabled.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} field - DB field object with picklist property
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function renderQuickAdd(field, ctl) {
  if ( !this._allowQuickAdd ) return html``;
  const label = field.picklist?.label || '';
  const labelCap = label.charAt(0).toUpperCase() + label.slice(1);
  const labelLow = label.charAt(0).toLowerCase() + label.slice(1);
  return html`
    <ref-stats-picklist-item-quick-add
      class='u-space-mb'
      picklist-name-or-id=${field.picklist?.name}
      placeholder="Add New ${labelCap}"
      toast-success-text="${labelCap} added successfully."
      toast-error-text="Error adding ${labelLow}."
      @picklist-item-added=${ctl._onPicklistItemAdded.bind(ctl)}>
    </ref-stats-picklist-item-quick-add>
  `;
}

/**
 * @description Renders a group of checkboxes for a multi-select picklist field.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function checkboxMulti(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  if ( !ctl.fieldIsVisibleForUser(field) ) return html``;
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this._noFieldContainer ? '' : 'field-container'}>
      <fieldset class='checkbox'>
        <legend>${this._label} ${reqMarker.call(this)}</legend>
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
            <div class='field-description' ?hidden=${!this._description}>${unsafeHTML(this._description)}</div>
          </div>
          `)}
      </fieldset>
    </cork-field-container>
    ${renderQuickAdd.call(this, field, ctl)}
  `;
}

/**
 * @description Renders a group of radio buttons for a single-select picklist field.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function radio(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  if ( !ctl.fieldIsVisibleForUser(field) ) return html``;
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this._noFieldContainer ? '' : 'field-container'}>
      <fieldset class='radio'>
        <legend>${this._label} ${reqMarker.call(this)}</legend>
        ${ctl.fieldPicklistItems.map( item => html`
          <div class='radio-item'>
            <div>
              <input
                type="radio"
                name=${field.name}
                id=${ctl.idGen.get(`field-${field.name}-item-${item.value}`)}
                .checked=${ctl.payload?.[field.name] === item.value}
                @input=${() => ctl.setPayloadField(field.name, item.value)}>
              <label for=${ctl.idGen.get(`field-${field.name}-item-${item.value}`)}>
                ${item.label}
              </label>
            </div>
            <div class='field-description' ?hidden=${!this._description}>${unsafeHTML(this._description)}</div>
          </div>
          `)}
      </fieldset>
    </cork-field-container>
    ${renderQuickAdd.call(this, field, ctl)}
  `;
}

/**
 * @description Renders a slim-select dropdown for a picklist field. Supports both
 * single and multi-select modes via the host element's `_multiple` property.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function select(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  if ( !ctl.fieldIsVisibleForUser(field) ) return html``;
  const onChange = (e) => {
    if ( this._multiple ) {
      ctl.setPayloadField(field.name, e.detail.map( o => o.value ));
    } else {
      ctl.setPayloadField(field.name, e.detail?.value);
    }
  };
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this._noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${this._label} ${reqMarker.call(this)}</label>
      <ucd-theme-slim-select @change=${onChange}>
        <select
          id=${ctl.idGen.get(`field-${field.name}`)}
          ?multiple=${this._multiple}>
          ${!this._multiple ? html`<option value="" ?selected=${!ctl.payload?.[field.name]}>-- Select an option --</option>` : null}
          ${ctl.fieldPicklistItems.map( item => html`
            <option 
              value=${item.value}
              ?selected=${this._multiple ? (ctl.payload?.[field.name] || []).includes(item.value) : ctl.payload?.[field.name] === item.value}>
              ${item.label}
            </option>
          `)}
        </select>
      </ucd-theme-slim-select>
    </cork-field-container>
    ${renderQuickAdd.call(this, field, ctl)}
  `;
}

/**
 * @description Renders a single boolean checkbox field.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function checkbox(ctl){
  const field = ctl.fields.find( f => this.field === f.name );
  if ( !ctl.fieldIsVisibleForUser(field) ) return html``;
  return html`
    <div class='checkbox-single ${this._noFieldContainer ? '' : 'field-container'}'>
      <cork-field-container schema=${ctl.form?.name} path=${field.name} class='checkbox'>
        <input 
          type="checkbox"
          name=${field.name}
          id=${ctl.idGen.get(`field-${field.name}`)}
          .checked=${!!ctl.payload?.[field.name]}
          @input=${() => ctl.setPayloadField(field.name, !ctl.payload?.[field.name])}>
        <label for=${ctl.idGen.get(`field-${field.name}`)}>
          ${this._label}
        </label>
      </cork-field-container>
      <div class='field-description' ?hidden=${!this._description}>${unsafeHTML(this._description)}</div>
    </div>
  `;
}

/**
 * @description Renders a numeric input field. Respects min, max, step, and placeholder
 * properties on the host element.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function number(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  if ( !ctl.fieldIsVisibleForUser(field) ) return html``;
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this._noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${this._label} ${reqMarker.call(this)}</label>
      <input 
        type="number"
        id=${ctl.idGen.get(`field-${field.name}`)}
        .value=${ctl.payload?.[field.name] !== undefined || null ? ctl.payload?.[field.name] : ''}
        ?required=${this._required}
        min=${ifDefined(this._min)}
        max=${ifDefined(this._max)}
        step=${ifDefined(this._step)}
        placeholder=${ifDefined(this._placeholder)}
        @input=${(e) => ctl.setPayloadField(field.name, e.target.value ? Number(e.target.value) : null)}>
      <div class='field-description' ?hidden=${!this._description}>${unsafeHTML(this._description)}</div>
    </cork-field-container>
  `;
}

/**
 * @description Renders a plain text input field.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function text(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  if ( !ctl.fieldIsVisibleForUser(field) ) return html``;
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this._noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${this._label} ${reqMarker.call(this)}</label>
      <input 
        type="text"
        id=${ctl.idGen.get(`field-${field.name}`)}
        .value=${ctl.payload?.[field.name] || ''}
        ?required=${this._required}
        placeholder=${ifDefined(this._placeholder)}
        @input=${(e) => ctl.setPayloadField(field.name, e.target.value)}>
      <div class='field-description' ?hidden=${!this._description}>${unsafeHTML(this._description)}</div>
    </cork-field-container>
  `;
}

/**
 * @description Renders a multi-line textarea field. Respects the rows property on the host element.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function textarea(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  if ( !ctl.fieldIsVisibleForUser(field) ) return html``;
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this._noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${this._label} ${reqMarker.call(this)}</label>
      <textarea
        id=${ctl.idGen.get(`field-${field.name}`)}
        .value=${ctl.payload?.[field.name] || ''}
        ?required=${this._required}
        placeholder=${ifDefined(this._placeholder)}
        rows=${ifDefined(this._rows)}
        @input=${(e) => ctl.setPayloadField(field.name, e.target.value)}>
      </textarea>
      <div class='field-description' ?hidden=${!this._description}>${unsafeHTML(this._description)}</div>
    </cork-field-container>
  `;
}

/**
 * @description Renders a date input field (type="date"). Respects min, max, and placeholder
 * properties on the host element.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function date(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  if ( !ctl.fieldIsVisibleForUser(field) ) return html``;
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this._noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${this._label} ${reqMarker.call(this)}</label>
      <input 
        type="date"
        id=${ctl.idGen.get(`field-${field.name}`)}
        .value=${ctl.payload?.[field.name] || ''}
        ?required=${this._required}
        placeholder=${ifDefined(this._placeholder)}
        min=${ifDefined(this._min)}
        max=${ifDefined(this._max)}
        @input=${(e) => ctl.setPayloadField(field.name, e.target.value)}>
      <div class='field-description' ?hidden=${!this._description}>${unsafeHTML(this._description)}</div>
    </cork-field-container>
  `;
}

/**
 * @description Renders a date-and-time input field (type="datetime-local"). Respects min, max,
 * and placeholder properties on the host element.
 * Called with `this` bound to the host element (ref-stats-form-entry-field).
 * @param {Object} ctl - FormEntryController instance
 * @returns {import('lit').TemplateResult}
 */
function datetime(ctl) {
  const field = ctl.fields.find( f => this.field === f.name );
  if ( !ctl.fieldIsVisibleForUser(field) ) return html``;
  return html`
    <cork-field-container schema=${ctl.form?.name} path=${field.name} class=${this._noFieldContainer ? '' : 'field-container'}>
      <label for=${ctl.idGen.get(`field-${field.name}`)}>${this._label} ${reqMarker.call(this)}</label>
      <input 
        type="datetime-local"
        id=${ctl.idGen.get(`field-${field.name}`)}
        .value=${ctl.payload?.[field.name] || ''}
        ?required=${this._required}
        placeholder=${ifDefined(this._placeholder)}
        min=${ifDefined(this._min)}
        max=${ifDefined(this._max)}
        @input=${(e) => ctl.setPayloadField(field.name, e.target.value)}>
      <div class='field-description' ?hidden=${!this._description}>${unsafeHTML(this._description)}</div>
    </cork-field-container>
  `;
}

/**
 * @description Renders a small required-field asterisk marker, hidden when the field
 * is not required. Called with `this` bound to the host element.
 * @returns {import('lit').TemplateResult}
 */
function reqMarker(){
  return html`<span class='required-marker' aria-hidden="true" ?hidden=${!this._required}>*</span>`;
}

export default {
  'checkbox-multiple': checkboxMulti,
  'radio': radio,
  'select': select,
  'checkbox-single': checkbox,
  'number': number,
  'text': text,
  'textarea': textarea,
  'date': date,
  'datetime': datetime
}