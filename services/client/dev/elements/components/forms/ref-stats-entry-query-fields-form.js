import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-entry-query-fields-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController } from '#controllers';
import { IdGenerator } from '#client-utils';

const META_FIELDS = [
  { name: '_id', label: 'Entry ID' },
  { name: '_created_at', label: 'Submitted At' }
];

/**
 * @description Form component for configuring the queryElementFields (RefStatsDisplayField[]) on a form.
 * Reads nameOrId from app state. Fires 'ref-stats-entry-query-fields-updated' on any change.
 * Intended to be embedded within ref-stats-form-form when editing an existing form.
 * @property {String} nameOrId - Form name or ID, derived from app state location path
 * @property {Array} queryElementFields - Current display field configuration
 * @property {Array} availableFields - All form-assigned fields plus meta fields, usable as display field options
 */
export default class RefStatsEntryQueryFieldsForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      nameOrId: {type: String},
      queryElementFields: {type: Array},
      availableFields: {type: Array}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.nameOrId = null;
    this.queryElementFields = [];
    this.availableFields = [];

    this.ctl = {
      appComponent: new AppComponentController(this),
      idGen : new IdGenerator()
    };

    this._injectModel('AppStateModel', 'FormModel', 'FieldModel');
  }

  /**
   * @description Callback for app state updates. Loads form data and assigned fields.
   * @param {Object} e - App state event
   */
  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    this.nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    if ( !this.nameOrId ) return;

    const [formRes, fieldsRes] = await Promise.all([
      this.FormModel.get(this.nameOrId),
      this.FieldModel.query({form: this.nameOrId, per_page: 500})
    ]);

    if ( formRes?.state === 'loaded' ) {
      this.queryElementFields = formRes.payload?.form_display_settings?.queryElementFields || [];
    }

    const assignedFields = fieldsRes?.state === 'loaded'
      ? fieldsRes.payload.results.map(f => ({ name: f.name, label: f.label || f.name }))
      : [];

    this.availableFields = [...META_FIELDS, ...assignedFields];
  }

  /**
   * @description Returns the fields not yet in queryElementFields, for use in the add-field dropdown.
   * @returns {Array}
   */
  get unselectedFields() {
    const used = new Set(this.queryElementFields.map(f => f.field));
    return this.availableFields.filter(f => !used.has(f.name));
  }

  /**
   * @description Dispatch the updated fields array as a custom event.
   */
  _dispatchUpdate() {
    this.dispatchEvent(new CustomEvent('ref-stats-entry-query-fields-updated', {
      detail: { fields: [...this.queryElementFields] },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * @description Move a display field up or down in the ordered list.
   * @param {String} direction - 'up' or 'down'
   * @param {Number} idx - Index of the field to move
   */
  _onMoveClick(direction, idx) {
    const fields = [...this.queryElementFields];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [fields[idx], fields[swapIdx]] = [fields[swapIdx], fields[idx]];
    this.queryElementFields = fields;
    this._dispatchUpdate();
  }

  /**
   * @description Remove a display field from the list.
   * @param {Number} idx - Index of the field to remove
   */
  _onRemoveClick(idx) {
    const fields = [...this.queryElementFields];
    fields.splice(idx, 1);
    this.queryElementFields = fields;
    this._dispatchUpdate();
  }

  /**
   * @description Add the selected field from the dropdown to the list.
   * @param {Event} e - Change event from the select element
   */
  _onAddField(e) {
    const fieldName = e.target.value;
    if ( !fieldName ) return;
    e.target.value = '';
    this.queryElementFields = [...this.queryElementFields, { field: fieldName }];
    this._dispatchUpdate();
  }

  /**
   * @description Update a property on a display field entry.
   * @param {Number} idx - Index of the field to update
   * @param {String} prop - Property name ('desktopFr', 'mobileFr', or 'label')
   * @param {*} value - New value
   */
  _onFieldInput(idx, prop, value) {
    const fields = [...this.queryElementFields];
    const field = {...fields[idx]};
    if ( value === '' || value === null || value === undefined ) {
      delete field[prop];
    } else {
      field[prop] = value;
    }
    fields[idx] = field;
    this.queryElementFields = fields;
    this._dispatchUpdate();
  }

  /**
   * @description Get the display label for a field name from availableFields.
   * @param {String} fieldName
   * @returns {String}
   */
  getAvailableFieldLabel(fieldName) {
    return this.availableFields.find(f => f.name === fieldName)?.label || fieldName;
  }

}

customElements.define('ref-stats-entry-query-fields-form', RefStatsEntryQueryFieldsForm);
