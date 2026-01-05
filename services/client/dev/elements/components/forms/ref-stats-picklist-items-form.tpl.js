import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-picklist-items-form {
      display: block;
    }
    ref-stats-picklist-items-form .picklist-item {
      border-left: 4px solid var(--ucd-gold);
      padding: 1rem .5rem;
      margin-bottom: 1rem;
    }
    ref-stats-picklist-items-form .picklist-item__header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: .5rem;
    }
    ref-stats-picklist-items-form .picklist-item__label {
      flex-grow: 1;
    }
    ref-stats-picklist-items-form .picklist-item__actions {
      display: flex;
      align-items: center;
      gap: .25rem;
      --cork-icon-button-size: 1.25rem;
      margin-top: 0.5rem;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div>
      <h3>Picklist Items</h3>
      ${this._items.map( (item, i) => html`
        <div class='picklist-item'>
          <div class='picklist-item__header'>
            <div class='picklist-item__label'>
              <cork-field-container schema='picklist' path='items.${item.editedOrder}.label'>
                <input 
                  type="text" 
                  id=${this.ctl.idGen.get('label--' + i)} 
                  placeholder="Item Label"
                  aria-label="Item Label"
                  .value=${item.item.label || ''}
                  required 
                  @input=${e => this._onItemInput(item, 'label', e.target.value)}>
              </cork-field-container>
            </div>
            <div class='picklist-item__actions'>
              <cork-icon-button icon='fas.ellipsis' @click=${() => this._onExpandToggle(item)} color='medium'></cork-icon-button>
              <cork-icon-button icon='fas.arrow-up' @click=${() => this._onMoveItemUp(i)} color='medium' ?disabled=${i === 0}></cork-icon-button>
              <cork-icon-button icon='fas.arrow-down' @click=${() => this._onMoveItemDown(i)} color='medium' ?disabled=${i === this._items.length -1}></cork-icon-button>
              <cork-icon-button icon='fas.trash' @click=${() => this._onDeleteItem(i)} color='medium' ?hidden=${item.item.picklist_item_id}></cork-icon-button>
            </div>
          </div>

          <div ?hidden=${!item.expanded} class='u-space-mt' @cork-field-invalid=${() => this._onFieldInvalid(item)}>
            <cork-field-container schema='picklist' path='items.${item.editedOrder}.value' class='field-container'>
              <label for=${this.ctl.idGen.get('value--' + i)}>Value</label>
              <input 
                type="text" 
                id=${this.ctl.idGen.get('value--' + i)} 
                .value=${item.item.value || ''}
                required 
                @input=${e => this._onItemInput(item, 'value', e.target.value)}>
            </cork-field-container>
          </div>
        </div>
      `)}
      <button type="button" class='btn btn--alt3' @click=${this.addItem}>Add Item</button>
    </div>
  `;}