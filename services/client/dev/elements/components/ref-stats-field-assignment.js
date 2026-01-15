import { LitElement, html } from 'lit';
import {render, styles} from "./ref-stats-field-assignment.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController} from '#controllers';

import '#components/ref-stats-field-typeahead.js';

export default class RefStatsFieldAssignment extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      formNameOrId: {type: String, attribute: 'form-name-or-id' },
      fieldNameOrId: {type: String, attribute: 'field-name-or-id' },
      fields: {type: Array },
      forms: { type: Array },
      fieldToAdd: { state: true },
      formToAdd: { state: true }
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

    this.ctl = {
      appComponent : new AppComponentController(this),
    }

    this._injectModel('AppStateModel', 'FormModel', 'FieldModel');
  }

  willUpdate(props) {
    if ( props.has('formNameOrId') || props.has('fieldNameOrId') ) {
      this._loadData();
    }
  }

  async _loadData() {
    if ( this.formNameOrId ) {
      const r = await this.FieldModel.query({ form: this.formNameOrId, page: 1, per_page: 100 });
      if ( r.state !== 'loaded' ) return;
      this.fields = r.payload.results.map( f => {
        const out = { field: f };
        const form = f.forms.find( form => form.form_id === this.formNameOrId || form.name === this.formNameOrId );
        out.assignment_is_archived = !!form?.assignment_is_archived
        return out;
      });
      if ( r.payload.max_page > 1 ) {
        console.warn('RefStatsFieldAssignment: more than 100 fields assigned to form, only first 100 loaded');
      }

    } else if ( this.fieldNameOrId ) {
      const r = await this.FieldModel.get(this.fieldNameOrId);
      if ( r.state !== 'loaded' ) return;
      this.forms = r.payload.forms || [];
    }
  }

  async _onArchiveClick(id) {
    const fieldId = this.fieldNameOrId || id;
    const formId = this.formNameOrId || id;
    const res = await this.FieldModel.archiveAssignment(fieldId, formId);
    if ( res.state === 'loaded' ) {
      this.AppStateModel.showToast({text: 'Field assignment archived successfully', type: 'success'});
      this._loadData();
    }
  }

  async _onUnarchiveClick(id) {
    const fieldId = this.fieldNameOrId || id;
    const formId = this.formNameOrId || id;
    const res = await this.FieldModel.unarchiveAssignment(fieldId, formId);
    if ( res.state === 'loaded' ) {
      this.AppStateModel.showToast({text: 'Field assignment unarchived successfully', type: 'success'});
      this._loadData();
    }
  }

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