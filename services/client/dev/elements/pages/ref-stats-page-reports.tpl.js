import { html, css } from 'lit';
import '#components/ref-stats-form-entry-query.js';
import '#components/ref-stats-form-entry-query-filters.js';
import '#components/ref-stats-form-entry-query-download.js';
import { superset } from '#client-utils';

export function styles() {
  const elementStyles = css`
    ref-stats-page-reports {
      display: block;
    }
    ref-stats-page-reports .form-entry-query-download-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
  `;

  return [elementStyles];
}

export function render() { 
  const pageTitle = 'Reports and Dashboards';
  return html`
    <div><h1 class="page-title">${pageTitle}</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li>${pageTitle}</li>
    </ol>
    <div class='l-container'>
      <div class='form-entry-query-download-container'>
        <cork-prefixed-icon-button 
          icon='fas.chart-pie'
          href=${superset.dashboardListUrl}>
          View Dashboards
        </cork-prefixed-icon-button>
        <ref-stats-form-entry-query-download latest-version></ref-stats-form-entry-query-download>
      </div>
      <ref-stats-form-entry-query-filters show-form-filter></ref-stats-form-entry-query-filters>
      <ref-stats-form-entry-query latest-version .displayedFields=${this.displayedFields}></ref-stats-form-entry-query>
    </div>
  `;
}