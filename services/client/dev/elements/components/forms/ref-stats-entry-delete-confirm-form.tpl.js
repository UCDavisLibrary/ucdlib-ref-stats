import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-entry-delete-confirm-form {
      display: block;
    }
  `;
  return [elementStyles];
}

export function render() {
  if ( !this.formEntry ) {
    return html`<p>Loading...</p>`;
  }

  return html`
    <p>Are you sure you want to delete this submission? This cannot be undone.</p>
    <fieldset class='radio' ?hidden=${!this.hasRevisions}>
      <legend>Delete method</legend>
      <div class='radio-item'>
        <div>
          <input
            type='radio'
            id=${this.ctl.idGen.get('delete-choice-single')}
            name='delete-choice'
            value='single'
            .checked=${this.deleteChoice === 'single'}
            @change=${e => this.deleteChoice = e.target.value}>
          <label for=${this.ctl.idGen.get('delete-choice-single')}>Delete last edit only</label>
        </div>
        <div class='field-description'>
          Reverts to the previous version
        </div>
      </div>
      <div class='radio-item'>
        <div>
          <input
            type='radio'
            id=${this.ctl.idGen.get('delete-choice-all')}
            name='delete-choice'
            value='all'
            .checked=${this.deleteChoice === 'all'}
            @change=${e => this.deleteChoice = e.target.value}>
          <label for=${this.ctl.idGen.get('delete-choice-all')}>Delete all versions</label>
        </div>
        <div class='field-description'>
          Removes the entire submission history
        </div>
      </div>
    </fieldset>
  `;
}
