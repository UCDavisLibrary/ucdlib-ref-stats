import { html, css, unsafeCSS } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-form-entry-query {
      display: block;
      container-type: inline-size;
    }
    ref-stats-form-entry-query .entry-actions {
      display: flex;
      align-items: center;
      gap: .25rem;
      --cork-icon-button-size: 1.75rem;
    }
    ref-stats-form-entry-query .grid-row {
      display: grid;
      gap: .5rem;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    ${_renderContainerQuery.call(this)}
    ${_renderGridCss.call(this)}
    <div>
      <div ?hidden=${this.formEntries.length} class='alert'>No submissions found</div>
      <div ?hidden=${!this.formEntries.length}>
        <div class='mobile'>
          ${_renderGridHeader.call(this, true)}
          ${this.formEntries.map(formEntry => _renderFormEntry.call(this, formEntry, true))}
        </div>
        <div class='desktop'>
          ${_renderGridHeader.call(this, false)}
          ${this.formEntries.map(formEntry => _renderFormEntry.call(this, formEntry, false))}
        </div>
        
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

function _renderGridHeader(mobile) {
  const items = this.displayedFields.filter(f => mobile ? f.mobileFr : f.desktopFr);
  return html`
    <div class='grid-row grid-row--header'>
      <div></div>
      ${items.map(f => html`<div>${this.getFieldLabel(f.field)}</div>`)}
    </div>
  `;
}

function _renderFormEntry(formEntry, mobile) {
  const isExpanded = this.expandedEntries.includes(formEntry.form_entry_id);
  return html`
    <div>
      <div class='grid-row'>
        <div class='entry-actions'>
          <cork-icon-button 
            basic
            icon='fas.pen-to-square'
            link-aria-label='Edit Submission'
            href='/form/${formEntry.form_name}/${formEntry.form_entry_id}'
            >
          </cork-icon-button>
          <cork-icon-button 
            basic
            title='${isExpanded ? 'Collapse' : 'Expand'} Submission Details'
            icon='fas.${isExpanded ? 'chevron-up' : 'chevron-down'}'
            @click=${() => this.toggleEntryExpanded(formEntry.form_entry_id)}
            >
          </cork-icon-button>
        </div>

        </div>
      </div>
    </div>
  `;
}

function _renderContainerQuery(){
  const css = `
    #${this.id} .desktop {
      display: none !important;
    }
    @container (min-width: ${this.mobileThreshold}px) {
      #${this.id} .mobile {
        display: none !important;
      };
    }
    @container (min-width: ${this.mobileThreshold}px) {
      #${this.id} .desktop {
        display: block !important;
      }
    }
  `;
  return html`<style>${unsafeCSS(css)}</style>`;
}

function _renderGridCss(){
  const css = `
    #${this.id} .desktop .grid-row {
      grid-template-columns: 80px ${this.displayedFields.filter(f => f.desktopFr).map(f => `minmax(0, ${f.desktopFr}fr)`).join(' ')} ;
    }
    #${this.id} .mobile .grid-row {
      grid-template-columns: 80px ${this.displayedFields.filter(f => f.mobileFr).map(f => `minmax(0, ${f.mobileFr}fr)`).join(' ')};
    }
  `;
  return html`<style>${unsafeCSS(css)}</style>`;
}