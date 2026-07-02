import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-reports.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

export default class RefStatsPageReports extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      displayedFields: {type: Array}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.displayedFields = [
      {field: '_form', desktopFr: 2, mobileFr: 2},
      {field: '_created_at', desktopFr: 1, mobileFr: 1}
    ];
    
    this._injectModel('AuthModel');

    if ( this.AuthModel.token.hasManagerAccess || this.AuthModel.userIsAGroupHead ) {
      this.displayedFields.splice(0, 0, {field: '_submitter', desktopFr: 1, mobileFr: 1});
    }
  }

}

customElements.define('ref-stats-page-reports', RefStatsPageReports);