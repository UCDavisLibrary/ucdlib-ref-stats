import { LitElement } from 'lit';
import {render} from "./ref-stats-picklist-item-quick-add.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import textUtils from '#lib/textUtils.js';

export default class RefStatsPicklistItemQuickAdd extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      picklistNameOrId: {type: String, attribute: 'picklist-name-or-id' },
      value: {type: String },
      placeholder: {type: String  },
      disabled: {type: Boolean },
      toastSuccessText: {type: String, attribute: 'toast-success-text' },
      toastErrorText: {type: String, attribute: 'toast-error-text' }
    }
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.picklistNameOrId = null;
    this.value = '';
    this.placeholder = 'Add new item...';
    this.disabled = false;

    this.toastSuccessText = 'Picklist item added successfully.';
    this.toastErrorText = 'Error adding picklist item.';

    this._injectModel('PicklistModel', 'AppStateModel');
  }

  _onKeyDown(e) {
    if ( e.key !== 'Enter' ) return;
    e.preventDefault();
    if ( this.disabled ) return;
    this.submit();
  }

  _onAddClick() {
    if ( this.disabled ) return;
    this.submit();
  }

  async submit(){
    const label = this.value.trim();
    if ( !label || !this.picklistNameOrId ) return;
    const value = textUtils.toUrlFriendly(label);
    const r = await this.PicklistModel.patch(this.picklistNameOrId, {items: [{label, value}]});

    if ( r?.payload?.error?.response?.status == 422 ) {
      this.AppStateModel.showToast({text: this.toastErrorText, type: 'error'});
    } else if ( r.state === 'loaded' ){
      this.AppStateModel.showToast({text: this.toastSuccessText, type: 'success'});
      
      this.dispatchEvent(new CustomEvent('picklist-item-added', {
        detail: { picklist: r.payload, item: {label, value} },
        bubbles: true,
        composed: true
      }));
      this.value = '';
    }

  }


}

customElements.define('ref-stats-picklist-item-quick-add', RefStatsPicklistItemQuickAdd);