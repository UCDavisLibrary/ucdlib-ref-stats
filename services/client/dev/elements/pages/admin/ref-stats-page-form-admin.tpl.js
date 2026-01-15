import { html, css } from 'lit';
import { focalLink } from '#templates';

import '#components/ref-stats-forms.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-form-admin {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div><h1 class="page-title">Form Administration</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li>Form Administration</li>
    </ol>
    <div class="l-container">
      <div class="l-basic--flipped">
        <div class="l-content">
          <p>Manage and configure forms used within the application.</p>
          <ref-stats-forms></ref-stats-forms>
        </div>
        <div class="l-sidebar-second">
          ${focalLink({
            text: 'Add New Form',
            icon: 'fas.plus',
            href: '/form-admin/new',
            brandColor: 'quad'
          })}
        </div>
      </div>
    </div>
  `;
}