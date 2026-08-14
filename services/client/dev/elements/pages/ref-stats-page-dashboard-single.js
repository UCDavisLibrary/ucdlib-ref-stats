import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-dashboard-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { embedDashboard } from '@superset-ui/embedded-sdk';
import config from '#lib/app-config.js';

/**
 * @description Public page element for viewing an individual embedded Superset dashboard.
 * @property {String} pageId - The page identifier used to match app-state route events
 * @property {String} nameOrId - The dashboard name or ID extracted from the URL
 * @property {Object} data - The loaded dashboard data object
 * @property {Boolean} _embedded - Whether embedDashboard has been called for the current record
 */
export default class RefStatsPageDashboardSingle extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      nameOrId: {type: String},
      data: {type: Object},
      _embedded: {state: true}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.nameOrId = '';
    this.data = {};
    this._embedded = false;

    this._injectModel('AppStateModel', 'DashboardModel');
  }

  /**
   * @description Responds to app-state changes. Loads the dashboard record.
   * @param {Object} e - App state update event
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.nameOrId = e.location.path[1] || '';
    this.data = {};
    this._embedded = false;

    if ( !this.nameOrId ) return;

    const res = await this.DashboardModel.get(this.nameOrId);
    if ( res?.state === 'loaded' ) {
      this.data = {...res.payload};
    }
  }

  /**
   * @description After each render, triggers embedding when the dashboard has a Superset ID
   * and has not yet been embedded.
   * @param {Map} changedProps - Changed properties map
   */
  async updated(changedProps) {
    if ( changedProps.has('data') && this.data?.superset_dashboard_id && !this._embedded ) {
      this._embedded = true;
      await this._embed();
    }
  }

  /**
   * @description Calls embedDashboard from the Superset embedded SDK using a guest token
   * fetched from the backend.
   */
  async _embed() {
    const mountPoint = this.renderRoot.querySelector('#superset-embed');
    if ( !mountPoint ) return;

    const supersetDomain = config?.superset?.publicUrl || window.location.origin;

    try {
      await embedDashboard({
        id: this.data.superset_dashboard_id,
        supersetDomain,
        mountPoint,
        fetchGuestToken: async () => {
          const res = await this.DashboardModel.getGuestToken(this.nameOrId);
          if ( res?.state === 'loaded' ) return res.payload.token;
          throw new Error('Unable to fetch guest token');
        },
        dashboardUiConfig: this.data.superset_dashboard_ui_config || {}
      });
    } catch (e) {
      this.logger.error('Failed to embed Superset dashboard', e);
      this.AppStateModel.showToast({text: 'Failed to load dashboard', type: 'error'});
    }
  }

}

customElements.define('ref-stats-page-dashboard-single', RefStatsPageDashboardSingle);
