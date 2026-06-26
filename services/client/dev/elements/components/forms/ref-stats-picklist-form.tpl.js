import { html, css } from 'lit';
import './ref-stats-picklist-items-form.js';

export function styles() {
  const elementStyles = css`
    ref-stats-picklist-form {
      display: block;
      max-width: 500px;
      margin: 0 auto;
    }
    ref-stats-picklist-form ref-stats-picklist-items-form {
      margin-bottom: 3rem;
    }
  `;

  return [elementStyles];
}

export function render() { 
  const isNew = !this.picklistIdOrName;
  const isEdit = !!this.picklistIdOrName;
  const items = Array.isArray(this.payload?.items) ? [...this.payload.items] : [];
  if ( this.payload?.sort_alpha  ){
    items.sort((a,b) => {
      return a.label.localeCompare(b.label, undefined, {sensitivity: 'base'});
    });
  }
  return html`
    <form @submit="${this._onSubmit}" novalidate>
      <cork-field-container schema='picklist' path='label' class='field-container'>
        <label for=${this.ctl.idGen.get('label')}>Label</label>
        <input 
          type="text" 
          id=${this.ctl.idGen.get('label')} 
          .value=${this.payload?.label || ''}
          required 
          @input=${e => this._onPayloadInput('label', e.target.value)}>
      </cork-field-container>
      <cork-field-container schema='picklist' path='name' class='field-container'>
        <label for=${this.ctl.idGen.get('name')}>Name</label>
        <input 
          type="text" 
          id=${this.ctl.idGen.get('name')} 
          ?disabled=${isEdit}
          .value=${this.payload?.name || ''}
          required 
          @input=${e => this._onPayloadInput('name', e.target.value)}>
        <div class='field-description'>
          <span ?hidden=${isEdit}>The name should be URL-friendly: all lowercase and contains only letters, numbers, and hyphens.
          <b>Once saved, the name cannot be changed.</b></span>
          <span ?hidden=${isNew}>The name cannot be changed.</span>
        </div>
      </cork-field-container>
      <cork-field-container schema='picklist' path='description' class='field-container'>
        <label for=${this.ctl.idGen.get('description')}>Description</label>
        <textarea 
          id=${this.ctl.idGen.get('description')} 
          .value=${this.payload?.description || ''}
          rows="4"
          @input=${e => this._onPayloadInput('description', e.target.value)}></textarea>
      </cork-field-container>
      <cork-field-container schema='picklist' path='sort_alpha' class='field-container checkbox'>
        <input 
          type="checkbox" 
          id=${this.ctl.idGen.get('sort_alpha')} 
          .checked=${this.payload?.sort_alpha || false}
          @input=${() => this._onPayloadInput('sort_alpha', !this.payload?.sort_alpha)}>
        <label for=${this.ctl.idGen.get('sort_alpha')}>Sort Items Alphabetically</label>
      </cork-field-container>
      <cork-field-container schema='picklist' path='user_can_add_items' class='field-container checkbox'>
        <input 
          type="checkbox" 
          id=${this.ctl.idGen.get('user_can_add_items')} 
          .checked=${this.payload?.user_can_add_items || false}
          @input=${() => this._onPayloadInput('user_can_add_items', !this.payload?.user_can_add_items)}>
        <label for=${this.ctl.idGen.get('user_can_add_items')}>Allow Users to Add Items</label>
      </cork-field-container>
      <cork-field-container schema='picklist' path='is_archived' class='field-container checkbox' ?hidden=${isNew}>
        <input 
          type="checkbox" 
          id=${this.ctl.idGen.get('is_archived')} 
          .checked=${this.payload?.is_archived || false}
          @input=${() => this._onPayloadInput('is_archived', !this.payload?.is_archived)}>
        <label for=${this.ctl.idGen.get('is_archived')}>Archived</label>
      </cork-field-container>
      <ref-stats-picklist-items-form .items=${items} .disableMoveButtons=${this.payload?.sort_alpha || false}></ref-stats-picklist-items-form>
      <div ?hidden=${this.ctl.modal.modal}>
        <button type="submit" class='btn btn--primary'>${isEdit ? 'Save Changes' : 'Create Picklist'}</button>
        <button type="button" class='btn btn--invert' @click=${this._onDeleteRequest} ?disabled=${!this.AuthModel.token?.hasAdminAccess}>Delete</button>
      </div>
    </form>
  `;
}