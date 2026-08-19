import { html, css } from 'lit';
import { focalLink } from '#templates';
import '#components/ref-stats-form-typeahead.js';

export function styles() {
  const elementStyles = css`
    ref-stats-page-dashboard-admin {
      display: block;
    }
    ref-stats-page-dashboard-admin .filters {
      display: flex;
      gap: 1rem;
      flex-direction: column;
      margin-bottom: 1.5rem;
      margin-top: 0.5rem;
      container-type: inline-size;
    }
    @container (width > 500px) {
      ref-stats-page-dashboard-admin .filters {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;

  return [elementStyles];
}

export function render() {
  return html`
    <div><h1 class="page-title">Dashboard Administration</h1></div>
    <ol class="breadcrumbs">
      <li><a href="/">Home</a></li>
      <li>Dashboard Administration</li>
    </ol>
    <div class="l-container">
      <div class="l-basic--flipped">
        <div class="l-content">
          <p>Manage embedded Superset dashboards and their form associations.</p>
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
          <div ?hidden=${!this.dashboards.length}>
            ${this.dashboards.map(d => html`
              <div class='ucd-link-list-item'>
                <cork-icon icon='fas.circle-chevron-right' class='ucd-link-list-item--icon'></cork-icon>
                <div>
                  <a href='/analytics-admin/${d.name}' class='ucd-link-list-item--title'>${d.label || d.name}</a>
                  <div class='ucd-link-list-item--badge' ?hidden=${!d.is_archived}>Archived</div>
                  <div class='ucd-link-list-item--excerpt'>
                    <span>${d.name}</span>
                    <span ?hidden=${!d.description}> | </span>
                    <span ?hidden=${!d.description}>${d.description}</span>
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
        <div class="l-sidebar-second">
          ${focalLink({
            text: 'Add New Dashboard',
            icon: 'fas.plus',
            href: '/analytics-admin/new',
            brandColor: 'quad'
          })}
        </div>
      </div>
    </div>
  `;
}
