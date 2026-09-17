import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-new-student-assistant-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController } from '#controllers';
import { IdGenerator } from '#client-utils';

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

  async getActiveAppointments(){
    const res = await this.StudentAssistantModel.getActiveAppointments();
    if ( res?.state === 'loaded' ) {
      this.activeAppointments = res.payload.filter(person => person.name && person.userId && person.email);
    }
  }

  async getGroups(){
    const r = await this.GroupModel.getAllGroups();
    if ( r?.state === 'loaded' ) {
      this.groups = r.payload;
    }
  }

}

customElements.define('ref-stats-new-student-assistant-form', RefStatsNewStudentAssistantForm);