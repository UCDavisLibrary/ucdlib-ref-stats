import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-dashboards.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {QueryStringController} from '#controllers';
import { IdGenerator } from '#client-utils';

/**
 * @description Public page element that lists available dashboards with label search and form filter.
 * @property {String} pageId - The page identifier used to match app-state route events
 * @property {Array} dashboards - Paginated list of dashboard objects
 * @property {Number} maxPage - Total number of pages available for the current query
 */
export default class RefStatsPageDashboards extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      dashboards: {type: Array},
      maxPage: {type: Number}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.dashboards = [];
    this.maxPage = 1;

    this.ctl = {
      qs: new QueryStringController(this),
      idGen: new IdGenerator(this)
    }

    this._injectModel('AppStateModel', 'DashboardModel');
  }

  /**
   * @description Responds to app-state changes. Triggers a query when this is the active page.
   * @param {Object} e - App state update event
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    await this.ctl.qs.updateComplete;
    await this.query();
  }

  /**
   * @description Fetches dashboards from the DashboardModel using current query-string parameters.
   */
  async query() {
    const q = {...this.ctl.qs.query, active_only: true};
    const res = await this.DashboardModel.query(q);
    if ( res.state !== 'loaded' ) {
      this.dashboards = [];
      this.maxPage = 1;
      return;
    }
    this.dashboards = res.payload.results;
    this.maxPage = res.payload.max_page;
  }

  /**
   * @description Handles pagination changes by updating the page query-string parameter.
   * @param {CustomEvent} e - Event with detail.page containing the new page number
   */
  _onPageChange(e) {
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
   * @description Handles label search input with a 300ms debounce.
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

customElements.define('ref-stats-page-dashboards', RefStatsPageDashboards);
