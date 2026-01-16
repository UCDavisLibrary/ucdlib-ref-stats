import { Registry } from '@ucd-lib/cork-app-utils';
import AppComponentController from './AppComponentController.js';
import { forms, fields } from '#templates';
import { html } from 'lit';

export default class FormEntryController {
  constructor(host, opts={}){

    this.host = host;
    host.addController(this);

    this.models = {
      AppStateModel: Registry.getModel('AppStateModel'),
      FormModel: Registry.getModel('FormModel'),
      FieldModel: Registry.getModel('FieldModel'),
      PicklistModel: Registry.getModel('PicklistModel')
    }

    this.appComponentController = new AppComponentController(host);

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


  async update(e){
    if ( !e ) e = await this.models.AppStateModel.get();

    if ( !this.appComponentController.isOnActivePage ) return;
    this.formNameOrId = e.location.path?.[1];

    // Attached to a form entry element
    if ( this.hostIsForm && this.formNameOrId ) {
      await this.getForm();
      this.host.requestUpdate();
      return;
    }

    // Attached to a form entry field element
    if ( this.hostIsField && this.formNameOrId ) {
      await Promise.all([
        this.getForm(),
        this.getFields()
      ]);
      console.log('fields for form entry field', this.fields);

      this.picklistItems = {};
      const picklists = this.fields.filter(f => f.picklist_id && f.field_type !== 'typeahead').map(f => f.picklist_id);
      if ( picklists.length ) {
        const r = await this.models.PicklistModel.getFormItems(this.form.form_id, picklists);
        if ( r.state === 'loaded' ){
          this.picklistItems = r.payload;
        }
      }
      console.log('picklist items for form entry field', this.picklistItems);
    }

    this.host.requestUpdate();
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
  }

  hostDisconnected() {
    this.models.AppStateModel.EventBus.off('app-state-update', this._onAppStateUpdate.bind(this));
  }
}