import { html, css } from 'lit';

import '#components/forms/ref-stats-new-student-assistant-form.js';
import '#components/ref-stats-student-assistant.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-student-assistant {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div><h1 class="page-title">Student Assistant Access</h1></div>
    <ol class="breadcrumbs">
      ${this.breadcrumbs.map(b => html`
        ${b.href ? html`<li><a href="${b.href}">${b.text}</a></li>` : html`<li>${b.text}</li>`}
      `)}
    </ol>
    <div class="l-container">
      <div class="l-basic--flipped">
        <div class="l-content">
          <div ?hidden=${!this.assignments?.length}>
            ${this.assignments.map(a => html`
              <ref-stats-student-assistant .data=${a} .formNameOrId=${this.formNameOrId}></ref-stats-student-assistant>
            `)}
            <ucd-theme-pagination
              current-page=${this.ctl.qs.query.page || 1}
              max-pages=${this.assignmentsMaxPage}
              ellipses
              xs-screen
              @page-change=${this._onPageChange}
            ></ucd-theme-pagination>
          </div>
          <div ?hidden=${this.assignments?.length}>
            <p>No student assistants found. Use the "Grant Access" form to add new student assistants.</p>
          </div>
        </div>
        <div class="l-sidebar-second">
          <ref-stats-new-student-assistant-form .formNameOrId=${this.formNameOrId}></ref-stats-new-student-assistant-form>
        </div>
      </div>
    </div>
  `;}