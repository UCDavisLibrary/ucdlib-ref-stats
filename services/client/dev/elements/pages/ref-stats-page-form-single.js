import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-form-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

/**
 * @description Page element for displaying a single reference form by name or ID.
 * Fetches form data from FormModel on app-state updates.
 * @property {String} pageId - The page identifier used to match app-state route events
 * @property {String} nameOrId - The name or ID of the form resolved from the URL path segment
 * @property {Object} data - The loaded form data object
 */
export default class RefStatsPageFormSingle extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      nameOrId: {type: String },
      entryId: {type: String },
      data: {type: Object }
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

    this._injectModel('AppStateModel', 'FormModel');
  }

  /**
   * @description Handles app-state updates. Fetches the form identified by the second URL
   * path segment and stores the result in `data`.
   * @param {Object} e - App-state event object containing page and location
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.nameOrId = e.location.path[1];
    this.entryId = e.location.path[2];
    this.data = {};
    
    const res = await this.FormModel.get(this.nameOrId);
    if ( res?.state === 'loaded' ) {
      this.data = {...res.payload};
    }
  }

  _onNewSubmissionClick(){
    if ( this.entryId ) {
      this.AppStateModel.setLocation(`/form/${this.nameOrId}`);
    } else {
      const entryEle = this.renderRoot.querySelector('ref-stats-form-entry');
      entryEle?.ctl?.formEntry?._onReset();
    }
  }

}

customElements.define('ref-stats-page-form-single', RefStatsPageFormSingle);