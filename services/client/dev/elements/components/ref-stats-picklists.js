import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-picklists.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import AppComponentController from '../../controllers/AppComponentController.js';
import QueryStringController from '../../controllers/QueryStringController.js';


export default class RefStatsPicklists extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      picklists: {type: Array },
      maxPage: {type: Number }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.picklists = [];
    this.maxPage = 1;

    this.ctl = {
      appComponent : new AppComponentController(this),
      qs: new QueryStringController(this)
    }

    this._injectModel('PicklistModel', 'AppStateModel');
  }

  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    await this.ctl.qs.updateComplete;
    await this.query();
  }

  async query(){
    const query = {};
    if ( this.ctl.qs.query.page ){
      query.page = this.ctl.qs.query.page;
    }
    if ( this.ctl.qs.query.per_page ){
      query.per_page = this.ctl.qs.query.per_page;
    }

    const res = await this.PicklistModel.query(query);
    if ( res.state !== 'loaded' ) {
      this.picklists = [];
      this.maxPage = 1;
      return;
    }
    this.picklists = res.payload.results;
    this.maxPage = res.payload.max_page;
  }

  _onPageChange(e){
    this.ctl.qs.setParam('page', e.detail.page);
    this.ctl.qs.setLocation();
  }

}

customElements.define('ref-stats-picklists', RefStatsPicklists);