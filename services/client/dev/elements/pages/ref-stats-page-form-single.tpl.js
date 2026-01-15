import { html, css } from 'lit';
import '#components/ref-stats-form-entry.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-form-single {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <ref-stats-form-entry></ref-stats-form-entry>
  `;}