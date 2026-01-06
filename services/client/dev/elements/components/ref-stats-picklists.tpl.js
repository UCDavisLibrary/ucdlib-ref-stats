import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-picklists {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`
  <div>
    <div ?hidden=${this.picklists.length} class='alert'>No picklists found</div>
    <div ?hidden=${!this.picklists.length}>
      ${this.picklists.map(picklist => html`
        <div class='ucd-link-list-item'>
          <cork-icon icon='fas.circle-chevron-right' class='ucd-link-list-item--icon'></cork-icon>
          <div>
            <a href='/picklist/${picklist.name}' class='ucd-link-list-item--title'>${picklist.label}</a>
            <div class='ucd-link-list-item--badge' ?hidden=${!picklist.is_archived}>Archived</div>
            <div class='ucd-link-list-item--excerpt'>
              <span>${picklist.name}</span>
              <span ?hidden=${!picklist.description}> | </span>
              <span ?hidden=${!picklist.description}>${picklist.description}</span>
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