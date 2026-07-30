import { html, css } from 'lit';

import '#components/ref-stats-form-typeahead.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-dashboards {
      display: block;
    }
    ref-stats-page-dashboards .filters {
      display: flex;
      gap: 1rem;
      flex-direction: column;
      margin-bottom: 1.5rem;
      margin-top: 0.5rem;
      container-type: inline-size;
    }
    @container (width > 500px) {
      ref-stats-page-dashboards .filters {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;

  return [elementStyles];
}

export function render() {
return html`
  <div><h1 class="page-title">Dashboards</h1></div>
  <ol class="breadcrumbs">
    <li><a href="/">Home</a></li>
    <li>Analytics</li>
  </ol>
  <div class="l-container">
    <div class="l-basic--flipped">
      <div class="l-content">
        <div class='filters'>
          <div class="field-container">
            <label for=${this.ctl.idGen.get('label-search')}>Search by label</label>
            <input
              .value=${this.ctl.qs.query.q || ''}
              type="text"
              @input=${this._onSearchInput}
              id=${this.ctl.idGen.get('label-search')}>
          </div>
          <div class="field-container">
            <label for=${this.ctl.idGen.get('form-typeahead')}>Filter by form</label>
            <ref-stats-form-typeahead
              input-id=${this.ctl.idGen.get('form-typeahead')}
              .nameOrId=${this.ctl.qs.query.form || ''}
              @form-typeahead-selected=${this._onFormTypeaheadSelected}>
            </ref-stats-form-typeahead>
            <button class="link-button" style='margin-top: .25rem' ?hidden=${!this.ctl.qs.query.form} @click=${this._onFormTypeaheadSelected} type="button">Clear form filter</button>
          </div>
        </div>
        <div ?hidden=${this.dashboards.length} class='alert'>No dashboards found.</div>
        <ul ?hidden=${!this.dashboards.length} class='list--arrow'>
          ${this.dashboards.map(d => html`
            <li><a href='/analytics/${d.name}'>${d.label || d.name}</a></li>
          `)}
        </ul>
        <ucd-theme-pagination
          current-page=${this.ctl.qs.query.page || 1}
          max-pages=${this.maxPage}
          ellipses
          xs-screen
          @page-change=${this._onPageChange}
        ></ucd-theme-pagination>
      </div>
    </div>
  </div>
`;}
