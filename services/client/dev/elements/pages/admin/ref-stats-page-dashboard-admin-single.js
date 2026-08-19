import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-dashboard-admin-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AdminPageController } from '#controllers';

/**
 * @description Admin page element for creating or editing a single dashboard.
 * Resolves the dashboard from the URL path and handles post-save navigation.
 * @property {String} pageId - The page identifier used to match app-state route events
 * @property {String} nameOrId - The name or ID from the URL path segment, or null when creating a new dashboard
 * @property {Object} data - The loaded dashboard data object
 */
export default class RefStatsPageDashboardAdminSingle extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      nameOrId: {type: String},
      data: {type: Object}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.nameOrId = null;
    this.data = {};

    this.ctl = {
      adminPage: new AdminPageController(this)
    }

    this._injectModel('AppStateModel', 'DashboardModel');
  }

  /**
   * @description Handles app-state updates. Sets `nameOrId` from the URL path segment
   * (null when the segment is "new") and fetches the corresponding dashboard data.
   * @param {Object} e - App-state event object containing page and location
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    this.data = {};

    if ( this.nameOrId ) {
      const res = await this.DashboardModel.get(this.nameOrId);
      if ( res?.state === 'loaded' ) {
        this.data = {...res.payload};
      }
    }
  }

  /**
   * @description Handles dashboard-updated events from the form component.
   * Redirects to the new dashboard URL on create, or refreshes on update.
   * @param {CustomEvent} e - Event with detail.newDashboard flag and detail.dashboard object
   */
  _onDashboardUpdated(e) {
    if ( e.detail?.deleted ) {
      this.AppStateModel.setLocation('/analytics-admin');
      return;
    }
    if ( e.detail?.newDashboard ) {
      this.AppStateModel.setLocation(`/analytics-admin/${e.detail.dashboard.name}`);
    } else {
      this.AppStateModel.refresh();
    }
  }

}

customElements.define('ref-stats-page-dashboard-admin-single', RefStatsPageDashboardAdminSingle);
