import { html, css } from 'lit';
import { focalLink } from '#templates';
import '#components/forms/ref-stats-dashboard-form.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-dashboard-admin-single {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() {
  const pageTitle = this.data?.label || (this.nameOrId ? this.nameOrId : 'New Dashboard');
  return html`
    <div><h1 class="page-title">${pageTitle}</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li><a href="/dashboard-admin">Dashboard Administration</a></li>
      <li>${pageTitle}</li>
    </ol>
    <div class="l-container ${!this.nameOrId ? 'l-container--narrow l-container--narrow-desktop' : ''}">
      <div class=${this.nameOrId ? 'l-basic--flipped' : ''}>
        <div class=${this.nameOrId ? 'l-content' : ''}>
          <ref-stats-dashboard-form
            @ref-stats-dashboard-updated=${this._onDashboardUpdated}>
          </ref-stats-dashboard-form>
        </div>
        <div class="l-sidebar-second" ?hidden=${!this.nameOrId}>
          ${focalLink({
            text: 'View Dashboard',
            icon: 'fas.chart-pie',
            href: `/analytics/${this.nameOrId}`,
            brandColor: 'gunrock'
          })}
        </div>
      </div>
    </div>
  `;
}
