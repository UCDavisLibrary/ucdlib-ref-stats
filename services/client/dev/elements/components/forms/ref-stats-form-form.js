import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-form-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController } from '#controllers';
import { IdGenerator } from '#client-utils';


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

    this._injectModel('AppStateModel', 'FormModel');
  }

  _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    this.nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    this.getData();
  }

  async getData(){
    this.payload = {};
    if ( !this.nameOrId ) return;

    const res = await this.FormModel.get(this.nameOrId);
    if ( res?.state === 'loaded' ) {
      this.payload = {...res.payload};
    }
  }

  async _onSubmit(e) {
    e.preventDefault();

    let r;

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

  _onPayloadInput(prop, value){
    this.payload[prop] = value;
    this.requestUpdate();
  }

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