import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-picklist-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import ModalFormController from '../../../controllers/ModalFormController.js';
import IdGenerator from '../../../utils/IdGenerator.js';
import textUtils from '../../../../../lib/textUtils.js';

export default class RefStatsPicklistForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      picklistId: {type: String},
      payload: {type: Object }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.picklistId = null;

    this.ctl = {
      modal : new ModalFormController(this, {submitCallback: '_onSubmitClick'}),
      idGen : new IdGenerator()
    }

    this._injectModel('PicklistModel', 'AppStateModel');
  }

  _onAppStateUpdate() {
    this.payload = {};
  }

  willUpdate(props){
    if ( props.has('picklistId') ) {
      this.ctl.modal.setModalTitle(this.picklistId ? 'Edit Picklist' : 'New Picklist');
      this.ctl.modal.setModalSubmitButton(this.picklistId ? 'Save Changes' : 'Create Picklist');

      this.payload = {};
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

  async _onSubmitClick(){
    console.log('submit picklist form', this.picklistId, this.payload);
    const r = await this.PicklistModel.create(this.payload);
    if ( r?.payload?.error?.response?.status == 422 ) return r;

    if ( r.state === 'loaded' ){
      this.AppStateModel.showToast({text: 'Picklist created successfully', type: 'success'});
      this.dispatchEvent(new CustomEvent('ref-stats-picklist-updated', {
        detail: { picklist: r.payload, newPicklist: !this.picklistId },
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