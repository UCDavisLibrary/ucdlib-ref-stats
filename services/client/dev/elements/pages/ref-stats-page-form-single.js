import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-form-single.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

export default class RefStatsPageFormSingle extends Mixin(LitElement)
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

    this._injectModel('AppStateModel', 'FormModel');
  }

  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.nameOrId = e.location.path[1];
    this.data = {};
    
    const res = await this.FormModel.get(this.nameOrId);
      if ( res?.state === 'loaded' ) {
        this.data = {...res.payload};
      }
  }

}

customElements.define('ref-stats-page-form-single', RefStatsPageFormSingle);