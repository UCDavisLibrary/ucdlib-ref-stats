import { html, css } from 'lit';
import focalLink from '#templates/focal-link.js';
import '#components/ref-stats-fields.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-field {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div><h1 class="page-title">Field Library</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li>Fields</li>
    </ol>
    <div class="l-container">
      <div class="l-basic--flipped">
        <div class="l-content">
          <div>
          <p>Fields are the individual questions that can be shared among forms throughout the application. They define the type of data that can be collected and how it should be presented to the user.</p>
          <ref-stats-fields></ref-stats-fields>
          </div>

        </div>
        <div class="l-sidebar-second">
          <!-- Todo: Hide if not super admin -->
          ${focalLink({
            text: 'Add New Field',
            icon: 'fas.plus',
            href: '/field/new',
            brandColor: 'quad'
          })}
        </div>
      </div>
    </div>
`;}