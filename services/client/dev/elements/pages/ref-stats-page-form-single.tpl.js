import { html, css } from 'lit';
import '#components/ref-stats-form-entry.js';
import { focalLink } from '#templates';

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
      <div class="l-basic--flipped">
        <div class="l-content">
          <ref-stats-form-entry></ref-stats-form-entry>
        </div>
        <div class="l-sidebar-second">
          <div @click=${this._onNewSubmissionClick}>
            ${focalLink({
              text: 'New Submission',
              icon: 'fas.plus',
              brandColor: 'quad'
            })}
          </div>
          ${focalLink({
            text: 'View Previous Submissions',
            icon: 'fas.table-list',
            href: `/form/${this.data?.name || ''}/submissions`,
            brandColor: 'cabernet'
          })}
        </div>
      </div>
    </div>
  `;}