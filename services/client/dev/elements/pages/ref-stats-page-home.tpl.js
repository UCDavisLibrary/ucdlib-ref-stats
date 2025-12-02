import { html, css } from 'lit';

import '../components/formio-builder.js';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div class='l-container u-space-mt--large'>
      <h1>Home Page</h1>
      <formio-builder></formio-builder>
    </div>
  `;
}