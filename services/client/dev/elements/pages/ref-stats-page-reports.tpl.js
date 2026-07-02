import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-page-reports {
      display: block;
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
      <ref-stats-form-entry-query-filters show-form-filter></ref-stats-form-entry-query-filters>
      <ref-stats-form-entry-query latest-version .displayedFields=${this.displayedFields}></ref-stats-form-entry-query>
    </div>
  `;
}