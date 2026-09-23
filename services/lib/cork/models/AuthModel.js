import {BaseModel} from '@ucd-lib/cork-app-utils';
import AuthStore from '../stores/AuthStore.js';
import AuthService from '../services/AuthService.js';
import config from '../../app-config.js';
import payload from '../utils/payload.js';

import Keycloak from 'keycloak-js';
import { html } from 'lit';

/**
 * @description Model for handling authentication against keycloak
 */
class AuthModel extends BaseModel {

  constructor() {
    super();

    this.store = AuthStore;
    this.service = AuthService;

    // Lifespan of client access token entered in keycloak
    this.tokenRefreshRate = 300;

    // Interval for checking if user still has an active session
    this.loginCheckRefreshRate = 10 * 60 * 1000;

    this.silentCheckSsoRedirectUri = 'silent-check-sso.html';
    this.loginCheckInterval = null;

    // Minutes-before-deadline threshold for the one-time "session expiring soon" warning
    this.sessionWarningThresholdMs = 5 * 60 * 1000;

    // How often to check elapsed-time-to-deadline (separate from the token refresh interval
    // above — needs tighter granularity so the warning fires reliably close to the threshold)
    this.sessionWarningCheckRate = 60 * 1000;

    this.sessionWarningInterval = null;
    this.sessionDeadlineTimeout = null;
    this._sessionWarningShown = false;

    this.register('AuthModel');

    this.inject('AppStateModel');
  }

  get client(){
    return config.auth?.keycloakClient;
  }

  /**
   * @description Returns current user data from library IAM API
   */
  get userData(){
    const d = this.store.data.user.get(payload.getKey({action: 'user-data'}));
    return d?.payload?.userData;
  }

  /**
   * @description Returns the department of the current user from library IAM API
   * @returns {Object} - group object from library IAM API
   */
  get userDepartment(){
    return this.userData?.groups?.find(g => g.partOfOrg);
  }

  /**
   * @description User is not manager/admin or a department head
   */
  get isBasicUser(){
    if ( this.token.hasManagerAccess ) return false;
    return !this.userIsAGroupHead;
  }

  /**
   * @description Checks if the current user is in a specific group
   * @param {String|Array} groupId - Group ID or array of group IDs to check
   * @returns {Boolean}
   */
  userIsInGroup(groupId){
    if ( !Array.isArray(groupId) ) groupId = [groupId];
    groupId = groupId.map(Number);
    return this.userData?.groups?.some(g => groupId.includes(g.id));
  }

  /**
   * @description Checks if the current user is a group head for any group
   * @returns {Boolean}
   */
  get userIsAGroupHead(){
    return this.userData?.groups?.some(g => g.isHead);
  }

