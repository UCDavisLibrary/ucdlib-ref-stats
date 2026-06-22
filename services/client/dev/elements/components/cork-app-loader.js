import { LitElement } from 'lit';
import { render, styles } from "./cork-app-loader.tpl.js";
import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';

/**
 * @description Displays a full-screen loading overlay with fade-in and fade-out animations.
 * Listens for AppStateModel loading events and prevents page interaction while visible.
 * @property {Number} fadeInDuration - Duration in milliseconds for the fade-in animation.
 * @property {Number} fadeOutDuration - Duration in milliseconds for the fade-out animation.
 * @property {Boolean} isDisplayed - Whether the loading overlay is currently visible.
 * @property {Promise} _showPromise - Internal promise tracking an in-progress show animation.
 * @property {Promise} _hidePromise - Internal promise tracking an in-progress hide animation.
 */
export default class CorkAppLoader extends Mixin(LitElement)
  .with(LitCorkUtils) {

  static get properties() {
    return {
      fadeInDuration: {type: Number},
      fadeOutDuration: {type: Number},
      isDisplayed: {type: Boolean},
      _showPromise: {state: true},
      _hidePromise: {state: true}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.fadeInDuration = 1;
    this.fadeOutDuration = 250;

    this._injectModel('AppStateModel');
  }

  /**
   * @description Listener for AppStateModel loading update events. Shows or hides the loading overlay.
   * @param {Object} e - The event object from AppStateModel.
   * @param {Boolean} e.show - Whether to show or hide the loading overlay.
   */
  _onAppLoadingUpdate(e) {
    if (e.show) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * @description Public method to show the loading overlay. Waits for any active hide animation to finish first.
   * No-ops if a show is already in progress or the overlay is already displayed.
   * @param {Object} opts - Options (currently unused; reserved for future use).
   */
  async show(opts={}) {
    if ( this._showPromise || this.isDisplayed ) return;
    if ( this._hidePromise ) await this._hidePromise;
    this._showPromise = this._show(opts);
  }

  /**
   * @description Public method to hide the loading overlay. Waits for any active show animation to finish first.
   * No-ops if a hide is already in progress or the overlay is not currently displayed.
   * @param {Object} opts - Options (currently unused; reserved for future use).
   */
  async hide(opts={}) {
    if ( this._hidePromise ) return;
    if ( this._showPromise ) {
      await this._showPromise;
    } else if ( !this.isDisplayed ) {
      return;
    }
    this._hidePromise = this._hide(opts);
  }

  /**
   * @description Internal implementation that performs the fade-in animation and sets the overlay as displayed.
   */
  async _show(){
    this.style.opacity = 0;
    this.style.display = 'block';
    this.style.height = '100vh';
    document.body.style.overflow = 'hidden';
    const animation = this.animate([
      {opacity: 0},
      {opacity: 1}
    ], {
      duration: this.fadeInDuration,
      easing: 'ease-in-out'
    });
    await animation.finished;
    this.style.opacity = 1;
    this._showPromise = null;
    this.isDisplayed = true;
  }

  /**
   * @description Internal implementation that performs the fade-out animation and hides the overlay.
   */
  async _hide(){
    this.style.opacity = 1;
    const animation = this.animate([
      {opacity: 1},
      {opacity: 0}
    ], {
      duration: this.fadeOutDuration,
      easing: 'ease-in-out'
    });
    await animation.finished;
    this.style.opacity = 0;
    this.style.display = 'none';
    this.style.height = '0';
    document.body.style.overflow = '';
    this._hidePromise = null;
    this.isDisplayed = false;
  }

}

customElements.define('cork-app-loader', CorkAppLoader);
