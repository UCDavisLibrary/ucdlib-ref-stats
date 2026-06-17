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
    {field: '_created_at', desktopFr: 1, mobileFr: 1},
    {field: 'instructor-session-type', desktopFr: 1},
    {field: 'date', desktopFr: 1},
    {field: 'participant-count', desktopFr: 1, label: 'Participants'},
    {field: 'department'},
    {field: 'notes'},
  ];
  const someFormFields = [
    {field: '_created_at', desktopFr: 1, mobileFr: 1},
    {field: 'department', desktopFr: 1},
    {field: 'bar', desktopFr: 1},
    {field: 'date', desktopFr: 1}
  ]
  return html`
    <div class='l-container u-space-mt--large'>
      <h1>Home Page</h1>
      <ref-stats-form-entry-query .formNameOrId=${['instruction-statistics']} .displayedFields=${fields} latest-version></ref-stats-form-entry-query>
      <ref-stats-form-entry-query .formNameOrId=${['some-form']} .displayedFields=${someFormFields} latest-version ></ref-stats-form-entry-query>
    </div>
  `;
}