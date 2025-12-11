import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-picklist-form {
      display: block;
      max-width: 500px;
      margin: 0 auto;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <form @submit="${this._onSubmit}" novalidate>
      <cork-field-container schema='picklist' path='label' class='field-container'>
        <label for=${this.ctl.idGen.get('label')}>Label</label>
        <input 
          type="text" 
          id=${this.ctl.idGen.get('label')} 
          name="label" 
          .value=${this.payload?.label || ''}
          required 
          @input=${e => this._onPayloadInput('label', e.target.value)}>
      </cork-field-container>
      <cork-field-container schema='picklist' path='name' class='field-container'>
        <label for=${this.ctl.idGen.get('name')}>Name</label>
        <input 
          type="text" 
          id=${this.ctl.idGen.get('name')} 
          name="name" 
          .value=${this.payload?.name || ''}
          required @input=${e => this._onPayloadInput('name', e.target.value)}>
        <div class='field-description'>
          The name should be URL-friendly: all lowercase and contains only letters, numbers, and hyphens.
          <b>Once saved, the name cannot be changed.</b>
        </div>
      </cork-field-container>
      <cork-field-container schema='picklist' path='description' class='field-container'>
        <label for=${this.ctl.idGen.get('description')}>Description</label>
        <textarea 
          id=${this.ctl.idGen.get('description')} 
          name="description" 
          .value=${this.payload?.description || ''}
          rows="4"
          @input=${e => this._onPayloadInput('description', e.target.value)}></textarea>
      </cork-field-container>
      <div ?hidden=${this.ctl.modal.modal}>
        <button type="submit" class='btn btn--primary'>${this.picklistId ? 'Save Changes' : 'Create Picklist'}</button>
      </div>
    </form>
  `;
}