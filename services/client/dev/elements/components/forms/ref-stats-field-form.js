import { LitElement, html } from 'lit';
import {render, styles} from "./ref-stats-field-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController, QueryStringController } from '#controllers';
import { IdGenerator } from '#client-utils';

import '#components/forms/ref-stats-picklist-form.js';

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

  _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    this.nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    this.getData();
  }

  async getData(){
    this.payload = {};
    if ( !this.nameOrId ) return;

    const res = await this.FieldModel.get(this.nameOrId);
    if ( res?.state === 'loaded' ) {
      this.payload = {...res.payload};
    }
  }

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

  _onPayloadInput(prop, value){
    this.payload[prop] = value;

    if ( prop === 'field_type' && value !== 'picklist' ) {
      delete this.payload.picklist_id;
    }
    this.requestUpdate();
  }

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

  _onPicklistUpdated(e){
    if ( e.detail.newPicklist ) {
      this._onPayloadInput('picklist_id', e.detail.picklist.picklist_id);
    }
  }

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