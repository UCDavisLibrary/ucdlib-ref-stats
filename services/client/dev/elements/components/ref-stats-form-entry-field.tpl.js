import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-form-entry-field {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
  ${this.ctl.formEntry.render()}
  `;
}