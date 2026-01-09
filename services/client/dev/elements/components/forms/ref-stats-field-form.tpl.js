import { html, css } from 'lit';
import definitions from '#lib/definitions.js';
import '#components/ref-stats-picklist-typeahead.js';

export function styles() {
  const elementStyles = css`
    ref-stats-field-form {
      display: block;
      max-width: 500px;
      margin: 0 auto;
    }
    ref-stats-field-form .picklist-action-links {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
  `;

  return [elementStyles];
}

export function render() { 
  const isNew = !this.nameOrId;
  const isEdit = !!this.nameOrId;
  return html`
    <form @submit="${this._onSubmit}" novalidate>
      <cork-field-container schema='field' path='label' class='field-container'>
        <label for=${this.ctl.idGen.get('label')}>Label</label>
        <input 
          type="text" 
          id=${this.ctl.idGen.get('label')} 
          .value=${this.payload?.label || ''}
          required 
          @input=${e => this._onPayloadInput('label', e.target.value)}>
      </cork-field-container>
      <cork-field-container schema='field' path='name' class='field-container'>
        <label for=${this.ctl.idGen.get('name')}>Name</label>
        <input 
          type="text" 
          id=${this.ctl.idGen.get('name')} 
          ?disabled=${isEdit}
          .value=${this.payload?.name || ''}
          required 
          @input=${e => this._onPayloadInput('name', e.target.value)}>
        <div class='field-description'>
          <div ?hidden=${isEdit}>The name should be URL-friendly: all lowercase and contains only letters, numbers, and hyphens.</div>
          <div ?hidden=${isEdit}>It must also be unique to the system, so that reports can reliably merge fields across forms.</div>
          <div ?hidden=${isEdit}><b>Once saved, the name cannot be changed.</b></div>
          <div ?hidden=${isNew}>The name cannot be changed.</div>
        </div>
      </cork-field-container>
      <cork-field-container schema='field' path='description' class='field-container'>
        <label for=${this.ctl.idGen.get('description')}>Description</label>
        <textarea 
          id=${this.ctl.idGen.get('description')} 
          .value=${this.payload?.description || ''}
          rows="4"
          @input=${e => this._onPayloadInput('description', e.target.value)}></textarea>
      </cork-field-container>
      <cork-field-container schema='field' path='field_type' class='field-container'>
        <label for=${this.ctl.idGen.get('field_type')}>Field Type</label>
        <select 
          id=${this.ctl.idGen.get('field_type')} 
          .value=${this.payload?.field_type || ''}
          required
          @input=${e => this._onPayloadInput('field_type', e.target.value)}>
          <option value="" disabled ?selected=${!this.payload?.field_type}>-- Select Field Type --</option>
          ${definitions.fieldTypes.map(type => html`
            <option value=${type.value} ?selected=${this.payload?.field_type === type.value}>${type.label}</option>
          `)}
        </select>
      </cork-field-container>
      <div ?hidden=${this.payload?.field_type !== 'picklist'} class='u-space-mb'>
        <cork-field-container schema='field' path='picklist_id' class='u-space-mb--small'>
          <label for=${this.ctl.idGen.get('picklist')}>Picklist</label>
          <ref-stats-picklist-typeahead 
            input-id=${this.ctl.idGen.get('picklist')} 
            @picklist-typeahead-selected=${e => this._onPayloadInput('picklist_id', e.detail.picklist.picklist_id)}
            name-or-id=${this.payload?.picklist_id}>
          </ref-stats-picklist-typeahead>
        </cork-field-container>
        <div class='picklist-action-links'>
          <button type="button" class="link-button" ?hidden=${this.payload.picklist_id} @click=${this._onPicklistModalRequest}>Or Create A New Picklist</button>
          <button type="button" class="link-button" ?hidden=${!this.payload.picklist_id} @click=${() => this._onPayloadInput('picklist_id', null)}>Clear</button>
          <button type="button" class="link-button" ?hidden=${!this.payload.picklist_id} @click=${this._onPicklistModalRequest}>Edit Picklist</button>
        </div>
      </div>
      <cork-field-container schema='field' path='is_archived' class='field-container checkbox'>
        <input 
          type="checkbox" 
          id=${this.ctl.idGen.get('is_archived')} 
          .checked=${this.payload?.is_archived || false}
          @input=${() => this._onPayloadInput('is_archived', !this.payload?.is_archived)}>
        <label for=${this.ctl.idGen.get('is_archived')}>Archived</label>
      </cork-field-container>
      <div>
        <button type="submit" class='btn btn--primary'>${isEdit ? 'Save Changes' : 'Create Field'}</button>
        <button type="button" class='btn btn--invert' @click=${this._onDeleteRequest}>Delete</button>
      </div>
    </form>
  `;}