import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-page-picklist-single {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() {
  const pageTitle = this.picklistId ? this.picklistId : 'New Picklist'; 
  return html`
    <div><h1 class="page-title">${pageTitle}</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li><a href="/picklist">Picklists</a></li>
      <li>${pageTitle}</li>
    </ol>
    <div class="l-container l-container--narrow l-container--narrow-desktop">
      <ref-stats-picklist-form 
        .picklistId=${this.picklistId}
        @ref-stats-picklist-updated=${this._onPicklistUpdated}
        ></ref-stats-picklist-form>
    </div>
  `;
}