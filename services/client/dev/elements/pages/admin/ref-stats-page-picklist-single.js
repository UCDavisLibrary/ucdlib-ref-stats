import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-picklist-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

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

  _onPicklistUpdated(e){
    if ( e.detail.newPicklist || e.detail.deleted ) {
      this.AppStateModel.setLocation('/picklist')
    } else {
      this.AppStateModel.refresh();
    }
  }

}

customElements.define('ref-stats-page-picklist-single', RefStatsPagePicklistSingle);