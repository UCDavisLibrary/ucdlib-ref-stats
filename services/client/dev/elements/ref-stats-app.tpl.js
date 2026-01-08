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
    <ref-stats-page-picklist page-id='picklist'></ref-stats-page-picklist>
    <ref-stats-page-picklist-single page-id='picklist-single'></ref-stats-page-picklist-single>
    <ref-stats-page-field page-id='field'></ref-stats-page-field>
    <ref-stats-page-field-single page-id='field-single'></ref-stats-page-field-single>
  </ucdlib-pages>
  <div class="u-space-mb--huge"></div>
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

      <ucd-theme-quick-links
        title="Admin"
        style-modifiers="highlight"
      >
        <a href="/picklist">Picklist Management</a>
        <a href="/field">Field Library</a>
      </ucd-theme-quick-links>
    </ucd-theme-header>
  `;
}