import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-fields.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController, QueryStringController} from '#controllers';
import { IdGenerator } from '#client-utils';

export default class RefStatsFields extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      fields: {type: Array },
      maxPage: {type: Number }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.fields = [];
    this.maxPage = 1;

    this.ctl = {
      appComponent : new AppComponentController(this),
      qs: new QueryStringController(this),
      idGen: new IdGenerator(this)
    }

    this._injectModel('FieldModel', 'AppStateModel');
  }

  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    await this.ctl.qs.updateComplete;
    await this.query();
  }

  async query(){
    const res = await this.FieldModel.query(this.ctl.qs.query);
    if ( res.state !== 'loaded' ) {
      this.fields = [];
      this.maxPage = 1;
      return;
    }
    this.fields = res.payload.results;
    this.maxPage = res.payload.max_page;
  }

  _onPageChange(e){
    this.ctl.qs.setParam('page', e.detail.page);
    this.ctl.qs.setLocation();
  }

  _onSearchInput(e) {
    const value = e.target.value;
    if ( this.searchTimeout ) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if ( value ) {
        this.ctl.qs.setParam('q', value);
      } else {
        this.ctl.qs.deleteParam('q');
      }
      this.ctl.qs.setParam('page', 1);
      this.ctl.qs.setLocation();
    }, 300);
  }

}

customElements.define('ref-stats-fields', RefStatsFields);