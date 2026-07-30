import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-dashboard-single {
      display: block;
    }
    ref-stats-page-dashboard-single #superset-embed {
      width: 100%;
      min-height: 600px;
    }
    ref-stats-page-dashboard-single #superset-embed iframe {
      width: 100%;
      min-height: 600px;
      border: none;
    }
  `;

  return [elementStyles];
}

export function render() {
  const title = this.data?.label || this.nameOrId || 'Dashboard';
  return html`
    <div><h1 class="page-title">${title}</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li><a href="/analytics">Dashboards</a></li>
      <li>${title}</li>
    </ol>
    <div class="l-container">
      ${this.data?.intro ? html`<div class="u-space-mb">${unsafeHTML(this.data.intro)}</div>` : html``}
      ${this.data?.superset_dashboard_id
        ? html`<div id="superset-embed"></div>`
        : html`
          <div class="alert" ?hidden=${!this.data?.dashboard_id}>
            This dashboard has not been configured yet. Please check back later or contact an administrator.
          </div>
        `
      }
    </div>
  `;
}
