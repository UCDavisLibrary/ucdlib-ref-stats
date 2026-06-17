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
      max: { type: Number },
      min: { type: Number },
      step: { type: Number },
      placeholder: { type: String },
      rows: { type: Number },
      noFieldContainer: { type: Boolean, attribute: 'no-field-container' },
      required: { type: Boolean },
      description: { type: String },
      label: { type: String }
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
    this.multiple = false;

  }

  willUpdate(props){
    const watchedProps = ['field', 'multiple', 'max', 'min', 'step', 'placeholder', 'rows', 'noFieldContainer', 'required', 'description', 'label'];
    if ( watchedProps.some( p => props.has(p) ) ) {
      this.ctl.formEntry.update();
    }
  }

}

customElements.define('ref-stats-form-entry-field', RefStatsFormEntryField);