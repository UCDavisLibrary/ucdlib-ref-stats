import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-picklist-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

/**
 * @description Admin page element for creating or editing a single picklist.
 * Resolves the picklist from the URL path and handles post-save navigation.
 * @property {String} pageId - The page identifier used to match app-state route events
 * @property {String} picklistId - The ID of the picklist resolved from the URL path segment, or null when creating a new picklist
 * @property {Object} data - The loaded picklist data object
 */
export default class RefStatsPagePicklistSingle extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      picklistId: {type: String},
      data: {type: Object }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.picklistId = null;
    this.data = {};

    this._injectModel('AppStateModel', 'PicklistModel');
  }

  /**
   * @description Handles app-state updates. Sets `picklistId` from the URL path segment
   * (null when the segment is "new") and fetches the corresponding picklist data.
   * @param {Object} e - App-state event object containing page and location
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.picklistId = e.location.path[1] === 'new' ? null : e.location.path[1];
    this.data = {};

    if ( this.picklistId ) {
      const res = await this.PicklistModel.get(this.picklistId);
      if ( res?.state === 'loaded' ) {
        this.data = {...res.payload};
      }
    }

  }

  /**
   * @description Handles picklist-updated events. Navigates back to the picklist list
   * when a picklist is newly created or deleted, otherwise refreshes the current page.
   * @param {CustomEvent} e - Event containing detail.newPicklist and detail.deleted flags
   */
  _onPicklistUpdated(e){
    if ( e.detail.newPicklist || e.detail.deleted ) {
      this.AppStateModel.setLocation('/picklist')
    } else {
      this.AppStateModel.refresh();
    }
  }

}

customElements.define('ref-stats-page-picklist-single', RefStatsPagePicklistSingle);