import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-form-entry-query-filters {
      display: block;
      container-type: inline-size;
    }
    ref-stats-form-entry-query-filters .filter-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: minmax(0, 1fr);
    }
    @container (min-width: 400px) {
      ref-stats-form-entry-query-filters .filter-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @container (min-width: 600px) {
      ref-stats-form-entry-query-filters .filter-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
    @container (min-width: 800px) {
      ref-stats-form-entry-query-filters .filter-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`
  <div>
    <div class='filter-grid'>
      ${_renderFilter.call(this, 'group_id')}
      ${_renderFilter.call(this, 'submitted_by')}
      ${_renderFilter.call(this, 'submitted_after')}
      ${_renderFilter.call(this, 'submitted_before')}
      ${this.fieldFilters.map( f => _renderFilter.call(this, f.name) )}
    </div>

  </div>


`;}

function _renderFilter(filterName){
  if ( this.availableFilters[filterName].type === 'date' ) return _renderDateFilter.call(this, filterName);
  if ( this.availableFilters[filterName].type === 'select' ) return _renderSelectFilter.call(this, filterName);
  return html``;
}

function _renderSelectFilter(filterName){
  if ( !this.availableFilters?.[filterName]?.options?.length ) return html``;
  const filter = this.availableFilters[filterName];
  const onChange = (e) => {
    const setOpts = {
      removeFalsey: true,
      reflect: true,
      resetPage: true
    };
    if ( filter.multiple ) {
      this.ctl.qs.setParam(filterName, e.detail.map( o => o.value ), setOpts);
    } else {
      this.ctl.qs.setParam(filterName, e.detail?.value, setOpts);
    }
  };
  return html`
    <div class='filter filter--select field-container'>
      <label for=${this.ctl.idGen.get(filterName)}>${filter.label}</label>
      <ucd-theme-slim-select @change=${onChange}>
        <select
          id=${this.ctl.idGen.get(filterName)}
          ?multiple=${filter.multiple}>
          ${!filter.multiple ? html`<option value="" ?selected=${!this.ctl.qs.query?.[filterName]}>-- Select an option --</option>` : null}
          ${filter.options.map( item => html`
            <option 
              value=${item.value}
              ?selected=${filter.multiple ? (this.ctl.qs.query?.[filterName] || []).includes(item.value) : this.ctl.qs.query?.[filterName] === item.value}>
              ${item.label}
            </option>
          `)}
        </select>
      </ucd-theme-slim-select>
    </div>
  `
}

function _renderDateFilter(filterName){
  if ( !this.availableFilters?.[filterName] || this.availableFilters[filterName].type !== 'date' ) return html``;
  const filter = this.availableFilters[filterName];
  return html`
    <div class='filter filter--date field-container'>
      <label for=${this.ctl.idGen.get(filterName)}>${filter.label}</label>
      <input 
        type="date" 
        id=${this.ctl.idGen.get(filterName)}
        value=${this.ctl.qs.query?.[filterName] || ''}
        @change=${(e) => {
          this.ctl.qs.setParam(filterName, e.target.value, {reflect: true, resetPage: true});
        }}>
    </div>
  `
}