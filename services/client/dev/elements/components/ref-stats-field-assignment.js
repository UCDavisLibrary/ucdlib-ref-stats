import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-field-assignment.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import {AppComponentController} from '#controllers';

export default class RefStatsFieldAssignment extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      formNameOrId: {type: String, attribute: 'form-name-or-id' },
      fieldNameOrId: {type: String, attribute: 'field-name-or-id' },
      fields: {type: Array },
      forms: { type: Array }
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
      console.log(this.fields);

    } else if ( this.fieldNameOrId ) {

    }
  }



}

customElements.define('ref-stats-field-assignment', RefStatsFieldAssignment);