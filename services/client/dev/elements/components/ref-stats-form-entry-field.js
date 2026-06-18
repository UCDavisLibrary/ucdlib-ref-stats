import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-form-entry-field.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { FormEntryController } from '#controllers';

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

  get assignmentProps() {
    return ['multiple', 'max', 'min', 'step', 'placeholder', 'rows', 'noFieldContainer', 'required', 'description', 'label', 'allowQuickAdd'];
  }

  willUpdate(props){
    const watchedProps = ['field', ...this.assignmentProps];
    if ( watchedProps.some( p => props.has(p) ) ) {
      this.ctl.formEntry.update();
    }
    this.setInternalProps();
  }

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