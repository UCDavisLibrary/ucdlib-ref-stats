import { html, css } from 'lit';
import '#components/forms/ref-stats-field-form.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-field-single {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() {
  const pageTitle = this.data?.label || 'New Field'; 
  return html`
    <div><h1 class="page-title">${pageTitle}</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li><a href="/field${this.ctl.qs.query.form ? `?form=${this.ctl.qs.query.form}` : ''}">Fields</a></li>
      <li>${pageTitle}</li>
    </ol>
    <div class="l-container l-container--narrow l-container--narrow-desktop">
      <ref-stats-field-form></ref-stats-field-form>
    </div>
  `;
}