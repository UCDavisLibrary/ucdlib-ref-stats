import { Registry } from '@ucd-lib/cork-app-utils';
import AppComponentController from './AppComponentController.js';
import { forms, fields } from '#templates';
import { IdGenerator } from '#client-utils';
import { html } from 'lit';

export default class FormEntryController {
  constructor(host, opts={}){

    this.host = host;
    host.addController(this);

    this.models = {
      AppStateModel: Registry.getModel('AppStateModel'),
      FormEntryModel: Registry.getModel('FormEntryModel'),
      FormModel: Registry.getModel('FormModel'),
      FieldModel: Registry.getModel('FieldModel'),
      PicklistModel: Registry.getModel('PicklistModel')
    }

    this.appComponentController = new AppComponentController(host);
    this.idGen = new IdGenerator();

    this.form = {};
    this.formNameOrId = null;
    this.fields = [];
    this.picklistItems = {};
  }

  get hostIsForm(){
    return this.host.tagName === 'REF-STATS-FORM-ENTRY';
  }

  get hostIsField(){
    return this.host.tagName === 'REF-STATS-FORM-ENTRY-FIELD';
  }

  get payload(){
    const d = this.models.FormEntryModel.store.data.payload.get(this.form?.form_id) || {};
    return d.payload || {};
  }

  get fieldPicklistItems(){
    const field = this.fields.find( f => this.host.field === f.name );
    const picklistItems = [...(this.picklistItems?.[field?.picklist_id] || [])];
    if ( !picklistItems.length ) return picklistItems;

    if ( field?.picklist?.sort_alpha ) {
      picklistItems.sort((a,b) => {
        return a.label.localeCompare(b.label, undefined, {sensitivity: 'base'});
      });
    }
    return picklistItems;

  }

  getFieldElement(fieldNameOrId){
    const field = this.fields.find( f => f.name === fieldNameOrId || f.field_id === fieldNameOrId );
    if ( !field ) return null;
    const formElement = this.formElement;
    if ( !formElement ) return null;
    let fieldElement = formElement.renderRoot.querySelector(`ref-stats-form-entry-field[field="${field.name}"]`);
    if ( fieldElement ) return fieldElement;
    fieldElement = formElement.renderRoot.querySelector(`ref-stats-form-entry-field[field="${field.field_id}"]`);
    return fieldElement;
  }

  get formElement(){
    if ( this.hostIsForm ) {
      return this.host;
    }
    if ( this.hostIsField ) {
      return this.host.closest('ref-stats-form-entry');
    }
    return null;
  }

  /**
   * @description Handle picklist item added event emitted from ref-stats-picklist-item-quick-add
   * Finds the corresponding picklist field and updates the form payload with the new picklist item
   * @param {*} e 
   * @returns 
   */
  async _onPicklistItemAdded(e) {
    const picklistId = e.detail.picklist.picklist_id;
    const itemValue = e.detail.item.value;
    const field = this.fields.find( f => f.picklist_id === picklistId );
    if ( !field ) return;
    const fieldElement = this.getFieldElement(field.name);
    if ( !fieldElement ) return;
    await fieldElement.ctl.formEntry.getPicklistItems();
    if ( fieldElement.multiple ){
      this.togglePayloadArrayItem(field.name, itemValue);
    } else {
      this.setPayloadField(field.name, itemValue);
    }
  }

  setPayload(payload){
    this.models.FormEntryModel.store.set(
      {state: 'loaded', id: this.form?.form_id, payload},
      this.models.FormEntryModel.store.data.payload
    )
  }

  setPayloadField(fieldName, value){
    const payload = {...this.payload};
    payload[fieldName] = value;
    this.setPayload(payload);
  }

  togglePayloadArrayItem(fieldName, value){
    const payload = {...this.payload};
    if ( !Array.isArray(payload[fieldName]) ) {
      payload[fieldName] = [];
    }
    if ( payload[fieldName].includes(value) ) {
      payload[fieldName] = payload[fieldName].filter( v => v !== value );
    } else {
      payload[fieldName].push(value);
    }
    this.setPayload(payload);
  }

  _onPayloadUpdate(e){
    if ( e.id !== this.form?.form_id ) return;
    this.host.requestUpdate();
  }


  async update(e){
    if ( !e ) e = await this.models.AppStateModel.get();

    if ( !this.appComponentController.isOnActivePage ) return;
    this.formNameOrId = e.location.path?.[1];
    if ( !this.formNameOrId ) return;
    await Promise.all([
      this.getForm(),
      this.getFields()
    ]);
    await this.getPicklistItems();

    this.host.requestUpdate();
  }

  async getPicklistItems(){
    this.picklistItems = {};
    const picklists = this.fields.filter(f => f.picklist_id && f.field_type !== 'typeahead').map(f => f.picklist_id);
    if ( picklists.length ) {
      const r = await this.models.PicklistModel.getFormItems(this.form.form_id, picklists);
      if ( r.state === 'loaded' ){
        this.picklistItems = r.payload;
      }
    }
  }

  async getForm(){
    if ( this.formNameOrId ){
      const r = await this.models.FormModel.get(this.formNameOrId);
      if ( r.state === 'loaded' ) {
        this.form = r.payload;
      } else {
        this.form = {};
      }
    }
    return this.form;
  }

  async getFields(){
    if ( this.formNameOrId ) {
      const r = await this.models.FieldModel.query({ form: this.formNameOrId, per_page: 500, active_only: true });
      if ( r.state === 'loaded' ) {
        this.fields = r.payload.results;
      } else {
        this.fields = [];
      }
    }
    return this.fields;
  }

  render(){
    if ( this.hostIsForm ) {
      if ( this.form?.is_archived ){
        return html`<div class='alert'>This form has been archived and is no longer available for data entry.</div>`;
      }
      const template = forms.find(f => f.name === this.form?.name);
      if ( !template ) {
        return html`<p>Form Not Found!</p>`;
      }

      return template.render.call(this.host, this);
    }

    if ( this.hostIsField ) {
      const f = this.fields.find( f => f.name === this.host.field );
      if ( !f || f.is_archived ) return html``;
      const template = fields[f.field_type];
      if ( !template ) return html``;
      return template.call(this.host, this);
    }

    return html``;
  }

  _onAppStateUpdate(e) {
    this.update(e);
  }


  hostConnected() {
    this.models.AppStateModel.EventBus.on('app-state-update', this._onAppStateUpdate.bind(this));
    this.models.FormEntryModel.EventBus.on('formentry-payload-update', this._onPayloadUpdate.bind(this));
  }

  hostDisconnected() {
    this.models.AppStateModel.EventBus.off('app-state-update', this._onAppStateUpdate.bind(this));
    this.models.FormEntryModel.EventBus.off('formentry-payload-update', this._onPayloadUpdate.bind(this));
  }
}