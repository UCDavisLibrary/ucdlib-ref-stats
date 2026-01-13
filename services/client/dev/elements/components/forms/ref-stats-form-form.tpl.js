import { html, css } from 'lit';

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
      <cork-field-container schema='form' path='is_archived' class='field-container checkbox'>
        <input 
          type="checkbox" 
          id=${this.ctl.idGen.get('is_archived')} 
          .checked=${this.payload?.is_archived || false}
          @input=${() => this._onPayloadInput('is_archived', !this.payload?.is_archived)}>
        <label for=${this.ctl.idGen.get('is_archived')}>Archived</label>
      </cork-field-container>
      <div>
        <button type="submit" class='btn btn--primary'>${isEdit ? 'Save Changes' : 'Create Form'}</button>
        <button type="button" class='btn btn--invert' @click=${this._onDeleteRequest}>Delete</button>
      </div>
    </form>
  `;}