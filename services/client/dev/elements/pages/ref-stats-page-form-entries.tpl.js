import { html, css } from 'lit';
import '#components/ref-stats-form-entry-query.js';
import '#components/ref-stats-form-entry-query-filters.js';
import '#components/ref-stats-form-entry-query-download.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-form-entries {
      display: block;
    }
    ref-stats-page-form-entries .form-entry-query-download-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }
  `;

  return [elementStyles];
}

/**
 * @description Template for ref-stats-page-form-entries
 */
export function render() {
  return html`
    <div><h1 class="page-title">${this.data?.label || ''} - Submissions</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li><a href="/form/${this.nameOrId}">${this.data?.label || ''}</a></li>
      <li>Submissions</li>
    </ol>
    <div class="l-container">
      <div class='form-entry-query-download-container'>
        <ref-stats-form-entry-query-download
          latest-version
          .formNameOrId=${[this.nameOrId]}
        ></ref-stats-form-entry-query-download>
      </div>
      <ref-stats-form-entry-query-filters
        .formNameOrId=${[this.nameOrId]}
      >

      </ref-stats-form-entry-query-filters>
      <ref-stats-form-entry-query
        .formNameOrId=${[this.nameOrId]}
        .displayedFields=${this.displayedFields}
        latest-version>
      </ref-stats-form-entry-query>
    </div>
  `;
}
