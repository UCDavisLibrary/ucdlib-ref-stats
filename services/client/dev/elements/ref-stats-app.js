import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-app.tpl.js";

// global css
import '../css/index.js';

// theme elements
import '@ucd-lib/theme-elements/brand/ucd-theme-primary-nav/ucd-theme-primary-nav.js';
import '@ucd-lib/theme-elements/brand/ucd-theme-header/ucd-theme-header.js';
import '@ucd-lib/theme-elements/ucdlib/ucdlib-branding-bar/ucdlib-branding-bar.js';
import '@ucd-lib/theme-elements/brand/ucd-theme-quick-links/ucd-theme-quick-links.js';
import '@ucd-lib/theme-elements/ucdlib/ucdlib-pages/ucdlib-pages.js';
import '@ucd-lib/theme-elements/brand/ucd-theme-pagination/ucd-theme-pagination.js';

import { Registry, LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

// app pages
import './pages/ref-stats-page-home.js';

// app global components
import './components/cork-app-dialog-modal.js';
import './components/cork-app-error.js';
import './components/cork-app-loader.js';
import './components/cork-app-toast.js';
import './components/cork-field-container.js';

import bundleLoader from '../utils/bundleLoader.js';

// icon elements and model
import '@ucd-lib/cork-icon';

// cork models
import '../../../lib/cork/models/AppStateModel.js';
import '../../../lib/cork/models/PicklistModel.js';
import '../../../lib/cork/models/ValidationModel.js';
Registry.ready();


export default class RefStatsApp extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      page: {type: String},
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

    this._injectModel('AppStateModel');
  }

  firstUpdated(){
    this.AppStateModel.refresh();
  }

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

    this.page = page;
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

customElements.define('ref-stats-app', RefStatsApp);