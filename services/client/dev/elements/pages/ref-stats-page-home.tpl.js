import { html, css } from 'lit';

import '#components/ref-stats-user-form-teasers.js';
import '#components/ref-stats-form-entry-query.js';

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
      <ref-stats-user-form-teasers class='u-space-mb--huge'></ref-stats-user-form-teasers>
      <div>
        <h2 class="heading--center-underline u-space-mb--large">My Submissions</h2>
        <ref-stats-form-entry-query latest-version mine .displayedFields=${this.submissionFields}></ref-stats-form-entry-query>
      </div>
    </div>
  `;
}