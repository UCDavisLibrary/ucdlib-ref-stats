import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-form-admin.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AdminPageController } from '#controllers';

/**
 * @description Admin page element that lists all reference-stats forms.
 * @property {String} pageId - The page identifier used to match app-state route events
 */
export default class RefStatsPageFormAdmin extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.ctl = {
      adminPage : new AdminPageController(this)
    }
  }

}

customElements.define('ref-stats-page-form-admin', RefStatsPageFormAdmin);