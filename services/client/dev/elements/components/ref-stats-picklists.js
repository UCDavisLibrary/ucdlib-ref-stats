import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-picklists.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController, QueryStringController} from '#controllers';


/**
 * @description Page-level element for browsing the paginated list of picklists.
 * Reads query-string parameters for pagination and fetches picklist data on app-state changes.
 * @property {Array} picklists - Paginated list of picklist objects returned by the current query
 * @property {Number} maxPage - Total number of pages available for the current query
 */
export default class RefStatsPicklists extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      picklists: {type: Array },
      maxPage: {type: Number }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.picklists = [];
    this.maxPage = 1;

    this.ctl = {
      appComponent : new AppComponentController(this),
      qs: new QueryStringController(this)
    }

    this._injectModel('PicklistModel', 'AppStateModel');
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
   * @description Fetches picklists from the PicklistModel using pagination parameters from
   * the query string, and updates the picklists and maxPage reactive properties.
   */
  async query(){
    const query = {};
    if ( this.ctl.qs.query.page ){
      query.page = this.ctl.qs.query.page;
    }
    if ( this.ctl.qs.query.per_page ){
      query.per_page = this.ctl.qs.query.per_page;
    }

    const res = await this.PicklistModel.query(query);
    if ( res.state !== 'loaded' ) {
      this.picklists = [];
      this.maxPage = 1;
      return;
    }
    this.picklists = res.payload.results;
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

}

customElements.define('ref-stats-picklists', RefStatsPicklists);