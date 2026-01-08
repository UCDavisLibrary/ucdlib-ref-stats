import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-picklist-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { ModalFormController, AppComponentController } from '#controllers';
import { IdGenerator } from '#client-utils';
import textUtils from '#lib/textUtils.js';

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

  _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;

    // reset form to initial state if returning to same picklist
    // (willUpdate does not get called if property value does not change)
    const nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    if ( nameOrId === this.picklistIdOrName )  {
      this.getData();
    }
  }

  _onAppDialogOpen() {
    if ( this.ctl.modal.modal ) {
      this.getData();
    }
  }

  willUpdate(props){
    if ( props.has('picklistIdOrName') ) {
      this.ctl.modal.setModalTitle(this.picklistIdOrName ? 'Edit Picklist' : 'New Picklist');
      this.ctl.modal.setModalSubmitButton(this.picklistIdOrName ? 'Save Changes' : 'Create Picklist');

      this.getData();
    }
  }

  async getData(){
    this.payload = {};
    if ( !this.picklistIdOrName ) return;

    const res = await this.PicklistModel.get(this.picklistIdOrName, {include_items: true});
    if ( res?.state === 'loaded' ) {
      this.payload = {...res.payload};
    }
  }

  _onSubmit(e){
    e.preventDefault();
    if ( this.ctl.modal.modal ){
      this.ctl.modal.submit();
    } else {
      this._onSubmitClick();
    }
  }

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

  async _onSubmitClick(){
    let r;
    let payload = {...this.payload};

    // gather picklist items from child component
    let picklistItems = this.renderRoot.querySelector('ref-stats-picklist-items-form')?._items || [];
    picklistItems = picklistItems
      .filter( item => item.edited )
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