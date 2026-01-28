import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-page-home {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  const fields = [
    { field: '_created_at', desktopFr: 2, mobileFr: 1 },
  ];
  return html`
    <div class='l-container u-space-mt--large'>
      <h1>Home Page</h1>
      <ref-stats-form-entry-query .formNameOrId=${['instruction-statistics']} .displayedFields=${fields} latest-version></ref-stats-form-entry-query>
    </div>
  `;
}