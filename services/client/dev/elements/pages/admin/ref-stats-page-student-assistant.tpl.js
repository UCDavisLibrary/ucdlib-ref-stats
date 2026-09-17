import { html, css } from 'lit';

import '#components/forms/ref-stats-new-student-assistant-form.js';

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
          <p>List of student assistants will go here</p>
        </div>
        <div class="l-sidebar-second">
          <ref-stats-new-student-assistant-form form-name-or-id="${this.formNameOrId}"></ref-stats-new-student-assistant-form>
        </div>
      </div>
    </div>
  `;}