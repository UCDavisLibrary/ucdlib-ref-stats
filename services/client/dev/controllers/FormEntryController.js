import { Registry } from '@ucd-lib/cork-app-utils';
import AppComponentController from './AppComponentController.js';
import { forms, fields } from '#templates';
import { IdGenerator } from '#client-utils';
import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';

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

  /**
   * @description Whether the host element is the form entry element
   * @returns {Boolean}
   */
  get hostIsForm(){
    return this.host.tagName === 'REF-STATS-FORM-ENTRY';
  }

  /**
   * @description Whether the host element is a form entry field element
   * @returns {Boolean}
   */
  get hostIsField(){
    return this.host.tagName === 'REF-STATS-FORM-ENTRY-FIELD';
  }

  /**
   * @description The current form payload from the store
   * @returns {Object}
   */
  get payload(){
    const d = this.models.FormEntryModel.store.data.payload.get(this.form?.form_id) || {};
    return d.payload || {};
  }

  /**
   * @description Picklist items for the field that matches the host's field attribute, sorted if configured
   * @returns {Array}
   */
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

  /**
   * @description Get the form entry field element for a given field name or id
   * @param {String} fieldNameOrId - The field name or field_id to look up
   * @returns {HTMLElement|null}
   */
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

  /**
   * @description The ref-stats-form-entry element associated with the host, whether the host is the form or a field within it
   * @returns {HTMLElement|null}
   */
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

  /**
   * @description Replace the entire form payload in the store
   * @param {Object} payload - The new payload object
   */
  setPayload(payload){
    this.models.FormEntryModel.store.set(
      {state: 'loaded', id: this.form?.form_id, payload},
      this.models.FormEntryModel.store.data.payload
    )
  }

  /**
   * @description Set a single field value in the form payload
   * @param {String} fieldName - The field name to update
   * @param {*} value - The value to set
   */
  setPayloadField(fieldName, value){
    const payload = {...this.payload};
    payload[fieldName] = value;
    this.setPayload(payload);
  }

  /**
   * @description Toggle a value in an array field of the form payload — adds it if absent, removes it if present
   * @param {String} fieldName - The array field name
   * @param {*} value - The value to toggle
   */
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

  /**
   * @description Handle formentry-payload-update events and trigger a host re-render
   * @param {Object} e - The event object
   */
  _onPayloadUpdate(e){
    if ( e.id !== this.form?.form_id ) return;
    this.host.requestUpdate();
  }


  /**
   * @description Fetch and refresh all form-related data (form definition, fields, picklist items, and entry if editing)
   * @param {Object} e - Application state event data. Reads from current app state if not provided.
   */
  async update(e){
    if ( !e ) e = await this.models.AppStateModel.get();
    this.formNameOrId = e.location.path?.[1];
    if ( !this.formNameOrId ) return;
    this.entryId = e.location.path?.[2] || null;
    const promises = [ this.getForm(), this.getFields()];
    if ( this.entryId ) {
      promises.push( this.getFormEntry() );
    } else {
      this.formEntry = null;
    }
    await Promise.all(promises);
    await this.getPicklistItems();

    this.host.requestUpdate();
  }

  /**
   * @description Fetch the form entry being edited and store it on the controller
   * @returns {Object|undefined} The form entry payload, or undefined if not available
   */
  async getFormEntry(){
    if ( this.entryId && this.formNameOrId ) {
      const r = await this.models.FormEntryModel.get(this.entryId, this.formNameOrId);
      if ( r.state === 'loaded' ) {
        this.formEntry = r.payload;
      }
    }
    return this.formEntry;
  }

  /**
   * @description Fetch picklist items for all non-typeahead picklist fields and store them on the controller
   */
  async getPicklistItems(){
    this.picklistItems = {};
    const picklists = this.fields.filter(f => f.picklist_id && f.field_type !== 'typeahead').map(f => f.picklist_id);
    if ( picklists.length ) {
      const r = await this.models.PicklistModel.getItems(picklists, this.form.form_id);
      if ( r.state === 'loaded' ){
        this.picklistItems = r.payload;
      }
    }
  }

  /**
   * @description Fetch the form definition for the current formNameOrId and store it on the controller
   * @returns {Object} The form payload, or an empty object if not found
   */
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

  /**
   * @description Fetch the active fields for the current form and store them on the controller
   * @returns {Array} The list of field objects, or an empty array if not found
   */
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

  /**
   * @description Renders a default form layout for forms without a hardcoded template.
   * Fields are sorted by sort_order from form_field_assignment.
   * @returns {import('lit').TemplateResult}
   */
  _renderDefaultForm() {
    const formId = this.form?.form_id;
    const sorted = [...this.fields].sort((a, b) => {
      const aOrder = a.forms?.find(f => f.form_id === formId)?.sort_order ?? 0;
      const bOrder = b.forms?.find(f => f.form_id === formId)?.sort_order ?? 0;
      return aOrder - bOrder;
    });
    return html`
      <form @submit=${this._onSubmit.bind(this)}>
        ${sorted.map(f => {
          const s = f.forms?.find(form => form.form_id === formId)?.assignment_settings || {};
          return html`<ref-stats-form-entry-field
            field="${f.name}"
          ></ref-stats-form-entry-field>`;
        })}
        ${this.renderActionButtons()}
      </form>
    `;
  }

  /**
   * @description Render the appropriate template for the host element based on whether it is a form or a field
   * @returns {import('lit').TemplateResult}
   */
  render(){
    if ( this.hostIsForm ) {
      if ( this.form?.is_archived ){
        return html`<div class='alert'>This form has been archived and is no longer available for data entry.</div>`;
      }
      const template = forms.find(f => f.name === this.form?.name);
      if ( !template && !this.form?.form_id ) {
        return html`<p>Form Not Found!</p>`;
      }

      return [
        this._renderFormVersionWarning(),
        this._renderFormEntrySummary(),
        template ? template.render.call(this.host, this) : this._renderDefaultForm()
      ];
    }

    if ( this.hostIsField ) {
      const f = this.fields.find( f => f.name === this.host.field );
      const assignmentArchived = f?.forms?.find(form => form.form_id === this.form?.form_id)?.assignment_is_archived;
      if ( !f || f.is_archived || assignmentArchived ) return html``;
      const template = fields[f.field_type];
      if ( !template ) return html``;
      return template.call(this.host, this);
    }

    return html``;
  }

  /**
   * @description Render a summary of the existing form entry (submitted date, edited status) when editing
   * @returns {import('lit').TemplateResult}
   */
  _renderFormEntrySummary(){
    if ( !this.formEntry ) return html``;
    return html`
      <div class="alert">
        <div><span class="bold primary">Submitted:</span><span> ${new Date(this.formEntry.created_at).toLocaleString()}</span></div>
        <div><span class="bold primary">Edited:</span><span> ${this.formEntry.form_entry_id !== this.formEntry.original_form_entry_id ? 'Yes' : 'No'}</span></div>
      </div>
    `;
  }

  /**
   * @description Render a warning with a link when the displayed entry is not the latest version
   * @returns {import('lit').TemplateResult}
   */
  _renderFormVersionWarning(){
    if ( !this.formEntry || this.formEntry.is_latest_version ) return html``;
    return html`
      <div class="alert">
        There is a <a href="/form/${this.formNameOrId}/${this.formEntry.versions[this.formEntry.versions.length - 1]}">newer version</a> of this submission available.
      </div>
    `
  }

  /**
   * @description Render the submit, reset, new-submission, and delete action buttons.
   * The delete button is only shown when viewing the latest version of an existing entry.
   * @returns {import('lit').TemplateResult}
   */
  renderActionButtons(){
    if ( this.form?.is_archived ) return html``;
    return html`
      <div class="form-entry-action-buttons">
        <button type="submit" class="btn btn--primary">${this.formEntry ? 'Update' : 'Submit'}</button>
        <button type="button" class="btn btn--invert" @click=${this._onReset.bind(this)}>Reset</button>
        <a href="/form/${this.formNameOrId}" class="btn btn--invert" ?hidden=${!this.formEntry}>New Submission</a>
        <button type="button" class="btn btn--invert" ?hidden=${!this.formEntry?.is_latest_version} @click=${this._onDeleteClick.bind(this)}>Delete</button>
      </div>
    `;
  }

  /**
   * @description Open a confirmation modal for deleting the current form entry.
   * Only reachable when viewing the latest version of an entry.
   */
  _onDeleteClick(){
    this.models.AppStateModel.showDialogModal({
      actions: [{ text: 'Cancel', value: 'dismiss', invert: true, color: 'secondary' }],
      content: () => html`
        <ref-stats-entry-delete-confirm-form
          form-name-or-id="${this.formNameOrId}"
          entry-id="${this.formEntry.form_entry_id}">
        </ref-stats-entry-delete-confirm-form>`
    });
  }

  /**
   * @description Handle form submit event — prevent default and delegate to submit()
   * @param {SubmitEvent} e - The native form submit event
   */
  _onSubmit(e){
    e.preventDefault();
    this.submit();
  }

  /**
   * @description Submit the form payload. Shows a success toast and navigates on success.
   */
  async submit(){
    const r = await this.models.FormEntryModel.create(this.form.name, {...this.payload, ...(this.formEntry ? { original_form_entry_id: this.formEntry?.original_form_entry_id } : {})});
    if ( r.state !== 'loaded' ) return;
    if ( this.formEntry ){
      this.models.AppStateModel.showToast({text: 'Update successful', type: 'success'});
      this.models.AppStateModel.setLocation(`/form/${this.formNameOrId}/${r.payload.form_entry_id}`);
    } else {
      this.models.AppStateModel.showToast({text: 'Submission successful', type: 'success'});
      this.models.AppStateModel.refresh();
    }
  }

  /**
   * @description Reset the form payload to its original state (existing entry fields or empty object)
   */
  _onReset(){
    if ( this.formEntry?.fields ) {
      this.setPayload({...this.formEntry.fields});
    } else {
      this.setPayload({});
    }
  }

  /**
   * @description Handle app-state-update events — refresh form data and reset payload when on the active page
   * @param {Object} e - Application state event data
   */
  async _onAppStateUpdate(e) {
    if ( !this.hostIsForm || !this.appComponentController.isOnActivePage ) return;
    await this.update(e);
    if ( this.formEntry?.fields ) {
      this.setPayload({...this.formEntry.fields});
    } else {
      this.setPayload({});
    }
  }


  /**
   * @description Register event listeners when the host is connected to the DOM
   */
  hostConnected() {
    this.models.AppStateModel.EventBus.on('app-state-update', this._onAppStateUpdate.bind(this));
    this.models.FormEntryModel.EventBus.on('formentry-payload-update', this._onPayloadUpdate.bind(this));
  }

  /**
   * @description Remove event listeners when the host is disconnected from the DOM
   */
  hostDisconnected() {
    this.models.AppStateModel.EventBus.off('app-state-update', this._onAppStateUpdate.bind(this));
    this.models.FormEntryModel.EventBus.off('formentry-payload-update', this._onPayloadUpdate.bind(this));
  }
}