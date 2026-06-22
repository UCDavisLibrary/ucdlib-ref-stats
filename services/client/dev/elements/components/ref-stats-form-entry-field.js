import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-form-entry-field.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { FormEntryController } from '#controllers';

/**
 * @description Renders a single form field within the form entry view. Resolves display
 * settings from the field definition, form-level assignment overrides, and explicit
 * element attributes, with explicit attributes taking highest priority.
 * @property {String} field - Name of the field to render
 * @property {Boolean} multiple - Whether the field allows multiple values
 * @property {Number} max - Maximum numeric value for the field input
 * @property {Number} min - Minimum numeric value for the field input
 * @property {Number} step - Step increment for numeric field inputs
 * @property {String} placeholder - Placeholder text for the field input
 * @property {Number} rows - Number of rows for textarea field inputs
 * @property {Boolean} noFieldContainer - When true, omits the outer field container wrapper
 * @property {Boolean} required - Whether the field is required
 * @property {String} description - Descriptive help text displayed alongside the field
 * @property {String} label - Display label for the field
 * @property {Boolean} allowQuickAdd - Whether to show the quick-add control for this field
 */
export default class RefStatsFormEntryField extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      field: { type: String },
      multiple: { type: Boolean },
      _multiple: { state: true },
      max: { type: Number },
      _max: { state: true },
      min: { type: Number },
      _min: { state: true },
      step: { type: Number },
      _step: { state: true },
      placeholder: { type: String },
      _placeholder: { state: true },
      rows: { type: Number },
      _rows: { state: true },
      noFieldContainer: { type: Boolean, attribute: 'no-field-container' },
      _noFieldContainer: { state: true },
      required: { type: Boolean },
      _required: { state: true },
      description: { type: String },
      _description: { state: true },
      label: { type: String },
      _label: { state: true },
      allowQuickAdd: { type: Boolean },
      _allowQuickAdd: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.ctl = {
      formEntry : new FormEntryController(this)
    }

    this.field = null;

  }

  /**
   * @description Returns the list of property names that can be overridden via element
   * attributes or form assignment settings.
   * @returns {Array} Array of property name strings
   */
  get assignmentProps() {
    return ['multiple', 'max', 'min', 'step', 'placeholder', 'rows', 'noFieldContainer', 'required', 'description', 'label', 'allowQuickAdd'];
  }

  /**
   * @description Lit lifecycle callback. Triggers a controller update when the field
   * name or any assignment property changes, then synchronises internal display props.
   * @param {Map} props - Map of changed property names to their previous values
   */
  willUpdate(props){
    const watchedProps = ['field', ...this.assignmentProps];
    if ( watchedProps.some( p => props.has(p) ) ) {
      this.ctl.formEntry.update();
    }
    this.setInternalProps();
  }

  /**
   * @description Resolves the effective display settings for the current field by merging
   * the field definition, form assignment settings, and explicit element attributes.
   * Explicit attributes take highest priority, followed by assignment settings, then
   * the base field definition. Results are written to the corresponding internal state
   * properties (e.g. _label, _required).
   */
  setInternalProps() {
    const field = this.ctl.formEntry.fields.find( f => this.field === f.name );
    if ( !field || !this.ctl.formEntry.form?.form_id ) return;
    const form = field.forms?.find( form => form.form_id === this.ctl.formEntry.form.form_id );

    // Priority: explicit prop > field assignment setting > field setting
    for (const prop of this.assignmentProps) {
      const _prop = `_${prop}`;

      if ( this[prop] !== undefined ) {
        this[_prop] = this[prop];
      } else if ( form?.assignment_settings?.[prop] !== undefined ) {
        this[_prop] = form.assignment_settings[prop];
      } else {
        this[_prop] = field[prop];
      }
    }
  }

}

customElements.define('ref-stats-form-entry-field', RefStatsFormEntryField);