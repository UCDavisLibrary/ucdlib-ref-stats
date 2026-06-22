import { LitElement, html } from 'lit';
import {render, styles} from "./ref-stats-field-assignment.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController} from '#controllers';
import { forms } from '#templates';

import '#components/ref-stats-field-typeahead.js';
import '#components/forms/ref-stats-field-settings-form.js';

/**
 * @description Element for managing field-to-form assignments. Can operate in two modes:
 * form-centric (shows all fields assigned to a given form) or field-centric (shows all forms
 * a given field is assigned to). Supports adding, removing, archiving, reordering, and
 * configuring field assignments.
 * @property {String} formNameOrId - Name or ID of the form to manage assignments for (reflected via attribute form-name-or-id)
 * @property {String} fieldNameOrId - Name or ID of the field to manage assignments for (reflected via attribute field-name-or-id)
 * @property {Array} fields - List of field-assignment objects when operating in form-centric mode
 * @property {Array} forms - List of form objects the field is assigned to when in field-centric mode
 */
export default class RefStatsFieldAssignment extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      formNameOrId: {type: String, attribute: 'form-name-or-id' },
      fieldNameOrId: {type: String, attribute: 'field-name-or-id' },
      fields: {type: Array },
      forms: { type: Array },
      fieldToAdd: { state: true },
      formToAdd: { state: true },
      fieldType: { state: true },
      fieldObj: { state: true },
      hasCustomTemplate: { state: true },
      reordering: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.formNameOrId = null;
    this.fieldNameOrId = null;
    this.fields = [];
    this.forms = [];
    this.fieldType = null;
    this.fieldObj = null;
    this.hasCustomTemplate = false;
    this.reordering = false;

    this.ctl = {
      appComponent : new AppComponentController(this),
    }

    this._injectModel('AppStateModel', 'FormModel', 'FieldModel');
  }

  /**
   * @description Triggers a data load whenever formNameOrId or fieldNameOrId changes.
   * @param {Map} props - Map of changed property names to their previous values
   */
  willUpdate(props) {
    if ( props.has('formNameOrId') || props.has('fieldNameOrId') ) {
      this._loadData();
    }
  }

  /**
   * @description Responds to app-state changes. Reloads data when the active page path
   * matches the currently managed form or field identifier.
   * @param {Object} e - App state update event containing the current location
   */
  _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    const nameOrId = e.location.path?.[1];
    if ( this.formNameOrId && nameOrId === this.formNameOrId ) {
      this._loadData();
    } else if ( this.fieldNameOrId && nameOrId === this.fieldNameOrId ) {
      this._loadData();
    }
  }

  /**
   * @description Loads assignment data from the API based on the current mode.
   * In form-centric mode fetches all fields assigned to the form and enriches them with
   * assignment metadata. In field-centric mode fetches the field and its form assignments.
   */
  async _loadData() {
    if ( this.formNameOrId ) {
      const r = await this.FieldModel.query({ form: this.formNameOrId, page: 1, per_page: 500 });
      if ( r.state !== 'loaded' ) return;
      this.fields = r.payload.results.map( f => {
        const out = { field: f };
        const form = f.forms.find( form => form.form_id === this.formNameOrId || form.name === this.formNameOrId );
        out.assignment_is_archived = !!form?.assignment_is_archived;
        out.assignment_settings = form?.assignment_settings || {};
        out.formName = form?.name || this.formNameOrId;
        out.sort_order = form?.sort_order ?? 0;
        return out;
      });
      this.fields.sort((a, b) => a.sort_order - b.sort_order);
      const resolvedFormName = this.fields[0]?.formName;
      this.hasCustomTemplate = resolvedFormName ? forms.some(f => f.name === resolvedFormName) : false;
      if ( r.payload.max_page > 1 ) {
        console.warn('RefStatsFieldAssignment: more than 500 fields assigned to form, only first 500 loaded');
      }

    } else if ( this.fieldNameOrId ) {
      const r = await this.FieldModel.get(this.fieldNameOrId);
      if ( r.state !== 'loaded' ) return;
      this.forms = r.payload.forms || [];
      this.fieldType = r.payload.field_type || null;
      this.fieldObj = r.payload;
    }
  }

  /**
   * @description Archives a field-form assignment and reloads data on success.
   * @param {String|Number} id - Form ID when in field-centric mode, or field ID when in form-centric mode
   */
  async _onArchiveClick(id) {
    const fieldId = this.fieldNameOrId || id;
    const formId = this.formNameOrId || id;
    const res = await this.FieldModel.archiveAssignment(fieldId, formId);
    if ( res.state === 'loaded' ) {
      this.AppStateModel.showToast({text: 'Field assignment archived successfully', type: 'success'});
      this._loadData();
    }
  }

  /**
   * @description Unarchives a field-form assignment and reloads data on success.
   * @param {String|Number} id - Form ID when in field-centric mode, or field ID when in form-centric mode
   */
  async _onUnarchiveClick(id) {
    const fieldId = this.fieldNameOrId || id;
    const formId = this.formNameOrId || id;
    const res = await this.FieldModel.unarchiveAssignment(fieldId, formId);
    if ( res.state === 'loaded' ) {
      this.AppStateModel.showToast({text: 'Field assignment unarchived successfully', type: 'success'});
      this._loadData();
    }
  }

  /**
   * @description Opens a dialog modal for adding a field-to-form assignment.
   * In form-centric mode presents a field typeahead; in field-centric mode presents a form typeahead.
   */
  _onAddFieldClick(){
    if ( this.formNameOrId ) {
      this.fieldToAdd = null;
      this.AppStateModel.showDialogModal({
        title: 'Add Field to Form',
        content: () => html`
          <ref-stats-field-typeahead
            @field-typeahead-selected=${(e) => {
              this.fieldToAdd = e.detail.field.form_field_id;
            }} 
            .excludeForm=${this.formNameOrId}
            relative-dropdown
          >
          </ref-stats-field-typeahead>
        `,
        actions: [
          {text: 'Close', value: 'dismiss', invert: true, color: 'secondary'},
          { text: 'Add', color: 'secondary', value: 'add-field-to-form' }
        ]
      })
    } else if ( this.fieldNameOrId ) {
      this.formToAdd = null;
      this.AppStateModel.showDialogModal({
        title: 'Add Field to Form',
        content: () => html`
          <ref-stats-form-typeahead
            @form-typeahead-selected=${(e) => {
              this.formToAdd = e.detail.form.form_id;
            }} 
            relative-dropdown
          >
          </ref-stats-form-typeahead>
        `,
        actions: [
          {text: 'Close', value: 'dismiss', invert: true, color: 'secondary'},
          { text: 'Add', color: 'secondary', value: 'add-field-to-form' }
        ]
      })
    }
  }

  /**
   * @description Opens a confirmation dialog for removing a field-form assignment.
   * @param {String|Number} id - Form ID when in field-centric mode, or field ID when in form-centric mode
   */
  _onRemoveFieldClick(id){
    const fieldId = this.fieldNameOrId || id;
    const formId = this.formNameOrId || id;
    this.AppStateModel.showDialogModal({
      title: 'Remove Field from Form',
      content: () => html`
        Are you sure you want to remove this field from the form? This will remove responses to this field in previous submissions.
      `,
      data: { fieldId, formId },
      actions: [
        {text: 'Cancel', value: 'dismiss', invert: true, color: 'secondary'},
        { text: 'Remove', color: 'secondary', value: 'remove-field-from-form' }
      ]
    })
    
  }

  /**
   * @description Move a field up or down in the form's sort order
   * @param {'up'|'down'} direction
   * @param {Object} fieldItem - item from this.fields
   */
  async _onReorderClick(direction, fieldItem) {
    const idx = this.fields.indexOf(fieldItem);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= this.fields.length) return;

    this.reordering = true;

    const orders = this.fields.map((_, i) => i);
    [orders[idx], orders[targetIdx]] = [orders[targetIdx], orders[idx]];

    await Promise.all([
      this.FieldModel.reorderAssignment(this.fields[idx].field.form_field_id, this.formNameOrId, orders[idx]),
      this.FieldModel.reorderAssignment(this.fields[targetIdx].field.form_field_id, this.formNameOrId, orders[targetIdx])
    ]);

    this.reordering = false;
    this._loadData();
  }

  /**
   * @description Open the field settings modal for a given field-form assignment
   * @param {Object} field - field object with form_field_id, name, field_type
   * @param {Object} form - form object with form_id, name
   * @param {Object} assignmentSettings - current assignment_settings
   */
  _onSettingsClick(field, form, assignmentSettings) {
    this.AppStateModel.showDialogModal({
      content: () => html`
        <ref-stats-field-settings-form
          fieldId=${field.form_field_id}
          formId=${form.form_id || form.name}
          fieldType=${field.field_type}
          fieldName=${field.name}
          formName=${form.name}
          .assignmentSettings=${assignmentSettings || {}}
          @ucdlib-rs-field-assignment-action=${() => this._loadData()}
        ></ref-stats-field-settings-form>
      `
    });
  }

  /**
   * @description Handles dialog modal action events. Processes add-field-to-form and
   * remove-field-from-form actions, calling the appropriate FieldModel methods and reloading data on success.
   * @param {CustomEvent} e - Dialog action event with action.value and optional data payload
   */
  async _onAppDialogAction(e){
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    if ( e.action.value === 'add-field-to-form' ) {
      if ( this.formNameOrId ) {
        if ( !this.fieldToAdd ) return;
        const r = await this.FieldModel.assign(this.fieldToAdd, this.formNameOrId);
        if ( r.state === 'loaded' ) {
          this.AppStateModel.showToast({text: 'Field assigned to form successfully', type: 'success'});
          this._loadData();
        }
      }
      if ( this.fieldNameOrId ) {
        if ( !this.formToAdd ) return;
        if ( this.forms.find( f => f.form_id === this.formToAdd ) ) {
          this.AppStateModel.showToast({text: 'Field is already assigned to that form', type: 'error'});
          return;
        }
        const r = await this.FieldModel.assign(this.fieldNameOrId, this.formToAdd);
        if ( r.state === 'loaded' ) {
          this.AppStateModel.showToast({text: 'Field assigned to form successfully', type: 'success'});
          this._loadData();
        }
      }

    } else if ( e.action.value === 'remove-field-from-form' ) {
      const r = await this.FieldModel.unassign(e.data.fieldId, e.data.formId);
      if ( r.state === 'loaded' ) {
        this.AppStateModel.showToast({text: 'Field removed from form successfully', type: 'success'});
        this._loadData();
      }
    }
  }



}

customElements.define('ref-stats-field-assignment', RefStatsFieldAssignment);