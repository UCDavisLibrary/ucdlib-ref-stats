import { html, css } from 'lit';
import '#components/forms/ref-stats-field-form.js';
import '#components/ref-stats-field-assignment.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-field-single {
      display: block;
    }
    ref-stats-page-field-single .method-patch ref-stats-field-form {
      max-width: none;
    }
  `;

  return [elementStyles];
}

export function render() {
  const pageTitle = this.data?.label || 'New Field'; 
  return html`
    <div><h1 class="page-title">${pageTitle}</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li><a href="/field${this.ctl.qs.query.form ? `?form=${this.ctl.qs.query.form}` : ''}">Fields</a></li>
      <li>${pageTitle}</li>
    </ol>
    <div class="l-container ${!this.nameOrId ? 'method-create l-container--narrow l-container--narrow-desktop' : 'method-patch'}">
      <div class=${this.nameOrId ? 'l-basic--flipped' : ''}>
        <div class=${this.nameOrId ? 'l-content' : ''}>
          <ref-stats-field-form @ref-stats-field-updated=${this._onFieldUpdated}></ref-stats-field-form>
        </div>
        <div class="l-sidebar-second" ?hidden=${!this.nameOrId}>
          <ref-stats-field-assignment field-name-or-id=${this.nameOrId}></ref-stats-field-assignment>
        </div>
      </div>
    </div>
  `;
}