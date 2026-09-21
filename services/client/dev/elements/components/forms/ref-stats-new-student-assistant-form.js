import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-new-student-assistant-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController } from '#controllers';
import { IdGenerator } from '#client-utils';

/**
 * @description Form element for granting student assistants access to one or more forms/a group.
 * When formNameOrId is set, the form is scoped to that single form (used from a form's admin
 * page); otherwise the user picks from all forms (used from the standalone student assistant page).
 * @property {String} formNameOrId - The name or ID of the form to scope access to, or null to allow picking any form
 * @property {Object} payload - The current form data payload bound to the form inputs
 * @property {Array} forms - All available forms for the multi-select form picker (empty when formNameOrId is set)
 * @property {Array} activeAppointments - Currently active student assistant appointments eligible for access
 * @property {Array} groups - All reference desk groups for the group picker
 */
export default class RefStatsNewStudentAssistantForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      formNameOrId: {type: String, attribute: 'form-name-or-id'},
      payload: {type: Object },
      forms: { state: true },
      activeAppointments: { state: true },
      groups: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.formNameOrId = null;
    this.payload = {};
    this.forms = [];
    this.activeAppointments = [];
    this.groups = [];

    this.ctl = {
      appComponent : new AppComponentController(this),
      idGen : new IdGenerator()
    }

    this._injectModel('AppStateModel', 'FormModel', 'StudentAssistantModel', 'GroupModel');
  }

  /**
   * @description Refetches the form list whenever formNameOrId changes.
   * @param {Map} props - Map of changed property names to their previous values
   */
  willUpdate(props){
    if ( props.has('formNameOrId') ) {
      this.getForms();
    }
  }

  /**
   * @description Responds to app state changes and fetches data when the component's page is active.
   * @param {Object} e - App state update event containing location information.
   */
  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    this.payload = {};
    this.getData();
  }

  /**
   * @description Handles form submission. Grants the submitted student assistants access to the
   * chosen form(s)/group via StudentAssistantModel.create.
   * @param {Event} e - The form submit event
   * @returns {Object|undefined} The model response if there is a 422 validation error
   */
  async _onSubmit(e) {
    e.preventDefault();
    if ( this.formNameOrId ) {
      this.payload.form_id = [this.formNameOrId];
    }
    const r = await this.StudentAssistantModel.create(this.payload);
    if ( r?.payload?.error?.response?.status == 422 ) return r;

    if ( r.state === 'loaded' ) {
      this.AppStateModel.showToast({text: 'Access granted successfully', type: 'success'});
      this.AppStateModel.refresh();
    }
  }

  /**
   * @description Fetches all data needed to render the form: available forms, active student
   * assistant appointments, and groups.
   */
  async getData(){
    const promises = [this.getForms(), this.getActiveAppointments(), this.getGroups()];

    await Promise.all(promises);
  }

  /**
   * @description Updates a single property on the payload and requests a re-render.
   * @param {String} prop - The payload property name to update.
   * @param {*} value - The new value for the property.
   */
  _onPayloadInput(prop, value){
    this.payload[prop] = value;
    this.requestUpdate();
  }

  /**
   * @description Fetches all forms for the form picker. Skipped (clearing `forms`) when
   * formNameOrId is already set, since the form is scoped to a single, known form.
   */
  async getForms(){
    if ( this.formNameOrId ) {
      this.forms = [];
      return;
    }
    const r = await this.FormModel.getAllForms();
    if ( r?.state === 'loaded' ) {
      this.forms = r.payload;
    }
  }

  /**
   * @description Fetches the list of currently active student assistant appointments, filtering
   * out any without a name, userId, or email.
   */
  async getActiveAppointments(){
    const res = await this.StudentAssistantModel.getActiveAppointments();
    if ( res?.state === 'loaded' ) {
      this.activeAppointments = res.payload.filter(person => person.name && person.userId && person.email);
    }
  }

  /**
   * @description Fetches all reference desk groups for the group picker.
   */
  async getGroups(){
    const r = await this.GroupModel.getAllGroups();
    if ( r?.state === 'loaded' ) {
      this.groups = r.payload;
    }
  }

}

customElements.define('ref-stats-new-student-assistant-form', RefStatsNewStudentAssistantForm);