import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-user-form-teasers.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController} from '#controllers';

export default class RefStatsUserFormTeasers extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      forms: {type: Array }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.forms = [];

    this.ctl = {
      appComponent : new AppComponentController(this)
    }

    this._injectModel('AppStateModel', 'AuthModel', 'FormModel');
  }

  /**
   * @description Responds to app-state changes. Triggers a query when this element is on the active page.
   * @param {Object} e - App state update event
   */
  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    await this.query();
  }

  async query(){
    const q = {active_only: true};
    if ( !this.AuthModel.token.hasManagerAccess ){
      q.name = this.AuthModel.token.forms;
    }
    const res = await this.FormModel.query(q);
    if ( res.state !== 'loaded' ) {
      this.forms = [];
      return;
    }
    this.forms = res.payload.results;
  }

}

customElements.define('ref-stats-user-form-teasers', RefStatsUserFormTeasers);