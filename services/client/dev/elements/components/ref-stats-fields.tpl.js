import { html, css } from 'lit';
import definitions from '#lib/definitions.js';

import '#components/ref-stats-form-typeahead.js';

export function styles() {
  const elementStyles = css`
    ref-stats-fields {
      container-type: inline-size;
      display: block;
    }
    ref-stats-fields .field-teaser {
      padding: 1rem;
      margin-bottom: 1rem;
      border-left: 1px solid var(--ucd-gold, #ffbf00);
      box-shadow: 0 0 10px 0 rgba(0,0,0,.1);
    }
    ref-stats-fields .field-teaser .badges {
      display: flex;
      gap: .5rem;
    }
    ref-stats-fields .field-teaser .badge.badge--archived {
      background-color: var(--ucd-blue-40, #dbeaf7);
      color: var(--ucd-blue, #022851);
    }
    ref-stats-fields .field-teaser .badge.badge--arl {
      background-color: var(--ucd-blue, #022851);
      color: var(--white, #fff);
    }
    ref-stats-fields .field-teaser .title {
      margin: 0;
      font-size: 1.3em;
      font-weight: 800;
      color: var(--forced-contrast-heading-primary, #022851);
      text-decoration: none;
    }
    ref-stats-fields .field-teaser .title:hover {
      text-decoration: underline;
    }
    ref-stats-fields .field-teaser .icon-list {
      display: flex;
      gap: .5rem;
      align-items: center;
    }
    ref-stats-fields .field-teaser .icon-list + .icon-list {
      margin-top: .5rem;
    }
    ref-stats-fields .field-teaser .icon-list cork-icon {
      --cork-icon-size: .875rem;
      color: var(--ucd-blue-70, #73abdd);
    }
    ref-stats-fields .field-teaser .icon-list .icon-list__label {
      font-size: .875rem;
      color: var(--ucd-black-70, #4C4C4C);
    }
    ref-stats-fields .field-teaser .field-teaser__content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    ref-stats-fields .field-teaser .field-teaser__forms {
      font-size: 0.875rem;
      color: var(--ucd-black-70, #4C4C4C);
      border-left: 1px solid var(--ucd-blue-70, #73abdd);
      padding: 0.5rem 0px 0.5rem 1rem;
      justify-content: center;
      display: flex;
      flex-flow: column;
    }
    ref-stats-fields .field-teaser .field-teaser__forms ul {
      padding-left: 1rem;
      margin-top: 0;
    }
    @container (width > 500px) {
      ref-stats-fields .field-teaser .field-teaser__content {
        display: grid;
        grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
        gap: 1rem;
      }
    }
    ref-stats-fields .filters {
      display: flex;
      gap: 1rem;
      flex-direction: column;
      margin-bottom: 1.5rem;
      margin-top: 0.5rem;
    }
    @container (width > 500px) {
      ref-stats-fields .filters {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`
  <div>
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
    <div ?hidden=${this.fields.length} class='alert'>No fields found</div>
    <div ?hidden=${!this.fields.length}>
      ${this.fields.map(field => html`
        <div class="field-teaser">
          <div class="badges">
            <div class="badge badge--archived" ?hidden=${!field.is_archived}>Archived</div>
            <div class="badge badge--arl" ?hidden=${!field.arl_required}>ARL</div>
          </div>
          <div class="field-teaser__content">
            <div>
              <div><a class='title' href='/field/${field.name}'>${field.label}</a></div>
              <div class='primary bold'>${field.name}</div>
              <div>
                <div class='icon-list'>
                  <cork-icon icon='fas.database'></cork-icon>
                  <div class='icon-list__label'>
                    <span>${definitions.fieldTypes.find(ft => ft.value === field.field_type)?.label || ''}</span>
                    <span ?hidden=${!field.picklist}> (${field.picklist?.label || ''})</span>
                  </div>
                </div>
              </div>
            </div>
            <div class='field-teaser__forms'>
              <div class='bold primary'>Appears On</div>
              <div ?hidden=${!field.forms.length}>
                <ul class="list--arrow">
                ${field.forms.map(form => html`
                  <li>
                    <div>${form.label}<span ?hidden=${!(form.is_archived || form.assignment_is_archived)}> (Archived)</span></div>
                  </li>
                `)}
                </ul>
              </div>
              <div ?hidden=${!!field.forms.length}>No forms use this field.</div>
            </div>
          </div>
        </div>
      `)}
    </div>
    <ucd-theme-pagination
      current-page=${this.ctl.qs.query.page || 1}
      max-pages=${this.maxPage}
      ellipses
      xs-screen
      @page-change=${this._onPageChange}
    ></ucd-theme-pagination>
  </div>


`;}