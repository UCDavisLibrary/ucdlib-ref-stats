import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-picklist-items-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import IdGenerator from '../../../utils/IdGenerator.js';
import textUtils from '../../../../../lib/textUtils.js';

/**
 * @description Sub-form element for managing the items within a picklist.
 * Renders an editable, reorderable list of picklist items and tracks which
 * items have been modified so only dirty items are sent to the server.
 * @property {Array} items - The source array of picklist item objects to display.
 * @property {Array} _items - Internal working copy of items augmented with edit-state metadata.
 * @property {Boolean} disableMoveButtons - When true, hides the move-up/move-down reorder buttons.
 */
export default class RefStatsPicklistItemsForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {


  static get properties() {
    return {
      items: {type: Array},
      _items: {type: Array},
      disableMoveButtons: {type: Boolean, attribute: 'disable-move-buttons'}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.items = [];
    this.disableMoveButtons = false;

    this.ctl = {
      idGen : new IdGenerator()
    }
  }

  /**
   * @description Reacts to property changes. Converts the incoming items array into the
   * internal _items format (with edit-state metadata) and adds an empty placeholder row
   * when the list is empty.
   * @param {Map} props - Map of changed property names to their previous values.
   */
  willUpdate(props){
    if ( props.has('items') ) {
      this._items = this.items.map((item, i) => {
        return {
          edited: false, 
          expanded: false,
          include_segment_string: item.include_segment?.join(', ') || '',
          exclude_segment_string: item.exclude_segment?.join(', ') || '',
          item: {...item, sort_order: i}} 
      });
      if ( this._items.length === 0 ) {
        this.addItem();
      }
      this.setEditedOrder();
    }
  }

  /**
   * @description Appends a new blank item row to the _items list and refreshes the edited order.
   */
  addItem() {
    this._items = [
      ...this._items,
      { edited: false, expanded: false, item: { label: '', value: '', sort_order: this._items.length } }
    ];
    this.setEditedOrder();
  }

  /**
   * @description Handles input changes for a picklist item field. Marks the item as edited
   * when it has meaningful content, auto-generates the value from the label (debounced)
   * for new items, and refreshes the edited order.
   * @param {Object} item - The internal item wrapper object from _items.
   * @param {String} prop - The item property being updated.
   * @param {*} value - The new value for the property.
   */
  _onItemInput(item, prop, value) {
    item.item[prop] = value;
    if ( item.item.picklist_item_id ){
      item.edited = true;
    } else if ( item.item.label || item.item.value ) {
      item.edited = true;
    } else {
      item.edited = false;
    }

    if ( prop === 'value' ){
      item.valueHasBeenEdited = true;
    }
    
    this.setEditedOrder();

    if ( prop === 'label' && !item.item?.picklist_item_id ){
      if ( item.labelTimeout ) clearTimeout(item.labelTimeout);
      item.labelTimeout = setTimeout(() => {
        if ( item.valueHasBeenEdited ) return;
        item.item.value = textUtils.toUrlFriendly(item.item.label);
        this.requestUpdate();
      }, 500);
    }

    this.requestUpdate();
  }

  /**
   * @description Handles input for include/exclude segment strings. Parses the
   * comma-separated string into an array and delegates to _onItemInput.
   * @param {Object} item - The internal item wrapper object from _items.
   * @param {Boolean} include - True to update the include_segment, false for exclude_segment.
   * @param {String} value - The raw comma-separated segment string from the input.
   */
  _onSegmentInput(item, include, value) {
    item[include ? 'include_segment_string' : 'exclude_segment_string'] = value;
    const segments = value.split(',').map( s => s.trim() ).filter( s => s );
    this._onItemInput(item, include ? 'include_segment' : 'exclude_segment', segments);
  }

  /**
   * @description Updates the sort_order property on each item to match its current
   * index in _items, marking items as edited if their order has changed.
   */
  setSortOrder(){
    this._items.forEach( (item, i) => {
      if ( item.item.sort_order !== i ) {
        item.edited = true;
      }
      item.item.sort_order = i;
    });
    this.requestUpdate();
  }

  /**
   * @description Assigns a sequential editedOrder value to items that have been edited,
   * and sets editedOrder to null for unedited items. Used to display a count badge
   * on edited rows.
   */
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

  /**
   * @description Toggles the expanded state of an item row to show or hide advanced fields.
   * @param {Object} item - The internal item wrapper object from _items.
   */
  _onExpandToggle(item){
    item.expanded = !item.expanded;
    this.requestUpdate();
  }

  /**
   * @description Moves the item at the given index one position up in the list.
   * Does nothing if the item is already at the top.
   * @param {Number} index - The current index of the item to move.
   */
  _onMoveItemUp(index){
    if ( index === 0 ) return;
    const item = this._items[index];
    this._items.splice(index, 1);
    this._items.splice(index - 1, 0, item);
    this.setSortOrder();
    this.setEditedOrder();
  }

  /**
   * @description Moves the item at the given index one position down in the list.
   * Does nothing if the item is already at the bottom.
   * @param {Number} index - The current index of the item to move.
   */
  _onMoveItemDown(index){
    if ( index === this._items.length -1 ) return;
    const item = this._items[index];
    this._items.splice(index, 1);
    this._items.splice(index + 1, 0, item);
    this.setSortOrder();
    this.setEditedOrder();
  }
  /**
   * @description Removes the item at the given index from the list. If the last remaining
   * item is deleted, a fresh blank placeholder row is added automatically.
   * @param {Number} index - The index of the item to delete.
   */
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

  /**
   * @description Handles invalid field events. Expands the item row so the validation
   * error is visible to the user.
   * @param {Object} item - The internal item wrapper object from _items.
   */
  _onFieldInvalid(item){
    item.expanded = true;
    this.requestUpdate();
  }

}

customElements.define('ref-stats-picklist-items-form', RefStatsPicklistItemsForm);