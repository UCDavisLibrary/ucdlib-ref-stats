import {BaseModel} from '@ucd-lib/cork-app-utils';
import AuthStore from '../stores/AuthStore.js';
import AuthService from '../services/AuthService.js';
import config from '../../app-config.js';
import payload from '../utils/payload.js';

import Keycloak from 'keycloak-js';

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

    this.register('AuthModel');
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
    await this.clearTokenServerCache();
    const redirectUri = window.location.origin + '/logged-out.html';
    try {
      this.client.logout({redirectUri});
    } catch (e) {
      window.location = redirectUri;
    }
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
