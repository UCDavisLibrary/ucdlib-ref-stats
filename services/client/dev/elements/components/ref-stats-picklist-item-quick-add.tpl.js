import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-picklist-item-quick-add {
      display: block;
      --cork-icon-button-size: 2rem;
    }
    ref-stats-picklist-item-quick-add .container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`
  <div class='container'>
    <input 
      type="text" 
      .value=${this.value}
      placeholder=${this.placeholder}
      ?disabled=${this.disabled}
      @keydown=${this._onKeyDown}
      @input=${e => this.value = e.target.value}>
      <cork-icon-button icon="fas.plus" @click=${this._onAddClick} ?disabled=${this.disabled}></cork-icon-button>
  </div>
`;}