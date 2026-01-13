import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-forms.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController, QueryStringController} from '#controllers';
import { IdGenerator } from '#client-utils';

export default class RefStatsForms extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {


  static get properties() {
    return {
      forms: {type: Array},
      maxPage: {type: Number }
      
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.forms = [];
    this.maxPage = 1;

    this.ctl = {
      appComponent : new AppComponentController(this),
      qs : new QueryStringController(this),
      idGen: new IdGenerator(this)
    }

    this._injectModel('FormModel', 'AppStateModel');
  }

  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    await this.ctl.qs.updateComplete;
    await this.query();
  }

  async query(){
    const res = await this.FormModel.query(this.ctl.qs.query);
    if ( res.state !== 'loaded' ) {
      this.forms = [];
      this.maxPage = 1;
      return;
    }
    this.forms = res.payload.results;
    this.maxPage = res.payload.max_page;
  }

  _onPageChange(e){
    this.ctl.qs.setParam('page', e.detail.page);
    this.ctl.qs.setLocation();
  }

}

customElements.define('ref-stats-forms', RefStatsForms);