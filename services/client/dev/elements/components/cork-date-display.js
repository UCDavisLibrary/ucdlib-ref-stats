import { LitElement } from 'lit';
import {render, styles} from "./cork-date-display.tpl.js";

/**
 * @description Element for displaying a date and/or time
 * @property {String} iso - ISO formatted date string to display
 * @property {Boolean} dateOnly - If true, only display the date portion
 * @property {Boolean} timeOnly - If true, only display the time portion
 * @property {String} breakpoint - CSS container query breakpoint for when to stack date and time vertically. Default is '225px'.
 * @property {Date} date - Date object to display. If not provided, will be derived from `iso` property.
 * @property {Object} dateStringOptions - Options for 'toLocaleDateString()`
 * @property {Object} timeStringOptions - Options for 'toLocaleTimeString()'.
 */
export default class CorkDateDisplay extends LitElement {

  static get properties() {
    return {
      iso: { type: String },
      dateOnly: { type: Boolean, attribute: 'date-only' },
      timeOnly: { type: Boolean, attribute: 'time-only' },
      breakpoint: { type: String },
      date: {},
      dateStringOptions: { type: Object, attribute: 'date-string-options' },
      timeStringOptions: { type: Object, attribute: 'time-string-options' },
      _dateString: {state: true},
      _timeString: {state: true}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.iso = '';
    this.dateOnly = false;
    this.timeOnly = false;
    this.date = null;
    this.breakpoint = '225px';
    this.dateStringOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    this.timeStringOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };
  }

  willUpdate(props){
    if ( props.has('iso') && this.iso ) {
      this.date = new Date(this.iso);
    }
    
    if ( props.has('date') ) {
      if ( this.date instanceof Date && !isNaN(this.date) ) {
        this._dateString = this.date.toLocaleDateString(undefined, this.dateStringOptions);
        this._timeString = this.date.toLocaleTimeString(undefined, this.timeStringOptions);
      } else {
        this._dateString = '';
        this._timeString = '';
      }
    }
  }

}

customElements.define('cork-date-display', CorkDateDisplay);