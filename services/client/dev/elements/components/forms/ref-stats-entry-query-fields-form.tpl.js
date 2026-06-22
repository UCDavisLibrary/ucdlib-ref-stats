import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-entry-query-fields-form {
      display: block;
    }
    ref-stats-entry-query-fields-form .field-row {
      margin-bottom: .5rem;
    }
    ref-stats-entry-query-fields-form .field-row-header {
      display: flex;
      align-items: center;
      gap: .5rem;
      flex-wrap: wrap;
      margin-bottom: .5rem;
    }
    ref-stats-entry-query-fields-form .field-row-controls {
      display: flex;
      gap: .25rem;
      --cork-icon-button-size: 1.1rem;
    }
    ref-stats-entry-query-fields-form .field-row-name {
      font-weight: bold;
      color: var(--ucd-blue, #022851);
    }
    ref-stats-entry-query-fields-form .field-row-subfields {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      flex-wrap: wrap;
    }
    ref-stats-entry-query-fields-form .field-row-subfields label {
      font-size: .85rem;
      margin-bottom: 0;
    }
    ref-stats-entry-query-fields-form .field-row-subfields input[type="number"] {
      max-width: 4rem;
    }
    ref-stats-entry-query-fields-form .field-row-subfields input[type="text"] {
      max-width: 20rem;
    }
  `;

  return [elementStyles];
}

/**
 * @description Template for ref-stats-entry-query-fields-form
 */
export function render() {
  return html`
    <div class='icon-header u-space-mt--large'>
      <cork-icon icon='fas.table-columns' class='redbud'></cork-icon>
      <h2 class='icon-header--title'>Entry Display Fields</h2>
    </div>
    <p class='text--smaller'>Configure which fields appear as columns (desktop/mobile) or in the expandable details section on the entries page.</p>
    <div ?hidden=${this.queryElementFields.length > 0}>
      No display fields configured. Entries page will show ID and submission date by default.
    </div>
    <div>
      ${this.queryElementFields.map((f, idx) => _renderFieldRow.call(this, f, idx))}
    </div>
    <div class='u-space-mt--medium' ?hidden=${this.unselectedFields.length === 0}>
      <select @change=${this._onAddField}>
        <option value=''>-- Add display field --</option>
        ${this.unselectedFields.map(f => html`
          <option value=${f.name}>${f.label} (${f.name})</option>
        `)}
      </select>
    </div>
  `;
}

/**
 * @description Render a single display field row with move, remove, and input controls.
 * @param {Object} f - The RefStatsDisplayField configuration object
 * @param {Number} idx - Index of this field in the queryElementFields array
 * @returns {TemplateResult}
 */
function _renderFieldRow(f, idx) {
  const isFirst = idx === 0;
  const isLast = idx === this.queryElementFields.length - 1;
  const label = this.getAvailableFieldLabel(f.field);

  return html`
    <div class='field-row'>
      <div class='field-row-header'>
        <div class='field-row-name'>${label} <span class='text--smaller'>(${f.field})</span></div>
        <div class='field-row-controls'>
          <cork-icon-button
            icon='fas.arrow-up'
            ?disabled=${isFirst}
            title='Move up'
            @click=${() => this._onMoveClick('up', idx)}>
          </cork-icon-button>
          <cork-icon-button
            icon='fas.arrow-down'
            ?disabled=${isLast}
            title='Move down'
            @click=${() => this._onMoveClick('down', idx)}>
          </cork-icon-button>
          <cork-icon-button
            icon='fas.trash'
            title='Remove'
            @click=${() => this._onRemoveClick(idx)}>
          </cork-icon-button>
        </div>
      </div>
      
      <div class='field-row-subfields'>
        <div class='field-container'>
          <label for=${this.ctl.idGen.get(`desktop-fr-${idx}`)}>Desktop cols</label>
          <input
            type='number'
            min='1'
            id=${this.ctl.idGen.get(`desktop-fr-${idx}`)}
            .value=${f.desktopFr != null ? String(f.desktopFr) : ''}
            placeholder='—'
            @input=${e => this._onFieldInput(idx, 'desktopFr', e.target.value === '' ? '' : Number(e.target.value))}>
        </div>
        <div class='field-container'>
          <label for=${this.ctl.idGen.get(`mobile-fr-${idx}`)}>Mobile cols</label>
          <input
            type='number'
            min='1'
            id=${this.ctl.idGen.get(`mobile-fr-${idx}`)}
            .value=${f.mobileFr != null ? String(f.mobileFr) : ''}
            placeholder='—'
            @input=${e => this._onFieldInput(idx, 'mobileFr', e.target.value === '' ? '' : Number(e.target.value))}>
        </div>
        <div class='field-container'>
          <label for=${this.ctl.idGen.get(`label-${idx}`)}>Label override</label>
          <input
            type='text'
            id=${this.ctl.idGen.get(`label-${idx}`)}
            .value=${f.label || ''}
            placeholder='Default'
            @input=${e => this._onFieldInput(idx, 'label', e.target.value)}>
        </div>
      </div>
    </div>
  `;
}
