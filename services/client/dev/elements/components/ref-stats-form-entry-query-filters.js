import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-form-entry-query-filters.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController, QueryStringController} from '#controllers';
import { IdGenerator } from '#client-utils';

export default class RefStatsFormEntryQueryFilters extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {


  static get properties() {
    return {
      formNameOrId: { type: Array },
      showFormFilter: { type: Boolean, attribute: 'show-form-filter' },
      availableFilters: { type: Object },
      fieldFilters: { type: Array }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.formNameOrId = [];
    this.availableFilters = {};
    this.fieldFilters = [];
    this.showFormFilter = false;

    this.ctl = {
      appComponent : new AppComponentController(this),
      qs : new QueryStringController(this),
      idGen: new IdGenerator(this)
    }

    this._injectModel('AuthModel', 'FormEntryModel', 'AppStateModel');
  }

  willUpdate(props){
    if ( props.has('availableFilters') ){

      // Set query-string param types for filters that allow multiple values
      const queryParamTypes = {};
      for ( const [filterName, filter] of Object.entries(this.availableFilters) ) {
        if ( filter.multiple ) {
          queryParamTypes[filterName] = 'array';
        }
      }
      this.ctl.qs.types = queryParamTypes;
      this.ctl.qs.syncState();

      const fieldFilters = [];
      for ( const [filterName, filter] of Object.entries(this.availableFilters) ) {
        if ( !filter.isField ) continue;
        fieldFilters.push({name: filterName, sort_order: filter.sort_order, sort_order_secondary: filter.sort_order_secondary || 0});
      }
      this.fieldFilters = fieldFilters.sort((a,b) => {
        if ( a.sort_order === b.sort_order ) {
          return a.sort_order_secondary - b.sort_order_secondary;
        }
        return a.sort_order - b.sort_order;
      });
    }
  }

  /**
   * @description Callback for app state updates
   */
  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    await this.ctl.qs.updateComplete;
    await this.getFilters();
  }

  /**
   * @description Fetches available filters from the server based on element attributes and user role.
   */
  async getFilters() {
    let filters = {};
    const opts = {};
    if ( this.formNameOrId.length > 0 ) {
      opts.form = this.formNameOrId[0];
    }
    if ( this.showFormFilter ) {
      opts.form_filter = true;
    }
    const res = await this.FormEntryModel.filters(opts);
    if ( res.state === 'loaded' ) {
      filters = res.payload;
    }
    this.availableFilters = filters;
  }

  _onFormFilterChange(e) {
    this.ctl.qs.setParam('form', e.detail.map( o => o.value ), {resetPage: true});
    for ( const [filterName, filter] of Object.entries(this.availableFilters) ) {
      if ( filter.isField && !filter.filter_forms?.some(f => this.ctl.qs.query?.form?.includes(f.form_name)) ) {
        this.ctl.qs.deleteParam(filterName);
      }
    }
    this.ctl.qs.setLocation();
  }

}

customElements.define('ref-stats-form-entry-query-filters', RefStatsFormEntryQueryFilters);