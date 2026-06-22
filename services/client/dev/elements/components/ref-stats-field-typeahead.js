import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-field-typeahead.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { DropdownController } from '#controllers';

/**
 * @description Typeahead input element for searching and selecting a reference statistics
 * field. Queries FieldModel as the user types and displays matching suggestions in a
 * dropdown. Supports filtering by form or excluding a specific form. Dispatches a
 * `field-typeahead-selected` event when a suggestion is chosen.
 * @property {String} value - Current text value of the input
 * @property {String} inputId - Id attribute applied to the underlying input element
 * @property {String} form - Form name or id used to filter field suggestions to a specific form
 * @property {String} excludeForm - Form name or id whose fields should be excluded from suggestions
 * @property {Array} suggestions - Array of field suggestion objects returned by the last query
 * @property {String} nameOrId - Field name or id used to pre-populate the input value
 * @property {Number} suggestionLimit - Maximum number of suggestions to fetch
 * @property {Object} selectedSuggestion - The currently selected field suggestion object
 * @property {Boolean} relativeDropdown - When true, positions the dropdown relatively instead of absolutely
 */
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

  /**
   * @description Lit lifecycle callback. Resolves the display value when nameOrId changes
   * and updates the dropdown positioning style when relativeDropdown changes.
   * @param {Map} props - Map of changed property names to their previous values
   */
  willUpdate(props){
    if ( props.has('nameOrId') ) {
      this.getByNameOrId();
    }
    if ( props.has('relativeDropdown') ) {
      this.ctl.dropdown.openCustomStyles.position = this.relativeDropdown ? 'relative' : 'absolute';
    }
  }

  /**
   * @description Looks up a field by the current nameOrId value and sets the input text
   * to the matching field's label. If nameOrId is empty or the lookup fails, clears the
   * input value.
   */
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

  /**
   * @description Handles input events on the text field. Clears the selected suggestion,
   * updates the value, and debounces a suggestion fetch followed by opening the dropdown.
   * @param {Event} e - The native input event from the text field
   */
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

  /**
   * @description Handles a click on a suggestion item. Sets the selected suggestion,
   * closes the dropdown, and dispatches a `field-typeahead-selected` custom event.
   * @param {Object} suggestion - The field suggestion object that was clicked
   */
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

  /**
   * @description Fetches field suggestions from FieldModel based on the current input value,
   * form filter, excludeForm filter, and suggestion limit. Updates the suggestions list and
   * totalSuggestions count, or sets fetchError if the request fails with a non-404 error.
   */
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