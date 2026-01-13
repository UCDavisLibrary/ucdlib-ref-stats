import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-forms {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div>
      <div ?hidden=${this.forms.length} class='alert'>No forms found</div>
      <div ?hidden=${!this.forms.length}>
        ${this.forms.map(form => html`
          <div class='ucd-link-list-item'>
            <cork-icon icon='fas.circle-chevron-right' class='ucd-link-list-item--icon'></cork-icon>
            <div>
              <a href='/form-admin/${form.name}' class='ucd-link-list-item--title'>${form.label}</a>
              <div class='ucd-link-list-item--badge' ?hidden=${!form.is_archived}>Archived</div>
              <div class='ucd-link-list-item--excerpt'>
                <span>${form.name}</span>
                <span ?hidden=${!form.description}> | </span>
                <span ?hidden=${!form.description}>${form.description}</span>
              </div>
            </div>
          </div>
        `)}
        <ucd-theme-pagination
          current-page=${this.ctl.qs.query.page || 1}
          max-pages=${this.maxPage}
          ellipses
          xs-screen
          @page-change=${this._onPageChange}
        ></ucd-theme-pagination>
      </div>
    </div>
`;}