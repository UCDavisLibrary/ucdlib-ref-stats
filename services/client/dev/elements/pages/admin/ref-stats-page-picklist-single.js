import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-picklist-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

export default class RefStatsPagePicklistSingle extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      picklistId: {type: String}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.picklistId = null;

    this._injectModel('AppStateModel');
  }

  _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.picklistId = e.location.path[1] === 'new' ? null : e.location.path[1];
  }

}

customElements.define('ref-stats-page-picklist-single', RefStatsPagePicklistSingle);