import { LitElement } from 'lit';
import { render, styles } from "./cork-app-error.tpl.js";
import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';


/**
 * @description Displays a full-screen error overlay when the application encounters one or more errors.
 * Listens for AppStateModel error events and renders error details with optional login prompt.
 * @property {String} heading - The heading text displayed at the top of the error overlay.
 * @property {Array} errors - List of formatted error objects currently displayed.
 * @property {Boolean} showLoginButton - Whether to show a login button in the error overlay.
 * @property {Boolean} badAuth - Whether the error is due to a bad authentication state.
 */
export default class CorkAppError extends Mixin(LitElement)
  .with(LitCorkUtils) {

  static get properties() {
    return {
      heading: {type: String},
      errors: {state: true},
      showLoginButton: {type: Boolean},
      badAuth: {state: true}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.heading = 'Error';
    this.errors = [];
    this.showLoginButton = false;
    this.badAuth = false;

    this._injectModel('AppStateModel');
  }

  /**
   * @description Listener for AppStateModel error update events. Shows or hides the error overlay.
   * @param {Object} e - The event object from AppStateModel.
   * @param {Boolean} e.show - Whether to show or hide the error overlay.
   * @param {Object} e.opts - Options passed to the show method.
   */
  _onAppErrorUpdate(e){
    if ( e.show ) {
      this.show(e.opts);
    } else {
      this.hide();
    }
  }

  /**
   * @description Displays the error overlay with the provided error options.
   * @param {Object} opts - Options for displaying the error.
   * @param {Array} [opts.requests] - Array of failed request objects to format and display.
   * @param {String} [opts.message] - A plain error message string to display.
   * @param {String} [opts.heading] - Custom heading text; falls back to a default heading if omitted.
   */
  show(opts={}){
    this.style.display = 'block';
    document.body.style.overflow = 'hidden';
    if ( opts.requests ) {
      this.errors = opts.requests.map(error => this.formatError(error));
    } else if ( opts.message ) {
      this.errors = [this.formatError({errorMessage: opts.message})];
    } else {
      this.errors = [];
    }
    this.heading = opts.heading || this.getDefaultHeading();
  }

  /**
   * @description Hides the error overlay and restores normal page scrolling.
   */
  hide(){
    this.style.display = 'none';
    document.body.style.overflow = '';
  }

  /**
   * @description Returns a default heading string based on the number of current errors.
   * @returns {String} A heading describing the error situation.
   */
  getDefaultHeading(){
    if ( this.errors.length > 1 ){
      return 'Multiple errors occurred while loading the page';
    } else {
      return 'An error occurred while loading the page';
    }
  }

  /**
   * @description Normalises a raw error object into a display-ready structure.
   * @param {Object} error - The raw error object from a failed request or explicit message.
   * @param {String} [error.errorMessage] - A plain error message string.
   * @param {Object} [error.errorSettings] - Error settings object that may contain a message property.
   * @param {Object} [error.payload] - The error payload from the service response.
   * @returns {Object} A formatted error object with heading, url, statusCode, details, and showDetails fields.
   */
  formatError(error){
    const serviceError = error?.payload?.error || {};
    const url = serviceError?.response?.url;
    const statusCode = serviceError?.response?.status || '';

    const details = serviceError?.payload;
    const heading = error?.errorMessage ||
      error?.errorSettings?.message ||
      details?.message ||
      serviceError?.message ||
      'Unknown error';

    if ( details?.stack ){
      details.stack = details.stack.replaceAll('\n', '<br/>')
    }

    const out = {
      heading,
      url,
      showDetails: false,
      statusCode,
      details
    };



    return out;
  }

  /**
   * @description Toggles the visibility of the detail section for a given error object and requests a re-render.
   * @param {Object} error - The formatted error object whose details should be toggled.
   */
  toggleDetails(error){
    error.showDetails = !error.showDetails;
    this.requestUpdate();
  }

}

customElements.define('cork-app-error', CorkAppError);
