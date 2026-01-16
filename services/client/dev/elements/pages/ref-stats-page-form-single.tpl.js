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
    <div><h1 class="page-title">${this.data?.label || ''}</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li>${this.data?.label || ''}</li>
    </ol>
    <div class="l-container">
      <ref-stats-form-entry></ref-stats-form-entry>
    </div>
  `;}