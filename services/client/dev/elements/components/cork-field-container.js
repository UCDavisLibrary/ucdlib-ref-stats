import { LitElement } from 'lit';
import { render } from "./cork-field-container.tpl.js";
import { Mixin, MainDomElement } from '@ucd-lib/theme-elements/utils/mixins/index.js';
import { LitCorkUtils } from '@ucd-lib/cork-app-utils';

import IdGenerator from '../../utils/IdGenerator.js';

/**
 * @description A container element for form fields with built-in validation handling.
 * Listens for validation events from the ValidationModel and displays errors for its child input elements.
 * @property {String} schema - The schema name to listen for validation events.
 * @property {String} path - The specific path within the schema to validate.
 * @property {Boolean} invalid - Reflects whether the field container has validation errors.
 * @property {Boolean} disableResetOnInput - If true, errors won't be cleared on input events.
 * @property {Array} errors - An array of validation error objects related to the field specified by 'schema' and 'path'.
 */
export default class CorkFieldContainer extends Mixin(LitElement)
  .with(MainDomElement, LitCorkUtils) {

  static get properties() {
    return {
      schema: { type: String },
      path: { type: String },
      invalid: { type: Boolean, reflect: true },
      disableResetOnInput: { type: Boolean, attribute: 'disable-reset-on-input' },
      errors: { type: Array }
    }
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.schema = null;
    this.path = null;
    this.errors = [];
    this.invalid = false;
    this.disableResetOnInput = false;

    this.idGen = new IdGenerator();

    this._injectModel('ValidationModel');
  }

  /**
   * @description Custom element lifecycle method called when the element is added to the DOM.
   */
  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('input', this._onInput.bind(this));
  }

  /**
   * @description Custom element lifecycle method called when the element is removed from the DOM.
   */
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('input', this._onInput.bind(this));
  }

  /**
   * @description Lit lifecycle method called before the element updates.
   * @param {Map} props - Map of changed properties and their previous values.
   */
  willUpdate(props){
    if ( props.has('errors') ){
      this.invalid = !!this.errors.length;
      if ( this.invalid ) {
        this.dispatchEvent(new CustomEvent('cork-field-invalid', { detail: { errors: this.errors, schema: this.schema, path: this.path }, bubbles: true, composed: true }));
      }
      this.updateAriaAttributes();
    }
  }

  /**
   * @description Updates the ARIA attributes for the input elements depending on validation status.
   */
  updateAriaAttributes() {
    const inputs = this.querySelectorAll('input, select, textarea');
    for ( const input of Array.from(inputs) ) {
      if ( this.invalid ) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-errormessage', this.idGen.get('errors'));
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-errormessage');
      }
    }
  }

  /**
   * @description Listener for any input events
   * @param {*} e
   * @returns
   */
  _onInput(e) {
    if ( this.disableResetOnInput ) return;
    this.errors = [];
  }

  /**
   * @description Listener for validation success events from the ValidationModel
   * @param {Object} e - The event object
   * @param {String} e.schema - The schema name associated with the validation event
   * @returns
   */
  _onValidationSuccess(e) {
    if ( e.schema !== this.schema ) return;
    this.errors = [];
  }

  /**
   * @description Listener for validation error events from the ValidationModel
   * @param {Object} e - The event object
   * @param {String} e.schema - The schema name associated with the validation event
   * @param {Object} e.payload - The response from the server
   * @param {Array} e.payload.errors - An array of validation error objects from Zod
   * @returns
   */
  _onValidationError(e) {
    if ( e.schema !== this.schema ) return;
    if ( !Array.isArray(e?.payload?.errors) ){
      this.logger.warn('Validation error payload missing errors array');
      return;
    }
    const errors = [];
    for ( let err of e.payload.errors ) {
      err = { ...err };
      if ( err.path.join('.') === this.path ) {
        errors.push(err);
      }
    }
    this.errors = errors;
  }

}

customElements.define('cork-field-container', CorkFieldContainer);
