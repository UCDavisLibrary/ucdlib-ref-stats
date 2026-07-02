import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-app.tpl.js";

import config from '#lib/app-config.js';

// global css
import '../css/index.js';

// theme elements
import '@ucd-lib/theme-elements/brand/ucd-theme-primary-nav/ucd-theme-primary-nav.js';
import '@ucd-lib/theme-elements/brand/ucd-theme-header/ucd-theme-header.js';
import '@ucd-lib/theme-elements/ucdlib/ucdlib-branding-bar/ucdlib-branding-bar.js';
import '@ucd-lib/theme-elements/brand/ucd-theme-quick-links/ucd-theme-quick-links.js';
import '@ucd-lib/theme-elements/ucdlib/ucdlib-pages/ucdlib-pages.js';
import '@ucd-lib/theme-elements/brand/ucd-theme-pagination/ucd-theme-pagination.js';
import '@ucd-lib/theme-elements/brand/ucd-theme-slim-select/ucd-theme-slim-select.js';

import { Registry, LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

// pages loaded upfront
import './pages/ref-stats-page-home.js';
import './pages/ref-stats-page-form-single.js';
import './pages/ref-stats-page-form-entries.js';
import './pages/ref-stats-page-reports.js';

// app global components
import './components/cork-app-dialog-modal.js';
import './components/cork-app-error.js';
import './components/cork-app-loader.js';
import './components/cork-app-toast.js';
import './components/cork-field-container.js';
import './components/ref-stats-picklist-item-quick-add.js';
import './components/ref-stats-form-entry-query.js';

import { bundleLoader } from '#client-utils';

// icon elements and model
import '@ucd-lib/cork-icon';

// cork models
import '#lib/cork/models/ValidationModel.js';
import '#lib/cork/models/AppStateModel.js';
import '#lib/cork/models/FieldModel.js';
import '#lib/cork/models/FormEntryModel.js';
import '#lib/cork/models/FormModel.js';
import '#lib/cork/models/PicklistModel.js';
import AuthModel from '#lib/cork/models/AuthModel.js';

Registry.ready();


/**
 * @description Root application element. Bootstraps the SPA, loads page bundles on demand,
 * and handles top-level app-state updates including page routing and nav management.
 * @property {String} page - The current page identifier driven by AppStateModel
 * @property {Boolean} _firstAppStateUpdate - Tracks whether the first app-state update has been processed
 */
export default class RefStatsApp extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      page: {type: String},
      forms: {type: Array},
      _firstAppStateUpdate : { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.page = '';
    this._firstAppStateUpdate = false;
    this.forms = [];

    this._injectModel('AppStateModel', 'AuthModel', 'FormModel');
  }

  /**
   * @description Called after the element's first render. Triggers an AppStateModel refresh
   * to load the initial page state.
   */
  firstUpdated(){
    this.AppStateModel.refresh();
  }

  /**
   * @description Handles app-state updates. Hides the full-site loader on first call,
   * closes the nav, loads any required JS bundle for the new page, and updates the
   * active page property.
   * @param {Object} e - App-state event object containing page and location
   */
  async _onAppStateUpdate(e) {
    this.logger.info('appStateUpdate', e);
    if ( !this._firstAppStateUpdate ) {
      this._firstAppStateUpdate = true;
      this.hideFullSiteLoader();
    }
    this.closeNav();
    const { page, location } = e;

    const bundleLoadedForFirstTime = await bundleLoader.loadForPage(page);
    if ( bundleLoadedForFirstTime ) {
      this.AppStateModel.refresh();
      return;
    }
    await this.getForms();
    this.page = page;
  }

  async getForms(){
    const q = {active_only: true};
    if ( !this.AuthModel.token.hasManagerAccess ){
      q.name = this.AuthModel.token.forms.join(',');
    }
    const res = await this.FormModel.query(q);
    if ( res.state !== 'loaded' ) {
      this.forms = [];
      return;
    }
    this.forms = res.payload.results;
  }

  /**
   * @description Hide the full site loader after a timeout
   * @param {*} timeout
   */
  async hideFullSiteLoader(timeout=300){
    await new Promise(resolve => setTimeout(resolve, timeout));
    document.querySelector('#site-loader').style.display = 'none';
    this.style.display = 'block';
  }

  /**
   * @description Close the app's primary nav menu
   */
  closeNav(){
    let ele = this.renderRoot.querySelector('ucd-theme-header');
    if ( ele ) {
      ele.close();
    }
    ele = this.renderRoot.querySelector('ucd-theme-quick-links');
    if ( ele ) {
      ele.close();
    }
  }

}

// initialize the app after doing auth
const init = async () => {
  await AuthModel.init(['ref-stats-app', RefStatsApp]);
}
init();
