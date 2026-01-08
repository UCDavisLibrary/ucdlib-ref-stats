import { styleMap } from 'lit/directives/style-map.js';

/**
 * @typedef {Object} DropdownControllerOptions
 * @property {Number} hostFocusOutTime - Time in ms to wait before closing dropdown on host focus out. Default is 100ms.
 * @property {Number} defaultMaxHeight - Default max height of the dropdown in pixels. Default is 300px.
 * @property {Object} openCustomStyles - Custom styles to apply to the dropdown when open.
 * @property {Object} belowCustomStyles - Custom styles to apply to the dropdown when opened below the host.
 * @property {Object} aboveCustomStyles - Custom styles to apply to the dropdown when opened above the host.
 * @property {Number} spaceBuffer - Space in pixels to leave between the dropdown and the edge of the viewport. Default is 20px.
 * @property {String} arrowStepSelector - CSS selector for buttons within the dropdown to step through on up/down arrow key press.
 */

/**
 * @description Controller to manage custom dropdown positioning and visibility
 * @property {Boolean} open - Whether the dropdown is open
 * @property {Object} styles - The computed styles for the dropdown based on its open state and position
 * @property {Object} styleMap - The styleMap directive for the dropdown styles
 * @param {LitElement} host The host element the controller is attached to
 * @param {DropdownControllerOptions} opts Options for configuring the dropdown behavior
 */
export default class DropdownController {

  constructor(host, opts={}) {
    this.host = host;
    host.addController(this);

    this._open = false;

    // options
    this.hostFocusOutTime = opts.hostFocusOutTime || 100;
    this.defaultMaxHeight = opts.defaultMaxHeight || 300;
    this.openCustomStyles = opts.openCustomStyles || {};
    this.belowCustomStyles = opts.belowCustomStyles || {};
    this.aboveCustomStyles = opts.aboveCustomStyles || {};
    this.spaceBuffer = opts.spaceBuffer || 20;
    this.arrowStepSelector = opts.arrowStepSelector || null;

    // bind listeners
    this._onWindowResize = this._onWindowResize.bind(this);
    this._onHostFocusOut = this._onHostFocusOut.bind(this);
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  set open(value) {
    if ( !value ) value = false;
    if ( value ) value = true;
    if ( this._open === value ) return;
    this._open = value;
    this.host.requestUpdate();
  }

  get open() {
    return this._open;
  }

  get styles() {
    if ( !this.open ) return { display: 'none' };
    const hostRect = this.host.getBoundingClientRect();
    let styles = {
      maxWidth: `${hostRect.width}px`,
      display: 'block',
      position: 'absolute',
      zIndex: 10,
      width: '100%',
      ...this.openCustomStyles
    };

    const availableHeightBelow = Math.round(window.innerHeight - hostRect.bottom - this.spaceBuffer);
    if ( availableHeightBelow > 100 ) {
      styles.maxHeight = availableHeightBelow < this.defaultMaxHeight ? `${availableHeightBelow}px` : `${this.defaultMaxHeight}px`;
      Object.assign( styles, this.belowCustomStyles );
    } else {
      const availableHeightAbove = hostRect.top - this.spaceBuffer;
      styles.maxHeight = availableHeightAbove < this.defaultMaxHeight ? `${availableHeightAbove}px` : `${this.defaultMaxHeight}px`;
      styles.bottom = `${hostRect.height}px`;
      delete styles.top;
      Object.assign( styles, this.aboveCustomStyles );
    }

    return styles;
  }

  get styleMap() {
    return styleMap( this.styles );
  }

  _onWindowResize(){
    this.open = false;
  }

  _onKeyDown(e) {
    this.focusOnArrowKey(e);
    if ( e.key === 'Escape' && this.open ) {
      this.open = false;
    }
  }

  /**
   * @description Cycle focus through suggestion items on up/down arrow key press
   */
  focusOnArrowKey(e){
    if ( !this.arrowStepSelector || !this.open ) return;
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const activeElement = this.host?.renderRoot?.activeElement || document.activeElement;
    const suggestionButtons = this.host.renderRoot.querySelectorAll(this.arrowStepSelector);
    if ( suggestionButtons.length === 0 ) return;
    let focusedIndex = -1;
    suggestionButtons.forEach((btn, i) => {
      if ( activeElement === btn ) {
        focusedIndex = i;
      }
    });
    e.preventDefault();
    if ( e.key === 'ArrowDown' ) {
      focusedIndex = (focusedIndex + 1) % suggestionButtons.length;
    } else if ( e.key === 'ArrowUp' ) {
      focusedIndex = (focusedIndex - 1 + suggestionButtons.length) % suggestionButtons.length;
    }
    suggestionButtons[focusedIndex].focus();
  }

  _onHostFocusOut(){
    setTimeout(() => {
      if ( !this.open ) return;

      // if shadow root is focused, do not close
      if ( this.host.shadowRoot ){
        this.open = !!this.host.renderRoot.activeElement;
        return;
      }

      // shadow dom is disabled, check if focus is still within host
      if ( document.activeElement && this.host.contains(document.activeElement) ) {
        return;
      }
      this.open = false;

    }, this.hostFocusOutTime);
  }

  hostConnected() {
    window.addEventListener('resize', this._onWindowResize);
    document.addEventListener('keydown', this._onKeyDown);
    this.host.addEventListener('focusout', this._onHostFocusOut);
    this.host.style.position = 'relative';
  }

  hostDisconnected() {
    window.removeEventListener('resize', this._onWindowResize);
    document.removeEventListener('keydown', this._onKeyDown);
    this.host.removeEventListener('focusout', this._onHostFocusOut);
  }

}