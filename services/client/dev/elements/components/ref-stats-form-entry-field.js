import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-form-entry-field.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { FormEntryController } from '#controllers';

export default class RefStatsFormEntryField extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      field: { type: String }
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

  willUpdate(props){
    const watchedProps = ['field'];
    if ( watchedProps.some( p => props.has(p) ) ) {
      this.ctl.formEntry.update();
    }
  }

}

customElements.define('ref-stats-form-entry-field', RefStatsFormEntryField);