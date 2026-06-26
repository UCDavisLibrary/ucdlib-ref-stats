import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-form-admin-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AdminPageController } from '#controllers';

/**
 * @description Admin page element for creating or editing a single reference-stats form.
 * Resolves the form from the URL path and handles post-save navigation.
 * @property {String} pageId - The page identifier used to match app-state route events
 * @property {String} nameOrId - The name or ID of the form resolved from the URL path segment, or null when creating a new form
 * @property {Object} data - The loaded form data object
 */
export default class RefStatsPageFormAdminSingle extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      nameOrId: {type: String },
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

    this.ctl = {
      adminPage : new AdminPageController(this)
    }

    this._injectModel('AppStateModel', 'FormModel');
  }

  /**
   * @description Handles app-state updates. Sets `nameOrId` from the URL path segment
   * (null when the segment is "new") and fetches the corresponding form data.
   * @param {Object} e - App-state event object containing page and location
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    this.data = {};

    if ( this.nameOrId ) {
      const res = await this.FormModel.get(this.nameOrId);
      if ( res?.state === 'loaded' ) {
        this.data = {...res.payload};
      }
    }
  }

  /**
   * @description Handles form-updated events. Redirects to the new form's URL when a
   * form is first created, or refreshes the current page on an existing-form update.
   * @param {CustomEvent} e - Event containing detail.newForm flag and detail.form object
   */
  _onFormUpdated(e) {
    if ( e.detail?.newForm ){
      this.AppStateModel.setLocation(`/form-admin/${e.detail.form.name}`);
    } else {
      this.AppStateModel.refresh();
    }
    
  }

}

customElements.define('ref-stats-page-form-admin-single', RefStatsPageFormAdminSingle);