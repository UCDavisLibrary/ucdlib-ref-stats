import config from './app-config.js';

/**
 * @description Class for accessing properties of an access token for this client
 */
export default class AccessToken {
  static ADMIN_ROLE = 'admin-access';
  static MANAGER_ROLE = 'manager';
  static BASIC_ROLE = 'basic-access';
  static FORM_ROLE_PREFIX = 'form--';
  static FORM_MANAGER_ROLE_PREFIX = 'form-manager--';

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
    return this._inRoleList(AccessToken.BASIC_ROLE);
  }

  /**
   * @description Returns true if user has admin access to this client
   */
  get hasAdminAccess(){
    return this._inRoleList(AccessToken.ADMIN_ROLE);
  }

  /**
   * @description Returns true if user has at least manager access to this client
   */
  get hasManagerAccess(){
    if ( this.hasAdminAccess ) return true;
    return this._inRoleList(AccessToken.MANAGER_ROLE, 'resource');
  }

  /**
   * @description Returns true if user has manager-equivalent access for a specific form, either
   * globally (hasManagerAccess) or scoped to that form via a form-manager--<slug> role
   * @param {String} formName - The form's `name` (slug) to check
   * @returns {Boolean}
   */
  hasManagerAccessForForm(formName){
    return this.hasManagerAccess || this.formManagerForms.includes(formName);
  }

  /**
   * @description Returns list of form names for which user has access to this client
   */
  get forms(){
    return this.resourceAccessRoles.filter(r => r.startsWith(AccessToken.FORM_ROLE_PREFIX)).map(r => r.replace(AccessToken.FORM_ROLE_PREFIX, ''));
  }

  /**
   * @description Returns list of form names for which user has form-manager access to this client
   */
  get formManagerForms(){
    return this.resourceAccessRoles.filter(r => r.startsWith(AccessToken.FORM_MANAGER_ROLE_PREFIX)).map(r => r.replace(AccessToken.FORM_MANAGER_ROLE_PREFIX, ''));
  }

  /**
   * @description Returns the deduped union of forms with submit access and forms with form-manager
   * access, for populating nav/teaser lists of forms visible to the user
   */
  get visibleFormNames(){
    return [...new Set([...this.forms, ...this.formManagerForms])];
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
