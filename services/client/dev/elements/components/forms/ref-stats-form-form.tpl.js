import { html, css } from 'lit';
import './ref-stats-entry-query-fields-form.js';

import definitions from '#lib/definitions.js';

const hiddenIntervalUnits = definitions.formEditIntervalUnits.filter(unit => unit.hideAmount).map(unit => unit.value);

export function styles() {
  const elementStyles = css`
    ref-stats-form-form {
      display: block;
      max-width: 500px;
      margin: 0 auto;
    }
  `;

  return [elementStyles];
}

export function render() { 
  const isNew = !this.nameOrId;
  const isEdit = !!this.nameOrId;
  return html`
    <form @submit="${this._onSubmit}" novalidate>
      <cork-field-container schema='form' path='label' class='field-container'>
        <label for=${this.ctl.idGen.get('label')}>Label</label>
        <input 
          type="text" 
          id=${this.ctl.idGen.get('label')} 
          .value=${this.payload?.label || ''}
          required 
          @input=${e => this._onPayloadInput('label', e.target.value)}>
      </cork-field-container>
      <cork-field-container schema='form' path='name' class='field-container'>
        <label for=${this.ctl.idGen.get('name')}>Name</label>
        <input 
          type="text" 
          id=${this.ctl.idGen.get('name')} 
          ?disabled=${isEdit}
          .value=${this.payload?.name || ''}
          required 
          @input=${e => this._onPayloadInput('name', e.target.value)}>
        <div class='field-description'>
          <div ?hidden=${isEdit}>The name should be unique and URL-friendly: all lowercase and contains only letters, numbers, and hyphens.</div>
          <div ?hidden=${isEdit}><b>Once saved, the name cannot be changed.</b></div>
          <div ?hidden=${isNew}>The name cannot be changed.</div>
        </div>
      </cork-field-container>
      <cork-field-container schema='form' path='description' class='field-container'>
        <label for=${this.ctl.idGen.get('description')}>Description</label>
        <textarea 
          id=${this.ctl.idGen.get('description')} 
          .value=${this.payload?.description || ''}
          rows="4"
          @input=${e => this._onPayloadInput('description', e.target.value)}></textarea>
      </cork-field-container>
      <cork-field-container schema='form' path='intro' class='field-container'>
        <label for=${this.ctl.idGen.get('intro')}>Intro</label>
        <textarea
          id=${this.ctl.idGen.get('intro')}
          .value=${this.payload?.intro || ''}
          rows="4"
          @input=${e => this._onPayloadInput('intro', e.target.value)}></textarea>
      </cork-field-container>
      <cork-field-container schema='form' path='is_archived' class='field-container checkbox'>
        <input 
          type="checkbox" 
          id=${this.ctl.idGen.get('is_archived')} 
          .checked=${this.payload?.is_archived || false}
          @input=${() => this._onPayloadInput('is_archived', !this.payload?.is_archived)}>
        <label for=${this.ctl.idGen.get('is_archived')}>Archived</label>
      </cork-field-container>
      <fieldset>
        <legend>Edit Interval</legend>
        <p>How long after submission should users be able to edit the form?</p>
        <cork-field-container schema='form' path='edit_interval_amount' class='field-container' ?hidden=${hiddenIntervalUnits.includes(this.payload?.edit_interval_unit)}>
          <label for=${this.ctl.idGen.get('edit_interval_amount')}>Interval Amount</label>
          <input 
            type="number" 
            id=${this.ctl.idGen.get('edit_interval_amount')} 
            .value=${this.payload?.edit_interval_amount || ''}
            @input=${e => this._onPayloadInput('edit_interval_amount', e.target.value)}>
        </cork-field-container>
        <cork-field-container schema='form' path='edit_interval_unit' class='field-container'>
          <label for=${this.ctl.idGen.get('edit_interval_unit')}>Interval Unit</label>
          <select 
            id=${this.ctl.idGen.get('edit_interval_unit')} 
            .value=${this.payload?.edit_interval_unit || ''}
            @input=${e => this._onPayloadInput('edit_interval_unit', e.target.value)}>
            <option value="">Select Unit</option>
            ${definitions.formEditIntervalUnits.map(unit => html`
              <option value=${unit.value}>${unit.label}</option>
            `)}
          </select>
        </cork-field-container>
      </fieldset>
      <div ?hidden=${isNew}>
        <ref-stats-entry-query-fields-form
          class='u-space-mb--large'
          @ref-stats-entry-query-fields-updated=${e => this._onPayloadInput('form_display_settings', { queryElementFields: e.detail.fields })}>
        </ref-stats-entry-query-fields-form>
      </div>
      <div>
        <button type="submit" class='btn btn--primary'>${isEdit ? 'Save Changes' : 'Create Form'}</button>
        <button type="button" class='btn btn--invert' @click=${this._onDeleteRequest} ?disabled=${!this.AuthModel.token?.hasAdminAccess}>Delete</button>
      </div>
    </form>
  `;}