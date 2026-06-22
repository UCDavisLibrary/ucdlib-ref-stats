import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-picklist-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { ModalFormController, AppComponentController } from '#controllers';
import { IdGenerator } from '#client-utils';
import textUtils from '#lib/textUtils.js';

/**
 * @description Form element for creating and editing a picklist and its items.
 * Can operate as a standalone page form or inside a dialog modal.
 * @property {String} picklistIdOrName - The ID or name of the picklist being edited, or null for a new picklist.
 * @property {Object} payload - The current picklist data payload bound to the form inputs.
 */
export default class RefStatsPicklistForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      picklistIdOrName: {type: String},
      payload: {type: Object }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.picklistIdOrName = null;

    this.ctl = {
      modal : new ModalFormController(this, {submitCallback: '_onSubmitClick'}),
      appComponent : new AppComponentController(this),
      idGen : new IdGenerator()
    }

    this._injectModel('PicklistModel', 'AppStateModel');
  }

  /**
   * @description Responds to app state changes. Re-fetches data when the component's
   * page is active and the resolved nameOrId matches the current picklistIdOrName,
   * ensuring the form resets even when the property value has not changed.
   * @param {Object} e - App state update event containing location information.
   */
  _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;

    // reset form to initial state if returning to same picklist
    // (willUpdate does not get called if property value does not change)
    const nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    if ( nameOrId === this.picklistIdOrName )  {
      this.getData();
    }
  }

  /**
   * @description Responds to dialog open events. Fetches fresh data when the component
   * is rendered inside a dialog modal.
   */
  _onAppDialogOpen() {
    if ( this.ctl.modal.modal ) {
      this.getData();
    }
  }

  /**
   * @description Reacts to property changes. Updates the modal title and submit button text
   * and fetches fresh data when picklistIdOrName changes.
   * @param {Map} props - Map of changed property names to their previous values.
   */
  willUpdate(props){
    if ( props.has('picklistIdOrName') ) {
      this.ctl.modal.setModalTitle(this.picklistIdOrName ? 'Edit Picklist' : 'New Picklist');
      this.ctl.modal.setModalSubmitButton(this.picklistIdOrName ? 'Save Changes' : 'Create Picklist');

      this.getData();
    }
  }

  /**
   * @description Fetches the picklist data (including items) from the PicklistModel.
   * Resets the payload before fetching. Does nothing if picklistIdOrName is not set.
   */
  async getData(){
    this.payload = {};
    if ( !this.picklistIdOrName ) return;

    const res = await this.PicklistModel.get(this.picklistIdOrName, {include_items: true});
    if ( res?.state === 'loaded' ) {
      this.payload = {...res.payload};
    }
  }

  /**
   * @description Handles the form's native submit event. Delegates to the modal controller
   * submit flow when inside a modal, or calls _onSubmitClick directly otherwise.
   * @param {Event} e - The form submit event.
   */
  _onSubmit(e){
    e.preventDefault();
    if ( this.ctl.modal.modal ){
      this.ctl.modal.submit();
    } else {
      this._onSubmitClick();
    }
  }

  /**
   * @description Opens a confirmation dialog prompting the user to confirm picklist deletion.
   */
  _onDeleteRequest(){
    this.AppStateModel.showDialogModal({
      title: 'Delete Picklist',
      content: () => `Are you sure you want to delete this picklist? All data associated with this picklist will be lost. This action cannot be undone. To retain data, archive the picklist instead.`,
      actions: [
        {text: 'Close', value: 'dismiss', invert: true, color: 'secondary'},
        { text: 'Delete', color: 'double-decker', value: 'picklist-delete' }
      ]
    })
  }

  /**
   * @description Handles dialog action events. Deletes the picklist when the user confirms
   * the 'picklist-delete' action, then fires a `ref-stats-picklist-updated` custom event.
   * @param {Object} e - Dialog action event with an `action` property containing the action value.
   */
  async _onAppDialogAction(e){
    if ( e.action.value !== 'picklist-delete' ) return;
    const res = await this.PicklistModel.delete(this.picklistIdOrName);
    if ( res?.state === 'loaded' ) {
      this.AppStateModel.showToast({text: 'Picklist deleted successfully', type: 'success'});
      this.dispatchEvent(new CustomEvent('ref-stats-picklist-updated', {
        detail: { picklist: res.payload, deleted: true },
        bubbles: true,
        composed: true
      }));
    }
  }

  /**
   * @description Gathers form data including picklist items from the child
   * `ref-stats-picklist-items-form` element, then creates or patches the picklist.
   * Fires a `ref-stats-picklist-updated` custom event on success.
   * @returns {Object} The model response object.
   */
  async _onSubmitClick(){
    let r;
    let payload = {...this.payload};

    // gather picklist items from child component
    let picklistItems = this.renderRoot.querySelector('ref-stats-picklist-items-form')?._items || [];
    picklistItems = picklistItems
      .filter( item => item.edited )
      .map( item => {
        if ( !item.item?.picklist_item_id && item.item.label && !item.valueHasBeenEdited ){
          item.item.value = textUtils.toUrlFriendly(item.item.label);
        }
        return item;
      })
      .filter( item => (item.item.label || item.item.value) || item.item.picklist_item_id )
      .map( item => item.item );
    payload.items = picklistItems;

    if ( this.picklistIdOrName ) {
      r = await this.PicklistModel.patch(this.picklistIdOrName, payload);
    } else {
      r = await this.PicklistModel.create(payload);
    }
    if ( r?.payload?.error?.response?.status == 422 ) return r;

    if ( r.state === 'loaded' ){
      const toastText = this.picklistIdOrName ? 'Picklist updated successfully' : 'Picklist created successfully';
      this.AppStateModel.showToast({text: toastText, type: 'success'});
      this.dispatchEvent(new CustomEvent('ref-stats-picklist-updated', {
        detail: { picklist: r.payload, newPicklist: !this.picklistIdOrName },
        bubbles: true,
        composed: true
      }));
    }

    return r;
  }

  /**
   * @description Updates a single property on the payload and requests a re-render.
   * Auto-generates the name from the label (with a debounce) when the label changes
   * and a name has not yet been set.
   * @param {String} prop - The payload property name to update.
   * @param {*} value - The new value for the property.
   */
  _onPayloadInput(prop, value){
    this.payload[prop] = value;
    if ( prop === 'label' && !this.payload.name ){
      if ( this.labelTimeout ) clearTimeout(this.labelTimeout);
      this.labelTimeout = setTimeout(() => {
        if ( this.payload.name ) return;
        this.payload.name = textUtils.toUrlFriendly(this.payload.label);
        this.requestUpdate();
      }, 500);

    }
    this.requestUpdate();
  }

}

customElements.define('ref-stats-picklist-form', RefStatsPicklistForm);