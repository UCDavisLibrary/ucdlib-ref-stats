import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`
  ${renderHeader.call(this)}
  <cork-app-loader></cork-app-loader>
  <cork-app-error></cork-app-error>
  <cork-app-toast></cork-app-toast>
  <cork-app-dialog-modal></cork-app-dialog-modal>
  <ucdlib-pages
    selected=${this.page}
    attr-for-selected='page-id'>
    <ref-stats-page-home page-id='home'></ref-stats-page-home>
  </ucdlib-pages>
`;}

function renderHeader(){
  return html`
    <ucd-theme-header>
      <ucdlib-branding-bar
        site-name="UC Davis Library"
        slogan="Reference Statistics">
      </ucdlib-branding-bar>

      <ucd-theme-primary-nav>
      </ucd-theme-primary-nav>
    </ucd-theme-header>
  `;
}