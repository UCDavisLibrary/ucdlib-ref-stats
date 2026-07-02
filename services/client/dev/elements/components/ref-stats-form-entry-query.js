import { LitElement, html } from 'lit';
import {render} from "./ref-stats-form-entry-query.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController, QueryStringController} from '#controllers';
import { IdGenerator } from '#client-utils';

import '#components/cork-date-display.js';

/**
 * @typedef {Object} RefStatsDisplayField
 * @description Fields that will be displayed in the form entry results (either as a column or in the expandable details section)
 * @property {String} field - The name of the field to display
 * @property {String} label - (optional) The label to use when displaying the field. If not provided, the field's label from the form definition will be used.
 * @property {Number} desktopFr - (optional) The fractional unit for this field column in desktop view. If not provided, field will not be a column in desktop view.
 * @property {Number} mobileFr - (optional) The fractional unit for this field column in mobile view. If not provided, field will not be a column in mobile view.
 */

/**
 * @description Element for querying and displaying form entries
 * @property {Array} formNameOrId - Array of form names or ids to query entries for
 * @property {Boolean} latestVersion - Only retrieve most recent version of each form entry
 * @property {RefStatsDisplayField[]} displayedFields - Array of form fields to display in the results
 * @property {String} orderByField - Field name to order results by. Prepend with '-' for descending order.
 * @property {Number} mobileThreshold - Width in pixels below which the mobile layout will be used. Default is 768.
 */
