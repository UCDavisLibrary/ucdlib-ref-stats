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
    ref-stats-form-entry-query .grid-row--header {
      border-bottom: 2px solid var(--ucd-gold-80, #FFD24C);
      font-weight: 700;
      padding: 1rem .5rem;
      box-sizing: border-box;
    }
    ref-stats-form-entry-query .grid-row--data {
      display: grid;
      align-items: stretch;
      width: 100%;
      box-sizing: border-box;
    }
    ref-stats-form-entry-query .grid-row__cell {
      overflow-wrap: anywhere;
    }
    ref-stats-form-entry-query .details {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: .5rem;
      font-size: var(--font-size--small, .75rem);
      margin-top: .75rem;
      margin-left: 90px;
    }
    ref-stats-form-entry-query .form-entry {
      border-bottom: 1px solid var(--ucd-blue-60, #B0D0ED);
      padding: 1rem .5rem;
    }
    ref-stats-form-entry-query .form-entry:hover {
      background-color: var(--ucd-gold-30, #FFF9E6);
    }
    ref-stats-form-entry-query .form-entry:focus-within {
      background-color: var(--ucd-gold-30, #FFF9E6);
    }
    @container (min-width: 400px) {
      ref-stats-form-entry-query .details {
        max-width: 1000px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
      }
    }
    @container (min-width: 600px) {
      ref-stats-form-entry-query .details {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    @container (min-width: 800px) {
      ref-stats-form-entry-query .details {
        grid-template-columns: repeat(6, minmax(0, 1fr));
      }
    }

  `;

  return [elementStyles];
}

/**
 * @description Primary render function for this element
 */
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

/**
 * @description Render the grid(table) header based on displayed fields
 * @param {Boolean} mobile - Whether to render the mobile version of the header
 */
function _renderGridHeader(mobile) {
  const items = this.displayedFields.filter(f => mobile ? f.mobileFr : f.desktopFr);
  return html`
    <div class='grid-row grid-row--header'>
      <div></div>
      ${items.map(f => html`<div class='grid-row__cell'>${this.getFieldLabel(f.field)}</div>`)}
    </div>
  `;
}

/**
 * @description Render a single form entry row
 * @param {Object} formEntry - The form entry object to render
 * @param {Boolean} mobile - Whether to render the mobile version of the entry
 */
function _renderFormEntry(formEntry, mobile) {
  const isExpanded = this.expandedEntries.includes(formEntry.form_entry_id);
  const gridItems = this.displayedFields.filter(f => mobile ? f.mobileFr : f.desktopFr);
  const detailItems = this.displayedFields.filter(f => mobile ? !f.mobileFr : !f.desktopFr);
  return html`
    <div class='form-entry'>
      <div class='grid-row grid-row--data'>
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
            ?hidden=${detailItems.length === 0}
            >
          </cork-icon-button>
        </div>
        ${gridItems.map(f => html`<div class='grid-row__cell'>${this.getFieldValue(formEntry, f.field)}</div>`)}
      </div>
      <div ?hidden=${!isExpanded} class='details'>
        ${detailItems.map(f => html`
          <div>
            <div class='bold'>${this.getFieldLabel(f.field)}:</div>
            <div>${this.getFieldValue(formEntry, f.field)}</div>
          </div>
          `)}
      </div>
    </div>
  `;
}

/**
 * @description Render container query styles for mobile/desktop layout switching
 */
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

/**
 * @description Render grid CSS template based on displayed fields and their fractional units
 */
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