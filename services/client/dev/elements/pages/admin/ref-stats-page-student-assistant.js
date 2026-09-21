import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-page-student-assistant.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AdminPageController, QueryStringController } from '#controllers';

/**
 * @description Admin page listing student assistant assignments, either across all forms
 * (standalone route) or scoped to a single form (when reached from that form's admin page).
 * @property {String} pageId - The app-state page id this component responds to
 * @property {String} formNameOrId - The form this page is scoped to, or null for the standalone view
 */
export default class RefStatsPageStudentAssistant extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {


  static get properties() {
    return {
      pageId: {type: String, attribute: 'page-id'},
      formNameOrId: {state: true},
      breadcrumbs: { state: true },
      form: {state: true},
      assignments: {state: true},
      assignmentsMaxPage: {state: true}
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
    this.assignments = [];
    this.assignmentsMaxPage = 1;

    this.ctl = {
      adminPage : new AdminPageController(this),
      qs : new QueryStringController(this)
    }

    this._injectModel('AppStateModel', 'FormModel', 'StudentAssistantModel');
  }

  /**
   * @description Handles app-state updates. Sets `formNameOrId` from the URL path segment
   * (null when the segment is "new") and fetches the corresponding form data.
   * @param {Object} e - App-state event object containing page and location
   */
  _onAppStateUpdate(e) {
    if ( e.page !== this.pageId ) return;
    this.formNameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];

    this.getData();
  }

  /**
   * @description Rebuilds the breadcrumb trail whenever `form` changes, since it determines
   * whether the page is scoped to a specific form or shown standalone.
   * @param {Map} props - Map of changed property names to their previous values
   */
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

  /**
   * @description Fetches the page's assignment list and, when scoped to a form, that form's data.
   */
  async getData() {
    const promises = [this.getAssignments(), this.getForm()];
    await Promise.all(promises);
  }

  /**
   * @description Fetches the paginated list of student assistant assignments, scoped to
   * formNameOrId (if set) and the current query-string page/filter params.
   */
  async getAssignments() {
    const q = {...this.ctl.qs.query};
    if ( this.formNameOrId ) {
      q.form = this.formNameOrId;
    }
    const res = await this.StudentAssistantModel.query(q);
    if ( res.state === 'loaded' ) {
      this.assignmentsMaxPage = res.payload.maxPage || 1;
      this.assignments = [...res.payload.results];
    }
  }

  /**
   * @description Fetches the form this page is scoped to. Clears `form` when formNameOrId is not set.
   */
  async getForm() {
    if ( !this.formNameOrId ) {
      this.form = null;
      return;
    }
    const res = await this.FormModel.get(this.formNameOrId);
    if ( res.state === 'loaded' ) {
      this.form = {...res.payload};
    }
  }

  /**
   * @description Callback for page change events from pagination control
   * @param {*} e 
   */
  _onPageChange(e){
    this.ctl.qs.setParam('page', e.detail.page);
    this.ctl.qs.setLocation();
  }

}

customElements.define('ref-stats-page-student-assistant', RefStatsPageStudentAssistant);