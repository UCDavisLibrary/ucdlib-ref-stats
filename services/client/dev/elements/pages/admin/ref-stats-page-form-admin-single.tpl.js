import { html, css } from 'lit';
import '#components/forms/ref-stats-form-form.js';
import '#components/ref-stats-field-assignment.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-form-admin-single {
      display: block;
    }
    ref-stats-page-form-admin-single .method-patch ref-stats-form-form {
      max-width: none;
    }
  `;

  return [elementStyles];
}

export function render() {
  const pageTitle = this.data?.label || 'New Form'; 
  return html`
    <div><h1 class="page-title">${pageTitle}</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li><a href="/form-admin">Form Administration</a></li>
      <li>${pageTitle}</li>
    </ol>
    <div class="l-container ${!this.nameOrId ? 'method-create l-container--narrow l-container--narrow-desktop' : 'method-patch'}">
      <div class=${this.nameOrId ? 'l-basic--flipped' : ''}>
        <div class=${this.nameOrId ? 'l-content' : ''}>
          <ref-stats-form-form @ref-stats-form-updated=${this._onFormUpdated}></ref-stats-form-form>
        </div>
        <div class="l-sidebar-second" ?hidden=${!this.nameOrId}>
          <ref-stats-field-assignment form-name-or-id=${this.nameOrId}></ref-stats-field-assignment>
        </div>
      </div>
    </div>
  `;
}