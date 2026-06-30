import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-home.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

/**
 * @description Home page element. Serves as the landing page of the ref-stats application.
 * @property {String} pageId - The page identifier used to match app-state route events
 */
export default class RefStatsPageHome extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      submissionFields: {type: Array}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.submissionFields = [
      {field: '_form', desktopFr: 2, mobileFr: 2},
      {field: '_created_at', desktopFr: 1, mobileFr: 1}
    ];
  }

}

customElements.define('ref-stats-page-home', RefStatsPageHome);