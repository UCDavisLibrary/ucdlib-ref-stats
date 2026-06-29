import config from './app-config.js';

/**
 * @description Class for accessing properties of an access token for this client
 */
export default class AccessToken {
  constructor(token, client){
    this.token = token || {};
    this.client = client || config.auth?.clientInit?.clientId;
    this.isEmpty = Object.keys(this.token).length == 0;
  }

  /**
   * @description Returns true if user has access to this client
   */
  get hasAccess(){
    if ( this.hasAdminAccess ) return true;
    if ( this.hasBasicAccess ) return true;
    if ( this.resourceAccessRoles.length ) return true;
    return false;
  }

  /**
   * @description Returns true if user has basic access to this client
   */
  get hasBasicAccess(){
    return this._inRoleList('basic-access');
  }

  /**
   * @description Returns true if user has admin access to this client
   */
  get hasAdminAccess(){
    return this._inRoleList('admin-access');
  }

  /**
   * @description Returns true if user has at least manager access to this client
   */
  get hasManagerAccess(){
    if ( this.hasAdminAccess ) return true;
    return this._inRoleList('manager', 'resource');
  }

  /**
   * @description Returns list of form names for which user has access to this client
   */
  get forms(){
    return this.resourceAccessRoles.filter(r => r.startsWith('form--')).map(r => r.replace('form--', ''));
  }

  /**
   * @description Returns list of roles assigned to user for this client
   */
  get resourceAccessRoles(){
    return this.token.resource_access?.[this.client]?.roles || [];
  }

  /**
   * @description Returns list of roles assigned to user for this realm
   */
  get realmAccessRoles(){
    return this.token.realm_access?.roles || [];
  }


  /**
   * @description Returns first name of logged in user
   */
  get firstName(){
    return this.token.given_name || '';
  }

  /**
   * @description Returns last name of logged in user
   */
  get lastName(){
    return this.token.family_name || '';
  }

  /**
   * @description Returns username (kerberos) of logged in user
   */
  get id(){
    return this.token.preferred_username || '';
  }

  /**
   * @description Returns UCD IAM ID logged in user
   */
  get iamId(){
    return this.token.iamId || '';
  }

  /**
   * @description Returns email of logged in user
   */
  get email(){
    return this.token.email || '';
  }

  /**
   * @description Check if user has a role, either assigned to the realm or to this client
   * @param {String} role - The role to check for
   * @param {Array|String} accessType - The role location. Can be 'realm', 'resource', or both.
   * @returns
   */
  _inRoleList(role, accessType=['realm', 'resource']){
    if ( typeof accessType === 'string') accessType = [accessType];

    if ( accessType.includes('realm') && this.realmAccessRoles.includes(role) ) return true;

    if ( accessType.includes('resource') && this.resourceAccessRoles.includes(role) ) return true;

    return false;
  }
}