  /**
   * @description Initializes the keycloak client and sets up listeners for auth events.
   * @param {Array} mainAppElementDefinition - Args to pass to customElements.define for the main app element after successful auth
   * @returns
   */
  async init(mainAppElementDefinition){
    if ( this._init ) return;
    const neededKcParams = ['url', 'realm', 'clientId'];
    for ( const param of neededKcParams ) {
      if ( !config.auth?.clientInit?.[param] ) {
        throw new Error(`Missing keycloakClient config param: ${param}`);
      }
    }
    config.auth.keycloakClient = new Keycloak({...config.auth.clientInit, checkLoginIframe: true});

    // set up listeners keycloak listeners
    this.client.onAuthRefreshError = () => {this.logout();};
    this.client.onAuthError = () => {this.redirectUnauthorized();};
    this.client.onAuthSuccess = async () => {
      const r = await this.setTokenServerCache();
      customElements.define(...mainAppElementDefinition);

      if ( this.loginCheckInterval ) {
        clearInterval(this.loginCheckInterval);
      }
      this.loginCheckInterval = setInterval(async () => {
        try {
          await this.client.updateToken(this.tokenRefreshRate);
        } catch (e) {
          this.logout();
        }
      }, this.loginCheckRefreshRate );

      this._onAuthRefreshSuccess();

      if ( this.sessionWarningInterval ) clearInterval(this.sessionWarningInterval);
      if ( this.sessionDeadlineTimeout ) clearTimeout(this.sessionDeadlineTimeout);
      this._sessionWarningShown = false;
      this._scheduleSessionExpiration();
    };
    this.client.onAuthRefreshSuccess = () => {this._onAuthRefreshSuccess();};

    // initialize auth
    await this.client.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/${this.silentCheckSsoRedirectUri}`,
      scope: config.auth?.oidcScope || 'openid profile email ucd-ids'
    });
    if ( !this.client.authenticated) {
      await this.client.login();
    }

    this._init = true;

  }

  setTokenServerCache(){
    return this.service.cacheToken();
  }

  /**
   * @description Logs user out of application
   */
   async logout(){
    if ( this.sessionWarningInterval ) clearInterval(this.sessionWarningInterval);
    if ( this.sessionDeadlineTimeout ) clearTimeout(this.sessionDeadlineTimeout);
    await this.clearTokenServerCache();
    const redirectUri = window.location.origin + '/logged-out.html';
    try {
      this.client.logout({redirectUri});
    } catch (e) {
      window.location = redirectUri;
    }
  }

  /**
   * @description Returns the Unix timestamp (seconds) of the original authentication that
   * started the current SSO session (see AccessToken.authTime).
   * @returns {Number|undefined}
   */
  get authTime(){
    return this.token?.authTime;
  }

  /**
   * @description Returns the absolute timestamp (ms since epoch) at which the current SSO
   * session will hit the realm's SSO Session Max, computed from authTime (preserved across
   * refreshes) plus the configured session max. Null if either is unavailable.
   */
  get sessionExpiresAt(){
    const authTime = this.authTime;
    const maxSeconds = config.auth?.ssoSessionMaxSeconds;
    if ( !authTime || !maxSeconds ) return null;
    return (authTime + maxSeconds) * 1000;
  }

  /**
   * @description Starts the periodic check for how close the current SSO session is to its
   * absolute deadline (authTime + ssoSessionMaxSeconds), and schedules a hard logout to fire
   * precisely at that deadline rather than waiting for the next background token refresh to fail.
   */
  _scheduleSessionExpiration(){
    const expiresAt = this.sessionExpiresAt;
    if ( !expiresAt ) return;

    const msUntilDeadline = expiresAt - Date.now();
    if ( msUntilDeadline <= 0 ) {
      this.logout();
      return;
    }

    this.sessionDeadlineTimeout = setTimeout(() => this.logout(), msUntilDeadline);

    this.sessionWarningInterval = setInterval(() => this._checkSessionWarning(), this.sessionWarningCheckRate);
    this._checkSessionWarning();
  }

  /**
   * @description Checks how much time remains until the SSO session's absolute deadline and
   * shows the "Renew Session" dialog once, the first time the warning threshold is crossed.
   */
  _checkSessionWarning(){
    if ( this._sessionWarningShown ) return;
    const expiresAt = this.sessionExpiresAt;
    if ( !expiresAt ) return;
    if ( expiresAt - Date.now() > this.sessionWarningThresholdMs ) return;

    this._sessionWarningShown = true;
    this.showSessionExpirationDialog(true);
  }

  /**
   * @description Shows a dialog warning the user that their SSO session is about to expire, with
   * an option to renew it. The dialog's content is a live-updating <cork-sso-warning>
   * component (reads AuthModel.authTime itself to render its own countdown) rather than static
   * text, so the displayed time-remaining stays accurate for as long as the dialog stays open.
   */
  showSessionExpirationDialog(fromAuthModel=false){
    this.AppStateModel?.showDialogModal({
      title: 'Session Expiring Soon',
      content: () => html`<cork-sso-warning></cork-sso-warning>`,
      actions: [
        {text: 'Dismiss', value: 'dismiss-renew-session', invert: true, color: 'secondary', customDismissAction: true},
        {text: 'Renew Session', color: 'secondary', value: 'renew-session'}
      ],
      data: {fromAuthModel},
      actionCallback: (actionValue) => {
        if ( actionValue === 'renew-session' ) this._onRenewSession();
      }
    });
  }

  /**
   * @description Renews the SSO session by forcing Keycloak to actively re-authenticate
   * A full page reload is required
   */
  _onRenewSession(){
    let redirectUri = new URL(window.location.href);
    redirectUri.searchParams.delete('renew-sso-session');
    this.client.login({maxAge: 1, redirectUri: redirectUri.href});
  }

  /**
   * @description Send user to "unauthorized" page
   */
  redirectUnauthorized(){
    window.location = window.location.origin + '/unauthorized.html';
  }

  /**
   * @description Returns access token of logged in user
   * @returns {AccessToken}
   */
  get token(){
    return this.store.token;
  }

  /**
   * @description Returns true if user is the current logged in user
   * @param {String} kerb - kerberos id
   * @returns {Boolean}
   */
  isCurrentUser(kerb){
    return this.token.token.preferred_username == kerb;
  }

  /**
   * @description Returns true if logged in user would like to log out
   * @param {Object} location - location object from AppStateStore
   * @returns {Boolean}
   */
  logOutRequested(location){
    if ( location?.path?.[0] === 'logout' ) {
      return true;
    }
    return false;
  }

  /**
   * @description Clears server cache of user's access token
   * @returns
   */
  async clearTokenServerCache(){
    return this.service.clearTokenServerCache();
  }

  /**
   * @description Fires when a token has been successfully refreshed
   */
  _onAuthRefreshSuccess(){
    this.store.setToken(this.client.tokenParsed);
    if ( !this.store.token.hasAccess ){
      this.redirectUnauthorized();
    }
  }

  /**
   * @description Logs user out if access token fails to refresh (their session expired)
   */
   _onAuthRefreshError(){
    this.logout();
  }

}

const model = new AuthModel();
export default model;
