import { html, css } from 'lit';
import '#components/ref-stats-form-entry-query.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-form-entries {
      display: block;
    }
  `;

  return [elementStyles];
}

/**
 * @description Template for ref-stats-page-form-entries
 */
export function render() {
  return html`
    <div><h1 class="page-title">${this.data?.label || ''} - Entries</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li><a href="/form/${this.nameOrId}">${this.data?.label || ''}</a></li>
      <li>Entries</li>
    </ol>
    <div class="l-container">
      <ref-stats-form-entry-query
        .formNameOrId=${[this.nameOrId]}
        .displayedFields=${this.displayedFields}
        latest-version>
      </ref-stats-form-entry-query>
    </div>
  `;
}
