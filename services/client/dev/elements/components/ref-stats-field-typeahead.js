import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-field-typeahead.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { DropdownController } from '#controllers';

export default class RefStatsFieldTypeahead extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      value: { type: String },
      inputId: { type: String, attribute: 'input-id' },
      form: { type: String },
      excludeForm: { type: String, attribute: 'exclude-form' },
      suggestions: { type: Array },
      nameOrId: { type: String, attribute: 'name-or-id' },
      suggestionLimit: { type: Number, attribute: 'suggestion-limit' },
      totalSuggestions: { state: true },
      fetchError: { state: true },
      selectedSuggestion: { type: Object },
      relativeDropdown: { type: Boolean, attribute: 'relative-dropdown' }
    }
  }

  static get styles() {
    return styles();
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

    this._injectModel('FieldModel');
  }

  willUpdate(props){
    if ( props.has('nameOrId') ) {
      this.getByNameOrId();
    }
    if ( props.has('relativeDropdown') ) {
      this.ctl.dropdown.openCustomStyles.position = this.relativeDropdown ? 'relative' : 'absolute';
    }
  }

  async getByNameOrId(){
    if ( !this.nameOrId ) {
      this.value = '';
      return;
    }
    if ( [this.selectedSuggestion?.form_field_id, this.selectedSuggestion?.name].includes(this.nameOrId) ) {
      this.value = this.selectedSuggestion.label;
      return;
    }
    const res = await this.FieldModel.get(this.nameOrId);
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
    this.nameOrId = suggestion.form_field_id;
    this.ctl.dropdown.open = false;
    this.dispatchEvent(new CustomEvent('field-typeahead-selected', {
      detail: { field: suggestion },
      bubbles: true,
      composed: true
    }));
  }

  async getSuggestions(){
    this.fetchError = false;
    const query = {
      limit: this.suggestionLimit
    }
    if ( this.form) {
      query.form = this.form;
    }
    if ( this.excludeForm ) {
      query['-form'] = this.excludeForm;
    }
    if ( this.value) {
      query.q = this.value;
    }
    const req = await this.FieldModel.query(query, { loaderSettings: {suppressLoader: true}, errorSettings: {suppressError: true} });
    if ( req.state === 'error' ){
      this.suggestions = [];
      this.fetchError = req.error.response.status !== 404;
      return;
    }
    this.suggestions = req.payload.results;
    this.totalSuggestions = req.payload.total_count;
  }

}

customElements.define('ref-stats-field-typeahead', RefStatsFieldTypeahead);