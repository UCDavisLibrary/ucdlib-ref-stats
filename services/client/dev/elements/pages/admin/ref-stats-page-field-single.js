import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-field-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { QueryStringController } from '#controllers';


/**
 * @description Admin page element for creating or editing a single reference-stats field.
 * Resolves the field from the URL path and handles post-save navigation.
 * @property {String} pageId - The page identifier used to match app-state route events
 * @property {String} nameOrId - The name or ID of the field resolved from the URL path segment, or null when creating a new field
 * @property {Object} data - The loaded field data object
 */
export default class RefStatsPageFieldSingle extends Mixin(LitElement)
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
      qs: new QueryStringController(this)
    }

    this._injectModel('AppStateModel', 'FieldModel');
  }

  /**
   * @description Handles app-state updates. Sets `nameOrId` from the URL path segment
   * (null when the segment is "new") and fetches the corresponding field data.
   * @param {Object} e - App-state event object containing page and location
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    this.data = {};

    if ( this.nameOrId ) {
      const res = await this.FieldModel.get(this.nameOrId);
      if ( res?.state === 'loaded' ) {
        this.data = {...res.payload};
      }
    }

  }

  /**
   * @description Handles field-updated events. Navigates back to the field list on
   * deletion, refreshes the current page on an existing-field update, or redirects
   * to the new field's URL when a field is first created.
   * @param {CustomEvent} e - Event containing detail.deleted flag and detail.field object
   */
  _onFieldUpdated(e) {
    if ( e.detail.deleted ){
      this.AppStateModel.setLocation('/field');
    } else if (this.nameOrId ){
      this.AppStateModel.refresh();
    } else if ( e.detail?.field?.name ){
      this.AppStateModel.setLocation(`/field/${e.detail.field.name}`);
    }
    
  }

}

customElements.define('ref-stats-page-field-single', RefStatsPageFieldSingle);