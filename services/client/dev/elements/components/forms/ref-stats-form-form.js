import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-form-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController } from '#controllers';
import { IdGenerator } from '#client-utils';


/**
 * @description Form element for creating and editing a reference statistics form definition.
 * Handles form creation, updates, and deletion.
 * @property {String} nameOrId - The name or ID of the form being edited, or null for a new form.
 * @property {Object} payload - The current form data payload bound to the form inputs.
 */
export default class RefStatsFormForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      nameOrId: {type: String },
      payload: {type: Object }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.nameOrId = null;
    this.payload = {};
    
    this.ctl = {
      appComponent : new AppComponentController(this),
      idGen : new IdGenerator()
    }

    this._injectModel('AppStateModel', 'FormModel', 'AuthModel');
  }

  /**
   * @description Responds to app state changes. Sets nameOrId from the URL path
   * and fetches data when the component's page is active.
   * @param {Object} e - App state update event containing location information.
   */
  _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    this.nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    this.getData();
  }

  /**
   * @description Fetches the form definition data from the FormModel using the current nameOrId.
   * Resets the payload before fetching. Does nothing if nameOrId is not set.
   */
  async getData(){
    this.payload = {};
    if ( !this.nameOrId ) return;

    const res = await this.FormModel.get(this.nameOrId);
    if ( res?.state === 'loaded' ) {
      this.payload = {...res.payload};
    }
  }

  /**
   * @description Handles form submission. Creates or patches the form definition depending
   * on whether nameOrId is set. Fires a `ref-stats-form-updated` custom event on success.
   * @param {Event} e - The form submit event.
   * @returns {Object|undefined} The model response if there is a 422 validation error, otherwise undefined.
   */
  async _onSubmit(e) {
    e.preventDefault();

    let r;
    if ( !this.payload.edit_interval_amount ) {
      this.payload.edit_interval_amount = 0;
    }

    if ( this.nameOrId ) {
      r = await this.FormModel.patch(this.payload);
    } else {
      r = await this.FormModel.create(this.payload);
    }
    if ( r?.payload?.error?.response?.status == 422 ) return r;

    if ( r.state === 'loaded' ){
      const toastText = this.nameOrId ? 'Form updated successfully' : 'Form created successfully';
      this.AppStateModel.showToast({text: toastText, type: 'success'});
      this.dispatchEvent(new CustomEvent('ref-stats-form-updated', {
        detail: { form: r.payload, newForm: !this.nameOrId },
        bubbles: true,
        composed: true
      }));
    }
  }

  /**
   * @description Updates a single key within form_display_settings and requests a re-render.
   * Creates form_display_settings as an empty object if it does not yet exist.
   * @param {String} key - The form_display_settings key to update.
   * @param {*} value - The new value for the key.
   */
  _onDisplaySettingsInput(key, value) {
    if ( !this.payload.form_display_settings ) this.payload.form_display_settings = {};
    this.payload.form_display_settings[key] = value;
    this.requestUpdate();
  }

  /**
   * @description Updates a single property on the payload and requests a re-render.
   * @param {String} prop - The payload property name to update.
   * @param {*} value - The new value for the property.
   */
  _onPayloadInput(prop, value){
    if ( prop === 'edit_interval_amount' && value !== '' ) {
      value = Number(value);
    }
    this.payload[prop] = value;
    this.requestUpdate();
  }

  /**
   * @description Opens a confirmation dialog prompting the user to confirm form deletion.
   */
  _onDeleteRequest(){
    this.AppStateModel.showDialogModal({
      title: 'Delete Form',
      content: () => `Are you sure you want to delete this form? All data associated with this form will be lost. This action cannot be undone. To retain data, archive the form instead.`,
      actions: [
        {text: 'Close', value: 'dismiss', invert: true, color: 'secondary'},
        { text: 'Delete', color: 'double-decker', value: 'form-delete' }
      ]
    })
  }

  /**
   * @description Handles dialog action events. Deletes the form definition when the user
   * confirms the 'form-delete' action, then fires a `ref-stats-form-updated` custom event.
   * @param {Object} e - Dialog action event with an `action` property containing the action value.
   */
  async _onAppDialogAction(e){
    if ( e.action.value !== 'form-delete' ) return;
    const r = await this.FormModel.delete(this.nameOrId);
    if ( r?.state === 'loaded' ){
      this.AppStateModel.showToast({text: 'Form deleted successfully', type: 'success'});
      this.dispatchEvent(new CustomEvent('ref-stats-form-updated', {
        detail: { form: r.payload, deleted: true },
        bubbles: true,
        composed: true
      }));
    }

  }

}

customElements.define('ref-stats-form-form', RefStatsFormForm);