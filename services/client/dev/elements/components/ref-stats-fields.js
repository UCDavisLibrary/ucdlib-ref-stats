import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-fields.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController, QueryStringController} from '#controllers';
import { IdGenerator } from '#client-utils';

/**
 * @description Page-level element for browsing and filtering form fields.
 * Reads query-string parameters to drive a paginated, searchable list of fields.
 * @property {Array} fields - Paginated list of field objects returned by the current query
 * @property {Number} maxPage - Total number of pages available for the current query
 */
export default class RefStatsFields extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      fields: {type: Array },
      maxPage: {type: Number }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.fields = [];
    this.maxPage = 1;

    this.ctl = {
      appComponent : new AppComponentController(this),
      qs: new QueryStringController(this),
      idGen: new IdGenerator(this)
    }

    this._injectModel('FieldModel', 'AppStateModel');
  }

  /**
   * @description Responds to app-state changes. Triggers a query when this element is on the active page.
   * @param {Object} e - App state update event
   */
  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    await this.ctl.qs.updateComplete;
    await this.query();
  }

  /**
   * @description Fetches fields from the FieldModel using the current query-string parameters
   * and updates the fields and maxPage reactive properties.
   */
  async query(){
    const res = await this.FieldModel.query(this.ctl.qs.query);
    if ( res.state !== 'loaded' ) {
      this.fields = [];
      this.maxPage = 1;
      return;
    }
    this.fields = res.payload.results;
    this.maxPage = res.payload.max_page;
  }

  /**
   * @description Handles pagination change events by updating the page query-string parameter.
   * @param {CustomEvent} e - Event with detail.page containing the new page number
   */
  _onPageChange(e){
    this.ctl.qs.setParam('page', e.detail.page);
    this.ctl.qs.setLocation();
  }

  /**
   * @description Handles form typeahead selection by updating the form query-string filter.
   * @param {CustomEvent} e - Event with detail.form containing the selected form object
   */
  _onFormTypeaheadSelected(e) {
    const form = e.detail?.form?.name;
    if ( form ) {
      this.ctl.qs.setParam('form', form);
    } else {
      this.ctl.qs.deleteParam('form');
    }
    this.ctl.qs.setParam('page', 1);
    this.ctl.qs.setLocation();
  }

  /**
   * @description Handles text input in the search box with a 300 ms debounce,
   * updating the q query-string parameter and resetting the page to 1.
   * @param {InputEvent} e - Native input event from the search field
   */
  _onSearchInput(e) {
    const value = e.target.value;
    if ( this.searchTimeout ) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if ( value ) {
        this.ctl.qs.setParam('q', value);
      } else {
        this.ctl.qs.deleteParam('q');
      }
      this.ctl.qs.setParam('page', 1);
      this.ctl.qs.setLocation();
    }, 300);
  }

}

customElements.define('ref-stats-fields', RefStatsFields);