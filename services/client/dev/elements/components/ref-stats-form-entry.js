import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-form-entry.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { FormEntryController } from '#controllers';

/**
 * @description Page-level element that renders the form entry view, allowing users
 * to select and submit a reference statistics form.
 */
export default class RefStatsFormEntry extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      
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
  }

}

customElements.define('ref-stats-form-entry', RefStatsFormEntry);