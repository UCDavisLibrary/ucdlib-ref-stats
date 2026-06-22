import { LitElement } from 'lit';
import {render} from "./ref-stats-picklist-item-quick-add.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import textUtils from '#lib/textUtils.js';

/**
 * @description Inline widget for quickly adding a new item to an existing picklist.
 * Submits on Enter key or button click and dispatches a picklist-item-added event on success.
 * @property {String} picklistNameOrId - Name or ID of the picklist to add the item to (reflected via attribute picklist-name-or-id)
 * @property {String} value - Current text value of the input field
 * @property {String} placeholder - Placeholder text shown in the input field
 * @property {Boolean} disabled - When true, prevents submission
 * @property {String} toastSuccessText - Toast message shown on successful item creation (reflected via attribute toast-success-text)
 * @property {String} toastErrorText - Toast message shown when item creation fails (reflected via attribute toast-error-text)
 */
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

  /**
   * @description Handles keydown events on the input, submitting the form when Enter is pressed.
   * @param {KeyboardEvent} e - Keydown event from the input element
   */
  _onKeyDown(e) {
    if ( e.key !== 'Enter' ) return;
    e.preventDefault();
    if ( this.disabled ) return;
    this.submit();
  }

  /**
   * @description Handles click events on the add button, triggering a submit if not disabled.
   */
  _onAddClick() {
    if ( this.disabled ) return;
    this.submit();
  }

  /**
   * @description Submits the new picklist item to the API. Converts the label to a URL-friendly value,
   * shows a toast on success or failure, and dispatches a picklist-item-added event on success.
   */
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