export default class RefStatsFormEntryQuery extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      formNameOrId: { type: Array },
      latestVersion: { type: Boolean, attribute: 'latest-version' },
      mine: { type: Boolean },
      orderByField: { type: String, attribute: 'order-by-field' },
      displayedFields: { type: Array },
      mobileThreshold: { type: Number, attribute: 'mobile-threshold' },
      maxPage: {type: Number },
      formEntries: {type: Array },
      formFields: { type: Object },
      forms: { type: Array },
      expandedEntries: { type: Array },
      picklistItems: { type: Object }
    }
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.formEntries = [];
    this.formNameOrId = [];
    this.forms = [];
    this.orderByField = '';
    this.latestVersion = false;
    this.mine = false;
    this.maxPage = 1;
    this.formFields = {};
    this.mobileThreshold = 768;
    this.expandedEntries = [];
    this.displayedFields = [];
    this.picklistItems = {};

    this.ctl = {
      appComponent : new AppComponentController(this),
      qs : new QueryStringController(this),
      idGen: new IdGenerator(this)
    }

    this.id = this.ctl.idGen.get('self');

    this._injectModel('FormEntryModel', 'AppStateModel', 'FieldModel', 'PicklistModel', 'FormModel');
  }

  /**
   * @description Callback for app state updates
   */
  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    await this.ctl.qs.updateComplete;
    this.expandedEntries = [];
    await this.query();
  }

  /**
   * @description Query for form entries based on current properties and query string params. 
   * Also retrieves other data required for display (form fields, picklist items).
   * @returns 
   */
  async query(){
    const q = {...this.ctl.qs.query};
    if ( this.formNameOrId.length && !q.form ) {
      q.form = this.formNameOrId;
    }
    if ( this.mine ) {
      q.mine = true;
    }
    if ( this.latestVersion ) {
      q.is_latest_version = true;
    }
    if ( this.orderByField ) {
      q.orderByField = this.orderByField;
    }

    const promises = [this.FormEntryModel.query(q)];
    for ( const formNameOrId of this.formNameOrId ) {
      promises.push(this.FieldModel.query({form: formNameOrId, per_page: 500}));
    }

    const [res, ...formFields] = await Promise.all(promises);
    if ( res.state !== 'loaded' ) {
      this.formEntries = [];
      this.maxPage = 1;
      return;
    }
    this.formEntries = res.payload.results;
    this.maxPage = res.payload.max_page;

    if ( this.displayedFields.find(f => f.field === '_form') && this.formEntries.length ) {
      const formNames = [...(new Set(this.formEntries.map(fe => fe.form_name))).values()];
      const q = {name: formNames};
      if ( this.ctl.qs.query?.per_page ) {
        q.per_page = this.ctl.qs.query.per_page;
      }
      const formRes = await this.FormModel.query(q);
      if ( formRes.state === 'loaded' ) {
        this.forms = formRes.payload.results;
      } else {
        this.forms = [];
      }
    }

    this.formFields = {};
    const picklists = new Set();
    formFields.forEach(r => {
      if ( r.state === 'loaded' ) {
        for ( const field of r.payload.results ) {
          this.formFields[field.name] = field;
          if ( field.picklist_id && field.field_type !== 'typeahead' ) {
            picklists.add(field.picklist_id);
          }
        }
      }
    });
    if ( picklists.size ) {
      const r = await this.PicklistModel.getItems(Array.from(picklists));
      if ( r.state === 'loaded' ) {
        this.picklistItems = r.payload;
      }
    } else {
      this.picklistItems = {};
    }
  }

  /**
   * @description Toggle whether a form entry details section is expanded or collapsed
   * @param {String} entryId - The ID of the form entry to toggle
   */
  toggleEntryExpanded(entryId){
    const idx = this.expandedEntries.indexOf(entryId);
    if ( idx === -1 ) {
      this.expandedEntries.push(entryId);
    } else {
      this.expandedEntries.splice(idx, 1);
    }
    this.requestUpdate();
  }

  /**
   * @description Callback for page change events from pagination control
   * @param {*} e 
   */
  _onPageChange(e){
    this.ctl.qs.setParam('page', e.detail.page);
    this.ctl.qs.setLocation();
  }

  /**
   * @description Get the display label for a given field
   * @param {String} fieldName - The name of the field
   * @returns {String}
   */
  getFieldLabel(fieldName){
    const displayField = this.displayedFields.find(f => f.field === fieldName);
    if ( displayField?.label ) {
      return displayField.label;
    }

    // entry metadata fields with hardcoded labels
    if ( fieldName === '_created_at' ) return 'Submitted At';
    if ( fieldName === '_id' ) return 'Entry ID';
    if ( fieldName === '_form' ) return 'Form';
    if ( fieldName === '_submitter' ) return 'Submitter';

    const field = this.formFields[fieldName];
    if ( !field ) return fieldName;
    const form = field.forms.find( f => this.formNameOrId.includes(f.name) || this.formNameOrId.includes(f.form_id) );
    return form?.assignment_settings?.label || field.label || field.name;
  }

  /**
   * @description Get the display value for a given field in a form entry
   * @param {Object} formEntry - The form entry object
   * @param {String} fieldName - The name of the field
   * @returns {String|TemplateResult}
   */
  getFieldValue(formEntry, fieldName){
    if ( fieldName === '_created_at' ) {
      return html`<cork-date-display iso=${formEntry.created_at}></cork-date-display>`;
    }
    if ( fieldName === '_id' ){
      return formEntry.form_entry_id;
    }
    if ( fieldName === '_form' ){
      return this.forms.find(f => f.name === formEntry.form_name)?.label || formEntry.form_name;
    }
    if ( fieldName === '_submitter' ){
      let name = `${formEntry.submitted_by_user?.first_name || ''} ${formEntry.submitted_by_user?.last_name || ''}`.trim();
      if ( !name ) {
        name = formEntry.submitted_by_user?.user_id || '';
      }
      return name || '';
    }
    const fieldValue = formEntry.fields[fieldName];
    const fieldValueArray = Array.isArray(fieldValue) ? fieldValue : [fieldValue];

    const field = this.formFields[fieldName];
    if ( field?.picklist_id && this.picklistItems[field.picklist_id] ) {
      const labels = fieldValueArray.map( v => {
        const item = this.picklistItems[field.picklist_id].find( pi => pi.value === v );
        return item ? item.label : v;
      });
      return labels.join(', ');
    }

    if ( field?.field_type === 'date' || field?.field_type === 'datetime' ) {
      return html`<cork-date-display
        iso=${fieldValueArray[0] || ''}
        ?date-only=${field?.field_type === 'date'}
      ></cork-date-display>
      `;
    }
    
    return fieldValueArray.join(', ') || '';
  }

}

customElements.define('ref-stats-form-entry-query', RefStatsFormEntryQuery);