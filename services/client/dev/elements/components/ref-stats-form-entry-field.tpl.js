import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-form-entry-field {
      display: block;
    }
    ref-stats-form-entry-field .required-marker {
      color: var(--double-decker, #c10230);
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
  ${this.ctl.formEntry.render()}
  `;
}