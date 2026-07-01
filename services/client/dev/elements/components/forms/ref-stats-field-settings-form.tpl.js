import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-field-settings-form {
      display: block;
      max-width: 500px;
      margin: 0 auto;
    }

  `;
  return [elementStyles];
}

export function render() {
  const t = this.fieldType;
  const isText = t === 'text' || t === 'textarea';
  const isNumber = t === 'number';
  const isTextOrNumber = isText || isNumber;
  const isSelectOrTypeahead = t === 'select' || t === 'typeahead';
  const isPicklist = ['select', 'typeahead', 'radio', 'checkbox-multiple'].includes(t);
  const isDate = t === 'date';
  const isFilterable = ['date','datetime','select','radio','typeahead','checkbox-multiple'].includes(t);

  return html`
    <fieldset>
      <legend>Validations</legend>

      <div class='alert' ?hidden=${!this.customValidation}>
        This field has custom code-level validation. The settings below may not override all validation behavior.
      </div>

      <cork-field-container class='field-container checkbox'>
        <input
          type="checkbox"
          id=${this.ctl.idGen.get('required')}
          .checked=${!!this.payload?.required}
          @input=${() => this._onPayloadInput('required', !this.payload?.required)}>
        <label for=${this.ctl.idGen.get('required')}>Required</label>
      </cork-field-container>

      <cork-field-container class='field-container checkbox' ?hidden=${!isSelectOrTypeahead}>
        <input
          type="checkbox"
          id=${this.ctl.idGen.get('multiple')}
          .checked=${!!this.payload?.multiple}
          @input=${() => this._onPayloadInput('multiple', !this.payload?.multiple)}>
        <label for=${this.ctl.idGen.get('multiple')}>Multiple (allow selecting more than one value)</label>
      </cork-field-container>

      <cork-field-container class='field-container' ?hidden=${!isTextOrNumber}>
        <label for=${this.ctl.idGen.get('min')}>${isNumber ? 'Minimum Value' : 'Minimum Length'}</label>
        <input
          type="number"
          id=${this.ctl.idGen.get('min')}
          .value=${this.payload?.min ?? ''}
          @input=${e => this._onPayloadInput('min', e.target.value === '' ? undefined : Number(e.target.value))}>
      </cork-field-container>

      <cork-field-container class='field-container' ?hidden=${!isTextOrNumber}>
        <label for=${this.ctl.idGen.get('max')}>${isNumber ? 'Maximum Value' : 'Maximum Length'}</label>
        <input
          type="number"
          id=${this.ctl.idGen.get('max')}
          .value=${this.payload?.max ?? ''}
          @input=${e => this._onPayloadInput('max', e.target.value === '' ? undefined : Number(e.target.value))}>
      </cork-field-container>

      <cork-field-container class='field-container' ?hidden=${!isNumber}>
        <label for=${this.ctl.idGen.get('step')}>Step</label>
        <input
          type="number"
          id=${this.ctl.idGen.get('step')}
          .value=${this.payload?.step ?? ''}
          @input=${e => this._onPayloadInput('step', e.target.value === '' ? undefined : Number(e.target.value))}>
      </cork-field-container>
    </fieldset>

    <fieldset>
      <legend>Display Settings</legend>
      <div class='alert' ?hidden=${!this.hasCustomTemplate}>
        This form has a custom template. The settings below may not override all display behavior.
      </div>

      <cork-field-container class='field-container' ?hidden=${!isText}>
        <label for=${this.ctl.idGen.get('placeholder')}>Placeholder</label>
        <input
          type="text"
          id=${this.ctl.idGen.get('placeholder')}
          .value=${this.payload?.placeholder || ''}
          @input=${e => this._onPayloadInput('placeholder', e.target.value || undefined)}>
      </cork-field-container>

      <cork-field-container class='field-container' ?hidden=${t !== 'textarea'}>
        <label for=${this.ctl.idGen.get('rows')}>Rows</label>
        <input
          type="number"
          id=${this.ctl.idGen.get('rows')}
          min="1"
          .value=${this.payload?.rows ?? ''}
          @input=${e => this._onPayloadInput('rows', e.target.value === '' ? undefined : Number(e.target.value))}>
      </cork-field-container>

      <cork-field-container class='field-container'>
        <label for=${this.ctl.idGen.get('label')}>Label <span class='text--smaller'>(overrides field default)</span></label>
        <input
          type="text"
          id=${this.ctl.idGen.get('label')}
          .value=${this.payload?.label || ''}
          @input=${e => this._onPayloadInput('label', e.target.value || undefined)}>
      </cork-field-container>

      <cork-field-container class='field-container'>
        <label for=${this.ctl.idGen.get('description')}>Description <span class='text--smaller'>(overrides field default)</span></label>
        <textarea
          id=${this.ctl.idGen.get('description')}
          rows="3"
          .value=${this.payload?.description || ''}
          @input=${e => this._onPayloadInput('description', e.target.value || undefined)}></textarea>
      </cork-field-container>

      <cork-field-container class='field-container checkbox'>
        <input
          type="checkbox"
          id=${this.ctl.idGen.get('noFieldContainer')}
          .checked=${!!this.payload?.noFieldContainer}
          @input=${() => this._onPayloadInput('noFieldContainer', !this.payload?.noFieldContainer)}>
        <label for=${this.ctl.idGen.get('noFieldContainer')}>Hide field container wrapper</label>
      </cork-field-container>

      <cork-field-container class='field-container checkbox' ?hidden=${!isPicklist}>
        <input
          type="checkbox"
          id=${this.ctl.idGen.get('allowQuickAdd')}
          .checked=${!!this.payload?.allowQuickAdd}
          @input=${() => this._onPayloadInput('allowQuickAdd', !this.payload?.allowQuickAdd)}>
        <label for=${this.ctl.idGen.get('allowQuickAdd')}>Allow picklist item creation</label>
      </cork-field-container>

      <cork-field-container class='field-container checkbox' ?hidden=${!isDate}>
        <input
          type="checkbox"
          id=${this.ctl.idGen.get('defaultValueToday')}
          .checked=${this.payload?.defaultValue === 'today'}
          @input=${() => this._onPayloadInput('defaultValue', this.payload?.defaultValue === 'today' ? undefined : 'today')}>
        <label for=${this.ctl.idGen.get('defaultValueToday')}>Default to today's date</label>
      </cork-field-container>

      <cork-field-container class='field-container' ?hidden=${isDate}>
        <label for=${this.ctl.idGen.get('defaultValue')}>Default Value</label>
        <input
          type="text"
          id=${this.ctl.idGen.get('defaultValue')}
          .value=${this.payload?.defaultValue || ''}
          @input=${e => this._onPayloadInput('defaultValue', e.target.value || undefined)}>
      </cork-field-container>

      <cork-field-container class='field-container'>
        <label>Restrict to Groups</label>
        <p class='field-description u-space-mt--flush'>If one or more groups are selected, only members of those groups will see this field.</p>
        <ucd-theme-slim-select
          @change=${e => this._onPayloadInput('conditionalOnGroup', e.detail?.length ? e.detail.map(o => Number(o.value)) : undefined)}>
          <select multiple>
            ${(this.groups || []).map(g => html`
              <option value=${g.id}
                ?selected=${(this.payload?.conditionalOnGroup || []).includes(g.id)}>
                ${g.name}
              </option>
            `)}
          </select>
        </ucd-theme-slim-select>
      </cork-field-container>

      <cork-field-container class='field-container' ?hidden=${!isFilterable}>
        <label for=${this.ctl.idGen.get('filterOrder')}>Filter Order</label>
        <p class='field-description u-space-mt--flush'>Set a positive integer to expose this field as a filter on the entry query page. Lower numbers appear first.</p>
        <input
          type="number"
          min="1"
          id=${this.ctl.idGen.get('filterOrder')}
          .value=${this.payload?.filterOrder ?? ''}
          @input=${e => this._onPayloadInput('filterOrder', e.target.value === '' ? undefined : Number(e.target.value))}>
      </cork-field-container>
    </fieldset>
  `;
}
