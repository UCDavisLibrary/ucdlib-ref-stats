import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-form-entry-query-download.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController, QueryStringController} from '#controllers';

export default class RefStatsFormEntryQueryDownload extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      formNameOrId: { type: Array },
      latestVersion: { type: Boolean, attribute: 'latest-version' },
      mine: { type: Boolean },
      totalCount: { state: true },
      isDownloading: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.formNameOrId = [];
    this.latestVersion = false;
    this.mine = false;
    this.totalCount = 0;
    this.isDownloading = false;

    this.ctl = {
      appComponent : new AppComponentController(this),
      qs : new QueryStringController(this)
    }

    this._injectModel('FormEntryModel', 'AppStateModel');
  }

  /**
   * @description Callback for app state updates
   */
  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    await this.ctl.qs.updateComplete;
    await this.query();
  }

  /**
   * @description Query for form entries based on current properties and query string params. 
   * @returns 
   */
  async query(){
    const q = {...this.ctl.qs.query};
    if ( this.formNameOrId.length && !q.form ) {
      q.form = this.formNameOrId;
    }
    if ( this.mine ) {
      q.mine = true;
    }
    if ( this.latestVersion ) {
      q.is_latest_version = true;
    }

    const res = await this.FormEntryModel.query(q);

    if ( res.state !== 'loaded' ) {
      this.totalCount = 0;
      return;
    }
    this.totalCount = res.payload.total_count;
  }

  async _onDownloadClick(){
    if ( this.isDownloading ) return;
    this.isDownloading = true;
    const q = this.ctl.qs.getQuery(true);
    if ( this.formNameOrId.length && !q.form ) {
      q.form = this.formNameOrId;
    }
    if ( this.mine ) {
      q.mine = true;
    }
    if ( this.latestVersion ) {
      q.is_latest_version = true;
    }
    const opts = {
      filename: `library-services-form-submissions-${new Date().toISOString()}.csv`
    }
    const res = await this.FormEntryModel.export(q, opts);
    if ( res.error ){
      this.AppStateModel.showToast( {message: 'Error downloading submissions', type: 'error'} );
    }
    this.isDownloading = false;
  }

}

customElements.define('ref-stats-form-entry-query-download', RefStatsFormEntryQueryDownload);