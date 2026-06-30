import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-form-entries.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

/**
 * @description Page element for displaying all entries for a given form.
 * Route: /form/<formNameOrId>/entries
 * @property {String} pageId - The page ID used by ucdlib-pages for routing
 * @property {String} nameOrId - The form name or ID from the URL path
 * @property {Object} data - The form object fetched from the API
 * @property {Array} displayedFields - RefStatsDisplayField[] passed to ref-stats-form-entry-query
 */
export default class RefStatsPageFormEntries extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      nameOrId: {type: String},
      data: {type: Object},
      displayedFields: {type: Array}
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
    this.displayedFields = [];

    this._injectModel('AppStateModel', 'FormModel', 'AuthModel');
  }

  /**
   * @description Callback for app state updates. Loads form data and computes displayedFields.
   * @param {Object} e - App state event
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.nameOrId = e.location.path[1];
    this.data = {};

    const res = await this.FormModel.get(this.nameOrId);
    if ( res?.state === 'loaded' ) {
      this.data = {...res.payload};
    }

    const configured = this.data?.form_display_settings?.queryElementFields;
    let displayedFields = configured?.length
      ? configured
      : [{field: '_id', desktopFr: 1, mobileFr: 1}, {field: '_created_at', desktopFr: 1, mobileFr: 1}];
    
    if ( this.AuthModel.token.hasManagerAccess || this.AuthModel.userIsAGroupHead ) {
      displayedFields.splice(0, 0, {field: '_submitter', desktopFr: 1, mobileFr: 1});
    }
    this.displayedFields = displayedFields;
  }

}

customElements.define('ref-stats-page-form-entries', RefStatsPageFormEntries);
