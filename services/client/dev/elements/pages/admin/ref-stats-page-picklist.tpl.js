import { html, css } from 'lit';
import focalLink from '../../templates/focal-link.js';
import '../../components/ref-stats-picklists.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-picklist {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div><h1 class="page-title">Picklists</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li>Picklists</li>
    </ol>
    <div class="l-container">
      <div class="l-basic--flipped">
        <div class="l-content">
          <ref-stats-picklists></ref-stats-picklists>
        </div>
        <div class="l-sidebar-second">
          ${focalLink({
            text: 'Add New Picklist',
            icon: 'fas.plus',
            href: '/picklist/new',
            brandColor: 'quad'
          })}
        </div>
      </div>
    </div>
`;}