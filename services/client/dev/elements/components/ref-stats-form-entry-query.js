import { LitElement } from 'lit';
import {render} from "./ref-stats-form-entry-query.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController, QueryStringController} from '#controllers';
import { IdGenerator } from '#client-utils';

export default class RefStatsFormEntryQuery extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      formNameOrId: { type: Array },
      latestVersion: { type: Boolean, attribute: 'latest-version' },
      displayedFields: { type: Array },
      maxPage: {type: Number },
      formEntries: {type: Array },
      formFields: { type: Object },
      mobileThreshold: { type: Number },
      expandedEntries: { type: Array }
    }
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.formEntries = [];
    this.formNameOrId = [];
    this.latestVersion = false;
    this.maxPage = 1;
    this.formFields = {};
    this.mobileThreshold = 768;
    this.expandedEntries = [];
    this.displayedFields = [];

    this.ctl = {
      appComponent : new AppComponentController(this),
      qs : new QueryStringController(this),
      idGen: new IdGenerator(this)
    }

    this.id = this.ctl.idGen.get('self');

    this._injectModel('FormEntryModel', 'AppStateModel', 'FieldModel');
  }

  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    await this.ctl.qs.updateComplete;
    this.expandedEntries = [];
    await this.query();
  }

  async query(){
    const q = {...this.ctl.qs.query};
    if ( this.formNameOrId.length ) {
      q.form = this.formNameOrId;
    }
    if ( this.latestVersion ) {
      q.is_latest_version = true;
    }

    const promises = [this.FormEntryModel.query(q)];
    for ( const formNameOrId of this.formNameOrId ) {
      promises.push(this.FieldModel.query({form: formNameOrId, per_page: 500}));
    }

    const [res, ...formFields] = await Promise.all(promises);
    if ( res.state !== 'loaded' ) {
      this.formEntries = [];
      this.maxPage = 1;
      return;
    }
    this.formEntries = res.payload.results;
    this.maxPage = res.payload.max_page;

    this.formFields = {};
    formFields.forEach((r, i) => {
      if ( r.state === 'loaded' ) {
        for ( const field of r.payload.results ) {
          this.formFields[field.name] = field;
        }
      }
    });

    console.log(this.formEntries, this.formFields);
  }

  toggleEntryExpanded(entryId){
    const idx = this.expandedEntries.indexOf(entryId);
    if ( idx === -1 ) {
      this.expandedEntries.push(entryId);
    } else {
      this.expandedEntries.splice(idx, 1);
    }
    this.requestUpdate();
  }

  _onPageChange(e){
    this.ctl.qs.setParam('page', e.detail.page);
    this.ctl.qs.setLocation();
  }

  getFieldLabel(fieldName){
    if ( fieldName === '_created_at' ) return 'Submitted At';
    const field = this.formFields[fieldName];
    return field ? field.label : fieldName;
  }

}

customElements.define('ref-stats-form-entry-query', RefStatsFormEntryQuery);