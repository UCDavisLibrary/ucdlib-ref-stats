import { html, css } from 'lit';

import '#components/ref-stats-user-form-teasers.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-home {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div class='l-container u-space-mt--large'>
      <ref-stats-user-form-teasers></ref-stats-user-form-teasers>
    </div>
  `;
}