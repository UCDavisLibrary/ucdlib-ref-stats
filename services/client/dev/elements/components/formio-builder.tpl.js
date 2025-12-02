import { html, css, unsafeCSS } from 'lit';

import bootstrapCss from 'bootstrap/dist/css/bootstrap.min.css';
import bootstrapIconCss from 'bootstrap-icons/font/bootstrap-icons.css';
import formioCss from '@formio/js/dist/formio.full.min.css';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
      `;

  return [
    unsafeCSS(bootstrapCss),
    unsafeCSS(bootstrapIconCss),
    unsafeCSS(formioCss),
    elementStyles
  ];
}

export function render() { 
  return html`
    <div id='builder'></div>
  `;
}