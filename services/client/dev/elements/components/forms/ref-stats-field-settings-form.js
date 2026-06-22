import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-field-settings-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { ModalFormController } from '#controllers';
import { IdGenerator } from '#client-utils';
import definitions from '#lib/definitions.js';
import { forms } from '#templates';

/**
 * @description Modal form for editing the settings of a field assigned to a specific form.
 * Allows configuring per-assignment settings such as validation rules and display options.
 * @property {String} fieldId - The ID of the field whose settings are being edited.
 * @property {String} formId - The ID of the form to which the field is assigned.
 * @property {String} fieldType - The type of the field (e.g. text, number, picklist).
 * @property {String} fieldName - The machine name of the field.
 * @property {String} formName - The machine name of the form.
 * @property {Object} assignmentSettings - The existing assignment settings to pre-populate the form.
 * @property {Object} payload - The current settings payload bound to the form inputs.
 * @property {Boolean} customValidation - Whether the field has custom validation rules defined.
 * @property {Boolean} hasCustomTemplate - Whether the form has a custom template registered.
 */
export default class RefStatsFieldSettingsForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      fieldId: { type: String },
      formId: { type: String },
      fieldType: { type: String },
      fieldName: { type: String },
      formName: { type: String },
      assignmentSettings: { type: Object },
      payload: { type: Object },
      customValidation: { state: true },
      hasCustomTemplate: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.fieldId = null;
    this.formId = null;
    this.fieldType = null;
    this.fieldName = null;
    this.formName = null;
    this.assignmentSettings = {};
    this.payload = {};
    this.customValidation = false;
    this.hasCustomTemplate = false;

    this.ctl = {
      modal: new ModalFormController(this, { submitCallback: '_onSubmitClick' }),
      idGen: new IdGenerator()
    };

    this._injectModel('FieldModel', 'AppStateModel');
  }

  /**
   * @description Reacts to property changes. Re-initialises the payload from assignmentSettings
   * and updates modal title/submit button text when key properties change. Also checks whether
   * a custom template exists for the current form name.
   * @param {Map} props - Map of changed property names to their previous values.
   */
  willUpdate(props) {
    if ( props.has('assignmentSettings') || props.has('fieldType') || props.has('fieldName') || props.has('formName') ) {
      this.payload = { ...(this.assignmentSettings || {}) };
      this.customValidation = definitions.hasCustomValidation(this.formName, this.fieldName);
      this.ctl.modal.setModalTitle('Field Settings');
      this.ctl.modal.setModalSubmitButton('Save Settings');
    }

    if ( props.has('formName') ){
      this.hasCustomTemplate = forms.some( f => f.name === this.formName );
    }
  }

  /**
   * @description Updates a single property on the payload immutably.
   * @param {String} prop - The payload property name to update.
   * @param {*} value - The new value for the property.
   */
  _onPayloadInput(prop, value) {
    this.payload = { ...this.payload, [prop]: value };
  }

  /**
   * @description Persists the current payload as assignment settings via FieldModel.
   * Shows a success toast and fires a `ucdlib-rs-field-assignment-action` event on success.
   * @returns {Object} The model response object.
   */
  async _onSubmitClick() {
    const r = await this.FieldModel.patchAssignmentSettings(this.fieldId, this.formId, this.payload);
    if ( r?.payload?.error?.response?.status == 422 ) return r;

    if ( r.state === 'loaded' ) {
      this.AppStateModel.showToast({ text: 'Field settings saved successfully', type: 'success' });
      this.dispatchEvent(new CustomEvent('ucdlib-rs-field-assignment-action', {
        detail: { action: 'settings-updated', fieldId: this.fieldId, formId: this.formId },
        bubbles: true,
        composed: true
      }));
    }

    return r;
  }

}

customElements.define('ref-stats-field-settings-form', RefStatsFieldSettingsForm);
