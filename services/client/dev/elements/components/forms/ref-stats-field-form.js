import { LitElement, html } from 'lit';
import {render, styles} from "./ref-stats-field-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController, QueryStringController } from '#controllers';
import { IdGenerator } from '#client-utils';
import definitions from '#lib/definitions.js';

import '#components/forms/ref-stats-picklist-form.js';

/**
 * @description Form element for creating and editing a reference statistics field.
 * Handles field creation, updates, and deletion, and supports opening a picklist
 * modal for field types that require a picklist.
 * @property {String} nameOrId - The name or ID of the field being edited, or null for a new field.
 * @property {Object} payload - The current field data payload bound to the form inputs.
 */
export default class RefStatsFieldForm extends Mixin(LitElement)
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
      qs: new QueryStringController(this),
      idGen : new IdGenerator()
    }

    this._injectModel('AppStateModel', 'FieldModel');
  }

  /**
   * @description Responds to app state changes. Sets the nameOrId from the URL path
   * and fetches data when the component's page is active.
   * @param {Object} e - App state update event containing location information.
   */
  _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    this.nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    this.getData();
  }

  /**
   * @description Fetches the field data from the FieldModel using the current nameOrId.
   * Resets the payload before fetching. Does nothing if nameOrId is not set.
   */
  async getData(){
    this.payload = {};
    if ( !this.nameOrId ) return;

    const res = await this.FieldModel.get(this.nameOrId);
    if ( res?.state === 'loaded' ) {
      this.payload = {...res.payload};
    }
  }

  /**
   * @description Handles form submission. Creates or patches a field depending on
   * whether nameOrId is set. Fires a `ref-stats-field-updated` custom event on success.
   * @param {Event} e - The form submit event.
   * @returns {Object|undefined} The model response if there is a 422 validation error, otherwise undefined.
   */
  async _onSubmit(e) {
    e.preventDefault();

    let r;

    if ( this.nameOrId ) {
      r = await this.FieldModel.patch(this.payload);
    } else {
      r = await this.FieldModel.create(this.payload);
    }
    if ( r?.payload?.error?.response?.status == 422 ) return r;

    if ( r.state === 'loaded' ){
      const toastText = this.nameOrId ? 'Field updated successfully' : 'Field created successfully';
      this.AppStateModel.showToast({text: toastText, type: 'success'});
      this.dispatchEvent(new CustomEvent('ref-stats-field-updated', {
        detail: { field: r.payload, newField: !this.nameOrId },
        bubbles: true,
        composed: true
      }));
    }
  }

  /**
   * @description Updates a single property on the payload and requests a re-render.
   * Also removes the picklist_id if the new field type does not use a picklist.
   * @param {String} prop - The payload property name to update.
   * @param {*} value - The new value for the property.
   */
  _onPayloadInput(prop, value){
    this.payload[prop] = value;

    if ( prop === 'field_type' && !definitions.fieldTypeUsesPickList(value) ) {
      delete this.payload.picklist_id;
    }
    this.requestUpdate();
  }

  /**
   * @description Opens a dialog modal containing a picklist form for the currently
   * associated picklist, allowing inline picklist creation or editing.
   */
  _onPicklistModalRequest(){
    this.AppStateModel.showDialogModal({
      content: () => html`
        <ref-stats-picklist-form
          picklistIdOrName=${this.payload.picklist_id}
          @ref-stats-picklist-updated=${this._onPicklistUpdated.bind(this)}
        >
        </ref-stats-picklist-form>
      `,
    })
  }

  /**
   * @description Handles the `ref-stats-picklist-updated` event from the picklist modal.
   * Sets the payload's picklist_id when a new picklist has been created.
   * @param {CustomEvent} e - Event with detail containing the updated picklist data.
   */
  _onPicklistUpdated(e){
    if ( e.detail.newPicklist ) {
      this._onPayloadInput('picklist_id', e.detail.picklist.picklist_id);
    }
  }

  /**
   * @description Opens a confirmation dialog prompting the user to confirm field deletion.
   */
  _onDeleteRequest(){
    this.AppStateModel.showDialogModal({
      title: 'Delete Field',
      content: () => `Are you sure you want to delete this field? All data associated with this field will be lost. This action cannot be undone. To retain data, archive the field instead.`,
      actions: [
        {text: 'Close', value: 'dismiss', invert: true, color: 'secondary'},
        { text: 'Delete', color: 'double-decker', value: 'field-delete' }
      ]
    })
  }

  /**
   * @description Handles dialog action events. Deletes the field when the user confirms
   * the 'field-delete' action, then fires a `ref-stats-field-updated` custom event.
   * @param {Object} e - Dialog action event with an `action` property containing the action value.
   */
  async _onAppDialogAction(e){
    if ( e.action.value !== 'field-delete' ) return;
    const r = await this.FieldModel.delete(this.nameOrId);
    if ( r?.state === 'loaded' ){
      this.AppStateModel.showToast({text: 'Field deleted successfully', type: 'success'});
      this.dispatchEvent(new CustomEvent('ref-stats-field-updated', {
        detail: { field: r.payload, deleted: true },
        bubbles: true,
        composed: true
      }));
    }

  }

}

customElements.define('ref-stats-field-form', RefStatsFieldForm);