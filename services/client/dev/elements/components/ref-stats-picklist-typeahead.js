import { LitElement } from 'lit';
import { render } from "./ref-stats-picklist-typeahead.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { DropdownController } from '#controllers';

export default class RefStatsPicklistTypeahead extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      value: { type: String },
      inputId: { type: String, attribute: 'input-id' },
      suggestions: { type: Array },
      nameOrId: { type: String, attribute: 'name-or-id' },
      activeOnly: { type: Boolean, attribute: 'active-only' },
      suggestionLimit: { type: Number, attribute: 'suggestion-limit' },
      totalSuggestions: { state: true },
      fetchError: { state: true },
      selectedSuggestion: { type: Object },
      
    }
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.value = '';
    this.suggestions = [];
    this.suggestionLimit = 5;
    this.fetchError = false;
    this.totalSuggestions = 0;
    this.selectedSuggestion = null;
    this.activeOnly = false;

    this.ctl = {
      dropdown: new DropdownController(this, {defaultMaxHeight: 190, belowCustomStyles: { borderTop: 'none' }, arrowStepSelector: '.suggestion-item' })
    }

    this._injectModel('PicklistModel');
  }

  willUpdate(props){
    if ( props.has('nameOrId') ) {
      this.getByNameOrId();
    }
  }

  async getByNameOrId(){
    if ( !this.nameOrId ) {
      this.value = '';
      return;
    }
    if ( [this.selectedSuggestion?.picklist_id, this.selectedSuggestion?.name].includes(this.nameOrId) ) {
      this.value = this.selectedSuggestion.label;
      return;
    }
    const res = await this.PicklistModel.get(this.nameOrId);
    if ( res.state === 'loaded' ) {
      this.selectedSuggestion = res.payload;
      this.value = res.payload.label;
    } else {
      this.value = '';
    }
  }

  async _onValueInput(e){
    this.selectedSuggestion = null;
    this.value = e.target.value;
    if ( this.searchTimeout ) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(async () => {
      this.ctl.dropdown.open = false;
      await this.getSuggestions();
      this.ctl.dropdown.open = true;
    }, 300);

  }

  _onSuggestionClick(suggestion){
    this.selectedSuggestion = suggestion;
    this.nameOrId = suggestion.picklist_id;
    this.ctl.dropdown.open = false;
    this.dispatchEvent(new CustomEvent('picklist-typeahead-selected', {
      detail: { picklist: suggestion },
      bubbles: true,
      composed: true
    }));
  }

  async getSuggestions(){
    this.fetchError = false;
    const query = {
      limit: this.suggestionLimit
    }
    if ( this.activeOnly ) {
      query['active-only'] = true;
    }
    if ( this.value) {
      query.q = this.value;
    }
    const req = await this.PicklistModel.query(query, { loaderSettings: {suppressLoader: true}, errorSettings: {suppressError: true} });
    if ( req.state === 'error' ){
      this.suggestions = [];
      this.fetchError = req.error.response.status !== 404;
      return;
    }
    this.suggestions = req.payload.results;
    this.totalSuggestions = req.payload.total_count;
  }

}

customElements.define('ref-stats-picklist-typeahead', RefStatsPicklistTypeahead);