import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-picklists {
      display: block;
    }
    ref-stats-picklists .picklist-item {
      margin-bottom: 1.5rem;
    }
    ref-stats-picklists .picklist-label {
      display: inline-block;
      text-decoration: none;
      margin-bottom: 0;
    }
    ref-stats-picklists .picklist-name {
      font-weight: bold;
      color: var(--ucd-black-70);
      font-size: 1rem;
      margin-bottom: .5rem;
    }
    ref-stats-picklists .picklist-label:hover {
      text-decoration: underline;
      color: inherit;
    }
    ref-stats-picklists .picklist-description {
      color: var(--ucdlib-color-gray-dark);
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
        <div class='picklist-item'>
          <a class='picklist-label h4' href='/picklist/${picklist.name}'>${picklist.label}</a>
          <div class='picklist-name'>${picklist.name}</div>
          <div class='picklist-description' ?hidden=${!picklist.description}>${picklist.description || ''}</div>
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