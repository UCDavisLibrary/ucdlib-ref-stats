import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-field-settings-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { ModalFormController } from '#controllers';
import { IdGenerator } from '#client-utils';
import definitions from '#lib/definitions.js';

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
      customValidation: { state: true }
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

    this.ctl = {
      modal: new ModalFormController(this, { submitCallback: '_onSubmitClick' }),
      idGen: new IdGenerator()
    };

    this._injectModel('FieldModel', 'AppStateModel');
  }

  willUpdate(props) {
    if ( props.has('assignmentSettings') || props.has('fieldType') || props.has('fieldName') || props.has('formName') ) {
      this.payload = { ...(this.assignmentSettings || {}) };
      this.customValidation = definitions.hasCustomValidation(this.formName, this.fieldName);
      this.ctl.modal.setModalTitle('Field Settings');
      this.ctl.modal.setModalSubmitButton('Save Settings');
    }
  }

  _onPayloadInput(prop, value) {
    this.payload = { ...this.payload, [prop]: value };
  }

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
