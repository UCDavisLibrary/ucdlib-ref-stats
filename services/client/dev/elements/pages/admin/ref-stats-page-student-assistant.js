import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-student-assistant.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AdminPageController } from '#controllers';

export default class RefStatsPageStudentAssistant extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {


  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      formNameOrId: {state: true},
      breadcrumbs: { state: true },
      form: {state: true}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.breadcrumbs = [];
    this.formNameOrId = null;
    this.form = null;

    this.ctl = {
      adminPage : new AdminPageController(this)
    }

    this._injectModel('AppStateModel', 'FormModel');
  }

  /**
   * @description Handles app-state updates. Sets `formNameOrId` from the URL path segment
   * (null when the segment is "new") and fetches the corresponding form data.
   * @param {Object} e - App-state event object containing page and location
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.formNameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    this.form = null;

    if ( this.formNameOrId ) {
      const res = await this.FormModel.get(this.formNameOrId);
      if ( res?.state === 'loaded' ) {
        this.form = {...res.payload};
      }
    }
  }

  willUpdate(props){

    // set breadcrumbs based on if we are on a specific form or not
    if ( props.has('form') ) {
      if ( this.form ) {
        this.breadcrumbs = [
          {text: 'Home', href: '/'},
          {text: 'Form Administration', href: '/form-admin'},
          {text: this.form.label, href: `/form-admin/${this.formNameOrId}`},
          {text: 'Student Assistant Access'}
        ];
      } else {
        this.breadcrumbs = [
          {text: 'Home', href: '/'},
          {text: 'Student Assistant Access'}
        ];
      }
    } 
  }

}

customElements.define('ref-stats-page-student-assistant', RefStatsPageStudentAssistant);