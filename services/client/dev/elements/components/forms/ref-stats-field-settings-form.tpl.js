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
    </fieldset>
  `;
}
