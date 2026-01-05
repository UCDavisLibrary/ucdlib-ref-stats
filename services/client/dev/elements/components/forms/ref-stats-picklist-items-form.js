import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-picklist-items-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import IdGenerator from '../../../utils/IdGenerator.js';
import textUtils from '../../../../../lib/textUtils.js';

export default class RefStatsPicklistItemsForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {


  static get properties() {
    return {
      items: {type: Array},
      _items: {type: Array}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.items = [];

    this.ctl = {
      idGen : new IdGenerator()
    }
  }

  willUpdate(props){
    if ( props.has('items') ) {
      this._items = this.items.map((item, i) => { 
        return {edited: false, expanded: false, item: {...item, sort_order: i}} 
      });
      if ( this._items.length === 0 ) {
        this.addItem();
      }
      this.setEditedOrder();
    }
  }

  addItem() {
    this._items = [
      ...this._items,
      { edited: false, expanded: false, item: { label: '', value: '', sort_order: this._items.length } }
    ];
    this.setEditedOrder();
  }

  _onItemInput(item, prop, value) {
    item.item[prop] = value;
    if ( item.item.picklist_item_id ){
      item.edited = true;
    } else if ( item.item.label || item.item.value ) {
      item.edited = true;
    } else {
      item.edited = false;
    }
    
    this.setEditedOrder();

    if ( prop === 'label' && !item.item.value ){
      if ( item.labelTimeout ) clearTimeout(item.labelTimeout);
      item.labelTimeout = setTimeout(() => {
        if ( item.item.value ) return;
        item.item.value = textUtils.toUrlFriendly(item.item.label);
        this.requestUpdate();
      }, 500);
    }

    this.requestUpdate();
  }

  setSortOrder(){
    this._items.forEach( (item, i) => {
      if ( item.item.sort_order !== i ) {
        item.edited = true;
      }
      item.item.sort_order = i;
    });
    this.requestUpdate();
  }

  setEditedOrder(){
    let i = 0;
    this._items.forEach( item => {
      if ( item.edited ) {
        item.editedOrder = i;
        i++;
      } else {
        item.editedOrder = null;
      }
    });
    this.requestUpdate();
  }

  _onExpandToggle(item){
    item.expanded = !item.expanded;
    this.requestUpdate();
  }

  _onMoveItemUp(index){
    if ( index === 0 ) return;
    const item = this._items[index];
    this._items.splice(index, 1);
    this._items.splice(index - 1, 0, item);
    this.setSortOrder();
    this.setEditedOrder();
  }

  _onMoveItemDown(index){
    if ( index === this._items.length -1 ) return;
    const item = this._items[index];
    this._items.splice(index, 1);
    this._items.splice(index + 1, 0, item);
    this.setSortOrder();
    this.setEditedOrder();
  }
  _onDeleteItem(index){
    if ( index === this._items.length -1 && this._items.length === 1 ) {
      this._items = [];
      this.addItem();
    } else {
      this._items.splice(index, 1);
    }
    this.setSortOrder();
    this.setEditedOrder();
  }

  _onFieldInvalid(item){
    item.expanded = true;
    this.requestUpdate();
  }

}

customElements.define('ref-stats-picklist-items-form', RefStatsPicklistItemsForm);