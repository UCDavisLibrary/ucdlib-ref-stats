import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    cork-field-container {
      display: block;
    }
    cork-field-container[invalid] > label,
    cork-field-container[invalid] legend {
      color: var(--cork-field-container-invalid-label-color, var(--double-decker, #C10230 ));
    }
    cork-field-container > .cork-field-container__errors {
      display: none;
      color: var(--cork-field-container-error-color, var(--double-decker, #C10230 ));
    }
    cork-field-container[invalid] > .cork-field-container__errors {
      display: block;
    }
    cork-field-container[invalid] input[type=text],
    cork-field-container[invalid] input[type=email],
    cork-field-container[invalid] input[type=url],
    cork-field-container[invalid] input[type=number],
    cork-field-container[invalid] input[type=tel],
    cork-field-container[invalid] select,
    cork-field-container[invalid] textarea {
      border-color: var(--cork-field-container-invalid-border-color, var(--double-decker, #C10230 ));
    }
  `;

  return [elementStyles];
}

export function render() {
return html`
  <div class='cork-field-container__errors' id=${this.idGen.get('errors')}>
    ${(this.errors).map(error => html`
      <div class='cork-field-container__error'>${error.message}</div>
    `)}
  </div>
`;}
