import KcAdminClient from '@keycloak/keycloak-admin-client';
import config from './config.js';

const FORM_ROLE_PREFIX = 'form--';

/**
 * @description Wrapper around the Keycloak admin REST API for syncing student-assistant form
 * access. Has no knowledge of our own Postgres schema - callers pass in the exact target state.
 */
class KeycloakAdmin {

  /**
   * @description Authenticates a fresh KcAdminClient (password grant, admin-cli) and runs fn
   * with it. The client does not auto-refresh tokens, so a new authenticated client is created
   * per call rather than trying to track token expiry - cheap for this low-frequency admin action.
   * @param {Function} fn - async (client) => result
   * @returns {Object} {res: <fn's return value>} or {error}
   */
  async _withAuth(fn) {
    const client = new KcAdminClient({
      baseUrl: config.auth.keycloakJsClient.url,
      realmName: config.auth.keycloakJsClient.realm
    });
    try {
      await client.auth({
        username: config.keycloakAdmin.user,
        password: config.keycloakAdmin.password,
        grantType: 'password',
        clientId: 'admin-cli'
      });
      return { res: await fn(client) };
    } catch (error) {
      return { error };
    }
  }

  /**
   * @description Resolves and caches the internal Keycloak client UUID for ref-stats-client.
   * @param {KcAdminClient} client - Authenticated client
   * @returns {String} The client's internal UUID
   */
  async _getClientUniqueId(client) {
    if ( this._clientUniqueId ) return this._clientUniqueId;
    const clients = await client.clients.find({ clientId: config.auth.keycloakJsClient.clientId });
    this._clientUniqueId = clients?.[0]?.id;
    return this._clientUniqueId;
  }

  /**
   * @description Ensures a Keycloak account exists for userId (creating one linked to the
   * cas-oidc identity provider if missing and formNames is non-empty) and syncs their
   * form--<slug> client roles on ref-stats-client to match formNames exactly. An empty
   * formNames removes all form roles and, if they now have no groups or other direct roles,
   * deletes the account entirely.
   * @param {Object} opts
   * @param {String} opts.userId
   * @param {String[]} opts.formNames - Exact set of form slugs the user should have access to
   * @returns {Object} {res: {added, removed, created, deleted}} or {error}
   */
  async syncFormAccess({ userId, formNames }) {
    return this._withAuth(async (client) => {
      let [kcUser] = await client.users.find({ username: userId, exact: true });
      let created = false;

      if ( !kcUser && formNames.length ) {
        const result = await client.users.create({
          username: userId,
          emailVerified: true,
          enabled: true,
          federatedIdentities: [{ identityProvider: 'cas-oidc', userId, userName: userId }]
        });
        kcUser = { id: result.id };
        created = true;
      }

      if ( !kcUser ) return { added: 0, removed: 0, created: false, deleted: false };

      const clientUniqueId = await this._getClientUniqueId(client);
      const currentRoles = (await client.users.listClientRoleMappings({ id: kcUser.id, clientUniqueId }))
        .filter(r => r.name.startsWith(FORM_ROLE_PREFIX));
      const currentFormNames = currentRoles.map(r => r.name.slice(FORM_ROLE_PREFIX.length));

      const toAddNames = formNames.filter(n => !currentFormNames.includes(n));
      const toRemove = currentRoles.filter(r => !formNames.includes(r.name.slice(FORM_ROLE_PREFIX.length)));

      if ( toAddNames.length ) {
        const roles = await Promise.all(toAddNames.map(n => client.clients.findRole({ id: clientUniqueId, roleName: `${FORM_ROLE_PREFIX}${n}` })));
        const missingIdx = roles.findIndex(r => !r);
        if ( missingIdx !== -1 ) throw new Error(`Keycloak client role not found: ${FORM_ROLE_PREFIX}${toAddNames[missingIdx]}`);
        await client.users.addClientRoleMappings({ id: kcUser.id, clientUniqueId, roles: roles.map(r => ({ id: r.id, name: r.name })) });
      }
      if ( toRemove.length ) {
        await client.users.delClientRoleMappings({ id: kcUser.id, clientUniqueId, roles: toRemove.map(r => ({ id: r.id, name: r.name })) });
      }

      let deleted = false;
      if ( !formNames.length ) {
        deleted = await this._maybeDeleteUser(client, kcUser.id);
      }

      return { added: toAddNames.length, removed: toRemove.length, created, deleted };
    });
  }

  /**
   * @description Deletes a Keycloak user only if they have no group memberships and no direct
   * realm or client roles (excluding the automatic default-roles-<realm> composite every user
   * gets). Assumes the caller has already removed all form--<slug> roles.
   * @param {KcAdminClient} client - Authenticated client
   * @param {String} kcUserId - Keycloak internal user UUID
   * @returns {Boolean} true if the user was deleted
   */
  async _maybeDeleteUser(client, kcUserId) {
    const groups = await client.users.listGroups({ id: kcUserId });
    if ( groups.length ) return false;

    const mappings = await client.users.listRoleMappings({ id: kcUserId });
    const realmName = config.auth.keycloakJsClient.realm;
    const realmRoles = (mappings.realmMappings || []).filter(r => r.name !== `default-roles-${realmName}`);
    if ( realmRoles.length ) return false;

    const hasClientRoles = Object.values(mappings.clientMappings || {}).some(cm => (cm.mappings || []).length);
    if ( hasClientRoles ) return false;

    await client.users.del({ id: kcUserId });
    return true;
  }
}

export default new KeycloakAdmin();
