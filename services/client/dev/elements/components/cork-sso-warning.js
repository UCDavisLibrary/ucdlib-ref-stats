import { LitElement } from 'lit';
import { render, styles } from "./cork-sso-warning.tpl.js";
import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';

/**
 * @description Dialog content shown by AuthModel when the current SSO session is nearing its
 * absolute deadline. Runs its own interval to display a live, ticking countdown read from
 * AuthModel.authTime, independent of the dialog's own re-render cycle.
 * @property {Number} secondsRemaining - Seconds until the session's computed hard deadline
 */
export default class CorkSsoWarning extends Mixin(LitElement)
  .with(LitCorkUtils) {

  static get properties() {
    return {
      secondsRemaining: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.secondsRemaining = 0;
    this.checkRate = 1000;
    this._interval = null;

    this._injectModel('AuthModel');
  }

  connectedCallback(){
    super.connectedCallback();
    this._interval = setInterval(() => this._tick(), this.checkRate);
    this._tick();
  }

  disconnectedCallback(){
    super.disconnectedCallback();
    if ( this._interval ) clearInterval(this._interval);
  }

  /**
   * @description Recomputes secondsRemaining from AuthModel.authTime and the configured SSO
   * session max, for display only — AuthModel independently owns the actual hard-logout timing.
   */
  _tick(){
    const expiresAt = this.AuthModel.sessionExpiresAt;
    this.secondsRemaining = expiresAt ? Math.max(0, Math.round((expiresAt - Date.now()) / 1000)) : 0;
  }

}

customElements.define('cork-sso-warning', CorkSsoWarning);
